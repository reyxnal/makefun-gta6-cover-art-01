// The cover engine: renders a state (photos, preset, layout, caption) into a
// canvas at export resolution. Every panel is graded, halftoned and inked the
// same way, so photos and procedural scenes share one comic-book look.

import { PRESETS, buildGradeLUT, applyGrade } from './grades.js';
import { halftone, inkOutline, grain } from './effects.js';
import { SCENES } from './scenes.js';
import { SIZES, LAYOUTS } from './layout.js';

/** Loads the two cover fonts so canvas lettering uses them, not a fallback. */
export async function ensureFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load('400 40px "Archivo Black"'),
    document.fonts.load('500 40px "Oswald"'),
    document.fonts.load('600 40px "Oswald"'),
    document.fonts.ready,
  ]);
}

/** Draws an image cover-fitting a rect, with zoom and a pan offset. */
function drawPhotoCoverFit(ctx, img, w, h, zoom, dx, dy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // dx/dy in [-1, 1] pan across the overflow the zoom creates (0 = centred)
  const ox = (w - dw) / 2 + dx * Math.max(0, (dw - w) / 2);
  const oy = (h - dh) / 2 + dy * Math.max(0, (dh - h) / 2);
  ctx.drawImage(img, ox, oy, dw, dh);
}

/** Renders one panel (photo or procedural scene) with the full print pipeline. */
function renderPanel(rect, slot, state, lut, preset) {
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (slot.kind === 'photo' && slot.img) {
    drawPhotoCoverFit(ctx, slot.img, w, h, slot.zoom || 1, slot.dx || 0, slot.dy || 0);
  } else {
    const scene = SCENES[slot.scene || 'skyline'];
    scene.draw(ctx, 0, 0, w, h, preset);
  }
  const img = ctx.getImageData(0, 0, w, h);
  applyGrade(img, preset, lut);
  ctx.putImageData(img, 0, 0);
  halftone(ctx, w, h, Math.max(6, Math.round(w / 160)), state.halftone);
  inkOutline(ctx, w, h, state.ink);
  grain(ctx, w, h, 0.1);
  return off;
}

/** Largest font size (<= maxSize) at which text fits maxWidth. */
function fitFontSize(ctx, text, family, weight, maxSize, maxWidth) {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawCaptionBand(ctx, w, h, band, state, preset) {
  const bx = band.x * w;
  const by = band.y * h;
  const bw = band.w * w;
  const bh = band.h * h;
  const overlay = state.layout === 'single';
  if (overlay) {
    const g = ctx.createLinearGradient(0, by - bh * 0.6, 0, by + bh);
    g.addColorStop(0, 'rgba(20,8,31,0)');
    g.addColorStop(0.55, 'rgba(20,8,31,0.82)');
    g.addColorStop(1, 'rgba(20,8,31,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by - bh * 0.6, bw, bh * 1.6);
  } else {
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, '#241040');
    g.addColorStop(1, '#12061f');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    // sunset accent line on the band's top edge
    const line = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    line.addColorStop(0, '#ff9440');
    line.addColorStop(0.5, '#ff4a8a');
    line.addColorStop(1, '#7c4dff');
    ctx.fillStyle = line;
    ctx.fillRect(bx, by, bw, Math.max(3, h * 0.004));
  }

  const title = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const pad = bw * 0.045;
  const cx = bx + pad;
  const maxW = bw - pad * 2;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (title) {
    const size = fitFontSize(ctx, title, '"Archivo Black", sans-serif', 400, bh * 0.42, maxW - bh * 0.04);
    const ty = by + bh * (sub ? 0.48 : 0.62);
    // slant around the text's own baseline origin, so the shear leans the
    // glyphs instead of sliding the whole line sideways
    ctx.save();
    ctx.translate(cx, ty);
    ctx.transform(1, 0, -0.06, 1, 0, 0);
    ctx.font = `400 ${size}px "Archivo Black", sans-serif`;
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#14081f';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  if (sub) {
    const size = fitFontSize(ctx, sub, '"Oswald", sans-serif', 500, bh * 0.2, maxW);
    ctx.font = `500 ${size}px "Oswald", sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(1, size * 0.08)}px`;
    } catch {
      // older canvas: no letter-spacing, the text still draws
    }
    ctx.fillStyle = 'rgba(255,214,150,0.95)';
    ctx.fillText(sub.toUpperCase(), cx, by + bh * 0.82);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // ignore
    }
  }
  // small tag, bottom right of the band
  const tag = `SUNSET COMIC · ${SIZES[state.size].label.toUpperCase()}`;
  ctx.font = `500 ${Math.max(10, bh * 0.09)}px "Oswald", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(tag, bx + bw - pad, by + bh - bh * 0.08);
  ctx.restore();
}

/**
 * Renders the whole cover into `canvas` at the state's export size.
 * Returns the render time in milliseconds.
 */
export function renderCover(canvas, state) {
  const t0 = performance.now();
  const size = SIZES[state.size] || SIZES.square;
  const preset = PRESETS[state.preset] || PRESETS.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.mosaic;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, size.w, size.h);

  const lut = buildGradeLUT(preset);
  const panels = layout.panels(size.w, size.h);
  const gutter = Math.max(4, Math.round(size.w * 0.008));
  panels.forEach((p, i) => {
    const slot = state.slots[i] || { kind: 'scene', scene: 'skyline' };
    const rect = {
      x: Math.round(p.x * size.w),
      y: Math.round(p.y * size.h),
      w: Math.round(p.w * size.w),
      h: Math.round(p.h * size.h),
    };
    const panel = renderPanel(rect, slot, state, lut, preset);
    ctx.drawImage(panel, rect.x, rect.y);
    // thick comic gutter around the panel
    ctx.strokeStyle = '#0d0518';
    ctx.lineWidth = gutter;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  drawCaptionBand(ctx, size.w, size.h, layout.band, state, preset);
  return performance.now() - t0;
}

/** Renders the cover at export size, returns a PNG Blob. */
export async function exportPNG(state) {
  await ensureFonts();
  const off = document.createElement('canvas');
  renderCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}
