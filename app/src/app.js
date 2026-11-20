// Sunset Cover Studio — editor wiring: photo slots, drag-to-pan and scroll-to-zoom
// per panel, layout / grade / caption controls, PNG export at the three post
// sizes, and the ?shot=cover / ?shot=editor scenes the screenshots are taken in.

import { LAYOUTS, GRADES, SIZES, paintCover, defaultState } from './cover.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
let activePanel = 0;
let selectedPhoto = 0;

const preview = $('preview');
const pctx = preview.getContext('2d');

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function repaint() {
  const size = currentSize();
  preview.width = size.w;
  preview.height = size.h;
  paintCover(pctx, size.w, size.h, state);
  renderSlots();
  $('status').textContent =
    `Ready — ${LAYOUTS[state.layout].label} · ${GRADES[state.grade].label} · ${size.label}.`;
}

function renderSlots() {
  const strip = $('slots');
  strip.innerHTML = '';
  const count = (LAYOUTS[state.layout] || LAYOUTS.hero).panels;
  for (let i = 0; i < count; i++) {
    const slot = state.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const btn = document.createElement('button');
    btn.className = 'slot' + (i === activePanel ? ' active' : '');
    btn.type = 'button';
    const photo = state.photos[slot.photo];
    btn.innerHTML = photo
      ? `<img alt="panel ${i + 1} photo" src="${photo.url}"><span>Panel ${i + 1} · ${photo.name}</span>`
      : `<span>Panel ${i + 1} · empty</span>`;
    btn.addEventListener('click', () => {
      activePanel = i;
      repaint();
    });
    strip.appendChild(btn);
  }
  const thumbs = $('thumbs');
  thumbs.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb' + (i === selectedPhoto ? ' active' : '');
    btn.type = 'button';
    btn.innerHTML = `<img alt="${photo.name}" src="${photo.url}"><span>${photo.name}</span>`;
    btn.addEventListener('click', () => {
      selectedPhoto = i;
      const slot = state.slots[activePanel] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
      slot.photo = i;
      state.slots[activePanel] = slot;
      repaint();
    });
    thumbs.appendChild(btn);
  });
}

function loadImage(url, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, url, name });
    img.onerror = () => reject(new Error(`could not load ${name}`));
    img.src = url;
  });
}

async function loadSamples() {
  try {
    const pier = await loadImage('samples/pier.jpg', 'Pier');
    const boulevard = await loadImage('samples/boulevard.jpg', 'Boulevard');
    state.photos = [pier, boulevard];
  } catch (err) {
    $('status').textContent = `Sample photos failed to load: ${err.message}`;
  }
  repaint();
}

function bindControls() {
  const layouts = $('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.layout = key;
    btn.textContent = def.label;
    if (key === state.layout) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.layout = key;
      activePanel = 0;
      staggerCrops();
      layouts.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      repaint();
    });
    layouts.appendChild(btn);
  });

  const grades = $('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.grade = key;
    btn.textContent = def.label;
    if (key === state.grade) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.grade = key;
      grades.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      repaint();
    });
    grades.appendChild(btn);
  });

  const sizes = $('sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.size = key;
    btn.textContent = def.label;
    if (key === state.size) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.size = key;
      sizes.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      repaint();
    });
    sizes.appendChild(btn);
  });

  $('title').addEventListener('input', (e) => { state.title = e.target.value; repaint(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; repaint(); });
  $('caption-pos').addEventListener('change', (e) => { state.captionPos = e.target.value; repaint(); });
  $('title-color').addEventListener('input', (e) => { state.titleColor = e.target.value; repaint(); });

  Object.entries(state.effects).forEach(([key, on]) => {
    const box = $(`fx-${key}`);
    if (!box) return;
    box.checked = on;
    box.addEventListener('change', () => { state.effects[key] = box.checked; repaint(); });
  });

  $('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      if (state.photos.length >= 4) break;
      const url = URL.createObjectURL(file);
      try {
        const photo = await loadImage(url, file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo');
        state.photos.push(photo);
        selectedPhoto = state.photos.length - 1;
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    repaint();
  });

  $('shuffle').addEventListener('click', () => {
    state.slots.forEach((slot, i) => {
      slot.zoom = 1 + ((i * 37) % 40) / 100;
      slot.ox = ((i * 13) % 21 - 10) / 100;
      slot.oy = ((i * 7) % 15 - 7) / 100;
    });
    repaint();
  });

  // Drag to pan the active panel, scroll to zoom it.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const slot = state.slots[activePanel] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    slot.ox += (e.clientX - lastX) / rect.width;
    slot.oy += (e.clientY - lastY) / rect.height;
    slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox));
    slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy));
    state.slots[activePanel] = slot;
    lastX = e.clientX;
    lastY = e.clientY;
    repaint();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.slots[activePanel] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    state.slots[activePanel] = slot;
    repaint();
  }, { passive: false });

  $('export-one').addEventListener('click', () => exportCover(state.size));
  $('export-all').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) {
      // eslint-disable-next-line no-await-in-loop
      await exportCover(key);
    }
    $('status').textContent = 'Exported all 3 sizes.';
  });
}

function renderToBlob(sizeKey) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  paintCover(canvas.getContext('2d'), size.w, size.h, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const blob = await renderToBlob(sizeKey);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sunset-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $('status').textContent = `Exported ${size.w} × ${size.h} PNG.`;
}

// Screenshot scenes: ?shot=cover draws the exported cover full-frame at the
// gate's size limits; ?shot=editor shows the editor with a photo loaded.
// Spread one photo's slices across the panels: without this, a full-width
// layout such as Strip Trio shows the same middle slice three times.
function staggerCrops() {
  const count = (LAYOUTS[state.layout] || LAYOUTS.hero).panels;
  for (let i = 0; i < count; i++) {
    const slot = state.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    if (state.layout === 'strips') {
      slot.zoom = 1.25;
      slot.ox = i % 2 ? 0.05 : -0.05;
      slot.oy = (1 - i) * 0.18; // top strip shows the top of the photo, and so on down
    } else if (state.layout === 'hero' && i === 0) {
      slot.zoom = 1.05;
      slot.oy = 0.08;
    }
    state.slots[i] = slot;
  }
}

function syncPickerButtons() {
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
}

async function runShotScene() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  const photo = params.get('photo');
  const caption = params.get('caption');
  const layout = params.get('layout');
  const size = params.get('size');
  if (photo) {
    const idx = state.photos.findIndex((p) => p.name.toLowerCase() === photo.toLowerCase());
    if (idx >= 0) {
      state.slots.forEach((slot) => { slot.photo = idx; });
      selectedPhoto = idx;
    }
  }
  if (caption) {
    state.title = caption;
    $('title').value = caption;
  }
  if (layout && LAYOUTS[layout]) state.layout = layout;
  if (size && SIZES[size]) state.size = size;
  staggerCrops();
  syncPickerButtons();
  await document.fonts.ready;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    repaint();
    // Draw the cover itself to fill the viewport for the screenshot.
    const canvas = preview;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.maxWidth = 'none';
    canvas.style.maxHeight = 'none';
  } else {
    document.body.classList.add('shot-editor');
    repaint();
  }
  window.__shotReady = true;
}

async function init() {
  bindControls();
  await document.fonts.ready;
  await loadSamples();
  await runShotScene();
  if (!new URLSearchParams(location.search).get('shot')) {
    window.__shotReady = true;
  }
}

init();
