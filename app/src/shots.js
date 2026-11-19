// Fixed scenes for screenshots: ?shot=editor shows the editor with photos
// loaded; ?shot=cover, ?shot=cover-portrait and ?shot=cover-wide show the
// exported cover alone at each post size. window.__shotReady is set by main.js
// once the scene has painted.
//
// Slot picks are deliberate: a tall hero wants a photo whose subject fills the
// frame (pier), a wide hero wants a horizontal scene (beach), and short wide
// vignettes use procedural scenes, which fill any aspect ratio — a portrait
// photo in a short wide panel would crop the face away.
export async function runShot(shot, query, loadImage, state, setState) {
  const scenes = {
    editor: {
      preset: 'sunset', size: 'square', layout: 'mosaic',
      caption: 'Sunset Heist', subtitle: 'You, in Vice City',
      slots: [{ photo: 'pier.jpg' }, { photo: 'boulevard.jpg' }, { photo: 'sample-street.jpg' }, { photo: 'sample-beach.jpg' }],
    },
    cover: {
      preset: 'sunset', size: 'square', layout: 'mosaic',
      caption: 'Sunset Heist', subtitle: 'You, in Vice City',
      slots: [{ photo: 'pier.jpg' }, { photo: 'boulevard.jpg' }, { photo: 'sample-street.jpg' }, { photo: 'sample-beach.jpg' }],
    },
    'cover-portrait': {
      preset: 'neon', size: 'portrait', layout: 'mosaic',
      caption: 'Neon Streets', subtitle: 'After dark in the city',
      slots: [{ photo: 'pier.jpg' }, { photo: 'sample-street.jpg' }, { photo: 'sample-beach.jpg' }, { photo: 'boulevard.jpg' }],
    },
    'cover-wide': {
      preset: 'pastel', size: 'wide', layout: 'triptych',
      caption: 'Ocean Drive', subtitle: 'Golden hour, every hour',
      slots: [{ photo: 'sample-street.jpg', dy: -0.3 }, { scene: 'car' }, { scene: 'skyline' }, { scene: 'palms' }],
    },
  };
  const scene = scenes[shot] || scenes.editor;
  if (shot !== 'editor') document.body.classList.add('shot-cover');
  // tall portrait photos in short wide vignettes: pan toward the top so faces
  // stay in frame instead of being cropped away by the centred cover-fit
  const topBias = { 'boulevard.jpg': 0.55 };
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const spec = scene.slots[i];
    if (spec.scene) {
      slots.push({ kind: 'scene', scene: spec.scene, zoom: 1, dx: 0, dy: 0 });
    } else {
      const img = await loadImage(`samples/${spec.photo}`);
      slots.push({ kind: 'photo', img, sample: spec.photo, zoom: 1, dx: 0, dy: spec.dy ?? topBias[spec.photo] ?? 0 });
    }
  }
  setState({
    preset: scene.preset,
    size: scene.size,
    layout: scene.layout,
    caption: scene.caption,
    subtitle: scene.subtitle,
    slots,
  });
}
