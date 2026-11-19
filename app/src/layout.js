// Cover geometry: export sizes and the three panel layouts. All rects are
// fractions of the export canvas, so one layout works at every post size.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

// Each layout returns panel rects as {x, y, w, h} fractions plus the caption
// band rect. Slot 0 is the hero, slots 1-3 are the vignettes.
export const LAYOUTS = {
  mosaic: {
    label: 'Mosaic',
    panels(w, h) {
      const band = 0.24;
      const top = 1 - band;
      const gap = 0.008;
      const heroW = 0.63;
      const colX = heroW + gap;
      const colW = 1 - colX;
      const vh = (top - gap * 2) / 3;
      return [
        { x: 0, y: 0, w: heroW, h: top },
        { x: colX, y: 0, w: colW, h: vh },
        { x: colX, y: vh + gap, w: colW, h: vh },
        { x: colX, y: (vh + gap) * 2, w: colW, h: vh },
      ];
    },
    band: { x: 0, y: 0.76, w: 1, h: 0.24 },
  },
  triptych: {
    label: 'Triptych',
    panels(w, h) {
      const band = 0.24;
      const heroH = 0.56;
      const rowY = heroH + 0.008;
      const rowH = 1 - band - rowY;
      const vw = (1 - 0.016) / 3;
      return [
        { x: 0, y: 0, w: 1, h: heroH },
        { x: 0, y: rowY, w: vw, h: rowH },
        { x: vw + 0.008, y: rowY, w: vw, h: rowH },
        { x: (vw + 0.008) * 2, y: rowY, w: vw, h: rowH },
      ];
    },
    band: { x: 0, y: 0.76, w: 1, h: 0.24 },
  },
  single: {
    label: 'Single photo',
    panels(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    },
    band: { x: 0, y: 0.76, w: 1, h: 0.24 },
  },
};
