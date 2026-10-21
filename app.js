'use strict';
(() => {
  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (v) => Math.round(v * 100) / 100;
  const fmt = (p) => `${rnd(p[0])} ${rnd(p[1])}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const vlen = (a) => Math.hypot(a[0], a[1]);
  const norm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l]; };
  const key = (p) => p[0] + ',' + p[1];

  const STORAGE_KEY = 'metro:map';
  const UI_KEY = 'metro:ui';

  const DIRS = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
  const DIR_ANGLE = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

  // Google fonts and the weights each one offers.
  const FONTS = {
    'Open Sans': [400, 500, 600, 700, 800],
    'Inter': [400, 500, 600, 700, 800, 900],
    'Roboto': [400, 500, 700, 900],
    'Roboto Condensed': [400, 500, 600, 700, 800],
    'Montserrat': [400, 500, 600, 700, 800, 900],
    'Source Sans 3': [400, 500, 600, 700, 800, 900],
    'IBM Plex Sans': [400, 500, 600, 700],
    'DM Sans': [400, 500, 600, 700, 800],
    'Work Sans': [400, 500, 600, 700, 800],
    'Noto Sans': [400, 500, 600, 700, 800],
    'Lato': [400, 700, 900],
    'Poppins': [400, 500, 600, 700, 800],
    'Barlow': [400, 500, 600, 700, 800],
    'Barlow Condensed': [400, 500, 600, 700, 800],
    'Fira Sans': [400, 500, 600, 700, 800],
    'Manrope': [400, 500, 600, 700, 800],
    'Space Grotesk': [400, 500, 600, 700],
    'Oswald': [400, 500, 600, 700],
    'Overpass': [400, 500, 600, 700, 800],
    'Rubik': [400, 500, 600, 700, 800],
    'Atkinson Hyperlegible': [400, 700],
    'PT Sans': [400, 700],
    'Ubuntu': [400, 500, 700],
    'Josefin Sans': [400, 500, 600, 700],
    'Merriweather Sans': [400, 500, 600, 700, 800],
    'JetBrains Mono': [400, 500, 600, 700, 800],
  };
  const SYSTEM_FONTS = {
    'Helvetica / Arial': "'Helvetica Neue', Helvetica, Arial, sans-serif",
    'System UI': "system-ui, -apple-system, 'Segoe UI', sans-serif",
    'Georgia (serif)': 'Georgia, serif',
  };
  const WEIGHT_NAMES = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };

  const PALETTE = ['#F8C300', '#12A14B', '#00A3E0', '#FF7A00', '#A1237F', '#E8112D', '#1F5FAD', '#2ECC9A', '#8E9A9A', '#6BE38A', '#8B5A2B', '#111111'];

  const PRESETS = {
    light: { label: 'Light', background: '#ffffff', labelColor: '#141414', stationFill: '#ffffff', stationStroke: '#141414' },
    dark: { label: 'Dark', background: '#111317', labelColor: '#eef0f4', stationFill: '#ffffff', stationStroke: '#111317' },
    paper: { label: 'Paper', background: '#f5efe3', labelColor: '#2a251f', stationFill: '#fffdf7', stationStroke: '#2a251f' },
    slate: { label: 'Slate', background: '#e8ecf1', labelColor: '#1d2633', stationFill: '#ffffff', stationStroke: '#1d2633' },
    blueprint: { label: 'Blueprint', background: '#0d2b4e', labelColor: '#dbe8f7', stationFill: '#0d2b4e', stationStroke: '#dbe8f7' },
    night: { label: 'Night', background: '#05070a', labelColor: '#ffffff', stationFill: '#05070a', stationStroke: '#ffffff' },
  };

  const DEFAULT_STYLE = {
    preset: 'light',
    ...strip(PRESETS.light),
    font: 'Open Sans',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0,
    labelPad: 5,
    uppercase: false,
    labelHalo: false,
    cornerRadius: 1,
    lineGap: 2,
    stationScale: 1,
    interchangeScale: 1,
    outlineWidth: 2.5,
    gridSize: 40,
    showGrid: true,
    allowDiagonals: true,
  };
  const DEFAULT_LEGEND = { show: true, title: 'Lines', showTitle: true, x: 0, y: 0, scale: 1, border: true, onlyUsed: false };
  const LINE_STYLES = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted', hollow: 'Hollow', transfer: 'Transfer link' };

  function strip(p) { const { label, ...rest } = p; return rest; }

  // ---------------------------------------------------------------------------
  // Document model
  // ---------------------------------------------------------------------------
  function makeLine(i, extra = {}) {
    return { id: uid(), name: `Line ${i + 1}`, color: PALETTE[i % PALETTE.length], width: 8, style: 'solid', legend: true, ...extra };
  }

  function blankDoc() {
    return {
      app: 'metro', version: 1, name: 'Untitled map',
      style: { ...DEFAULT_STYLE },
      lines: [makeLine(0), makeLine(1)],
      stations: [], connections: [],
      legend: { ...DEFAULT_LEGEND, x: 2 * 40, y: 2 * 40 },
    };
  }

  function normalizeDoc(d) {
    if (!d || typeof d !== 'object') throw new Error('Not a map file');
    const out = {
      app: 'metro', version: 1,
      name: typeof d.name === 'string' ? d.name : 'Untitled map',
      style: { ...DEFAULT_STYLE, ...(d.style || {}) },
      legend: { ...DEFAULT_LEGEND, ...(d.legend || {}) },
      lines: Array.isArray(d.lines) ? d.lines.map((l, i) => ({ ...makeLine(i), ...l })) : [],
      stations: Array.isArray(d.stations) ? d.stations.map((s) => ({ name: '', labelDir: 'E', type: 'auto', ...s, x: Math.round(+s.x || 0), y: Math.round(+s.y || 0) })) : [],
      connections: [],
    };
    const sIds = new Set(out.stations.map((s) => s.id));
    const lIds = new Set(out.lines.map((l) => l.id));
    if (Array.isArray(d.connections)) {
      out.connections = d.connections.filter((c) => sIds.has(c.from) && sIds.has(c.to) && lIds.has(c.lineId) && Array.isArray(c.path) && c.path.length >= 2)
        .map((c) => ({ ...c, path: c.path.map((p) => [Math.round(p[0]), Math.round(p[1])]) }));
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let doc = null;
  const ui = {
    view: { x: -60, y: -60, scale: 1 },
    activeLineId: null,
    sel: null, // { type: 'conn', id }
    editStation: null,
    drawing: null, // { from, path, lineId, replaceId }
    hover: null,
    drag: null,
    space: false,
    layout: null,
    theme: null,
    tab: 'lines',
  };
  const history = { undo: [], redo: [] };

  const svg = $('#canvas');
  const content = $('#content');
  const overlay = $('#overlay');

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------
  let saveTimer = null;
  function scheduleSave() {
    $('#saveState').textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
  }
  function saveNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      $('#saveState').textContent = 'Saved in this browser';
    } catch (e) {
      $('#saveState').textContent = 'Could not save locally';
    }
  }
  function saveUI() {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({ theme: ui.theme, view: ui.view, activeLineId: ui.activeLineId, tab: ui.tab }));
    } catch (e) { /* ignore */ }
  }
  function loadInitial() {
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(UI_KEY) || '{}'); } catch (e) { /* ignore */ }
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (stored) {
      try { doc = normalizeDoc(JSON.parse(stored)); } catch (e) { doc = null; }
    }
    const firstVisit = !doc;
    if (!doc) doc = demoDoc();
    ui.theme = prefs.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (prefs.view && !firstVisit) ui.view = prefs.view;
    ui.activeLineId = prefs.activeLineId;
    ui.tab = prefs.tab || 'lines';
    return firstVisit;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const slug = () => (doc.name || 'map').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'map';

  function saveFile() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${slug()}.metro.json`);
    toast('Map file downloaded');
  }
  function openFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = normalizeDoc(JSON.parse(reader.result));
        commit();
        replaceDoc(d);
        fitView();
        toast(`Opened “${doc.name}”`);
      } catch (e) {
        toast('That file is not a valid map');
      }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------
  function commit() {
    history.undo.push(JSON.stringify(doc));
    if (history.undo.length > 200) history.undo.shift();
    history.redo = [];
    updateUndoButtons();
  }
  function undo() {
    if (!history.undo.length) return;
    history.redo.push(JSON.stringify(doc));
    replaceDoc(JSON.parse(history.undo.pop()));
  }
  function redo() {
    if (!history.redo.length) return;
    history.undo.push(JSON.stringify(doc));
    replaceDoc(JSON.parse(history.redo.pop()));
  }
  function updateUndoButtons() {
    $('#btnUndo').disabled = !history.undo.length;
    $('#btnRedo').disabled = !history.redo.length;
  }
  function replaceDoc(d) {
    doc = d;
    ui.drawing = null;
    if (ui.sel && !doc.connections.some((c) => c.id === ui.sel.id)) ui.sel = null;
    if (ui.editStation && !stationById(ui.editStation)) closeStationPop();
    updateUndoButtons();
    loadMapFont();
    renderAllPanels();
    changed();
  }

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------
  const stationById = (id) => doc.stations.find((s) => s.id === id);
  const lineById = (id) => doc.lines.find((l) => l.id === id);
  const connById = (id) => doc.connections.find((c) => c.id === id);
  const stationAt = (g) => doc.stations.find((s) => s.x === g[0] && s.y === g[1]);
  function activeLine() {
    let l = lineById(ui.activeLineId);
    if (!l && doc.lines.length) { l = doc.lines[0]; ui.activeLineId = l.id; }
    return l;
  }
  function fontStack(name = doc.style.font) {
    return SYSTEM_FONTS[name] || `'${name}', sans-serif`;
  }
  function fontWeights(name = doc.style.font) {
    return FONTS[name] || [400, 500, 600, 700, 800];
  }

  // ---------------------------------------------------------------------------
  // Grid routing
  // ---------------------------------------------------------------------------
  // Unit steps from a to b (excluding a). Diagonals first, then straight; or an L when diagonals are off.
  function route(a, b, diag) {
    const out = [];
    let x = a[0], y = a[1];
    let guard = 0;
    while ((x !== b[0] || y !== b[1]) && guard++ < 10000) {
      const dx = Math.sign(b[0] - x), dy = Math.sign(b[1] - y);
      if (dx && dy) {
        if (diag) { x += dx; y += dy; }
        else if (Math.abs(b[0] - x) >= Math.abs(b[1] - y)) x += dx;
        else y += dy;
      } else { x += dx; y += dy; }
      out.push([x, y]);
    }
    return out;
  }
  // Append a step to a traced path, undoing backtracks and cutting loops.
  function pushStep(path, p) {
    const n = path.length;
    if (n >= 2 && eq(path[n - 2], p)) { path.pop(); return; }
    const i = path.findIndex((q) => eq(q, p));
    if (i >= 0) { path.length = i + 1; return; }
    path.push(p);
  }
  function extendTo(path, target) {
    for (const s of route(path[path.length - 1], target, doc.style.allowDiagonals)) pushStep(path, s);
  }

  // ---------------------------------------------------------------------------
  // Layout: parallel offsets, curved geometry, station markers
  // ---------------------------------------------------------------------------
  function edgeKey(a, b) {
    const before = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
    return before ? [key(a) + '|' + key(b), 1] : [key(b) + '|' + key(a), -1];
  }

  function computeLayout() {
    const s = doc.style;
    const G = s.gridSize, R = s.cornerRadius * G, gap = s.lineGap;
    const lines = new Map(doc.lines.map((l) => [l.id, l]));
    const conns = doc.connections.filter((c) => lines.has(c.lineId) && c.path.length >= 2);
    const edges = new Map();
    const offsets = new Map();
    for (const c of conns) {
      offsets.set(c.id, new Array(c.path.length - 1).fill(0));
      if (lines.get(c.lineId).style === 'transfer') continue;
      for (let k = 0; k < c.path.length - 1; k++) {
        const [ek, sign] = edgeKey(c.path[k], c.path[k + 1]);
        if (!edges.has(ek)) edges.set(ek, []);
        edges.get(ek).push({ c, k, sign });
      }
    }
    for (const list of edges.values()) {
      if (list.length < 2) continue;
      const ws = list.map((e) => lines.get(e.c.lineId).width);
      const total = ws.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
      let acc = -total / 2;
      list.forEach((e, i) => {
        offsets.get(e.c.id)[e.k] = (acc + ws[i] / 2) * e.sign;
        acc += ws[i] + gap;
      });
    }

    const geoms = new Map();
    const ends = new Map(doc.stations.map((st) => [st.id, []]));
    for (const c of conns) {
      const line = lines.get(c.lineId);
      const pts = offsetPolyline(c.path, offsets.get(c.id), G, R);
      const d = roundedPath(pts);
      geoms.set(c.id, { d, pts, line });
      const transfer = line.style === 'transfer';
      ends.get(c.from)?.push({ p: pts[0].p, w: line.width, lineId: line.id, transfer, color: line.color });
      ends.get(c.to)?.push({ p: pts[pts.length - 1].p, w: line.width, lineId: line.id, transfer, color: line.color });
    }
    const visuals = new Map(doc.stations.map((st) => [st.id, stationVisual(st, ends.get(st.id))]));
    return { edges, geoms, visuals, ends };
  }

  function offsetPolyline(path, offs, G, R) {
    const P = path.map((q) => [q[0] * G, q[1] * G]);
    const m = P.length - 1;
    const D = [], N = [];
    for (let k = 0; k < m; k++) {
      const d = norm(sub(P[k + 1], P[k]));
      D.push(d);
      N.push([d[1], -d[0]]);
    }
    const pts = [{ p: add(P[0], mul(N[0], offs[0])) }];
    for (let v = 1; v < m; v++) {
      const a = D[v - 1], b = D[v], o1 = offs[v - 1], o2 = offs[v];
      if (Math.abs(cross(a, b)) < 1e-6 && dot(a, b) > 0) {
        if (Math.abs(o1 - o2) < 0.01) continue;
        const j = G * 0.3;
        pts.push({ p: add(add(P[v], mul(a, -j)), mul(N[v - 1], o1)), r: R });
        pts.push({ p: add(add(P[v], mul(a, j)), mul(N[v], o2)), r: R });
      } else {
        const q1 = add(P[v], mul(N[v - 1], o1));
        const q2 = add(P[v], mul(N[v], o2));
        const t = cross(sub(q2, q1), b) / cross(a, b);
        const o = (o1 + o2) / 2;
        // Concentric corners: lines on the outside of a bend get a larger radius.
        const r = Math.max(0.5, cross(a, b) > 0 ? R + o : R - o);
        pts.push({ p: add(q1, mul(a, t)), r });
      }
    }
    pts.push({ p: add(P[m], mul(N[m - 1], offs[m - 1])) });
    return pts;
  }

  function roundedPath(pts) {
    if (pts.length < 2) return '';
    const n = pts.length;
    let d = `M${fmt(pts[0].p)}`;
    for (let i = 1; i < n - 1; i++) {
      const A = pts[i - 1].p, V = pts[i].p, B = pts[i + 1].p;
      const va = sub(V, A), vb = sub(B, V);
      const la = vlen(va), lb = vlen(vb);
      if (la < 1e-6 || lb < 1e-6) continue;
      const a = mul(va, 1 / la), b = mul(vb, 1 / lb);
      const th = Math.acos(clamp(dot(a, b), -1, 1));
      if (th < 1e-3) { d += ` L${fmt(V)}`; continue; }
      const tan = Math.tan(th / 2);
      let r = pts[i].r || 0;
      let t = r * tan;
      const maxT = Math.min(i === 1 ? la : la / 2, i === n - 2 ? lb : lb / 2);
      if (t > maxT) { t = maxT; r = t / tan; }
      if (t < 0.01) { d += ` L${fmt(V)}`; continue; }
      d += ` L${fmt(sub(V, mul(a, t)))} A${rnd(r)} ${rnd(r)} 0 0 ${cross(a, b) > 0 ? 1 : 0} ${fmt(add(V, mul(b, t)))}`;
    }
    return d + ` L${fmt(pts[n - 1].p)}`;
  }

  function stationVisual(st, ends = []) {
    const s = doc.style, G = s.gridSize;
    const real = ends.filter((e) => !e.transfer);
    const hasTransfer = real.length < ends.length;
    const lineIds = new Set(real.map((e) => e.lineId));
    const maxW = real.length ? Math.max(...real.map((e) => e.w)) : 8;
    let kind = st.type || 'auto';
    if (kind === 'auto') {
      if (lineIds.size >= 2 || hasTransfer || !real.length) kind = 'interchange';
      else if (real.length === 1) kind = 'terminus';
      else kind = 'stop';
    }
    if (kind === 'terminus' && lineIds.size > 1) kind = 'interchange';
    let a = [st.x * G, st.y * G], b = a;
    const pts = real.map((e) => e.p);
    if (pts.length) {
      const cx = pts.reduce((t, p) => t + p[0], 0) / pts.length;
      const cy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
      a = b = [cx, cy];
      let best = 0.75;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dd = vlen(sub(pts[i], pts[j]));
          if (dd > best) { best = dd; a = pts[i]; b = pts[j]; }
        }
      }
    }
    const ow = s.outlineWidth;
    const r = kind === 'stop'
      ? Math.max(1.6, maxW * 0.3) * s.stationScale
      : (maxW * 0.5 + 2.5) * s.interchangeScale;
    const color = kind === 'terminus' ? (real[0]?.color || s.stationStroke) : s.stationStroke;
    return { kind, a, b, r, ow, maxW, color, center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
  }

  // ---------------------------------------------------------------------------
  // SVG generation (shared by the editor and export)
  // ---------------------------------------------------------------------------
  function strokeSVG(d, line, extra = '') {
    const s = doc.style, w = line.width;
    const base = `d="${d}" fill="none" stroke-linejoin="round"`;
    switch (line.style) {
      case 'dashed':
        return `<path ${base} stroke="${line.color}" stroke-width="${w}" stroke-dasharray="${rnd(w * 1.6)} ${rnd(w * 1.1)}" ${extra}/>`;
      case 'dotted':
        return `<path ${base} stroke="${line.color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="0 ${rnd(w * 1.75)}" ${extra}/>`;
      case 'hollow':
        return `<path ${base} stroke="${line.color}" stroke-width="${w}" stroke-linecap="round" ${extra}/><path ${base} stroke="${s.background}" stroke-width="${rnd(w * 0.45)}" stroke-linecap="round"/>`;
      default:
        return `<path ${base} stroke="${line.color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
    }
  }
  function capsule(a, b, r, fill) {
    if (eq(a, b)) return `<circle cx="${rnd(a[0])}" cy="${rnd(a[1])}" r="${rnd(r)}" fill="${fill}"/>`;
    return `<line x1="${rnd(a[0])}" y1="${rnd(a[1])}" x2="${rnd(b[0])}" y2="${rnd(b[1])}" stroke="${fill}" stroke-width="${rnd(r * 2)}" stroke-linecap="round"/>`;
  }

  function mapSVG(layout, editor) {
    const s = doc.style;
    const linesOut = [], hits = [], outlines = [], fills = [], dots = [], labels = [];
    for (const c of doc.connections) {
      const g = layout.geoms.get(c.id);
      if (!g) continue;
      if (g.line.style === 'transfer') {
        outlines.push(`<path d="${g.d}" fill="none" stroke="${s.stationStroke}" stroke-width="${rnd(g.line.width + s.outlineWidth * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
        fills.push(`<path d="${g.d}" fill="none" stroke="${s.stationFill}" stroke-width="${g.line.width}" stroke-linecap="round" stroke-linejoin="round"/>`);
      } else {
        linesOut.push(strokeSVG(g.d, g.line));
      }
      if (editor) hits.push(`<path class="hit" data-conn="${c.id}" d="${g.d}" fill="none" stroke="transparent" stroke-width="${Math.max(g.line.width + 6, 14)}"/>`);
    }
    for (const st of doc.stations) {
      const v = layout.visuals.get(st.id);
      if (v.kind === 'hidden') {
        if (editor) dots.push(`<circle cx="${st.x * s.gridSize}" cy="${st.y * s.gridSize}" r="3.5" fill="none" stroke="${s.labelColor}" stroke-opacity=".45" stroke-dasharray="2 2"/>`);
        continue;
      }
      if (v.kind === 'stop') {
        dots.push(capsule(v.a, v.b, v.r, s.stationFill));
      } else {
        outlines.push(capsule(v.a, v.b, v.r + v.ow, v.color));
        fills.push(capsule(v.a, v.b, v.r, s.stationFill));
      }
      labels.push(labelSVG(st, v));
    }
    return `<g class="lines">${linesOut.join('')}</g>`
      + (editor ? `<g class="hits">${hits.join('')}</g>` : '')
      + `<g class="stations">${outlines.join('')}${fills.join('')}${dots.join('')}</g>`
      + `<g class="labels">${labels.join('')}</g>`
      + legendSVG(editor);
  }

  function textAttrs(size, weight = doc.style.fontWeight) {
    const s = doc.style;
    const halo = s.labelHalo ? ` stroke="${s.background}" stroke-width="${rnd(size * 0.3)}" stroke-linejoin="round" paint-order="stroke"` : '';
    return `font-family="${fontStack()}" font-size="${rnd(size)}" font-weight="${weight}" letter-spacing="${s.letterSpacing}" fill="${s.labelColor}"${halo}`;
  }

  function labelSVG(st, v) {
    const s = doc.style;
    if (!st.name || !st.name.trim() || st.labelDir === 'none') return '';
    const dv = DIRS[st.labelDir] || DIRS.E;
    const u = norm(dv);
    const c = v.center;
    let ext = Math.max(dot(sub(v.a, c), u), dot(sub(v.b, c), u)) + v.r + (v.kind === 'stop' ? 0 : v.ow);
    if (v.kind === 'stop') ext = Math.max(ext, v.maxW / 2);
    const dist = ext + s.labelPad;
    const ax = c[0] + u[0] * dist, ay = c[1] + u[1] * dist;
    const anchor = dv[0] > 0 ? 'start' : dv[0] < 0 ? 'end' : 'middle';
    const text = s.uppercase ? st.name.toUpperCase() : st.name;
    const rows = text.split('\n');
    const fs = s.fontSize, lh = fs * 1.2;
    let y0;
    if (dv[1] < 0) y0 = ay - fs * 0.22 - (rows.length - 1) * lh;
    else if (dv[1] > 0) y0 = ay + fs * 0.76;
    else y0 = ay - ((rows.length - 1) * lh) / 2 + fs * 0.36;
    const spans = rows.map((t, i) => `<tspan x="${rnd(ax)}" y="${rnd(y0 + i * lh)}">${esc(t)}</tspan>`).join('');
    return `<text text-anchor="${anchor}" ${textAttrs(fs)}>${spans}</text>`;
  }

  const measureCtx = document.createElement('canvas').getContext('2d');
  function measure(text, size, weight) {
    measureCtx.font = `${weight} ${size}px ${fontStack()}`;
    return measureCtx.measureText(text).width + Math.max(0, text.length - 1) * doc.style.letterSpacing;
  }

  function legendSVG(editor) {
    const L = doc.legend, s = doc.style;
    if (!L.show) return '';
    const used = new Set(doc.connections.map((c) => c.lineId));
    const lines = doc.lines.filter((l) => l.legend !== false && (!L.onlyUsed || used.has(l.id)));
    const showTitle = L.showTitle && L.title.trim();
    if (!lines.length && !showTitle) return '';
    const k = L.scale;
    const fs = s.fontSize * 1.1 * k, tfs = s.fontSize * 1.4 * k;
    const pad = 14 * k, rowH = Math.max(fs * 2, 20 * k), sw = 34 * k, tx = pad + sw + 10 * k;
    const cased = (t) => (s.uppercase ? t.toUpperCase() : t);
    const titleW = showTitle ? measure(cased(L.title), tfs, s.fontWeight) : 0;
    const nameW = Math.max(0, ...lines.map((l) => measure(cased(l.name), fs, s.fontWeight)));
    const w = Math.max(pad * 2 + titleW, tx + nameW + pad, 120 * k);
    const titleBlock = showTitle ? tfs * 1.7 : 0;
    const h = pad * 2 + titleBlock + rowH * lines.length - (lines.length ? 0 : pad * 0.6);
    let out = `<rect width="${rnd(w)}" height="${rnd(h)}" rx="${rnd(8 * k)}" fill="${s.background}"${L.border ? ` stroke="${s.labelColor}" stroke-opacity=".22" stroke-width="1.25"` : ''}/>`;
    if (showTitle) out += `<text x="${rnd(pad)}" y="${rnd(pad + tfs * 0.9)}" ${textAttrs(tfs)}>${esc(cased(L.title))}</text>`;
    lines.forEach((l, i) => {
      const cy = pad + titleBlock + rowH * (i + 0.5);
      const d = `M${rnd(pad + Math.min(l.width, 12) / 2)} ${rnd(cy)} L${rnd(pad + sw - Math.min(l.width, 12) / 2)} ${rnd(cy)}`;
      if (l.style === 'transfer') {
        out += `<path d="${d}" stroke="${s.stationStroke}" stroke-width="${rnd(l.width + s.outlineWidth * 2)}" stroke-linecap="round"/><path d="${d}" stroke="${s.stationFill}" stroke-width="${l.width}" stroke-linecap="round"/>`;
      } else {
        out += strokeSVG(d, { ...l, width: Math.min(l.width, 12) });
      }
      out += `<text x="${rnd(tx)}" y="${rnd(cy + fs * 0.36)}" ${textAttrs(fs)}>${esc(cased(l.name))}</text>`;
    });
    return `<g transform="translate(${rnd(L.x)} ${rnd(L.y)})"${editor ? ' data-legend="1"' : ''}>${out}</g>`;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function luminance(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    if (!m) return 1;
    const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function renderGrid() {
    const s = doc.style, G = s.gridSize;
    const minor = $('#gridMinor'), major = $('#gridMajor');
    minor.setAttribute('width', G); minor.setAttribute('height', G);
    minor.firstElementChild.setAttribute('d', `M${G} 0H0V${G}`);
    major.setAttribute('width', G * 5); major.setAttribute('height', G * 5);
    major.firstElementChild.setAttribute('width', G * 5); major.firstElementChild.setAttribute('height', G * 5);
    major.lastElementChild.setAttribute('d', `M${G * 5} 0H0V${G * 5}`);
    const dark = luminance(s.background) < 0.45;
    minor.firstElementChild.setAttribute('stroke', dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.065)');
    major.lastElementChild.setAttribute('stroke', dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.13)');
    $('#gridRect').style.display = s.showGrid ? '' : 'none';
    $('#mapBg').setAttribute('fill', s.background);
  }

  function render() {
    ui.layout = computeLayout();
    renderGrid();
    content.innerHTML = mapSVG(ui.layout, true);
    renderOverlay();
    renderInspector();
    renderHint();
    $('#stats').textContent = `${doc.stations.length} stations · ${doc.connections.length} links`;
  }

  function changed() {
    scheduleSave();
    render();
  }

  function renderOverlay() {
    const s = doc.style, G = s.gridSize;
    let out = '';
    const sc = ui.view.scale;
    if (ui.sel?.type === 'conn') {
      const g = ui.layout.geoms.get(ui.sel.id);
      if (g) {
        out += `<path d="${g.d}" fill="none" style="stroke:var(--accent)" stroke-opacity=".35" stroke-width="${g.line.width + 10}" stroke-linecap="round" stroke-linejoin="round"/>`;
        out += `<path d="${g.d}" fill="none" style="stroke:var(--accent)" stroke-width="${1.5 / sc}" stroke-dasharray="${4 / sc} ${3 / sc}"/>`;
      }
    }
    if (ui.editStation) {
      const st = stationById(ui.editStation);
      const v = st && ui.layout.visuals.get(st.id);
      if (v) {
        const half = vlen(sub(v.a, v.b)) / 2;
        out += `<circle cx="${rnd(v.center[0])}" cy="${rnd(v.center[1])}" r="${rnd(half + v.r + v.ow + 6)}" fill="none" style="stroke:var(--accent)" stroke-width="${2 / sc}"/>`;
      }
    }
    if (ui.drawing) {
      const line = lineById(ui.drawing.lineId);
      const path = ui.drawing.path;
      if (line && path.length >= 2) {
        const pts = offsetPolyline(path, new Array(path.length - 1).fill(0), G, s.cornerRadius * G);
        out += `<g opacity=".8">${strokeSVG(roundedPath(pts), line.style === 'transfer' ? { ...line, style: 'solid', color: s.stationStroke } : line)}</g>`;
      }
      for (const p of path) out += `<circle cx="${p[0] * G}" cy="${p[1] * G}" r="${2.2 / sc}" style="fill:var(--accent)"/>`;
      const end = path[path.length - 1];
      out += `<circle cx="${end[0] * G}" cy="${end[1] * G}" r="${7 / sc}" fill="none" style="stroke:var(--accent)" stroke-width="${2 / sc}"/>`;
    } else if (ui.hover && !ui.drag) {
      const h = ui.hover;
      out += `<circle cx="${h[0] * G}" cy="${h[1] * G}" r="${4 / sc}" fill="none" style="stroke:var(--accent)" stroke-width="${1.5 / sc}" opacity=".8"/>`;
    }
    overlay.innerHTML = out;
  }

  function renderHint() {
    const el = $('#hint');
    if (ui.drawing) {
      const l = lineById(ui.drawing.lineId);
      el.innerHTML = `<span class="dot" style="background:${l?.color}"></span><b>${esc(l?.name)}</b> · trace along the grid · <b>click</b> a station to finish (<b>⇧</b> to continue) · <b>right-click</b> to drop a station · <b>⌫</b> step back · <b>Esc</b> cancel`;
    } else if (!doc.stations.length) {
      el.innerHTML = '<b>Right-click</b> anywhere on the grid to add your first station';
    } else {
      el.innerHTML = '<b>Right-click</b> add / edit station · <b>Click</b> a station to draw a connection · <b>Drag</b> to move · <b>Scroll</b> to zoom';
    }
  }

  // ---------------------------------------------------------------------------
  // View
  // ---------------------------------------------------------------------------
  function applyView() {
    const v = ui.view;
    const w = svg.clientWidth || 1, h = svg.clientHeight || 1;
    svg.setAttribute('viewBox', `${rnd(v.x)} ${rnd(v.y)} ${rnd(w / v.scale)} ${rnd(h / v.scale)}`);
    $('#zoomLabel').textContent = Math.round(v.scale * 100) + '%';
    const sw = rnd(1 / v.scale);
    $('#gridMinor').firstElementChild.setAttribute('stroke-width', sw);
    $('#gridMajor').lastElementChild.setAttribute('stroke-width', sw);
  }
  function toWorld(e) {
    const r = svg.getBoundingClientRect();
    return [ui.view.x + (e.clientX - r.left) / ui.view.scale, ui.view.y + (e.clientY - r.top) / ui.view.scale];
  }
  function toScreen(p) {
    const r = svg.getBoundingClientRect();
    return [r.left + (p[0] - ui.view.x) * ui.view.scale, r.top + (p[1] - ui.view.y) * ui.view.scale];
  }
  function zoomAt(factor, sx, sy) {
    const v = ui.view;
    const r = svg.getBoundingClientRect();
    if (sx == null) { sx = r.width / 2; sy = r.height / 2; }
    const wx = v.x + sx / v.scale, wy = v.y + sy / v.scale;
    v.scale = clamp(v.scale * factor, 0.15, 6);
    v.x = wx - sx / v.scale;
    v.y = wy - sy / v.scale;
    applyView();
    renderOverlay();
    saveUI();
  }
  function fitView() {
    const bb = content.getBBox();
    const w = svg.clientWidth, h = svg.clientHeight;
    if (!bb.width || !bb.height) {
      ui.view = { x: -60, y: -60, scale: 1 };
    } else {
      const pad = 60;
      const scale = clamp(Math.min((w - pad * 2) / bb.width, (h - pad * 2) / bb.height), 0.15, 2.5);
      ui.view = { scale, x: bb.x + bb.width / 2 - w / 2 / scale, y: bb.y + bb.height / 2 - h / 2 / scale };
    }
    applyView();
    renderOverlay();
    saveUI();
  }

  // ---------------------------------------------------------------------------
  // Editing operations
  // ---------------------------------------------------------------------------
  function snap(w) {
    const G = doc.style.gridSize;
    return [Math.round(w[0] / G), Math.round(w[1] / G)];
  }
  function snapStrict(w) {
    const G = doc.style.gridSize;
    const g = snap(w);
    return vlen(sub(w, mul(g, G))) <= G * 0.42 ? g : null;
  }
  function stationAtPoint(w) {
    const g = snapStrict(w);
    const st = g && stationAt(g);
    if (st) return st;
    // Large interchange capsules can extend beyond the snap radius.
    for (const s of doc.stations) {
      const v = ui.layout?.visuals.get(s.id);
      if (!v || v.kind === 'stop' || v.kind === 'hidden') continue;
      if (distToSeg(w, v.a, v.b) <= v.r + v.ow) return s;
    }
    return null;
  }
  function distToSeg(p, a, b) {
    const ab = sub(b, a);
    const l2 = dot(ab, ab);
    const t = l2 ? clamp(dot(sub(p, a), ab) / l2, 0, 1) : 0;
    return vlen(sub(p, add(a, mul(ab, t))));
  }

  function createStation(g) {
    const n = doc.stations.length + 1;
    const st = { id: uid(), x: g[0], y: g[1], name: `Station ${n}`, labelDir: 'E', type: 'auto' };
    doc.stations.push(st);
    return st;
  }

  function deleteStation(id) {
    const attached = doc.connections.filter((c) => c.from === id || c.to === id);
    const byLine = new Map();
    for (const c of attached) {
      if (!byLine.has(c.lineId)) byLine.set(c.lineId, []);
      byLine.get(c.lineId).push(c);
    }
    const merged = new Set();
    // Where exactly two links of one line meet here, join them into a single link.
    for (const group of byLine.values()) {
      if (group.length !== 2) continue;
      const [c1, c2] = group;
      const other1 = c1.from === id ? c1.to : c1.from;
      const other2 = c2.from === id ? c2.to : c2.from;
      if (other1 === other2 || other1 === id || other2 === id) continue;
      const p1 = c1.to === id ? c1.path.slice() : c1.path.slice().reverse();
      const p2 = c2.from === id ? c2.path.slice() : c2.path.slice().reverse();
      const path = [p1[0]];
      for (const p of [...p1.slice(1), ...p2.slice(1)]) pushStep(path, p);
      if (path.length < 2) continue;
      Object.assign(c1, { from: other1, to: other2, path });
      merged.add(c1.id);
    }
    doc.connections = doc.connections.filter((c) => merged.has(c.id) || (c.from !== id && c.to !== id));
    doc.stations = doc.stations.filter((s) => s.id !== id);
    if (ui.sel && !connById(ui.sel.id)) ui.sel = null;
  }

  function moveStation(st, g) {
    const other = stationAt(g);
    if (other && other !== st) return false;
    if (st.x === g[0] && st.y === g[1]) return false;
    const adjust = (path) => {
      path.pop();
      extendTo(path, g);
    };
    for (const c of doc.connections) {
      if (c.from === st.id) { c.path.reverse(); adjust(c.path); c.path.reverse(); }
      if (c.to === st.id) adjust(c.path);
    }
    st.x = g[0];
    st.y = g[1];
    return true;
  }

  function startDrawing(stationId, opts = {}) {
    const st = stationById(stationId);
    const line = opts.lineId ? lineById(opts.lineId) : activeLine();
    if (!st) return;
    if (!line) { toast('Add a line first'); switchTab('lines'); return; }
    ui.sel = opts.replaceId ? { type: 'conn', id: opts.replaceId } : null;
    ui.drawing = { from: st.id, path: [[st.x, st.y]], lineId: line.id, replaceId: opts.replaceId || null };
    svg.classList.add('drawing');
    renderOverlay();
    renderInspector();
    renderHint();
  }
  function cancelDrawing() {
    ui.drawing = null;
    svg.classList.remove('drawing');
    renderOverlay();
    renderInspector();
    renderHint();
  }
  function finishDrawing(st, chain, skipCommit) {
    const dr = ui.drawing;
    const path = dr.path.slice();
    extendTo(path, [st.x, st.y]);
    if (!eq(path[path.length - 1], [st.x, st.y]) || path.length < 2 || st.id === dr.from) { cancelDrawing(); return; }
    if (!skipCommit) commit();
    if (dr.replaceId && connById(dr.replaceId)) {
      Object.assign(connById(dr.replaceId), { path, to: st.id, from: dr.from });
    } else {
      doc.connections.push({ id: uid(), lineId: dr.lineId, from: dr.from, to: st.id, path });
    }
    ui.drawing = null;
    svg.classList.remove('drawing');
    renderLines();
    changed();
    if (chain) startDrawing(st.id, { lineId: dr.lineId });
  }

  // Connections that share at least one grid edge with `c`.
  function bundleInfo(c) {
    const shared = new Set();
    let pos = 0, size = 1;
    for (let k = 0; k < c.path.length - 1; k++) {
      const list = ui.layout.edges.get(edgeKey(c.path[k], c.path[k + 1])[0]);
      if (!list) continue;
      list.forEach((e) => { if (e.c.id !== c.id) shared.add(e.c.id); });
      if (list.length > size) { size = list.length; pos = list.findIndex((e) => e.c.id === c.id); }
    }
    return { shared, pos, size };
  }
  function shiftInBundle(c, dir) {
    const { shared } = bundleInfo(c);
    const arr = doc.connections;
    const i = arr.indexOf(c);
    let j = i + dir;
    while (j >= 0 && j < arr.length && !shared.has(arr[j].id)) j += dir;
    if (j < 0 || j >= arr.length) return;
    commit();
    arr.splice(i, 1);
    arr.splice(j, 0, c);
    changed();
  }

  // ---------------------------------------------------------------------------
  // Pointer interaction
  // ---------------------------------------------------------------------------
  svg.addEventListener('pointerdown', (e) => {
    if (!$('#stationPop').hidden) closeStationPop();
    const w = toWorld(e);
    if (e.button === 1 || (e.button === 0 && ui.space)) {
      e.preventDefault();
      startPan(e);
      return;
    }
    if (e.button !== 0) return;
    if (ui.drawing) {
      const st = stationAtPoint(w);
      if (st && st.id !== ui.drawing.from) finishDrawing(st, e.shiftKey);
      else if (st && st.id === ui.drawing.from && ui.drawing.path.length === 1) cancelDrawing();
      return;
    }
    const leg = e.target.closest?.('[data-legend]');
    if (leg) {
      ui.drag = { type: 'legend', start: [e.clientX, e.clientY], origin: [doc.legend.x, doc.legend.y], committed: false };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    const st = stationAtPoint(w);
    if (st) {
      ui.drag = { type: 'station', id: st.id, start: [e.clientX, e.clientY], moved: false };
      svg.setPointerCapture(e.pointerId);
      return;
    }
    const hit = e.target.closest?.('[data-conn]');
    if (hit) {
      ui.sel = { type: 'conn', id: hit.dataset.conn };
      const c = connById(ui.sel.id);
      if (c) { ui.activeLineId = c.lineId; renderLines(); }
      renderOverlay();
      renderInspector();
      return;
    }
    startPan(e, true);
  });

  function startPan(e, deselectOnClick = false) {
    ui.drag = { type: 'pan', start: [e.clientX, e.clientY], origin: [ui.view.x, ui.view.y], moved: false, deselectOnClick };
    svg.classList.add('panning');
    svg.setPointerCapture(e.pointerId);
  }

  svg.addEventListener('pointermove', (e) => {
    const w = toWorld(e);
    const d = ui.drag;
    if (d) {
      const dx = e.clientX - d.start[0], dy = e.clientY - d.start[1];
      if (Math.hypot(dx, dy) > 4) d.moved = true;
      if (d.type === 'pan') {
        ui.view.x = d.origin[0] - dx / ui.view.scale;
        ui.view.y = d.origin[1] - dy / ui.view.scale;
        applyView();
        return;
      }
      if (d.type === 'legend') {
        if (!d.committed) { commit(); d.committed = true; }
        const G = doc.style.gridSize / 2;
        doc.legend.x = Math.round((d.origin[0] + dx / ui.view.scale) / G) * G;
        doc.legend.y = Math.round((d.origin[1] + dy / ui.view.scale) / G) * G;
        changed();
        return;
      }
      if (d.type === 'station' && d.moved) {
        const st = stationById(d.id);
        const g = snap(w);
        if (!d.committedMove) { commit(); d.committedMove = true; svg.classList.add('moving'); }
        if (st && moveStation(st, g)) changed();
        return;
      }
      return;
    }
    const prevHover = ui.hover;
    ui.hover = snap(w);
    if (ui.drawing) {
      const g = snapStrict(w);
      const path = ui.drawing.path;
      if (g && !eq(g, path[path.length - 1])) {
        extendTo(path, g);
        renderOverlay();
      }
      return;
    }
    svg.classList.toggle('on-station', !!stationAtPoint(w));
    if (!prevHover || !eq(prevHover, ui.hover)) renderOverlay();
  });

  svg.addEventListener('pointerup', (e) => {
    const d = ui.drag;
    ui.drag = null;
    svg.classList.remove('panning', 'moving');
    if (!d) return;
    if (d.type === 'pan') {
      if (!d.moved && d.deselectOnClick && ui.sel) { ui.sel = null; renderOverlay(); renderInspector(); }
      saveUI();
    } else if (d.type === 'station' && !d.moved) {
      startDrawing(d.id);
    }
  });
  svg.addEventListener('pointerleave', () => {
    if (!ui.drag && !ui.drawing) { ui.hover = null; renderOverlay(); }
  });

  svg.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const w = toWorld(e);
    const g = snap(w);
    let st = stationAtPoint(w) || stationAt(g);
    if (ui.drawing) {
      if (st && st.id === ui.drawing.from) { cancelDrawing(); return; }
      commit();
      const isNew = !st;
      if (!st) st = createStation(g);
      finishDrawing(st, false, true);
      if (isNew) openStationPop(st, true);
      return;
    }
    if (st) {
      openStationPop(st, false);
    } else {
      commit();
      st = createStation(g);
      changed();
      openStationPop(st, true);
    }
  });

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const k = e.ctrlKey ? 0.01 : 0.0015;
    zoomAt(Math.exp(-e.deltaY * k), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  $('#stage').addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------
  const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveFile(); return; }
    if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); $('#fileInput').click(); return; }
    if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); openExport(); return; }
    if (e.key === 'Escape') {
      if (!$('#stationPop').hidden) { closeStationPop(); return; }
      if (typing(document.activeElement)) { document.activeElement.blur(); return; }
      if (ui.drawing) { cancelDrawing(); return; }
      if (ui.sel) { ui.sel = null; renderOverlay(); renderInspector(); }
      return;
    }
    if (typing(document.activeElement) || document.querySelector('dialog[open]')) return;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod) return;
    if (e.key === ' ') { ui.space = true; e.preventDefault(); return; }
    if (e.key === 'Backspace' && ui.drawing) {
      e.preventDefault();
      if (ui.drawing.path.length > 1) { ui.drawing.path.pop(); renderOverlay(); } else cancelDrawing();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ui.sel?.type === 'conn') {
      e.preventDefault();
      commit();
      doc.connections = doc.connections.filter((c) => c.id !== ui.sel.id);
      ui.sel = null;
      renderLines();
      changed();
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const l = doc.lines[+e.key - 1];
      if (l) { setActiveLine(l.id); if (ui.drawing) { ui.drawing.lineId = l.id; renderOverlay(); renderHint(); } }
      return;
    }
    if (e.key === 'f' || e.key === 'F') fitView();
    if (e.key === '+' || e.key === '=') zoomAt(1.2);
    if (e.key === '-') zoomAt(1 / 1.2);
    if (e.key === '?') $('#helpDialog').showModal();
  });
  document.addEventListener('keyup', (e) => { if (e.key === ' ') ui.space = false; });

  // ---------------------------------------------------------------------------
  // Live-binding helper: one undo step per interaction
  // ---------------------------------------------------------------------------
  function live(el, event, apply) {
    let pending = false;
    el.addEventListener(event, (e) => {
      if (!pending) { commit(); pending = true; }
      apply(e);
      changed();
      if (event === 'change') pending = false;
    });
    el.addEventListener('change', () => { pending = false; });
    el.addEventListener('blur', () => { pending = false; });
  }

  // ---------------------------------------------------------------------------
  // Station popover
  // ---------------------------------------------------------------------------
  const pop = $('#stationPop');
  const dirGrid = $('#stDir');
  ['NW', 'N', 'NE', 'W', 'none', 'E', 'SW', 'S', 'SE'].forEach((dname) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.dir = dname;
    b.title = dname === 'none' ? 'Hide label' : `Label ${dname}`;
    b.innerHTML = dname === 'none'
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M7 17 17 7"/></svg>'
      : `<svg viewBox="0 0 24 24"><g transform="rotate(${DIR_ANGLE[dname]} 12 12)"><path d="M12 19V5M6 11l6-6 6 6"/></g></svg>`;
    dirGrid.appendChild(b);
  });

  function openStationPop(st, isNew) {
    ui.editStation = st.id;
    if (ui.sel) { ui.sel = null; renderInspector(); }
    $('#stName').value = st.name;
    $('#stType').value = st.type || 'auto';
    syncDirButtons(st);
    const lineIds = [...new Set(doc.connections.filter((c) => c.from === st.id || c.to === st.id).map((c) => c.lineId))];
    $('#stLines').innerHTML = lineIds.length
      ? lineIds.map((id) => lineById(id)).filter(Boolean).map((l) => `<span class="chip"><i style="background:${l.color}"></i>${esc(l.name)}</span>`).join('')
      : '<span class="muted small">None yet</span>';
    pop.hidden = false;
    positionPop(st);
    autosize($('#stName'));
    renderOverlay();
    const input = $('#stName');
    input.focus();
    if (isNew) input.select();
  }
  function positionPop(st) {
    const G = doc.style.gridSize;
    const [sx, sy] = toScreen([st.x * G, st.y * G]);
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = sx + 28, y = sy - 40;
    if (x + pw > innerWidth - 12) x = sx - pw - 28;
    x = clamp(x, 12, innerWidth - pw - 12);
    y = clamp(y, 64, innerHeight - ph - 12);
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
  }
  function closeStationPop() {
    pop.hidden = true;
    ui.editStation = null;
    if (document.activeElement && pop.contains(document.activeElement)) document.activeElement.blur();
    renderOverlay();
  }
  function syncDirButtons(st) {
    $$('button', dirGrid).forEach((b) => b.classList.toggle('active', b.dataset.dir === (st.labelDir || 'E')));
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; }

  live($('#stName'), 'input', (e) => {
    const st = stationById(ui.editStation);
    if (st) st.name = e.target.value;
    autosize(e.target);
  });
  $('#stName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); closeStationPop(); }
  });
  live($('#stType'), 'change', (e) => {
    const st = stationById(ui.editStation);
    if (st) st.type = e.target.value;
  });
  dirGrid.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    const st = stationById(ui.editStation);
    if (!b || !st) return;
    commit();
    st.labelDir = b.dataset.dir;
    syncDirButtons(st);
    changed();
  });
  $('#stDelete').addEventListener('click', () => {
    const id = ui.editStation;
    if (!id) return;
    commit();
    deleteStation(id);
    closeStationPop();
    renderLines();
    changed();
  });
  $$('[data-close]', pop).forEach((b) => b.addEventListener('click', closeStationPop));

  // ---------------------------------------------------------------------------
  // Connection inspector
  // ---------------------------------------------------------------------------
  function renderInspector() {
    const el = $('#inspector');
    const c = ui.sel?.type === 'conn' && connById(ui.sel.id);
    if (!c || ui.drawing) { el.hidden = true; return; }
    const a = stationById(c.from), b = stationById(c.to);
    const { pos, size, shared } = bundleInfo(c);
    const idx = doc.connections.indexOf(c);
    const canPrev = doc.connections.slice(0, idx).some((x) => shared.has(x.id));
    const canNext = doc.connections.slice(idx + 1).some((x) => shared.has(x.id));
    el.hidden = false;
    el.innerHTML = `
      <div class="head"><strong>Connection</strong>
        <button class="icon-btn small" id="inClose" title="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="route"><span>${esc(a?.name || '—')}</span><span class="arrow">→</span><span>${esc(b?.name || '—')}</span></div>
      <label class="field"><span>Line</span>
        <select id="inLine">${doc.lines.map((l) => `<option value="${l.id}" ${l.id === c.lineId ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
      <div class="field"><span>Order in shared corridor</span>
        <div class="btn-row">
          <button class="btn small" id="inPrev" ${canPrev ? '' : 'disabled'}>◀ Shift</button>
          <button class="btn small" id="inNext" ${canNext ? '' : 'disabled'}>Shift ▶</button>
        </div>
        <span class="bundle-pos">${size > 1 ? `Track ${pos + 1} of ${size} where it runs alongside other links` : 'Not sharing a corridor with any other link'}</span>
      </div>
      <div class="btn-row">
        <button class="btn small" id="inRetrace" title="Trace a new path for this connection">Re-trace</button>
        <button class="btn small" id="inReverse" title="Swap start and end">Reverse</button>
        <button class="btn small danger" id="inDelete">Delete</button>
      </div>`;
    $('#inClose').onclick = () => { ui.sel = null; renderOverlay(); renderInspector(); };
    $('#inLine').onchange = (e) => { commit(); c.lineId = e.target.value; ui.activeLineId = c.lineId; renderLines(); changed(); };
    $('#inPrev').onclick = () => shiftInBundle(c, -1);
    $('#inNext').onclick = () => shiftInBundle(c, 1);
    $('#inRetrace').onclick = () => startDrawing(c.from, { replaceId: c.id, lineId: c.lineId });
    $('#inReverse').onclick = () => { commit(); [c.from, c.to] = [c.to, c.from]; c.path.reverse(); changed(); };
    $('#inDelete').onclick = () => {
      commit();
      doc.connections = doc.connections.filter((x) => x.id !== c.id);
      ui.sel = null;
      renderLines();
      changed();
    };
  }

  // ---------------------------------------------------------------------------
  // Sidebar: lines
  // ---------------------------------------------------------------------------
  function setActiveLine(id) {
    ui.activeLineId = id;
    renderLines();
    saveUI();
  }

  function renderLines() {
    const list = $('#lineList');
    activeLine();
    if (!doc.lines.length) {
      list.innerHTML = '<div class="empty">No lines yet.<br>Add one to start connecting stations.</div>';
      return;
    }
    const counts = {};
    doc.connections.forEach((c) => { counts[c.lineId] = (counts[c.lineId] || 0) + 1; });
    list.innerHTML = doc.lines.map((l, i) => {
      const active = l.id === ui.activeLineId;
      return `<div class="line-item ${active ? 'active' : ''}" data-id="${l.id}">
        <div class="line-row">
          <span class="line-key">${i < 9 ? i + 1 : ''}</span>
          <label class="swatch" style="background:${l.color}" title="Colour"><input type="color" value="${l.color}" data-f="color"></label>
          <input class="line-name" value="${esc(l.name)}" data-f="name" spellcheck="false" aria-label="Line name">
          <span class="line-count" title="Connections">${counts[l.id] || 0}</span>
        </div>
        ${active ? `<div class="line-details">
          <div class="field"><span>Width</span><div class="range-row"><input type="range" min="1" max="24" step="0.5" value="${l.width}" data-f="width"><output>${l.width}px</output></div></div>
          <div class="field-row">
            <label class="field grow"><span>Style</span><select data-f="style">${Object.entries(LINE_STYLES).map(([k, v]) => `<option value="${k}" ${l.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label class="check"><input type="checkbox" data-f="legend" ${l.legend !== false ? 'checked' : ''}> In legend</label>
          </div>
          <div class="actions">
            <div>
              <button class="icon-btn small" data-act="up" title="Move up" ${i === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button>
              <button class="icon-btn small" data-act="down" title="Move down" ${i === doc.lines.length - 1 ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
              <button class="icon-btn small" data-act="dup" title="Duplicate line"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            </div>
            <button class="btn small ghost danger" data-act="delete">Delete line</button>
          </div>
        </div>` : ''}
      </div>`;
    }).join('');

    $$('.line-item', list).forEach((item) => {
      const l = lineById(item.dataset.id);
      item.addEventListener('pointerdown', (e) => {
        if (l.id === ui.activeLineId) return;
        const field = e.target.closest('[data-f]')?.dataset.f;
        setActiveLine(l.id);
        if (field === 'name') {
          e.preventDefault();
          const inp = $(`.line-item[data-id="${l.id}"] [data-f="name"]`);
          inp.focus();
          inp.select();
        } else if (field === 'color') {
          e.preventDefault();
          $(`.line-item[data-id="${l.id}"] [data-f="color"]`).click();
        }
      });
      $$('[data-f]', item).forEach((inp) => {
        const f = inp.dataset.f;
        const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input';
        live(inp, ev, () => {
          if (f === 'width') { l.width = +inp.value; inp.nextElementSibling.textContent = l.width + 'px'; }
          else if (f === 'legend') l.legend = inp.checked;
          else if (f === 'color') { l.color = inp.value; inp.parentElement.style.background = inp.value; }
          else l[f] = inp.value;
          if (f === 'style') l.legend = inp.value !== 'transfer';
          if (f === 'style') renderLines();
        });
        if (f === 'name') inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
      });
      $$('[data-act]', item).forEach((btn) => btn.addEventListener('click', () => lineAction(l, btn.dataset.act)));
    });
  }

  function lineAction(l, act) {
    const i = doc.lines.indexOf(l);
    if (act === 'delete') {
      const n = doc.connections.filter((c) => c.lineId === l.id).length;
      if (n && !confirm(`Delete “${l.name}” and its ${n} connection${n === 1 ? '' : 's'}?`)) return;
      commit();
      doc.lines.splice(i, 1);
      doc.connections = doc.connections.filter((c) => c.lineId !== l.id);
      if (ui.sel && !connById(ui.sel.id)) ui.sel = null;
      ui.activeLineId = doc.lines[Math.min(i, doc.lines.length - 1)]?.id;
    } else if (act === 'up' || act === 'down') {
      const j = i + (act === 'up' ? -1 : 1);
      if (j < 0 || j >= doc.lines.length) return;
      commit();
      [doc.lines[i], doc.lines[j]] = [doc.lines[j], doc.lines[i]];
    } else if (act === 'dup') {
      commit();
      const copy = { ...l, id: uid(), name: l.name + ' copy' };
      doc.lines.splice(i + 1, 0, copy);
      ui.activeLineId = copy.id;
    }
    renderLines();
    changed();
  }

  $('#btnAddLine').addEventListener('click', () => {
    commit();
    const used = new Set(doc.lines.map((l) => l.color.toLowerCase()));
    const color = PALETTE.find((c) => !used.has(c.toLowerCase())) || PALETTE[doc.lines.length % PALETTE.length];
    const l = makeLine(doc.lines.length, { color });
    doc.lines.push(l);
    ui.activeLineId = l.id;
    renderLines();
    changed();
    const inp = $(`.line-item[data-id="${l.id}"] [data-f="name"]`);
    inp?.focus();
    inp?.select();
  });

  // ---------------------------------------------------------------------------
  // Sidebar: style
  // ---------------------------------------------------------------------------
  const STYLE_SCHEMA = [
    ['group', 'Map theme'],
    ['presets'],
    ['color', 'background', 'Background'],
    ['color', 'labelColor', 'Labels'],
    ['color', 'stationFill', 'Station fill'],
    ['color', 'stationStroke', 'Station outline'],
    ['group', 'Typography'],
    ['font'],
    ['weight'],
    ['range', 'fontSize', 'Label size', 6, 32, 0.5, 'px'],
    ['range', 'letterSpacing', 'Letter spacing', -1, 4, 0.1, 'px'],
    ['range', 'labelPad', 'Label distance', 0, 24, 0.5, 'px'],
    ['toggle', 'uppercase', 'Uppercase labels'],
    ['toggle', 'labelHalo', 'Label halo'],
    ['group', 'Lines'],
    ['range', 'cornerRadius', 'Curve radius', 0, 4, 0.05, '×'],
    ['range', 'lineGap', 'Gap between parallel lines', 0, 12, 0.5, 'px'],
    ['group', 'Stations'],
    ['range', 'stationScale', 'Stop dot size', 0.4, 2.5, 0.05, '×'],
    ['range', 'interchangeScale', 'Interchange size', 0.5, 2.5, 0.05, '×'],
    ['range', 'outlineWidth', 'Outline width', 0.5, 6, 0.25, 'px'],
    ['group', 'Grid'],
    ['range', 'gridSize', 'Grid spacing', 16, 96, 1, 'px'],
    ['toggle', 'showGrid', 'Show grid while editing'],
    ['toggle', 'allowDiagonals', 'Allow 45° diagonals'],
  ];

  function renderStyleForm() {
    const s = doc.style;
    const html = STYLE_SCHEMA.map(([type, k, label, min, max, step, unit]) => {
      switch (type) {
        case 'group': return `<div class="group-title">${k}</div>`;
        case 'presets':
          return `<div class="presets">${Object.entries(PRESETS).map(([id, p]) => `
            <button class="preset ${s.preset === id ? 'active' : ''}" data-preset="${id}">
              <span class="preset-thumb" style="background:${p.background}"><i style="background:#12A14B"></i><b style="background:${p.stationFill};border-color:${p.stationStroke}"></b></span>${p.label}</button>`).join('')}</div>`;
        case 'color':
          return `<div class="color-row"><label for="sf-${k}">${label}</label><span class="color-pick"><code>${s[k]}</code><label class="swatch" style="background:${s[k]}"><input id="sf-${k}" type="color" value="${s[k]}" data-k="${k}"></label></span></div>`;
        case 'font':
          return `<label class="field"><span>Font</span><select data-k="font">
            <optgroup label="Google Fonts">${Object.keys(FONTS).map((f) => `<option ${s.font === f ? 'selected' : ''}>${f}</option>`).join('')}</optgroup>
            <optgroup label="System">${Object.keys(SYSTEM_FONTS).map((f) => `<option ${s.font === f ? 'selected' : ''}>${f}</option>`).join('')}</optgroup>
          </select></label>`;
        case 'weight':
          return `<label class="field"><span>Weight</span><select data-k="fontWeight">${fontWeights().map((w) => `<option value="${w}" ${+s.fontWeight === w ? 'selected' : ''}>${WEIGHT_NAMES[w]} (${w})</option>`).join('')}</select></label>`;
        case 'range':
          return `<div class="field"><span>${label}</span><div class="range-row"><input type="range" min="${min}" max="${max}" step="${step}" value="${s[k]}" data-k="${k}"><output>${s[k]}${unit}</output></div></div>`;
        case 'toggle':
          return `<div class="toggle-row"><span>${label}</span><span class="switch"><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}><span></span></span></div>`;
      }
      return '';
    }).join('');
    const form = $('#styleForm');
    form.innerHTML = `<div class="form-grid">${html}</div>`;

    $$('[data-preset]', form).forEach((b) => b.addEventListener('click', () => {
      commit();
      Object.assign(doc.style, strip(PRESETS[b.dataset.preset]), { preset: b.dataset.preset });
      renderStyleForm();
      changed();
    }));
    $$('[data-k]', form).forEach((inp) => {
      const k = inp.dataset.k;
      const unit = STYLE_SCHEMA.find((r) => r[1] === k)?.[6] || '';
      const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input';
      live(inp, ev, () => {
        if (inp.type === 'checkbox') s[k] = inp.checked;
        else if (inp.type === 'range') { s[k] = +inp.value; inp.nextElementSibling.textContent = inp.value + unit; }
        else if (k === 'fontWeight') s[k] = +inp.value;
        else s[k] = inp.value;
        if (inp.type === 'color') {
          s.preset = 'custom';
          inp.parentElement.style.background = inp.value;
          inp.closest('.color-pick').querySelector('code').textContent = inp.value;
          $$('.preset', form).forEach((p) => p.classList.remove('active'));
        }
        if (k === 'font') {
          const ws = fontWeights();
          if (!ws.includes(+s.fontWeight)) s.fontWeight = ws.reduce((a, b) => (Math.abs(b - 700) < Math.abs(a - 700) ? b : a));
          loadMapFont();
          renderStyleForm();
        }
      });
    });
  }

  let fontLoadToken = 0;
  function googleFontURL(name, weights) {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${weights.join(';')}&display=swap`;
  }
  function loadMapFont() {
    const name = doc.style.font;
    const link = $('#mapFontLink');
    if (!FONTS[name]) return;
    const href = googleFontURL(name, FONTS[name]);
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    const token = ++fontLoadToken;
    document.fonts.load(`${doc.style.fontWeight} 16px '${name}'`).then(() => {
      if (token === fontLoadToken) render();
    }).catch(() => {});
  }
  $('#mapFontLink').addEventListener('load', () => render());

  // ---------------------------------------------------------------------------
  // Sidebar: legend
  // ---------------------------------------------------------------------------
  function renderLegendForm() {
    const L = doc.legend;
    const form = $('#legendForm');
    form.innerHTML = `<div class="form-grid">
      <div class="toggle-row"><strong>Show legend</strong><span class="switch"><input type="checkbox" data-k="show" ${L.show ? 'checked' : ''}><span></span></span></div>
      <label class="field"><span>Title</span><input type="text" data-k="title" value="${esc(L.title)}"></label>
      <div class="toggle-row"><span>Show title</span><span class="switch"><input type="checkbox" data-k="showTitle" ${L.showTitle ? 'checked' : ''}><span></span></span></div>
      <div class="toggle-row"><span>Border</span><span class="switch"><input type="checkbox" data-k="border" ${L.border ? 'checked' : ''}><span></span></span></div>
      <div class="toggle-row"><span>Only lines that are in use</span><span class="switch"><input type="checkbox" data-k="onlyUsed" ${L.onlyUsed ? 'checked' : ''}><span></span></span></div>
      <div class="field"><span>Size</span><div class="range-row"><input type="range" min="0.5" max="3" step="0.05" value="${L.scale}" data-k="scale"><output>${L.scale}×</output></div></div>
      <div class="field"><span>Position</span>
        <div class="segmented full" id="legendPos">
          <button data-pos="tl">↖ Top left</button><button data-pos="tr">Top right ↗</button>
        </div>
        <div class="segmented full" id="legendPos2">
          <button data-pos="bl">↙ Bottom left</button><button data-pos="br">Bottom right ↘</button>
        </div>
        <small class="muted">Or drag the legend on the map. Hide a line from the legend in its settings on the Lines tab.</small>
      </div>
    </div>`;
    $$('[data-k]', form).forEach((inp) => {
      const k = inp.dataset.k;
      live(inp, inp.type === 'checkbox' ? 'change' : 'input', () => {
        if (inp.type === 'checkbox') L[k] = inp.checked;
        else if (inp.type === 'range') { L[k] = +inp.value; inp.nextElementSibling.textContent = inp.value + '×'; }
        else L[k] = inp.value;
      });
    });
    $$('[data-pos]', form).forEach((b) => b.addEventListener('click', () => placeLegend(b.dataset.pos)));
  }

  function placeLegend(pos) {
    const legendEl = content.querySelector('[data-legend]');
    const prevShow = doc.legend.show;
    // Measure the map without the legend.
    doc.legend.show = false;
    render();
    const bb = content.getBBox();
    doc.legend.show = prevShow;
    render();
    const lb = content.querySelector('[data-legend]')?.getBBox() || legendEl?.getBBox();
    if (!lb) return;
    const G = doc.style.gridSize, m = G;
    const x0 = bb.width ? bb.x : 0, y0 = bb.width ? bb.y : 0;
    const x1 = bb.width ? bb.x + bb.width : 0, y1 = bb.width ? bb.y + bb.height : 0;
    commit();
    doc.legend.x = pos.includes('l') ? x0 - lb.width - m : x1 + m;
    doc.legend.y = pos.includes('t') ? y0 : y1 - lb.height;
    doc.legend.x = Math.round(doc.legend.x / (G / 2)) * (G / 2);
    doc.legend.y = Math.round(doc.legend.y / (G / 2)) * (G / 2);
    changed();
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  const exState = { format: 'png', scale: 2 };
  function openExport() {
    if (!doc.stations.length && !doc.legend.show) { toast('Nothing to export yet'); return; }
    if (ui.drawing) cancelDrawing();
    const d = $('#exportDialog');
    updateExportInfo();
    d.showModal();
  }
  function exportBounds() {
    const tmp = document.createElementNS(NS, 'g');
    tmp.setAttribute('opacity', '0');
    tmp.innerHTML = mapSVG(ui.layout, false);
    svg.appendChild(tmp);
    const bb = tmp.getBBox();
    tmp.remove();
    return bb;
  }
  function updateExportInfo() {
    $('#exScaleField').style.display = exState.format === 'svg' ? 'none' : '';
    const bb = exportBounds();
    const pad = +$('#exPad').value || 0;
    const w = Math.round(bb.width + pad * 2), h = Math.round(bb.height + pad * 2);
    $('#exInfo').textContent = exState.format === 'svg'
      ? `Vector image, ${w} × ${h} units, fonts embedded.`
      : `${Math.round(w * exState.scale)} × ${Math.round(h * exState.scale)} pixels.`;
    if (exState.format === 'jpg') $('#exBg').checked = true;
    $('#exBg').disabled = exState.format === 'jpg';
  }
  function segmented(el, onPick) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', el).forEach((x) => x.classList.toggle('active', x === b));
      onPick(b.dataset.v);
    });
  }
  segmented($('#exFormat'), (v) => { exState.format = v; updateExportInfo(); });
  segmented($('#exScale'), (v) => { exState.scale = +v; updateExportInfo(); });
  $('#exPad').addEventListener('input', updateExportInfo);

  const fontCache = {};
  async function toDataURL(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  async function embeddedFontCSS() {
    const name = doc.style.font, w = doc.style.fontWeight;
    if (!FONTS[name]) return '';
    const k = name + w;
    if (fontCache[k]) return fontCache[k];
    try {
      const css = await (await fetch(googleFontURL(name, [w]))).text();
      const blocks = css.match(/\/\*\s*[\w-]+\s*\*\/\s*@font-face\s*\{[^}]*\}/g) || [];
      const keep = blocks.filter((b) => /\/\*\s*(latin|latin-ext)\s*\*\//.test(b));
      let out = '';
      for (const b of (keep.length ? keep : blocks)) {
        const m = b.match(/url\((['"]?)(https:[^)'"]+)\1\)/);
        if (!m) continue;
        const data = await toDataURL(m[2]);
        out += b.replace(/\/\*[^*]*\*\//, '').replace(m[2], data) + '\n';
      }
      fontCache[k] = out;
      return out;
    } catch (e) {
      console.warn('Font embedding failed', e);
      return '';
    }
  }

  async function doExport() {
    const btn = $('#exGo');
    btn.disabled = true;
    btn.textContent = 'Preparing…';
    try {
      const s = doc.style;
      const pad = Math.max(0, +$('#exPad').value || 0);
      const withBg = $('#exBg').checked || exState.format === 'jpg';
      const bb = exportBounds();
      if (!bb.width && !bb.height) { toast('Nothing to export yet'); return; }
      const x = bb.x - pad, y = bb.y - pad, w = bb.width + pad * 2, h = bb.height + pad * 2;
      const css = await embeddedFontCSS();
      const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${rnd(w)}" height="${rnd(h)}" viewBox="${rnd(x)} ${rnd(y)} ${rnd(w)} ${rnd(h)}">`
        + (css ? `<defs><style>${css}</style></defs>` : '')
        + (withBg ? `<rect x="${rnd(x)}" y="${rnd(y)}" width="${rnd(w)}" height="${rnd(h)}" fill="${s.background}"/>` : '')
        + mapSVG(ui.layout, false)
        + '</svg>';
      if (exState.format === 'svg') {
        downloadBlob(new Blob([markup], { type: 'image/svg+xml' }), `${slug()}.svg`);
      } else {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
        await img.decode();
        await new Promise((r) => setTimeout(r, 120));
        const maxDim = 16000;
        const scale = Math.min(exState.scale, maxDim / w, maxDim / h);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (exState.format === 'jpg') { ctx.fillStyle = s.background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const type = exState.format === 'jpg' ? 'image/jpeg' : 'image/png';
        const blob = await new Promise((r) => canvas.toBlob(r, type, 0.95));
        downloadBlob(blob, `${slug()}.${exState.format}`);
      }
      $('#exportDialog').close();
      toast('Image exported');
    } catch (e) {
      console.error(e);
      toast('Export failed — try SVG');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Download';
    }
  }
  $('#exGo').addEventListener('click', doExport);

  // ---------------------------------------------------------------------------
  // Chrome
  // ---------------------------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function applyTheme() {
    document.documentElement.dataset.theme = ui.theme;
  }
  function switchTab(tab) {
    ui.tab = tab;
    $$('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + tab));
    saveUI();
  }
  function renderAllPanels() {
    $('#mapName').value = doc.name;
    renderLines();
    renderStyleForm();
    renderLegendForm();
  }

  $$('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  live($('#mapName'), 'input', (e) => { doc.name = e.target.value; });
  $('#mapName').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
  $('#btnUndo').addEventListener('click', undo);
  $('#btnRedo').addEventListener('click', redo);
  $('#btnSave').addEventListener('click', saveFile);
  $('#btnOpen').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) openFile(f);
    e.target.value = '';
  });
  $('#btnNew').addEventListener('click', () => {
    if (doc.stations.length && !confirm('Start a new map? The current map stays in your undo history, but save it to a file if you want to keep it.')) return;
    commit();
    const style = { ...doc.style };
    const d = blankDoc();
    d.style = style;
    d.legend.x = 2 * style.gridSize;
    d.legend.y = 2 * style.gridSize;
    ui.sel = null;
    replaceDoc(d);
    ui.view = { x: -60, y: -60, scale: 1 };
    applyView();
  });
  $('#btnExport').addEventListener('click', openExport);
  $('#btnHelp').addEventListener('click', () => $('#helpDialog').showModal());
  $('#btnDemo').addEventListener('click', () => {
    commit();
    replaceDoc(demoDoc());
    $('#helpDialog').close();
    fitView();
  });
  $('#btnTheme').addEventListener('click', () => {
    ui.theme = ui.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveUI();
  });
  $('#zoomIn').addEventListener('click', () => zoomAt(1.25));
  $('#zoomOut').addEventListener('click', () => zoomAt(1 / 1.25));
  $('#zoomFit').addEventListener('click', fitView);
  $('#zoomLabel').addEventListener('click', () => zoomAt(1 / ui.view.scale));
  new ResizeObserver(() => applyView()).observe(svg);
  document.fonts.addEventListener?.('loadingdone', () => render());

  // ---------------------------------------------------------------------------
  // Example map
  // ---------------------------------------------------------------------------
  function demoDoc() {
    const d = blankDoc();
    d.name = 'Example: Lakeshore Metro';
    d.lines = [];
    const L = (name, color, width) => { const l = makeLine(d.lines.length, { name, color, width }); d.lines.push(l); return l; };
    const Y = L('Line 1 Yonge–University', '#F8C300', 8);
    const Gr = L('Line 2 Bloor–Danforth', '#12A14B', 8);
    const O = L('Line 5 Eglinton', '#FF7A00', 7);
    const R = L('Lakeshore West', '#E8112D', 5);
    const U = L('UP Express', '#8E9A9A', 6);
    const S = {};
    const st = (k, name, x, y, labelDir = 'E') => { S[k] = { id: uid(), name, x, y, labelDir, type: 'auto' }; d.stations.push(S[k]); };
    st('finch', 'Finch', 16, 1);
    st('sheppard', 'Sheppard–Yonge', 16, 4);
    st('eglinton', 'Eglinton', 16, 7, 'NE');
    st('stclair', 'St Clair', 16, 9);
    st('bloor', 'Bloor–Yonge', 16, 11, 'NE');
    st('queen', 'Queen', 16, 14);
    st('union', 'Union', 14, 16, 'S');
    st('standrew', 'St Andrew', 12, 14, 'W');
    st('spadina', 'Spadina', 12, 11, 'NW');
    st('egw', 'Eglinton\nWest', 12, 7, 'NW');
    st('kipling', 'Kipling', 2, 13, 'W');
    st('islington', 'Islington', 4, 11, 'N');
    st('keele', 'Keele', 7, 11, 'N');
    st('dundasw', 'Dundas\nWest', 9, 11, 'NE');
    st('broadview', 'Broadview', 19, 11, 'N');
    st('main', 'Main Street', 22, 11, 'N');
    st('mtdennis', 'Mount Dennis', 4, 7, 'NE');
    st('caledonia', 'Caledonia', 8, 7, 'N');
    st('laird', 'Laird', 19, 7, 'N');
    st('kennedy', 'Kennedy', 22, 7, 'N');
    st('longbranch', 'Long Branch', 1, 18, 'S');
    st('mimico', 'Mimico', 4, 16, 'S');
    st('exhibition', 'Exhibition', 9, 16, 'S');
    st('danforth', 'Danforth GO', 21, 13, 'E');
    st('pearson', 'Pearson Airport', 2, 2, 'E');
    st('weston', 'Weston', 4, 5, 'W');
    const con = (line, a, b, via = []) => {
      const path = [[S[a].x, S[a].y]];
      for (const t of [...via, [S[b].x, S[b].y]]) for (const p of route(path[path.length - 1], t, true)) pushStep(path, p);
      d.connections.push({ id: uid(), lineId: line.id, from: S[a].id, to: S[b].id, path });
    };
    const chain = (line, keys) => keys.slice(1).forEach((k, i) => con(line, keys[i], k));
    chain(Y, ['finch', 'sheppard', 'eglinton', 'stclair', 'bloor', 'queen', 'union', 'standrew']);
    con(Y, 'standrew', 'spadina');
    con(Y, 'spadina', 'egw');
    chain(Gr, ['kipling', 'islington', 'keele', 'dundasw', 'spadina', 'bloor', 'broadview', 'main']);
    chain(O, ['mtdennis', 'caledonia', 'egw', 'eglinton', 'laird', 'kennedy']);
    chain(R, ['longbranch', 'mimico', 'exhibition', 'union']);
    con(R, 'union', 'danforth', [[18, 16]]);
    chain(U, ['pearson', 'weston', 'mtdennis', 'dundasw']);
    con(U, 'dundasw', 'union', [[9, 15]]);
    d.legend = { ...DEFAULT_LEGEND, x: 25 * 40, y: 1 * 40 };
    return d;
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  const firstVisit = loadInitial();
  applyTheme();
  switchTab(ui.tab);
  renderAllPanels();
  loadMapFont();
  render();
  applyView();
  updateUndoButtons();
  if (firstVisit) {
    const tryFit = () => (svg.clientWidth > 100 ? fitView() : setTimeout(tryFit, 50));
    setTimeout(tryFit, 50);
  }

  // Expose for debugging.
  window.metro = { get doc() { return doc; }, ui, render };
})();
