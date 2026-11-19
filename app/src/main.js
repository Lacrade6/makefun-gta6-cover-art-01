// Vice Coast Cover Studio — editor wiring.
// Loads photos, lets the user pick a layout, grade and title style, crop and
// position each panel, and export the cover as PNG in the common post sizes.
import {
  LAYOUTS, GRADES, TITLE_STYLES, SIZES,
  findLayout, findGrade, findTitleStyle, findSize,
  renderCover, defaultState,
} from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const statusEl = $('status');

const SAMPLE_PHOTOS = ['./samples/boulevard.jpg', './samples/pier.jpg'];

let photos = []; // { img, name }
let state = defaultState(0);
let sizeId = 'square';
let selectedPanel = 0;
let dragging = false;
let dragStart = null;
let lastPanelRects = [];

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + url));
    img.src = url;
  });
}

function currentSize() {
  return findSize(sizeId);
}

function previewResolution() {
  const s = currentSize();
  const maxSide = 1080;
  const scale = Math.min(1, maxSide / Math.max(s.w, s.h));
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function redraw() {
  const res = previewResolution();
  if (canvas.width !== res.w || canvas.height !== res.h) {
    canvas.width = res.w;
    canvas.height = res.h;
  }
  lastPanelRects = renderCover(ctx, res.w, res.h, { ...state, photos: photos.map((p) => p.img) });
  highlightSelected();
}

function highlightSelected() {
  const p = lastPanelRects[selectedPanel];
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = '#ffe259';
  ctx.lineWidth = Math.max(3, canvas.width * 0.004);
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
  ctx.restore();
}

function refreshFilmstrip() {
  const strip = $('filmstrip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = p.name + ' — click to put it in the selected panel';
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      state.panels[selectedPanel].zoom = 1.08;
      state.panels[selectedPanel].ox = 0;
      state.panels[selectedPanel].oy = 0;
      setStatus(`Panel ${selectedPanel + 1} now uses ${p.name}.`);
      redraw();
    });
    strip.appendChild(btn);
  });
}

function refreshLayoutPicker() {
  const wrap = $('layouts');
  wrap.innerHTML = '';
  const res = previewResolution();
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-btn' + (layout.id === state.layoutId ? ' active' : '');
    btn.title = layout.name;
    const mini = document.createElement('canvas');
    mini.width = 132;
    mini.height = Math.max(60, Math.round(132 * (res.h / res.w)));
    const mctx = mini.getContext('2d');
    const miniState = {
      ...state,
      layoutId: layout.id,
      photos: photos.map((p) => p.img),
      title: '',
      subtitle: '',
      showTitle: false,
    };
    renderCover(mctx, mini.width, mini.height, miniState);
    btn.appendChild(mini);
    const label = document.createElement('span');
    label.textContent = layout.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.layoutId = layout.id;
      selectedPanel = 0;
      setStatus(`Layout: ${layout.name}.`);
      refreshLayoutPicker();
      redraw();
    });
    wrap.appendChild(btn);
  }
}

function refreshGradePicker() {
  const wrap = $('grades');
  wrap.innerHTML = '';
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn' + (grade.id === state.gradeId ? ' active' : '');
    btn.title = grade.name;
    const chip = document.createElement('span');
    chip.className = 'grade-chip';
    const grad = grade.stops.map(([s, c]) => `${c} ${Math.round(s * 100)}%`).join(', ');
    chip.style.background = `linear-gradient(135deg, ${grad})`;
    btn.appendChild(chip);
    const label = document.createElement('span');
    label.textContent = grade.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.gradeId = grade.id;
      setStatus(`Grade: ${grade.name}.`);
      refreshGradePicker();
      redraw();
    });
    wrap.appendChild(btn);
  }
}

function refreshTitlePicker() {
  const wrap = $('titles');
  wrap.innerHTML = '';
  for (const t of TITLE_STYLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'title-btn' + (t.id === state.titleId ? ' active' : '');
    btn.textContent = t.name;
    btn.addEventListener('click', () => {
      state.titleId = t.id;
      setStatus(`Title style: ${t.name}.`);
      refreshTitlePicker();
      redraw();
    });
    wrap.appendChild(btn);
  }
}

function refreshSizes() {
  const wrap = $('sizes');
  wrap.innerHTML = '';
  for (const s of SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size-btn' + (s.id === sizeId ? ' active' : '');
    btn.textContent = s.name;
    btn.addEventListener('click', () => {
      sizeId = s.id;
      setStatus(`Export size: ${s.name}.`);
      refreshSizes();
      refreshLayoutPicker();
      redraw();
    });
    wrap.appendChild(btn);
  }
}

function refreshPanelControls() {
  const slot = state.panels[selectedPanel] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
  $('panel-label').textContent = `Panel ${selectedPanel + 1} of ${lastPanelRects.length}`;
  $('zoom').value = String(Math.round((slot.zoom || 1) * 100));
  $('zoom-val').textContent = `${Math.round((slot.zoom || 1) * 100)}%`;
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function pickPanel(pt) {
  for (let i = lastPanelRects.length - 1; i >= 0; i--) {
    const p = lastPanelRects[i];
    if (pt.x >= p.x && pt.x <= p.x + p.w && pt.y >= p.y && pt.y <= p.y + p.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const hit = pickPanel(pt);
  if (hit >= 0) {
    selectedPanel = hit;
    dragging = true;
    dragStart = pt;
    canvas.setPointerCapture(e.pointerId);
    refreshPanelControls();
    redraw();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging || !dragStart) return;
  const pt = canvasPoint(e);
  const p = lastPanelRects[selectedPanel];
  if (!p) return;
  const slot = state.panels[selectedPanel];
  slot.ox = (slot.ox || 0) + (pt.x - dragStart.x) / p.w;
  slot.oy = (slot.oy || 0) + (pt.y - dragStart.y) / p.h;
  slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox));
  slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy));
  dragStart = pt;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragging = false;
  dragStart = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[selectedPanel];
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  slot.zoom = Math.max(1, Math.min(3, (slot.zoom || 1) * factor));
  refreshPanelControls();
  redraw();
}, { passive: false });

$('zoom').addEventListener('input', (e) => {
  const slot = state.panels[selectedPanel];
  slot.zoom = Number(e.target.value) / 100;
  $('zoom-val').textContent = `${e.target.value}%`;
  redraw();
});
$('center-photo').addEventListener('click', () => {
  const slot = state.panels[selectedPanel];
  slot.ox = 0;
  slot.oy = 0;
  slot.zoom = 1.08;
  refreshPanelControls();
  redraw();
});
$('next-photo').addEventListener('click', () => {
  if (!photos.length) return;
  const slot = state.panels[selectedPanel];
  slot.photo = ((slot.photo ?? -1) + 1) % photos.length;
  slot.zoom = 1.08;
  slot.ox = 0;
  slot.oy = 0;
  setStatus(`Panel ${selectedPanel + 1} now uses ${photos[slot.photo].name}.`);
  redraw();
});

async function addFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      photos.push({ img, name: file.name });
      added++;
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  if (added) {
    state = defaultState(photos.length);
    selectedPanel = 0;
    refreshFilmstrip();
    refreshLayoutPicker();
    refreshPanelControls();
    redraw();
    setStatus(`${added} photo${added > 1 ? 's' : ''} loaded — drag a panel photo to crop it, scroll to zoom.`);
  }
}

$('photo').addEventListener('change', (e) => addFiles([...e.target.files]));
$('dropzone').addEventListener('click', () => $('photo').click());
$('dropzone').addEventListener('dragover', (e) => e.preventDefault());
$('dropzone').addEventListener('drop', (e) => {
  e.preventDefault();
  addFiles([...e.dataTransfer.files]);
});

$('caption').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
$('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

$('randomize').addEventListener('click', () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layoutId = pick(LAYOUTS).id;
  state.gradeId = pick(GRADES).id;
  state.titleId = pick(TITLE_STYLES).id;
  selectedPanel = 0;
  refreshLayoutPicker();
  refreshGradePicker();
  refreshTitlePicker();
  refreshPanelControls();
  redraw();
  setStatus(`Random look: ${findLayout(state.layoutId).name} · ${findGrade(state.gradeId).name} · ${findTitleStyle(state.titleId).name}.`);
});

const beforeAfter = $('before-after');
beforeAfter.addEventListener('pointerdown', () => {
  state.showGrade = false;
  state.showTitle = false;
  redraw();
});
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
  beforeAfter.addEventListener(ev, () => {
    state.showGrade = true;
    state.showTitle = true;
    redraw();
  });
}

/** Renders the cover at an export size and downloads it as a PNG. */
function exportSize(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const octx = off.getContext('2d');
  renderCover(octx, size.w, size.h, { ...state, photos: photos.map((p) => p.img) });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setStatus(`Saved vice-coast-cover-${size.w}x${size.h}.png`);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

$('export-one').addEventListener('click', () => exportSize(currentSize()));
$('export-all').addEventListener('click', () => {
  SIZES.forEach((s, i) => setTimeout(() => exportSize(s), i * 450));
  setStatus('Exporting all 3 sizes…');
});

async function loadSamples() {
  for (const url of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(url);
      photos.push({ img, name: url.split('/').pop() });
    } catch {
      // A missing sample just means fewer demo photos.
    }
  }
  state = defaultState(photos.length);
  refreshFilmstrip();
  refreshLayoutPicker();
  refreshGradePicker();
  refreshTitlePicker();
  refreshSizes();
  refreshPanelControls();
  redraw();
}

function loadEditor() {
  refreshFilmstrip();
  refreshLayoutPicker();
  refreshGradePicker();
  refreshTitlePicker();
  refreshSizes();
  refreshPanelControls();
  redraw();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, {
    loadImage,
    setState: (s) => { state = s; },
    photos,
    canvas,
    loadEditor,
  });
} else {
  loadSamples();
}
