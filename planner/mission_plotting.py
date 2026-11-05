"""显示任务的平面航迹和高度剖面。"""

import matplotlib.pyplot as plt


def plot_mission_paths(
    square, obstacles, paths, *, drones=None, obstacle_margin=0.0, show=True
):
    """显示实际障碍物、净空边界及各机完整航迹。"""
    figure, axes = plt.subplots(figsize=(10, 9))
    if square:
        closed_boundary = list(square) + [square[0]]
        boundary_x, boundary_y = zip(*closed_boundary)
        axes.plot(boundary_x, boundary_y, "--k", linewidth=1.2, label="sweep area")
    for index, (center_x, center_y, radius) in enumerate(obstacles or []):
        axes.add_patch(
            plt.Circle(
                (center_x, center_y),
                radius,
                color="r",
                alpha=0.24,
                label="obstacle" if index == 0 else None,
            )
        )
        if obstacle_margin > 0:
            axes.add_patch(
                plt.Circle(
                    (center_x, center_y),
                    radius + obstacle_margin,
                    fill=False,
                    edgecolor="#be7042",
                    linestyle="--",
                    linewidth=0.8,
                    alpha=0.65,
                    label=f"clearance {obstacle_margin:g} m" if index == 0 else None,
                )
            )
    colors = plt.get_cmap("tab20")
    for index, path in enumerate(paths):
        if len(path) < 2:
            continue
        x_coordinates, y_coordinates = zip(*[(pose[0], pose[1]) for pose in path])
        color = colors(index % colors.N)
        label = (
            f"{drones[index]['name']} (layer {drones[index]['alt']:g} m)"
            if drones is not None
            else f"drone {index + 1} sweep"
        )
        axes.plot(
            x_coordinates, y_coordinates, "-", linewidth=2.2, color=color, label=label
        )
        axes.plot(x_coordinates[0], y_coordinates[0], "o", color=color, markersize=5)
        axes.plot(x_coordinates[-1], y_coordinates[-1], "s", color=color, markersize=5)
    axes.set_aspect("equal", "box")
    axes.grid(True, alpha=0.45)
    axes.legend(loc="upper right")
    if show:
        plt.show()
    return figure


def plot_altitude_profiles(
    trajectories, drones, *, square=None, target_altitude=2000.0, show=True
):
    """用二维曲线显示各机高度随航程的变化。"""
    figure, altitude_axes = plt.subplots(figsize=(10, 6.2))
    colors = plt.get_cmap("tab20")
    for index, (samples, drone) in enumerate(zip(trajectories, drones)):
        if not samples:
            continue
        color = colors(index % colors.N)
        label = f"{drone.get('name', f'drone_{index + 1}')} (layer {drone['alt']:g} m)"
        altitudes = [row["alt"] for row in samples]
        distances = [row["s"] / 1000 for row in samples]
        altitude_axes.plot(
            distances, altitudes, color=color, linewidth=1.8, label=label
        )
        altitude_axes.axhline(
            float(drone["alt"]), color=color, linestyle=":", linewidth=0.7, alpha=0.35
        )
    altitude_axes.axhline(
        target_altitude,
        color="black",
        linestyle="--",
        linewidth=1,
        label=f"target height {target_altitude:g} m",
    )
    altitude_axes.set_xlabel("Travelled distance (km)")
    altitude_axes.set_ylabel("Altitude (m)")
    altitude_axes.set_title("Reach own layer before each outside turn")
    altitude_axes.grid(True, alpha=0.35)
    altitude_axes.legend(loc="best", fontsize=8)
    figure.tight_layout()
    if show:
        plt.show()
    return figure
