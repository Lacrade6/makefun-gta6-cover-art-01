// Screenshot scenes for Vice Coast Cover Studio, driven by ?shot=<name>.
// Each scene loads the demo photos, sets a fixed look, renders, and then
// marks window.__shotReady so a headless browser can capture it.
// Scenes: cover (exported wide cover, full window), portrait (exported
// portrait cover), editor (the editor with a photo loaded), nine (the
// editor on the 9-panel layout with the Neon Nights grade).
import { defaultState, renderCover } from './cover.js';

const SAMPLES = ['./samples/boulevard.jpg', './samples/pier.jpg'];

export async function runShot(shot, api) {
  for (const url of SAMPLES) {
    try {
      const img = await api.loadImage(url);
      api.photos.push({ img, name: url.split('/').pop() });
    } catch {
      // A missing sample just means fewer demo photos.
    }
  }
  const base = defaultState(api.photos.length);
  base.title = 'VICE COAST';
  base.subtitle = 'Neon nights · Summer 2026';

  if (shot === 'cover' || shot === 'portrait') {
    const size = shot === 'portrait' ? { w: 1080, h: 1350 } : { w: 1920, h: 1080 };
    base.layoutId = 'mosaic';
    base.gradeId = 'vice-sunset';
    base.titleId = 'bold-block';
    api.setState(base);
    document.body.classList.add('shot-cover');
    const canvas = api.canvas;
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
    renderCover(canvas.getContext('2d'), size.w, size.h, {
      ...base,
      photos: api.photos.map((p) => p.img),
    });
  } else if (shot === 'nine') {
    base.layoutId = 'grid-9';
    base.gradeId = 'neon-nights';
    base.titleId = 'halftone';
    api.setState(base);
    api.loadEditor();
  } else {
    base.layoutId = 'hero-left';
    base.gradeId = 'vice-sunset';
    base.titleId = 'bold-block';
    api.setState(base);
    api.loadEditor();
  }
  window.__shotReady = true;
}
