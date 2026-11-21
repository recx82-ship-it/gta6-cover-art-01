# Sunset Cover Studio

A web app that turns a person's photo and a caption into GTA-style poster cover art, and exports it as a PNG to share. It runs offline in a desktop browser from its own files: open `app/index.html` (or serve `app/` with any static server, e.g. `node serve.ts` then http://localhost:8080) and it works with no network request. Photos are read on your own machine and never uploaded.

## How it works

1. **Photos** — load up to three photos from your machine (Photo A, B and C), or use the two included sample photos (made with an image model, free to use). Each panel can take any of the three photos, or a sunset sky with no photo.
2. **Panels** — pick a panel and crop and position its photo: zoom in, and move it left/right and up/down. One photo can fill several panels, or each panel can hold a different photo.
3. **Layout & grade** — four multi-panel poster layouts (Vice Grid, Sunset Strip, Neon Duo, Full Bleed) and four colour grades (Vice Sunset, Neon Nights, Golden Hour, Midnight Noir), with a grade-strength slider. Every panel gets the sunset wash, a low sun glow, a vignette and film grain.
4. **Words** — write and edit the kicker, the bold poster caption (set in heavy capitals with a neon shadow) and the sub-caption. The live preview updates as you type.
5. **Export PNG** — one click exports the cover at exactly **1080 x 1080**, **1080 x 1350** or **1920 x 1080**.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the sunset editor theme
- `app/src/main.js` — wires the controls, photo slots, live preview and export
- `app/src/cover.js` — the cover engine: panel layouts, photo placement, caption lettering
- `app/src/grade.js` — the sunset / neon colour grades, sun glow, vignette and grain
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor`, `?shot=cover`, `?shot=export`)
- `app/samples/` — the two sample photos (image-model-made, free to use)
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — a tiny static server for trying the app locally

Everything in the app is original: no Rockstar Games logo, wordmark, official artwork, character or font. The lettering uses system fonts only.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/recx82-ship-it/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/recx82-ship-it/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

<sub>Entered on [make.fun](https://make.fun/?ref=17s3abg9&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
