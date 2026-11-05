import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { aircraftAtTime, motionDisplaySamples, outputWaypointSamples, OBSTACLE_HEIGHT, Viewport3D } from './viewport3d.js';
import { MapEditor, sampleTrajectory } from './map-editor.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8,
  `${actual} != ${expected}`);

test('二维与三维回放沿真实圆弧前进', () => {
  const trajectory = [
    { x: 0, y: 0, alt: 100, yaw: 0, s: 0, time: 0, phase: 'turn_layer' },
    { x: 10, y: 10, alt: 100, yaw: Math.PI / 2, s: 5 * Math.PI, time: Math.PI, phase: 'turn_layer' },
  ];
  const aircraft = { trajectory, motions: [{ x: 0, y: 0, yaw: 0, curvature: 0.1,
    length: 5 * Math.PI, s_start: 0 }] };
  const spatial = aircraftAtTime(aircraft, Math.PI / 2);
  const planar = sampleTrajectory(trajectory, Math.PI / 2);
  for (const pose of [spatial, planar]) {
    close(pose.x, Math.sqrt(50));
    close(pose.y, 10 - Math.sqrt(50));
    close(pose.yaw, Math.PI / 4);
  }
  close(spatial.z, 100);
  close(planar.alt, 100);
});

test('按任务时间插值高度，已完成飞机停在终点', () => {
  const trajectory = [
    { x: 0, y: 0, alt: 100, yaw: 0, s: 0, time: 0, phase: 'entry_transition' },
    { x: 100, y: 0, alt: 200, yaw: 0, s: 100, time: 5, phase: 'sweep' },
  ];
  const aircraft = { trajectory, motions: [{ x: 0, y: 0, yaw: 0, curvature: 0,
    length: 100, s_start: 0 }] };
  const spatial = aircraftAtTime(aircraft, 2.5);
  const planar = sampleTrajectory(trajectory, 2.5);
  close(spatial.x, 50);
  close(planar.x, 50);
  close(spatial.z, 150);
  close(planar.alt, 150);
  close(aircraftAtTime(aircraft, 100).x, 100);
  close(sampleTrajectory(trajectory, 100).x, 100);
});

test('三维直线显示保留高度变化断点', () => {
  const motion = { x: 0, y: 0, yaw: 0, length: 100, curvature: 0, s_start: 0 };
  const samples = motionDisplaySamples(motion, [
    { s: 0, alt: 100, phase: 'approach_layer' },
    { s: 50, alt: 100, phase: 'entry_transition' },
    { s: 70, alt: 200, phase: 'sweep' },
    { s: 100, alt: 200, phase: 'sweep' },
  ]);
  assert.deepEqual(samples.map(sample => [sample.x, sample.z]), [[0, 100], [50, 100], [70, 200], [100, 200]]);
});


test('三维航点逐一对应输出路径，并按真实弧长插值高度', () => {
  const route = {
    path: [[0, 0, 0], [10, 10, Math.PI / 2]],
    trajectory: [
      { x: 0, y: 0, s: 0, alt: 100, phase: 'entry_transition' },
      { x: 5, y: 2, s: 5, alt: 150, phase: 'entry_transition' },
      { x: 10, y: 10, s: 5 * Math.PI, alt: 200, phase: 'sweep' },
    ],
  };
  const points = outputWaypointSamples(route);
  assert.equal(points.length, route.path.length);
  assert.deepEqual(points.map(({ x, y, yaw }) => [x, y, yaw]), route.path);
  close(points[1].s, 5 * Math.PI);
  close(points[0].z, 100);
  close(points[1].z, 200);
});

test('航点显示保留全部输出点，不按密度抽样', () => {
  const path = Array.from({ length: 751 }, (_, i) => [i, 0, 0]);
  const points = outputWaypointSamples({ path, trajectory: [
    { s: 0, alt: 100, phase: 'entry_transition' },
    { s: 750, alt: 850, phase: 'sweep' },
  ] });
  assert.equal(points.length, 751);
  for (let i = 0; i < points.length; i++) {
    close(points[i].x, i);
    close(points[i].z, 100 + i);
  }
});

test('二维独立隐藏无人机路径和航点，不影响其他无人机', () => {
  const drawnSegments = [], drawnPoints = [];
  const editor = Object.create(MapEditor.prototype);
  editor.context = {
    beginPath() {}, fill() {}, stroke() {},
    arc(x, y, radius) { drawnPoints.push([x, y, radius]); },
  };
  editor.toScreen = p => p;
  editor.trace = p => drawnSegments.push(p);
  editor.plane = () => {};
  editor.time = 0;
  editor.options = { showPoints: true, hiddenAircraftIds: new Set(['hidden']) };
  editor.result = { aircraft: ['hidden', 'visible'].map((id, i) => ({
    id, status: 'success', path: [[i * 100, 0, 0], [i * 100 + 10, 0, 0]],
    trajectory: [
      { x: i * 100, y: 0, yaw: 0, alt: 2000, s: 0, time: 0, phase: 'sweep' },
      { x: i * 100 + 10, y: 0, yaw: 0, alt: 2000, s: 10, time: 1, phase: 'sweep' },
    ],
  })) };
  editor.drawRoutes();
  assert.equal(drawnSegments.length, 1);
  assert.deepEqual(drawnSegments[0], [[100, 0], [110, 0]]);
  assert.equal(drawnPoints.length, 2);
  assert.ok(drawnPoints.every(([x, , radius]) => x >= 100 && radius >= 3.5));
});

test('圆形、旋转矩形及凹多边形障碍从地面延伸至2000米', () => {
  assert.equal(OBSTACLE_HEIGHT, 2000);
  const shapes = [
    Array.from({ length: 80 }, (_, i) => [100 + 30 * Math.cos(i * Math.PI / 40), 200 + 30 * Math.sin(i * Math.PI / 40)]),
    [[100, 180], [120, 200], [100, 220], [80, 200]],
    [[80, 180], [120, 180], [100, 200], [120, 220], [80, 220]],
  ];
  for (const [index, vertices] of shapes.entries()) {
    const view = Object.create(Viewport3D.prototype);
    view.group = new THREE.Group();
    view.offset = [100, 200];
    const mesh = view.obstacleVolume(vertices, `obstacle-${index}`);
    mesh.geometry.computeBoundingBox();
    close(mesh.geometry.boundingBox.min.z + mesh.position.z, 0);
    close(mesh.geometry.boundingBox.max.z + mesh.position.z, 2000);
    assert.equal(mesh.userData.id, `obstacle-${index}`);
    assert.ok(mesh.geometry.getAttribute('position').count > vertices.length);
    for (const object of view.group.children) {
      object.geometry?.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material?.dispose();
    }
  }
});
