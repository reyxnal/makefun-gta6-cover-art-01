// Wires the editor: photos, caption, preset, size, layout, panel tuning and
// export. A `?shot=` query sets up a fixed scene for screenshots instead.
// Test hooks (used by the headless-browser checks, not by the UI):
//   window.__cover.setState(patch) -> render ms
//   window.__cover.exportPNG()     -> Promise<data URL of the exported PNG>
//   window.__cover.getState()      -> JSON-safe copy of the state
//   window.__shotReady             -> true once the first render finished
//   window.__errors                -> console/page errors seen so far
import { renderCover, exportPNG, ensureFonts } from './cover.js';
import { PRESETS } from './grades.js';
import { SIZES, LAYOUTS } from './layout.js';
import { SCENES } from './scenes.js';
import { runShot } from './shots.js';

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => window.__errors.push('rejection: ' + String(e.reason)));

const SAMPLES = [
  { file: 'pier.jpg', label: 'Pier' },
  { file: 'boulevard.jpg', label: 'Boulevard' },
  { file: 'sample-street.jpg', label: 'Street' },
  { file: 'sample-beach.jpg', label: 'Beach' },
];

const DEFAULT_SLOTS = [
  { kind: 'photo', img: null, zoom: 1, dx: 0, dy: 0 },
  { kind: 'scene', scene: 'car', zoom: 1, dx: 0, dy: 0 },
  { kind: 'scene', scene: 'skyline', zoom: 1, dx: 0, dy: 0 },
  { kind: 'scene', scene: 'palms', zoom: 1, dx: 0, dy: 0 },
];

const state = {
  size: 'square',
  layout: 'mosaic',
  preset: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'You, in Vice City',
  slots: DEFAULT_SLOTS.map((s) => ({ ...s })),
  halftone: 0.55,
  ink: 0.6,
  panel: 0,
};

const preview = document.getElementById('cover');
const statusEl = document.getElementById('status');
const timeEl = document.getElementById('time');
let renderTimer = null;
let lastRenderMs = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + url));
    img.src = url;
  });
}

/** Renders the current state into the preview canvas (scaled to fit). */
export function render() {
  const off = document.createElement('canvas');
  lastRenderMs = renderCover(off, state);
  preview.width = off.width;
  preview.height = off.height;
  const ctx = preview.getContext('2d');
  ctx.drawImage(off, 0, 0);
  if (timeEl) timeEl.textContent = `Rendered in ${Math.round(lastRenderMs)} ms · ${SIZES[state.size].w}×${SIZES[state.size].h}`;
  return lastRenderMs;
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 60);
}

/** Applies a patch to the state (deep for slots) and re-renders. */
function setState(patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'slots' && Array.isArray(v)) {
      v.forEach((slot, i) => {
        if (slot) state.slots[i] = { ...state.slots[i], ...slot };
      });
    } else if (k in state) {
      state[k] = v;
    }
  }
  syncControls();
  return render();
}

window.__cover = {
  setState,
  getState: () => JSON.parse(JSON.stringify(state, (k, v) => (k === 'img' ? (v ? '[image]' : null) : v))),
  exportPNG: async () => {
    const blob = await exportPNG(state);
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  },
  render,
  get lastRenderMs() {
    return lastRenderMs;
  },
};

// ---- controls ----
const $ = (id) => document.getElementById(id);

function segmented(id, values, current, onPick) {
  const el = $(id);
  el.innerHTML = '';
  values.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v.label;
    b.dataset.value = v.value;
    b.className = v.value === current ? 'seg on' : 'seg';
    b.addEventListener('click', () => {
      onPick(v.value);
      syncControls();
      scheduleRender();
    });
    el.appendChild(b);
  });
}

function syncControls() {
  segmented('presets', Object.entries(PRESETS).map(([v, p]) => ({ value: v, label: p.label })), state.preset, (v) => { state.preset = v; });
  segmented('sizes', Object.entries(SIZES).map(([v, s]) => ({ value: v, label: s.label })), state.size, (v) => { state.size = v; });
  segmented('layouts', Object.entries(LAYOUTS).map(([v, l]) => ({ value: v, label: l.label })), state.layout, (v) => { state.layout = v; });
  segmented(
    'panels',
    ['Hero', 'Vignette 1', 'Vignette 2', 'Vignette 3'].map((label, i) => ({ value: i, label })),
    state.panel,
    (v) => { state.panel = v; },
  );
  $('caption').value = state.caption;
  $('subtitle').value = state.subtitle;
  $('halftone').value = state.halftone;
  $('ink').value = state.ink;
  const slot = state.slots[state.panel];
  $('zoom').value = slot.zoom;
  $('panx').value = slot.dx;
  $('pany').value = slot.dy;
  $('zoomVal').textContent = `${slot.zoom.toFixed(2)}×`;
  $('panVal').textContent = `${slot.dx.toFixed(2)}, ${slot.dy.toFixed(2)}`;
  document.querySelectorAll('#samples button').forEach((b) => {
    b.classList.toggle('on', state.slots[state.panel].kind === 'photo' && state.slots[state.panel].sample === b.dataset.file);
  });
}

function buildSamples() {
  const el = $('samples');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.file = s.file;
    b.title = 'Use this photo in the selected panel';
    const img = document.createElement('img');
    img.src = `samples/${s.file}`;
    img.alt = s.label;
    b.appendChild(img);
    const span = document.createElement('span');
    span.textContent = s.label;
    b.appendChild(span);
    b.addEventListener('click', async () => {
      try {
        const imgEl = await loadImage(`samples/${s.file}`);
        state.slots[state.panel] = { ...state.slots[state.panel], kind: 'photo', img: imgEl, sample: s.file };
        statusEl.textContent = `${s.label} loaded into ${['Hero', 'Vignette 1', 'Vignette 2', 'Vignette 3'][state.panel]}.`;
        syncControls();
        scheduleRender();
      } catch (err) {
        statusEl.textContent = 'Could not load sample: ' + err.message;
      }
    });
    el.appendChild(b);
  });
}

$('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4);
  for (let i = 0; i < files.length; i++) {
    const slot = (state.panel + i) % 4;
    const img = await loadImage(URL.createObjectURL(files[i]));
    state.slots[slot] = { ...state.slots[slot], kind: 'photo', img, sample: null };
  }
  statusEl.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} loaded — your photos never leave this machine.`;
  syncControls();
  scheduleRender();
});
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; scheduleRender(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; scheduleRender(); });
$('halftone').addEventListener('input', (e) => { state.halftone = Number(e.target.value); scheduleRender(); });
$('ink').addEventListener('input', (e) => { state.ink = Number(e.target.value); scheduleRender(); });
$('zoom').addEventListener('input', (e) => { state.slots[state.panel].zoom = Number(e.target.value); syncControls(); scheduleRender(); });
$('panx').addEventListener('input', (e) => { state.slots[state.panel].dx = Number(e.target.value); syncControls(); scheduleRender(); });
$('pany').addEventListener('input', (e) => { state.slots[state.panel].dy = Number(e.target.value); syncControls(); scheduleRender(); });
$('scenes').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-scene]');
  if (!b) return;
  state.slots[state.panel] = { ...state.slots[state.panel], kind: 'scene', scene: b.dataset.scene };
  syncControls();
  scheduleRender();
});
$('export').addEventListener('click', async () => {
  const t0 = performance.now();
  statusEl.textContent = 'Exporting…';
  const blob = await exportPNG(state);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sunset-comic-${state.size}-${SIZES[state.size].w}x${SIZES[state.size].h}.png`;
  a.click();
  const ms = Math.round(performance.now() - t0);
  statusEl.textContent = `Saved ${a.download} in ${ms} ms.`;
});

// scene-picker buttons (procedural vignettes)
(() => {
  const el = $('scenes');
  Object.entries(SCENES).forEach(([key, s]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.scene = key;
    b.textContent = s.label;
    el.appendChild(b);
  });
})();

buildSamples();
syncControls();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  await ensureFonts();
  await runShot(shot, query, loadImage, state, setState);
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
} else {
  await ensureFonts();
  // default first view: hero from the pier sample so the cover is alive at once
  try {
    const img = await loadImage('samples/pier.jpg');
    state.slots[0] = { ...state.slots[0], kind: 'photo', img, sample: 'pier.jpg' };
  } catch {
    // offline sample missing: the hero falls back to its procedural scene
  }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
