// Procedural vignette art: original vector silhouettes drawn in code — a city
// skyline at dusk, a car on a neon street, and palms with a flamingo by the
// water. They fill any vignette panel that has no photo, and they get the same
// grade + halftone + ink treatment as the photos, so the whole cover matches.

// A deterministic pseudo-random stream, so a scene draws identically every run.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function skyGradient(ctx, x, y, w, h, top, mid, bot) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function sunDisc(ctx, cx, cy, r, core, glow) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function birds(ctx, x, y, w, h, seed, color) {
  const r = rng(seed);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, w * 0.006);
  for (let i = 0; i < 7; i++) {
    const bx = x + r() * w * 0.8 + w * 0.1;
    const by = y + r() * h * 0.35 + h * 0.05;
    const s = w * (0.02 + r() * 0.02);
    ctx.beginPath();
    ctx.arc(bx - s, by, s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(bx + s, by, s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

function palmTree(ctx, x, base, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, 6 * s);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + 4 * s, base - 70 * s, x + 14 * s, base - 120 * s);
  ctx.stroke();
  const tx = x + 14 * s;
  const ty = base - 120 * s;
  for (let a = -150; a <= 150; a += 38) {
    const rad = ((a - 90) * Math.PI) / 180;
    const ex = tx + Math.cos(rad) * 52 * s;
    const ey = ty + Math.sin(rad) * 20 * s + 16 * s;
    ctx.lineWidth = Math.max(1.5, 3.5 * s);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + (ex - tx) * 0.5, ty - 8 * s, ex, ey);
    ctx.stroke();
  }
}

/** City skyline at dusk, lit windows, sun low behind the towers. */
export function drawSkylineScene(ctx, x, y, w, h, preset) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const pal = preset.stops;
  skyGradient(ctx, x, y, w, h, '#2b1046', '#d64a68', '#ff9440');
  sunDisc(ctx, x + w * 0.68, y + h * 0.52, h * 0.2, '#ffe6a8', 'rgba(255,120,60,0.55)');
  birds(ctx, x, y, w, h, 11, 'rgba(30,10,46,0.9)');
  const r = rng(7);
  // far towers
  let px = x - w * 0.02;
  while (px < x + w) {
    const bw = w * (0.07 + r() * 0.09);
    const bh = h * (0.3 + r() * 0.4);
    ctx.fillStyle = '#241031';
    ctx.fillRect(px, y + h - bh, bw, bh);
    px += bw + w * 0.01;
  }
  // near towers with lit windows
  px = x - w * 0.02;
  while (px < x + w) {
    const bw = w * (0.09 + r() * 0.11);
    const bh = h * (0.2 + r() * 0.3);
    ctx.fillStyle = '#160828';
    ctx.fillRect(px, y + h - bh, bw, bh);
    if (r() < 0.5) {
      ctx.fillRect(px + bw * 0.4, y + h - bh - h * 0.06, w * 0.012, h * 0.06);
    }
    ctx.fillStyle = '#ffc45c';
    for (let i = 0; i < 6; i++) {
      if (r() < 0.6) {
        ctx.fillRect(px + bw * (0.15 + r() * 0.7), y + h - bh + h * (0.08 + r() * 0.7), w * 0.014, h * 0.02);
      }
    }
    px += bw + w * 0.015;
  }
  ctx.fillStyle = '#12061f';
  ctx.fillRect(x, y + h * 0.94, w, h * 0.06);
  ctx.restore();
}

/** A car on a neon street, palm behind, sunset ahead. */
export function drawCarScene(ctx, x, y, w, h, preset) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  skyGradient(ctx, x, y, w, h, '#1c0b3e', '#c23a72', '#ff8a3c');
  sunDisc(ctx, x + w * 0.24, y + h * 0.42, h * 0.16, '#ffe6a8', 'rgba(255,120,60,0.5)');
  birds(ctx, x, y, w, h, 23, 'rgba(30,10,46,0.9)');
  palmTree(ctx, x + w * 0.84, y + h * 0.78, h / 260, '#160828');
  // street
  ctx.fillStyle = '#160828';
  ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#ffb05c';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x + w * (0.04 + i * 0.17), y + h * 0.86, w * 0.07, h * 0.015);
  }
  // car body: a low coupe silhouette with a sunset rim light
  const cy = y + h * 0.72;
  const cw = w * 0.66;
  const cx = x + w * 0.17;
  const ch = h * 0.16;
  ctx.fillStyle = '#0d0518';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + cw * 0.06, cy - ch * 0.42);
  ctx.lineTo(cx + cw * 0.3, cy - ch * 0.78);
  ctx.lineTo(cx + cw * 0.62, cy - ch * 0.78);
  ctx.lineTo(cx + cw * 0.86, cy - ch * 0.42);
  ctx.lineTo(cx + cw * 0.97, cy - ch * 0.18);
  ctx.lineTo(cx + cw, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d0f33';
  ctx.beginPath();
  ctx.moveTo(cx + cw * 0.32, cy - ch * 0.7);
  ctx.lineTo(cx + cw * 0.6, cy - ch * 0.7);
  ctx.lineTo(cx + cw * 0.78, cy - ch * 0.42);
  ctx.lineTo(cx + cw * 0.14, cy - ch * 0.42);
  ctx.closePath();
  ctx.fill();
  // wheels + headlight
  ctx.fillStyle = '#05020c';
  ctx.beginPath();
  ctx.arc(cx + cw * 0.22, cy, ch * 0.34, 0, Math.PI * 2);
  ctx.arc(cx + cw * 0.78, cy, ch * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(cx + cw * 0.9, cy - ch * 0.34, cw * 0.06, ch * 0.12);
  ctx.fillStyle = 'rgba(255,180,90,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx + cw * 0.96, cy - ch * 0.28);
  ctx.lineTo(x + w, cy - ch * 0.55);
  ctx.lineTo(x + w, cy - ch * 0.05);
  ctx.lineTo(cx + cw * 0.96, cy - ch * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Palms and a flamingo by still water at dusk. */
export function drawPalmsScene(ctx, x, y, w, h, preset) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  skyGradient(ctx, x, y, w, h, '#123a5c', '#c96a84', '#ffb25c');
  sunDisc(ctx, x + w * 0.5, y + h * 0.42, h * 0.13, '#ffedbe', 'rgba(255,140,70,0.5)');
  // water with a sun streak
  ctx.fillStyle = '#1d3268';
  ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
  ctx.fillStyle = 'rgba(255,190,110,0.55)';
  for (let i = 0; i < 10; i++) {
    const yy = y + h * (0.64 + i * 0.035);
    const ww = w * (0.1 + 0.02 * ((i * 7) % 5));
    ctx.fillRect(x + w * 0.5 - ww / 2, yy, ww, h * 0.008);
  }
  palmTree(ctx, x + w * 0.16, y + h * 0.66, h / 240, '#0e1a2e');
  palmTree(ctx, x + w * 0.86, y + h * 0.66, h / 300, '#0e1a2e');
  // flamingo silhouette: body, S neck, head, one leg
  ctx.strokeStyle = '#0e1a2e';
  ctx.fillStyle = '#0e1a2e';
  const fx = x + w * 0.44;
  const fy = y + h * 0.68;
  const s = h / 150;
  ctx.beginPath();
  ctx.ellipse(fx, fy, 26 * s, 15 * s, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, 5 * s);
  ctx.beginPath();
  ctx.moveTo(fx + 18 * s, fy - 8 * s);
  ctx.bezierCurveTo(fx + 30 * s, fy - 34 * s, fx + 6 * s, fy - 40 * s, fx + 14 * s, fy - 52 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx + 15 * s, fy - 54 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, 3 * s);
  ctx.beginPath();
  ctx.moveTo(fx, fy + 12 * s);
  ctx.lineTo(fx - 3 * s, fy + 46 * s);
  ctx.stroke();
  birds(ctx, x, y, w, h, 37, 'rgba(20,14,40,0.9)');
  ctx.restore();
}

export const SCENES = {
  skyline: { label: 'Skyline', draw: drawSkylineScene },
  car: { label: 'Street car', draw: drawCarScene },
  palms: { label: 'Palms', draw: drawPalmsScene },
};
