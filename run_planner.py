"""多机混合扫掠任务的配置与规划入口。"""

import math

import matplotlib.pyplot as plt

if __package__:
    from .planner import hybrid_astar as motion
    from .planner.altitude_profile import build_altitude_profile
    from .planner.hybrid_sweep_planner import HybridSweepPlanner
    from .planner.mission_plotting import plot_mission_paths
    from .planner.obstacle_utils import generate_arc_obstacles
    from .planner.sweep_routes import (
        assign_paths_to_drones,
        build_sweep_paths,
        connect_with_arcs,
    )
else:
    from planner import hybrid_astar as motion
    from planner.altitude_profile import build_altitude_profile
    from planner.hybrid_sweep_planner import HybridSweepPlanner
    from planner.mission_plotting import plot_mission_paths
    from planner.obstacle_utils import generate_arc_obstacles
    from planner.sweep_routes import (
        assign_paths_to_drones,
        build_sweep_paths,
        connect_with_arcs,
    )

DRONES = [
    {"name": "drone_1", "xy": (9500.0, 12500.0), "heading_deg": -150.0, "alt": 1800.0},
    {"name": "drone_2", "xy": (11000.0, 9000.0), "heading_deg": 90.0, "alt": 2000.0},
    {"name": "drone_3", "xy": (7500.0, 10500.0), "heading_deg": -90.0, "alt": 2200.0},
    {"name": "drone_4", "xy": (13000.0, 7000.0), "heading_deg": -60.0, "alt": 1600.0},
    {"name": "drone_5", "xy": (11500.0, 14000.0), "heading_deg": -30.0, "alt": 2400.0},
    {"name": "drone_6", "xy": (12500.0, 13500.0), "heading_deg": 0.0, "alt": 1400.0},
    {"name": "drone_7", "xy": (14500.0, 11500.0), "heading_deg": 30.0, "alt": 2600.0},
    {"name": "drone_8", "xy": (15000.0, 9500.0), "heading_deg": 60.0, "alt": 1200.0},
    {"name": "drone_9", "xy": (9500.0, 14500.0), "heading_deg": 90.0, "alt": 2800.0},
    {"name": "drone_10", "xy": (8500.0, 7500.0), "heading_deg": 120.0, "alt": 1000.0},
    {"name": "drone_11", "xy": (10500.0, 6000.0), "heading_deg": 150.0, "alt": 3000.0},
    {"name": "drone_12", "xy": (6500.0, 9000.0), "heading_deg": 170.0, "alt": 3200.0},
    {"name": "drone_13", "xy": (5000.0, 10000.0), "heading_deg": -170.0, "alt": 3400.0},
    {"name": "drone_14", "xy": (7000.0, 13000.0), "heading_deg": -140.0, "alt": 3600.0},
    {"name": "drone_15", "xy": (9000.0, 15000.0), "heading_deg": -110.0, "alt": 3800.0},
    {"name": "drone_16", "xy": (12000.0, 14500.0), "heading_deg": -80.0, "alt": 4000.0},
    {"name": "drone_17", "xy": (14000.0, 12500.0), "heading_deg": -50.0, "alt": 4200.0},
    {"name": "drone_18", "xy": (13500.0, 9500.0), "heading_deg": -20.0, "alt": 4400.0},
    {"name": "drone_19", "xy": (12500.0, 7500.0), "heading_deg": 10.0, "alt": 4600.0},
    {"name": "drone_20", "xy": (11500.0, 5500.0), "heading_deg": 40.0, "alt": 4800.0},
    {"name": "drone_21", "xy": (9500.0, 6500.0), "heading_deg": 70.0, "alt": 5000.0},
    {"name": "drone_22", "xy": (7500.0, 8500.0), "heading_deg": 100.0, "alt": 5200.0},
    {"name": "drone_23", "xy": (5500.0, 11500.0), "heading_deg": 130.0, "alt": 5400.0},
    {"name": "drone_24", "xy": (6000.0, 13500.0), "heading_deg": 160.0, "alt": 5600.0},
]

SWEEP_CENTER = (60000.0, 60000.0)

MIN_TURN_RADIUS = 3000.0
CRUISE_SPEED = 200.0
SWEEP_SIDE_LENGTH = 20000.0
SWEEP_SPACING = 2000.0
TARGET_ALTITUDE = 2000.0
SWEEP_DRONE_COUNT = 5
CLIMB_RATE = 10.0
LAYER_HOLD_TIME = 10.0

OBSTACLES = generate_arc_obstacles(
    center=SWEEP_CENTER,
    ring_radius=30000.0,
    spacing_along_arc=12000.0,
    obstacle_radius=6000.0,
    index_range=(3, 22),
)

PLANNER_CONFIG = {
    "world_min": -20000.0,
    "world_max": 100000.0,
    "min_turn_radius": MIN_TURN_RADIUS,
    "speed": CRUISE_SPEED,
    "sample_step": 0.05 * MIN_TURN_RADIUS,
    "max_expansions": 20000,
    "obstacle_margin": MIN_TURN_RADIUS / 2,
    "shortcut_attempts": 120,
}


def _prioritize_reference_drone(drones, target_altitude):
    """将高度最接近目标的无人机作为参考机，其余顺序不变。"""
    if not drones:
        return []
    ordered = list(drones)
    closest_idx = min(
        range(len(ordered)),
        key=lambda i: abs(
            float(ordered[i].get("alt", target_altitude)) - target_altitude
        ),
    )
    if closest_idx == 0:
        return ordered
    return [ordered[closest_idx]] + ordered[:closest_idx] + ordered[closest_idx + 1 :]


def _altitude_transition_distance(altitude, target_altitude, climb_rate, speed):
    if not math.isfinite(climb_rate) or climb_rate <= 0:
        raise ValueError("climb_rate must be finite and positive")
    return (
        abs(float(altitude) - float(target_altitude)) / float(climb_rate) * float(speed)
    )


def _approach_reference_pose(
    reference_path, sweep_center, side_length, transition_distance, min_turn_radius
):
    """选取延长扫掠入口前的接近姿态，用于比较访问方向。"""
    if not reference_path:
        raise ValueError("reference_path is empty")
    if len(reference_path) == 1:
        return reference_path[0]
    padded_size = side_length + 2 * (transition_distance + 2 * min_turn_radius)
    _, _, _, index, _ = _first_sweep_area_contact(
        reference_path, sweep_center, padded_size
    )
    return reference_path[max(0, index - 1)]


def _plan_approach_to_sweep(
    drone, sweep_route, *, min_turn_radius, obstacles=None, planner_config=None
):
    """从无人机初始姿态直接接入扫掠入口，并校验完整航迹。"""
    if not sweep_route:
        return []
    config = dict(PLANNER_CONFIG if planner_config is None else planner_config)
    config["min_turn_radius"] = min_turn_radius
    obstacles = list(OBSTACLES if obstacles is None else obstacles)
    planner = HybridSweepPlanner(**config)
    sweep_poses = sweep_route.poses
    sweep_start = sweep_poses[0]
    approach, _ = planner.plan_to_pose(
        drone["xy"],
        drone["heading_deg"],
        sweep_start[:2],
        math.degrees(sweep_start[2]),
        obstacles,
    )
    route = approach + sweep_poses[1:]
    world = motion.World(
        obstacles,
        planner.bounds,
        planner.obstacle_margin,
    )
    _validate_route(route, world, min_turn_radius)
    return route


def _validate_route(route, world, min_turn_radius):
    # 同时检查真实圆弧与输出航点间的弦线，避免稀疏采样漏检。
    if not world.point_free(motion.Pose(*route[0])):
        raise RuntimeError("Final route starts outside the free map")
    for start, end in zip(route, route[1:]):
        distance = math.hypot(end[0] - start[0], end[1] - start[1])
        chord_start = motion.Pose(
            start[0], start[1], math.atan2(end[1] - start[1], end[0] - start[0])
        )
        if not world.segment_free(chord_start, motion.Segment(distance, 0.0)):
            raise RuntimeError(
                "Sweep route intersects an inflated obstacle or map boundary"
            )
        heading_change = motion.angle_difference(end[2], start[2])
        if distance <= 1e-8:
            if abs(heading_change) > 1e-7:
                raise RuntimeError("Route changes heading without forward motion")
            continue
        curvature = 2 * math.sin(heading_change / 2) / distance
        length = distance if abs(heading_change) < 1e-10 else heading_change / curvature
        segment = motion.Segment(length, curvature)
        actual = motion.advance(motion.Pose(*start), curvature, length)
        if (
            math.hypot(actual.x - end[0], actual.y - end[1]) > 1e-5
            or abs(curvature) > 1 / min_turn_radius + 1e-10
        ):
            raise RuntimeError(
                "Route violates heading continuity or minimum turning radius"
            )
        if not world.segment_free(motion.Pose(*start), segment):
            raise RuntimeError(
                "Sweep arc intersects an inflated obstacle or map boundary"
            )


def plan_approach(
    start, start_heading_deg, *, goal=None, obstacles=None, planner_config=None
):
    """生成接近航迹，返回航点、规划统计和障碍物。"""
    config = dict(PLANNER_CONFIG if planner_config is None else planner_config)
    obstacles = list(OBSTACLES if obstacles is None else obstacles)
    planner = HybridSweepPlanner(**config)
    goal = SWEEP_CENTER if goal is None else goal
    path, stats = planner.plan(start, start_heading_deg, goal, obstacles)
    return path, stats, obstacles


def _sweep_square(goal, size):
    half = 0.5 * size
    gx, gy = goal
    return [
        (gx - half, gy - half),
        (gx - half, gy + half),
        (gx + half, gy + half),
        (gx + half, gy - half),
    ]


def _inside_bounds(pt, bounds):
    x, y = pt
    xmin, xmax, ymin, ymax = bounds
    return xmin <= x <= xmax and ymin <= y <= ymax


def _nearest_edge(pt, bounds):
    x, y = pt
    xmin, xmax, ymin, ymax = bounds
    dists = {
        "left": abs(x - xmin),
        "right": abs(x - xmax),
        "bottom": abs(y - ymin),
        "top": abs(y - ymax),
    }
    return min(dists, key=dists.get)


def _clip_segment_to_box(p0, p1, bounds):
    """按线段参数裁剪，返回首次进入矩形的位置和边。"""
    x0, y0 = p0
    x1, y1 = p1
    xmin, xmax, ymin, ymax = bounds
    dx = x1 - x0
    dy = y1 - y0

    p_list = [-dx, dx, -dy, dy]
    q_list = [x0 - xmin, xmax - x0, y0 - ymin, ymax - y0]
    edges = ["left", "right", "bottom", "top"]

    u1, u2 = 0.0, 1.0
    enter_edge = None

    for p, q, edge in zip(p_list, q_list, edges):
        if abs(p) < 1e-12:
            if q < 0:
                return None
            continue
        r = q / p
        if p < 0:
            if r > u2:
                return None
            if r > u1:
                u1 = r
                enter_edge = edge
        else:
            if r < u1:
                return None
            if r < u2:
                u2 = r

    if u1 > u2 or u1 < 0.0 or u1 > 1.0:
        return None

    ix = x0 + u1 * dx
    iy = y0 + u1 * dy

    if enter_edge is None:
        enter_edge = _nearest_edge((ix, iy), bounds)
    return (ix, iy, enter_edge, u1)


def _first_sweep_area_contact(path, goal, square_size):
    """返回首次入区的位置、航向、边、线段索引和线段参数。"""
    if len(path) < 2:
        raise ValueError("path must have at least 2 points.")

    square = _sweep_square(goal, square_size)
    xmin = min(p[0] for p in square)
    xmax = max(p[0] for p in square)
    ymin = min(p[1] for p in square)
    ymax = max(p[1] for p in square)
    bounds = (xmin, xmax, ymin, ymax)

    if _inside_bounds(path[0][:2], bounds):
        heading0 = path[0][2] if len(path[0]) >= 3 else 0.0
        edge = _nearest_edge(path[0][:2], bounds)
        return path[0][:2], heading0, edge, 0, 0.0

    for idx in range(1, len(path)):
        p0 = path[idx - 1]
        p1 = path[idx]
        clipped = _clip_segment_to_box((p0[0], p0[1]), (p1[0], p1[1]), bounds)
        if clipped is None:
            continue
        ix, iy, edge, t_param = clipped
        heading = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        return (ix, iy), heading, edge, idx, t_param

    raise RuntimeError("Path never enters the goal square.")


def _sweep_direction_from_edge(edge):
    if edge in ("left", "right"):
        return "horizontal", ("right" if edge == "left" else "left")
    if edge in ("bottom", "top"):
        return "vertical", ("up" if edge == "bottom" else "down")
    return "horizontal", "right"


def plan_mission():
    """分配扫掠线，规划各机进场与扫掠航迹，并生成高度剖面。"""
    ordered_drones = _prioritize_reference_drone(DRONES, TARGET_ALTITUDE)
    if not ordered_drones:
        raise ValueError("At least one aircraft is required")
    reference_drone = ordered_drones[0]
    reference_path, _, obstacles = plan_approach(
        reference_drone["xy"],
        reference_drone["heading_deg"],
    )
    min_turn_radius = PLANNER_CONFIG["min_turn_radius"]
    _, _, contact_edge, _, _ = _first_sweep_area_contact(
        reference_path,
        SWEEP_CENTER,
        SWEEP_SIDE_LENGTH,
    )
    orientation, start_direction = _sweep_direction_from_edge(contact_edge)
    square = _sweep_square(SWEEP_CENTER, SWEEP_SIDE_LENGTH)
    sweep_paths = build_sweep_paths(
        square,
        SWEEP_SPACING,
        orientation=orientation,
        start_direction=start_direction,
    )
    if not sweep_paths:
        raise RuntimeError("No sweep paths generated")

    if (
        isinstance(SWEEP_DRONE_COUNT, bool)
        or not isinstance(SWEEP_DRONE_COUNT, int)
        or SWEEP_DRONE_COUNT <= 0
    ):
        raise ValueError("SWEEP_DRONE_COUNT must be a positive integer")
    active_count = min(SWEEP_DRONE_COUNT, len(ordered_drones), len(sweep_paths))
    active_drones = ordered_drones[:active_count]
    sweep_bounds = (
        min(point[0] for point in square),
        max(point[0] for point in square),
        min(point[1] for point in square),
        max(point[1] for point in square),
    )
    assignments = assign_paths_to_drones(sweep_paths, active_count)
    reference_approaches = [reference_path]
    for drone in active_drones[1:]:
        path, _, _ = plan_approach(drone["xy"], drone["heading_deg"])
        reference_approaches.append(path)

    connected_sweeps = []
    sweep_orders = []
    transition_distances = []
    for drone, assigned, reference_approach in zip(
        active_drones, assignments, reference_approaches
    ):
        transition_distance = _altitude_transition_distance(
            drone.get("alt", TARGET_ALTITUDE),
            TARGET_ALTITUDE,
            CLIMB_RATE,
            CRUISE_SPEED,
        )
        transition_distances.append(transition_distance)
        assigned_lines = [sweep_paths[index] for index in assigned]
        connected = connect_with_arcs(
            assigned_lines,
            min_radius=min_turn_radius,
            greedy=True,
            arc_samples=24,
            enforce_spacing=True,
            obstacles=obstacles,
            planner_config=PLANNER_CONFIG,
            entry_pose=_approach_reference_pose(
                reference_approach,
                SWEEP_CENTER,
                SWEEP_SIDE_LENGTH,
                transition_distance,
                min_turn_radius,
            ),
            entry_extension=transition_distance,
            exit_extension=transition_distance,
            sweep_bounds=sweep_bounds,
            turn_transition_distance=transition_distance,
            layer_hold_distance=CRUISE_SPEED * LAYER_HOLD_TIME
            if transition_distance > 0
            else 0.0,
        )
        connected_sweeps.append(connected)
        sweep_orders.append([assigned[index] for index, _ in connected.order])

    final_paths = [
        _plan_approach_to_sweep(
            drone,
            sweep,
            min_turn_radius=min_turn_radius,
            obstacles=obstacles,
            planner_config=PLANNER_CONFIG,
        )
        for drone, sweep in zip(active_drones, connected_sweeps)
    ]
    trajectories = [
        build_altitude_profile(
            path,
            own_altitude=float(drone.get("alt", TARGET_ALTITUDE)),
            target_altitude=TARGET_ALTITUDE,
            bounds=sweep_bounds,
            speed=CRUISE_SPEED,
            climb_rate=CLIMB_RATE,
            layer_hold_time=LAYER_HOLD_TIME,
        )
        for drone, path in zip(active_drones, final_paths)
    ]
    return dict(
        paths=final_paths,
        trajectories=trajectories,
        drones=active_drones,
        square=square,
        obstacles=obstacles,
        sweep_paths=sweep_paths,
        transition_distances=transition_distances,
        sweep_orders=sweep_orders,
        outside_connectors=[route.outside_connectors for route in connected_sweeps],
        speed=CRUISE_SPEED,
        climb_rate=CLIMB_RATE,
        layer_hold_time=LAYER_HOLD_TIME,
        target_altitude=TARGET_ALTITUDE,
    )


def main():
    mission = plan_mission()
    plot_mission_paths(
        mission["square"],
        mission["obstacles"],
        mission["paths"],
        drones=mission["drones"],
        obstacle_margin=PLANNER_CONFIG["obstacle_margin"],
        show=False,
    )
    plt.show()
    return mission


if __name__ == "__main__":
    main()
