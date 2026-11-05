"""生成、分配扫掠直线，并以Dubins曲线或Hybrid A*连接。"""

from __future__ import annotations

import itertools
import math
from collections.abc import Sequence

from shapely.geometry import LineString, Polygon
from shapely.geometry.base import BaseGeometry

if __package__:
    from .hybrid_astar import (
        Circle,
        Pose,
        Segment,
        World,
        advance,
        angle_difference,
        compact_path,
        dubins_candidates,
    )
    from .hybrid_sweep_planner import HybridSweepPlanner
else:
    from hybrid_astar import (
        Circle,
        Pose,
        Segment,
        World,
        advance,
        angle_difference,
        compact_path,
        dubins_candidates,
    )
    from hybrid_sweep_planner import HybridSweepPlanner

Point = tuple[float, float]
Polyline = list[Point]


class HeadingPolyline(list):
    """保存扫掠坐标、精确切向航向及访问顺序。"""

    def __init__(self, poses=()):
        self.poses = []
        self.order = []
        self.outside_connectors = []
        super().__init__()
        self.extend_poses(poses)

    def extend_poses(self, poses):
        for x, y, yaw in poses:
            self.append((float(x), float(y)))
            self.poses.append((float(x), float(y), float(yaw)))


def build_sweep_paths(
    polygon: Sequence[Point],
    line_spacing: float,
    *,
    orientation: str = "vertical",
    start_direction: str | None = None,
    edge_clearance: float | None = None,
) -> list[Polyline]:
    """按指定间距生成平行扫掠线，并裁剪至多边形内部。"""
    if line_spacing <= 0:
        raise ValueError("line_spacing must be > 0.")

    area = Polygon(polygon)
    if not area.is_valid or area.area <= 0:
        raise ValueError("polygon must enclose a valid, non-zero area.")

    axis = _normalize_orientation(orientation)
    forward = _normalize_start_direction(start_direction, axis)
    minx, miny, maxx, maxy = area.bounds
    clearance = edge_clearance if edge_clearance is not None else 0.5 * line_spacing
    if clearance < 0:
        raise ValueError("edge_clearance must be >= 0.")
    padding = max(line_spacing * 0.5, 1.0)

    sweep_lines: list[Polyline] = []
    if axis == "vertical":
        start_x = minx + clearance
        end_x = maxx - clearance
        if start_x > end_x:
            xs = [0.5 * (minx + maxx)]
        else:
            span = end_x - start_x
            steps = max(1, math.ceil(span / line_spacing))
            step = span / steps
            xs = [start_x + i * step for i in range(steps + 1)]
        for line_index, x in enumerate(xs):
            line = LineString([(x, miny - padding), (x, maxy + padding)])
            segments = _extract_segments(area.intersection(line))
            segments.sort(key=lambda line: min(line[0][1], line[1][1]))
            upward = forward if line_index % 2 == 0 else not forward
            for line in segments:
                oriented = line if upward else (line[1], line[0])
                sweep_lines.append([oriented[0], oriented[1]])
    else:
        start_y = miny + clearance
        end_y = maxy - clearance
        if start_y > end_y:
            ys = [0.5 * (miny + maxy)]
        else:
            span = end_y - start_y
            steps = max(1, math.ceil(span / line_spacing))
            step = span / steps
            ys = [start_y + i * step for i in range(steps + 1)]
        for line_index, y in enumerate(ys):
            line = LineString([(minx - padding, y), (maxx + padding, y)])
            segments = _extract_segments(area.intersection(line))
            segments.sort(key=lambda line: min(line[0][0], line[1][0]))
            rightward = forward if line_index % 2 == 0 else not forward
            for line in segments:
                oriented = line if rightward else (line[1], line[0])
                sweep_lines.append([oriented[0], oriented[1]])

    return sweep_lines


def connect_with_arcs(
    sweep_lines: Sequence[Polyline],
    min_radius: float,
    *,
    greedy: bool = True,
    arc_samples: int = 24,
    enforce_spacing: bool = True,
    order: Sequence[tuple[int, bool]] | None = None,
    obstacles: Sequence[Circle | tuple[float, float, float] | dict] | None = None,
    planner_config: dict | None = None,
    entry_pose: tuple[float, float, float] | None = None,
    entry_extension: float = 0.0,
    exit_extension: float = 0.0,
    sweep_bounds: tuple[float, float, float, float] | None = None,
    turn_transition_distance: float = 0.0,
    layer_hold_distance: float = 0.0,
) -> HeadingPolyline:
    """连接扫掠线；区外掉头预留直线升降段，转弯全程保持本机高度。"""
    if not math.isfinite(min_radius) or min_radius <= 0:
        raise ValueError("min_radius must be finite and positive.")
    for name, value in (
        ("entry_extension", entry_extension),
        ("exit_extension", exit_extension),
        ("turn_transition_distance", turn_transition_distance),
        ("layer_hold_distance", layer_hold_distance),
    ):
        if not math.isfinite(value) or value < 0:
            raise ValueError(f"{name} must be finite and nonnegative.")
    if sweep_bounds is not None:
        if (
            len(sweep_bounds) != 4
            or not all(math.isfinite(v) for v in sweep_bounds)
            or sweep_bounds[0] >= sweep_bounds[1]
            or sweep_bounds[2] >= sweep_bounds[3]
        ):
            raise ValueError("sweep_bounds must be finite (xmin, xmax, ymin, ymax).")
        sweep_bounds = tuple(sweep_bounds)
    elif turn_transition_distance or layer_hold_distance:
        raise ValueError("sweep_bounds is required for outside height transitions.")
    if not sweep_lines:
        return HeadingPolyline()
    if not math.isfinite(arc_samples):
        raise ValueError("arc_samples must be finite.")
    arc_samples = max(4, int(arc_samples))

    planner = world = None
    if obstacles is not None:
        if planner_config is None:
            raise ValueError(
                "planner_config is required when sweep obstacles are supplied."
            )
        config = dict(planner_config)
        config["min_turn_radius"] = min_radius
        obstacles = list(obstacles)
        planner = HybridSweepPlanner(**config)
        world = World(
            obstacles,
            planner.bounds,
            planner.obstacle_margin,
        )

    outside_world = (
        None if sweep_bounds is None else _OutsideSweepWorld(world, sweep_bounds)
    )
    minimum_turn_length = 2 * turn_transition_distance + layer_hold_distance
    outside_cache = {}

    def outside_connection(start, goal):
        key = (start.x, start.y, start.yaw, goal.x, goal.y, goal.yaw)
        if key not in outside_cache:
            ramp = Segment(turn_transition_distance, 0.0)
            departed = advance(start, 0.0, turn_transition_distance)
            pre_entry = advance(goal, 0.0, -turn_transition_distance)

            # 升降直线受阻时排除此方向，不能提前转弯代替。
            if not outside_world.segment_free(
                start, ramp
            ) or not outside_world.segment_free(pre_entry, ramp):
                outside_cache[key] = None
            else:
                level = _outside_sweep_connector(
                    departed, pre_entry, min_radius, layer_hold_distance, outside_world
                )
                outside_cache[key] = None if level is None else [ramp] + level + [ramp]
        return outside_cache[key]

    if entry_pose is not None:
        if len(entry_pose) != 3 or not all(math.isfinite(v) for v in entry_pose):
            raise ValueError("entry_pose must contain finite (x, y, yaw_radians).")
    if order is None:
        if greedy and (
            entry_pose is not None
            or entry_extension
            or exit_extension
            or outside_world is not None
        ):
            order = _choose_entry_and_sweep_order(
                sweep_lines,
                min_radius,
                enforce_spacing,
                None if entry_pose is None else Pose(*entry_pose),
                world,
                entry_extension,
                exit_extension,
                None if outside_world is None else outside_connection,
            )
        else:
            order = _choose_sweep_order(
                sweep_lines, min_radius, greedy, enforce_spacing, world=world
            )

    route = HeadingPolyline()
    route.order = list(order)
    previous_end = None
    previous_heading = None
    for position, (line_index, reverse_direction) in enumerate(order):
        line = _extended_sweep_line(
            sweep_lines[line_index],
            reverse_direction,
            entry_extension if position == 0 else 0.0,
            exit_extension if position == len(order) - 1 else 0.0,
        )
        start_point, start_heading, end_point, end_heading = _sweep_line_poses(
            line, False
        )
        line_poses = [(p[0], p[1], start_heading) for p in line]
        if world is not None:
            for a, b in zip(line, line[1:]):
                distance = math.hypot(b[0] - a[0], b[1] - a[1])
                line_start = Pose(a[0], a[1], math.atan2(b[1] - a[1], b[0] - a[0]))
                if not world.segment_free(line_start, Segment(distance, 0.0)):
                    raise RuntimeError(
                        "Sweep line intersects an inflated obstacle or map boundary."
                    )
        if not route:
            route.extend_poses(line_poses)
        else:
            same_position = (
                math.hypot(
                    start_point[0] - previous_end[0], start_point[1] - previous_end[1]
                )
                <= 1e-8
            )
            same_heading = (
                abs(angle_difference(start_heading, previous_heading)) <= 1e-10
            )
            if not same_position or not same_heading:
                if outside_world is not None:
                    connector_start = Pose(*previous_end, previous_heading)
                    connector_goal = Pose(*start_point, start_heading)
                    segments = outside_connection(connector_start, connector_goal)
                    if segments is None:
                        raise RuntimeError(
                            "No outside sweep connector satisfies the mandatory straight height-transition legs."
                        )
                    angular_step = math.pi / arc_samples
                    connector_poses = compact_path(
                        connector_start,
                        segments,
                        step=min_radius * angular_step,
                        max_arc_angle=angular_step,
                        world=outside_world,
                    )
                    first_index = len(route) - 1
                    route.outside_connectors.append(
                        {
                            "start_index": first_index,
                            "end_index": first_index + len(connector_poses) - 1,
                            "length_m": sum(segment.length for segment in segments),
                            "minimum_length_m": minimum_turn_length,
                            "transition_distance_m": turn_transition_distance,
                            "layer_hold_distance_m": layer_hold_distance,
                            "transition_mode": "straight_before_turn",
                            "outbound_straight_m": turn_transition_distance,
                            "inbound_straight_m": turn_transition_distance,
                            "level_length_m": sum(
                                segment.length for segment in segments
                            )
                            - 2 * turn_transition_distance,
                            "segments": [
                                (segment.length, segment.curvature)
                                for segment in segments
                            ],
                        }
                    )
                elif planner is None:
                    connector_poses = _dubins_connector_poses(
                        Pose(*previous_end, previous_heading),
                        Pose(*start_point, start_heading),
                        min_radius,
                        arc_samples,
                    )
                else:
                    planner.plan_to_pose(
                        previous_end,
                        math.degrees(previous_heading),
                        start_point,
                        math.degrees(start_heading),
                        obstacles,
                    )
                    angular_step = math.pi / arc_samples
                    connector_poses = compact_path(
                        Pose(*previous_end, previous_heading),
                        planner.segments,
                        step=min_radius * angular_step,
                        max_arc_angle=angular_step,
                        world=world,
                    )
                route.extend_poses(connector_poses[1:])
            route.extend_poses(line_poses[1:])
        previous_end, previous_heading = end_point, end_heading
    return route


def _extract_segments(geometry: BaseGeometry) -> list[tuple[Point, Point]]:
    if geometry.is_empty:
        return []

    if geometry.geom_type == "LineString":
        coords = list(geometry.coords)
        if len(coords) >= 2:
            return [(tuple(coords[0]), tuple(coords[-1]))]
        return []

    if geometry.geom_type in ("MultiLineString", "GeometryCollection"):
        segments: list[tuple[Point, Point]] = []
        for geometry_part in geometry.geoms:
            segments.extend(_extract_segments(geometry_part))
        return segments

    return []


def _normalize_orientation(orientation: str) -> str:
    o = orientation.lower()
    if o in ("vertical", "up-down", "updown", "ud"):
        return "vertical"
    if o in ("horizontal", "left-right", "leftright", "lr"):
        return "horizontal"
    raise ValueError(
        "orientation must be 'vertical'/'up-down' or 'horizontal'/'left-right'."
    )


def _normalize_start_direction(start: str | None, axis: str) -> bool:
    if start is None:
        return axis == "vertical"
    s = start.lower()
    if axis == "vertical":
        if s in ("up", "top", "north"):
            return True
        if s in ("down", "bottom", "south"):
            return False
    else:
        if s in ("right", "east"):
            return True
        if s in ("left", "west"):
            return False
    raise ValueError("start_direction not understood for the chosen orientation.")


def _sweep_line_poses(
    path: Polyline, reverse_direction: bool
) -> tuple[Point, float, Point, float]:
    line = path[::-1] if reverse_direction else path
    start, end = line[0], line[-1]
    heading = math.atan2(end[1] - start[1], end[0] - start[0])
    return start, heading, end, heading


def _polyline_length(path: Polyline) -> float:
    return sum(
        math.hypot(end[0] - start[0], end[1] - start[1])
        for start, end in zip(path, path[1:])
    )


def assign_paths_to_drones(
    sweep_lines: Sequence[Polyline], drone_count: int
) -> list[list[int]]:
    """先分配长扫掠线，每次选择当前航程最短的无人机。"""
    if drone_count <= 0 or not sweep_lines:
        return []
    active_count = min(drone_count, len(sweep_lines))
    lengths = [_polyline_length(p) for p in sweep_lines]
    order = sorted(
        range(len(sweep_lines)),
        key=lambda line_index: lengths[line_index],
        reverse=True,
    )
    assignments = [{"total": 0.0, "indices": []} for _ in range(active_count)]
    for line_index in order:
        target = min(assignments, key=lambda b: b["total"])
        target["indices"].append(line_index)
        target["total"] += lengths[line_index]
    return [b["indices"] for b in assignments]


def _sweep_axis(sweep_lines: Sequence[Polyline]) -> str | None:
    for p in sweep_lines:
        if len(p) < 2:
            continue
        dx = abs(p[-1][0] - p[0][0])
        dy = abs(p[-1][1] - p[0][1])
        if dx < 1e-6 and dy >= 1e-6:
            return "vertical"
        if dy < 1e-6 and dx >= 1e-6:
            return "horizontal"
    return None


def _sweep_line_offset(path: Polyline, axis: str | None) -> float | None:
    if axis is None or len(path) < 2:
        return None
    if axis == "vertical":
        return 0.5 * (path[0][0] + path[-1][0])
    return 0.5 * (path[0][1] + path[-1][1])


class _OutsideSweepWorld:
    """同时检查障碍物、地图边界与扫掠区域内部禁入约束。"""

    def __init__(self, world, bounds):
        self.world = world
        self.sweep_bounds = bounds

    def _inside(self, x, y):
        xmin, xmax, ymin, ymax = self.sweep_bounds
        return xmin + 1e-7 < x < xmax - 1e-7 and ymin + 1e-7 < y < ymax - 1e-7

    def point_free(self, pose):
        return (self.world is None or self.world.point_free(pose)) and not self._inside(
            pose.x, pose.y
        )

    def segment_free(self, start, segment):
        if self.world is not None and not self.world.segment_free(start, segment):
            return False
        end = advance(start, segment.curvature, segment.length)
        if not self.point_free(start) or not self.point_free(end):
            return False
        cuts = [0.0, segment.length]
        if abs(segment.curvature) < 1e-12:
            for value in self.sweep_bounds[:2]:
                if abs(end.x - start.x) > 1e-12:
                    fraction = (value - start.x) / (end.x - start.x)
                    if 0 < fraction < 1:
                        cuts.append(fraction * segment.length)
            for value in self.sweep_bounds[2:]:
                if abs(end.y - start.y) > 1e-12:
                    fraction = (value - start.y) / (end.y - start.y)
                    if 0 < fraction < 1:
                        cuts.append(fraction * segment.length)
        else:
            curvature = segment.curvature
            cx = start.x - math.sin(start.yaw) / curvature
            cy = start.y + math.cos(start.yaw) / curvature
            radius = abs(1 / curvature)
            first = math.atan2(start.y - cy, start.x - cx)
            direction = 1 if curvature > 0 else -1
            angles = []
            for value in self.sweep_bounds[:2]:
                ratio = (value - cx) / radius
                if abs(ratio) <= 1:
                    angle = math.acos(ratio)
                    angles.extend((angle, -angle))
            for value in self.sweep_bounds[2:]:
                ratio = (value - cy) / radius
                if abs(ratio) <= 1:
                    angle = math.asin(ratio)
                    angles.extend((angle, math.pi - angle))
            revolutions = math.ceil(abs(curvature) * segment.length / (2 * math.pi))
            for angle in angles:
                offset = (direction * (angle - first)) % (2 * math.pi)
                for revolution in range(revolutions + 1):
                    distance = (offset + revolution * 2 * math.pi) * radius
                    if 1e-8 < distance < segment.length - 1e-8:
                        cuts.append(distance)
        cuts.sort()
        for first, last in zip(cuts, cuts[1:]):
            middle = advance(start, segment.curvature, (first + last) / 2)
            if self._inside(middle.x, middle.y):
                return False
        return True

    def path_free(self, start, segments):
        if not self.point_free(start):
            return False
        for segment in segments:
            if not self.segment_free(start, segment):
                return False
            start = advance(start, segment.curvature, segment.length)
        return True


def _outside_sweep_connector(start, goal, radius, minimum_length, world):
    """在区域外选择满足本机高度保持距离的解析转弯。"""
    candidates = dubins_candidates(start, goal, radius)
    best = None

    def consider(segments):
        nonlocal best
        length = sum(s.length for s in segments)
        if length + 1e-6 < minimum_length or (
            best is not None and length >= best[0] - 1e-7
        ):
            return
        if world.path_free(start, segments):
            best = (length, segments)

    for segments in candidates:
        consider(segments)
    outward = (math.cos(start.yaw), math.sin(start.yaw))
    parallel_offset = (goal.x - start.x) * outward[0] + (goal.y - start.y) * outward[1]
    opposite = abs(abs(angle_difference(goal.yaw, start.yaw)) - math.pi) < 1e-7
    if opposite and abs(parallel_offset) < 1e-5:
        for segments in candidates:
            base_length = sum(s.length for s in segments)
            extra = max(0.0, (minimum_length - base_length) / 2)
            if extra <= 1e-8:
                continue
            extended = [Segment(extra, 0.0)] + segments + [Segment(extra, 0.0)]
            consider(extended)
            if best is not None and best[0] <= minimum_length + 1e-6:
                return best[1]
    if best is not None and best[0] <= minimum_length + 1e-6:
        return best[1]

    if (
        candidates
        and best is not None
        and best[0] <= sum(s.length for s in candidates[0]) + 1e-6
    ):
        return best[1]

    tangent = (-outward[1], outward[0])
    midpoint = ((start.x + goal.x) / 2, (start.y + goal.y) / 2)
    headings = sorted(
        {
            angle_difference(angle, 0.0)
            for angle in (
                start.yaw,
                goal.yaw,
                start.yaw + math.pi / 2,
                start.yaw - math.pi / 2,
            )
        }
    )
    for multiplier in (1.0, 1.5, 2.0, 2.5, 3.0):
        for offset in (-radius, 0.0, radius):
            x = midpoint[0] + outward[0] * multiplier * radius + tangent[0] * offset
            y = midpoint[1] + outward[1] * multiplier * radius + tangent[1] * offset
            for heading in headings:
                via = Pose(x, y, heading)
                if not world.point_free(via):
                    continue
                incoming = [
                    segments
                    for segments in dubins_candidates(start, via, radius)
                    if world.path_free(start, segments)
                ]
                outgoing = [
                    segments
                    for segments in dubins_candidates(via, goal, radius)
                    if world.path_free(via, segments)
                ]
                for first, last in itertools.product(incoming, outgoing):
                    length = sum(s.length for s in first + last)
                    if length + 1e-6 >= minimum_length and (
                        best is None or length < best[0] - 1e-7
                    ):
                        best = (length, first + last)
    return None if best is None else best[1]


def _extended_sweep_line(
    path, reverse_direction=False, entry_extension=0.0, exit_extension=0.0
):
    line = list(path[::-1] if reverse_direction else path)
    first, heading, last, _ = _sweep_line_poses(line, False)
    ux, uy = math.cos(heading), math.sin(heading)
    if entry_extension:
        line[0] = (first[0] - entry_extension * ux, first[1] - entry_extension * uy)
    if exit_extension:
        line[-1] = (last[0] + exit_extension * ux, last[1] + exit_extension * uy)
    return line


def _choose_entry_and_sweep_order(
    sweep_lines,
    min_radius,
    enforce_spacing,
    entry,
    world,
    entry_extension=0.0,
    exit_extension=0.0,
    body_connector=None,
):
    """联合比较进场与扫掠连接代价，候选排序不执行混合搜索。"""
    count = len(sweep_lines)
    if count <= 2:
        candidates = [
            [
                (index, reverse_direction)
                for index, reverse_direction in zip(indices, directions)
            ]
            for indices in itertools.permutations(range(count))
            for directions in itertools.product((False, True), repeat=count)
        ]
    else:
        seed_count = min(count, 8)
        seeds = sorted(
            {round(i * (count - 1) / (seed_count - 1)) for i in range(seed_count)}
        )
        candidates = []
        for first in seeds:
            indices = [first] + [i for i in range(count) if i != first]
            for reversed_first in (False, True):
                seeded = [
                    sweep_lines[i][::-1]
                    if i == first and reversed_first
                    else sweep_lines[i]
                    for i in indices
                ]
                local = _choose_sweep_order(
                    seeded, min_radius, True, enforce_spacing, world=world
                )
                candidates.append(
                    [
                        (
                            indices[i],
                            bool(reverse_direction) ^ (i == 0 and reversed_first),
                        )
                        for i, reverse_direction in local
                    ]
                )

    cache = {}

    def connection_cost(start, goal):
        key = (start.x, start.y, start.yaw, goal.x, goal.y, goal.yaw)
        if key not in cache:
            connections = dubins_candidates(start, goal, min_radius)
            if not connections:
                cache[key] = (False, math.inf)
            else:
                fallback_length = sum(s.length for s in connections[0])
                result = (False, fallback_length)
                for segments in connections:
                    if world is None or world.path_free(start, segments):
                        result = (True, sum(s.length for s in segments))
                        break
                cache[key] = result
        return cache[key]

    scored = []
    for order in candidates:
        previous = entry
        length = 0.0
        complete_direct = True
        body_direct = True
        lines_free = True
        for position, (index, reverse_direction) in enumerate(order):
            line = _extended_sweep_line(
                sweep_lines[index],
                reverse_direction,
                entry_extension if position == 0 else 0.0,
                exit_extension if position == len(order) - 1 else 0.0,
            )
            first, heading, last, last_heading = _sweep_line_poses(line, False)
            if world is not None:
                for a, b in zip(line, line[1:]):
                    distance = math.hypot(b[0] - a[0], b[1] - a[1])
                    start = Pose(a[0], a[1], math.atan2(b[1] - a[1], b[0] - a[0]))
                    if not world.segment_free(start, Segment(distance, 0.0)):
                        lines_free = False
                        break
            if not lines_free:
                break
            target = Pose(first[0], first[1], heading)
            if position > 0 and body_connector is not None:
                segments = body_connector(previous, target)
                if segments is None:
                    lines_free = False
                    break
                direct, cost = True, sum(segment.length for segment in segments)
            else:
                direct, cost = (
                    (True, 0.0)
                    if previous is None
                    else connection_cost(previous, target)
                )
            complete_direct = complete_direct and direct
            if position > 0:
                body_direct = body_direct and direct
            length += cost + _polyline_length(line)
            previous = Pose(last[0], last[1], last_heading)

        if lines_free:
            scored.append((not complete_direct, not body_direct, length, tuple(order)))
    if not scored:
        if body_connector is not None:
            raise RuntimeError(
                "No sweep order satisfies mandatory straight height-transition legs, outside turns, obstacles, and map boundaries."
            )
        raise RuntimeError(
            "Sweep lines or terminal extensions intersect obstacles or map boundaries."
        )
    _, _, length, best = min(scored)
    if not math.isfinite(length):
        raise RuntimeError("No valid analytic candidate for the sweep entry.")
    return list(best)


def _choose_sweep_order(
    sweep_lines: Sequence[Polyline],
    min_radius: float,
    greedy: bool,
    enforce_spacing: bool,
    world: World | None = None,
) -> list[tuple[int, bool]]:
    if not sweep_lines:
        return []
    axis = _sweep_axis(sweep_lines)
    line_offsets = (
        [_sweep_line_offset(p, axis) for p in sweep_lines]
        if axis
        else [None] * len(sweep_lines)
    )
    remaining = list(range(1, len(sweep_lines)))
    order = [(0, False)]
    _, _, current_point, current_heading = _sweep_line_poses(sweep_lines[0], False)
    current_offset = line_offsets[0]
    while remaining:
        if not greedy:
            chosen_index, chosen_reverse = remaining[0], False
        else:
            choices = []
            for line_index in remaining:
                line_offset = line_offsets[line_index]
                spacing_ok = (
                    not enforce_spacing
                    or current_offset is None
                    or line_offset is None
                    or abs(line_offset - current_offset) + 1e-9 >= 2 * min_radius
                )
                for reverse_direction in (False, True):
                    start_point, start_heading, _, _ = _sweep_line_poses(
                        sweep_lines[line_index], reverse_direction
                    )
                    start = Pose(current_point[0], current_point[1], current_heading)
                    goal = Pose(start_point[0], start_point[1], start_heading)
                    candidates = dubins_candidates(start, goal, min_radius)
                    if not candidates:
                        continue
                    geometric_length = sum(s.length for s in candidates[0])
                    direct_length = None
                    for segments in candidates:
                        if world is None or world.path_free(start, segments):
                            direct_length = sum(s.length for s in segments)
                            break
                    choices.append(
                        (
                            direct_length is None,
                            not spacing_ok,
                            geometric_length
                            if direct_length is None
                            else direct_length,
                            line_index,
                            reverse_direction,
                        )
                    )
            if not choices:
                raise RuntimeError("No Dubins candidate between remaining sweep lines.")
            _, _, _, chosen_index, chosen_reverse = min(choices)
        remaining.remove(chosen_index)
        order.append((chosen_index, chosen_reverse))
        _, _, current_point, current_heading = _sweep_line_poses(
            sweep_lines[chosen_index], chosen_reverse
        )
        current_offset = line_offsets[chosen_index]
    return order


def _dubins_connector_poses(start, goal, min_radius, arc_samples):
    if not all(
        math.isfinite(value)
        for value in (start.x, start.y, start.yaw, goal.x, goal.y, goal.yaw)
    ):
        raise ValueError("Dubins endpoints must be finite.")
    candidates = dubins_candidates(start, goal, min_radius)
    if not candidates:
        raise RuntimeError("No Dubins connector between sweep segments.")
    angular_step = math.pi / arc_samples
    return compact_path(
        start, candidates[0], step=min_radius * angular_step, max_arc_angle=angular_step
    )
