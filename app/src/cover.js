// Vice Coast Cover Studio — cover draw engine.
// Everything is drawn with canvas primitives: multi-panel layouts, sunset /
// neon colour grades, film grain and bold poster lettering. No artwork,
// logos or fonts are taken from any game; lettering uses system font stacks.

export const EXPORT_SIZES = [
  { id: "square", name: "Square", width: 1080, height: 1080 },
  { id: "portrait", name: "Portrait", width: 1080, height: 1350 },
  { id: "wide", name: "Wide", width: 1920, height: 1080 },
];

const DISPLAY_FONT = 'Impact, "Arial Black", "Franklin Gothic Heavy", sans-serif';

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Split a box into n stacked rows with gutter gaps between them.
function stackRows(x, y, w, h, n, g) {
  const out = [];
  const each = (h - g * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) out.push(rect(x, y + i * (each + g), w, each));
  return out;
}

// Split a box into n side-by-side columns with gutter gaps between them.
function splitCols(x, y, w, h, n, g) {
  const out = [];
  const each = (w - g * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) out.push(rect(x + i * (each + g), y, each, h));
  return out;
}

function gridPanels(w, h, cols, rows, g) {
  const out = [];
  const cw = (w - g * (cols - 1)) / cols;
  const ch = (h - g * (rows - 1)) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out.push(rect(c * (cw + g), r * (ch + g), cw, ch));
    }
  }
  return out;
}

// Each layout is a function of (width, height, gutter) returning panel
// rectangles, so the same layout adapts to square, portrait and wide covers.
export const LAYOUTS = [
  {
    id: "hero-left",
    name: "Hero Left",
    panels(w, h, g) {
      const heroW = w * 0.62 - g / 2;
      const colX = w * 0.62 + g / 2;
      return [rect(0, 0, heroW, h), ...stackRows(colX, 0, w - colX, h, 3, g)];
    },
  },
  {
    id: "grid-2x2",
    name: "Grid 2×2",
    panels: (w, h, g) => gridPanels(w, h, 2, 2, g),
  },
  {
    id: "hero-top",
    name: "Hero Top",
    panels(w, h, g) {
      const heroH = h * 0.55 - g / 2;
      const rowY = h * 0.55 + g / 2;
      return [rect(0, 0, w, heroH), ...splitCols(0, rowY, w, h - rowY, 3, g)];
    },
  },
  {
    id: "full-bleed",
    name: "Full Bleed",
    panels: (w, h) => [rect(0, 0, w, h)],
  },
  {
    id: "trio",
    name: "Trio",
    panels: (w, h, g) => splitCols(0, 0, w, h, 3, g),
  },
  {
    id: "hero-right",
    name: "Hero Right",
    panels(w, h, g) {
      const colW = w * 0.38 - g / 2;
      const heroX = w * 0.38 + g / 2;
      return [...stackRows(0, 0, colW, h, 3, g), rect(heroX, 0, w - heroX, h)];
    },
  },
  {
    id: "grid-2x3",
    name: "Grid 2×3",
    panels: (w, h, g) => gridPanels(w, h, 2, 3, g),
  },
  {
    id: "grid-3x3",
    name: "Grid 3×3",
    panels: (w, h, g) => gridPanels(w, h, 3, 3, g),
  },
  {
    id: "film-strips",
    name: "Film Strips",
    panels: (w, h, g) => splitCols(0, 0, w, h, 5, g),
  },
  {
    id: "hero-center",
    name: "Hero Center",
    panels(w, h, g) {
      const sideW = w * 0.22 - g / 2;
      const heroX = w * 0.22 + g / 2;
      const heroW = w * 0.56 - g;
      const rightX = heroX + heroW + g;
      return [
        ...stackRows(0, 0, sideW, h, 2, g),
        rect(heroX, 0, heroW, h),
        ...stackRows(rightX, 0, w - rightX, h, 2, g),
      ];
    },
  },
  {
    id: "duo-split",
    name: "Duo Split",
    panels(w, h, g) {
      return w >= h ? splitCols(0, 0, w, h, 2, g) : stackRows(0, 0, w, h, 2, g);
    },
  },
  {
    id: "mosaic",
    name: "Mosaic",
    panels(w, h, g) {
      const heroW = w * 0.64 - g / 2;
      const heroH = h * 0.58 - g / 2;
      const rightX = w * 0.64 + g / 2;
      const rowY = h * 0.58 + g / 2;
      return [
        rect(0, 0, heroW, heroH),
        rect(rightX, 0, w - rightX, heroH),
        ...splitCols(0, rowY, w, h - rowY, 3, g),
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Each grade = a CSS filter applied while photos are drawn, a diagonal
// gradient-map overlay (colour stops + blend mode) over the whole cover,
// and a vignette strength (0..1).
export const GRADES = [
  {
    id: "vice-sunset",
    name: "Vice Sunset",
    filter: "saturate(1.35) contrast(1.12) brightness(1.05) sepia(0.18)",
    stops: [[0, "#ffb347"], [0.38, "#ff5e8a"], [0.72, "#c86dd7"], [1, "#3b1d5e"]],
    blend: "overlay",
    vignette: 0.42,
  },
  {
    id: "neon-nights",
    name: "Neon Nights",
    filter: "saturate(1.55) contrast(1.22) brightness(0.98) hue-rotate(-8deg)",
    stops: [[0, "#00e5ff"], [0.45, "#7c4dff"], [1, "#ff2fb3"]],
    blend: "overlay",
    vignette: 0.5,
  },
  {
    id: "palm-heat",
    name: "Palm Heat",
    filter: "sepia(0.45) saturate(1.25) contrast(1.08) brightness(1.06)",
    stops: [[0, "#ffd76e"], [0.55, "#ff9a3d"], [1, "#b34a1f"]],
    blend: "soft-light",
    vignette: 0.36,
  },
  {
    id: "coral-dusk",
    name: "Coral Dusk",
    filter: "saturate(1.3) contrast(1.1) brightness(1.02)",
    stops: [[0, "#ff8a7a"], [0.5, "#e85d9e"], [1, "#4a1459"]],
    blend: "overlay",
    vignette: 0.45,
  },
  {
    id: "midnight-drive",
    name: "Midnight Drive",
    filter: "saturate(1.15) contrast(1.3) brightness(0.88)",
    stops: [[0, "#2b6cb0"], [0.55, "#12275e"], [1, "#050a1f"]],
    blend: "overlay",
    vignette: 0.68,
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    filter: "saturate(1.9) contrast(1.14) brightness(1.08)",
    stops: [[0, "#ff6ec7"], [0.55, "#ff2e88"], [1, "#8b2fc9"]],
    blend: "overlay",
    vignette: 0.38,
  },
  {
    id: "gold-coast",
    name: "Gold Coast",
    filter: "saturate(1.3) contrast(1.12) brightness(1.04)",
    stops: [[0, "#ffcf5c"], [0.5, "#2ec4b6"], [1, "#0b3d5c"]],
    blend: "overlay",
    vignette: 0.44,
  },
  {
    id: "poster-ink",
    name: "Poster Ink",
    filter: "grayscale(1) contrast(1.55) brightness(1.05)",
    stops: [[0, "#ffffff"], [1, "#000000"]],
    blend: "multiply",
    vignette: 0.4,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export const TITLE_STYLES = [
  { id: "bold-block", name: "Bold Block" },
  { id: "neon-script", name: "Neon Script" },
  { id: "halftone", name: "Halftone" },
];

export function titleStyleById(id) {
  return TITLE_STYLES.find((s) => s.id === id) || TITLE_STYLES[0];
}

export const MAX_PANELS = 12;

export function createDefaultState() {
  const panels = [];
  for (let i = 0; i < MAX_PANELS; i += 1) {
    panels.push({ photoIndex: i, zoom: 1.08, panX: 0, panY: 0 });
  }
  return {
    layoutId: "hero-left",
    gradeId: "vice-sunset",
    titleStyleId: "bold-block",
    title: "VICE COAST",
    subtitle: "Neon nights · Summer 2026",
    sizeId: "square",
    panels,
    showGrade: true,
    showTitle: true,
  };
}

// Deal the loaded photos across the 12 panel slots, cycling through them.
export function dealPanels(state, photoCount) {
  const n = Math.max(1, photoCount);
  state.panels.forEach((p, i) => {
    p.photoIndex = i % n;
  });
}

export function clampPanel(panel) {
  panel.zoom = Math.min(3, Math.max(1, panel.zoom || 1));
  panel.panX = Math.min(0.6, Math.max(-0.6, panel.panX || 0));
  panel.panY = Math.min(0.6, Math.max(-0.6, panel.panY || 0));
  return panel;
}

// A small random-noise tile, drawn over the cover at low alpha for grain.
let grainTile = null;
function makeGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement("canvas");
  c.width = 140;
  c.height = 140;
  const g = c.getContext("2d");
  const img = g.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// Draw one photo cover-fit into a panel, honouring per-panel zoom (1..3)
// and pan offsets (fractions of panel size, clamped to ±0.6).
function drawPhotoCover(ctx, img, r, panel, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (filter) ctx.filter = filter;
  const scale = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = r.x + (r.w - dw) / 2 + panel.panX * r.w;
  const dy = r.y + (r.h - dh) / 2 + panel.panY * r.h;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Wrap the title onto at most two lines, shrinking the font until it fits.
function fitTitle(ctx, text, maxWidth, startSize) {
  const words = text.split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 12) {
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    const lines = [];
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
    if (lines.length <= 2 && widest <= maxWidth) return { lines, size };
    size *= 0.88;
  }
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  return { lines: [text], size };
}

function drawHalftoneDots(ctx, x, y, w, h, step) {
  ctx.save();
  ctx.fillStyle = "rgba(255,95,162,0.5)";
  for (let row = 0; row * step < h; row += 1) {
    for (let col = 0; col * step < w; col += 1) {
      const cx = x + col * step + (row % 2 ? step / 2 : 0);
      const cy = y + row * step;
      const radius = 1.4 + (row / Math.max(1, h / step)) * 2.6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The caption block: a dark gradient band at the foot of the cover with the
// title in one of three lettering styles and a small subtitle beneath.
function drawTitleBlock(ctx, w, h, state) {
  const bandH = h * 0.3;
  const bandY = h - bandH;
  const grad = ctx.createLinearGradient(0, bandY, 0, h);
  grad.addColorStop(0, "rgba(10,4,24,0)");
  grad.addColorStop(0.45, "rgba(10,4,24,0.62)");
  grad.addColorStop(1, "rgba(10,4,24,0.92)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandY, w, bandH);

  const title = (state.title || "").trim().toUpperCase();
  const subtitle = (state.subtitle || "").trim().toUpperCase();
  const maxWidth = w * 0.88;
  const centerX = w / 2;
  const subSize = Math.max(13, Math.round(h * 0.026));
  const baseY = h - h * 0.045 - (subtitle ? subSize * 1.7 : 0);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (title) {
    const start = Math.round(h * 0.115);
    const { lines, size } = fitTitle(ctx, title, maxWidth, start);
    const lineH = size * 1.04;
    const topY = baseY - (lines.length - 1) * lineH;
    const style = state.titleStyleId;

    if (style === "halftone") {
      drawHalftoneDots(ctx, w * 0.06, topY - size * 1.15, w * 0.88, lines.length * lineH + size * 0.5, Math.max(9, size / 5));
    }

    ctx.font = style === "neon-script"
      ? `italic 900 ${size}px ${DISPLAY_FONT}`
      : `900 ${size}px ${DISPLAY_FONT}`;
    ctx.lineJoin = "round";

    lines.forEach((line, i) => {
      const y = topY + i * lineH;
      if (style === "neon-script") {
        const lg = ctx.createLinearGradient(centerX - maxWidth / 2, 0, centerX + maxWidth / 2, 0);
        lg.addColorStop(0, "#ffe259");
        lg.addColorStop(0.5, "#ff5fa2");
        lg.addColorStop(1, "#4de8ff");
        ctx.shadowColor = "rgba(255,47,179,0.9)";
        ctx.shadowBlur = size * 0.28;
        ctx.strokeStyle = "rgba(20,2,32,0.85)";
        ctx.lineWidth = size * 0.1;
        ctx.strokeText(line, centerX, y);
        ctx.fillStyle = lg;
        ctx.fillText(line, centerX, y);
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = "#14081f";
        ctx.lineWidth = size * 0.16;
        ctx.strokeText(line, centerX, y);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(line, centerX, y);
      }
    });
  }

  if (subtitle) {
    ctx.font = `700 ${subSize}px ${DISPLAY_FONT}`;
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#ffd7ea";
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
    ctx.fillText(subtitle, centerX, h - h * 0.045);
  }
  ctx.restore();
}

const EMPTY_FILLS = ["#2a1245", "#3a1a5e", "#241038", "#45206e"];

// Render the full cover onto a canvas sized to the chosen export size.
// `photos` is an array of loaded Image objects. Returns the panel
// rectangles in canvas coordinates (used for hit-testing in the editor).
export function renderCover(canvas, state, photos) {
  const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
  const W = size.width;
  const H = size.height;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Off-white poster frame around a dark inner field.
  ctx.fillStyle = "#f4ead8";
  ctx.fillRect(0, 0, W, H);
  const frame = Math.round(Math.min(W, H) * 0.028);
  const inner = rect(frame, frame, W - frame * 2, H - frame * 2);
  ctx.fillStyle = "#160a2b";
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  const gutter = Math.round(Math.min(W, H) * 0.012);
  const layout = layoutById(state.layoutId);
  const local = layout.panels(inner.w, inner.h, gutter);
  const panels = local.map((r) => rect(r.x + inner.x, r.y + inner.y, r.w, r.h));
  const grade = gradeById(state.gradeId);
  const filter = state.showGrade ? grade.filter : "";

  panels.forEach((r, i) => {
    const panel = clampPanel(state.panels[i] || { photoIndex: i, zoom: 1.08, panX: 0, panY: 0 });
    const img = photos.length ? photos[((panel.photoIndex % photos.length) + photos.length) % photos.length] : null;
    if (img && img.naturalWidth) {
      drawPhotoCover(ctx, img, r, panel, filter);
    } else {
      ctx.fillStyle = EMPTY_FILLS[i % EMPTY_FILLS.length];
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.strokeStyle = "rgba(244,234,216,0.85)";
    ctx.lineWidth = Math.max(2, gutter * 0.35);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  // Grade overlay, vignette and grain, clipped to the inner frame.
  ctx.save();
  ctx.beginPath();
  ctx.rect(inner.x, inner.y, inner.w, inner.h);
  ctx.clip();

  if (state.showGrade) {
    const dg = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
    grade.stops.forEach(([pos, color]) => dg.addColorStop(pos, color));
    ctx.globalCompositeOperation = grade.blend;
    ctx.globalAlpha = grade.blend === "multiply" ? 0.32 : 0.55;
    ctx.fillStyle = dg;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  const vg = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.32,
    W / 2, H / 2, Math.max(W, H) * 0.72,
  );
  const strength = state.showGrade ? grade.vignette : 0.3;
  vg.addColorStop(0, "rgba(8,2,18,0)");
  vg.addColorStop(1, `rgba(8,2,18,${strength.toFixed(2)})`);
  ctx.fillStyle = vg;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  const tile = makeGrainTile();
  const pattern = ctx.createPattern(tile, "repeat");
  if (pattern) {
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pattern;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (state.showTitle) drawTitleBlock(ctx, W, H, state);

  return panels;
}

// Render a tiny layout miniature (no title) for the layout picker buttons.
export function renderLayoutThumb(canvas, layoutId, photos, gradeId) {
  const state = createDefaultState();
  state.layoutId = layoutId;
  state.gradeId = gradeId || "vice-sunset";
  state.sizeId = "square";
  state.showTitle = false;
  dealPanels(state, photos.length);
  const tmp = document.createElement("canvas");
  renderCover(tmp, state, photos);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}
