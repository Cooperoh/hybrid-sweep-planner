import { MapEditor, sampleTrajectory } from './map-editor.js';
import { Viewport3D, outputWaypointSamples } from './viewport3d.js';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const copy = value => structuredClone(value);
const colors = ['#168b78', '#4676b7', '#b17c36', '#8e68ad', '#be6578', '#6c8f42', '#398eac', '#a17358'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const num = (v, d = 1) => Number.isFinite(Number(v)) ? Number(v).toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—';
const clock = v => {
    const s = Math.max(0, Math.floor(Number(v) || 0)), h = Math.floor(s / 3600);
    return `${h ? `${String(h).padStart(2, '0')}:` : ''}${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const uid = prefix => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
const state = {
    scene: null, presets: [], result: null, resultSignature: '', selectedId: null, hiddenAircraftIds: new Set(), panel: 'scene', view: '2d', tool: 'select', history: [], future: [], job: null, running: false, cancelling: false, time: 0, duration: 0, playing: false, display: {
        showPoints: false, showClearance: true, showApproach: true, showSweep: true, showTurns: true
    }
};
let view3d = null, animation = 0, lastFrame = 0, pollTimer = 0;
const map = new MapEditor($('#map-pane'), { onChange: commit, onSelect: select, onStatus: ({ x, y, message }) => {
        if (message) { toast(message); return; }
        $('#pointer-coordinates').textContent = `X ${num(x / 1000, 2)}   Y ${num(y / 1000, 2)} km`;
    }, onDraftChange: () => {
        $('#draw-hint').hidden = ['select', 'pan'].includes(state.tool);
    } });
const layerMenuObserver = new ResizeObserver(() => {
    const availableHeight = $('.main-stage').clientHeight - $('.stage-toolbar').clientHeight - 12;
    $('#view-settings').style.setProperty('--layer-menu-height', `${Math.max(80, availableHeight)}px`);
});
layerMenuObserver.observe($('.main-stage'));
const signature = scene => JSON.stringify(scene), stale = () => Boolean(state.result && signature(state.scene) !== state.resultSignature);
const get = (object, path) => path.split('.').reduce((v, k) => v?.[k], object);
function set(object, path, value) {
    const keys = path.split('.'), last = keys.pop();
    let target = object;
    for (const key of keys) {
        target[key] ??= {};
        target = target[key];
    }
    if (value === undefined)
        delete target[last];
    else
        target[last] = value;
}
function toast(message, type = 'info') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `${icon(type === 'success' ? 'check' : 'info')}<span>${esc(message)}</span><button class="icon-button small" aria-label="关闭提示">${icon('close')}</button>`;
    node.querySelector('button').onclick = () => node.remove();
    $('#toast-stack').append(node);
    setTimeout(() => node.remove(), type === 'error' ? 9000 : 4500);
}
async function request(url, options) {
    const response = await fetch(url, options), text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    }
    catch {
        throw Error('规划服务返回了无法识别的数据。');
    }
    if (!response.ok) {
        const detail = data.detail || data.error || data;
        throw Error(typeof detail === 'string' ? detail : detail.message || data.message || `请求失败（${response.status}）`);
    }
    return data;
}
function validate(scene) {
    if (!scene || scene.version !== 1)
        throw Error('场景文件版本应为1。');
    if (!scene.world || ![scene.world.min, scene.world.max].every(Number.isFinite) || scene.world.max <= scene.world.min)
        throw Error('世界边界无效。');
    if (!scene.sweep || !Array.isArray(scene.sweep.center) || scene.sweep.center.length !== 2 || !scene.sweep.center.every(Number.isFinite) || !(scene.sweep.size > 0) || !(scene.sweep.spacing > 0))
        throw Error('任务区域或扫掠间距无效。');
    if (!Array.isArray(scene.aircraft) || !scene.aircraft.length || scene.aircraft.length > 30)
        throw Error('场景应包含1–30架无人机。');
    if (!Array.isArray(scene.obstacles) || scene.obstacles.length > 100)
        throw Error('障碍物列表无效或超过100个。');
    const ids = new Set();
    for (const a of scene.aircraft) {
        if (!a.id || ids.has(a.id) || ![a.x, a.y, a.heading_deg, a.altitude].every(Number.isFinite))
            throw Error('无人机编号应唯一，初始状态应为有效数字。');
        ids.add(a.id);
        a.overrides ||= {};
        a.enabled = a.enabled !== false;
    }
    for (const o of scene.obstacles) {
        if (!o.id || ids.has(o.id))
            throw Error('所有对象的编号应唯一。');
        ids.add(o.id);
        if (o.type === 'polygon') {
            if (!Array.isArray(o.vertices) || o.vertices.length < 3 || o.vertices.length > 100 || !o.vertices.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
                throw Error('多边形至少需要三个有效顶点。');
        }
        else if (['circle', 'rectangle'].includes(o.type)) {
            if (!Array.isArray(o.center) || o.center.length !== 2 || !o.center.every(Number.isFinite))
                throw Error('障碍物中心无效。');
            if (o.type === 'circle' ? !(o.radius > 0) : !(o.width > 0 && o.height > 0 && Number.isFinite(o.rotation_deg || 0)))
                throw Error('障碍物尺寸无效。');
        }
        else
            throw Error('未知障碍物类型。');
    }
    if (!scene.defaults || ![scene.defaults.speed, scene.defaults.min_turn_radius, scene.defaults.climb_rate].every(v => Number.isFinite(v) && v > 0) || ![scene.defaults.obstacle_margin, scene.defaults.layer_hold_time].every(v => Number.isFinite(v) && v >= 0))
        throw Error('飞行性能参数缺失或无效。');
    if (!scene.sampling || !(scene.sampling.sample_step > 0) || !(scene.sampling.max_arc_angle_deg > 0 && scene.sampling.max_arc_angle_deg <= 90) || !scene.search || !(scene.search.timeout_s > 0 && scene.search.timeout_s <= 30) || !(scene.search.max_expansions > 0 && scene.search.max_expansions <= 100000) || !(scene.search.shortcut_attempts >= 0 && scene.search.shortcut_attempts <= 500))
        throw Error('输出参数或搜索预算无效。');
    if (scene.sweep.size / scene.sweep.spacing > 200)
        throw Error('扫掠线数量不能超过200条，请增大扫掠间距。');
    scene.name ||= '未命名场景';
    scene.assignment ||= 'distance';
    scene.sweep.orientation ||= 'auto';
}
async function initialize() {
    $('#connection-error').hidden = true;
    try {
        const [scene, data] = await Promise.all([request('/api/default-scene'), request('/api/presets')]);
        validate(scene);
        state.scene = scene;
        state.presets = data.presets || [];
        state.history = [];
        state.future = [];
        state.selectedId = null;
        $('#scene-name').disabled = false;
        render();
        map.fit();
        $('#footer-status').textContent = '本地服务已连接';
    }
    catch (e) {
        $('#connection-error').hidden = false;
        $('#connection-error span').textContent = `无法连接本地规划服务：${e.message}`;
        $('#configuration-body').innerHTML = `<div class="panel-empty">${icon('info')}<strong>等待规划服务</strong><p>启动本地服务后重试连接。</p></div>`;
        $('#footer-status').textContent = '规划服务未连接';
    }
}
function ensureSelection() {
    if (state.selectedId !== 'sweep' && ![...state.scene.aircraft, ...state.scene.obstacles].some(o => o.id === state.selectedId))
        state.selectedId = null;
}
function commit(scene, label = '修改场景') {
    if (!state.scene || signature(scene) === signature(state.scene))
        return;
    state.history.push(copy(state.scene));
    if (state.history.length > 80)
        state.history.shift();
    state.future = [];
    state.scene = scene;
    ensureSelection();
    pause();
    render();
    $('#footer-status').textContent = label;
}
function mutate(fn, label) {
    const scene = copy(state.scene);
    fn(scene);
    commit(scene, label);
}
function undo() {
    if (!state.history.length)
        return;
    state.future.push(copy(state.scene));
    state.scene = state.history.pop();
    ensureSelection();
    pause();
    render();
}
function redo() {
    if (!state.future.length)
        return;
    state.history.push(copy(state.scene));
    state.scene = state.future.pop();
    ensureSelection();
    pause();
    render();
}
function select(id) {
    state.selectedId = typeof id === 'object' ? id?.id || null : id;
    renderInspector();
    $$('[data-object-id]').forEach(n => n.classList.toggle('selected', n.dataset.objectId === state.selectedId));
    $$('#result-rows tr').forEach(n => n.classList.toggle('selected', n.dataset.aircraftId === state.selectedId));
    updateViews();
}
function field(label, path, { unit = '', scale = 1, min, max, step = 'any', type = 'number', disabled = false, value = get(state.scene, path) } = {}) {
    step = path.endsWith('max_expansions') || path.endsWith('shortcut_attempts') ? 1 : 'any';
    return `<label class="field"><span>${esc(label)}${unit ? `<small>${unit}</small>` : ''}</span><input type="${type}" data-edit="${path}" data-scale="${scale}" value="${esc(value == null ? '' : type === 'number' ? +(Number(value) / scale).toFixed(5) : value)}" ${min == null ? '' : `min="${min}"`} ${max == null ? '' : `max="${max}"`} step="${step}" ${disabled ? 'disabled' : ''} required></label>`;
}
function choice(label, path, options) {
    return `<label class="field full-width"><span>${label}</span><select data-edit="${path}">${options.map(([v, n]) => `<option value="${v}" ${get(state.scene, path) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
}
function section(title, body, open = true) {
    return `<details class="configuration-section" ${open ? 'open' : ''}><summary><span>${title}</span>${icon('chevron')}</summary><div class="section-content">${body}</div></details>`;
}
const performanceFields = [['speed', '巡航速度', 'm/s', 1, 1], ['min_turn_radius', '最小转弯半径', 'km', 1000, .05], ['climb_rate', '升降率', 'm/s', 1, .1], ['obstacle_margin', '障碍净空', 'km', 1000, 0], ['layer_hold_time', '本机高度保持', 's', 1, 0]];
const orientations = [['auto', '自动选择'], ['horizontal', '水平扫掠'], ['vertical', '垂直扫掠']];
function sweepFields() {
    return `<div class="form-grid">${field('中心 X', 'sweep.center.0', { unit: 'km', scale: 1000, step: .1 })}${field('中心 Y', 'sweep.center.1', { unit: 'km', scale: 1000, step: .1 })}${field('区域边长', 'sweep.size', { unit: 'km', scale: 1000, min: .1, step: .5 })}${field('扫掠间距', 'sweep.spacing', { unit: 'km', scale: 1000, min: .05, step: .1 })}${field('目标高度', 'sweep.altitude', { unit: 'm', min: 0, step: 100 })}${choice('扫掠方向', 'sweep.orientation', orientations)}</div>`;
}
function obstacleName(o) {
    return { circle: '圆形障碍', rectangle: '旋转矩形', polygon: '多边形障碍' }[o.type];
}
function obstacleDescription(o) {
    return o.type === 'circle' ? `半径 ${num(o.radius / 1000)} km` : o.type === 'rectangle' ? `${num(o.width / 1000)} × ${num(o.height / 1000)} km · ${num(o.rotation_deg || 0, 0)}°` : `${o.vertices.length} 个顶点`;
}
function renderConfiguration() {
    if (!state.scene)
        return;
    const s = state.scene;
    $$('.configuration-tabs button').forEach(b => b.classList.toggle('active', b.dataset.panel === state.panel));
    $('#fleet-count').textContent = s.aircraft.filter(a => a.enabled).length;
    if (state.panel === 'scene') {
        $('#configuration-body').innerHTML = `<div class="presets-block"><label class="field"><span>预置场景</span><select id="preset-select"><option value="">选择预置场景…</option>${state.presets.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><p class="preset-description">从预置场景开始，或直接在画布中编辑。</p></div>${section('任务区域', `<div class="section-subheading"><span>方形覆盖区域</span><button class="text-button" data-select="sweep">选择区域 ${icon('target')}</button></div>${sweepFields()}${choice('任务分配依据', 'assignment', [['distance', '航程均衡'], ['time', '飞行时间均衡']])}`)}${section('统一飞行性能', `<div class="form-grid">${performanceFields.map(([k, l, u, scale, min]) => field(l, `defaults.${k}`, { unit: u, scale, min })).join('')}</div><p class="field-note">各机默认继承，可在对象属性中单独覆盖。</p>`)}${section('航点输出', `<div class="segmented sampling-presets">${[['fine', '精细'], ['standard', '标准'], ['sparse', '稀疏']].map(([v, n]) => `<button data-sampling="${v}" class="${s.sampling.preset === v ? 'active' : ''}">${n}</button>`).join('')}</div><div class="form-grid">${field('最大弧长间隔', 'sampling.sample_step', { unit: 'm', min: 1, step: 10 })}${field('最大转角间隔', 'sampling.max_arc_angle_deg', { unit: '°', min: .1, max: 90, step: .5 })}</div><p class="field-note">直线只保留端点；圆弧按上述间隔采样。</p>`)}${section('世界与搜索预算', `<div class="form-grid">${field('世界下界', 'world.min', { unit: 'km', scale: 1000, step: 10 })}${field('世界上界', 'world.max', { unit: 'km', scale: 1000, step: 10 })}${field('搜索时间预算', 'search.timeout_s', { unit: 's', min: .1, max: 30, step: 1 })}${field('最大扩展状态', 'search.max_expansions', { min: 1, max: 100000, step: 1000 })}${field('捷径优化次数', 'search.shortcut_attempts', { min: 0, max: 500, step: 10 })}</div>`, false)}`;
    }
    else if (state.panel === 'fleet') {
        $('#configuration-body').innerHTML = `<div class="list-panel-intro"><div><h3>无人机编组</h3><p>启用的无人机参与任务分配。</p></div><button class="icon-button" data-action="add-aircraft" title="添加无人机">${icon('plus')}</button></div><div class="fleet-count-control"><label for="aircraft-count">配置数量</label><input id="aircraft-count" type="number" min="1" max="30" step="1" value="${s.aircraft.length}"><span>架</span></div><div class="object-list">${s.aircraft.map((a, i) => `<div class="object-row ${state.selectedId === a.id ? 'selected' : ''}" data-object-id="${esc(a.id)}"><label class="enable-check" title="参与规划"><input type="checkbox" data-enable="${esc(a.id)}" ${a.enabled ? 'checked' : ''} aria-label="启用${esc(a.name)}"></label><button class="object-select" data-select="${esc(a.id)}"><span class="aircraft-mini" style="--aircraft-color:${colors[i % colors.length]}">${icon('plane')}</span><span><strong>${esc(a.name)}</strong><small>${num(a.altitude, 0)} m · ${num(a.heading_deg, 0)}°${Object.keys(a.overrides || {}).length ? ' · 独立参数' : ''}</small></span>${icon('chevron')}</button></div>`).join('')}</div><button class="button full-width add-object" data-action="add-aircraft">${icon('plus')}添加无人机</button>`;
    }
    else {
        $('#configuration-body').innerHTML = `<div class="list-panel-intro"><div><h3>障碍物场</h3><p>选择对象调整几何属性。</p></div><span class="count-badge">${s.obstacles.length}</span></div><div class="obstacle-actions"><button class="button" data-action="random-obstacles">${icon('refresh')}随机生成</button><button class="button quiet" data-action="clear-obstacles" ${s.obstacles.length ? '' : 'disabled'}>${icon('trash')}清空</button></div><div class="drawing-cards"><button data-set-tool="circle">${icon('circle')}圆形</button><button data-set-tool="rectangle">${icon('rectangle')}矩形</button><button data-set-tool="polygon">${icon('polygon')}多边形</button></div><div class="object-list obstacle-list">${s.obstacles.map((o, i) => `<button class="object-row obstacle-select ${state.selectedId === o.id ? 'selected' : ''}" data-select="${esc(o.id)}" data-object-id="${esc(o.id)}"><span class="obstacle-mini">${icon(o.type)}</span><span><strong>${obstacleName(o)} ${String(i + 1).padStart(2, '0')}</strong><small>${obstacleDescription(o)}</small></span>${icon('chevron')}</button>`).join('') || '<div class="inline-empty">暂无障碍物。使用上方工具在画布中绘制。</div>'}</div>`;
    }
}
function resultInspector(a) {
    if (a.status === 'failed')
        return `<div class="inspector-section failure-detail"><span class="status-badge failed">规划失败</span><strong>规划未完成</strong><p>${esc(a.error?.message || '未找到可行航迹。')}</p><small>发生阶段：${esc(stageLabel(a.error?.stage))}</small>${a.error?.details ? `<details><summary>详细信息</summary><pre>${esc(typeof a.error.details === 'string' ? a.error.details : JSON.stringify(a.error.details, null, 2))}</pre></details>` : ''}</div>`;
    if (a.status !== 'success')
        return '<div class="inspector-section"><span class="status-badge idle">未参与规划</span></div>';
    return `<div class="inspector-section"><div class="section-subheading"><h3>规划统计</h3><span class="status-badge ${stale() ? 'outdated' : 'success'}">${stale() ? '已过期' : '完成'}</span></div><dl class="stat-list"><div><dt>任务航程</dt><dd>${num(a.stats?.path_length_m / 1000)} km</dd></div><div><dt>飞行时间</dt><dd>${clock(a.stats?.flight_time_s)}</dd></div><div><dt>输出航点</dt><dd>${num(a.stats?.output_points, 0)}</dd></div><div><dt title="参考接近与实际接入搜索，不包含扫掠连接内部搜索">接近扩展</dt><dd>${num(a.stats?.expanded_nodes, 0)}</dd></div><div><dt>规划耗时</dt><dd>${num(a.stats?.planning_time_s, 2)} s</dd></div></dl></div>`;
}
function renderInspector() {
    if (!state.scene)
        return;
    const s = state.scene, ai = s.aircraft.findIndex(a => a.id === state.selectedId), oi = s.obstacles.findIndex(o => o.id === state.selectedId);
    let title = '任务概览', html = '';
    $('#clear-selection').hidden = !state.selectedId;
    if (ai >= 0) {
        const a = s.aircraft[ai], p = `aircraft.${ai}`;
        title = a.name;
        html = `<div class="selection-type"><span class="aircraft-mini" style="--aircraft-color:${colors[ai % colors.length]}">${icon('plane')}</span><span>无人机 / ${esc(a.id)}</span></div><div class="inspector-section"><h3>初始状态</h3>${field('名称', `${p}.name`, { type: 'text' })}<div class="form-grid">${field('位置 X', `${p}.x`, { unit: 'km', scale: 1000, step: .1 })}${field('位置 Y', `${p}.y`, { unit: 'km', scale: 1000, step: .1 })}${field('初始高度', `${p}.altitude`, { unit: 'm', min: 0, step: 100 })}${field('起始航向', `${p}.heading_deg`, { unit: '°', step: 5 })}</div><label class="check-row"><input type="checkbox" data-enable="${esc(a.id)}" ${a.enabled ? 'checked' : ''}>参与本次规划</label></div><div class="inspector-section"><div class="section-subheading"><h3>逐机性能覆盖</h3><button class="text-button" data-action="reset-overrides">全部继承</button></div><p class="field-note">勾选后使用独立值，其余继承统一配置。</p>${performanceFields.map(([k, l, u, scale, min]) => {
            const on = Object.hasOwn(a.overrides || {}, k);
            return `<div class="override-field"><label class="override-toggle"><input type="checkbox" data-override="${k}" ${on ? 'checked' : ''}><span>${l}</span></label><label class="override-value"><input type="number" aria-label="${l}独立值（${u}）" data-edit="${p}.overrides.${k}" data-scale="${scale}" value="${+(Number(on ? a.overrides[k] : s.defaults[k]) / scale).toFixed(4)}" min="${min}" step="any" ${on ? '' : 'disabled'} required><small>${u}</small></label></div>`;
        }).join('')}</div>`;
        const result = state.result?.aircraft.find(item => item.id === a.id);
        if (result)
            html += resultInspector(result);
        html += `<div class="inspector-object-actions"><button class="button" data-action="duplicate-selection">${icon('copy')}复制</button><button class="button quiet danger-text" data-action="delete-selection" ${s.aircraft.length <= 1 ? 'disabled' : ''}>${icon('trash')}删除</button></div>`;
    }
    else if (oi >= 0) {
        const o = s.obstacles[oi], p = `obstacles.${oi}`;
        title = obstacleName(o);
        html = `<div class="selection-type obstacle">${icon(o.type)}<span>${esc(o.id)}</span></div><div class="inspector-section"><h3>几何属性</h3>`;
        if (o.type !== 'polygon')
            html += `<div class="form-grid">${field('中心 X', `${p}.center.0`, { unit: 'km', scale: 1000, step: .1 })}${field('中心 Y', `${p}.center.1`, { unit: 'km', scale: 1000, step: .1 })}${o.type === 'circle' ? field('障碍半径', `${p}.radius`, { unit: 'km', scale: 1000, min: .05, step: .1 }) : `${field('宽度', `${p}.width`, { unit: 'km', scale: 1000, min: .1, step: .1 })}${field('高度', `${p}.height`, { unit: 'km', scale: 1000, min: .1, step: .1 })}${field('旋转角', `${p}.rotation_deg`, { unit: '°', step: 5, value: o.rotation_deg || 0 })}`}</div>`;
        else
            html += `<p class="field-note">按边界顺序排列，坐标单位为 km。</p><div class="vertices-table"><div class="vertices-heading"><span>顶点</span><span>X</span><span>Y</span><span></span></div>${o.vertices.map((v, i) => `<div class="vertex-row"><span>${String(i + 1).padStart(2, '0')}</span><input aria-label="顶点${i + 1} X" type="number" data-edit="${p}.vertices.${i}.0" data-scale="1000" value="${+(v[0] / 1000).toFixed(3)}" step="any" required><input aria-label="顶点${i + 1} Y" type="number" data-edit="${p}.vertices.${i}.1" data-scale="1000" value="${+(v[1] / 1000).toFixed(3)}" step="any" required><button class="icon-button small" data-remove-vertex="${i}" title="删除顶点" ${o.vertices.length <= 3 ? 'disabled' : ''}>${icon('close')}</button></div>`).join('')}</div><button class="button full-width add-object" data-action="add-vertex">${icon('plus')}在闭合边插入顶点</button>`;
        html += `</div><div class="inspector-note">${icon('info')}<span>净空按当前选中飞机显示；未选飞机时显示统一默认值。拖动控制点可调整尺寸、旋转角或顶点。</span></div><div class="inspector-object-actions"><button class="button" data-action="duplicate-selection">${icon('copy')}复制</button><button class="button quiet danger-text" data-action="delete-selection">${icon('trash')}删除</button></div>`;
    }
    else if (state.selectedId === 'sweep') {
        title = '扫掠任务区域';
        html = `<div class="selection-type">${icon('target')}<span>正方形覆盖任务</span></div><div class="inspector-section"><h3>任务区几何</h3>${sweepFields()}</div><div class="inspector-note">${icon('info')}<span>拖动区域调整中心，拖动角点改变边长。升降和掉头均在任务区外完成。</span></div>`;
    }
    else {
        const active = s.aircraft.filter(a => a.enabled).length;
        html = `<div class="overview-emblem">${icon('target')}</div><div class="overview-title">从任务区域<br>到完整飞行航迹</div><p class="overview-copy">配置区域与机队，在画布中编辑环境，生成满足转弯半径、净空及高度约束的航迹。</p><div class="overview-stats"><div><strong>${active}<small> / ${s.aircraft.length}</small></strong><span>参与规划的无人机</span></div><div><strong>${num((s.sweep.size / 1000) ** 2, 0)}<small> km²</small></strong><span>任务区域面积</span></div><div><strong>${s.obstacles.length}</strong><span>静态障碍物</span></div></div><div class="inspector-note">${icon('cursor')}<span>点击画布中的无人机、任务区或障碍物，查看并精确编辑其属性。</span></div><div class="phase-key"><h3>任务高度阶段</h3><span><i style="--phase:#829b87"></i>保持本机高度接近任务区</span><span><i style="--phase:#c19a59"></i>区外直线升降</span><span><i style="--phase:#168b78"></i>目标高度扫掠</span><span><i style="--phase:#7d75a5"></i>本机高度转弯与离场</span></div>`;
    }
    $('#selection-title').textContent = title;
    $('#inspector-body').innerHTML = html;
}
function render() {
    if (!state.scene)
        return;
    $('#scene-name').value = state.scene.name;
    renderConfiguration();
    renderInspector();
    renderResults();
    renderPathVisibility();
    renderState();
    updateViews();
}
function renderState() {
    const outdated = stale(), active = state.scene.aircraft.filter(a => a.enabled).length;
    $('#plan-button').disabled = state.running || !active;
    $('#plan-button').hidden = state.running;
    $('#plan-button').classList.toggle('needs-planning', !state.result || outdated);
    $('#plan-button span').textContent = state.result ? outdated ? '重新生成航迹' : '再次规划' : '生成航迹';
    $('#cancel-plan').hidden = !state.running;
    $('#cancel-plan').disabled = state.cancelling;
    $('#cancel-plan').textContent = state.cancelling ? '正在取消…' : '取消规划';
    $('#scene-state').className = `state-pill ${state.running ? 'working' : outdated ? 'warning' : state.result ? 'success' : 'neutral'}`;
    $('#scene-state').textContent = state.running ? '计算中' : outdated ? '待重新规划' : state.result ? '结果已更新' : '尚未规划';
    $('#stale-badge').hidden = !outdated;
    $('#undo-button').disabled = !state.history.length;
    $('#redo-button').disabled = !state.future.length;
    $('#scene-statistics').textContent = `${active} 架无人机 · ${state.scene.obstacles.length} 个障碍物 · ${(state.scene.world.max - state.scene.world.min) / 1000} km 世界范围`;
}
function updateViews() {
    if (!state.scene)
        return;
    const options = { ...state.display, hiddenAircraftIds: state.hiddenAircraftIds, selectedId: state.selectedId, resultStale: stale() };
    map.update(state.scene, state.result, options);
    if (view3d) {
        try {
            view3d.update(state.scene, state.result, options);
            view3d.setTime(state.time);
        }
        catch (e) {
            console.error(e);
        }
    }
    if (state.view === 'altitude')
        drawAltitude();
}
function pathVisibilityAircraft() {
    const aircraft = new Map((state.scene?.aircraft || []).map(a => [a.id, a]));
    for (const a of state.result?.aircraft || []) aircraft.set(a.id, a);
    return [...aircraft.values()];
}
function renderPathVisibility() {
    $('#path-visibility-list').innerHTML = pathVisibilityAircraft().map((a, i) => `<label><input type="checkbox" data-path-visibility="${esc(a.id)}" ${state.hiddenAircraftIds.has(a.id) ? '' : 'checked'}><span class="color-dot" style="background:${colors[i % colors.length]}"></span><span>${esc(a.name || a.id)}</span></label>`).join('');
    $$('[data-path-visibility]').forEach(input => { input.checked = !state.hiddenAircraftIds.has(input.dataset.pathVisibility); });
}
function setPathVisibility(id, visible) {
    if (visible) state.hiddenAircraftIds.delete(id); else state.hiddenAircraftIds.add(id);
    renderPathVisibility();
    updateViews();
}
function setView(view) {
    state.view = view;
    $$('.view-tabs button').forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
        b.setAttribute('aria-selected', String(b.dataset.view === view));
    });
    $('#map-pane').hidden = view !== '2d';
    $('#three-pane').hidden = view !== '3d';
    $('#altitude-pane').hidden = view !== 'altitude';
    $('#drawing-toolbar').hidden = view !== '2d';
    $('#viewport-caption').hidden = view === 'altitude';
    $('#zoom-in').hidden = view !== '2d';
    $('#zoom-out').hidden = view !== '2d';
    $('#viewport-caption span:nth-child(2)').textContent = view === '3d' ? '等比例三维空间' : '平面任务空间';
    $('#viewport-caption span:last-child').textContent = view === '3d' ? 'XYZ · km' : 'XY · km';
    $('#editor-hint').textContent = view === '2d' ? '滚轮缩放 · 空格平移 · 选择后拖动控制点' : view === '3d' ? '拖动旋转 · 右键平移 · 滚轮缩放 · XYZ 等比例' : '横轴真实航程 · 纵轴实际高度 · 点击曲线选机';
    if (view === '3d' && !view3d) {
        try {
            view3d = new Viewport3D($('#three-pane'), { onSelect: select });
        }
        catch (e) {
            toast(`三维视图初始化失败：${e.message}`, 'error');
        }
    }
    if (view !== '2d') {
        map.setTool('select');
        state.tool = 'select';
        $$('#drawing-toolbar [data-tool]').forEach(button => button.classList.toggle('active', button.dataset.tool === 'select'));
        $('#draw-hint').hidden = true;
    }
    requestAnimationFrame(() => {
        map.resize();
        view3d?.resize();
        updateViews();
    });
}
function setTool(tool) {
    if (state.view !== '2d')
        setView('2d');
    state.tool = tool;
    map.setTool(tool);
    $$('#drawing-toolbar [data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    const hints = { circle: '点选圆心 → 移动确定半径 → 再次点击完成 · Esc 取消', rectangle: '点选两个对角 → 移动调整旋转角 → 点击完成 · Shift 吸附', polygon: '连续点选顶点 → 点击起点、双击或 Enter 闭合 · Esc 取消' };
    $('#draw-hint').textContent = hints[tool] || '';
    $('#draw-hint').hidden = !hints[tool];
}
function renderResults() {
    const r = state.result;
    $('#export-results').disabled = !r;
    if (!r)
        return;
    const successes = r.aircraft.filter(a => a.status === 'success'), failures = r.aircraft.filter(a => a.status === 'failed'), length = successes.reduce((v, a) => v + (a.stats?.path_length_m || 0), 0), points = successes.reduce((v, a) => v + (a.stats?.output_points || 0), 0);
    $('#result-summary').textContent = `${successes.length} 架完成${failures.length ? ` · ${failures.length} 架失败` : ''}`;
    $('#result-status').innerHTML = `<span class="status-badge ${stale() ? 'outdated' : failures.length ? 'failed' : 'success'}">${stale() ? '快照已过期' : failures.length ? successes.length ? '部分完成' : '规划失败' : '全部完成'}</span>`;
    $('#result-metrics').hidden = false;
    $('#result-metrics').innerHTML = `<div><span>总航程</span><strong>${num(length / 1000)}<small>km</small></strong></div><div><span>任务时长</span><strong>${clock(state.duration)}</strong></div><div><span>输出航点</span><strong>${num(points, 0)}</strong></div><div><span>总规划耗时</span><strong>${num(r.planning_time_s, 2)}<small>s</small></strong></div>`;
    $('#result-rows').innerHTML = r.aircraft.map((a, i) => {
        const ok = a.status === 'success', fail = a.status === 'failed', s = a.stats || {};
        return `<tr data-aircraft-id="${esc(a.id)}" class="${state.selectedId === a.id ? 'selected' : ''}"><td><button class="result-aircraft" data-select="${esc(a.id)}"><span class="color-dot" style="background:${colors[i % colors.length]}"></span>${esc(a.name || a.id)}</button></td><td><label class="result-path-toggle"><input type="checkbox" data-path-visibility="${esc(a.id)}" aria-label="显示${esc(a.name || a.id)}的路径" ${state.hiddenAircraftIds.has(a.id) ? '' : 'checked'} ${ok ? '' : 'disabled'}><span>显示</span></label></td><td><span class="status-badge ${a.status}">${ok ? '规划完成' : fail ? '规划失败' : '未参与'}</span></td><td>${ok ? `${num(s.path_length_m / 1000)} <small>km</small>` : '—'}</td><td>${ok ? clock(s.flight_time_s) : '—'}</td><td>${ok ? `${num(s.output_points, 0)} <span class="muted">/ ${num(s.trajectory_points ?? a.trajectory?.length, 0)}</span>` : '—'}</td><td>${ok ? num(s.expanded_nodes, 0) : '—'}</td><td>${s.planning_time_s != null ? `${num(s.planning_time_s, 2)} <small>s</small>` : '—'}</td><td>${fail ? `<button class="error-link" data-select="${esc(a.id)}">${esc(a.error?.message || '查看失败信息')}</button>` : ok ? '<span class="result-valid">几何与高度校验通过</span>' : '—'}</td></tr>`;
    }).join('');
    $('#altitude-empty').hidden = successes.length > 0;
    $('#play-button').disabled = !state.duration;
    $('#reset-playback').disabled = !state.duration;
    $('#time-slider').disabled = !state.duration;
    $('#time-slider').max = state.duration || 1;
    $('#playback-duration').textContent = clock(state.duration);
}
function stageLabel(s) {
    return {
        reference: '参考接近', validation: '航迹校验', idle: '未分配', success: '本机完成', failed: '本机失败', finished: '任务结束', preparing: '准备任务', queued: '等待计算', validating: '校验场景', planning: '规划航迹', approach: '规划接近航迹', sweep: '连接扫掠航迹', altitude: '生成高度剖面', completed: '规划完成', cancelled: '规划已取消', assigning: '分配扫掠任务', searching: '混合搜索'
    }[s] || s || '正在规划';
}
async function plan() {
    if (!state.scene || state.running)
        return;
    try {
        validate(copy(state.scene));
    }
    catch (e) {
        toast(e.message, 'error');
        return;
    }
    pause();
    state.running = true;
    state.cancelling = false;
    $('#planning-overlay').hidden = false;
    $('#planning-stage').textContent = '提交规划任务';
    $('#planning-progress').textContent = '';
    $('#planning-progress-bar').style.width = '2%';
    renderState();
    const snapshot = copy(state.scene);
    try {
        const response = await request('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: snapshot }) });
        state.job = { id: response.job_id, snapshot };
        if (state.cancelling)
            await request(`/api/jobs/${encodeURIComponent(state.job.id)}`, { method: 'DELETE' });
        await pollJob();
    }
    catch (e) {
        finishJob();
        toast(`无法启动规划：${e.message}`, 'error');
    }
}
async function pollJob() {
    if (!state.job)
        return;
    try {
        const job = await request(`/api/jobs/${encodeURIComponent(state.job.id)}`), p = job.progress || {};
        $('#planning-stage').textContent = stageLabel(p.stage);
        const aircraftName = state.job.snapshot.aircraft.find(aircraft => aircraft.id === p.aircraft_id)?.name || p.aircraft_id;
        $('#planning-progress').textContent = `${aircraftName ? `${aircraftName} · ` : ''}${p.completed || 0} / ${p.total || state.scene.aircraft.filter(a => a.enabled).length}`;
        $('#planning-progress-bar').style.width = `${Math.max(4, Math.min(100, (p.completed || 0) / Math.max(1, p.total || 1) * 100))}%`;
        $('#footer-status').textContent = stageLabel(p.stage);
        if (['running', 'queued'].includes(job.status)) {
            pollTimer = setTimeout(pollJob, 500);
            return;
        }
        if (job.result) {
            state.result = job.result;
            state.resultSignature = signature(state.job.snapshot);
            state.duration = Math.max(Number(job.result.duration_s) || 0, ...job.result.aircraft.map(a => a.trajectory?.at(-1)?.time || 0));
            state.time = 0;
            const failures = job.result.aircraft.filter(a => a.status === 'failed');
            toast(failures.length ? `规划结束：${failures.length} 架未完成，请查看失败详情。` : '航迹规划完成，几何与高度约束已校验。', failures.length ? 'info' : 'success');
        }
        else if (job.status === 'failed')
            toast(`规划失败：${job.error?.message || job.error || '请检查配置。'}`, 'error');
        else if (job.status === 'cancelled')
            toast('规划任务已取消。');
        finishJob();
        setTime(state.time);
        render();
    }
    catch (e) {
        finishJob();
        toast(`读取规划状态失败：${e.message}`, 'error');
    }
}
function finishJob() {
    clearTimeout(pollTimer);
    state.running = false;
    state.cancelling = false;
    state.job = null;
    $('#planning-overlay').hidden = true;
    if (state.scene)
        renderState();
    $('#footer-status').textContent = '本地服务已连接';
}
async function cancelJob() {
    if (!state.running || state.cancelling)
        return;
    state.cancelling = true;
    renderState();
    if (!state.job)
        return;
    try {
        await request(`/api/jobs/${encodeURIComponent(state.job.id)}`, { method: 'DELETE' });
    }
    catch (e) {
        state.cancelling = false;
        renderState();
        toast(`取消失败：${e.message}`, 'error');
    }
}
function setTime(t) {
    state.time = Math.max(0, Math.min(state.duration, t));
    $('#time-slider').value = state.time;
    $('#playback-time').textContent = clock(state.time);
    map.setTime(state.time);
    view3d?.setTime(state.time);
    if (state.view === 'altitude')
        drawAltitude();
}
function pause() {
    state.playing = false;
    cancelAnimationFrame(animation);
    $('#play-button').innerHTML = icon('play');
    $('#play-button').setAttribute('aria-label', '播放任务');
}
function togglePlayback() {
    if (!state.duration)
        return;
    if (state.playing) {
        pause();
        return;
    }
    if (state.time >= state.duration)
        setTime(0);
    state.playing = true;
    lastFrame = performance.now();
    $('#play-button').innerHTML = icon('pause');
    $('#play-button').setAttribute('aria-label', '暂停播放');
    const advance = now => {
        if (!state.playing)
            return;
        setTime(state.time + (now - lastFrame) / 1000 * Number($('#playback-speed').value));
        lastFrame = now;
        if (state.time >= state.duration)
            pause();
        else
            animation = requestAnimationFrame(advance);
    };
    animation = requestAnimationFrame(advance);
}
function drawAltitude() {
    const canvas = $('#altitude-canvas'), rect = $('#altitude-pane').getBoundingClientRect();
    if (!rect.width || !rect.height)
        return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const c = canvas.getContext('2d');
    canvas.chartGeometry = null;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.fillStyle = '#fbfcf9';
    c.fillRect(0, 0, rect.width, rect.height);
    const aircraft = state.result?.aircraft.filter(a => a.status === 'success' && a.trajectory?.length && !state.hiddenAircraftIds.has(a.id)) || [];
    if (!aircraft.length) {
        if (state.result?.aircraft.some(a => a.status === 'success')) {
            c.font = '15px "Segoe UI","Microsoft YaHei",sans-serif';
            c.fillStyle = '#6c8172';
            c.textAlign = 'center';
            c.fillText('路径已隐藏，可在图层显示中重新勾选。', rect.width / 2, rect.height / 2);
        }
        return;
    }
    const points = aircraft.flatMap(a => a.trajectory), target = state.result.scene?.sweep?.altitude ?? state.scene.sweep.altitude, maxDistance = Math.max(1, ...aircraft.map(a => a.trajectory.at(-1).s));
    let minAltitude = target, maxAltitude = target;
    for (const p of points) {
        minAltitude = Math.min(minAltitude, p.alt);
        maxAltitude = Math.max(maxAltitude, p.alt);
    }
    const pad = Math.max(100, (maxAltitude - minAltitude) * .18);
    minAltitude = Math.floor((minAltitude - pad) / 100) * 100;
    maxAltitude = Math.ceil((maxAltitude + pad) / 100) * 100;
    const legendColumns = Math.max(1, Math.min(4, Math.floor((rect.width - 100) / 125)));
    const maxLegendRows = Math.max(1, Math.floor((rect.height - 180) / 22));
    const legendCount = Math.min(aircraft.length, legendColumns * maxLegendRows);
    const legendRows = Math.ceil(legendCount / legendColumns), bounds = { left: 72, top: Math.max(72, legendRows * 22 + 40), width: Math.max(100, rect.width - 100), height: Math.max(80, rect.height - Math.max(125, legendRows * 22 + 95)) };
    const x = v => bounds.left + v / maxDistance * bounds.width, y = v => bounds.top + (maxAltitude - v) / (maxAltitude - minAltitude) * bounds.height;
    c.font = '13px "Segoe UI","Microsoft YaHei",sans-serif';
    c.fillStyle = '#8a9a90';
    for (let i = 0; i <= 5; i++) {
        const sy = bounds.top + bounds.height * i / 5, alt = maxAltitude - (maxAltitude - minAltitude) * i / 5;
        c.strokeStyle = '#e5ebe4';
        c.beginPath();
        c.moveTo(bounds.left, sy);
        c.lineTo(bounds.left + bounds.width, sy);
        c.stroke();
        c.textAlign = 'right';
        c.fillText(num(alt, 0), bounds.left - 10, sy + 4);
        const sx = bounds.left + bounds.width * i / 5;
        c.beginPath();
        c.moveTo(sx, bounds.top);
        c.lineTo(sx, bounds.top + bounds.height);
        c.stroke();
        c.textAlign = 'center';
        c.fillText(num(maxDistance / 1000 * i / 5, 0), sx, bounds.top + bounds.height + 20);
    }
    c.textAlign = 'left';
    c.fillStyle = '#678173';
    c.fillText('高度 / m', bounds.left, bounds.top - 15);
    c.textAlign = 'right';
    c.fillText('真实航程 / km', bounds.left + bounds.width, rect.height - 15);
    c.setLineDash([5, 4]);
    c.strokeStyle = '#97aaa0';
    c.beginPath();
    c.moveTo(bounds.left, y(target));
    c.lineTo(bounds.left + bounds.width, y(target));
    c.stroke();
    c.setLineDash([]);
    c.textAlign = 'left';
    c.fillStyle = '#81978a';
    c.fillText(`任务高度 ${num(target, 0)} m`, bounds.left + 8, y(target) - 7);
    aircraft.forEach((a, i) => {
        const color = colors[state.result.aircraft.findIndex(item => item.id === a.id) % colors.length];
        c.globalAlpha = state.selectedId && state.selectedId !== a.id ? .25 : stale() ? .55 : .9;
        c.strokeStyle = color;
        c.lineWidth = state.selectedId === a.id ? 2.8 : 1.8;
        c.beginPath();
        a.trajectory.forEach((p, j) => j ? c.lineTo(x(p.s), y(p.alt)) : c.moveTo(x(p.s), y(p.alt)));
        c.stroke();
        if (state.display.showPoints) {
            c.fillStyle = '#fff';
            c.strokeStyle = color;
            c.lineWidth = 1.5;
            for (const p of outputWaypointSamples(a)) {
                c.beginPath();
                c.arc(x(p.s), y(p.z), 4, 0, Math.PI * 2);
                c.fill();
                c.stroke();
            }
        }
        const current = sampleTrajectory(a.trajectory, state.time);
        if (current) {
            c.beginPath();
            c.arc(x(current.s), y(current.alt), 4, 0, Math.PI * 2);
            c.fillStyle = color;
            c.fill();
            c.strokeStyle = '#fff';
            c.lineWidth = 1.5;
            c.stroke();
        }
        c.globalAlpha = 1;
        if (i < legendCount) {
            const width = bounds.width / legendColumns;
            const lx = bounds.left + (i % legendColumns) * width, ly = 22 + Math.floor(i / legendColumns) * 22;
            c.fillStyle = color;
            c.fillRect(lx, ly - 5, 13, 2);
            c.fillStyle = '#597062';
            let label = i === legendCount - 1 && aircraft.length > legendCount ? `另${aircraft.length - legendCount + 1}架` : a.name || a.id;
            while (label.length > 2 && c.measureText(label).width > width - 24) label = label.slice(0, -2) + '…';
            c.fillText(label, lx + 18, ly);
        }
    });
    canvas.chartGeometry = { bounds, y, aircraft, maxDistance };
}
function exportFile(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const filename = (scene = state.scene) => String(scene?.name || 'HybridSweep').replace(/[<>:"/\\|?*]/g, '_');
function exportScene() {
    if (state.scene)
        exportFile(`${filename()}-场景.json`, JSON.stringify(state.scene, null, 2) + '\n', 'application/json;charset=utf-8');
}
function exportResult(format) {
    if (!state.result)
        return;
    if (format === 'json')
        exportFile(`${filename(state.result.scene)}-规划结果.json`, JSON.stringify(state.result, null, 2) + '\n', 'application/json;charset=utf-8');
    else {
        const cell = v => `"${String(v ?? '').replaceAll('"', '""')}"`, rows = [['aircraft_id', 'aircraft_name', 'x_m', 'y_m', 'altitude_m', 'yaw_rad', 'distance_m', 'time_s', 'phase']];
        for (const a of state.result.aircraft)
            for (const p of a.trajectory || [])
                rows.push([a.id, a.name, p.x, p.y, p.alt, p.yaw, p.s, p.time, p.phase]);
        exportFile(`${filename(state.result.scene)}-高度轨迹.csv`, '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n', 'text/csv;charset=utf-8');
    }
    $('#export-dialog').close();
}
function capture() {
    try {
        const image = state.view === '3d' ? view3d?.capture() : state.view === 'altitude' ? $('#altitude-canvas').toDataURL('image/png') : map.capture();
        if (!image)
            return;
        if (!image.startsWith('data:image/png;base64,'))
            throw Error('视图尚未准备好，请稍后重试。');
        const binary = atob(image.slice(image.indexOf(',') + 1));
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        exportFile(`${filename()}-${state.view}-${Math.round(state.time)}s.png`, bytes, 'image/png');
        toast('当前视图已导出为PNG。', 'success');
    }
    catch (e) {
        toast(`截图失败：${e.message}`, 'error');
    }
}
function newAircraft(scene) {
    const i = scene.aircraft.length, base = scene.aircraft.at(-1) || { x: 10000, y: 10000, altitude: 2000, heading_deg: 45 };
    return {
        id: uid('aircraft'), name: `无人机 ${String(i + 1).padStart(2, '0')}`, x: base.x + 1000, y: base.y + 1000, heading_deg: base.heading_deg, altitude: base.altitude + 200, enabled: true, overrides: {}
    };
}
function addAircraft() {
    if (state.scene.aircraft.length >= 30) {
        toast('最多配置30架无人机。');
        return;
    }
    let id;
    mutate(s => {
        const a = newAircraft(s);
        s.aircraft.push(a);
        id = a.id;
    }, '添加无人机');
    select(id);
}
function deleteSelection() {
    if (!state.selectedId || state.selectedId === 'sweep')
        return;
    const aircraft = state.scene.aircraft.find(a => a.id === state.selectedId);
    if (aircraft && state.scene.aircraft.length <= 1) {
        toast('至少保留一架无人机。');
        return;
    }
    mutate(s => {
        s.aircraft = s.aircraft.filter(a => a.id !== state.selectedId);
        s.obstacles = s.obstacles.filter(o => o.id !== state.selectedId);
    }, '删除对象');
}
function duplicateSelection() {
    const a = state.scene.aircraft.find(a => a.id === state.selectedId), o = state.scene.obstacles.find(o => o.id === state.selectedId);
    if (!a && !o)
        return;
    if (a && state.scene.aircraft.length >= 30 || o && state.scene.obstacles.length >= 100) {
        toast('对象数量已达上限。');
        return;
    }
    let id;
    mutate(s => {
        const item = copy(a || o);
        item.id = uid(a ? 'aircraft' : 'obstacle');
        id = item.id;
        if (a) {
            item.name += ' 副本';
            item.x += 2000;
            item.y += 2000;
            s.aircraft.push(item);
        }
        else {
            if (item.type === 'polygon')
                item.vertices = item.vertices.map(v => v.map(x => x + 2000));
            else
                item.center = item.center.map(x => x + 2000);
            s.obstacles.push(item);
        }
    }, '复制对象');
    select(id);
}
function randomObstacles(form) {
    const data = new FormData(form), count = Number(data.get('count')), seed = Number(data.get('seed')), minimum = Number(data.get('minRadius')) * 1000, maximum = Number(data.get('maxRadius')) * 1000;
    if (minimum > maximum) {
        toast('最小半径不能大于最大半径。', 'error');
        return;
    }
    let seedState = seed >>> 0;
    const random = () => {
        seedState = (seedState + 0x6D2B79F5) >>> 0;
        let v = Math.imul(seedState ^ seedState >>> 15, 1 | seedState);
        v ^= v + Math.imul(v ^ v >>> 7, 61 | v);
        return ((v ^ v >>> 14) >>> 0) / 4294967296;
    };
    const generated = [], scene = copy(state.scene), margin = scene.defaults.obstacle_margin, [sx, sy] = scene.sweep.center, half = scene.sweep.size / 2;
    const allowed = Math.min(count, 100 - (data.has('replace') ? 0 : scene.obstacles.length));
    for (let attempt = 0; generated.length < allowed && attempt < count * 1000; attempt++) {
        const radius = minimum + random() * (maximum - minimum), lower = scene.world.min + radius + margin, upper = scene.world.max - radius - margin;
        if (lower >= upper)
            break;
        const x = lower + random() * (upper - lower), y = lower + random() * (upper - lower), cx = Math.max(sx - half, Math.min(sx + half, x)), cy = Math.max(sy - half, Math.min(sy + half, y));
        if (Math.hypot(x - cx, y - cy) < radius + margin + scene.defaults.min_turn_radius || scene.aircraft.some(a => Math.hypot(x - a.x, y - a.y) < radius + margin + 2000) || generated.some(o => Math.hypot(x - o.center[0], y - o.center[1]) < radius + o.radius + margin))
            continue;
        generated.push({ id: `random_${seed}_${generated.length + 1}_${data.has('replace') ? 'r' : uid('a').slice(-5)}`, type: 'circle', center: [Math.round(x), Math.round(y)], radius: Math.round(radius) });
    }
    scene.obstacles = data.has('replace') ? generated : [...scene.obstacles, ...generated];
    commit(scene, `随机生成障碍物，种子${seed}`);
    $('#random-dialog').close();
    toast(generated.length === count ? `已生成${count}个障碍物，随机种子${seed}。` : `可用空间或数量受限，已生成${generated.length}/${count}个障碍物。`, generated.length === count ? 'success' : 'info');
}
function fieldChange(event) {
    const input = event.target;
    if (input.dataset.pathVisibility) {
        setPathVisibility(input.dataset.pathVisibility, input.checked);
    }
    else if (input.dataset.edit) {
        if (input.type === 'number' && !input.checkValidity()) {
            input.reportValidity();
            return;
        }
        const path = input.dataset.edit;
        let value = input.type === 'number' ? Number(input.value) * Number(input.dataset.scale || 1) : input.value;
        if (input.type === 'number' && !Number.isFinite(value))
            return;
        if (input.type === 'text')
            value = value.trim() || '未命名';
        mutate(s => {
            set(s, path, value);
            if (path.startsWith('sampling.'))
                s.sampling.preset = 'custom';
        }, '修改任务参数');
    }
    else if (input.dataset.enable)
        mutate(s => {
            s.aircraft.find(a => a.id === input.dataset.enable).enabled = input.checked;
        }, '调整参与规划的无人机');
    else if (input.dataset.override) {
        const k = input.dataset.override;
        mutate(s => {
            const a = s.aircraft.find(a => a.id === state.selectedId);
            a.overrides ||= {};
            if (input.checked)
                a.overrides[k] = s.defaults[k];
            else
                delete a.overrides[k];
        }, '调整逐机性能覆盖');
    }
    else if (input.id === 'aircraft-count') {
        if (!input.checkValidity()) {
            input.reportValidity();
            return;
        }
        const count = Number(input.value), s = copy(state.scene);
        if (count < s.aircraft.length)
            s.aircraft = s.aircraft.slice(0, count);
        while (s.aircraft.length < count)
            s.aircraft.push(newAircraft(s));
        commit(s, '调整无人机数量');
    }
    else if (input.id === 'preset-select') {
        const preset = state.presets.find(p => p.id === input.value);
        if (preset) {
            try {
                const scene = copy(preset.scene);
                validate(scene);
                commit(scene, `载入预置场景：${preset.name}`);
                map.fit();
                view3d?.fit();
                toast(preset.description || `已载入${preset.name}。`);
            }
            catch (e) {
                toast(e.message, 'error');
            }
        }
    }
}
function action(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled)
        return;
    if (button.hasAttribute('data-select'))
        select(button.dataset.select);
    else if (button.dataset.panel) {
        state.panel = button.dataset.panel;
        renderConfiguration();
    }
    else if (button.dataset.view)
        setView(button.dataset.view);
    else if (button.dataset.tool || button.dataset.setTool)
        setTool(button.dataset.tool || button.dataset.setTool);
    else if (button.dataset.sampling) {
        const presets = { fine: { sample_step: 60, max_arc_angle_deg: 3 }, standard: { sample_step: 150, max_arc_angle_deg: 7.5 }, sparse: { sample_step: 400, max_arc_angle_deg: 12 } };
        mutate(s => {
            s.sampling = { preset: button.dataset.sampling, ...presets[button.dataset.sampling] };
        }, '调整航点采样密度');
    }
    else if (button.hasAttribute('data-remove-vertex'))
        mutate(s => {
            s.obstacles.find(o => o.id === state.selectedId).vertices.splice(Number(button.dataset.removeVertex), 1);
        }, '删除多边形顶点');
    else if (button.dataset.export)
        exportResult(button.dataset.export);
    else if (button.hasAttribute('data-close-dialog'))
        button.closest('dialog').close();
    else if (button.dataset.action) {
        const actions = {
            'add-aircraft': addAircraft, 'delete-selection': deleteSelection, 'duplicate-selection': duplicateSelection, 'random-obstacles': () => $('#random-dialog').showModal(), 'clear-obstacles': () => mutate(s => {
                s.obstacles = [];
            }, '清空障碍物'), 'reset-overrides': () => mutate(s => {
                s.aircraft.find(a => a.id === state.selectedId).overrides = {};
            }, '恢复统一飞行性能'), 'add-vertex': () => mutate(s => {
                const v = s.obstacles.find(o => o.id === state.selectedId).vertices;
                if (v.length >= 100) {
                    toast('多边形最多100个顶点。');
                    return;
                }
                const a = v[0], b = v.at(-1);
                v.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
            }, '添加多边形顶点')
        };
        actions[button.dataset.action]?.();
    }
}
document.addEventListener('click', action);
$('#configuration-body').addEventListener('change', fieldChange);
$('#inspector-body').addEventListener('change', fieldChange);
$('#result-rows').addEventListener('change', fieldChange);
$('#scene-name').addEventListener('change', e => {
    if (state.scene)
        mutate(s => {
            s.name = e.target.value.trim() || '未命名场景';
        }, '修改场景名称');
});
$('#plan-button').addEventListener('click', plan);
$('#cancel-plan').addEventListener('click', cancelJob);
$('#undo-button').addEventListener('click', undo);
$('#redo-button').addEventListener('click', redo);
$('#clear-selection').addEventListener('click', () => select(null));
$('#zoom-in').addEventListener('click', () => map.zoom(1.4));
$('#zoom-out').addEventListener('click', () => map.zoom(1 / 1.4));
$('#fit-view').addEventListener('click', () => state.view === '3d' ? view3d?.fit() : state.view === 'altitude' ? drawAltitude() : map.fit());
$('#capture-button').addEventListener('click', capture);
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#retry-connection').addEventListener('click', initialize);
$('#view-settings-button').addEventListener('click', () => {
    const hidden = $('#view-settings').hidden;
    $('#view-settings').hidden = !hidden;
    $('#view-settings-button').setAttribute('aria-expanded', String(hidden));
});
$('#view-settings').addEventListener('change', e => {
    if (e.target.dataset.pathVisibility) {
        setPathVisibility(e.target.dataset.pathVisibility, e.target.checked);
        return;
    }
    const k = e.target.dataset.display;
    if (k) {
        state.display[k] = e.target.checked;
        updateViews();
    }
});
$('#show-all-paths').addEventListener('click', () => {
    state.hiddenAircraftIds.clear();
    renderPathVisibility();
    updateViews();
});
$('#hide-all-paths').addEventListener('click', () => {
    for (const a of pathVisibilityAircraft()) state.hiddenAircraftIds.add(a.id);
    renderPathVisibility();
    updateViews();
});
$('#map-pane').addEventListener('toolchange', e => setTool(e.detail));
$('#export-scene').addEventListener('click', exportScene);
$('#export-results').addEventListener('click', () => {
    $('#export-description').textContent = stale() ? '当前结果对应旧场景快照；导出保留计算时的场景和轨迹。' : '导出当前结果对应的场景快照及各机轨迹。';
    $('#export-dialog').showModal();
});
$('#import-scene').addEventListener('click', () => $('#scene-file').click());
$('#scene-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file)
        return;
    try {
        const scene = JSON.parse(await file.text());
        validate(scene);
        if (state.scene)
            commit(scene, '导入场景JSON');
        else {
            state.scene = scene;
            $('#scene-name').disabled = false;
            render();
        }
        map.fit();
        view3d?.fit();
        toast('场景已导入，坐标与逐机配置已恢复。', 'success');
    }
    catch (error) {
        toast(`场景导入失败：${error.message}`, 'error');
    }
    e.target.value = '';
});
$('#random-form').addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.reportValidity())
        randomObstacles(e.target);
});
$('#play-button').addEventListener('click', togglePlayback);
$('#reset-playback').addEventListener('click', () => {
    pause();
    setTime(0);
});
$('#time-slider').addEventListener('input', e => {
    pause();
    setTime(Number(e.target.value));
});
$('#toggle-results').addEventListener('click', () => {
    $('#results-dock').classList.toggle('collapsed');
    $('#toggle-results').setAttribute('aria-label', $('#results-dock').classList.contains('collapsed') ? '展开结果面板' : '收起结果面板');
    requestAnimationFrame(() => {
        map.resize();
        view3d?.resize();
        drawAltitude();
    });
});
$('#altitude-canvas').addEventListener('click', e => {
    const canvas = e.currentTarget, g = canvas.chartGeometry;
    if (!g)
        return;
    const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top, s = (x - g.bounds.left) / g.bounds.width * g.maxDistance;
    let nearest = null;
    for (const a of g.aircraft) {
        const t = a.trajectory;
        let l = 0, u = t.length - 1;
        while (u - l > 1) {
            const m = (l + u) >> 1;
            if (t[m].s < s)
                l = m;
            else
                u = m;
        }
        const start = t[l], end = t[u], f = Math.max(0, Math.min(1, (s - start.s) / Math.max(1e-9, end.s - start.s))), gap = Math.abs(g.y(start.alt + (end.alt - start.alt) * f) - y);
        if (!nearest || gap < nearest.gap)
            nearest = { id: a.id, gap };
    }
    if (nearest?.gap < 24)
        select(nearest.id);
});
window.addEventListener('keydown', e => {
    if (e.target.closest('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable)
        return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        plan();
    }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
    }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (state.scene)
            deleteSelection();
    }
    else if (!e.ctrlKey && !e.metaKey) {
        const tools = {
            v: 'select', h: 'pan', c: 'circle', r: 'rectangle', p: 'polygon'
        };
        if (tools[e.key.toLowerCase()] && state.scene)
            setTool(tools[e.key.toLowerCase()]);
        if (e.key === 'Escape')
            setTool('select');
    }
});
window.addEventListener('resize', () => {
    if (state.view === 'altitude')
        drawAltitude();
});
document.addEventListener('click', e => {
    if (!e.target.closest('#view-settings,#view-settings-button')) {
        $('#view-settings').hidden = true;
        $('#view-settings-button').setAttribute('aria-expanded', 'false');
    }
});
for (const dialog of $$('dialog'))
    dialog.addEventListener('click', e => {
        if (e.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
                dialog.close();
        }
    });
initialize();
