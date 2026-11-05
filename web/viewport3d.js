import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = ['#168b78', '#4676b7', '#b17c36', '#8e68ad', '#be6578', '#6c8f42', '#398eac', '#a17358'];
const TAU = Math.PI * 2;
export const OBSTACLE_HEIGHT = 2000;
const angleDelta = (a, b) => ((a - b + Math.PI) % TAU + TAU) % TAU - Math.PI;

function integrate(motion, distance) {
  const yaw = motion.yaw + motion.curvature * distance;
  if (Math.abs(motion.curvature) < 1e-12) {
    return [motion.x + distance * Math.cos(motion.yaw), motion.y + distance * Math.sin(motion.yaw), yaw];
  }
  return [motion.x + (Math.sin(yaw) - Math.sin(motion.yaw)) / motion.curvature,
    motion.y + (Math.cos(motion.yaw) - Math.cos(yaw)) / motion.curvature, yaw];
}

function profileAt(rows, distance) {
  if (!rows?.length) return { alt: 0, phase: 'approach_layer' };
  if (distance <= rows[0].s) return rows[0];
  if (distance >= rows.at(-1).s) return rows.at(-1);
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].s <= distance) lo = mid; else hi = mid;
  }
  const a = rows[lo], b = rows[hi];
  const fraction = (distance - a.s) / (b.s - a.s);
  return { alt: a.alt + (b.alt - a.alt) * fraction, phase: fraction < 0.5 ? a.phase : b.phase };
}

function routeMotions(aircraft) {
  if (aircraft.motions?.length) return aircraft.motions;
  let s = 0;
  return (aircraft.path || []).slice(1).map((end, index) => {
    const start = aircraft.path[index], turn = angleDelta(end[2], start[2]);
    const chord = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const curvature = chord > 1e-9 ? 2 * Math.sin(turn / 2) / chord : 0;
    const length = Math.abs(turn) < 1e-10 ? chord : turn / curvature;
    const motion = { x: start[0], y: start[1], yaw: start[2], length, curvature, s_start: s };
    s += length;
    return motion;
  });
}

// Keep output waypoints distinct from the denser height/display samples.
export function outputWaypointSamples(aircraft) {
  const path = aircraft.path || [];
  const motions = routeMotions({ path });
  let distance = 0;
  return path.map(([x, y, yaw], index) => {
    if (index) distance += motions[index - 1].length;
    const profile = profileAt(aircraft.trajectory, distance);
    return { x, y, yaw, s: distance, z: profile.alt, phase: profile.phase };
  });
}

export function motionDisplaySamples(motion, trajectory) {
  const count = Math.max(1, Math.ceil(Math.abs(motion.curvature * motion.length) / 0.025));
  const cuts = new Set(Array.from({ length: count + 1 }, (_, index) => motion.length * index / count));
  for (const row of trajectory || []) {
    const distance = row.s - motion.s_start;
    if (distance > 1e-7 && distance < motion.length - 1e-7) cuts.add(distance);
  }
  return [...cuts].sort((a, b) => a - b).map(distance => {
    const [x, y] = integrate(motion, distance);
    const profile = profileAt(trajectory, motion.s_start + distance);
    return { x, y, z: profile.alt, phase: profile.phase };
  });
}

export function aircraftAtTime(aircraft, seconds) {
  if (!aircraft.trajectory?.length) return null;
  const rows = aircraft.trajectory;
  const duration = rows.at(-1).time;
  if (seconds >= duration) {
    const last = rows.at(-1);
    return { x: last.x, y: last.y, z: last.alt, yaw: last.yaw, finished: true };
  }
  const speed = duration > 0 ? rows.at(-1).s / duration : 0;
  const distance = Math.max(0, seconds * speed);
  const motions = routeMotions(aircraft);
  let lo = 0, hi = motions.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (motions[mid].s_start + motions[mid].length < distance) lo = mid + 1; else hi = mid;
  }
  const motion = motions[Math.min(lo, motions.length - 1)];
  if (!motion) return { x: rows[0].x, y: rows[0].y, z: rows[0].alt, yaw: rows[0].yaw, finished: true };
  const [x, y, yaw] = integrate(motion, Math.min(motion.length, Math.max(0, distance - motion.s_start)));
  return { x, y, z: profileAt(rows, distance).alt, yaw, finished: false };
}

function verticesFor(obstacle) {
  if (obstacle.type === 'polygon') return obstacle.vertices;
  if (obstacle.type === 'circle') {
    return Array.from({ length: 80 }, (_, i) => [obstacle.center[0] + obstacle.radius * Math.cos(TAU * i / 80),
      obstacle.center[1] + obstacle.radius * Math.sin(TAU * i / 80)]);
  }
  const angle = (obstacle.rotation_deg || 0) * Math.PI / 180;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => {
    const dx = x * obstacle.width / 2, dy = y * obstacle.height / 2;
    return [obstacle.center[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
      obstacle.center[1] + dx * Math.sin(angle) + dy * Math.cos(angle)];
  });
}

function niceStep(value) {
  const scale = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  const ratio = value / scale;
  return (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * scale;
}

export class Viewport3D {
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.offset = [0, 0];
    this.markers = [];
    this.labels = [];
    this.time = 0;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f6f8f7');
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2e7);
    this.camera.up.set(0, 0, 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.dataset.spatialScale = '1,1,1';
    this.renderer.domElement.dataset.verticalExaggeration = '1';
    this.renderer.domElement.setAttribute('aria-label', '真实等比例三维航迹，XYZ空间尺度一比一比一');
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;outline:none';
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 1;
    this.controls.addEventListener('change', () => this.resizeLabels());
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.raycaster = new THREE.Raycaster();
    this.pointerStart = null;
    this.renderer.domElement.addEventListener('pointerdown', event => { this.pointerStart = [event.clientX, event.clientY]; });
    this.renderer.domElement.addEventListener('pointerup', event => {
      if (!this.pointerStart || Math.hypot(event.clientX - this.pointerStart[0], event.clientY - this.pointerStart[1]) > 5) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1), this.camera);
      const picked = this.raycaster.intersectObjects(this.group.children, true).find(hit => hit.object.userData.id);
      if (picked) this.onSelect?.(picked.object.userData.id);
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.animate = () => {
      this.frame = requestAnimationFrame(this.animate);
      if (container.clientWidth && container.clientHeight) {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      }
    };
    this.animate();
  }

  vector(x, y, z = 0) {
    return new THREE.Vector3(x - this.offset[0], y - this.offset[1], z);
  }

  line(points, color, opacity = 1, dashed = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = dashed ? new THREE.LineDashedMaterial({ color, transparent: true, opacity,
      dashSize: this.gridStep / 12, gapSize: this.gridStep / 20 })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(geometry, material);
    if (dashed) line.computeLineDistances();
    this.group.add(line);
    return line;
  }

  label(text, position, color = '#75847f', size = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.font = '500 39px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(text, 256, 48);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.position.copy(position);
    sprite.userData.labelFontSize = Math.max(12, 14 * size);
    this.labels.push(sprite);
    this.group.add(sprite);
  }

  resizeLabels() {
    const height = this.container.clientHeight;
    if (!height) return;
    const unitsPerPixel = (this.camera.top - this.camera.bottom) / this.camera.zoom / height;
    for (const sprite of this.labels) {
      const labelHeight = sprite.userData.labelFontSize * 96 / 39 * unitsPerPixel;
      sprite.scale.set(labelHeight * 512 / 96, labelHeight, 1);
    }
  }

  footprint(vertices, color = '#d36d68', opacity = 0.13, id) {
    if (!vertices?.length) return;
    const shape = new THREE.Shape(vertices.map(([x, y]) => new THREE.Vector2(x - this.offset[0], y - this.offset[1])));
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    mesh.position.z = this.span * 0.00003;
    if (id) mesh.userData.id = id;
    this.group.add(mesh);
    return mesh;
  }

  obstacleVolume(vertices, id, selected = false) {
    if (!vertices?.length) return;
    const shape = new THREE.Shape(vertices.map(([x, y]) => new THREE.Vector2(x - this.offset[0], y - this.offset[1])));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: OBSTACLE_HEIGHT, bevelEnabled: false, steps: 1 });
    const material = opacity => new THREE.MeshBasicMaterial({ color: '#c67b67', transparent: true, opacity,
      side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, [material(selected ? 0.46 : 0.28), material(selected ? 0.32 : 0.18)]);
    mesh.userData = { id, obstacleHeightMeters: OBSTACLE_HEIGHT };
    this.group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30),
      new THREE.LineBasicMaterial({ color: selected ? '#a75d45' : '#bc826d', transparent: true, opacity: 0.8 }));
    edges.userData.id = id;
    this.group.add(edges);
    return mesh;
  }

  drawGrid(scene, highestAltitude) {
    const { min, max } = scene.world;
    const step = this.gridStep;
    const top = Math.max(step, Math.ceil(highestAltitude / step) * step);
    this.renderer.domElement.dataset.gridStepMeters = String(step);
    const points = [];
    for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
      points.push(this.vector(value, min), this.vector(value, max), this.vector(min, value), this.vector(max, value));
      this.label(`${value / 1000}`, this.vector(value, min - step * 0.23), '#81908a', 0.78);
      this.label(`${value / 1000}`, this.vector(min - step * 0.23, value), '#81908a', 0.78);
    }
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: '#dce4df', transparent: true, opacity: 0.8 }));
    this.group.add(grid);
    this.line([this.vector(min, min), this.vector(max, min)], '#9caaa2');
    this.line([this.vector(min, min), this.vector(min, max)], '#9caaa2');
    this.line([this.vector(min, min), this.vector(min, min, top)], '#9caaa2');
    for (let height = step; height <= top; height += step) {
      this.line([this.vector(min, min, height), this.vector(min + step * 0.07, min, height)], '#9caaa2');
      this.label(`${height / 1000}`, this.vector(min - step * 0.25, min, height), '#81908a', 0.78);
    }
    this.label('X / km', this.vector(max + step * 0.28, min));
    this.label('Y / km', this.vector(min, max + step * 0.28));
    this.label('Z / km', this.vector(min, min, top + step * 0.2));
  }

  update(scene, result, options = {}) {
    if (!scene) return;
    this.currentScene = scene;
    this.currentResult = result;
    this.options = options;
    this.clear();
    const { min, max } = scene.world;
    this.span = Math.max(max - min, 1);
    this.offset = [(min + max) / 2, (min + max) / 2];
    this.gridStep = niceStep(this.span / 7);
    const highest = Math.max(scene.sweep.altitude, ...scene.aircraft.map(aircraft => aircraft.altitude), OBSTACLE_HEIGHT);
    this.renderer.domElement.dataset.obstacleHeightMeters = String(OBSTACLE_HEIGHT);
    this.drawGrid(scene, highest);
    const [cx, cy] = scene.sweep.center, half = scene.sweep.size / 2;
    const square = [[cx - half, cy - half], [cx + half, cy - half], [cx + half, cy + half], [cx - half, cy + half]];
    this.footprint(square, '#138c7c', 0.08);
    this.line([...square, square[0]].map(([x, y]) => this.vector(x, y)), '#208c7e', 0.6, true);
    this.line([...square, square[0]].map(([x, y]) => this.vector(x, y, scene.sweep.altitude)), '#208c7e', 0.65, true);
    for (const obstacle of scene.obstacles) {
      const vertices = verticesFor(obstacle);
      this.obstacleVolume(vertices, obstacle.id, options.selectedId === obstacle.id);
      if (options.showClearance) {
        const selectedAircraft = scene.aircraft.find(aircraft => aircraft.id === options.selectedId);
        const margin = selectedAircraft?.overrides?.obstacle_margin ?? scene.defaults.obstacle_margin;
        if (obstacle.type === 'circle') {
          const expanded = Array.from({ length: 81 }, (_, i) => this.vector(obstacle.center[0] + (obstacle.radius + margin) * Math.cos(TAU * i / 80),
            obstacle.center[1] + (obstacle.radius + margin) * Math.sin(TAU * i / 80), 2));
          this.line(expanded, '#cf9c86', 0.55, true);
        } else {
          for (let i = 0; i < vertices.length; i++) {
            const a = vertices[i], b = vertices[(i + 1) % vertices.length];
            const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (!length) continue;
            const nx = -(b[1] - a[1]) / length * margin, ny = (b[0] - a[0]) / length * margin;
            this.footprint([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
              [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], '#d9aa93', 0.025);
            this.footprint(Array.from({ length: 40 }, (_, j) => [a[0] + margin * Math.cos(TAU * j / 40),
              a[1] + margin * Math.sin(TAU * j / 40)]), '#d9aa93', 0.025);
          }
        }
      }
    }
    const resultById = new Map((result?.aircraft || []).map(aircraft => [aircraft.id, aircraft]));
    scene.aircraft.forEach((aircraft, index) => {
      if (!aircraft.enabled) return;
      const route = resultById.get(aircraft.id), color = COLORS[index % COLORS.length];
      const selected = !options.selectedId || options.selectedId === aircraft.id;
      const opacity = selected ? 1 : 0.27;
      const pathVisible = !options.hiddenAircraftIds?.has(aircraft.id);
      const motions = pathVisible && route?.status === 'success' ? routeMotions(route) : [];
      for (const motion of motions) {
        const points = motionDisplaySamples(motion, route.trajectory).map(sample => ({
          position: this.vector(sample.x, sample.y, sample.z), phase: sample.phase,
        }));
        for (let i = 1; i < points.length; i++) {
          const phase = points[i - 1].phase;
          if (options.showApproach === false && phase === 'approach_layer') continue;
          if (options.showSweep === false && phase === 'sweep') continue;
          if (options.showTurns === false && ['turn_layer', 'entry_transition', 'exit_transition'].includes(phase)) continue;
          this.line([points[i - 1].position, points[i].position], color, opacity);
        }
      }
      if (pathVisible && options.showPoints && route?.status === 'success' && route.path?.length) {
        const geometry = new THREE.BufferGeometry().setFromPoints(outputWaypointSamples(route).map(row => this.vector(row.x, row.y, row.z)));
        const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: selected ? 9 : 8,
          sizeAttenuation: false, transparent: true, opacity: Math.max(opacity, 0.7), depthTest: false, depthWrite: false }));
        points.userData = { id: aircraft.id, outputWaypoints: true };
        this.group.add(points);
      }
      const marker = new THREE.Group();
      const size = this.span * (options.selectedId === aircraft.id ? 0.006 : 0.0045);
      const shape = new THREE.Shape([new THREE.Vector2(size * 1.5, 0), new THREE.Vector2(-size, size * 0.72),
        new THREE.Vector2(-size * 0.65, 0), new THREE.Vector2(-size, -size * 0.72)]);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide,
        transparent: true, opacity: selected ? 1 : 0.45, depthTest: false }));
      mesh.userData.id = aircraft.id;
      marker.add(mesh);
      marker.userData = { aircraft, route: pathVisible ? route : null, id: aircraft.id };
      this.group.add(marker);
      this.markers.push(marker);
    });
    this.setTime(this.time);
    if (!this.hasFit) { this.fit(); this.hasFit = true; }
    this.resize();
  }

  setTime(seconds) {
    this.time = seconds;
    for (const marker of this.markers) {
      const { aircraft, route } = marker.userData;
      const pose = route?.status === 'success' ? aircraftAtTime(route, seconds) : null;
      marker.position.copy(this.vector(pose?.x ?? aircraft.x, pose?.y ?? aircraft.y, pose?.z ?? aircraft.altitude));
      marker.rotation.z = pose?.yaw ?? aircraft.heading_deg * Math.PI / 180;
    }
  }

  fit() {
    if (!this.currentScene) return;
    const span = this.span;
    this.viewHeight = span * 1.15;
    const target = new THREE.Vector3(0, 0, this.currentScene.sweep.altitude / 2);
    this.controls.target.copy(target);
    this.camera.position.copy(target.clone().add(new THREE.Vector3(span * 0.9, -span * 1.05, span * 0.8)));
    this.camera.zoom = 1;
    this.camera.lookAt(target);
    this.controls.update();
    this.resize();
  }

  zoom(factor) {
    this.camera.zoom = Math.max(0.02, Math.min(100, this.camera.zoom * factor));
    this.camera.updateProjectionMatrix();
    this.resizeLabels();
  }

  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    if (!width || !height) return;
    const half = (this.viewHeight || 100000) / 2, aspect = width / height;
    this.camera.left = -half * aspect; this.camera.right = half * aspect;
    this.camera.top = half; this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.resizeLabels();
  }

  capture() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  clear() {
    this.markers = [];
    this.labels = [];
    for (const child of [...this.group.children]) {
      child.traverse(object => {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        for (const material of materials) { material.map?.dispose(); material.dispose(); }
      });
      this.group.remove(child);
    }
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.controls.dispose();
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
