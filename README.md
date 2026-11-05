# HybridSweepPlanner

多机接近与扫掠航迹规划。采用障碍物距离场引导的Hybrid A*生成接近及绕障航段，以Dubins曲线连接具有航向约束的姿态，并按各机高度生成直线升降、等高转弯的完整航迹。

## 安装与快速开始

需要Python 3.10及以上版本。直接依赖仅有以下两个Python库：

| 库 | 用途 |
| --- | --- |
| `matplotlib` | 绘制二维路径规划图 |
| `shapely` | 障碍物几何与有效性检查 |

在项目根目录执行以下命令，pip会自动安装这两个库及其所需的间接依赖：

```powershell
python -m pip install -r scripts/requirements.txt
python run_planner.py
```

`run_planner.py`只显示一幅二维路径规划图。使用网页工作台时，安装相同的Python依赖后双击`start_web.cmd`即可；网页资源已构建，正常运行不需要安装Node.js或前端依赖。

## 目录与入口

项目根目录保留本说明和两个使用入口：`run_planner.py`用于Python规划与二维绘图，`start_web.cmd`用于启动网页工作台。以下命令均在项目根目录执行。

```text
HybridSweepPlanner/
├─ README.md
├─ run_planner.py
├─ start_web.cmd
├─ planner/    规划算法、绘图及网页后端
├─ web/        网页源码与已构建资源
├─ tests/      Python回归测试
├─ scripts/    Python依赖清单与网页维护脚本
└─ docs/       第三方许可证
```

## 网页工作台

双击`start_web.cmd`，或在本目录运行：

```powershell
python -B -m planner.web_server --open
```

默认地址为`http://127.0.0.1:8765`。服务直接调用本项目的HybridSweepPlanner，网页资源已随项目构建，不需要联网或安装前端依赖。关闭运行窗口或按Ctrl+C停止服务。需要其他端口时使用`start_web.cmd --port 8766`。

工作台包括：

- 场景：载入请君入瓮、空旷、交错障碍和目标区完全封堵示例，按随机种子生成障碍物，导入和导出场景JSON。
- 任务配置：修改世界边界、方形扫掠区、扫掠间距、目标高度和任务分配方式。
- 无人机：批量添加、启用和停用；统一设置速度、转弯半径、升降率、净空和本机高度保持时间，并允许每架机单独覆盖性能参数。
- 障碍编辑：点选创建圆形，确定两角后旋转创建矩形，连续点选创建多边形；通过控制点或属性输入调整，支持撤销与重做。矩形和多边形实际参与规划碰撞检查。
- 效果：二维航迹、三维航迹、高度剖面、按真实任务时间播放；XYZ空间尺度为1∶1∶1，三维显示单位统一为千米，不单独拉伸高度。
- 显示：在规划结果表中逐架切换航迹显隐，或在图层菜单中全部显示、全部隐藏；二维、三维及高度剖面同步生效。启用“输出航点”显示每个平面输出航点，三维航点高度按真实航程插值。
- 障碍物：三维视图中圆、旋转矩形及多边形障碍物均从地面0米延伸到2000米；这只是可视化高度，规划仍按平面禁入区域避障。
- 结果：各机航程、飞行时间、平面航点数、高度采样数、接近搜索扩展数量和规划耗时；支持完整结果JSON、轨迹CSV及效果图片导出。

圆形绘制为“圆心→半径→确认”；矩形为“两角→旋转→确认”；多边形可点回起点、双击或按Enter闭合。Esc取消，Delete删除选中对象，Ctrl+Z撤销，Ctrl+Shift+Z重做，滚轮缩放，空格拖动平移。

场景或规划参数变化后，规划按钮高亮，旧结果标记过期；视角和显示图层不触发重新规划。导出结果保留产生该结果的场景快照。稀疏度联动圆弧弧长间隔与最大转角，保留几何及高度转换断点并检查输出弦线；不会按固定步长删除航点。

失败提示只映射已有判断，包括起终点不在自由区、扫掠航段碰撞或越界、区外连接失败、升降距离不足和搜索预算耗尽。已有复合判断仍以复合原因显示，不推断具体障碍编号或几何无解。某架机失败时保留其他飞机的成功结果。取消操作终止对应规划进程。

障碍物按平面禁入区域处理，不通过改变飞行高度越过。任务直线穿过障碍时沿用现有失败检查，不自动裁剪覆盖区域。按预计时间分配时以扫掠线长度除以各机速度平衡任务量，不保证所有飞机同时完成；时间回放不增加多机冲突检测。结果中的接近搜索扩展数量合计参考接近与实际接入，不包含扫掠连接内部搜索。

前端源码位于`web/`。本机依赖集中保存在`D:\Node`，`web/node_modules`为指向共享依赖的目录联接；不要通过该联接安装依赖：

```powershell
. D:\Node\Use-SharedNode.ps1 -ProjectPath "$PWD\web"
Set-Location web
node D:\Node\node_modules\vite\bin\vite.js build
```

也可运行`./scripts/start_web.ps1 -Rebuild`构建并启动，使用`-NoBrowser`仅启动服务。其他电脑按`web/package.json`和`web/pnpm-lock.yaml`准备前端依赖；仅运行已构建网页时只需Python依赖`scripts/requirements.txt`。

网页相关模块为`planner/mission_service.py`（独立场景、逐机参数、结果及错误映射）和`planner/web_server.py`（网页、异步任务、取消及进度接口）。两者不修改命令行任务的全局配置。

## 测试与模块运行

在项目根目录执行回归测试：

```powershell
python -B -m unittest discover -s tests -v
```

从工作区根目录也可运行：

```powershell
python -m pathplaning.HybridSweepPlanner.run_planner
```

路径规划图中，红色实心圆表示实际障碍物，外侧虚线表示净空边界。高度轨迹仍包含在规划结果中，供接口调用和网页工作台使用。

## 模块

| 文件 | 职责 |
| --- | --- |
| `run_planner.py` | 任务配置、参考机选择、扫掠分配及完整任务编排 |
| `planner/hybrid_sweep_planner.py` | `HybridSweepPlanner`接近与连接规划接口 |
| `planner/hybrid_astar.py` | Hybrid A*搜索、Dubins解析连接、碰撞检查及航点采样 |
| `planner/sweep_routes.py` | 扫掠线生成、任务分配、访问排序及区外连接 |
| `planner/altitude_profile.py` | 按真实航程计算高度、时间和阶段 |
| `planner/mission_plotting.py` | 二维平面航迹与高度剖面绘图 |
| `planner/obstacle_utils.py` | 圆周障碍物配置生成 |
| `tests/test_planner.py` | 几何、避障、覆盖和高度约束回归测试 |

## 任务配置

`run_planner.py`中的主要配置如下：

| 配置 | 含义 |
| --- | --- |
| `DRONES` | 各机名称、平面起点、起始航向和本机高度 |
| `SWEEP_CENTER`、`SWEEP_SIDE_LENGTH` | 方形扫掠区域的中心和边长 |
| `SWEEP_SPACING` | 相邻扫掠线的最大间距，默认2000米 |
| `SWEEP_DRONE_COUNT` | 参与扫掠的无人机数量，默认5架 |
| `MIN_TURN_RADIUS` | 最小转弯半径，默认3000米 |
| `CRUISE_SPEED` | 飞行速度，默认200米/秒 |
| `TARGET_ALTITUDE` | 区内扫掠高度，默认2000米 |
| `CLIMB_RATE` | 最大升降率，默认10米/秒 |
| `LAYER_HOLD_TIME` | 每次区外掉头在本机高度的最短保持时间，默认10秒 |
| `OBSTACLES` | 圆形障碍物列表，每项为`(圆心x, 圆心y, 半径)`；网页场景支持圆、矩形和多边形 |
| `PLANNER_CONFIG` | 接近与连接规划器配置 |

高度最接近目标高度的无人机作为参考机，其余无人机保持配置顺序。参考机接近路径的入区方向决定扫掠轴向；扫掠线按长度优先分配给当前任务航程最短的无人机。实际参与数量还受可用无人机和扫掠线数量限制。

## 调用接口

### 接近规划

```python
from run_planner import PLANNER_CONFIG, plan_approach

path, stats, obstacles = plan_approach(
    start=(11000.0, 9000.0),
    start_heading_deg=90.0,
    goal=(60000.0, 60000.0),
    obstacles=[(30000.0, 30000.0, 6000.0)],
    planner_config=PLANNER_CONFIG,
)
```

`goal=None`时读取当前`SWEEP_CENTER`；`obstacles=None`时读取当前`OBSTACLES`，传入`[]`表示无障碍。

底层接口支持自由到达航向与固定到达航向：

```python
from planner.hybrid_sweep_planner import HybridSweepPlanner
from run_planner import PLANNER_CONFIG

planner = HybridSweepPlanner(**PLANNER_CONFIG)
path, stats = planner.plan((11000, 9000), 90, (60000, 60000), [])
path, stats = planner.plan_to_pose((11000, 9000), 90, (50000, 59000), 0, [])
```

位置及距离单位为米；输入航向单位为度，以X轴正向为0°，逆时针为正。输出`path`为`[(x, y, yaw), ...]`，其中`yaw`为弧度切向航向。输出包含精确起点和目标位置；`plan()`不约束到达航向，`plan_to_pose()`约束到达航向。

统计字段为`expanded_nodes`、`segments`、`output_points`、`path_length_m`、`raw_path_length_m`、`flight_time_s`、`planning_time_s`和`algorithm`。路径长度按真实直线和圆弧弧长计算，飞行时间按路径长度除以速度计算。

### 完整任务

```python
from run_planner import plan_mission

mission = plan_mission()
paths = mission['paths']
trajectories = mission['trajectories']
```

`paths`保存各机平面航迹；`trajectories`保存对应高度轨迹。每个高度采样点包含：

| 字段 | 含义 |
| --- | --- |
| `x`、`y` | 平面坐标，米 |
| `alt` | 实际规划高度，米 |
| `yaw` | 切向航向，弧度 |
| `s` | 从起点累计的真实航程，米 |
| `time` | 从任务起点累计的时间，秒 |
| `phase` | 高度阶段 |

`phase`包括`approach_layer`、`entry_transition`、`sweep`、`exit_transition`和`turn_layer`。需要高度控制时读取`alt`；平面航迹三元组的第三项为航向。

任务还返回`drones`、`square`、`obstacles`、`sweep_paths`、`sweep_orders`、`transition_distances`、`outside_connectors`及速度、高度等任务参数。`transition_distances`为各机单次升降所需的直线航程。

## 规划与高度约束

1. 优先尝试解析目标连接；连接受阻时，采用位置与航向分箱的Hybrid A*搜索。运动基元为直线及曲率`±0.5/R`、`±1/R`的前进圆弧。
2. 使用固定种子的有限次Dubins捷径优化，只接受更短且无碰撞的替代航段；位置目标始终保留自由到达航向。
3. 扫掠排序同时比较访问方向、进场代价和连接代价；普通解析连接受阻时，使用同一搜索核心绕障。最终接近段从原始起点直接规划到实际扫掠入口。
4. 完整直线、圆弧及输出点之间的弦线均进行障碍与边界检查。直线保留端点，圆弧按弧长和转角采样；必要时继续细分，防止输出弦线切入障碍物。
5. 入区前沿直线到达目标高度；区内及边界保持目标高度。每次出区先沿直线恢复本机高度，再等高转弯，对准下一条线后沿直线升降至目标高度。最终出区恢复本机高度后结束任务。

单次高度转换所需直线距离为`abs(本机高度-目标高度) / CLIMB_RATE * CRUISE_SPEED`。转弯圆弧不计入升降距离；区外连接还须满足本机高度的最短保持时间。必需升降直线受阻时排除该访问方向，显式指定不可行顺序时抛出异常。

高度剖面解析计算直线、圆弧与区域边界的交点，并保留高度转换断点。默认校验区外转弯全程保持本机高度，升降仅发生在直线上。

## 规划器参数

| 参数 | 含义 |
| --- | --- |
| `world_min`、`world_max` | X、Y共用的坐标上下界，包含边界 |
| `min_turn_radius` | 最小转弯半径 |
| `speed` | 用于估算飞行时间的速度 |
| `obstacle_margin` | 距实际障碍物表面的最小净空，仅膨胀障碍圆 |
| `sample_step` | 圆弧输出点的最大弧长间隔，默认任务配置为150米 |
| `max_arc_angle` | 单个圆弧输出间隔的最大航向变化，默认0.15弧度 |
| `xy_resolution` | 搜索位置分箱精度，默认`R/4` |
| `yaw_resolution_deg` | 搜索航向分箱精度，默认10° |
| `primitive_length` | 搜索基元弧长，默认`R/2` |
| `max_expansions` | 搜索状态扩展数量上限，默认20000 |
| `timeout_s` | 搜索循环时间预算，默认10秒；预处理、后处理和采样另计 |
| `shot_interval` | 解析目标连接的尝试间隔，默认每扩展10个状态 |
| `shortcut_attempts` | 捷径优化次数，0表示关闭；默认任务配置为120次 |

扫掠连接入口为`connect_with_arcs(sweep_lines, min_radius, ...)`；`arc_samples=24`控制扫掠转弯采样，最大航向间隔为7.5°。提供`obstacles`时须同时提供`planner_config`。返回的`HeadingPolyline`保存平面坐标，并通过`poses`保留精确航向、`order`保留访问顺序和反向标记、`outside_connectors`保留区外连接信息。

## 实现边界

- 规避静态圆形、矩形及多边形障碍物，不执行多机时空冲突检测或调度。
- 扫掠任务直线不因障碍物自动裁剪；任务线受阻、连接无解或最终检查失败时抛出`RuntimeError`。
- 输入非法时抛出`ValueError`；搜索失败只表示当前预算或离散精度下未找到路径，不证明几何无解，也不保证全局最短。
- 输出折线与真实圆弧存在采样误差，控制器须按航迹跟踪约定处理。
- 任务不包含返航、降落或扫掠结束后的等待动作。

Dubins公式许可证见[docs/THIRD_PARTY_LICENSE.txt](docs/THIRD_PARTY_LICENSE.txt)。
