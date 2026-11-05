"""生成圆形障碍物场。"""

import math


def generate_arc_obstacles(
    center, ring_radius, spacing_along_arc, obstacle_radius, index_range
):
    """沿圆周按弧长等距放置障碍物，索引范围包含两端。"""
    center_x, center_y = center
    angle_step = spacing_along_arc / ring_radius
    if angle_step <= 0:
        raise ValueError("spacing_along_arc must be > 0")

    point_count = max(1, int(math.ceil(2 * math.pi / angle_step)))
    first_index, last_index = index_range
    first_index = max(0, first_index)
    last_index = max(first_index, min(last_index, point_count - 1))

    obstacles = []
    for index in range(first_index, last_index + 1):
        theta = index * angle_step
        x = center_x + ring_radius * math.cos(theta)
        y = center_y + ring_radius * math.sin(theta)
        obstacles.append((x, y, obstacle_radius))
    return obstacles
