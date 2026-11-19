// Vice Coast Cover Studio — cover draw engine.
// Draws a multi-panel GTA-style poster cover onto any 2D canvas at any size.
// Everything here is original art code: layouts, gradient-map grades and
// lettering are drawn with canvas primitives only. No Rockstar artwork,
// logos or fonts are used anywhere.

/** A panel rectangle inside the cover, in absolute pixels. */
function rect(x, y, w, h) {
  return { x, y, w, h };
}

/** Split a rectangle into `n` equal columns with gutter `g`. */
function columns(r, n, g) {
  const w = (r.w - g * (n - 1)) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(rect(r.x + i * (w + g), r.y, w, r.h));
  }
  return out;
}

/** Split a rectangle into `n` equal rows with gutter `g`. */
function rows(r, n, g) {
  const h = (r.h - g * (n - 1)) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(rect(r.x, r.y + i * (h + g), r.w, h));
  }
  return out;
}

/**
 * The 12 layouts. Each takes (W, H, g) and returns an array of panel rects.
 * Every layout adapts to square, portrait and wide covers because it is
 * computed from the actual width and height.
 */
export const LAYOUTS = [
  {
    id: 'hero-left',
    name: 'Hero Left',
    panels(W, H, g) {
      const heroW = W * 0.62;
      const side = rect(heroW + g, 0, W - heroW - g, H);
      return [rect(0, 0, heroW, H), ...rows(side, 3, g)];
    },
  },
  {
    id: 'grid-4',
    name: 'Grid 2 x 2',
    panels(W, H, g) {
      const out = [];
      for (const r of rows(rect(0, 0, W, H), 2, g)) out.push(...columns(r, 2, g));
      return out;
    },
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    panels(W, H, g) {
      const heroH = H * 0.55;
      const bottom = rect(0, heroH + g, W, H - heroH - g);
      return [rect(0, 0, W, heroH), ...columns(bottom, 3, g)];
    },
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    panels(W, H) {
      return [rect(0, 0, W, H)];
    },
  },
  {
    id: 'trio',
    name: 'Trio',
    panels(W, H, g) {
      return columns(rect(0, 0, W, H), 3, g);
    },
  },
  {
    id: 'hero-right',
    name: 'Hero Right',
    panels(W, H, g) {
      const sideW = W * 0.38;
      const heroX = sideW + g;
      const side = rect(0, 0, sideW, H);
      return [...rows(side, 3, g), rect(heroX, 0, W - heroX, H)];
    },
  },
  {
    id: 'grid-6',
    name: 'Grid 2 x 3',
    panels(W, H, g) {
      const out = [];
      for (const r of rows(rect(0, 0, W, H), 3, g)) out.push(...columns(r, 2, g));
      return out;
    },
  },
  {
    id: 'grid-9',
    name: 'Grid 3 x 3',
    panels(W, H, g) {
      const out = [];
      for (const r of rows(rect(0, 0, W, H), 3, g)) out.push(...columns(r, 3, g));
      return out;
    },
  },
  {
    id: 'strips-5',
    name: 'Film Strips',
    panels(W, H, g) {
      return columns(rect(0, 0, W, H), 5, g);
    },
  },
  {
    id: 'hero-center',
    name: 'Hero Center',
    panels(W, H, g) {
      const colW = W * 0.22;
      const heroX = colW + g;
      const heroW = W - colW * 2 - g * 2;
      const left = rect(0, 0, colW, H);
      const right = rect(heroX + heroW + g, 0, colW, H);
      return [
        ...rows(left, 2, g),
        rect(heroX, 0, heroW, H),
        ...rows(right, 2, g),
      ];
    },
  },
  {
    id: 'duo',
    name: 'Duo Split',
    panels(W, H, g) {
      if (W >= H) return columns(rect(0, 0, W, H), 2, g);
      return rows(rect(0, 0, W, H), 2, g);
    },
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    panels(W, H, g) {
      const heroH = H * 0.58;
      const heroW = W * 0.64;
      const topRight = rect(heroW + g, 0, W - heroW - g, heroH);
      const bottom = rect(0, heroH + g, W, H - heroH - g);
      return [rect(0, 0, heroW, heroH), topRight, ...columns(bottom, 3, g)];
    },
  },
];

/**
 * The 8 colour grades. Each grade is a photo filter (applied while the
 * photo is drawn) plus a diagonal gradient-map overlay (a blend mode over
 * the whole cover) and a vignette strength.
 */
export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    stops: [[0, 'rgba(255, 170, 60, 0.34)'], [0.55, 'rgba(255, 90, 120, 0.22)'], [1, 'rgba(120, 30, 160, 0.38)']],
    blend: 'overlay',
    vignette: 0.32,
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    filter: 'saturate(1.45) contrast(1.16) brightness(0.98)',
    stops: [[0, 'rgba(0, 240, 255, 0.30)'], [0.5, 'rgba(120, 40, 220, 0.18)'], [1, 'rgba(255, 0, 150, 0.34)']],
    blend: 'overlay',
    vignette: 0.36,
  },
  {
    id: 'palm-heat',
    name: 'Palm Heat',
    filter: 'saturate(1.25) contrast(1.05) sepia(0.28) brightness(1.05)',
    stops: [[0, 'rgba(255, 210, 90, 0.30)'], [1, 'rgba(190, 80, 20, 0.30)']],
    blend: 'soft-light',
    vignette: 0.28,
  },
  {
    id: 'coral-dusk',
    name: 'Coral Dusk',
    filter: 'saturate(1.4) contrast(1.06) brightness(1.02)',
    stops: [[0, 'rgba(255, 120, 140, 0.32)'], [1, 'rgba(90, 20, 90, 0.36)']],
    blend: 'overlay',
    vignette: 0.3,
  },
  {
    id: 'midnight-drive',
    name: 'Midnight Drive',
    filter: 'saturate(1.15) contrast(1.18) brightness(0.92) hue-rotate(-12deg)',
    stops: [[0, 'rgba(40, 90, 255, 0.30)'], [1, 'rgba(10, 10, 50, 0.42)']],
    blend: 'overlay',
    vignette: 0.42,
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    filter: 'saturate(1.6) contrast(1.1) brightness(1.04)',
    stops: [[0, 'rgba(255, 110, 220, 0.32)'], [0.5, 'rgba(255, 80, 160, 0.16)'], [1, 'rgba(130, 40, 220, 0.34)']],
    blend: 'overlay',
    vignette: 0.3,
  },
  {
    id: 'gold-coast',
    name: 'Gold Coast',
    filter: 'saturate(1.3) contrast(1.1) brightness(1.04)',
    stops: [[0, 'rgba(255, 220, 120, 0.30)'], [0.55, 'rgba(20, 180, 170, 0.14)'], [1, 'rgba(10, 60, 90, 0.32)']],
    blend: 'overlay',
    vignette: 0.3,
  },
  {
    id: 'mono-ink',
    name: 'Poster Ink',
    filter: 'grayscale(1) contrast(1.35) brightness(1.06)',
    stops: [[0, 'rgba(255, 255, 255, 0.10)'], [1, 'rgba(0, 0, 0, 0.34)']],
    blend: 'multiply',
    vignette: 0.34,
  },
];

/** The 3 title lettering styles. */
export const TITLE_STYLES = [
  { id: 'bold-block', name: 'Bold Block' },
  { id: 'neon-script', name: 'Neon Script' },
  { id: 'halftone', name: 'Halftone' },
];

/** Export sizes: the common post sizes. */
export const SIZES = [
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

export function findLayout(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function findGrade(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function findTitleStyle(id) {
  return TITLE_STYLES.find((t) => t.id === id) || TITLE_STYLES[0];
}

export function findSize(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

let grainCanvas = null;
/** A small tiled noise canvas used as a film-grain overlay. */
function grainPattern(ctx) {
  if (grainCanvas) return ctx.createPattern(grainCanvas, 'repeat');
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 140;
  grainCanvas.height = 140;
  const g = grainCanvas.getContext('2d');
  const img = g.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return ctx.createPattern(grainCanvas, 'repeat');
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPanelPhoto(ctx, photo, p, zoom, ox, oy) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  if (!iw || !ih) return;
  const base = Math.max(p.w / iw, p.h / ih);
  const scale = base * (zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = p.x + (p.w - dw) / 2 + (ox || 0) * p.w;
  const dy = p.y + (p.h - dh) / 2 + (oy || 0) * p.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.w, p.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Wraps text into lines that fit `maxWidth` at the current font. */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the halftone dot field behind a title band. */
function drawHalftone(ctx, x, y, w, h, dot, gap, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      ctx.beginPath();
      ctx.arc(xx, yy, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draws the title block: a dark gradient band at the foot of the cover,
 * the title in the chosen lettering style and the subtitle beneath it.
 */
function drawTitleBlock(ctx, W, H, state) {
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;
  const bandH = H * 0.30;
  const bandY = H - bandH;
  const band = ctx.createLinearGradient(0, bandY - H * 0.06, 0, H);
  band.addColorStop(0, 'rgba(10, 6, 20, 0)');
  band.addColorStop(0.45, 'rgba(10, 6, 20, 0.55)');
  band.addColorStop(1, 'rgba(10, 6, 20, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - H * 0.06, W, bandH + H * 0.06);

  const pad = W * 0.045;
  const maxW = W - pad * 2;
  const style = findTitleStyle(state.titleId);

  if (title) {
    let size = H * 0.115;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let lines = [];
    for (;;) {
      if (style.id === 'neon-script') {
        ctx.font = `italic 800 ${size}px Impact, "Arial Black", sans-serif`;
      } else {
        ctx.font = `${size}px Impact, "Arial Black", sans-serif`;
      }
      lines = wrapLines(ctx, title.toUpperCase(), maxW).slice(0, 2);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest <= maxW || size <= H * 0.03) break;
      size -= Math.max(2, size * 0.06);
    }
    const lineH = size * 1.02;
    const blockH = lines.length * lineH;
    let ty = H - H * 0.055 - (subtitle ? H * 0.052 : 0) - blockH + size * 0.82;

    if (style.id === 'halftone') {
      drawHalftone(ctx, pad - W * 0.01, ty - size * 0.95, maxW + W * 0.02, blockH + size * 0.28, Math.max(2, W * 0.0035), Math.max(9, W * 0.013), '#ff5fa2', 0.5);
    }
    for (const line of lines) {
      if (style.id === 'neon-script') {
        const grad = ctx.createLinearGradient(pad, 0, pad + maxW, 0);
        grad.addColorStop(0, '#ffe259');
        grad.addColorStop(0.5, '#ff7eb3');
        grad.addColorStop(1, '#7af2ff');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ff2e88';
        ctx.shadowBlur = size * 0.28;
        ctx.fillText(line, pad, ty);
        ctx.shadowBlur = 0;
      } else if (style.id === 'halftone') {
        ctx.lineWidth = Math.max(2, size * 0.09);
        ctx.strokeStyle = '#14061f';
        ctx.strokeText(line, pad, ty);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, pad, ty);
      } else {
        ctx.lineWidth = Math.max(2, size * 0.075);
        ctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
        ctx.lineJoin = 'round';
        ctx.strokeText(line, pad, ty);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, pad, ty);
      }
      ty += lineH;
    }
  }

  if (subtitle) {
    const subSize = Math.max(12, H * 0.032);
    ctx.font = `600 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd9ec';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.3;
    ctx.fillText(subtitle.toUpperCase(), pad, H - H * 0.048);
    ctx.shadowBlur = 0;
  }
}

/**
 * Renders the whole cover onto `ctx` at size W x H.
 * state: { layoutId, gradeId, titleId, title, subtitle,
 *   panels: [{ photo, zoom, ox, oy }], photos: [HTMLImageElement],
 *   showGrade, showTitle }.
 * `photo` is an index into state.photos (or -1 for an empty panel).
 */
export function renderCover(ctx, W, H, state) {
  const grade = findGrade(state.gradeId);
  const layout = findLayout(state.layoutId);
  const g = Math.max(4, Math.round(Math.min(W, H) * 0.012));
  const frame = Math.max(6, Math.round(Math.min(W, H) * 0.018));

  // Poster frame: white border, content inset.
  ctx.fillStyle = '#f7f2ea';
  ctx.fillRect(0, 0, W, H);
  const inner = { x: frame, y: frame, w: W - frame * 2, h: H - frame * 2 };
  ctx.fillStyle = '#1a0b26';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  // Panels.
  const panels = layout.panels(inner.w, inner.h, g).map((p) => ({
    x: p.x + inner.x,
    y: p.y + inner.y,
    w: p.w,
    h: p.h,
  }));
  ctx.save();
  ctx.beginPath();
  ctx.rect(inner.x, inner.y, inner.w, inner.h);
  ctx.clip();
  ctx.filter = state.showGrade === false ? 'none' : grade.filter;
  panels.forEach((p, i) => {
    const slot = (state.panels && state.panels[i]) || {};
    const photo = slot.photo != null && slot.photo >= 0 ? state.photos[slot.photo] : null;
    if (photo) {
      drawPanelPhoto(ctx, photo, p, slot.zoom || 1, slot.ox || 0, slot.oy || 0);
    } else {
      ctx.fillStyle = i % 2 ? '#2a1240' : '#3a1a52';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    // Thin panel divider.
    ctx.strokeStyle = 'rgba(247, 242, 234, 0.85)';
    ctx.lineWidth = Math.max(2, g * 0.5);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });
  ctx.restore();
  ctx.filter = 'none';

  // Grade overlay + vignette + grain.
  if (state.showGrade !== false) {
    const grad = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
    for (const [stop, color] of grade.stops) grad.addColorStop(stop, color);
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.x, inner.y, inner.w, inner.h);
    ctx.clip();
    ctx.globalCompositeOperation = grade.blend;
    ctx.fillStyle = grad;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.globalCompositeOperation = 'source-over';
    const vig = ctx.createRadialGradient(
      inner.x + inner.w / 2, inner.y + inner.h / 2, Math.min(inner.w, inner.h) * 0.32,
      inner.x + inner.w / 2, inner.y + inner.h / 2, Math.max(inner.w, inner.h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
    ctx.fillStyle = vig;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    const grain = grainPattern(ctx);
    if (grain) {
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = grain;
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // Title block (drawn inside the frame, over the panels).
  if (state.showTitle !== false) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.x, inner.y, inner.w, inner.h);
    ctx.clip();
    drawTitleBlock(ctx, W, H, state);
    ctx.restore();
  }
  return panels;
}

/** Default state: demo photos in the first panels, Vice Sunset grade. */
export function defaultState(photoCount) {
  const panels = [];
  for (let i = 0; i < 12; i++) {
    panels.push({ photo: photoCount > 0 ? i % photoCount : -1, zoom: 1.08, ox: 0, oy: 0 });
  }
  return {
    layoutId: 'hero-left',
    gradeId: 'vice-sunset',
    titleId: 'bold-block',
    title: 'VICE COAST',
    subtitle: 'Neon nights · Summer 2026',
    panels,
    showGrade: true,
    showTitle: true,
  };
}
