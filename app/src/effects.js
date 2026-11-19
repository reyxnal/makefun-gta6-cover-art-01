// Print effects that turn a graded photo into comic-book art: a halftone dot
// screen, a hand-inked outline (Sobel edges), and a touch of paper grain.
// Everything is drawn on canvas with the standard 2D API — no libraries.

/**
 * Halftone dot screen over the whole canvas. Dots grow where the picture is
 * dark. One Path2D + one fill keeps it fast even at export resolution.
 */
export function halftone(ctx, w, h, cell, strength) {
  if (strength <= 0) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const dots = new Path2D();
  const maxR = cell * 0.52;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const px = Math.min(w - 1, x + (cell >> 1));
      const py = Math.min(h - 1, y + (cell >> 1));
      const i = (py * w + px) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const r = maxR * (1 - lum / 255) * strength;
      if (r < 0.6) continue;
      dots.moveTo(px + r, py);
      dots.arc(px, py, r, 0, Math.PI * 2);
    }
  }
  ctx.save();
  ctx.fillStyle = 'rgba(12, 6, 24, 0.85)';
  ctx.fill(dots);
  ctx.restore();
}

/**
 * Ink outline: Sobel edge magnitude on a half-resolution luminance copy,
 * drawn back over the panel with 'multiply' so only the dark lines survive.
 */
export function inkOutline(ctx, w, h, strength) {
  if (strength <= 0) return;
  const sw = Math.max(2, w >> 1);
  const sh = Math.max(2, h >> 1);
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext('2d');
  sctx.drawImage(ctx.canvas, 0, 0, sw, sh);
  const img = sctx.getImageData(0, 0, sw, sh);
  const d = img.data;
  const lum = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  const edge = sctx.createImageData(sw, sh);
  const e = edge.data;
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const i = y * sw + x;
      const gx =
        -lum[i - sw - 1] - 2 * lum[i - 1] - lum[i + sw - 1] +
        lum[i - sw + 1] + 2 * lum[i + 1] + lum[i + sw + 1];
      const gy =
        -lum[i - sw - 1] - 2 * lum[i - sw] - lum[i - sw + 1] +
        lum[i + sw - 1] + 2 * lum[i + sw] + lum[i + sw + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      // soft threshold: faint edges stay paper-white, strong edges go black
      const v = mag < 28 ? 255 : mag > 130 ? 0 : Math.round(255 - ((mag - 28) / 102) * 255);
      const o = i * 4;
      e[o] = v;
      e[o + 1] = v;
      e[o + 2] = v;
      e[o + 3] = 255;
    }
  }
  sctx.putImageData(edge, 0, 0);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(small, 0, 0, w, h);
  ctx.restore();
}

let grainPattern = null;
/** A faint paper grain, tiled from one small noise canvas. */
export function grain(ctx, w, h, strength) {
  if (strength <= 0) return;
  if (!grainPattern) {
    const n = document.createElement('canvas');
    n.width = 128;
    n.height = 128;
    const nctx = n.getContext('2d');
    const img = nctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(n, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
