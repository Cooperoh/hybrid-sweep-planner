"""为扫掠任务提供满足转弯半径和障碍净空约束的接近与连接航迹。"""

import math
import time

if __package__:
    from . import hybrid_astar as motion
else:
    import hybrid_astar as motion


class HybridSweepPlanner:
    def __init__(
        self,
        world_max,
        sample_step,
        min_turn_radius,
        speed,
        *,
        world_min=0.0,
        obstacle_margin=0.0,
        max_expansions=20000,
        shortcut_attempts=60,
        primitive_length=None,
        xy_resolution=None,
        yaw_resolution_deg=10.0,
        timeout_s=10.0,
        shot_interval=10,
        max_arc_angle=0.15,
    ):
        for name, value in (("world_max", world_max), ("world_min", world_min)):
            if not math.isfinite(value):
                raise ValueError(f"{name} must be finite")
        for name, value in (
            ("sample_step", sample_step),
            ("min_turn_radius", min_turn_radius),
            ("speed", speed),
            ("max_arc_angle", max_arc_angle),
        ):
            if not math.isfinite(value) or value <= 0:
                raise ValueError(f"{name} must be finite and positive")
        if max_arc_angle > math.pi / 2:
            raise ValueError("max_arc_angle must be <= pi/2")

        self.world_min = float(world_min)
        self.world_max = float(world_max)
        lower, upper = sorted((self.world_min, self.world_max))
        self.bounds = (lower, upper, lower, upper)
        self.sample_step = sample_step
        self.min_turn_radius = min_turn_radius
        self.speed = speed
        self.obstacle_margin = obstacle_margin
        self.max_arc_angle = max_arc_angle
        self.config = motion.HybridAStarConfig(
            min_turn_radius=min_turn_radius,
            obstacle_margin=obstacle_margin,
            xy_resolution=xy_resolution
            if xy_resolution is not None
            else min_turn_radius / 4,
            yaw_resolution_deg=yaw_resolution_deg,
            primitive_length=primitive_length
            if primitive_length is not None
            else min_turn_radius / 2,
            max_expansions=max_expansions,
            timeout_s=timeout_s,
            shot_interval=shot_interval,
            shortcut_attempts=shortcut_attempts,
        )
        self.obstacles = []
        self.segments = []
        self.result = None

    def plan(self, start, start_heading_deg, goal, obstacles):
        """规划到目标位置，到达航向自由；返回弧度航向航点和统计量。"""
        return self._plan(start, start_heading_deg, goal, None, obstacles)

    def plan_to_pose(self, start, start_heading_deg, goal, goal_heading_deg, obstacles):
        """规划到指定目标姿态，输入起始及目标航向均为度。"""
        return self._plan(start, start_heading_deg, goal, goal_heading_deg, obstacles)

    def _plan(self, start, start_heading_deg, goal, goal_heading_deg, obstacles):
        started_at = time.perf_counter()
        self.segments, self.result = [], None
        if len(start) != 2 or len(goal) != 2:
            raise ValueError("start and goal must contain x and y")
        start_pose = motion.Pose(
            float(start[0]), float(start[1]), math.radians(start_heading_deg)
        )
        goal_pose = motion.Pose(
            float(goal[0]),
            float(goal[1]),
            None if goal_heading_deg is None else math.radians(goal_heading_deg),
        )
        self.obstacles = list(obstacles)
        world = motion.World(self.obstacles, self.bounds, self.obstacle_margin)
        result = motion.plan_hybrid_astar(
            start_pose, goal_pose, self.obstacles, self.bounds, self.config
        )
        self.result = result
        if not result.success:
            raise RuntimeError(result.message)
        self.segments = result.segments
        path = motion.compact_path(
            start_pose,
            result.segments,
            self.sample_step,
            max_arc_angle=self.max_arc_angle,
            world=world,
        )
        stats = {
            "expanded_nodes": result.expanded_nodes,
            "segments": len(result.segments),
            "output_points": len(path),
            "path_length_m": result.length,
            "raw_path_length_m": result.raw_length,
            "flight_time_s": result.length / self.speed,
            "planning_time_s": time.perf_counter() - started_at,
            "algorithm": "Hybrid A* + Dubins",
        }
        return path, stats
