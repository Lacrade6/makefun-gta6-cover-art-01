// Screenshot scenes, driven by ?shot=<name>.
// Each scene loads the sample photos (done by main.js before this runs),
// sets a fixed look, renders, then sets window.__shotReady = true so a
// headless browser knows when to capture the page.

import { renderCover, dealPanels } from "./cover.js";

function applyLook(state, look) {
  Object.assign(state, look);
  return state;
}

function showExportedCover(state, photos, sizeId) {
  document.body.classList.add("shot-cover");
  const canvas = document.getElementById("preview");
  const view = { ...state, sizeId, showGrade: true, showTitle: true };
  renderCover(canvas, view, photos.map((p) => p.img));
}

export async function runShot(name, ctx) {
  const { state, photos, renderPreview, setStatus } = ctx;
  dealPanels(state, photos.length);

  if (name === "cover") {
    applyLook(state, {
      layoutId: "mosaic",
      gradeId: "vice-sunset",
      titleStyleId: "bold-block",
      title: "VICE COAST",
      subtitle: "Neon nights · Summer 2026",
    });
    showExportedCover(state, photos, "wide");
  } else if (name === "portrait") {
    applyLook(state, {
      layoutId: "mosaic",
      gradeId: "vice-sunset",
      titleStyleId: "bold-block",
      title: "VICE COAST",
      subtitle: "Neon nights · Summer 2026",
    });
    showExportedCover(state, photos, "portrait");
  } else if (name === "nine") {
    applyLook(state, {
      layoutId: "grid-3x3",
      gradeId: "neon-nights",
      titleStyleId: "halftone",
      title: "VICE COAST",
      subtitle: "Neon nights · Summer 2026",
      sizeId: "square",
    });
    syncPickers(state);
    renderPreview();
    setStatus("Grid 3×3 with Neon Nights and Halftone lettering.");
  } else {
    // Default editor scene: Hero Left + Vice Sunset.
    applyLook(state, {
      layoutId: "hero-left",
      gradeId: "vice-sunset",
      titleStyleId: "bold-block",
      title: "VICE COAST",
      subtitle: "Neon nights · Summer 2026",
      sizeId: "square",
    });
    syncPickers(state);
    renderPreview();
    setStatus("Sample photos loaded — drop your own photos to make it yours.");
  }

  window.__shotReady = true;
}

// Keep the picker buttons' active outlines in step with the scene's look.
function syncPickers(state) {
  const sync = (id, activeId) => {
    document.querySelectorAll(`#${id} button`).forEach((b) => {
      b.classList.toggle("active", b.dataset.id === activeId);
    });
  };
  sync("layout-grid", state.layoutId);
  sync("grade-list", state.gradeId);
  sync("title-styles", state.titleStyleId);
  sync("size-row", state.sizeId);
}
