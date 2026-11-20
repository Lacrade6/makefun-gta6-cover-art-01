// Vice Coast Cover Studio — editor wiring.
// Loads photos from the user's machine (never uploaded), renders the live
// preview, and exports full-size PNG covers in the three post sizes.

import {
  EXPORT_SIZES,
  LAYOUTS,
  GRADES,
  TITLE_STYLES,
  createDefaultState,
  dealPanels,
  clampPanel,
  renderCover,
  renderLayoutThumb,
} from "./cover.js";
import { runShot } from "./shots.js";

const SAMPLE_URLS = ["samples/boulevard.jpg", "samples/pier.jpg"];
const PREVIEW_MAX = 1080;

const state = createDefaultState();
const photos = []; // { img, url, name }
let selectedPanel = 0;
let panelRects = [];
let beforeHeld = false;

const $ = (id) => document.getElementById(id);
const previewCanvas = $("preview");
const statusEl = $("status");

function setStatus(text) {
  statusEl.textContent = text;
}

function photoImages() {
  return photos.map((p) => p.img);
}

// Render the preview at most 1080px on the long side, then draw the
// dashed-yellow selection highlight over the chosen panel.
function renderPreview() {
  const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
  const scale = Math.min(1, PREVIEW_MAX / Math.max(size.width, size.height));
  const view = { ...state, sizeId: state.sizeId };
  if (beforeHeld) { view.showGrade = false; view.showTitle = false; }

  const off = document.createElement("canvas");
  const rects = renderCover(off, view, photoImages());

  const pw = Math.round(size.width * scale);
  const ph = Math.round(size.height * scale);
  if (previewCanvas.width !== pw) previewCanvas.width = pw;
  if (previewCanvas.height !== ph) previewCanvas.height = ph;
  const ctx = previewCanvas.getContext("2d");
  ctx.clearRect(0, 0, pw, ph);
  ctx.drawImage(off, 0, 0, pw, ph);

  panelRects = rects.map((r) => ({
    x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale,
  }));

  const sel = panelRects[selectedPanel];
  if (sel) {
    ctx.save();
    ctx.strokeStyle = "#ffe259";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(sel.x + 2, sel.y + 2, sel.w - 4, sel.h - 4);
    ctx.restore();
  }
  updatePanelControls();
}

function updatePanelControls() {
  const count = panelRects.length || 1;
  if (selectedPanel >= count) selectedPanel = 0;
  $("panel-label").textContent = `Panel ${selectedPanel + 1} of ${count}`;
  const panel = state.panels[selectedPanel];
  if (panel) {
    const pct = Math.round(panel.zoom * 100);
    $("zoom-slider").value = String(pct);
    $("zoom-out").textContent = `${pct}%`;
  }
}

function loadImage(url, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, url, name });
    img.onerror = () => reject(new Error(`Could not load ${name}`));
    img.src = url;
  });
}

function addFilmstripThumb(photo, index) {
  const el = document.createElement("img");
  el.src = photo.url;
  el.alt = photo.name;
  el.title = `Put “${photo.name}” into the selected panel`;
  el.addEventListener("click", () => {
    const panel = state.panels[selectedPanel];
    panel.photoIndex = index;
    panel.zoom = 1.08;
    panel.panX = 0;
    panel.panY = 0;
    renderPreview();
    setStatus(`Panel ${selectedPanel + 1} now shows ${photo.name}.`);
  });
  $("filmstrip").appendChild(el);
}

async function loadSamples() {
  for (const url of SAMPLE_URLS) {
    try {
      const photo = await loadImage(url, url.split("/").pop());
      addFilmstripThumb(photo, photos.length);
      photos.push(photo);
    } catch (err) {
      setStatus(`Sample photo failed to load: ${err.message}`);
    }
  }
  dealPanels(state, photos.length);
  renderPreview();
  refreshLayoutThumbs();
  if (photos.length) setStatus("Sample photos loaded — drop your own photos to make it yours.");
}

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  if (!files.length) { setStatus("No image files found in that drop."); return; }
  let added = 0;
  for (const file of files) {
    try {
      const url = URL.createObjectURL(file);
      const photo = await loadImage(url, file.name);
      addFilmstripThumb(photo, photos.length);
      photos.push(photo);
      added += 1;
    } catch (err) {
      setStatus(`Skipped ${file.name}: ${err.message}`);
    }
  }
  if (added) {
    dealPanels(state, photos.length);
    renderPreview();
    refreshLayoutThumbs();
    setStatus(`Added ${added} photo${added === 1 ? "" : "s"} — panels re-dealt.`);
  }
}

function markActive(container, activeId) {
  container.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.id === activeId);
  });
}

function buildTitleStyles() {
  const row = $("title-styles");
  TITLE_STYLES.forEach((style) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = style.id;
    btn.textContent = style.name;
    btn.addEventListener("click", () => {
      state.titleStyleId = style.id;
      markActive(row, style.id);
      renderPreview();
      setStatus(`Title lettering: ${style.name}.`);
    });
    row.appendChild(btn);
  });
  markActive(row, state.titleStyleId);
}

const thumbCanvases = new Map();

function buildLayoutGrid() {
  const grid = $("layout-grid");
  LAYOUTS.forEach((layout) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layout-btn";
    btn.dataset.id = layout.id;
    const thumb = document.createElement("canvas");
    thumb.width = 96;
    thumb.height = 96;
    thumbCanvases.set(layout.id, thumb);
    const label = document.createElement("span");
    label.textContent = layout.name;
    btn.append(thumb, label);
    btn.addEventListener("click", () => {
      state.layoutId = layout.id;
      selectedPanel = 0;
      markActive(grid, layout.id);
      renderPreview();
      setStatus(`Layout: ${layout.name}.`);
    });
    grid.appendChild(btn);
  });
  markActive(grid, state.layoutId);
}

function refreshLayoutThumbs() {
  thumbCanvases.forEach((canvas, layoutId) => {
    renderLayoutThumb(canvas, layoutId, photoImages(), state.gradeId);
  });
}

function buildGradeList() {
  const list = $("grade-list");
  GRADES.forEach((grade) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grade-btn";
    btn.dataset.id = grade.id;
    const chip = document.createElement("span");
    chip.className = "grade-chip";
    const stops = grade.stops.map(([pos, color]) => `${color} ${Math.round(pos * 100)}%`).join(", ");
    chip.style.background = `linear-gradient(135deg, ${stops})`;
    const label = document.createElement("span");
    label.textContent = grade.name;
    btn.append(chip, label);
    btn.addEventListener("click", () => {
      state.gradeId = grade.id;
      markActive(list, grade.id);
      renderPreview();
      refreshLayoutThumbs();
      setStatus(`Colour grade: ${grade.name}.`);
    });
    list.appendChild(btn);
  });
  markActive(list, state.gradeId);
}

function buildSizeRow() {
  const row = $("size-row");
  EXPORT_SIZES.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = size.id;
    btn.textContent = `${size.name} ${size.width}×${size.height}`;
    btn.addEventListener("click", () => {
      state.sizeId = size.id;
      markActive(row, size.id);
      renderPreview();
      setStatus(`Export size: ${size.name} (${size.width}×${size.height}).`);
    });
    row.appendChild(btn);
  });
  markActive(row, state.sizeId);
}

function exportPNG(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const off = document.createElement("canvas");
  renderCover(off, { ...state, sizeId: size.id }, photoImages());
  off.toBlob((blob) => {
    if (!blob) { setStatus("Export failed — the browser returned no image."); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vice-coast-cover-${size.width}x${size.height}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setStatus(`Exported vice-coast-cover-${size.width}x${size.height}.png`);
  }, "image/png");
}

function randomLook() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layoutId = pick(LAYOUTS).id;
  state.gradeId = pick(GRADES).id;
  state.titleStyleId = pick(TITLE_STYLES).id;
  selectedPanel = 0;
  markActive($("layout-grid"), state.layoutId);
  markActive($("grade-list"), state.gradeId);
  markActive($("title-styles"), state.titleStyleId);
  renderPreview();
  refreshLayoutThumbs();
  setStatus("Random look rolled — hit 🎲 again or tweak it by hand.");
}

function canvasPoint(event) {
  const bounds = previewCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * previewCanvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * previewCanvas.height,
  };
}

function panelAt(point) {
  return panelRects.findIndex(
    (r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h,
  );
}

let drag = null;

function wireCanvas() {
  previewCanvas.addEventListener("pointerdown", (event) => {
    const point = canvasPoint(event);
    const idx = panelAt(point);
    if (idx >= 0) {
      selectedPanel = idx;
      const panel = state.panels[idx];
      drag = { x: point.x, y: point.y, panX: panel.panX, panY: panel.panY };
      previewCanvas.setPointerCapture(event.pointerId);
      previewCanvas.style.cursor = "grabbing";
      renderPreview();
    }
  });

  previewCanvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const r = panelRects[selectedPanel];
    if (!r) return;
    const panel = state.panels[selectedPanel];
    panel.panX = drag.panX + (point.x - drag.x) / r.w;
    panel.panY = drag.panY + (point.y - drag.y) / r.h;
    clampPanel(panel);
    renderPreview();
  });

  const endDrag = () => {
    drag = null;
    previewCanvas.style.cursor = "grab";
  };
  previewCanvas.addEventListener("pointerup", endDrag);
  previewCanvas.addEventListener("pointercancel", endDrag);

  previewCanvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const idx = panelAt(canvasPoint(event));
    if (idx >= 0) selectedPanel = idx;
    const panel = state.panels[selectedPanel];
    panel.zoom *= event.deltaY < 0 ? 1.06 : 1 / 1.06;
    clampPanel(panel);
    renderPreview();
  }, { passive: false });
}

function wireControls() {
  const dropzone = $("dropzone");
  const fileInput = $("file-input");
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  ["dragenter", "dragover"].forEach((name) => dropzone.addEventListener(name, (event) => {
    event.preventDefault();
    dropzone.classList.add("drag-over");
  }));
  ["dragleave", "drop"].forEach((name) => dropzone.addEventListener(name, (event) => {
    event.preventDefault();
    dropzone.classList.remove("drag-over");
  }));
  dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => event.preventDefault());

  $("title-input").addEventListener("input", (event) => {
    state.title = event.target.value;
    renderPreview();
  });
  $("subtitle-input").addEventListener("input", (event) => {
    state.subtitle = event.target.value;
    renderPreview();
  });

  $("zoom-slider").addEventListener("input", (event) => {
    const panel = state.panels[selectedPanel];
    panel.zoom = Number(event.target.value) / 100;
    clampPanel(panel);
    $("zoom-out").textContent = `${event.target.value}%`;
    renderPreview();
  });

  $("btn-center").addEventListener("click", () => {
    const panel = state.panels[selectedPanel];
    panel.panX = 0;
    panel.panY = 0;
    renderPreview();
    setStatus(`Panel ${selectedPanel + 1} centred.`);
  });

  $("btn-next-photo").addEventListener("click", () => {
    if (!photos.length) return;
    const panel = state.panels[selectedPanel];
    panel.photoIndex = (panel.photoIndex + 1) % photos.length;
    renderPreview();
    setStatus(`Panel ${selectedPanel + 1}: ${photos[panel.photoIndex].name}.`);
  });

  $("btn-random").addEventListener("click", randomLook);
  $("btn-export").addEventListener("click", () => exportPNG(state.sizeId));
  $("btn-export-all").addEventListener("click", () => {
    EXPORT_SIZES.forEach((size, i) => setTimeout(() => exportPNG(size.id), i * 450));
    setStatus("Exporting all 3 sizes…");
  });

  const before = $("btn-before");
  const holdOn = () => { beforeHeld = true; renderPreview(); };
  const holdOff = () => { beforeHeld = false; renderPreview(); };
  before.addEventListener("pointerdown", holdOn);
  before.addEventListener("pointerup", holdOff);
  before.addEventListener("pointerleave", holdOff);
  before.addEventListener("keydown", (event) => { if (event.key === " ") holdOn(); });
  before.addEventListener("keyup", holdOff);
}

async function boot() {
  buildTitleStyles();
  buildLayoutGrid();
  buildGradeList();
  buildSizeRow();
  wireCanvas();
  wireControls();
  renderPreview();
  await loadSamples();

  const shot = new URLSearchParams(location.search).get("shot");
  if (shot) {
    await runShot(shot, { state, photos, renderPreview, setStatus, markActive });
  }
}

boot();
