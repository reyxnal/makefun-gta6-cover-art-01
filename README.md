# Sunset Comic — You, in Vice City

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/reyxnal/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/reyxnal/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your photo and a caption into comic-book cover art in
the style of a Vice City sunset poster — a multi-panel mosaic with bold
lettering, exported as a PNG to share. Built for the
[make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).

## How it works

1. Drop in up to 4 photos (or pick a sample) — the first fills the hero
   panel, the rest fill the three vignettes. Your photos never leave your
   machine; everything runs offline from static files.
2. Type a caption and a subtitle.
3. Pick a grade — **Sunset**, **Neon Night** or **Pastel Day** — a post size
   (1080×1080, 1080×1350 or 1920×1080) and a layout (Mosaic, Triptych or
   Single photo).
4. Tune any panel: zoom, pan, halftone strength, ink outline — or swap a
   panel for a hand-drawn procedural scene (skyline, street car, palms).
5. Export PNG. Photo to finished cover in well under a second of rendering.

## The comic pipeline

Each panel is drawn, then graded (a sunset duotone mapped through the
photo's own luminance, so the photo keeps its identity), screened with a
halftone dot pattern, inked with a Sobel edge outline, and grained — the
same print treatment on photos and on the procedural scenes, so the whole
cover shares one look. Lettering is Archivo Black with a comic slant,
subtitle in Oswald; both fonts ship under `app/fonts/` under the SIL Open
Font License.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Handing it in

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the kit's vendored library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See [LICENSE](LICENSE).
