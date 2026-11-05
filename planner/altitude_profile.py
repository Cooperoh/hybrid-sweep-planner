"""按真实航程生成高度剖面，区内保持目标高度，区外在本机高度转弯。"""

from bisect import bisect_left, bisect_right
from dataclasses import dataclass
import math

if __package__:
    from .hybrid_astar import Pose, advance, angle_difference
else:
    from hybrid_astar import Pose, advance, angle_difference


_TAU = 2 * math.pi
_EPS = 1e-7


@dataclass(frozen=True)
class _RouteSegment:
    start: Pose
    end: Pose
    length: float
    curvature: float


def _infer_route_segment(start, end, index):
    """由端点位置和切向航向恢复直线或圆弧；重合端点无法恢复整周转弯。"""
    dx, dy = end.x - start.x, end.y - start.y
    chord = math.hypot(dx, dy)
    heading_change = angle_difference(end.yaw, start.yaw)
    if chord <= 1e-9:
        if abs(heading_change) > 1e-7:
            raise ValueError(
                f"Path segment {index} changes heading without forward motion"
            )
        return None
    local_y = -math.sin(start.yaw) * dx + math.cos(start.yaw) * dy
    if abs(heading_change) < 1e-10 and abs(local_y) < 1e-5:
        curvature, length = 0.0, chord
    else:
        if abs(local_y) < 1e-12:
            raise ValueError(
                f"Path segment {index} is not a constant-curvature forward motion"
            )
        turn = (
            (end.yaw - start.yaw) % _TAU
            if local_y > 0
            else -((start.yaw - end.yaw) % _TAU)
        )
        curvature = 2 * math.sin(turn / 2) / chord
        if abs(curvature) < 1e-15 or abs(turn) < 1e-12:
            raise ValueError(f"Path segment {index} has inconsistent tangent headings")
        length = turn / curvature
    if not math.isfinite(length) or length <= 0:
        raise ValueError(f"Path segment {index} has invalid forward arc length")
    actual = advance(start, curvature, length)
    tolerance = max(1e-5, chord * 1e-10)
    if (
        math.hypot(actual.x - end.x, actual.y - end.y) > tolerance
        or abs(angle_difference(actual.yaw, end.yaw)) > 1e-7
    ):
        raise ValueError(
            f"Path segment {index} is not a constant-curvature forward motion"
        )
    return _RouteSegment(start, end, length, curvature)


def _unique_distances(values):
    result = []
    for value in sorted(values):
        if not result or value - result[-1] > _EPS:
            result.append(value)
    return result


def _boundary_crossing_distances(segment, bounds):
    """解析求取与矩形边界交点的段内航程。"""
    xmin, xmax, ymin, ymax = bounds
    start, length, curvature = segment.start, segment.length, segment.curvature
    hits = []

    def add(distance, x, y):
        if (
            -_EPS <= distance <= length + _EPS
            and xmin - _EPS <= x <= xmax + _EPS
            and ymin - _EPS <= y <= ymax + _EPS
        ):
            hits.append(min(length, max(0.0, distance)))

    if abs(curvature) < 1e-12:
        ux, uy = math.cos(start.yaw), math.sin(start.yaw)
        if abs(ux) > 1e-14:
            for x in (xmin, xmax):
                distance = (x - start.x) / ux
                add(distance, x, start.y + distance * uy)
        if abs(uy) > 1e-14:
            for y in (ymin, ymax):
                distance = (y - start.y) / uy
                add(distance, start.x + distance * ux, y)
        return _unique_distances(hits)

    cx = start.x - math.sin(start.yaw) / curvature
    cy = start.y + math.cos(start.yaw) / curvature
    radius = abs(1 / curvature)
    first = math.atan2(start.y - cy, start.x - cx)
    direction = 1 if curvature > 0 else -1

    def at_angle(angle):
        progress = (direction * (angle - first)) % _TAU
        # 消除起点角度舍入造成的整周误差。
        if _TAU - progress < 1e-10:
            progress = 0.0
        add(
            progress / abs(curvature),
            cx + radius * math.cos(angle),
            cy + radius * math.sin(angle),
        )

    for x in (xmin, xmax):
        value = (x - cx) / radius
        if -1 - 1e-12 <= value <= 1 + 1e-12:
            angle = math.acos(max(-1.0, min(1.0, value)))
            at_angle(angle)
            at_angle(-angle)
    for y in (ymin, ymax):
        value = (y - cy) / radius
        if -1 - 1e-12 <= value <= 1 + 1e-12:
            angle = math.asin(max(-1.0, min(1.0, value)))
            at_angle(angle)
            at_angle(math.pi - angle)
    return _unique_distances(hits)


def build_altitude_profile(
    path,
    own_altitude,
    target_altitude,
    bounds,
    speed,
    climb_rate,
    layer_hold_time=10.0,
    *,
    require_level_turns=True,
):
    """保留航点、区域交点和升降断点，输出位置、高度、航向、航程、时间及阶段。

    默认仅允许在直线上升降；区外转弯保持本机高度，升降或保持距离不足时报错。
    """
    if not isinstance(require_level_turns, bool):
        raise ValueError("require_level_turns must be a boolean")
    for name, value in (
        ("own_altitude", own_altitude),
        ("target_altitude", target_altitude),
        ("speed", speed),
        ("climb_rate", climb_rate),
        ("layer_hold_time", layer_hold_time),
    ):
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError(f"{name} must be finite")
    if speed <= 0 or climb_rate <= 0:
        raise ValueError("speed and climb_rate must be positive")
    if layer_hold_time < 0:
        raise ValueError("layer_hold_time must be nonnegative")
    try:
        bounds = tuple(float(value) for value in bounds)
    except (TypeError, ValueError) as exc:
        raise ValueError("bounds must contain four finite numbers") from exc
    if len(bounds) != 4 or not all(math.isfinite(value) for value in bounds):
        raise ValueError("bounds must contain four finite numbers")
    xmin, xmax, ymin, ymax = bounds
    if xmin >= xmax or ymin >= ymax:
        raise ValueError("bounds must define a nonempty rectangle")

    try:
        vertices = iter(path)
    except TypeError as exc:
        raise ValueError("path must be an iterable of (x, y, yaw) vertices") from exc
    poses = []
    for index, value in enumerate(vertices):
        try:
            if len(value) != 3:
                raise ValueError
            x, y, yaw = (float(component) for component in value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Path vertex {index} must contain x, y and yaw") from exc
        if not all(math.isfinite(component) for component in (x, y, yaw)):
            raise ValueError(f"Path vertex {index} must contain finite numbers")
        poses.append(Pose(x, y, yaw))
    if not poses:
        return []

    def inside_sweep(pose):
        return (
            xmin - _EPS <= pose.x <= xmax + _EPS
            and ymin - _EPS <= pose.y <= ymax + _EPS
        )

    segments, segment_start_distances, segment_end_distances = [], [], []
    boundary_distances, total_length = [0.0], 0.0
    for index, (start, end) in enumerate(zip(poses, poses[1:])):
        segment = _infer_route_segment(start, end, index)
        if segment is None:
            continue
        segment_start_distances.append(total_length)
        segments.append(segment)
        boundary_distances.extend(
            total_length + distance
            for distance in _boundary_crossing_distances(segment, bounds)
        )
        total_length += segment.length
        segment_end_distances.append(total_length)
        boundary_distances.append(total_length)

    def pose_at_distance(distance):
        if not segments or distance <= _EPS:
            return poses[0]
        if total_length - distance <= _EPS:
            return poses[-1]
        index = min(len(segments) - 1, bisect_left(segment_end_distances, distance))
        if abs(distance - segment_end_distances[index]) <= _EPS:
            return segments[index].end
        return advance(
            segments[index].start,
            segments[index].curvature,
            distance - segment_start_distances[index],
        )

    boundary_distances = _unique_distances(boundary_distances)
    boundary_contacts = [
        inside_sweep(pose_at_distance(distance)) for distance in boundary_distances
    ]
    outside_intervals = [
        not inside_sweep(pose_at_distance((a + b) / 2))
        for a, b in zip(boundary_distances, boundary_distances[1:])
    ]
    outside_excursions = []
    index = 0
    while index < len(outside_intervals):
        if not outside_intervals[index]:
            index += 1
            continue
        first = index
        index += 1
        # 与边界相切也必须达到目标高度，因此分开两侧的区外航段。
        while (
            index < len(outside_intervals)
            and outside_intervals[index]
            and not boundary_contacts[index]
        ):
            index += 1
        outside_excursions.append(
            (
                boundary_distances[first],
                boundary_distances[index],
                boundary_contacts[first],
                boundary_contacts[index],
            )
        )

    altitude_difference = abs(own_altitude - target_altitude)
    transition_distance = altitude_difference / climb_rate * speed
    layer_hold_distance = speed * layer_hold_time
    if not all(
        math.isfinite(value)
        for value in (
            altitude_difference,
            transition_distance,
            layer_hold_distance,
            total_length / speed,
        )
    ):
        raise ValueError(
            "Height, distance or time calculation exceeds the finite numeric range"
        )
    profile_distances = list(boundary_distances)
    for begin, end, departs_sweep, reenters_sweep in outside_excursions:
        length = end - begin
        if altitude_difference == 0:
            continue
        if departs_sweep and reenters_sweep:
            required = 2 * transition_distance + layer_hold_distance
            if length + _EPS < required:
                raise ValueError(
                    f"Outside excursion at s={begin:.3f}m has {length:.3f}m; "
                    f"needs at least {required:.3f}m for both height transitions "
                    f"and {layer_hold_time:g}s at own altitude"
                )
            profile_distances.extend(
                (begin + transition_distance, end - transition_distance)
            )
        elif reenters_sweep:
            if length + _EPS < transition_distance:
                raise ValueError(
                    f"Initial approach has {length:.3f}m outside the sweep area; "
                    f"needs at least {transition_distance:.3f}m to reach target altitude"
                )
            profile_distances.append(end - transition_distance)
        elif departs_sweep:
            if length + _EPS < transition_distance:
                raise ValueError(
                    f"Terminal departure has {length:.3f}m outside the sweep area; "
                    f"needs at least {transition_distance:.3f}m to return to own altitude"
                )
            profile_distances.append(begin + transition_distance)

    excursion_start_distances = [excursion[0] for excursion in outside_excursions]

    def altitude_phase_at(distance, pose):
        if inside_sweep(pose):
            return target_altitude, "sweep"
        excursion_index = bisect_right(excursion_start_distances, distance) - 1
        if excursion_index < 0:
            return own_altitude, "approach_layer"
        begin, end, departs_sweep, reenters_sweep = outside_excursions[excursion_index]
        if altitude_difference == 0:
            return own_altitude, "turn_layer" if departs_sweep else "approach_layer"
        if not departs_sweep and not reenters_sweep:
            return own_altitude, "approach_layer"
        if departs_sweep and distance < begin + transition_distance - _EPS:
            fraction = max(0.0, min(1.0, (distance - begin) / transition_distance))
            return target_altitude + (
                own_altitude - target_altitude
            ) * fraction, "exit_transition"
        if reenters_sweep and distance >= end - transition_distance - _EPS:
            fraction = max(
                0.0,
                min(
                    1.0, (distance - (end - transition_distance)) / transition_distance
                ),
            )
            return own_altitude + (
                target_altitude - own_altitude
            ) * fraction, "entry_transition"
        return own_altitude, "turn_layer" if departs_sweep else "approach_layer"

    profile_distances = _unique_distances(profile_distances)
    if require_level_turns and altitude_difference:
        for begin, end in zip(profile_distances, profile_distances[1:]):
            middle = (begin + end) / 2
            index = min(len(segments) - 1, bisect_left(segment_end_distances, middle))
            if abs(segments[index].curvature) < 1e-12 or inside_sweep(
                pose_at_distance(middle)
            ):
                continue
            for distance in (begin, middle, end):
                altitude, _ = altitude_phase_at(distance, pose_at_distance(distance))
                if abs(altitude - own_altitude) > 1e-6:
                    raise ValueError(
                        f"Outside turn at s={begin:.3f}..{end:.3f}m changes height "
                        f"or leaves own altitude {own_altitude:g}m. Complete the "
                        "outbound straight height transition before turning, and "
                        "complete the turn before the inbound straight transition."
                    )

    result = []
    for distance in profile_distances:
        distance = min(total_length, max(0.0, distance))
        pose = pose_at_distance(distance)
        altitude, phase = altitude_phase_at(distance, pose)
        result.append(
            dict(
                x=pose.x,
                y=pose.y,
                alt=float(altitude),
                yaw=pose.yaw,
                s=distance,
                time=distance / speed,
                phase=phase,
            )
        )
    return result
