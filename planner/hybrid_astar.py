"""障碍物距离场引导的前进型Hybrid A*，通过Dubins解析连接到达目标。"""

from dataclasses import dataclass
import heapq
import itertools
import math
import random
import time

TAU = 2.0 * math.pi
EPS = 1e-8


def angle_difference(a, b):
    return (a - b + math.pi) % TAU - math.pi


@dataclass(frozen=True)
class Pose:
    """平面位置及弧度航向；目标航向可为空。"""

    x: float
    y: float
    yaw: float | None


@dataclass(frozen=True)
class Circle:
    x: float
    y: float
    radius: float


@dataclass(frozen=True)
class _PolygonObstacle:
    vertices: tuple
    margin: float = 0.0

    @property
    def edges(self):
        return zip(self.vertices, self.vertices[1:] + self.vertices[:1])


def _point_segment_distance(point, start, end):
    dx, dy = end[0] - start[0], end[1] - start[1]
    norm_squared = dx * dx + dy * dy
    fraction = (
        0.0
        if norm_squared == 0
        else max(
            0.0,
            min(
                1.0,
                ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy)
                / norm_squared,
            ),
        )
    )
    return math.hypot(
        point[0] - start[0] - fraction * dx, point[1] - start[1] - fraction * dy
    )


def _cross_product(start, end, point):
    return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (
        point[0] - start[0]
    )


def _segment_distance(first_start, first_end, second_start, second_end):
    first_side = _cross_product(first_start, first_end, second_start)
    second_side = _cross_product(first_start, first_end, second_end)
    third_side = _cross_product(second_start, second_end, first_start)
    fourth_side = _cross_product(second_start, second_end, first_end)
    if first_side * second_side < 0 and third_side * fourth_side < 0:
        return 0.0
    return min(
        _point_segment_distance(first_start, second_start, second_end),
        _point_segment_distance(first_end, second_start, second_end),
        _point_segment_distance(second_start, first_start, first_end),
        _point_segment_distance(second_end, first_start, first_end),
    )


def _point_in_polygon(point, polygon):
    inside = False
    for start, end in polygon.edges:
        if _point_segment_distance(point, start, end) <= EPS:
            return True
        if (start[1] > point[1]) != (end[1] > point[1]):
            crossing_x = start[0] + (point[1] - start[1]) * (end[0] - start[0]) / (
                end[1] - start[1]
            )
            if point[0] < crossing_x:
                inside = not inside
    return inside


def _coordinate_pair(value, name):
    try:
        if len(value) != 2 or not all(
            isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
            for v in value
        ):
            raise ValueError
        return float(value[0]), float(value[1])
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must contain two finite coordinates") from error


def _normalize_polygon(vertices):
    try:
        points = tuple(_coordinate_pair(value, "polygon vertex") for value in vertices)
    except TypeError as error:
        raise ValueError(
            "polygon vertices must be a sequence of coordinates"
        ) from error
    if len(points) > 1 and points[0] == points[-1]:
        points = points[:-1]
    if len(points) < 3:
        raise ValueError("polygon must contain at least three distinct vertices")
    polygon = _PolygonObstacle(points)
    edges = tuple(polygon.edges)
    for index, (start, end) in enumerate(edges):
        if math.hypot(end[0] - start[0], end[1] - start[1]) <= EPS:
            raise ValueError("polygon edges must have positive length")
        previous = points[index - 1]
        if (
            abs(_cross_product(previous, start, end)) <= EPS
            and (
                (previous[0] - start[0]) * (end[0] - start[0])
                + (previous[1] - start[1]) * (end[1] - start[1])
            )
            > 0
        ):
            raise ValueError("polygon must not overlap itself")
        for other_index in range(index + 1, len(edges)):
            if other_index == index + 1 or (
                index == 0 and other_index == len(edges) - 1
            ):
                continue
            if _segment_distance(start, end, *edges[other_index]) <= EPS:
                raise ValueError("polygon must not intersect itself")
    origin_x, origin_y = points[0]
    area_twice = sum(
        (start[0] - origin_x) * (end[1] - origin_y)
        - (end[0] - origin_x) * (start[1] - origin_y)
        for start, end in edges
    )
    if abs(area_twice) <= EPS:
        raise ValueError("polygon must enclose a nonempty area")
    return polygon


def _normalize_obstacle(obstacle):
    if isinstance(obstacle, Circle):
        circle = obstacle
    elif isinstance(obstacle, dict):
        shape = obstacle.get("type")
        if shape == "circle":
            center_x, center_y = _coordinate_pair(
                obstacle.get("center"), "circle center"
            )
            circle = Circle(center_x, center_y, obstacle.get("radius"))
        elif shape == "polygon":
            return _normalize_polygon(obstacle.get("vertices"))
        elif shape == "rectangle":
            center_x, center_y = _coordinate_pair(
                obstacle.get("center"), "rectangle center"
            )
            width, height = obstacle.get("width"), obstacle.get("height")
            rotation = obstacle.get("rotation_deg", 0.0)
            if (
                not all(
                    isinstance(value, (int, float))
                    and not isinstance(value, bool)
                    and math.isfinite(value)
                    for value in (width, height, rotation)
                )
                or width <= 0
                or height <= 0
            ):
                raise ValueError(
                    "rectangle dimensions must be finite and positive; rotation must be finite"
                )
            angle = math.radians(rotation)
            cosine, sine = math.cos(angle), math.sin(angle)
            return _normalize_polygon(
                tuple(
                    (center_x + x * cosine - y * sine, center_y + x * sine + y * cosine)
                    for x, y in (
                        (-width / 2, -height / 2),
                        (width / 2, -height / 2),
                        (width / 2, height / 2),
                        (-width / 2, height / 2),
                    )
                )
            )
        else:
            raise ValueError("obstacle type must be circle, rectangle or polygon")
    else:
        try:
            circle = Circle(*obstacle)
        except (TypeError, ValueError) as error:
            raise ValueError("circle must contain x, y and radius") from error
    if (
        not all(
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
            for value in (circle.x, circle.y, circle.radius)
        )
        or circle.radius < 0
    ):
        raise ValueError("circle values must be finite; radius must be nonnegative")
    return circle


def _arc_edge_distance(
    center, radius, first, sweep, direction, arc_start, arc_end, edge_start, edge_end
):
    """枚举端点、圆线交点及共同法线，解析求圆弧与线段的最短距离。"""
    center_x, center_y = center

    def on_arc(angle):
        return (direction * (angle - first)) % TAU <= sweep + EPS

    def point_arc_distance(point):
        distance = min(
            math.hypot(point[0] - arc_start[0], point[1] - arc_start[1]),
            math.hypot(point[0] - arc_end[0], point[1] - arc_end[1]),
        )
        angle = math.atan2(point[1] - center_y, point[0] - center_x)
        if on_arc(angle):
            distance = min(
                distance,
                abs(math.hypot(point[0] - center_x, point[1] - center_y) - radius),
            )
        return distance

    distance = min(
        _point_segment_distance(arc_start, edge_start, edge_end),
        _point_segment_distance(arc_end, edge_start, edge_end),
        point_arc_distance(edge_start),
        point_arc_distance(edge_end),
    )
    dx, dy = edge_end[0] - edge_start[0], edge_end[1] - edge_start[1]
    norm_squared = dx * dx + dy * dy
    projection = (
        (center_x - edge_start[0]) * dx + (center_y - edge_start[1]) * dy
    ) / norm_squared
    nearest_x, nearest_y = (
        edge_start[0] + projection * dx,
        edge_start[1] + projection * dy,
    )
    radial_squared = (
        radius * radius - (nearest_x - center_x) ** 2 - (nearest_y - center_y) ** 2
    )
    if radial_squared >= -EPS:
        offset = math.sqrt(max(0.0, radial_squared) / norm_squared)
        for fraction in (projection - offset, projection + offset):
            if -EPS <= fraction <= 1 + EPS:
                x, y = edge_start[0] + fraction * dx, edge_start[1] + fraction * dy
                if on_arc(math.atan2(y - center_y, x - center_x)):
                    return 0.0
    normal = math.atan2(dy, dx) + math.pi / 2
    for angle in (normal, normal + math.pi):
        if on_arc(angle):
            point = (
                center_x + radius * math.cos(angle),
                center_y + radius * math.sin(angle),
            )
            distance = min(
                distance, _point_segment_distance(point, edge_start, edge_end)
            )
    return distance


@dataclass(frozen=True)
class Segment:
    """按真实弧长描述的恒曲率前进航段。"""

    length: float
    curvature: float


@dataclass(frozen=True)
class HybridAStarConfig:
    min_turn_radius: float = 15.0
    obstacle_margin: float = 3.0
    xy_resolution: float = 4.0
    yaw_resolution_deg: float = 10.0
    primitive_length: float = 8.0
    max_expansions: int = 60000
    timeout_s: float = 30.0
    shot_interval: int = 10
    shortcut_attempts: int = 60

    def __post_init__(self):
        for name in (
            "min_turn_radius",
            "xy_resolution",
            "yaw_resolution_deg",
            "primitive_length",
            "timeout_s",
        ):
            value = getattr(self, name)
            if not math.isfinite(value) or value <= 0:
                raise ValueError(f"{name} must be finite and positive")
        if not math.isfinite(self.obstacle_margin) or self.obstacle_margin < 0:
            raise ValueError("obstacle_margin must be finite and nonnegative")
        if self.yaw_resolution_deg > 180:
            raise ValueError("yaw_resolution_deg must be <= 180")
        for name in ("max_expansions", "shot_interval", "shortcut_attempts"):
            value = getattr(self, name)
            minimum = 0 if name == "shortcut_attempts" else 1
            if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
                raise ValueError(f"{name} must be an integer >= {minimum}")


@dataclass
class PlanningResult:
    success: bool
    message: str
    segments: list
    expanded_nodes: int
    elapsed_s: float
    raw_length: float = 0.0

    @property
    def length(self):
        return sum(seg.length for seg in self.segments)


@dataclass(frozen=True, slots=True)
class _SearchState:
    pose: Pose
    path_cost: float
    parent_index: int | None
    incoming_segment: Segment | None


def advance(pose, curvature, distance):
    yaw = pose.yaw + curvature * distance
    if abs(curvature) < 1e-12:
        x = pose.x + distance * math.cos(pose.yaw)
        y = pose.y + distance * math.sin(pose.yaw)
    else:
        x = pose.x + (math.sin(yaw) - math.sin(pose.yaw)) / curvature
        y = pose.y + (math.cos(pose.yaw) - math.cos(yaw)) / curvature
    return Pose(x, y, angle_difference(yaw, 0.0))


def endpoint(start, segments):
    for segment in segments:
        start = advance(start, segment.curvature, segment.length)
    return start


def same_pose(a, b, tolerance=1e-6):
    return math.hypot(a.x - b.x, a.y - b.y) <= tolerance and (
        b.yaw is None or abs(angle_difference(a.yaw, b.yaw)) <= tolerance
    )


def merge_segments(segments):
    merged = []
    for segment in segments:
        if segment.length <= 1e-10:
            continue
        if merged and abs(merged[-1].curvature - segment.curvature) < 1e-14:
            merged[-1] = Segment(merged[-1].length + segment.length, segment.curvature)
        else:
            merged.append(segment)
    return merged


def dubins_candidates(start, goal, radius):
    if same_pose(start, goal, 1e-10):
        return [[]]
    dx, dy = goal.x - start.x, goal.y - start.y
    d = math.hypot(dx, dy) / radius
    theta = math.atan2(dy, dx)
    a, b = (start.yaw - theta) % TAU, (goal.yaw - theta) % TAU
    sa, sb, ca, cb, cab = (
        math.sin(a),
        math.sin(b),
        math.cos(a),
        math.cos(b),
        math.cos(a - b),
    )
    candidates = []

    def add(modes, lengths):
        curvatures = {"L": 1.0 / radius, "S": 0.0, "R": -1.0 / radius}
        segments = [
            Segment(v * radius, curvatures[m])
            for m, v in zip(modes, lengths)
            if v * radius > 1e-10
        ]

        if same_pose(endpoint(start, segments), goal):
            candidates.append(segments)

    p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb)
    if p2 >= -1e-12:
        t = math.atan2(cb - ca, d + sa - sb)
        add("LSL", ((t - a) % TAU, math.sqrt(max(0, p2)), (b - t) % TAU))
    p2 = 2 + d * d - 2 * cab + 2 * d * (sb - sa)
    if p2 >= -1e-12:
        t = math.atan2(ca - cb, d - sa + sb)
        add("RSR", ((a - t) % TAU, math.sqrt(max(0, p2)), (t - b) % TAU))
    p2 = d * d - 2 + 2 * cab + 2 * d * (sa + sb)
    if p2 >= -1e-12:
        p = math.sqrt(max(0, p2))
        t = math.atan2(-ca - cb, d + sa + sb) - math.atan2(-2, p)
        add("LSR", ((t - a) % TAU, p, (t - b) % TAU))
    p2 = d * d - 2 + 2 * cab - 2 * d * (sa + sb)
    if p2 >= -1e-12:
        p = math.sqrt(max(0, p2))
        t = math.atan2(ca + cb, d - sa - sb) - math.atan2(2, p)
        add("RSL", ((a - t) % TAU, p, (b - t) % TAU))
    value = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8
    if abs(value) <= 1 + 1e-12:
        p = (TAU - math.acos(max(-1, min(1, value)))) % TAU
        t = (a - math.atan2(ca - cb, d - sa + sb) + p / 2) % TAU
        add("RLR", (t, p, (a - b - t + p) % TAU))
    value = (6 - d * d + 2 * cab + 2 * d * (-sa + sb)) / 8
    if abs(value) <= 1 + 1e-12:
        p = (TAU - math.acos(max(-1, min(1, value)))) % TAU
        t = (-a - math.atan2(ca - cb, d + sa - sb) + p / 2) % TAU
        add("LRL", (t, p, (b - a - t + p) % TAU))
    return sorted(candidates, key=lambda segments: sum(s.length for s in segments))


def point_candidates(start, goal, radius):
    if same_pose(start, Pose(goal.x, goal.y, None), 1e-10):
        return [[]]
    candidates = []
    for direction in (1, -1):
        curvature = direction / radius
        center_x = start.x - math.sin(start.yaw) / curvature
        center_y = start.y + math.cos(start.yaw) / curvature
        dx, dy = goal.x - center_x, goal.y - center_y
        distance = math.hypot(dx, dy)
        if distance < radius - 1e-8:
            continue
        bearing = math.atan2(dy, dx)
        offset = math.acos(max(-1.0, min(1.0, radius / distance)))
        start_angle = math.atan2(start.y - center_y, start.x - center_x)
        for tangent in (bearing - offset, bearing + offset):
            tx, ty = (
                center_x + radius * math.cos(tangent),
                center_y + radius * math.sin(tangent),
            )
            line_length = math.hypot(goal.x - tx, goal.y - ty)
            tangent_yaw = tangent + direction * math.pi / 2
            if line_length > 1e-8:
                line_yaw = math.atan2(goal.y - ty, goal.x - tx)
                if abs(angle_difference(line_yaw, tangent_yaw)) > 1e-6:
                    continue
            turn_angle = (direction * (tangent - start_angle)) % TAU
            if TAU - turn_angle < 1e-10:
                turn_angle = 0.0
            segments = merge_segments(
                [Segment(radius * turn_angle, curvature), Segment(line_length, 0.0)]
            )
            if same_pose(endpoint(start, segments), Pose(goal.x, goal.y, None)):
                candidates.append(segments)
    return sorted(candidates, key=lambda segments: sum(s.length for s in segments))


def goal_connections(start, goal, radius):
    """到达位置目标时保留自由航向，近目标处补充有限种三圆弧连接。"""
    if goal.yaw is not None:
        return dubins_candidates(start, goal, radius)
    candidates = point_candidates(start, goal, radius)

    if math.hypot(goal.x - start.x, goal.y - start.y) < 3 * radius:
        bearing = math.atan2(goal.y - start.y, goal.x - start.x)
        for offset in range(8):
            target = Pose(goal.x, goal.y, bearing + offset * math.pi / 4)
            candidates.extend(dubins_candidates(start, target, radius))
    return sorted(candidates, key=lambda segments: sum(s.length for s in segments))


class World:
    """解析检查完整直线和圆弧；净空仅膨胀障碍物，地图边界可达。"""

    def __init__(self, obstacles, bounds, obstacle_margin):
        if len(bounds) != 4 or not all(math.isfinite(v) for v in bounds):
            raise ValueError("bounds must be [xmin, xmax, ymin, ymax], all finite")
        if not math.isfinite(obstacle_margin) or obstacle_margin < 0:
            raise ValueError("obstacle_margin must be finite and nonnegative")
        xmin, xmax, ymin, ymax = bounds
        self.bounds = (xmin, xmax, ymin, ymax)
        if self.bounds[0] >= self.bounds[1] or self.bounds[2] >= self.bounds[3]:
            raise ValueError("bounds must contain a nonempty area")
        self.circles, self.polygons = [], []
        for obstacle in obstacles:
            shape = _normalize_obstacle(obstacle)
            if isinstance(shape, Circle):
                self.circles.append(
                    Circle(shape.x, shape.y, shape.radius + obstacle_margin)
                )
            else:
                self.polygons.append(_PolygonObstacle(shape.vertices, obstacle_margin))
        self.obstacles = self.circles + self.polygons

    def point_free(self, pose):
        xmin, xmax, ymin, ymax = self.bounds
        return (
            xmin - EPS <= pose.x <= xmax + EPS
            and ymin - EPS <= pose.y <= ymax + EPS
            and all(
                math.hypot(pose.x - o.x, pose.y - o.y) > o.radius + EPS
                for o in self.circles
            )
            and all(
                not _point_in_polygon((pose.x, pose.y), polygon)
                and min(
                    _point_segment_distance((pose.x, pose.y), *edge)
                    for edge in polygon.edges
                )
                > polygon.margin + EPS
                for polygon in self.polygons
            )
        )

    def segment_free(self, start, segment):
        end = advance(start, segment.curvature, segment.length)
        if not self.point_free(start) or not self.point_free(end):
            return False
        k = segment.curvature
        if abs(k) < 1e-12:
            dx, dy = end.x - start.x, end.y - start.y
            norm2 = dx * dx + dy * dy
            for circle in self.circles:
                u = (
                    0
                    if norm2 == 0
                    else max(
                        0,
                        min(
                            1,
                            ((circle.x - start.x) * dx + (circle.y - start.y) * dy)
                            / norm2,
                        ),
                    )
                )
                if (
                    math.hypot(start.x + u * dx - circle.x, start.y + u * dy - circle.y)
                    <= circle.radius + EPS
                ):
                    return False
            for polygon in self.polygons:
                if any(
                    _segment_distance((start.x, start.y), (end.x, end.y), *edge)
                    <= polygon.margin + EPS
                    for edge in polygon.edges
                ):
                    return False
            return True

        cx, cy = start.x - math.sin(start.yaw) / k, start.y + math.cos(start.yaw) / k
        radius = abs(1 / k)
        first = math.atan2(start.y - cy, start.x - cx)
        sweep = abs(k) * segment.length
        direction = 1 if k > 0 else -1

        def on_arc(angle):
            return ((direction * (angle - first)) % TAU) <= sweep + EPS

        xmin, xmax, ymin, ymax = self.bounds
        for angle in (0, math.pi / 2, math.pi, 3 * math.pi / 2):
            if on_arc(angle):
                x, y = cx + radius * math.cos(angle), cy + radius * math.sin(angle)
                if not (
                    xmin - EPS <= x <= xmax + EPS and ymin - EPS <= y <= ymax + EPS
                ):
                    return False
        for circle in self.circles:
            angle = math.atan2(circle.y - cy, circle.x - cx)

            if (
                on_arc(angle)
                and abs(math.hypot(circle.x - cx, circle.y - cy) - radius)
                <= circle.radius + EPS
            ):
                return False
        for polygon in self.polygons:
            if any(
                _arc_edge_distance(
                    (cx, cy),
                    radius,
                    first,
                    sweep,
                    direction,
                    (start.x, start.y),
                    (end.x, end.y),
                    *edge,
                )
                <= polygon.margin + EPS
                for edge in polygon.edges
            ):
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


def shortcut(start, segments, world, config, goal=None):
    """仅接受更短且满足碰撞约束的Dubins替代段。"""
    best = list(segments)
    rng = random.Random(0)

    for attempt in range(config.shortcut_attempts):
        if len(best) < 2:
            break
        i, j = (
            (0, len(best))
            if attempt == 0
            else sorted(rng.sample(range(len(best) + 1), 2))
        )
        if j - i < 2:
            continue
        poses = [start]
        for segment in best:
            poses.append(advance(poses[-1], segment.curvature, segment.length))
        old_length = sum(s.length for s in best[i:j])
        for connection in dubins_candidates(poses[i], poses[j], config.min_turn_radius):
            if sum(s.length for s in connection) >= old_length - EPS:
                break
            if world.path_free(poses[i], connection):
                best = best[:i] + connection + best[j:]
                break
    best = merge_segments(best)
    if config.shortcut_attempts == 0:
        return best

    def geometry(path):
        poses, lengths = [start], [0.0]
        for segment in path:
            poses.append(advance(poses[-1], segment.curvature, segment.length))
            lengths.append(lengths[-1] + segment.length)
        return poses, lengths

    def best_replacement(path, spans, limit, free_terminal=False):
        poses, lengths = geometry(path)
        best_path, best_saving = path, 1e-6
        for attempt, (i, j, fraction) in enumerate(spans):
            if attempt >= limit:
                break
            target = advance(poses[j], path[j].curvature, path[j].length * fraction)
            old_length = lengths[j] - lengths[i] + path[j].length * fraction
            connections = (
                goal_connections(
                    poses[i], Pose(target.x, target.y, None), config.min_turn_radius
                )
                if free_terminal
                else dubins_candidates(poses[i], target, config.min_turn_radius)
            )
            for connection in connections:
                saving = old_length - sum(segment.length for segment in connection)
                if saving <= best_saving + 1e-7:
                    break
                if not world.path_free(poses[i], connection):
                    continue
                remainder = [
                    Segment(path[j].length * (1 - fraction), path[j].curvature)
                ]
                best_path = merge_segments(
                    path[:i] + connection + remainder + path[j + 1 :]
                )
                best_saving = saving
                break
        return best_path

    limit = min(96, config.shortcut_attempts)
    for _ in range(2):
        previous_length = sum(segment.length for segment in best)
        if not best:
            break

        count = len(best)
        boundaries = [(0, j, 1.0) for j in range(count - 1, 0, -1)]
        interiors = [
            (0, j, fraction)
            for j in range(min(count, 16) - 1, 0, -1)
            for fraction in (0.5, 0.25, 0.75)
        ]
        best = best_replacement(best, boundaries + interiors, limit)

        if goal is not None and goal.yaw is None and best:
            count = len(best)
            terminal = [(i, count - 1, 1.0) for i in range(count)]
            best = best_replacement(best, terminal, limit, free_terminal=True)

        local = []
        for i in range(1, len(best)):
            if best[i - 1].curvature * best[i].curvature < 0:
                anchor = max(0, i - 1)
                for j in range(min(len(best) - 1, i + 3), i, -1):
                    local.extend(
                        (anchor, j, fraction) for fraction in (1.0, 0.5, 0.25, 0.75)
                    )
        best = best_replacement(best, local, limit)
        if previous_length - sum(segment.length for segment in best) < 1e-6:
            break
    return best


def holonomic_heuristic(goal, world, radius):
    """用忽略航向的障碍物距离场引导搜索，不据此判定连续空间无解。"""
    xmin, xmax, ymin, ymax = world.bounds
    cell_size = max(radius / 2, (xmax - xmin) / 160, (ymax - ymin) / 160)
    grid_width = max(2, math.ceil((xmax - xmin) / cell_size) + 1)
    grid_height = max(2, math.ceil((ymax - ymin) / cell_size) + 1)

    step_x, step_y = (xmax - xmin) / (grid_width - 1), (ymax - ymin) / (grid_height - 1)
    xs = [xmin + i * step_x for i in range(grid_width)]
    ys = [ymin + j * step_y for j in range(grid_height)]
    traversable = bytearray(grid_width * grid_height)
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            traversable[j * grid_width + i] = world.point_free(Pose(x, y, 0.0))
    distances = [math.inf] * (grid_width * grid_height)
    goal_column = min(grid_width - 1, max(0, round((goal.x - xmin) / step_x)))
    goal_row = min(grid_height - 1, max(0, round((goal.y - ymin) / step_y)))
    distance_queue = []

    for j in range(max(0, goal_row - 2), min(grid_height, goal_row + 3)):
        for i in range(max(0, goal_column - 2), min(grid_width, goal_column + 3)):
            index = j * grid_width + i
            if not traversable[index]:
                continue
            dx, dy = xs[i] - goal.x, ys[j] - goal.y
            length = math.hypot(dx, dy)
            if world.segment_free(
                Pose(goal.x, goal.y, math.atan2(dy, dx)), Segment(length, 0.0)
            ):
                distances[index] = length
                heapq.heappush(distance_queue, (length, i, j))
    neighbors = [
        (di, dj, math.hypot(di * step_x, dj * step_y))
        for di in (-1, 0, 1)
        for dj in (-1, 0, 1)
        if di or dj
    ]
    while distance_queue:
        distance, i, j = heapq.heappop(distance_queue)
        if distance > distances[j * grid_width + i] + EPS:
            continue
        for di, dj, length in neighbors:
            ni, nj = i + di, j + dj
            if not 0 <= ni < grid_width or not 0 <= nj < grid_height:
                continue
            index = nj * grid_width + ni
            new_distance = distance + length
            if not traversable[index] or new_distance >= distances[index] - EPS:
                continue
            if not world.segment_free(
                Pose(xs[i], ys[j], math.atan2(dj * step_y, di * step_x)),
                Segment(length, 0.0),
            ):
                continue
            distances[index] = new_distance
            heapq.heappush(distance_queue, (new_distance, ni, nj))

    def estimate(pose):
        euclidean = math.hypot(pose.x - goal.x, pose.y - goal.y)
        u = min(grid_width - 1, max(0.0, (pose.x - xmin) / step_x))
        v = min(grid_height - 1, max(0.0, (pose.y - ymin) / step_y))
        i, j = min(grid_width - 2, math.floor(u)), min(grid_height - 2, math.floor(v))
        costs = [
            distances[j * grid_width + i],
            distances[j * grid_width + i + 1],
            distances[(j + 1) * grid_width + i],
            distances[(j + 1) * grid_width + i + 1],
        ]
        if all(math.isfinite(cost) for cost in costs):
            a, b = u - i, v - j
            value = (
                (1 - a) * (1 - b) * costs[0]
                + a * (1 - b) * costs[1]
                + (1 - a) * b * costs[2]
                + a * b * costs[3]
            )
            return max(euclidean, value)
        options = [
            cost + math.hypot(pose.x - xs[ci], pose.y - ys[cj])
            for cost, ci, cj in (
                (costs[0], i, j),
                (costs[1], i + 1, j),
                (costs[2], i, j + 1),
                (costs[3], i + 1, j + 1),
            )
            if math.isfinite(cost)
        ]

        return max(euclidean, min(options)) if options else euclidean

    return estimate


def plan_hybrid_astar(start, goal, obstacles, bounds, config=None):
    """按离散状态保留最低到达代价，返回满足曲率和碰撞约束的航段。"""
    config = config or HybridAStarConfig()
    if start.yaw is None or not all(
        math.isfinite(v) for v in (start.x, start.y, start.yaw)
    ):
        raise ValueError("start must contain finite position and yaw")
    if not all(math.isfinite(v) for v in (goal.x, goal.y)) or (
        goal.yaw is not None and not math.isfinite(goal.yaw)
    ):
        raise ValueError("goal position and optional yaw must be finite")
    world = World(obstacles, bounds, config.obstacle_margin)
    started_at = time.perf_counter()

    def failure(message, expanded_nodes=0):
        return PlanningResult(
            False, message, [], expanded_nodes, time.perf_counter() - started_at
        )

    if not world.point_free(start):
        return failure("Start is outside the safe map or inside an inflated obstacle")
    if not world.point_free(goal):
        return failure("Goal is outside the safe map or inside an inflated obstacle")
    if same_pose(start, goal, 1e-10):
        return PlanningResult(
            True, "Start already equals goal", [], 0, time.perf_counter() - started_at
        )

    def finish(segments, expanded_nodes, message):
        raw_length = sum(s.length for s in segments)
        segments = shortcut(start, merge_segments(segments), world, config, goal)
        if not same_pose(endpoint(start, segments), goal) or not world.path_free(
            start, segments
        ):
            raise RuntimeError("Internal error: final path validation failed")
        if any(
            s.length < 0 or abs(s.curvature) > 1 / config.min_turn_radius + 1e-12
            for s in segments
        ):
            raise RuntimeError("Internal error: final motion constraint violation")
        return PlanningResult(
            True,
            message,
            segments,
            expanded_nodes,
            time.perf_counter() - started_at,
            raw_length,
        )

    for connection in goal_connections(start, goal, config.min_turn_radius):
        if world.path_free(start, connection):
            return finish(connection, 0, "Direct Dubins path found")

    yaw_bins = math.ceil(360 / config.yaw_resolution_deg)
    xmin, _, ymin, _ = bounds

    def state_key(pose):
        return (
            math.floor((pose.x - xmin) / config.xy_resolution),
            math.floor((pose.y - ymin) / config.xy_resolution),
            round((pose.yaw % TAU) / TAU * yaw_bins) % yaw_bins,
        )

    heuristic = holonomic_heuristic(goal, world, config.min_turn_radius)

    states = [_SearchState(start, 0.0, None, None)]
    best_cost_by_state = {state_key(start): 0.0}
    tie_breaker = itertools.count()
    open_set = [(heuristic(start), next(tie_breaker), 0)]
    motion_primitives = [
        Segment(config.primitive_length, ratio / config.min_turn_radius)
        for ratio in (0.0, -0.5, 0.5, -1.0, 1.0)
    ]
    expanded_nodes = 0
    while open_set:
        if time.perf_counter() - started_at >= config.timeout_s:
            return failure(
                "Search time limit reached; feasibility is undetermined", expanded_nodes
            )
        if expanded_nodes >= config.max_expansions:
            return failure(
                "Expansion limit reached; feasibility is undetermined", expanded_nodes
            )
        _, _, state_index = heapq.heappop(open_set)
        state = states[state_index]
        pose, path_cost = state.pose, state.path_cost
        if path_cost > best_cost_by_state.get(state_key(pose), math.inf) + EPS:
            continue
        expanded_nodes += 1
        if (
            expanded_nodes % config.shot_interval == 0
            or math.hypot(pose.x - goal.x, pose.y - goal.y) < 3 * config.min_turn_radius
        ):
            for connection in goal_connections(pose, goal, config.min_turn_radius):
                if world.path_free(pose, connection):
                    prefix = []
                    cursor = state
                    while cursor.parent_index is not None:
                        prefix.append(cursor.incoming_segment)
                        cursor = states[cursor.parent_index]
                    return finish(
                        list(reversed(prefix)) + connection,
                        expanded_nodes,
                        "Hybrid A* + Dubins path found",
                    )
        for segment in motion_primitives:
            next_pose = advance(pose, segment.curvature, segment.length)
            next_cost = path_cost + segment.length
            next_key = state_key(next_pose)
            if next_cost >= best_cost_by_state.get(next_key, math.inf) - EPS:
                continue
            if not world.segment_free(pose, segment):
                continue
            best_cost_by_state[next_key] = next_cost
            states.append(_SearchState(next_pose, next_cost, state_index, segment))
            heapq.heappush(
                open_set,
                (next_cost + heuristic(next_pose), next(tie_breaker), len(states) - 1),
            )
    return failure(
        "Search exhausted at this map/discretization; feasibility is undetermined",
        expanded_nodes,
    )


def compact_path(start, segments, step=1.0, max_arc_angle=0.15, world=None):
    """直线保留端点，圆弧按弧长和转角采样；弦线碰撞时继续细分。"""
    if not math.isfinite(step) or step <= 0:
        raise ValueError("sample step must be finite and positive")
    if not math.isfinite(max_arc_angle) or not 0 < max_arc_angle <= math.pi:
        raise ValueError("max_arc_angle must be in (0, pi] radians")
    waypoints = [(start.x, start.y, start.yaw)]
    if world is not None and not world.point_free(start):
        raise RuntimeError("Cannot sample a path from an invalid start")

    def chord_free(a, b):
        length = math.hypot(b.x - a.x, b.y - a.y)
        yaw = math.atan2(b.y - a.y, b.x - a.x)
        return world.segment_free(Pose(a.x, a.y, yaw), Segment(length, 0.0))

    for segment in merge_segments(segments):
        if world is not None and not world.segment_free(start, segment):
            raise RuntimeError("Cannot sample an invalid analytic path segment")
        if abs(segment.curvature) < 1e-12:
            count = 1
        else:
            count = max(
                1,
                math.ceil(segment.length / step),
                math.ceil(abs(segment.curvature) * segment.length / max_arc_angle),
            )
        if len(waypoints) + count > 100000:
            raise RuntimeError("Compact path exceeds the bounded sampling budget")

        intervals = [
            (segment.length * (i - 1) / count, segment.length * i / count, 0)
            for i in range(count, 0, -1)
        ]
        while intervals:
            left_s, local_s, depth = intervals.pop()
            before = advance(start, segment.curvature, left_s)
            pose = advance(start, segment.curvature, local_s)
            if world is not None and not chord_free(before, pose):
                if depth >= 30 or local_s - left_s <= 1e-8:
                    raise RuntimeError(
                        "Unable to construct collision-free output chords"
                    )
                middle = (left_s + local_s) / 2
                intervals.append((middle, local_s, depth + 1))
                intervals.append((left_s, middle, depth + 1))
                continue
            waypoints.append((pose.x, pose.y, pose.yaw))
            if len(waypoints) > 100000:
                raise RuntimeError("Compact path exceeds the bounded sampling budget")
        start = advance(start, segment.curvature, segment.length)
    return waypoints
