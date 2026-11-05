"""校验独立场景接入、逐机参数、部分失败及输出几何。"""

from copy import deepcopy
import json
import math
import os
import unittest

os.environ.setdefault("MPLBACKEND", "Agg")

from planner import hybrid_astar as motion
from planner import mission_service as service
import run_planner


def small_scene():
    return {
        "version": 1,
        "name": "接入测试",
        "world": {"min": -500.0, "max": 1000.0},
        "sweep": {
            "center": [300.0, 300.0],
            "size": 100.0,
            "spacing": 50.0,
            "altitude": 2000.0,
            "orientation": "auto",
        },
        "defaults": {
            "speed": 20.0,
            "min_turn_radius": 15.0,
            "climb_rate": 10.0,
            "obstacle_margin": 1.0,
            "layer_hold_time": 2.0,
        },
        "aircraft": [
            {
                "id": "a",
                "name": "甲机",
                "x": 0.0,
                "y": 0.0,
                "heading_deg": -45.0,
                "altitude": 2000.0,
                "enabled": True,
                "overrides": {},
            }
        ],
        "obstacles": [],
        "sampling": {"preset": "custom", "sample_step": 2.0, "max_arc_angle_deg": 7.5},
        "search": {"timeout_s": 2.0, "max_expansions": 10000, "shortcut_attempts": 30},
        "assignment": "distance",
    }


class SceneValidationTests(unittest.TestCase):
    def test_normalization_is_independent_and_preserves_overrides(self):
        scene = small_scene()
        scene["aircraft"][0]["overrides"] = {"speed": 35.0, "climb_rate": 5.0}
        original = deepcopy(scene)
        normalized = service.normalize_scene(scene)
        parameters = service._resolved_parameters(normalized, normalized["aircraft"][0])
        self.assertEqual(parameters["speed"], 35.0)
        self.assertEqual(parameters["climb_rate"], 5.0)
        self.assertEqual(parameters["min_turn_radius"], 15.0)
        self.assertEqual(scene, original)
        normalized["aircraft"][0]["overrides"]["speed"] = 99
        self.assertEqual(scene, original)
        self.assertEqual(json.loads(json.dumps(normalized)), normalized)

    def test_invalid_types_nonfinite_and_workload_are_rejected(self):
        for field, value in (
            ("speed", False),
            ("speed", "20"),
            ("climb_rate", 0),
            ("min_turn_radius", math.inf),
            ("obstacle_margin", -1),
        ):
            scene = small_scene()
            scene["defaults"][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                service.normalize_scene(scene)
        for mutation in (
            lambda scene: scene.update(version=True),
            lambda scene: scene["aircraft"][0].update(x=math.nan),
            lambda scene: scene["aircraft"][0].update(enabled="yes"),
            lambda scene: scene["sampling"].update(preset=[]),
            lambda scene: scene["search"].update(max_expansions=True),
            lambda scene: scene["search"].update(timeout_s=31),
            lambda scene: scene["sweep"].update(spacing=0.001),
            lambda scene: scene.update(aircraft=scene["aircraft"] * 31),
            lambda scene: scene.update(obstacles=[{}] * 101),
        ):
            scene = small_scene()
            mutation(scene)
            with self.assertRaises(ValueError):
                service.normalize_scene(scene)

    def test_polygon_validity_and_rectangle_angles(self):
        scene = small_scene()
        scene["obstacles"] = [
            {
                "id": "poly",
                "type": "polygon",
                "vertices": [[0, 0], [10, 10], [0, 10], [10, 0]],
            }
        ]
        with self.assertRaisesRegex(ValueError, "不自交"):
            service.normalize_scene(scene)
        scene["obstacles"] = [
            {
                "id": "poly",
                "type": "polygon",
                "vertices": [[0, 0], [10, 0], [0, 10], [0, 0]],
            },
            {
                "id": "rect",
                "type": "rectangle",
                "center": [0, 0],
                "width": 5,
                "height": 10,
                "rotation_deg": -30,
            },
        ]
        normalized = service.normalize_scene(scene)
        self.assertEqual(len(normalized["obstacles"][0]["vertices"]), 3)
        self.assertEqual(normalized["obstacles"][1]["rotation_deg"], -30.0)

    def test_presets_are_fresh_and_sampling_names_match_the_page(self):
        first = service.scene_presets()
        self.assertGreaterEqual(len(first), 4)
        for preset in first:
            service.normalize_scene(preset["scene"])
        first[0]["scene"]["aircraft"][0]["x"] = -999
        self.assertNotEqual(
            service.scene_presets()[0]["scene"]["aircraft"][0]["x"], -999
        )
        for preset, expected in (
            ("fine", (60.0, 3.0)),
            ("standard", (150.0, 7.5)),
            ("sparse", (400.0, 12.0)),
        ):
            scene = small_scene()
            scene["sampling"] = {"preset": preset}
            sampling = service.normalize_scene(scene)["sampling"]
            self.assertEqual(
                (sampling["sample_step"], sampling["max_arc_angle_deg"]), expected
            )

    def test_existing_failure_messages_are_translated_without_new_attribution(self):
        cases = (
            (
                "Search time limit reached; feasibility is undetermined",
                "search_timeout",
            ),
            ("Expansion limit reached; feasibility is undetermined", "search_limit"),
            (
                "Search exhausted at this map/discretization; feasibility is undetermined",
                "search_exhausted",
            ),
            (
                "Sweep line intersects an inflated obstacle or map boundary.",
                "sweep_collision",
            ),
            (
                "No sweep order satisfies mandatory straight height-transition legs, outside turns, obstacles, and map boundaries.",
                "sweep_order_failed",
            ),
        )
        for source, code in cases:
            error = service.map_planning_error(RuntimeError(source), "sweep")
            self.assertEqual(error["code"], code)
            self.assertEqual(error["stage"], "sweep")
            self.assertTrue(
                any("\u4e00" <= char <= "\u9fff" for char in error["message"])
            )
            self.assertNotIn("无解", error["message"])
            self.assertNotIn("不可达", error["message"])
            self.assertEqual(error["details"], {})
        error = service.map_planning_error(
            ValueError(
                "Initial approach has 12.000m outside the sweep area; needs at least 20.000m to reach target altitude"
            ),
            "altitude",
        )
        self.assertEqual(
            error["details"],
            {"available_distance_m": 12.0, "required_distance_m": 20.0},
        )


class MissionPlanningTests(unittest.TestCase):
    def assert_motion_constraints(self, result):
        scene = result["scene"]
        aircraft_by_id = {item["id"]: item for item in scene["aircraft"]}
        for output in result["aircraft"]:
            if output["status"] != "success":
                continue
            aircraft = aircraft_by_id[output["id"]]
            parameters = service._resolved_parameters(scene, aircraft)
            world = motion.World(
                scene["obstacles"],
                (
                    scene["world"]["min"],
                    scene["world"]["max"],
                    scene["world"]["min"],
                    scene["world"]["max"],
                ),
                parameters["obstacle_margin"],
            )
            self.assertAlmostEqual(output["path"][0][0], aircraft["x"], places=6)
            self.assertAlmostEqual(output["path"][0][1], aircraft["y"], places=6)
            for segment in output["motions"]:
                self.assertGreater(segment["length"], 0)
                self.assertLessEqual(
                    abs(segment["curvature"]), 1 / parameters["min_turn_radius"] + 1e-9
                )
                self.assertTrue(
                    world.segment_free(
                        motion.Pose(segment["x"], segment["y"], segment["yaw"]),
                        motion.Segment(segment["length"], segment["curvature"]),
                    )
                )
            for start, end in zip(output["path"], output["path"][1:]):
                yaw = math.atan2(end[1] - start[1], end[0] - start[0])
                self.assertTrue(
                    world.segment_free(
                        motion.Pose(start[0], start[1], yaw),
                        motion.Segment(math.dist(start[:2], end[:2]), 0),
                    )
                )
            self.assertAlmostEqual(
                output["stats"]["flight_time_s"],
                output["stats"]["path_length_m"] / parameters["speed"],
                places=6,
            )
            self.assertAlmostEqual(
                output["trajectory"][-1]["time"],
                output["stats"]["flight_time_s"],
                places=5,
            )

    def test_default_five_aircraft_keep_geometry_height_and_clearance(self):
        result = service.plan_scene(service.default_scene())
        self.assertEqual(result["status"], "completed", result["aircraft"])
        self.assertEqual(
            sum(item["status"] == "success" for item in result["aircraft"]), 5
        )
        self.assertEqual(len(result["sweep_paths"]), 10)
        self.assert_motion_constraints(result)
        lower, upper = 50000, 70000
        for output in result["aircraft"]:
            for point in output["trajectory"]:
                if (
                    lower - 1e-7 <= point["x"] <= upper + 1e-7
                    and lower - 1e-7 <= point["y"] <= upper + 1e-7
                ):
                    self.assertAlmostEqual(point["alt"], 2000)

    def test_per_aircraft_parameters_affect_geometry_time_and_height(self):
        scene = small_scene()
        scene["aircraft"][0].update(
            altitude=2010,
            overrides={"speed": 30, "min_turn_radius": 25, "climb_rate": 5},
        )
        scene["aircraft"].append(
            {
                "id": "b",
                "name": "乙机",
                "x": -40,
                "y": -40,
                "heading_deg": 20,
                "altitude": 2005,
                "enabled": True,
                "overrides": {"speed": 10, "climb_rate": 2},
            }
        )
        result = service.plan_scene(scene)
        self.assertEqual(result["status"], "completed", result["aircraft"])
        self.assert_motion_constraints(result)
        self.assertTrue(all(item["status"] == "success" for item in result["aircraft"]))
        for output, aircraft in zip(result["aircraft"], scene["aircraft"]):
            parameters = dict(scene["defaults"], **aircraft["overrides"])
            self.assertAlmostEqual(
                output["trajectory"][-1]["alt"], aircraft["altitude"]
            )
            ramps = [
                (a, b)
                for a, b in zip(output["trajectory"], output["trajectory"][1:])
                if abs(b["alt"] - a["alt"]) > 1e-6
            ]
            self.assertTrue(ramps)
            for start, end in ramps:
                self.assertAlmostEqual(
                    abs(end["alt"] - start["alt"]) / (end["time"] - start["time"]),
                    parameters["climb_rate"],
                    places=5,
                )

    def test_reference_failure_keeps_other_aircraft_and_progress(self):
        scene = small_scene()
        scene["aircraft"].append(
            {
                "id": "b",
                "name": "乙机",
                "x": 0,
                "y": -80,
                "heading_deg": 45,
                "altitude": 2000,
                "enabled": True,
                "overrides": {},
            }
        )
        scene["obstacles"] = [
            {"id": "origin", "type": "circle", "center": [0, 0], "radius": 5}
        ]
        original, progress = deepcopy(scene), []
        result = service.plan_scene(scene, progress.append)
        self.assertEqual(scene, original)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["aircraft"][0]["error"]["code"], "start_not_free")
        self.assertEqual(result["aircraft"][0]["error"]["stage"], "reference")
        self.assertEqual(result["aircraft"][1]["status"], "success")
        self.assertEqual(progress[-1]["completed"], 2)
        self.assertEqual(progress[-1]["total"], 2)
        self.assert_motion_constraints(result)

    def test_rectangle_and_polygon_obstacles_are_used_during_planning(self):
        scene = small_scene()
        scene["obstacles"] = [
            {
                "id": "rectangle",
                "type": "rectangle",
                "center": [150, 150],
                "width": 30,
                "height": 80,
                "rotation_deg": 20,
            },
            {
                "id": "polygon",
                "type": "polygon",
                "vertices": [[170, 230], [200, 230], [190, 260]],
            },
        ]
        result = service.plan_scene(scene)
        self.assertEqual(result["status"], "completed", result["aircraft"])
        self.assert_motion_constraints(result)

    def test_sampling_changes_points_but_preserves_motion_geometry(self):
        coarse = small_scene()
        coarse["aircraft"][0]["altitude"] = 2010
        coarse["sampling"] = {
            "preset": "custom",
            "sample_step": 30,
            "max_arc_angle_deg": 45,
        }
        dense = deepcopy(coarse)
        dense["sampling"] = {
            "preset": "custom",
            "sample_step": 0.5,
            "max_arc_angle_deg": 2,
        }
        first, second = service.plan_scene(coarse), service.plan_scene(dense)
        self.assertEqual(first["status"], "completed", first["aircraft"])
        self.assertEqual(second["status"], "completed", second["aircraft"])
        first, second = first["aircraft"][0], second["aircraft"][0]
        self.assertEqual(first["motions"], second["motions"])
        self.assertEqual(
            first["stats"]["path_length_m"], second["stats"]["path_length_m"]
        )
        self.assertLess(len(first["path"]), len(second["path"]))
        for output in (first, second):
            phases = {point["phase"] for point in output["trajectory"]}
            self.assertIn("sweep", phases)
            ramps = [
                (a, b)
                for a, b in zip(output["trajectory"], output["trajectory"][1:])
                if abs(b["alt"] - a["alt"]) > 1e-6
            ]
            self.assertGreaterEqual(len(ramps), 2)
            for start, end in ramps:
                self.assertAlmostEqual(
                    abs(end["alt"] - start["alt"]) / (end["s"] - start["s"]),
                    0.5,
                    places=5,
                )

    def test_scenes_have_no_global_side_effects_and_disabled_aircraft_stay_idle(self):
        globals_before = deepcopy(
            (
                run_planner.DRONES,
                run_planner.OBSTACLES,
                run_planner.PLANNER_CONFIG,
                run_planner.SWEEP_CENTER,
            )
        )
        scene = small_scene()
        scene["aircraft"].append(
            {"id": "disabled", "name": "停用", "x": 0, "y": 0, "enabled": False}
        )
        first = service.plan_scene(scene)
        shifted = deepcopy(scene)
        shifted["sweep"]["center"] = [500, 500]
        second = service.plan_scene(shifted)
        self.assertEqual(first["status"], "completed")
        self.assertEqual(second["status"], "completed")
        self.assertNotEqual(
            first["aircraft"][0]["path"][-1][:2], second["aircraft"][0]["path"][-1][:2]
        )
        self.assertEqual(first["aircraft"][1]["status"], "idle")
        self.assertEqual(
            (
                run_planner.DRONES,
                run_planner.OBSTACLES,
                run_planner.PLANNER_CONFIG,
                run_planner.SWEEP_CENTER,
            ),
            globals_before,
        )

    def test_blocked_preset_uses_existing_goal_check(self):
        blocked = next(
            item["scene"] for item in service.scene_presets() if item["id"] == "blocked"
        )
        result = service.plan_scene(blocked)
        self.assertEqual(result["status"], "failed")
        self.assertTrue(
            all(item["error"]["code"] == "goal_not_free" for item in result["aircraft"])
        )
        self.assertEqual(result["duration_s"], 0)

    def test_time_assignment_uses_line_time_and_does_not_claim_synchronization(self):
        paths = [[(0, 0), (100, 0)], [(0, 1), (100, 1)], [(0, 2), (100, 2)]]
        aircraft = [{"id": "slow"}, {"id": "fast"}]
        parameters = [{"speed": 10}, {"speed": 20}]
        groups = service._assign_sweeps(paths, aircraft, parameters, "time")
        self.assertEqual([len(group) for group in groups], [1, 2])


if __name__ == "__main__":
    unittest.main()
