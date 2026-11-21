// Wires Sunset Cover Studio: photo slots, panel controls, layout and grade
// pickers, caption editing, live preview, and PNG export at the three post
// sizes (1080x1080, 1080x1350, 1920x1080). A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js).
import { drawCover, LAYOUTS } from './cover.js';
import { gradeNames } from './grade.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = [
  { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  { label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
];

/** The editor's starting state: two sample photos loaded, third slot empty. */
export function defaultState() {
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    strength: 0.85,
    caption: 'Sunset Heist',
    kicker: 'Sunset City',
    subcaption: 'Neon nights • One last ride',
    photos: [null, null, null],
    panelPhoto: [0, 1, 0],
    panelZoom: [1, 1, 1],
    // The pier photo's face sits near the top, so its panels start shifted
    // down (negative pan) to keep the face in wide, short panels.
    panelPan: [[0, -0.4], [0, 0], [0, -0.4]],
    activePanel: 0,
  };
}

const state = defaultState();
const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the live preview at preview size. */
export function redraw() {
  drawCover(canvas, state, 720, 720);
  syncPanelControls();
}

/** Exports the cover at an exact post size and downloads it as a PNG. */
export async function exportCover(size) {
  const offscreen = document.createElement('canvas');
  drawCover(offscreen, state, size.width, size.height);
  const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
  if (!blob) {
    status.textContent = 'Export failed: the browser could not make the PNG.';
    return null;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sunset-cover-${size.width}x${size.height}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  status.textContent = `Saved sunset-cover-${size.width}x${size.height}.png (${Math.round(blob.size / 1024)} KiB)`;
  return { width: size.width, height: size.height, bytes: blob.size };
}

/** Reads a photo file into a slot, then redraws. */
async function loadPhotoFile(slot, file) {
  if (!file) return;
  state.photos[slot] = await loadImage(URL.createObjectURL(file));
  redraw();
}

function bindPhotoSlot(slot) {
  document.getElementById(`photo-${slot}`).addEventListener('change', (e) => {
    loadPhotoFile(slot, e.target.files[0]);
  });
  document.getElementById(`sample-${slot}`).addEventListener('click', async () => {
    state.photos[slot] = await loadImage(`samples/${slot === 1 ? 'boulevard' : 'pier'}.jpg`);
    redraw();
  });
}

/** Shows the active panel's photo, zoom and pan in the controls. */
function syncPanelControls() {
  const i = state.activePanel;
  document.getElementById('panel-photo').value = String(state.panelPhoto[i]);
  document.getElementById('panel-zoom').value = String(state.panelZoom[i]);
  document.getElementById('panel-pan-x').value = String(state.panelPan[i][0]);
  document.getElementById('panel-pan-y').value = String(state.panelPan[i][1]);
  document.getElementById('zoom-value').textContent = `${Math.round(state.panelZoom[i] * 100)}%`;
}

function bindPanelControls() {
  document.getElementById('active-panel').addEventListener('change', (e) => {
    state.activePanel = Number(e.target.value);
    syncPanelControls();
  });
  document.getElementById('panel-photo').addEventListener('change', (e) => {
    state.panelPhoto[state.activePanel] = Number(e.target.value);
    redraw();
  });
  document.getElementById('panel-zoom').addEventListener('input', (e) => {
    state.panelZoom[state.activePanel] = Number(e.target.value);
    redraw();
  });
  document.getElementById('panel-pan-x').addEventListener('input', (e) => {
    state.panelPan[state.activePanel][0] = Number(e.target.value);
    redraw();
  });
  document.getElementById('panel-pan-y').addEventListener('input', (e) => {
    state.panelPan[state.activePanel][1] = Number(e.target.value);
    redraw();
  });
}

/** Builds the layout and grade picker buttons from the engine's own lists. */
function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([name, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.layout = name;
    button.addEventListener('click', () => {
      state.layout = name;
      layoutBox.querySelectorAll('button').forEach((b) => b.classList.toggle('picked', b === button));
      redraw();
    });
    if (name === state.layout) button.classList.add('picked');
    layoutBox.appendChild(button);
  });
  const gradeBox = document.getElementById('grades');
  gradeNames().forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    button.dataset.grade = name;
    button.addEventListener('click', () => {
      state.grade = name;
      gradeBox.querySelectorAll('button').forEach((b) => b.classList.toggle('picked', b === button));
      redraw();
    });
    if (name === state.grade) button.classList.add('picked');
    gradeBox.appendChild(button);
  });
}

function bindTextControls() {
  document.getElementById('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    redraw();
  });
  document.getElementById('kicker').addEventListener('input', (e) => {
    state.kicker = e.target.value;
    redraw();
  });
  document.getElementById('subcaption').addEventListener('input', (e) => {
    state.subcaption = e.target.value;
    redraw();
  });
  document.getElementById('strength').addEventListener('input', (e) => {
    state.strength = Number(e.target.value);
    document.getElementById('strength-value').textContent = `${Math.round(state.strength * 100)}%`;
    redraw();
  });
}

function bindExports() {
  const box = document.getElementById('exports');
  EXPORT_SIZES.forEach((size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'export';
    button.textContent = `Export PNG ${size.label}`;
    button.addEventListener('click', () => exportCover(size));
    box.appendChild(button);
  });
}

[0, 1, 2].forEach(bindPhotoSlot);
bindPanelControls();
buildPickers();
bindTextControls();
bindExports();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, { loadImage, redraw, exportCover });
} else {
  Promise.all([
    loadImage('samples/pier.jpg').then((img) => { state.photos[0] = img; }),
    loadImage('samples/boulevard.jpg').then((img) => { state.photos[1] = img; }),
  ]).then(redraw).catch(() => redraw());
  redraw();
}
