# Sunset Cover Studio — GTA-style cover maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/recx82-ship-it/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/recx82-ship-it/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A launch-week sharing tool: turn any photo and a caption into poster-style
cover art in the spirit of GTA 6's posters, exported as a PNG to share.
It runs entirely offline in a desktop browser — photos never leave the
machine, there is no upload, no account and no watermark.

## What it does

- **Any photo, up to 4** — pick files or drag and drop them onto the cover.
  Each panel takes its own photo, or one photo can fill every panel.
- **Six multi-panel layouts** — Full Bleed, Duo Split, Hero + Two, Four Grid,
  Tilted Snaps (a rotated snapshot collage) and Strip Trio, in the poster's
  inked white-band style with a Vice City sunset backdrop, sun disc and palm
  silhouettes drawn from scratch.
- **Crop and position per panel** — drag a panel to move its photo, scroll
  (or use the zoom slider) to zoom, shuffle crops for a new arrangement.
- **Caption lettering** — a bold condensed title (bundled Anton, SIL OFL)
  with a neon script subtitle (bundled Pacifico, SIL OFL), colour and
  top/bottom position.
- **Vice City neon-sunset grades** — Sunset, Neon Vice, Heat, Teal Noir and
  Mono Pop, plus halftone dots, grain, vignette and inked borders.
- **One-click export** — PNG at 1080 × 1080, 1080 × 1350 and 1920 × 1080,
  individually or all three at once. Photo in, PNG out in a few clicks.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor chrome styling
- `app/src/cover.js` — the cover rendering engine (layouts, grades, lettering, effects)
- `app/src/app.js` — editor wiring, export and screenshot scenes
- `app/fonts/` — Anton and Pacifico (SIL Open Font License, texts beside them)
- `app/samples/` — the kit's two sample photos, free to use
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output`
  and writes `dossier.json`
- `screenshots/` — the cover and the editor at work, taken with headless Chrome

## Build the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node cli/makefun.mjs check --kit . --repo <this repository>
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
