const COLORS = ['#168b78', '#4676b7', '#b17c36', '#8e68ad', '#be6578', '#6c8f42', '#398eac', '#a17358'];
const TAU = Math.PI * 2;
const copy = value => structuredClone(value);
const radians = degrees => degrees * Math.PI / 180;
const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const rotate = (point, angle) => [point[0] * Math.cos(angle) - point[1] * Math.sin(angle), point[0] * Math.sin(angle) + point[1] * Math.cos(angle)];
export function obstacleVertices(obstacle) {
    if (obstacle.type === 'polygon')
        return obstacle.vertices;
    if (obstacle.type !== 'rectangle')
        return [];
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => {
        const offset = rotate([x * obstacle.width / 2, y * obstacle.height / 2], radians(obstacle.rotation_deg || 0));
        return [obstacle.center[0] + offset[0], obstacle.center[1] + offset[1]];
    });
}
function polygonContains(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [xi, yi] = vertices[i], [xj, yj] = vertices[j];
        if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)
            inside = !inside;
    }
    return inside;
}
export function sampleTrajectory(trajectory, seconds) {
    if (!trajectory?.length)
        return null;
    if (seconds <= trajectory[0].time)
        return trajectory[0];
    if (seconds >= trajectory.at(-1).time)
        return trajectory.at(-1);
    let lower = 0, upper = trajectory.length - 1;
    while (upper - lower > 1) {
        const middle = (lower + upper) >> 1;
        if (trajectory[middle].time <= seconds)
            lower = middle;
        else
            upper = middle;
    }
    const start = trajectory[lower], end = trajectory[upper];
    const fraction = (seconds - start.time) / Math.max(1e-9, end.time - start.time);
    const headingChange = Math.atan2(Math.sin(end.yaw - start.yaw), Math.cos(end.yaw - start.yaw));
    const arcLength = end.s - start.s;
    const progress = arcLength * fraction;
    const curvature = arcLength > 1e-9 ? headingChange / arcLength : 0;
    const yaw = start.yaw + headingChange * fraction;
    const x = arcLength > 1e-9 ? Math.abs(curvature) < 1e-12
        ? start.x + progress * Math.cos(start.yaw)
        : start.x + (Math.sin(yaw) - Math.sin(start.yaw)) / curvature
        : start.x + (end.x - start.x) * fraction;
    const y = arcLength > 1e-9 ? Math.abs(curvature) < 1e-12
        ? start.y + progress * Math.sin(start.yaw)
        : start.y + (Math.cos(start.yaw) - Math.cos(yaw)) / curvature
        : start.y + (end.y - start.y) * fraction;
    return {
        x, y,
        alt: start.alt + (end.alt - start.alt) * fraction,
        yaw,
        time: seconds,
        s: start.s + (end.s - start.s) * fraction,
        phase: end.phase,
    };
}
export class MapEditor {
    constructor(container, { onChange, onSelect, onStatus, onDraftChange } = {}) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'map-canvas';
        this.canvas.tabIndex = 0;
        this.canvas.setAttribute('aria-label', '二维航迹与障碍物编辑画布，滚轮缩放，空格拖动平移');
        container.append(this.canvas);
        this.context = this.canvas.getContext('2d');
        this.onChange = onChange || (() => {
        });
        this.onSelect = onSelect || (() => {
        });
        this.onStatus = onStatus || (() => {
        });
        this.onDraftChange = onDraftChange || (() => {
        });
        this.camera = { x: 40000, y: 40000, scale: 0.005 };
        this.tool = 'select';
        this.scene = null;
        this.result = null;
        this.options = {};
        this.time = 0;
        this.pointer = null;
        this.draft = null;
        this.drag = null;
        this.spacePressed = false;
        this.frame = 0;
        this.abort = new AbortController();
        const eventOptions = { signal: this.abort.signal };
        this.canvas.addEventListener('pointerdown', event => this.pointerDown(event), eventOptions);
        this.canvas.addEventListener('pointermove', event => this.pointerMove(event), eventOptions);
        this.canvas.addEventListener('pointerup', event => this.pointerUp(event), eventOptions);
        this.canvas.addEventListener('pointercancel', () => this.cancelDrag(), eventOptions);
        this.canvas.addEventListener('dblclick', event => this.doubleClick(event), eventOptions);
        this.canvas.addEventListener('wheel', event => this.wheel(event), { ...eventOptions, passive: false });
        this.canvas.addEventListener('contextmenu', event => event.preventDefault(), eventOptions);
        window.addEventListener('keydown', event => this.keyDown(event), eventOptions);
        window.addEventListener('keyup', event => {
            if (event.code === 'Space') {
                this.spacePressed = false;
                this.setCursor();
            }
        }, eventOptions);
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
        this.resize();
    }
    update(scene, result, options = {}) {
        const firstScene = !this.scene;
        this.scene = scene;
        this.result = result;
        this.options = options;
        if (firstScene)
            this.fit();
        this.drawSoon();
    }
    setTool(tool) {
        this.tool = tool;
        this.draft = null;
        this.cancelDrag();
        this.onDraftChange(false);
        this.setCursor();
        this.drawSoon();
    }
    setTime(seconds) {
        this.time = seconds;
        this.drawSoon();
    }
    resize() {
        const { width, height } = this.container.getBoundingClientRect();
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        this.canvas.width = Math.round(this.width * ratio);
        this.canvas.height = Math.round(this.height * ratio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ratio = ratio;
        this.drawSoon();
    }
    fit() {
        if (!this.scene)
            return;
        const { min, max } = this.scene.world;
        this.camera = { x: (min + max) / 2, y: (min + max) / 2, scale: Math.min((this.width - 100) / (max - min), (this.height - 80) / (max - min)) };
        this.camera.scale = Math.max(0.00005, this.camera.scale);
        this.drawSoon();
    }
    zoom(factor, point = [this.width / 2, this.height / 2]) {
        const before = this.toWorld(point);
        this.camera.scale = clamp(this.camera.scale * factor, 0.00003, 5);
        const after = this.toWorld(point);
        this.camera.x += before[0] - after[0];
        this.camera.y += before[1] - after[1];
        this.drawSoon();
    }
    toScreen([x, y]) {
        return [(x - this.camera.x) * this.camera.scale + this.width / 2, this.height / 2 - (y - this.camera.y) * this.camera.scale];
    }
    toWorld([x, y]) {
        return [(x - this.width / 2) / this.camera.scale + this.camera.x, (this.height / 2 - y) / this.camera.scale + this.camera.y];
    }
    eventPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    }
    setCursor() {
        this.canvas.style.cursor = this.drag?.mode === 'pan' ? 'grabbing' : this.tool === 'pan' || this.spacePressed ? 'grab' : this.tool !== 'select' ? 'crosshair' : 'default';
    }
    selected(scene = this.scene) {
        if (!scene)
            return null;
        if (this.options.selectedId === 'sweep')
            return { kind: 'sweep', item: scene.sweep };
        const aircraft = scene.aircraft.find(item => item.id === this.options.selectedId);
        if (aircraft)
            return { kind: 'aircraft', item: aircraft };
        const obstacle = scene.obstacles.find(item => item.id === this.options.selectedId);
        return obstacle ? { kind: 'obstacle', item: obstacle } : null;
    }
    handles(scene = this.scene) {
        const selected = this.selected(scene);
        if (!selected)
            return [];
        const { kind, item } = selected;
        if (kind === 'aircraft') {
            const angle = radians(item.heading_deg);
            return [{ kind: 'heading', point: [item.x + Math.cos(angle) * 46 / this.camera.scale, item.y + Math.sin(angle) * 46 / this.camera.scale] }];
        }
        if (kind === 'sweep') {
            const [x, y] = item.center, half = item.size / 2;
            return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy]) => ({ kind: 'sweep-size', point: [x + dx * half, y + dy * half] }));
        }
        if (item.type === 'circle')
            return [{ kind: 'radius', point: [item.center[0] + item.radius, item.center[1]] }];
        if (item.type === 'rectangle') {
            const vertices = obstacleVertices(item);
            const offset = rotate([0, item.height / 2 + 28 / this.camera.scale], radians(item.rotation_deg || 0));
            return [...vertices.map((point, index) => ({ kind: 'rectangle-size', index, point })), { kind: 'rotation', point: [item.center[0] + offset[0], item.center[1] + offset[1]] }];
        }
        return item.vertices.map((point, index) => ({ kind: 'vertex', index, point }));
    }
    hitTest(point) {
        if (!this.scene)
            return null;
        for (const handle of this.handles())
            if (distance(this.toScreen(handle.point), this.toScreen(point)) < 11)
                return { id: this.options.selectedId, handle };
        for (const aircraft of [...this.scene.aircraft].reverse())
            if (distance(this.toScreen([aircraft.x, aircraft.y]), this.toScreen(point)) < 18)
                return { id: aircraft.id };
        for (const obstacle of [...this.scene.obstacles].reverse()) {
            if (obstacle.type === 'circle' ? distance(point, obstacle.center) <= obstacle.radius + 5 / this.camera.scale : polygonContains(point, obstacleVertices(obstacle)))
                return { id: obstacle.id };
        }
        const half = this.scene.sweep.size / 2, [x, y] = this.scene.sweep.center;
        if (Math.abs(point[0] - x) <= half && Math.abs(point[1] - y) <= half)
            return { id: 'sweep' };
        return null;
    }
    pointerDown(event) {
        if (!this.scene || this.options.locked)
            return;
        this.canvas.focus({ preventScroll: true });
        const screen = this.eventPoint(event), world = this.toWorld(screen);
        this.pointer = world;
        if (event.button === 1 || event.button === 2 || this.spacePressed || this.tool === 'pan') {
            this.drag = { mode: 'pan', screen, camera: { ...this.camera } };
        }
        else if (this.tool !== 'select') {
            this.drawClick(world, screen, event);
            return;
        }
        else {
            const hit = this.hitTest(world);
            if (!hit) {
                this.onSelect(null);
                this.drag = { mode: 'pan', screen, camera: { ...this.camera } };
            }
            else {
                this.onSelect(hit.id);
                this.options.selectedId = hit.id;
                this.drag = {
                    mode: 'edit', id: hit.id, handle: hit.handle, world, screen, original: copy(this.scene), scene: copy(this.scene), moved: false
                };
            }
        }
        this.canvas.setPointerCapture(event.pointerId);
        this.setCursor();
    }
    pointerMove(event) {
        const screen = this.eventPoint(event), world = this.toWorld(screen);
        this.pointer = world;
        this.onStatus({ x: world[0], y: world[1], scale: this.camera.scale });
        if (this.drag?.mode === 'pan') {
            this.camera.x = this.drag.camera.x - (screen[0] - this.drag.screen[0]) / this.camera.scale;
            this.camera.y = this.drag.camera.y + (screen[1] - this.drag.screen[1]) / this.camera.scale;
        }
        else if (this.drag?.mode === 'edit') {
            if (distance(screen, this.drag.screen) > 3)
                this.drag.moved = true;
            if (this.drag.moved)
                this.editDrag(world, event.shiftKey);
        }
        if (this.draft)
            this.draft.pointer = world;
        this.drawSoon();
    }
    editDrag(world, snap) {
        const drag = this.drag, scene = copy(drag.original);
        const selected = this.selected(scene);
        if (!selected)
            return;
        const { kind, item } = selected;
        const delta = [world[0] - drag.world[0], world[1] - drag.world[1]];
        const grid = snap ? 500 : 1;
        const quantize = value => Math.round(value / grid) * grid;
        const handle = drag.handle?.kind;
        if (kind === 'aircraft') {
            if (handle === 'heading') {
                let heading = Math.atan2(world[1] - item.y, world[0] - item.x) * 180 / Math.PI;
                item.heading_deg = Math.round(heading / (snap ? 15 : 1)) * (snap ? 15 : 1);
            }
            else {
                item.x = quantize(item.x + delta[0]);
                item.y = quantize(item.y + delta[1]);
            }
        }
        else if (kind === 'sweep') {
            if (handle === 'sweep-size')
                item.size = Math.max(100, quantize(2 * Math.max(Math.abs(world[0] - item.center[0]), Math.abs(world[1] - item.center[1]))));
            else
                item.center = item.center.map((value, index) => quantize(value + delta[index]));
        }
        else if (item.type === 'circle' && handle === 'radius')
            item.radius = Math.max(50, quantize(distance(world, item.center)));
        else if (item.type === 'rectangle' && handle === 'rotation') {
            const angle = Math.atan2(world[1] - item.center[1], world[0] - item.center[0]) * 180 / Math.PI - 90;
            item.rotation_deg = Math.round(angle / (snap ? 15 : 1)) * (snap ? 15 : 1);
        }
        else if (item.type === 'rectangle' && handle === 'rectangle-size') {
            const local = rotate([world[0] - item.center[0], world[1] - item.center[1]], -radians(item.rotation_deg || 0));
            item.width = Math.max(100, quantize(Math.abs(local[0]) * 2));
            item.height = Math.max(100, quantize(Math.abs(local[1]) * 2));
        }
        else if (item.type === 'polygon' && handle === 'vertex')
            item.vertices[drag.handle.index] = world.map(quantize);
        else if (item.type === 'polygon')
            item.vertices = item.vertices.map(vertex => vertex.map((value, index) => quantize(value + delta[index])));
        else
            item.center = item.center.map((value, index) => quantize(value + delta[index]));
        drag.scene = scene;
        this.onDraftChange(true);
    }
    pointerUp(event) {
        if (this.drag?.mode === 'edit' && this.drag.moved)
            this.onChange(this.drag.scene, '调整对象几何');
        this.drag = null;
        this.onDraftChange(false);
        if (this.canvas.hasPointerCapture(event.pointerId))
            this.canvas.releasePointerCapture(event.pointerId);
        this.setCursor();
        this.drawSoon();
    }
    cancelDrag() {
        this.drag = null;
        this.onDraftChange(false);
        this.drawSoon();
    }
    drawClick(world, screen, event) {
        const point = world.map(value => Math.round(value));
        if (this.tool === 'circle') {
            if (!this.draft)
                this.draft = { type: 'circle', center: point, pointer: point };
            else if (distance(this.draft.center, point) > 50)
                this.commitObstacle({ type: 'circle', center: this.draft.center, radius: Math.round(distance(this.draft.center, point)) });
        }
        else if (this.tool === 'rectangle') {
            if (!this.draft)
                this.draft = { type: 'rectangle', first: point, pointer: point, phase: 'size' };
            else if (this.draft.phase === 'size') {
                const first = this.draft.first;
                if (Math.abs(first[0] - point[0]) < 100 || Math.abs(first[1] - point[1]) < 100)
                    return;
                this.draft = {
                    type: 'rectangle', center: [(first[0] + point[0]) / 2, (first[1] + point[1]) / 2], width: Math.abs(first[0] - point[0]), height: Math.abs(first[1] - point[1]), phase: 'rotation', initialAngle: Math.atan2(point[1] - first[1], point[0] - first[0]), pointer: point
                };
            }
            else
                this.commitObstacle(this.draftRectangle(event.shiftKey));
        }
        else if (this.tool === 'polygon') {
            if (!this.draft)
                this.draft = { type: 'polygon', vertices: [point], pointer: point };
            else if (this.draft.vertices.length >= 3 && distance(screen, this.toScreen(this.draft.vertices[0])) < 13)
                this.finishPolygon();
            else if (event.detail < 2 && this.draft.vertices.length < 100 && distance(point, this.draft.vertices.at(-1)) * this.camera.scale > 3)
                this.draft.vertices.push(point);
        }
        this.onDraftChange(Boolean(this.draft));
        this.drawSoon();
    }
    draftRectangle(snap = false) {
        const draft = this.draft;
        const angle = Math.atan2(draft.pointer[1] - draft.center[1], draft.pointer[0] - draft.center[0]) - draft.initialAngle;
        const degrees = angle * 180 / Math.PI;
        return {
            type: 'rectangle', center: draft.center, width: draft.width, height: draft.height, rotation_deg: Math.round(degrees / (snap ? 15 : 1)) * (snap ? 15 : 1)
        };
    }
    finishPolygon() {
        if (this.draft?.type !== 'polygon' || this.draft.vertices.length < 3)
            return;
        this.commitObstacle({ type: 'polygon', vertices: this.draft.vertices });
    }
    commitObstacle(obstacle) {
        if (this.scene.obstacles.length >= 100) {
            this.onStatus({ message: '最多配置100个障碍物。' });
            return;
        }
        const scene = copy(this.scene);
        obstacle.id = `obstacle_${crypto.randomUUID().slice(0, 8)}`;
        scene.obstacles.push(obstacle);
        this.draft = null;
        this.onDraftChange(false);
        this.onChange(scene, '绘制障碍物');
        this.onSelect(obstacle.id);
        this.tool = 'select';
        this.container.dispatchEvent(new CustomEvent('toolchange', { detail: 'select' }));
        this.setCursor();
    }
    doubleClick(event) {
        if (this.tool === 'polygon') {
            event.preventDefault();
            this.finishPolygon();
        }
    }
    keyDown(event) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable)
            return;
        if (event.code === 'Space') {
            this.spacePressed = true;
            this.setCursor();
            event.preventDefault();
        }
        if (event.key === 'Escape') {
            this.draft = null;
            this.cancelDrag();
            this.onDraftChange(false);
            this.drawSoon();
        }
        if (event.key === 'Enter')
            this.finishPolygon();
    }
    wheel(event) {
        event.preventDefault();
        this.zoom(Math.exp(-event.deltaY * 0.0012), this.eventPoint(event));
    }
    capture() {
        this.draw();
        return this.canvas.toDataURL('image/png');
    }
    dispose() {
        this.abort.abort();
        this.resizeObserver.disconnect();
        cancelAnimationFrame(this.frame);
        this.canvas.remove();
    }
    drawSoon() {
        if (!this.frame)
            this.frame = requestAnimationFrame(() => {
                this.frame = 0;
                this.draw();
            });
    }
    trace(points, close = false) {
        const context = this.context;
        context.beginPath();
        points.forEach((point, index) => {
            const [x, y] = this.toScreen(point);
            if (!index)
                context.moveTo(x, y);
            else
                context.lineTo(x, y);
        });
        if (close)
            context.closePath();
    }
    draw() {
        const context = this.context;
        if (!context || !this.width)
            return;
        context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        context.clearRect(0, 0, this.width, this.height);
        context.fillStyle = '#f5f8f5';
        context.fillRect(0, 0, this.width, this.height);
        if (!this.scene)
            return;
        this.drawGrid();
        const scene = this.drag?.scene || this.scene;
        this.drawWorld(scene);
        this.drawSweep(scene);
        this.drawObstacles(scene);
        this.drawRoutes();
        this.drawAircraft(scene);
        this.drawHandles(scene);
        this.drawDraft();
        this.drawScale();
    }
    drawGrid() {
        const context = this.context;
        const target = 90 / this.camera.scale;
        const magnitude = 10 ** Math.floor(Math.log10(target));
        const spacing = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= target);
        this.gridSpacing = spacing;
        const [left, top] = this.toWorld([0, 0]), [right, bottom] = this.toWorld([this.width, this.height]);
        context.font = '13px "Segoe UI", sans-serif';
        context.textAlign = 'left';
        for (let x = Math.floor(left / spacing) * spacing; x <= right; x += spacing / 5) {
            const [screenX] = this.toScreen([x, 0]);
            const major = Math.abs(x / spacing - Math.round(x / spacing)) < 1e-5;
            context.strokeStyle = major ? '#dfe7df' : '#edf1eb';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(screenX, 0);
            context.lineTo(screenX, this.height);
            context.stroke();
            if (major) {
                context.fillStyle = '#93a397';
                context.fillText(`${+(x / 1000).toFixed(1)}`, screenX + 5, this.height - 10);
            }
        }
        for (let y = Math.floor(bottom / spacing) * spacing; y <= top; y += spacing / 5) {
            const [, screenY] = this.toScreen([0, y]);
            const major = Math.abs(y / spacing - Math.round(y / spacing)) < 1e-5;
            context.strokeStyle = major ? '#dfe7df' : '#edf1eb';
            context.beginPath();
            context.moveTo(0, screenY);
            context.lineTo(this.width, screenY);
            context.stroke();
            if (major) {
                context.fillStyle = '#93a397';
                context.fillText(`${+(y / 1000).toFixed(1)}`, 7, screenY - 6);
            }
        }
    }
    drawWorld(scene) {
        const { min, max } = scene.world;
        this.trace([[min, min], [max, min], [max, max], [min, max]], true);
        this.context.strokeStyle = '#b8c8bc';
        this.context.lineWidth = 1;
        this.context.setLineDash([5, 5]);
        this.context.stroke();
        this.context.setLineDash([]);
    }
    drawSweep(scene) {
        const context = this.context, sweep = scene.sweep;
        const [x, y] = sweep.center, half = sweep.size / 2;
        this.trace([[x - half, y - half], [x + half, y - half], [x + half, y + half], [x - half, y + half]], true);
        context.fillStyle = '#20a3890d';
        context.fill();
        context.strokeStyle = this.options.selectedId === 'sweep' ? '#098a74' : '#59a58f';
        context.lineWidth = this.options.selectedId === 'sweep' ? 2 : 1.2;
        context.stroke();
        if (this.options.showSweep !== false) {
            const count = Math.min(200, Math.max(1, Math.ceil(sweep.size / sweep.spacing)));
            for (let index = 0; index < count; index++) {
                const offset = -half + sweep.size * (index + 0.5) / count;
                const horizontal = sweep.orientation === 'horizontal';
                this.trace(horizontal ? [[x - half, y + offset], [x + half, y + offset]] : [[x + offset, y - half], [x + offset, y + half]]);
                context.strokeStyle = '#8bbba75c';
                context.setLineDash([3, 5]);
                context.lineWidth = 1;
                context.stroke();
                context.setLineDash([]);
            }
        }
        const [labelX, labelY] = this.toScreen([x - half, y + half]);
        context.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
        context.fillStyle = '#458775';
        context.fillText(`扫掠区  ${(sweep.size / 1000).toFixed(0)} × ${(sweep.size / 1000).toFixed(0)} km`, labelX + 5, labelY - 9);
    }
    drawObstacles(scene) {
        const context = this.context;
        for (const obstacle of scene.obstacles) {
            const selected = this.options.selectedId === obstacle.id;
            const trace = margin => {
                if (obstacle.type === 'circle') {
                    const [x, y] = this.toScreen(obstacle.center);
                    context.beginPath();
                    context.arc(x, y, Math.max(1, (obstacle.radius + margin) * this.camera.scale), 0, TAU);
                }
                else
                    this.trace(obstacleVertices(obstacle), true);
            };
            if (this.options.showClearance) {
                const selectedAircraft = scene.aircraft.find(aircraft => aircraft.id === this.options.selectedId);
                const margin = selectedAircraft?.overrides?.obstacle_margin ?? scene.defaults.obstacle_margin;
                trace(obstacle.type === 'circle' ? margin : 0);
                context.strokeStyle = '#d9995b80';
                context.lineWidth = obstacle.type === 'circle' ? 1 : margin * this.camera.scale * 2;
                context.lineJoin = 'round';
                context.setLineDash(obstacle.type === 'circle' ? [4, 4] : []);
                context.stroke();
                context.setLineDash([]);
            }
            trace(0);
            context.fillStyle = selected ? '#e4a17c99' : '#ddae9063';
            context.fill();
            context.strokeStyle = selected ? '#b76b3f' : '#bf9172';
            context.lineWidth = selected ? 2 : 1.1;
            context.stroke();
            if (obstacle.type === 'circle' && obstacle.radius * this.camera.scale > 15) {
                const [x, y] = this.toScreen(obstacle.center);
                context.strokeStyle = '#ba8e7480';
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(x - 3, y);
                context.lineTo(x + 3, y);
                context.moveTo(x, y - 3);
                context.lineTo(x, y + 3);
                context.stroke();
            }
        }
    }
    drawRoutes() {
        if (!this.result)
            return;
        const context = this.context;
        this.result.aircraft.forEach((aircraft, index) => {
            if (aircraft.status !== 'success' || !aircraft.path?.length || this.options.hiddenAircraftIds?.has(aircraft.id))
                return;
            const color = COLORS[index % COLORS.length], selected = this.options.selectedId === aircraft.id;
            const trajectory = aircraft.trajectory?.length ? aircraft.trajectory : aircraft.path.map(([x, y, yaw]) => ({ x, y, yaw, phase: 'sweep' }));
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.globalAlpha = this.options.resultStale ? 0.47 : this.options.selectedId && !selected ? 0.48 : 0.9;
            for (let point = 1; point < trajectory.length; point++) {
                const phase = trajectory[point].phase;
                if ((phase === 'approach_layer' && this.options.showApproach === false) || (phase === 'sweep' && this.options.showSweep === false) || (['turn_layer', 'entry_transition', 'exit_transition'].includes(phase) && this.options.showTurns === false))
                    continue;
                this.trace([[trajectory[point - 1].x, trajectory[point - 1].y], [trajectory[point].x, trajectory[point].y]]);
                context.strokeStyle = color;
                context.lineWidth = selected ? 2.8 : 1.7;
                context.stroke();
            }
            if (this.options.showPoints) {
                context.fillStyle = '#fff';
                context.strokeStyle = color;
                context.lineWidth = 1.5;
                for (const [x, y] of aircraft.path) {
                    const point = this.toScreen([x, y]);
                    context.beginPath();
                    context.arc(...point, 4, 0, TAU);
                    context.fill();
                    context.stroke();
                }
            }
            const moving = sampleTrajectory(aircraft.trajectory, this.time);
            if (moving)
                this.plane(moving.x, moving.y, moving.yaw, color, 9, true);
            context.globalAlpha = 1;
        });
    }
    plane(x, y, yaw, color, size = 10, filled = true) {
        const context = this.context, point = this.toScreen([x, y]);
        context.save();
        context.translate(...point);
        context.rotate(-yaw);
        context.beginPath();
        context.moveTo(size, 0);
        context.lineTo(-size * 0.75, -size * 0.62);
        context.lineTo(-size * 0.35, 0);
        context.lineTo(-size * 0.75, size * 0.62);
        context.closePath();
        context.fillStyle = filled ? color : '#fff';
        context.strokeStyle = color;
        context.lineWidth = 1.7;
        context.fill();
        context.stroke();
        context.restore();
    }
    drawAircraft(scene) {
        const context = this.context;
        scene.aircraft.forEach((aircraft, index) => {
            const selected = this.options.selectedId === aircraft.id;
            const color = aircraft.enabled ? COLORS[index % COLORS.length] : '#a4afa6';
            const [x, y] = this.toScreen([aircraft.x, aircraft.y]);
            if (selected) {
                context.beginPath();
                context.arc(x, y, 20, 0, TAU);
                context.fillStyle = '#fff9';
                context.fill();
                context.strokeStyle = color;
                context.setLineDash([3, 3]);
                context.stroke();
                context.setLineDash([]);
            }
            this.plane(aircraft.x, aircraft.y, radians(aircraft.heading_deg), color, 10, false);
            if (selected || this.camera.scale > 0.005) {
                context.fillStyle = '#fffE';
                const label = aircraft.name || aircraft.id;
                context.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
                const width = context.measureText(label).width + 10;
                context.fillRect(x + 12, y - 17, width, 17);
                context.fillStyle = '#4a6156';
                context.fillText(label, x + 17, y - 5);
            }
        });
    }
    drawHandles(scene) {
        const context = this.context;
        for (const handle of this.handles(scene)) {
            const [x, y] = this.toScreen(handle.point);
            context.fillStyle = '#fff';
            context.strokeStyle = '#168b78';
            context.lineWidth = 1.7;
            context.beginPath();
            if (handle.kind === 'rotation' || handle.kind === 'heading')
                context.arc(x, y, 5, 0, TAU);
            else
                context.rect(x - 4, y - 4, 8, 8);
            context.fill();
            context.stroke();
        }
    }
    drawDraft() {
        const draft = this.draft, context = this.context;
        if (!draft)
            return;
        context.strokeStyle = '#ba7449';
        context.fillStyle = '#dca67830';
        context.lineWidth = 1.5;
        context.setLineDash([5, 4]);
        if (draft.type === 'circle') {
            const [x, y] = this.toScreen(draft.center);
            context.beginPath();
            context.arc(x, y, Math.max(1, distance(draft.center, draft.pointer) * this.camera.scale), 0, TAU);
        }
        else if (draft.type === 'rectangle') {
            const obstacle = draft.phase === 'rotation' ? this.draftRectangle() : { type: 'polygon', vertices: [draft.first, [draft.pointer[0], draft.first[1]], draft.pointer, [draft.first[0], draft.pointer[1]]] };
            this.trace(obstacleVertices(obstacle), true);
        }
        else
            this.trace([...draft.vertices, draft.pointer], true);
        context.fill();
        context.stroke();
        context.setLineDash([]);
        if (draft.type === 'polygon')
            for (const point of draft.vertices) {
                const [x, y] = this.toScreen(point);
                context.beginPath();
                context.arc(x, y, 3.5, 0, TAU);
                context.fillStyle = '#ba7449';
                context.fill();
            }
    }
    drawScale() {
        const context = this.context, metres = this.gridSpacing || 10000, pixels = metres * this.camera.scale;
        const x = this.width - pixels - 25, y = this.height - 32;
        context.fillStyle = '#f5f8f5e8';
        context.fillRect(x - 10, y - 20, pixels + 20, 35);
        context.strokeStyle = '#6e8577';
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(x, y - 4);
        context.lineTo(x, y);
        context.lineTo(x + pixels, y);
        context.lineTo(x + pixels, y - 4);
        context.stroke();
        context.fillStyle = '#6e8577';
        context.font = '13px "Segoe UI", sans-serif';
        context.textAlign = 'center';
        context.fillText(`${metres >= 1000 ? `${metres / 1000} km` : `${metres} m`}`, x + pixels / 2, y - 7);
        context.textAlign = 'left';
    }
}
