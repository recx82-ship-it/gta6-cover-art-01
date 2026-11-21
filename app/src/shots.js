// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows one exported cover alone at the size the query
// names; ?shot=export runs the real export path at an exact post size and
// reports its dimensions in the page. window.__shotReady is set once painted.
import { drawCover } from './cover.js';

/** Loads the two sample photos into the state's first two slots. */
export async function loadSamples(state, loadImage) {
  state.photos[0] = await loadImage('samples/pier.jpg');
  state.photos[1] = await loadImage('samples/boulevard.jpg');
}

/** Applies the query's layout, grade and words to the state. */
export function applyShotQuery(state, query) {
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption')) state.caption = query.get('caption');
  if (query.get('kicker')) state.kicker = query.get('kicker');
  if (query.get('subcaption')) state.subcaption = query.get('subcaption');
}

export async function runShot(shot, query, state, hooks) {
  const canvas = document.getElementById('cover');
  const status = document.getElementById('status');
  await loadSamples(state, hooks.loadImage);
  applyShotQuery(state, query);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const width = Number(query.get('w') ?? 1920);
    const height = Number(query.get('h') ?? 1080);
    drawCover(canvas, state, width, height);
    document.title = `cover ${width}x${height}`;
  } else if (shot === 'export') {
    const width = Number(query.get('w') ?? 1080);
    const height = Number(query.get('h') ?? 1080);
    const offscreen = document.createElement('canvas');
    drawCover(offscreen, state, width, height);
    const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
    window.__exportInfo = { width: offscreen.width, height: offscreen.height, bytes: blob.size };
    document.title = `exported ${offscreen.width}x${offscreen.height} png ${blob.size} bytes`;
    status.textContent = document.title;
    drawCover(canvas, state, 720, 720);
  } else {
    hooks.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
