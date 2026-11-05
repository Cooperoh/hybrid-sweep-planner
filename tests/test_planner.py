"""校验规划几何、避障、扫掠覆盖与高度约束。"""

import contextlib
import io
import json
import math
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault("MPLBACKEND", "Agg")

from planner.hybrid_sweep_planner import HybridSweepPlanner
from planner.altitude_profile import build_altitude_profile
from planner.hybrid_astar import (
    Circle,
    HybridAStarConfig,
    Pose,
    Segment,
    World,
    compact_path,
    endpoint,
    plan_hybrid_astar,
)
import run_planner
from planner.sweep_routes import connect_with_arcs


def planner_config(**changes):
    config = dict(
        world_max=300.0,
        world_min=-100.0,
        sample_step=2.0,
        min_turn_radius=15.0,
        speed=20.0,
        max_expansions=20000,
        obstacle_margin=1.0,
        shortcut_attempts=120,
    )
    config.update(changes)
    return config


def angle_delta(a, b):
    return (a - b + math.pi) % (2 * math.pi) - math.pi


def distance_to_chord(point, start, end):
    dx, dy = end[0] - start[0], end[1] - start[1]
    denominator = dx * dx + dy * dy
    t = (
        0.0
        if denominator == 0
        else ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator
    )
    t = max(0.0, min(1.0, t))
    return math.hypot(point[0] - start[0] - t * dx, point[1] - start[1] - t * dy)


def minimum_route_clearances(path, motions, obstacles):
    arc_clearance = chord_clearance = math.inf
    for a, b, segment in zip(path, path[1:], motions):
        k = segment.curvature
        for ox, oy, radius in obstacles:
            chord_clearance = min(
                chord_clearance, distance_to_chord((ox, oy), a, b) - radius
            )
            distance = min(
                math.hypot(a[0] - ox, a[1] - oy), math.hypot(b[0] - ox, b[1] - oy)
            )
            if abs(k) < 1e-12:
                distance = distance_to_chord((ox, oy), a, b)
            else:
                cx, cy = a[0] - math.sin(a[2]) / k, a[1] + math.cos(a[2]) / k
                first = math.atan2(a[1] - cy, a[0] - cx)
                target = math.atan2(oy - cy, ox - cx)
                direction = 1 if k > 0 else -1
                if (direction * (target - first)) % (2 * math.pi) <= abs(
                    k
                ) * segment.length + 1e-8:
                    distance = min(
                        distance, abs(math.hypot(ox - cx, oy - cy) - abs(1 / k))
                    )
            arc_clearance = min(arc_clearance, distance - radius)
    return arc_clearance, chord_clearance


def assert_altitude_profile(
    test,
    profile,
    own_altitude,
    target_altitude,
    bounds,
    speed,
    climb_rate,
    layer_hold_time=10,
    require_level_turns=True,
):
    test.assertTrue(profile)
    xmin, xmax, ymin, ymax = bounds

    def inside(x, y):
        return xmin - 1e-7 <= x <= xmax + 1e-7 and ymin - 1e-7 <= y <= ymax + 1e-7

    outside, curved = [], []
    for row in profile:
        for key in ("x", "y", "alt", "yaw", "s", "time", "phase"):
            test.assertIn(key, row)
        test.assertIsInstance(row["phase"], str)
        test.assertTrue(
            all(
                math.isfinite(row[key]) for key in ("x", "y", "alt", "yaw", "s", "time")
            )
        )
        test.assertAlmostEqual(row["time"], row["s"] / speed, places=6)
        if inside(row["x"], row["y"]):
            test.assertAlmostEqual(row["alt"], target_altitude, places=6)
    test.assertAlmostEqual(profile[0]["s"], 0)
    for row in (profile[0], profile[-1]):
        expected = target_altitude if inside(row["x"], row["y"]) else own_altitude
        test.assertAlmostEqual(row["alt"], expected, places=6)
    for a, b in zip(profile, profile[1:]):
        ds, dt = b["s"] - a["s"], b["time"] - a["time"]
        test.assertGreater(ds, 0)
        test.assertGreater(dt, 0)
        test.assertLessEqual(abs(b["alt"] - a["alt"]) / dt, climb_rate + 1e-6)
        chord = math.hypot(b["x"] - a["x"], b["y"] - a["y"])
        turn = angle_delta(b["yaw"], a["yaw"])
        expected_ds = (
            chord if abs(turn) < 1e-10 else chord * turn / (2 * math.sin(turn / 2))
        )
        test.assertAlmostEqual(ds, expected_ds, places=5)
        midpoint = endpoint(
            Pose(a["x"], a["y"], a["yaw"]), [Segment(ds / 2, turn / ds)]
        )
        is_inside = inside(midpoint.x, midpoint.y)
        outside.append(not is_inside)
        curved.append(abs(turn) > 1e-8)
        if is_inside:
            test.assertAlmostEqual((a["alt"] + b["alt"]) / 2, target_altitude, places=6)
        if require_level_turns:
            if abs(b["alt"] - a["alt"]) > 1e-6:
                test.assertAlmostEqual(turn, 0, places=8)
                bearing = math.atan2(b["y"] - a["y"], b["x"] - a["x"])
                test.assertAlmostEqual(angle_delta(bearing, a["yaw"]), 0, places=8)
            if not is_inside and curved[-1]:
                test.assertAlmostEqual(a["alt"], own_altitude, places=6)
                test.assertAlmostEqual(b["alt"], own_altitude, places=6)

    excursions = []
    index = 0
    while index < len(outside):
        if not outside[index]:
            index += 1
            continue
        first = index
        while index < len(outside) and outside[index]:
            index += 1
        last = index
        hold_time = sum(
            profile[i + 1]["time"] - profile[i]["time"]
            for i in range(first, last)
            if abs(profile[i]["alt"] - own_altitude) < 1e-6
            and abs(profile[i + 1]["alt"] - own_altitude) < 1e-6
        )
        interior = first > 0 and last < len(outside)
        excursion = dict(
            first=first,
            last=last,
            interior=interior,
            length=profile[last]["s"] - profile[first]["s"],
            hold_time=hold_time,
        )
        excursions.append(excursion)
        if interior:
            test.assertAlmostEqual(profile[first]["alt"], target_altitude, places=6)
            test.assertAlmostEqual(profile[last]["alt"], target_altitude, places=6)
            test.assertTrue(
                any(
                    abs(row["alt"] - own_altitude) < 1e-6
                    for row in profile[first : last + 1]
                )
            )
            test.assertGreaterEqual(hold_time, layer_hold_time - 1e-6)
            required = 2 * abs(own_altitude - target_altitude) / climb_rate * speed
            test.assertGreaterEqual(
                excursion["length"], required + speed * layer_hold_time - 1e-5
            )
            if require_level_turns:
                outbound = inbound = 0.0
                for i in range(first, last):
                    if curved[i]:
                        break
                    outbound += profile[i + 1]["s"] - profile[i]["s"]
                for i in range(last - 1, first - 1, -1):
                    if curved[i]:
                        break
                    inbound += profile[i + 1]["s"] - profile[i]["s"]
                test.assertGreaterEqual(outbound, required / 2 - 1e-5)
                test.assertGreaterEqual(inbound, required / 2 - 1e-5)
    return excursions


class PlannerRegressionTests(unittest.TestCase):
    def assert_clean_sweep_entry(self, path, motions, first_line, radius):
        def same_pose(a, b):
            return (
                math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-5
                and abs(angle_delta(a[2], b[2])) < 1e-7
            )

        line_index = next(
            (
                i
                for i, (a, b) in enumerate(zip(path, path[1:]))
                if same_pose(a, first_line[0]) and same_pose(b, first_line[1])
            ),
            None,
        )
        self.assertIsNotNone(line_index, "First assigned sweep line was lost")
        prefix = motions[:line_index]
        merged = []
        for segment in prefix:
            if merged and abs(merged[-1].curvature - segment.curvature) < 1e-10:
                merged[-1] = Segment(
                    merged[-1].length + segment.length, merged[-1].curvature
                )
            else:
                merged.append(segment)
        initial_signs = []
        for segment in merged:
            if abs(segment.curvature) < 1e-10:
                if segment.length >= radius:
                    break
            else:
                initial_signs.append(1 if segment.curvature > 0 else -1)
        self.assertLessEqual(
            len(set(initial_signs)), 1, "Incidental initial S-turn remains"
        )
        same_direction_turn = 0.0
        last_sign = 0
        for segment in merged:
            sign = (
                0
                if abs(segment.curvature) < 1e-10
                else 1
                if segment.curvature > 0
                else -1
            )
            if sign == 0 or sign != last_sign:
                same_direction_turn = 0.0
            if sign:
                same_direction_turn += abs(segment.curvature) * segment.length
                self.assertLess(
                    same_direction_turn,
                    2 * math.pi - 1e-4,
                    "Approach contains a complete extra circle",
                )
            last_sign = sign
        terminal_turn = 0.0
        for segment in reversed(merged):
            if abs(segment.curvature) < 1e-10 and segment.length >= radius / 2:
                break
            terminal_turn += abs(segment.curvature) * segment.length
        self.assertLess(
            terminal_turn, math.pi, "Entry connector loops back before the sweep"
        )

    def assert_pose_polyline(self, path, min_radius, bounds, obstacles, margin):
        world = World([Circle(*o) for o in obstacles], bounds, margin)
        motions = []
        for a, b in zip(path, path[1:]):
            chord = math.hypot(b[0] - a[0], b[1] - a[1])
            self.assertGreater(chord, 1e-8)
            turn = angle_delta(b[2], a[2])
            bearing = math.atan2(b[1] - a[1], b[0] - a[0])
            self.assertAlmostEqual(angle_delta(bearing, a[2] + turn / 2), 0, places=7)
            if abs(turn) < 1e-9:
                segment = Segment(chord, 0)
            else:
                curvature = 2 * math.sin(turn / 2) / chord
                segment = Segment(turn / curvature, curvature)
            self.assertLessEqual(abs(segment.curvature), 1 / min_radius + 1e-10)
            restored = endpoint(Pose(*a), [segment])
            self.assertAlmostEqual(restored.x, b[0], places=6)
            self.assertAlmostEqual(restored.y, b[1], places=6)
            self.assertTrue(world.path_free(Pose(*a), [segment]), (a, b))
            for ox, oy, radius in obstacles:
                self.assertGreater(
                    distance_to_chord((ox, oy), a, b), radius + margin - 1e-7
                )
            motions.append(segment)
        return motions

    def assert_route(
        self, planner, path, start, heading_deg, goal, obstacles, goal_heading_deg=None
    ):
        self.assertTrue(path)
        self.assertEqual(len(path[0]), 3)
        self.assertAlmostEqual(path[0][0], start[0], places=7)
        self.assertAlmostEqual(path[0][1], start[1], places=7)
        self.assertAlmostEqual(
            angle_delta(path[0][2], math.radians(heading_deg)), 0, places=7
        )
        self.assertAlmostEqual(path[-1][0], goal[0], places=6)
        self.assertAlmostEqual(path[-1][1], goal[1], places=6)
        if goal_heading_deg is not None:
            self.assertAlmostEqual(
                angle_delta(path[-1][2], math.radians(goal_heading_deg)), 0, places=7
            )
        lower, upper = sorted((planner.world_min, planner.world_max))
        for waypoint in path:
            self.assertTrue(all(math.isfinite(v) for v in waypoint))
            self.assertGreaterEqual(waypoint[0], lower - 1e-7)
            self.assertLessEqual(waypoint[0], upper + 1e-7)
            self.assertGreaterEqual(waypoint[1], lower - 1e-7)
            self.assertLessEqual(waypoint[1], upper + 1e-7)
        for first, second in zip(path, path[1:]):
            self.assertGreater(
                math.hypot(second[0] - first[0], second[1] - first[1]), 1e-9
            )
            for ox, oy, radius in obstacles:
                self.assertGreater(
                    distance_to_chord((ox, oy), first, second),
                    radius + planner.obstacle_margin - 1e-8,
                )
        pose = Pose(start[0], start[1], math.radians(heading_deg))
        last = endpoint(pose, planner.segments)
        self.assertAlmostEqual(last.x, goal[0], places=6)
        self.assertAlmostEqual(last.y, goal[1], places=6)
        for segment in planner.segments:
            self.assertGreater(segment.length, 0)
            self.assertLessEqual(
                abs(segment.curvature), 1 / planner.min_turn_radius + 1e-10
            )
        # 独立细采样真实圆弧，核对输出弦线以外的碰撞。
        for segment in planner.segments:
            sample_count = max(1, math.ceil(segment.length / 0.5))
            for index in range(sample_count + 1):
                sample = endpoint(
                    pose,
                    [Segment(segment.length * index / sample_count, segment.curvature)],
                )
                for ox, oy, radius in obstacles:
                    self.assertGreater(
                        math.hypot(sample.x - ox, sample.y - oy),
                        radius + planner.obstacle_margin - 1e-8,
                    )
            pose = endpoint(pose, [segment])

    def test_100_km_straight_is_two_waypoints(self):
        planner = HybridSweepPlanner(**planner_config(world_max=100100.0))
        path, stats = planner.plan((0, 0), 0, (100000, 0), [])
        self.assertEqual(path, [(0.0, 0.0, 0.0), (100000.0, 0.0, 0.0)])
        self.assertEqual(stats["output_points"], 2)
        self.assertEqual(stats["expanded_nodes"], 0)
        self.assertAlmostEqual(stats["path_length_m"], 100000.0)
        self.assertAlmostEqual(stats["flight_time_s"], 5000.0)
        for name in ("segments", "planning_time_s", "raw_path_length_m"):
            self.assertIn(name, stats)

    def test_mission_uses_current_sweep_configuration(self):
        drone = dict(name="test_aircraft", xy=(0, 0), heading_deg=45, alt=2000)
        with patch.multiple(
            run_planner,
            DRONES=[drone],
            SWEEP_DRONE_COUNT=1,
            SWEEP_CENTER=(200, 200),
            SWEEP_SIDE_LENGTH=40,
            SWEEP_SPACING=20,
            OBSTACLES=[],
            PLANNER_CONFIG=planner_config(
                world_max=400, min_turn_radius=10, sample_step=0.5
            ),
        ):
            mission = run_planner.plan_mission()
        self.assertEqual(
            mission["square"], [(180, 180), (180, 220), (220, 220), (220, 180)]
        )
        self.assertEqual(len(mission["paths"]), 1)
        self.assertEqual(mission["paths"][0][0][:2], (0.0, 0.0))
        self.assertTrue(
            all(
                180 <= x <= 220 and 180 <= y <= 220
                for line in mission["sweep_paths"]
                for x, y in line
            )
        )
        self.assertTrue(all(row["alt"] == 2000 for row in mission["trajectories"][0]))

    def test_world_bounds_are_inclusive(self):
        planner = HybridSweepPlanner(
            **planner_config(world_min=-20, world_max=100, obstacle_margin=5)
        )
        path, _ = planner.plan((-20, 0), 0, (100, 0), [])
        self.assertEqual(len(path), 2)
        self.assertEqual(path[-1][:2], (100.0, 0.0))
        with self.assertRaises((ValueError, RuntimeError)):
            planner.plan((0, 0), 0, (110, 0), [])

    def test_same_position_preserves_initial_heading(self):
        planner = HybridSweepPlanner(**planner_config())
        path, stats = planner.plan((10, 20), -170, (10, 20), [])
        self.assertEqual(len(path), 1)
        self.assertEqual(path[0][:2], (10.0, 20.0))
        self.assertAlmostEqual(angle_delta(path[0][2], math.radians(-170)), 0)
        self.assertAlmostEqual(stats["path_length_m"], 0)

    def test_fixed_heading_turns_and_wrap(self):
        for start, heading, goal, goal_heading in [
            ((0, 0), 0, (100, 50), 90),
            ((0, 0), 179, (-70, 20), -179),
            ((0, 0), 0, (0, 0), 180),
        ]:
            with self.subTest(heading=heading, goal=goal):
                planner = HybridSweepPlanner(**planner_config())
                path, stats = planner.plan_to_pose(
                    start, heading, goal, goal_heading, []
                )
                self.assert_route(planner, path, start, heading, goal, [], goal_heading)
                self.assertLess(len(path), 200)
                chord_length = sum(
                    math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(path, path[1:])
                )
                self.assertGreaterEqual(stats["path_length_m"] + 1e-8, chord_length)

    def test_obstacle_requires_search_and_repeat_is_deterministic(self):
        obstacles = [(65.0, 0.0, 18.0)]
        planner = HybridSweepPlanner(**planner_config())
        first, first_stats = planner.plan_to_pose((0, 0), 0, (180, 0), 0, obstacles)
        self.assertGreater(first_stats["expanded_nodes"], 0)
        self.assert_route(planner, first, (0, 0), 0, (180, 0), obstacles, 0)
        second, second_stats = planner.plan_to_pose((0, 0), 0, (180, 0), 0, obstacles)
        self.assertEqual(first, second)
        self.assertEqual(first_stats["expanded_nodes"], second_stats["expanded_nodes"])
        self.assertAlmostEqual(
            first_stats["path_length_m"], second_stats["path_length_m"]
        )

    def test_small_obstacle_between_straight_endpoints_is_detected(self):
        planner = HybridSweepPlanner(**planner_config(sample_step=100000.0))
        obstacles = [(50.0, 0.0, 0.1)]
        path, _ = planner.plan_to_pose((0, 0), 0, (100, 0), 0, obstacles)
        self.assertGreater(len(path), 2)
        self.assert_route(planner, path, (0, 0), 0, (100, 0), obstacles, 0)

    def test_compact_arc_chords_do_not_cut_through_nearby_obstacle(self):
        start = Pose(0, 0, 0)
        arc = Segment(1.5, 0.1)
        end = endpoint(start, [arc])
        center = (end.x / 2, end.y / 2)
        obstacle = Circle(center[0], center[1], 0.005)
        world = World([obstacle], (-20, 20, -20, 20), 0)
        self.assertTrue(world.path_free(start, [arc]))
        self.assertLess(
            distance_to_chord(center, (0, 0), (end.x, end.y)), obstacle.radius
        )
        points = compact_path(
            start, [arc], step=100000.0, max_arc_angle=0.15, world=world
        )
        self.assertGreater(len(points), 2)
        for a, b in zip(points, points[1:]):
            self.assertGreater(distance_to_chord(center, a, b), obstacle.radius)

    def test_analytic_arc_collision_and_boundary_checks(self):
        start, arc = Pose(0, 0, 0), Segment(10 * math.pi, 0.1)
        world = World([Circle(10, 10, 0.2)], (-50, 50, -50, 50), 0)
        self.assertTrue(world.point_free(start))
        self.assertTrue(world.point_free(endpoint(start, [arc])))
        self.assertFalse(world.path_free(start, [arc]))
        narrow = World([], (-5, 5, -5, 25), 0)
        self.assertFalse(narrow.path_free(start, [arc]))

    def test_search_time_and_expansion_limits_are_bounded(self):
        start, goal = Pose(0, 0, 0), Pose(180, 0, 0)
        obstacles = [Circle(65, 0, 18)]
        bounds = (-100, 300, -100, 300)
        config = HybridAStarConfig(
            min_turn_radius=15, obstacle_margin=1, max_expansions=1
        )
        limited = plan_hybrid_astar(start, goal, obstacles, bounds, config)
        self.assertFalse(limited.success)
        self.assertEqual(limited.expanded_nodes, 1)
        self.assertEqual(limited.segments, [])
        # 固定时钟，避免运行速度影响预算校验。
        with patch("planner.hybrid_astar.time.perf_counter", side_effect=[0, 100, 100]):
            expired = plan_hybrid_astar(
                start, goal, obstacles, bounds, HybridAStarConfig(timeout_s=1)
            )
        self.assertFalse(expired.success)
        self.assertEqual(expired.expanded_nodes, 0)
        self.assertEqual(expired.segments, [])
        self.assertIn("time limit", expired.message)

    def test_invalid_inputs_and_blocked_route(self):
        for change in (
            dict(min_turn_radius=0),
            dict(sample_step=0),
            dict(obstacle_margin=-1),
            dict(speed=float("nan")),
            dict(timeout_s=0),
            dict(yaw_resolution_deg=0),
        ):
            with self.subTest(change=change), self.assertRaises(ValueError):
                HybridSweepPlanner(**planner_config(**change))
        planner = HybridSweepPlanner(**planner_config())
        for start, goal, obstacles in [
            ((float("nan"), 0), (10, 0), []),
            ((0, 0), (10, 0), [(5, 5, -1)]),
        ]:
            with (
                self.subTest(start=start, obstacles=obstacles),
                self.assertRaises(ValueError),
            ):
                planner.plan(start, 0, goal, obstacles)
        with self.assertRaises(RuntimeError):
            planner.plan((0, 0), 0, (100, 0), [(0, 0, 1)])
        blocked = HybridSweepPlanner(
            **planner_config(
                world_min=-20,
                world_max=120,
                max_expansions=2000,
                min_turn_radius=5,
                obstacle_margin=0,
            )
        )
        with self.assertRaises(RuntimeError):
            blocked.plan((0, 0), 0, (100, 0), [(50, 50, 70.2)])

    def test_approach_entry_runs_one_deterministic_search(self):
        original_plan = HybridSweepPlanner.plan
        with patch.object(
            HybridSweepPlanner, "plan", autospec=True, wraps=HybridSweepPlanner.plan
        ) as plan_call:
            plan_call.side_effect = lambda planner, *args: original_plan(planner, *args)
            path, stats, obstacles = run_planner.plan_approach(
                (0, 0),
                0,
                goal=(100, 0),
                obstacles=[],
                planner_config=planner_config(),
            )
        plan_call.assert_called_once()
        self.assertEqual(len(path), 2)
        self.assertEqual(obstacles, [])
        self.assertEqual(stats["expanded_nodes"], 0)
        self.assertEqual(stats["algorithm"], "Hybrid A* + Dubins")

    def test_explicit_obstacle_margin_is_respected(self):
        obstacles = [(50, 7, 5)]  # 原直线距障碍表面２米。
        for margin in (1, 3):
            with self.subTest(margin=margin):
                config = planner_config(obstacle_margin=margin)
                path, stats, _ = run_planner.plan_approach(
                    (0, 0), 0, goal=(100, 0), obstacles=obstacles, planner_config=config
                )
                self.assertEqual(config["obstacle_margin"], margin)
                motions = self.assert_pose_polyline(
                    path, 15, (-100, 300, -100, 300), obstacles, margin
                )
                arc_gap, chord_gap = minimum_route_clearances(path, motions, obstacles)
                self.assertGreaterEqual(min(arc_gap, chord_gap), margin - 1e-6)
                if margin == 1:
                    self.assertEqual(len(path), 2)
                    self.assertAlmostEqual(stats["path_length_m"], 100)
                    sweep = connect_with_arcs(
                        [[(0, 0), (100, 0)]],
                        15,
                        obstacles=obstacles,
                        planner_config=config,
                    )
                    self.assertEqual(len(sweep), 2)
                else:
                    self.assertGreater(len(path), 2)
                    with self.assertRaises(RuntimeError):
                        connect_with_arcs(
                            [[(0, 0), (100, 0)]],
                            15,
                            obstacles=obstacles,
                            planner_config=config,
                        )

    def test_sweep_connectors_keep_long_straights_sparse(self):
        paths = [[(0.0, 0.0), (1000.0, 0.0)], [(100000.0, 0.0), (101000.0, 0.0)]]
        route = connect_with_arcs(paths, 15, greedy=False)
        self.assertEqual(route.order, [(0, False), (1, False)])
        self.assertEqual(route[0], paths[0][0])
        self.assertEqual(route[-1], paths[-1][-1])
        self.assertLessEqual(len(route), 4)
        turning = connect_with_arcs(
            [[(0, 0), (100, 0)], [(100, 40), (0, 40)]], 15, greedy=False
        )
        self.assertEqual(turning[0], (0, 0))
        self.assertAlmostEqual(turning[-1][0], 0)
        self.assertAlmostEqual(turning[-1][1], 40)
        self.assertLess(len(turning), 200)

    def test_sweep_exact_headings_survive_xy_interface(self):
        route = connect_with_arcs(
            [[(0, 0), (100, 0)], [(100, 40), (0, 40)]], 15, greedy=False
        )
        poses = list(route.poses)
        self.assertEqual(poses, route.poses)
        self.assertEqual([(p[0], p[1]) for p in poses], list(route))
        self.assertTrue(all(len(p) == 2 for p in json.loads(json.dumps(route))))
        self.assert_pose_polyline(poses, 15, (-100, 200, -100, 200), [], 0)
        self.assertTrue(
            any(
                abs(angle_delta(math.atan2(b[1] - a[1], b[0] - a[0]), a[2])) > 1e-3
                for a, b in zip(poses, poses[1:])
            )
        )

    def test_sweep_extensions_apply_only_at_mission_entry_and_exit(self):
        paths = [[(0, 0), (100, 0)], [(100, 40), (0, 40)]]
        route = connect_with_arcs(
            paths, 15, greedy=False, entry_extension=10, exit_extension=20
        )
        self.assertEqual(paths, [[(0, 0), (100, 0)], [(100, 40), (0, 40)]])
        for point, expected in (
            (route[0], (-10.0, 0.0)),
            (route[-1], (-20.0, 40.0)),
            (route[1], (100.0, 0.0)),
            (route[-2], (100.0, 40.0)),
        ):
            self.assertAlmostEqual(point[0], expected[0])
            self.assertAlmostEqual(point[1], expected[1])
        self.assert_pose_polyline(route.poses, 15, (-100, 200, -100, 200), [], 0)
        self.assertTrue(
            all(
                any(distance_to_chord(p, a, b) < 1e-6 for a, b in zip(route, route[1:]))
                for line in paths
                for p in line
            )
        )

    def test_obstacle_aware_large_radius_sweep_avoids_blocked_turn(self):
        paths = [[(80000, 59000), (40000, 59000)], [(40000, 69000), (80000, 69000)]]
        config = dict(
            run_planner.PLANNER_CONFIG,
            min_turn_radius=4000,
            sample_step=200,
            obstacle_margin=100,
        )
        route = connect_with_arcs(
            paths, 4000, obstacles=run_planner.OBSTACLES, planner_config=config
        )
        self.assertEqual(route.order, [(0, False), (1, True)])
        self.assertEqual(route[-1], (40000.0, 69000.0))
        self.assertTrue(
            any(
                math.hypot(p[0] - 80000, p[1] - 69000) < 1e-6
                and abs(angle_delta(p[2], math.pi)) < 1e-8
                for p in route.poses
            )
        )
        self.assert_pose_polyline(
            route.poses,
            4000,
            (-20000, 100000, -20000, 100000),
            run_planner.OBSTACLES,
            config["obstacle_margin"],
        )

    def test_every_outside_turn_reserves_both_transitions_and_layer_hold(self):
        bounds = (50000, 70000, 50000, 70000)
        route = connect_with_arcs(
            [[(70000, 59000), (50000, 59000)], [(50000, 69000), (70000, 69000)]],
            3000,
            greedy=False,
            obstacles=[],
            planner_config=run_planner.PLANNER_CONFIG,
            sweep_bounds=bounds,
            turn_transition_distance=10000,
            layer_hold_distance=2000,
        )
        self.assertEqual(len(route.outside_connectors), 1)
        connector = route.outside_connectors[0]
        self.assertGreaterEqual(connector["length_m"], 22000 - 1e-6)
        self.assertEqual(connector["transition_mode"], "straight_before_turn")
        self.assertGreaterEqual(connector["outbound_straight_m"], 10000)
        self.assertGreaterEqual(connector["inbound_straight_m"], 10000)
        self.assertGreaterEqual(connector["level_length_m"], 2000)
        self.assertAlmostEqual(
            connector["length_m"],
            connector["outbound_straight_m"]
            + connector["inbound_straight_m"]
            + connector["level_length_m"],
            places=6,
        )
        self.assertEqual(connector["segments"][0][1], 0)
        self.assertEqual(connector["segments"][-1][1], 0)
        start = Pose(*route.poses[connector["start_index"]])
        total_turn = 0.0
        for length, curvature in connector["segments"]:
            total_turn += abs(curvature) * length
            for i in range(101):
                pose = endpoint(start, [Segment(length * i / 100, curvature)])
                self.assertFalse(
                    50000 + 1e-6 < pose.x < 70000 - 1e-6
                    and 50000 + 1e-6 < pose.y < 70000 - 1e-6
                )
            start = endpoint(start, [Segment(length, curvature)])
        self.assertLess(total_turn, 2 * math.pi)
        self.assert_pose_polyline(
            route.poses,
            3000,
            (-20000, 100000, -20000, 100000),
            [],
            run_planner.PLANNER_CONFIG["obstacle_margin"],
        )
        profile = build_altitude_profile(
            route.poses, 1000, 2000, bounds, 200, 20, layer_hold_time=10
        )
        excursions = assert_altitude_profile(self, profile, 1000, 2000, bounds, 200, 20)
        self.assertEqual(len([e for e in excursions if e["interior"]]), 1)

    def test_blocked_mandatory_height_transition_straight_is_rejected(self):
        bounds = (50000, 70000, 50000, 70000)
        world = World(
            [Circle(*o) for o in run_planner.OBSTACLES],
            (-20000, 100000, -20000, 100000),
            run_planner.PLANNER_CONFIG["obstacle_margin"],
        )
        self.assertFalse(
            world.segment_free(Pose(50000, 59000, math.pi), Segment(20000, 0))
        )
        with self.assertRaisesRegex(RuntimeError, "straight height-transition"):
            connect_with_arcs(
                [[(70000, 59000), (50000, 59000)], [(50000, 69000), (70000, 69000)]],
                3000,
                greedy=False,
                obstacles=run_planner.OBSTACLES,
                planner_config=run_planner.PLANNER_CONFIG,
                sweep_bounds=bounds,
                turn_transition_distance=20000,
                layer_hold_distance=2000,
            )

    def test_approach_join_respects_config_and_rejects_obstructed_sweep(self):
        drone = {"xy": (0, 0), "heading_deg": 0, "alt": 2000}
        sweep = connect_with_arcs([[(100, 0), (200, 0)]], 15)
        config = planner_config()
        route = run_planner._plan_approach_to_sweep(
            drone, sweep, min_turn_radius=15, obstacles=[], planner_config=config
        )
        self.assertEqual(route[0], (0, 0, 0))
        self.assertEqual(route[-1], (200, 0, 0))
        self.assertLessEqual(len(route), 3)
        self.assert_pose_polyline(route, 15, (-100, 300, -100, 300), [], 1)
        with self.assertRaises(RuntimeError):
            run_planner._plan_approach_to_sweep(
                drone,
                sweep,
                min_turn_radius=15,
                obstacles=[(150, 0, 2)],
                planner_config=config,
            )

    def test_approach_join_rejects_obstacle_on_arc_between_exported_chords(self):
        sweep = connect_with_arcs(
            [[(75, -20), (125, -20)], [(125, 20), (75, 20)]], 15, greedy=False
        )
        obstacle = (125.98104693845, -19.96788384858, 0.00642323)
        # 障碍避开输出弦线，但与真实圆弧相交。
        self.assertTrue(
            all(
                distance_to_chord(obstacle[:2], a, b) > obstacle[2]
                for a, b in zip(sweep, sweep[1:])
            )
        )
        with (
            patch.object(run_planner, "SWEEP_CENTER", (100, 0)),
            patch.object(run_planner, "SWEEP_SIDE_LENGTH", 100),
            self.assertRaises(RuntimeError),
        ):
            run_planner._plan_approach_to_sweep(
                {"xy": (0, 0), "heading_deg": 0, "alt": 2000},
                sweep,
                min_turn_radius=15,
                obstacles=[obstacle],
                planner_config=planner_config(obstacle_margin=0),
            )

    def test_five_drone_mission_preserves_geometry_and_coverage(self):
        connected_sweeps = []

        def capture_sweep(*args, **kwargs):
            result = connect_with_arcs(*args, **kwargs)
            connected_sweeps.append(result)
            return result

        with (
            patch.object(run_planner, "plot_mission_paths") as plot,
            patch.object(run_planner, "connect_with_arcs", side_effect=capture_sweep),
            patch.object(run_planner.plt, "show"),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            mission = run_planner.main()
        plot.assert_called_once()
        square, obstacles, routes = plot.call_args.args
        sweeps = mission["sweep_paths"]
        self.assertEqual(mission["paths"], routes)
        self.assertEqual(mission["square"], square)
        self.assertEqual(mission["obstacles"], obstacles)
        self.assertEqual(len(mission["trajectories"]), 5)
        self.assertEqual(
            [d["alt"] for d in mission["drones"]], [2000, 1800, 2200, 1600, 2400]
        )
        self.assertEqual(mission["speed"], 200)
        self.assertEqual(mission["climb_rate"], 10)
        drones = run_planner._prioritize_reference_drone(
            run_planner.DRONES, run_planner.TARGET_ALTITUDE
        )
        expected_count = min(run_planner.SWEEP_DRONE_COUNT, len(drones), len(sweeps))
        self.assertEqual(len(routes), expected_count)
        self.assertEqual(expected_count, 5)
        self.assertEqual(
            square,
            run_planner._sweep_square(
                run_planner.SWEEP_CENTER, run_planner.SWEEP_SIDE_LENGTH
            ),
        )
        lower, upper = sorted(
            (
                run_planner.PLANNER_CONFIG["world_min"],
                run_planner.PLANNER_CONFIG["world_max"],
            )
        )
        bounds = (lower, upper, lower, upper)
        self.assertGreaterEqual(
            run_planner.PLANNER_CONFIG["obstacle_margin"],
            run_planner.MIN_TURN_RADIUS / 2,
        )
        straight_intervals = []
        for drone, route, connected, profile in zip(
            drones, routes, connected_sweeps, mission["trajectories"]
        ):
            self.assertTrue(all(len(point) == 3 for point in route))
            self.assertAlmostEqual(route[0][0], drone["xy"][0])
            self.assertAlmostEqual(route[0][1], drone["xy"][1])
            self.assertAlmostEqual(
                angle_delta(route[0][2], math.radians(drone["heading_deg"])), 0
            )
            motions = self.assert_pose_polyline(
                route,
                run_planner.MIN_TURN_RADIUS,
                bounds,
                obstacles,
                run_planner.PLANNER_CONFIG["obstacle_margin"],
            )
            gaps = minimum_route_clearances(route, motions, obstacles)
            self.assertGreaterEqual(min(gaps), run_planner.MIN_TURN_RADIUS / 2 - 1e-5)
            if drone["name"] == "drone_5":
                self.assert_clean_sweep_entry(
                    route, motions, connected.poses[:2], run_planner.MIN_TURN_RADIUS
                )
            straight_intervals.extend(
                (a, b)
                for a, b, segment in zip(route, route[1:], motions)
                if abs(segment.curvature) < 1e-10
            )
            self.assertTrue(
                any(
                    s.length >= run_planner.SWEEP_SIDE_LENGTH - 1e-6
                    and abs(s.curvature) < 1e-10
                    for s in motions
                )
            )
            height_bounds = (
                min(p[0] for p in square),
                max(p[0] for p in square),
                min(p[1] for p in square),
                max(p[1] for p in square),
            )
            excursions = assert_altitude_profile(
                self,
                profile,
                drone["alt"],
                mission["target_altitude"],
                height_bounds,
                mission["speed"],
                mission["climb_rate"],
                mission["layer_hold_time"],
            )
            self.assertTrue(any(e["interior"] for e in excursions))
            transition = (
                abs(drone["alt"] - mission["target_altitude"])
                / mission["climb_rate"]
                * mission["speed"]
            )
            self.assertTrue(connected.outside_connectors)
            for connector in connected.outside_connectors:
                self.assertEqual(connector["transition_mode"], "straight_before_turn")
                self.assertGreaterEqual(
                    connector["outbound_straight_m"], transition - 1e-6
                )
                self.assertGreaterEqual(
                    connector["inbound_straight_m"], transition - 1e-6
                )
                self.assertGreaterEqual(
                    connector["level_length_m"],
                    mission["speed"] * mission["layer_hold_time"] - 1e-6,
                )
            self.assertAlmostEqual(profile[0]["x"], route[0][0])
            self.assertAlmostEqual(profile[0]["y"], route[0][1])
            self.assertAlmostEqual(angle_delta(profile[0]["yaw"], route[0][2]), 0)
            self.assertAlmostEqual(profile[-1]["x"], route[-1][0])
            self.assertAlmostEqual(profile[-1]["y"], route[-1][1])
        for sweep in sweeps:
            self.assertTrue(
                any(
                    all(distance_to_chord(p, a, b) < 1e-5 for p in sweep)
                    for a, b in straight_intervals
                ),
                sweep,
            )
        self.assertLess(sum(map(len, routes)), 2000)


class AltitudeProfileTests(unittest.TestCase):
    def profile(
        self,
        path,
        own=100,
        target=200,
        bounds=(-20, 20, -20, 20),
        speed=2,
        rate=10,
        hold=10,
        strict=True,
    ):
        return build_altitude_profile(
            path,
            own,
            target,
            bounds,
            speed,
            rate,
            layer_hold_time=hold,
            require_level_turns=strict,
        )

    def test_sparse_straight_inserts_exact_boundaries_and_ramp_breakpoints(self):
        for own in (100, 300):
            with self.subTest(own_altitude=own):
                path = [(-100, 0, 0), (100, 0, 0)]
                profile = self.profile(path, own=own)
                assert_altitude_profile(
                    self, profile, own, 200, (-20, 20, -20, 20), 2, 10
                )
                expected = [
                    (-100, own),
                    (-40, own),
                    (-20, 200),
                    (20, 200),
                    (40, own),
                    (100, own),
                ]
                for x, altitude in expected:
                    self.assertTrue(
                        any(
                            abs(row["x"] - x) < 1e-6
                            and abs(row["alt"] - altitude) < 1e-6
                            for row in profile
                        ),
                        (x, altitude),
                    )
                self.assertAlmostEqual(profile[-1]["s"], 200)
                self.assertAlmostEqual(profile[-1]["time"], 100)

    def test_sparse_true_arc_detects_crossings_missed_by_its_chord(self):
        path = [
            (10 * math.cos(-1), 10 + 10 * math.sin(-1), math.pi / 2 - 1),
            (10 * math.cos(1), 10 + 10 * math.sin(1), math.pi / 2 + 1),
        ]
        bounds = (8, 12, 5, 15)
        profile = self.profile(path, own=180, bounds=bounds, strict=False)
        assert_altitude_profile(
            self, profile, 180, 200, bounds, 2, 10, require_level_turns=False
        )
        for y in (5, 15):
            self.assertTrue(
                any(
                    abs(row["x"] - math.sqrt(75)) < 1e-6
                    and abs(row["y"] - y) < 1e-6
                    and abs(row["alt"] - 200) < 1e-6
                    for row in profile
                )
            )
        self.assertAlmostEqual(profile[-1]["s"], 20)

    def test_strict_mode_rejects_altitude_change_before_a_curve_finishes(self):
        path = [
            (10 * math.cos(-1), 10 + 10 * math.sin(-1), math.pi / 2 - 1),
            (10 * math.cos(1), 10 + 10 * math.sin(1), math.pi / 2 + 1),
        ]
        with self.assertRaises(ValueError):
            self.profile(path, own=180, bounds=(8, 12, 5, 15))

    def test_native_vertices_and_inserted_phase_breakpoints_round_trip(self):
        path = [(-100, 0, 0), (-60, 0, 0), (0, 0, 0), (60, 0, 0), (100, 0, 0)]
        original = list(path)
        profile = self.profile(path)
        self.assertEqual(path, original)
        self.assertEqual(json.loads(json.dumps(profile)), profile)
        assert_altitude_profile(self, profile, 100, 200, (-20, 20, -20, 20), 2, 10)
        for x, y, yaw in path:
            self.assertTrue(
                any(
                    abs(row["x"] - x) < 1e-6
                    and abs(row["y"] - y) < 1e-6
                    and abs(angle_delta(row["yaw"], yaw)) < 1e-8
                    for row in profile
                )
            )
        self.assertGreater(len(profile), len(path))
        self.assertEqual(profile[0]["phase"], "approach_layer")
        self.assertTrue(any(row["phase"] == "sweep" for row in profile))
        self.assertTrue(any(row["phase"] == "entry_transition" for row in profile))

    def test_each_outside_turn_returns_to_own_layer_and_holds(self):
        route = connect_with_arcs(
            [[(0, 20), (100, 20)], [(100, 80), (0, 80)]],
            15,
            greedy=False,
            sweep_bounds=(0, 100, 0, 100),
            turn_transition_distance=20,
            layer_hold_distance=20,
        )
        for own in (100, 300):
            with self.subTest(own_altitude=own):
                profile = self.profile(route.poses, own=own, bounds=(0, 100, 0, 100))
                excursions = assert_altitude_profile(
                    self, profile, own, 200, (0, 100, 0, 100), 2, 10
                )
                internal = [e for e in excursions if e["interior"]]
                self.assertEqual(len(internal), 1)
                self.assertGreaterEqual(internal[0]["hold_time"], 10)
                self.assertAlmostEqual(profile[0]["alt"], 200)
                self.assertAlmostEqual(profile[-1]["alt"], 200)

    def test_insufficient_initial_turn_and_terminal_distance_are_rejected(self):
        for path in [[(-10, 50, 0), (50, 50, 0)], [(50, 50, 0), (110, 50, 0)]]:
            with self.subTest(path=path), self.assertRaises(ValueError):
                self.profile(path, bounds=(0, 100, 0, 100))
        route = connect_with_arcs(
            [[(0, 40), (100, 40)], [(100, 60), (0, 60)]], 5, greedy=False
        )
        with self.assertRaises(ValueError):
            self.profile(route.poses, bounds=(0, 100, 0, 100))

    def test_matching_own_and_target_altitudes_stay_constant(self):
        path = [(-100, 0, 0), (100, 0, 0)]
        profile = self.profile(path, own=200)
        assert_altitude_profile(self, profile, 200, 200, (-20, 20, -20, 20), 2, 10)
        self.assertTrue(all(row["alt"] == 200 for row in profile))

    def test_zero_length_path_preserves_pose_and_applicable_height(self):
        for pose, expected in [((-100, 0, 1.2), 100), ((0, 0, 1.2), 200)]:
            with self.subTest(pose=pose):
                profile = self.profile([pose])
                self.assertEqual(len(profile), 1)
                self.assertAlmostEqual(profile[0]["x"], pose[0])
                self.assertAlmostEqual(profile[0]["y"], pose[1])
                self.assertAlmostEqual(profile[0]["yaw"], pose[2])
                self.assertAlmostEqual(profile[0]["alt"], expected)
                self.assertEqual(profile[0]["s"], 0)
                self.assertEqual(profile[0]["time"], 0)


if __name__ == "__main__":
    unittest.main()
