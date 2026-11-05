"""校验不同障碍形状的完整航段碰撞、真实净空和规划输出。"""

import math
import random
import unittest

from shapely.geometry import LineString, Point, Polygon

from planner.hybrid_astar import Circle, Pose, Segment, World, advance, _arc_edge_distance
from planner.hybrid_sweep_planner import HybridSweepPlanner
from planner.sweep_routes import connect_with_arcs


class ObstacleGeometryTests(unittest.TestCase):
    def test_circle_representations_preserve_exact_collision_checks(self):
        representations = [
            Circle(0, 0, 3),
            (0, 0, 3),
            {"type": "circle", "center": [0, 0], "radius": 3, "id": "circle_1"},
        ]
        for obstacle in representations:
            with self.subTest(obstacle=obstacle):
                world = World([obstacle], (-20, 20, -20, 20), 1)
                self.assertFalse(world.point_free(Pose(4, 0, 0)))
                self.assertTrue(world.point_free(Pose(4.001, 0, 0)))
                self.assertFalse(world.segment_free(Pose(-10, 4, 0), Segment(20, 0)))
                self.assertTrue(world.segment_free(Pose(-10, 4.001, 0), Segment(20, 0)))
                self.assertFalse(
                    world.segment_free(Pose(4, -10, math.pi / 2), Segment(20, 0))
                )

    def test_rotated_rectangle_uses_oriented_edges(self):
        obstacle = {
            "type": "rectangle",
            "center": [0, 0],
            "width": 4,
            "height": 2,
            "rotation_deg": 45,
        }
        world = World([obstacle], (-20, 20, -20, 20), 0)
        self.assertFalse(world.point_free(Pose(1, 1, 0)))
        self.assertTrue(world.point_free(Pose(1.8, 0, 0)))
        self.assertFalse(world.segment_free(Pose(-5, 0, 0), Segment(10, 0)))
        self.assertTrue(world.segment_free(Pose(-5, 3, 0), Segment(10, 0)))

    def test_concave_polygon_preserves_open_notch(self):
        obstacle = {
            "type": "polygon",
            "vertices": [[0, 0], [8, 0], [8, 2], [2, 2], [2, 8], [0, 8]],
        }
        world = World([obstacle], (-20, 20, -20, 20), 0)
        self.assertFalse(world.point_free(Pose(1, 6, 0)))
        self.assertTrue(world.point_free(Pose(6, 6, 0)))
        self.assertTrue(
            world.segment_free(Pose(3, 3, math.pi / 4), Segment(math.sqrt(32), 0))
        )
        self.assertFalse(world.segment_free(Pose(-1, 6, 0), Segment(8, 0)))

    def test_polygon_clearance_includes_edges_and_vertices(self):
        obstacle = {"type": "polygon", "vertices": [[0, 0], [4, 0], [4, 4], [0, 4]]}
        world = World([obstacle], (-20, 20, -20, 20), 1)
        self.assertFalse(world.point_free(Pose(5, 2, 0)))
        self.assertTrue(world.point_free(Pose(5.001, 2, 0)))
        self.assertFalse(world.point_free(Pose(4.6, 4.6, 0)))
        self.assertTrue(world.point_free(Pose(4.8, 4.8, 0)))
        self.assertFalse(world.segment_free(Pose(-2, 5, 0), Segment(8, 0)))
        self.assertTrue(world.segment_free(Pose(-2, 5.001, 0), Segment(8, 0)))

    def test_arc_hits_polygon_while_its_chord_is_clear(self):
        obstacle = {
            "type": "polygon",
            "vertices": [[-0.2, 9.8], [0.2, 9.8], [0.2, 10.2], [-0.2, 10.2]],
        }
        world = World([obstacle], (-20, 20, -20, 20), 0)
        self.assertTrue(world.segment_free(Pose(-10, 0, 0), Segment(20, 0)))
        self.assertFalse(
            world.segment_free(Pose(10, 0, math.pi / 2), Segment(10 * math.pi, 0.1))
        )
        self.assertFalse(
            world.segment_free(Pose(-10, 0, math.pi / 2), Segment(10 * math.pi, -0.1))
        )
        self.assertFalse(
            world.segment_free(Pose(10, 0, math.pi / 2), Segment(25 * math.pi, 0.1))
        )

    def test_arc_clearance_uses_distance_to_polygon_edge(self):
        obstacle = {"type": "rectangle", "center": [0, 11.25], "width": 2, "height": 1}
        start, arc = Pose(10, 0, math.pi / 2), Segment(10 * math.pi, 0.1)
        self.assertTrue(
            World([obstacle], (-20, 20, -20, 20), 0.7).segment_free(start, arc)
        )
        self.assertFalse(
            World([obstacle], (-20, 20, -20, 20), 0.75).segment_free(start, arc)
        )
        self.assertFalse(
            World([obstacle], (-20, 20, -20, 20), 0.8).segment_free(start, arc)
        )
        inner = {"type": "rectangle", "center": [0, 0], "width": 2, "height": 2}
        self.assertTrue(World([inner], (-20, 20, -20, 20), 0).segment_free(start, arc))

    def test_invalid_polygons_and_rectangles_are_rejected(self):
        invalid_vertices = [
            [[0, 0], [4, 4], [0, 4], [4, 0]],
            [[0, 0], [4, 0], [2, 0], [2, 4], [0, 4]],
            [[0, 0], [4, 0], [4, 4], [2, 0], [0, 4]],
            [[0, 0], [1, 0], [2, 0]],
            [[0, 0], [0, 0], [1, 1]],
            [[0, 0], [1, float("nan")], [1, 1]],
        ]
        for vertices in invalid_vertices:
            with self.subTest(vertices=vertices), self.assertRaises(ValueError):
                World(
                    [{"type": "polygon", "vertices": vertices}], (-20, 20, -20, 20), 0
                )
        for dimension in (0, -1, float("inf")):
            with self.subTest(width=dimension), self.assertRaises(ValueError):
                World(
                    [
                        {
                            "type": "rectangle",
                            "center": [0, 0],
                            "width": dimension,
                            "height": 2,
                        }
                    ],
                    (-20, 20, -20, 20),
                    0,
                )
        closed = {"type": "polygon", "vertices": [[0, 0], [2, 0], [0, 2], [0, 0]]}
        self.assertFalse(
            World([closed], (-20, 20, -20, 20), 0).point_free(Pose(0.2, 0.2, 0))
        )

    def test_arc_edge_distance_matches_independent_dense_reference(self):
        generator = random.Random(8413)
        for _ in range(80):
            center = (generator.uniform(-10, 10), generator.uniform(-10, 10))
            radius = generator.uniform(0.5, 12)
            first = generator.uniform(-math.pi, math.pi)
            sweep = generator.uniform(0.01, 7)
            direction = generator.choice((-1, 1))
            edge_start = (generator.uniform(-15, 15), generator.uniform(-15, 15))
            edge_end = (generator.uniform(-15, 15), generator.uniform(-15, 15))
            arc_points = [
                (
                    center[0]
                    + radius * math.cos(first + direction * sweep * index / 400),
                    center[1]
                    + radius * math.sin(first + direction * sweep * index / 400),
                )
                for index in range(401)
            ]
            reference = LineString(arc_points).distance(
                LineString([edge_start, edge_end])
            )
            analytic = _arc_edge_distance(
                center,
                radius,
                first,
                sweep,
                direction,
                arc_points[0],
                arc_points[-1],
                edge_start,
                edge_end,
            )
            maximum_chord_error = radius * (1 - math.cos(sweep / 800))
            self.assertLessEqual(abs(analytic - reference), maximum_chord_error + 1e-8)

    def test_search_avoids_rectangle_and_concave_polygon_with_safe_chords(self):
        rectangle_vertices = []
        for x, y in ((-12, -15), (12, -15), (12, 15), (-12, 15)):
            angle = math.radians(25)
            rectangle_vertices.append(
                (
                    55 + x * math.cos(angle) - y * math.sin(angle),
                    x * math.sin(angle) + y * math.cos(angle),
                )
            )
        shapes = [
            (
                {
                    "type": "rectangle",
                    "center": [55, 0],
                    "width": 24,
                    "height": 30,
                    "rotation_deg": 25,
                },
                Polygon(rectangle_vertices),
            ),
            (
                {
                    "type": "polygon",
                    "vertices": [
                        [40, -15],
                        [65, -15],
                        [65, 15],
                        [55, 15],
                        [55, 5],
                        [40, 5],
                    ],
                },
                Polygon([[40, -15], [65, -15], [65, 15], [55, 15], [55, 5], [40, 5]]),
            ),
        ]
        for obstacle, geometry in shapes:
            with self.subTest(shape=obstacle["type"]):
                planner = HybridSweepPlanner(
                    world_min=-70,
                    world_max=180,
                    sample_step=10000,
                    min_turn_radius=10,
                    speed=20,
                    obstacle_margin=2,
                    shortcut_attempts=30,
                )
                path, statistics = planner.plan((0, 0), 0, (120, 0), [obstacle])
                self.assertGreater(statistics["expanded_nodes"], 0)
                self.assertEqual(path[0], (0.0, 0.0, 0.0))
                self.assertAlmostEqual(path[-1][0], 120)
                self.assertAlmostEqual(path[-1][1], 0)
                self.assertGreaterEqual(
                    LineString([(x, y) for x, y, _ in path]).distance(geometry),
                    2 - 1e-8,
                )
                pose = Pose(*path[0])
                for segment in planner.segments:
                    for index in range(101):
                        sample = advance(
                            pose, segment.curvature, segment.length * index / 100
                        )
                        self.assertGreaterEqual(
                            Point(sample.x, sample.y).distance(geometry), 2 - 1e-8
                        )
                    pose = advance(pose, segment.curvature, segment.length)

    def test_sweep_connectors_accept_shape_dictionaries(self):
        config = dict(
            world_min=-30,
            world_max=150,
            sample_step=2,
            min_turn_radius=10,
            speed=20,
            obstacle_margin=1,
        )
        obstacle = {
            "type": "rectangle",
            "center": [50, 50],
            "width": 20,
            "height": 10,
            "rotation_deg": 30,
        }
        route = connect_with_arcs(
            [[(0, 0), (100, 0)]], 10, obstacles=[obstacle], planner_config=config
        )
        self.assertEqual(route.poses, [(0, 0, 0), (100, 0, 0)])
        blocked = dict(obstacle, center=[50, 0])
        with self.assertRaises(RuntimeError):
            connect_with_arcs(
                [[(0, 0), (100, 0)]], 10, obstacles=[blocked], planner_config=config
            )


if __name__ == "__main__":
    unittest.main()
