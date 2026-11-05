"""将独立场景转换为逐机规划任务，保留成功结果与已有失败判断。"""

from copy import deepcopy
import math
import re
import time

from shapely.geometry import Polygon

if __package__:
    from . import hybrid_astar as motion
    if "." in __package__:
        from .. import run_planner
    else:
        import run_planner
    from .altitude_profile import _infer_route_segment, build_altitude_profile
    from .hybrid_sweep_planner import HybridSweepPlanner
    from .sweep_routes import build_sweep_paths, connect_with_arcs
else:
    import hybrid_astar as motion
    import run_planner
    from altitude_profile import _infer_route_segment, build_altitude_profile
    from hybrid_sweep_planner import HybridSweepPlanner
    from sweep_routes import build_sweep_paths, connect_with_arcs


_PARAMETERS = (
    "speed",
    "min_turn_radius",
    "climb_rate",
    "obstacle_margin",
    "layer_hold_time",
)
_SAMPLING_PRESETS = {
    "sparse": (400.0, 12.0),
    "standard": (150.0, 7.5),
    "fine": (60.0, 3.0),
    "custom": (150.0, 7.5),
}


def default_scene():
    return {
        "version": 1,
        "name": "请君入瓮",
        "world": {
            "min": run_planner.PLANNER_CONFIG["world_min"],
            "max": run_planner.PLANNER_CONFIG["world_max"],
        },
        "sweep": {
            "center": list(run_planner.SWEEP_CENTER),
            "size": run_planner.SWEEP_SIDE_LENGTH,
            "spacing": run_planner.SWEEP_SPACING,
            "altitude": run_planner.TARGET_ALTITUDE,
            "orientation": "auto",
        },
        "defaults": {
            "speed": run_planner.CRUISE_SPEED,
            "min_turn_radius": run_planner.MIN_TURN_RADIUS,
            "climb_rate": run_planner.CLIMB_RATE,
            "obstacle_margin": run_planner.PLANNER_CONFIG["obstacle_margin"],
            "layer_hold_time": run_planner.LAYER_HOLD_TIME,
        },
        "aircraft": [
            {
                "id": drone["name"],
                "name": drone["name"],
                "x": drone["xy"][0],
                "y": drone["xy"][1],
                "heading_deg": drone["heading_deg"],
                "altitude": drone["alt"],
                "enabled": True,
                "overrides": {},
            }
            for drone in run_planner.DRONES[:5]
        ],
        "obstacles": [
            {
                "id": f"obstacle_{index + 1}",
                "type": "circle",
                "center": [x, y],
                "radius": radius,
            }
            for index, (x, y, radius) in enumerate(run_planner.OBSTACLES)
        ],
        "sampling": {
            "preset": "standard",
            "sample_step": 150.0,
            "max_arc_angle_deg": 7.5,
        },
        "search": {
            "timeout_s": 10.0,
            "max_expansions": 20000,
            "shortcut_attempts": 120,
        },
        "assignment": "distance",
    }


def _object(value, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label}必须是对象")
    return value


def _number(value, label, *, positive=False, nonnegative=False, maximum=None):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label}必须是有限数值")
    try:
        number = float(value)
    except (ValueError, OverflowError) as exc:
        raise ValueError(f"{label}必须是有限数值") from exc
    if not math.isfinite(number):
        raise ValueError(f"{label}必须是有限数值")
    if positive and number <= 0:
        raise ValueError(f"{label}必须大于0")
    if nonnegative and number < 0:
        raise ValueError(f"{label}不能小于0")
    if maximum is not None and number > maximum:
        raise ValueError(f"{label}不能大于{maximum:g}")
    return number


def _integer(value, label, minimum, maximum):
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or not minimum <= value <= maximum
    ):
        raise ValueError(f"{label}必须是{minimum}到{maximum}之间的整数")
    return value


def _text(value, label, maximum=120):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f"{label}必须是1到{maximum}个字符的文本")
    return value.strip()


def _point(value, label):
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise ValueError(f"{label}必须包含两个坐标")
    return [_number(value[0], f"{label}的X坐标"), _number(value[1], f"{label}的Y坐标")]


def _parameter_values(values, defaults, label):
    values = _object(values, label)
    return {
        key: _number(
            values.get(key, defaults[key]),
            f"{label}.{key}",
            positive=key in ("speed", "min_turn_radius", "climb_rate"),
            nonnegative=key in ("obstacle_margin", "layer_hold_time"),
        )
        for key in _PARAMETERS
    }


def normalize_scene(scene):
    """校验字段、几何有效性与输入规模，返回不共享可变对象的场景快照。"""
    scene = _object(scene, "场景")
    base = default_scene()
    _integer(scene.get("version", 1), "场景版本", 1, 1)
    world = _object(scene.get("world", base["world"]), "规划边界")
    lower = _number(world.get("min", base["world"]["min"]), "边界下限")
    upper = _number(world.get("max", base["world"]["max"]), "边界上限")
    if lower >= upper or not math.isfinite(upper - lower):
        raise ValueError("规划边界上限必须大于下限，且跨度必须有限")

    sweep = _object(scene.get("sweep", base["sweep"]), "扫掠区域")
    orientation = sweep.get("orientation", "auto")
    if orientation not in ("auto", "horizontal", "vertical"):
        raise ValueError("扫掠方向必须为auto、horizontal或vertical")
    sweep = {
        "center": _point(sweep.get("center", base["sweep"]["center"]), "扫掠中心"),
        "size": _number(
            sweep.get("size", base["sweep"]["size"]), "扫掠边长", positive=True
        ),
        "spacing": _number(
            sweep.get("spacing", base["sweep"]["spacing"]), "扫掠间距", positive=True
        ),
        "altitude": _number(
            sweep.get("altitude", base["sweep"]["altitude"]), "目标高度"
        ),
        "orientation": orientation,
    }
    if (
        not math.isfinite(sweep["size"] / sweep["spacing"])
        or sweep["size"] / sweep["spacing"] > 200
    ):
        raise ValueError("单个场景最多生成200条扫掠线，请增大扫掠间距")
    if not all(
        math.isfinite(value + sign * sweep["size"] / 2)
        for value in sweep["center"]
        for sign in (-1, 1)
    ):
        raise ValueError("扫掠区域坐标计算必须保持有限")
    defaults = _parameter_values(
        scene.get("defaults", {}), base["defaults"], "统一参数"
    )

    aircraft = scene.get("aircraft", base["aircraft"])
    if not isinstance(aircraft, list) or not 1 <= len(aircraft) <= 30:
        raise ValueError("场景必须包含1到30架无人机")
    normalized_aircraft, identifiers = [], set()
    for index, aircraft_data in enumerate(aircraft):
        aircraft_data = _object(aircraft_data, f"第{index + 1}架无人机")
        identifier = _text(
            aircraft_data.get("id", f"aircraft_{index + 1}"), "无人机标识", 80
        )
        if identifier in identifiers:
            raise ValueError("无人机标识不能重复")
        identifiers.add(identifier)
        enabled = aircraft_data.get("enabled", True)
        if not isinstance(enabled, bool):
            raise ValueError("无人机enabled必须是布尔值")
        overrides = _object(aircraft_data.get("overrides", {}), "逐机参数")
        if set(overrides) - set(_PARAMETERS):
            raise ValueError(
                "逐机覆盖仅支持速度、转弯半径、爬升率、障碍净空和等高保持时间"
            )
        resolved = _parameter_values(overrides, defaults, "逐机参数")
        normalized_aircraft.append(
            {
                "id": identifier,
                "name": _text(aircraft_data.get("name", identifier), "无人机名称"),
                "x": _number(aircraft_data.get("x"), "无人机X坐标"),
                "y": _number(aircraft_data.get("y"), "无人机Y坐标"),
                "heading_deg": _number(
                    aircraft_data.get("heading_deg", 0.0), "起始航向"
                ),
                "altitude": _number(
                    aircraft_data.get("altitude", sweep["altitude"]), "本机高度"
                ),
                "enabled": enabled,
                "overrides": {key: resolved[key] for key in overrides},
            }
        )

    obstacles = scene.get("obstacles", base["obstacles"])
    if not isinstance(obstacles, list) or len(obstacles) > 100:
        raise ValueError("场景最多包含100个障碍物")
    normalized_obstacles, identifiers = [], set()
    for index, obstacle in enumerate(obstacles):
        obstacle = _object(obstacle, f"第{index + 1}个障碍物")
        identifier = _text(
            obstacle.get("id", f"obstacle_{index + 1}"), "障碍物标识", 80
        )
        if identifier in identifiers:
            raise ValueError("障碍物标识不能重复")
        identifiers.add(identifier)
        kind = obstacle.get("type", "circle")
        item = {"id": identifier, "type": kind}
        if kind == "circle":
            item.update(
                center=_point(obstacle.get("center"), "障碍物圆心"),
                radius=_number(obstacle.get("radius"), "障碍物半径", nonnegative=True),
            )
        elif kind == "rectangle":
            item.update(
                center=_point(obstacle.get("center"), "矩形中心"),
                width=_number(obstacle.get("width"), "矩形宽度", positive=True),
                height=_number(obstacle.get("height"), "矩形高度", positive=True),
                rotation_deg=_number(obstacle.get("rotation_deg", 0.0), "矩形旋转角"),
            )
        elif kind == "polygon":
            vertices = obstacle.get("vertices")
            if not isinstance(vertices, list) or not 3 <= len(vertices) <= 100:
                raise ValueError("多边形必须包含3到100个顶点")
            vertices = [_point(point, "多边形顶点") for point in vertices]
            if vertices[0] == vertices[-1]:
                vertices.pop()
            polygon = Polygon(vertices) if len(vertices) >= 3 else None
            if (
                polygon is None
                or not polygon.is_valid
                or polygon.area <= 0
                or not math.isfinite(polygon.area)
            ):
                raise ValueError("障碍多边形必须不自交且具有有效面积")
            item["vertices"] = vertices
        else:
            raise ValueError("障碍物类型必须为circle、rectangle或polygon")
        normalized_obstacles.append(item)

    sampling = _object(scene.get("sampling", {}), "航点采样")
    preset = sampling.get("preset", "standard")
    if not isinstance(preset, str) or preset not in _SAMPLING_PRESETS:
        raise ValueError("采样预设必须为sparse、standard、fine或custom")
    sample_step, angle = _SAMPLING_PRESETS[preset]
    sampling = {
        "preset": preset,
        "sample_step": _number(
            sampling.get("sample_step", sample_step), "圆弧采样间距", positive=True
        ),
        "max_arc_angle_deg": _number(
            sampling.get("max_arc_angle_deg", angle),
            "最大采样转角",
            positive=True,
            maximum=90,
        ),
    }
    search = _object(scene.get("search", {}), "搜索参数")
    search = {
        "timeout_s": _number(
            search.get("timeout_s", 10.0), "单次搜索时间", positive=True, maximum=30
        ),
        "max_expansions": _integer(
            search.get("max_expansions", 20000), "搜索扩展上限", 1, 100000
        ),
        "shortcut_attempts": _integer(
            search.get("shortcut_attempts", 120), "捷径优化次数", 0, 500
        ),
    }
    assignment = scene.get("assignment", "distance")
    if assignment not in ("distance", "time"):
        raise ValueError("分配方式必须为distance或time")
    try:
        motion.World(normalized_obstacles, (lower, upper, lower, upper), 0.0)
    except (ValueError, TypeError, OverflowError) as exc:
        raise ValueError("障碍物必须构成有效的圆、矩形或不自交多边形") from exc
    return {
        "version": 1,
        "name": _text(scene.get("name", base["name"]), "场景名称"),
        "world": {"min": lower, "max": upper},
        "sweep": sweep,
        "defaults": defaults,
        "aircraft": normalized_aircraft,
        "obstacles": normalized_obstacles,
        "sampling": sampling,
        "search": search,
        "assignment": assignment,
    }


def map_planning_error(exc, stage):
    """仅翻译已有异常，不据搜索失败推断几何不可达或具体障碍归因。"""
    source = str(exc)
    mappings = (
        ("Start is outside", "start_not_free", "起点越出规划边界或位于障碍净空区内。"),
        ("Goal is outside", "goal_not_free", "目标点越出规划边界或位于障碍净空区内。"),
        (
            "Search time limit",
            "search_timeout",
            "搜索达到时间上限，本次未找到可行路径。",
        ),
        (
            "Expansion limit",
            "search_limit",
            "搜索达到扩展次数上限，本次未找到可行路径。",
        ),
        (
            "Search exhausted",
            "search_exhausted",
            "当前离散搜索已耗尽，本次未找到可行路径。",
        ),
        (
            "Sweep line intersects",
            "sweep_collision",
            "扫掠直线与障碍净空区相交或越出规划边界。",
        ),
        (
            "Sweep route intersects",
            "route_collision",
            "扫掠航迹与障碍净空区相交或越出规划边界。",
        ),
        (
            "Sweep arc intersects",
            "arc_collision",
            "扫掠圆弧与障碍净空区相交或越出规划边界。",
        ),
        (
            "Sweep lines or terminal extensions",
            "sweep_collision",
            "扫掠直线或首尾延长段与障碍净空区相交或越出规划边界。",
        ),
        (
            "No sweep order satisfies",
            "sweep_order_failed",
            "未找到同时满足升降直线、区外转弯、障碍物及规划边界约束的扫掠访问顺序。",
        ),
        (
            "No outside sweep connector",
            "sweep_connection_failed",
            "未找到满足区外转弯及必需升降直线约束的连接航迹。",
        ),
        (
            "No valid analytic candidate",
            "entry_connection_failed",
            "未找到有效的扫掠入口解析连接。",
        ),
        (
            "No Dubins candidate",
            "sweep_connection_failed",
            "未找到连接剩余扫掠线的Dubins候选。",
        ),
        (
            "No Dubins connector",
            "sweep_connection_failed",
            "未找到连接扫掠线的Dubins航迹。",
        ),
        ("Final route starts", "start_not_free", "完整航迹的起点不在规划自由区域内。"),
        (
            "Route changes heading",
            "heading_invalid",
            "航迹存在未前进却改变航向的航点。",
        ),
        (
            "Route violates heading",
            "motion_invalid",
            "航迹未通过航向连续性或最小转弯半径校验。",
        ),
        ("Path never enters", "sweep_not_entered", "接近航迹未进入扫掠区域。"),
        ("No sweep paths generated", "sweep_empty", "未生成扫掠直线。"),
        (
            "Outside turn at",
            "height_turn_invalid",
            "区外转弯发生高度变化或未保持本机高度；升降必须在转弯前后的直线上完成。",
        ),
        ("Compact path exceeds", "sampling_limit", "输出航点数量超过当前采样预算。"),
        (
            "Unable to construct collision-free output chords",
            "sampling_failed",
            "未能生成通过碰撞校验的航点弦线。",
        ),
        (
            "Cannot sample an invalid",
            "validation_failed",
            "待采样航迹未通过解析碰撞校验。",
        ),
        (
            "Cannot sample a path from",
            "start_not_free",
            "待采样航迹的起点不在规划自由区域内。",
        ),
        (
            "Internal error: final path",
            "validation_failed",
            "规划航迹未通过最终位置或碰撞校验。",
        ),
        (
            "Internal error: final motion",
            "motion_invalid",
            "规划航迹未通过最终运动约束校验。",
        ),
    )
    for prefix, code, message in mappings:
        if source.startswith(prefix):
            return {"code": code, "message": message, "stage": stage, "details": {}}
    numeric = r"([-+\d.eE]+)"
    for prefix, code, message in (
        (
            "Initial approach",
            "entry_distance_short",
            "进场区外直线距离不足以完成入区升降。",
        ),
        (
            "Terminal departure",
            "exit_distance_short",
            "离场区外直线距离不足以恢复本机高度。",
        ),
        (
            "Outside excursion",
            "outside_distance_short",
            "区外航程不足以完成两次升降及本机高度保持。",
        ),
    ):
        if source.startswith(prefix):
            numbers = re.search(
                r"has " + numeric + r"m.*?at least " + numeric + r"m", source
            )
            details = {}
            if numbers:
                details = {
                    "available_distance_m": float(numbers[1]),
                    "required_distance_m": float(numbers[2]),
                }
                message += f"现有{numbers[1]}米，至少需要{numbers[2]}米。"
            return {
                "code": code,
                "message": message,
                "stage": stage,
                "details": details,
            }
    if any("\u4e00" <= char <= "\u9fff" for char in source):
        message = source
    elif isinstance(exc, (ValueError, TypeError)):
        message = "输入参数或航迹数据不满足当前阶段要求。"
    else:
        message = "当前阶段未完成规划。"
    return {
        "code": "invalid_input"
        if isinstance(exc, (ValueError, TypeError))
        else "planning_failed",
        "message": message,
        "stage": stage,
        "details": {},
    }


def _resolved_parameters(scene, aircraft):
    return dict(scene["defaults"], **aircraft["overrides"])


def _planner_config(scene, parameters):
    # 入口排序使用固定内部采样，显示稀疏度不改变规划决策。
    return {
        "world_min": scene["world"]["min"],
        "world_max": scene["world"]["max"],
        "min_turn_radius": parameters["min_turn_radius"],
        "speed": parameters["speed"],
        "obstacle_margin": parameters["obstacle_margin"],
        "sample_step": parameters["min_turn_radius"] * 0.05,
        "max_arc_angle": 0.15,
        **scene["search"],
    }


def _assign_sweeps(sweep_paths, aircraft, parameters, assignment):
    loads = [0.0] * len(aircraft)
    groups = [[] for _ in aircraft]
    lengths = [
        sum(math.dist(a, b) for a, b in zip(path, path[1:])) for path in sweep_paths
    ]
    for index in sorted(
        range(len(sweep_paths)), key=lambda value: lengths[value], reverse=True
    ):
        if assignment == "time":
            target = min(
                range(len(aircraft)),
                key=lambda value: (
                    (loads[value] + lengths[index]) / parameters[value]["speed"]
                ),
            )
        else:
            target = min(range(len(aircraft)), key=lambda value: loads[value])
        groups[target].append(index)
        loads[target] += lengths[index]
    return groups


def _route_geometry(route):
    segments = []
    for index, (start, end) in enumerate(zip(route, route[1:])):
        inferred = _infer_route_segment(motion.Pose(*start), motion.Pose(*end), index)
        if inferred is not None:
            segments.append(motion.Segment(inferred.length, inferred.curvature))
    segments = motion.merge_segments(segments)
    pose, distance, motions = motion.Pose(*route[0]), 0.0, []
    for segment in segments:
        motions.append(
            {
                "x": pose.x,
                "y": pose.y,
                "yaw": pose.yaw,
                "length": segment.length,
                "curvature": segment.curvature,
                "s_start": distance,
            }
        )
        pose = motion.advance(pose, segment.curvature, segment.length)
        distance += segment.length
    return segments, motions


def _sample_with_height(route, segments, scene, aircraft, parameters, world, bounds):
    sampling = scene["sampling"]
    options = {
        "step": sampling["sample_step"],
        "max_arc_angle": math.radians(sampling["max_arc_angle_deg"]),
        "world": world,
    }
    path = motion.compact_path(motion.Pose(*route[0]), segments, **options)
    height_options = {
        "own_altitude": aircraft["altitude"],
        "target_altitude": scene["sweep"]["altitude"],
        "bounds": bounds,
        "speed": parameters["speed"],
        "climb_rate": parameters["climb_rate"],
        "layer_hold_time": parameters["layer_hold_time"],
    }
    trajectory = build_altitude_profile(path, **height_options)
    # 高度断点会增加航点，再检查新增弦线并保留所有断点。
    refined = [(trajectory[0]["x"], trajectory[0]["y"], trajectory[0]["yaw"])]
    for index, (start, end) in enumerate(zip(trajectory, trajectory[1:])):
        start_pose = motion.Pose(start["x"], start["y"], start["yaw"])
        end_pose = motion.Pose(end["x"], end["y"], end["yaw"])
        segment = _infer_route_segment(start_pose, end_pose, index)
        if segment is not None:
            points = motion.compact_path(
                start_pose,
                [motion.Segment(segment.length, segment.curvature)],
                **options,
            )
            refined.extend(points[1:])
    trajectory = build_altitude_profile(refined, **height_options)
    path = [(row["x"], row["y"], row["yaw"]) for row in trajectory]
    run_planner._validate_route(path, world, parameters["min_turn_radius"])
    return path, trajectory


def plan_scene(scene, progress=None):
    started_at = time.perf_counter()
    scene = normalize_scene(scene)
    square = run_planner._sweep_square(scene["sweep"]["center"], scene["sweep"]["size"])
    bounds = (
        min(p[0] for p in square),
        max(p[0] for p in square),
        min(p[1] for p in square),
        max(p[1] for p in square),
    )
    results = [
        {
            "id": aircraft["id"],
            "name": aircraft["name"],
            "status": "idle",
            "path": [],
            "trajectory": [],
            "motions": [],
            "stats": {
                "path_length_m": 0.0,
                "flight_time_s": 0.0,
                "planning_time_s": 0.0,
                "output_points": 0,
                "trajectory_points": 0,
                "expanded_nodes": 0,
            },
        }
        for aircraft in scene["aircraft"]
    ]
    enabled = [
        index for index, aircraft in enumerate(scene["aircraft"]) if aircraft["enabled"]
    ]
    completed = 0

    def notify(stage, index=None):
        if progress is not None:
            progress(
                {
                    "completed": completed,
                    "total": len(enabled),
                    "stage": stage,
                    "aircraft_id": None
                    if index is None
                    else scene["aircraft"][index]["id"],
                }
            )

    def fail(index, exc, stage):
        nonlocal completed
        results[index]["status"] = "failed"
        results[index]["error"] = map_planning_error(exc, stage)
        completed += 1
        notify("failed", index)

    ordered = list(enabled)
    if ordered:
        reference = min(
            ordered,
            key=lambda index: abs(
                scene["aircraft"][index]["altitude"] - scene["sweep"]["altitude"]
            ),
        )
        ordered = [reference] + [index for index in ordered if index != reference]
    references, planners, elapsed = {}, {}, {}
    for index in ordered:
        aircraft_started = time.perf_counter()
        aircraft = scene["aircraft"][index]
        notify("reference", index)
        try:
            parameters = _resolved_parameters(scene, aircraft)
            planner = HybridSweepPlanner(**_planner_config(scene, parameters))
            reference_path, stats = planner.plan(
                (aircraft["x"], aircraft["y"]),
                aircraft["heading_deg"],
                scene["sweep"]["center"],
                scene["obstacles"],
            )
            references[index] = (reference_path, stats)
            planners[index] = planner
        except (ValueError, RuntimeError, TypeError, OverflowError) as exc:
            fail(index, exc, "reference")
        elapsed[index] = time.perf_counter() - aircraft_started
        results[index]["stats"]["planning_time_s"] = elapsed[index]

    sweep_paths = []
    available = [index for index in ordered if index in references]
    if available:
        try:
            orientation = scene["sweep"]["orientation"]
            if orientation == "auto":
                reference_path = references[available[0]][0]
                contact_path = (
                    reference_path if len(reference_path) > 1 else reference_path * 2
                )
                _, _, edge, _, _ = run_planner._first_sweep_area_contact(
                    contact_path, scene["sweep"]["center"], scene["sweep"]["size"]
                )
                orientation, start_direction = run_planner._sweep_direction_from_edge(
                    edge
                )
            else:
                start_direction = "right" if orientation == "horizontal" else "up"
            sweep_paths = build_sweep_paths(
                square,
                scene["sweep"]["spacing"],
                orientation=orientation,
                start_direction=start_direction,
            )
            if not sweep_paths:
                raise RuntimeError("No sweep paths generated")
        except (ValueError, RuntimeError, TypeError, OverflowError) as exc:
            for index in available:
                fail(index, exc, "sweep")
            available = []

    if available:
        active = available[: len(sweep_paths)]
        for index in available[len(sweep_paths) :]:
            completed += 1
            notify("idle", index)
        aircraft = [scene["aircraft"][index] for index in active]
        parameters_list = [_resolved_parameters(scene, item) for item in aircraft]
        groups = _assign_sweeps(
            sweep_paths, aircraft, parameters_list, scene["assignment"]
        )
        for index, parameters, assigned in zip(active, parameters_list, groups):
            if not assigned:
                completed += 1
                notify("idle", index)
                continue
            aircraft_started = time.perf_counter()
            aircraft = scene["aircraft"][index]
            planner = planners[index]
            stage = "sweep"
            notify(stage, index)
            try:
                distance = (
                    abs(aircraft["altitude"] - scene["sweep"]["altitude"])
                    * parameters["speed"]
                    / parameters["climb_rate"]
                )
                connected = connect_with_arcs(
                    [sweep_paths[line] for line in assigned],
                    parameters["min_turn_radius"],
                    greedy=True,
                    arc_samples=24,
                    enforce_spacing=True,
                    obstacles=scene["obstacles"],
                    planner_config=_planner_config(scene, parameters),
                    entry_pose=run_planner._approach_reference_pose(
                        references[index][0],
                        scene["sweep"]["center"],
                        scene["sweep"]["size"],
                        distance,
                        parameters["min_turn_radius"],
                    ),
                    entry_extension=distance,
                    exit_extension=distance,
                    sweep_bounds=bounds,
                    turn_transition_distance=distance,
                    layer_hold_distance=parameters["speed"]
                    * parameters["layer_hold_time"]
                    if distance > 0
                    else 0.0,
                )
                stage = "approach"
                notify(stage, index)
                entry = connected.poses[0]
                approach, approach_stats = planner.plan_to_pose(
                    (aircraft["x"], aircraft["y"]),
                    aircraft["heading_deg"],
                    entry[:2],
                    math.degrees(entry[2]),
                    scene["obstacles"],
                )
                route = approach + connected.poses[1:]
                stage = "validation"
                notify(stage, index)
                world = motion.World(
                    scene["obstacles"], planner.bounds, parameters["obstacle_margin"]
                )
                run_planner._validate_route(route, world, parameters["min_turn_radius"])
                segments, motions = _route_geometry(route)
                stage = "altitude"
                notify(stage, index)
                path, trajectory = _sample_with_height(
                    route, segments, scene, aircraft, parameters, world, bounds
                )
                length = sum(segment.length for segment in segments)
                results[index].update(
                    status="success", path=path, trajectory=trajectory, motions=motions
                )
                results[index]["stats"].update(
                    path_length_m=length,
                    flight_time_s=length / parameters["speed"],
                    output_points=len(path),
                    trajectory_points=len(trajectory),
                    expanded_nodes=references[index][1]["expanded_nodes"]
                    + approach_stats["expanded_nodes"],
                )
                completed += 1
                notify("success", index)
            except (ValueError, RuntimeError, TypeError, OverflowError) as exc:
                fail(index, exc, stage)
            results[index]["stats"]["planning_time_s"] = (
                elapsed[index] + time.perf_counter() - aircraft_started
            )

    success_count = sum(item["status"] == "success" for item in results)
    failure_count = sum(item["status"] == "failed" for item in results)
    status = (
        "partial"
        if success_count and failure_count
        else "failed"
        if failure_count
        else "completed"
    )
    notify("finished")
    return {
        "scene": scene,
        "status": status,
        "aircraft": results,
        "sweep_paths": sweep_paths,
        "square": square,
        "duration_s": max(
            (item["stats"]["flight_time_s"] for item in results), default=0.0
        ),
        "planning_time_s": time.perf_counter() - started_at,
    }


def scene_presets():
    default = default_scene()
    open_scene = deepcopy(default)
    open_scene.update(name="空旷场景", obstacles=[])
    staggered = deepcopy(default)
    staggered.update(
        name="交错障碍",
        obstacles=[
            {
                "id": "rectangle_1",
                "type": "rectangle",
                "center": [25000.0, 20000.0],
                "width": 8000.0,
                "height": 24000.0,
                "rotation_deg": 0.0,
            },
            {
                "id": "rectangle_2",
                "type": "rectangle",
                "center": [39000.0, 47000.0],
                "width": 6000.0,
                "height": 24000.0,
                "rotation_deg": 15.0,
            },
        ],
    )
    blocked = deepcopy(default)
    blocked.update(
        name="目标区完全封堵",
        obstacles=[
            {
                "id": "blocked_zone",
                "type": "circle",
                "center": list(default["sweep"]["center"]),
                "radius": 18000.0,
            },
        ],
    )
    return [
        {
            "id": "default",
            "name": default["name"],
            "description": "当前五机配置与原障碍场。",
            "scene": default,
        },
        {
            "id": "open",
            "name": open_scene["name"],
            "description": "移除障碍物，观察扫掠连接与高度转换。",
            "scene": open_scene,
        },
        {
            "id": "staggered",
            "name": staggered["name"],
            "description": "交错矩形障碍，用于尝试不同参数；规划结果以实际校验为准。",
            "scene": staggered,
        },
        {
            "id": "blocked",
            "name": blocked["name"],
            "description": "障碍覆盖目标区域，展示现有起终点检查的失败提示。",
            "scene": blocked,
        },
    ]
