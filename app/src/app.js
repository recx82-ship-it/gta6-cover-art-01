// Sunset Cover Studio — editor wiring, export and screenshot scenes.
import { SIZES, LAYOUTS, GRADES, layoutPanels, drawCover } from "./cover.js";

const $ = (id) => document.getElementById(id);
const preview = $("preview");
const pctx = preview.getContext("2d");

const state = {
  photos: [], // { img, name, src }
  assignments: [0, 0, 0, 0],
  // Default crops are staggered per panel, so one photo filling several
  // panels still shows a different slice in each of them. Positive dy
  // slides the photo down, so the panel shows the photo's upper part.
  crops: [
    { zoom: 1.12, dx: 0, dy: 0.12 },
    { zoom: 1.12, dx: 0, dy: -0.1 },
    { zoom: 1.12, dx: 0.08, dy: 0.2 },
    { zoom: 1.05, dx: -0.08, dy: 0 },
  ],
  selected: 0,
  layout: "hero",
  grade: "sunset",
  title: "Sunset Heist",
  subtitle: "one last ride",
  titleColor: "#ffffff",
  titlePos: "bottom",
  size: "1080x1080",
  effects: { halftone: true, grain: true, vignette: true, ink: true },
  seed: 11,
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function render() {
  const [w, h] = SIZES[state.size];
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(pctx, {
    photos: state.photos.map((p) => p.img),
    assignments: state.assignments,
    crops: state.crops,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    titleColor: state.titleColor,
    titlePos: state.titlePos,
    effects: state.effects,
    seed: state.seed,
  });
  drawSelection();
  $("hint").style.display = state.photos.length ? "none" : "block";
}

function drawSelection() {
  const [w, h] = SIZES[state.size];
  const panels = layoutPanels(state.layout, w, h);
  const panel = panels[state.selected];
  if (!panel || !state.photos.length) return;
  pctx.save();
  pctx.strokeStyle = "#ffd166";
  pctx.lineWidth = Math.max(3, Math.min(w, h) * 0.008);
  pctx.setLineDash([18, 10]);
  pctx.strokeRect(
    panel.x * w + 4,
    panel.y * h + 4,
    panel.w * w - 8,
    panel.h * h - 8,
  );
  pctx.restore();
}

function setStatus(text) {
  $("status").textContent = text;
}

function loadImage(src, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, name, src });
    img.onerror = () => reject(new Error(`Could not load ${name}`));
    img.src = src;
  });
}

async function addPhotoFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const url = URL.createObjectURL(file);
    try {
      const photo = await loadImage(url, file.name);
      state.photos.push(photo);
    } catch (e) {
      setStatus(e.message);
    }
  }
  if (state.photos.length) {
    state.assignments = state.assignments.map((_, i) => i % state.photos.length);
  }
  refreshPhotos();
  render();
  setStatus(`${state.photos.length} photo${state.photos.length === 1 ? "" : "s"} loaded.`);
}

async function loadSamples() {
  const samples = [
    ["samples/pier.jpg", "pier.jpg"],
    ["samples/boulevard.jpg", "boulevard.jpg"],
  ];
  for (const [src, name] of samples) {
    if (state.photos.some((p) => p.name === name)) continue;
    try {
      state.photos.push(await loadImage(src, name));
    } catch (e) {
      setStatus(e.message);
    }
  }
  state.assignments = state.assignments.map((_, i) => i % Math.max(1, state.photos.length));
  refreshPhotos();
  render();
}

function refreshPhotos() {
  const row = $("photos");
  row.innerHTML = "";
  if (!state.photos.length) {
    row.innerHTML = '<span class="empty">No photos yet — add some, or use the samples.</span>';
  }
  state.photos.forEach((photo, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "thumb";
    b.title = photo.name;
    b.innerHTML = "";
    const im = document.createElement("img");
    im.src = photo.src;
    im.alt = photo.name;
    b.appendChild(im);
    b.addEventListener("click", () => {
      state.assignments[state.selected] = i;
      refreshPhotos();
      render();
    });
    row.appendChild(b);
  });

  const slots = $("slots");
  slots.innerHTML = "";
  const panels = layoutPanels(state.layout, 1, 1);
  panels.forEach((_, i) => {
    const photo = state.photos[state.assignments[i]];
    const s = document.createElement("button");
    s.type = "button";
    s.className = "slot" + (i === state.selected ? " active" : "");
    if (photo) {
      const im = document.createElement("img");
      im.src = photo.src;
      im.alt = photo.name;
      s.appendChild(im);
    }
    const label = document.createElement("span");
    label.textContent = `Panel ${i + 1} — ${photo ? photo.name : "empty"}`;
    s.appendChild(label);
    s.addEventListener("click", () => {
      state.selected = i;
      $("zoom").value = Math.round((state.crops[i].zoom || 1) * 100);
      refreshPhotos();
      render();
    });
    slots.appendChild(s);
  });
}

function bindChoices(id, attr, apply) {
  $(id).addEventListener("click", (e) => {
    const btn = e.target.closest(`button[data-${attr}]`);
    if (!btn) return;
    apply(btn.dataset[attr]);
    [...$(id).querySelectorAll("button")].forEach((b) =>
      b.classList.toggle("active", b === btn),
    );
    render();
  });
}

function markActive(id, attr, value) {
  [...$(id).querySelectorAll("button")].forEach((b) =>
    b.classList.toggle("active", b.dataset[attr] === value),
  );
}

function exportCover(sizeKey) {
  const [w, h] = SIZES[sizeKey];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext("2d"), {
    photos: state.photos.map((p) => p.img),
    assignments: state.assignments,
    crops: state.crops,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    titleColor: state.titleColor,
    titlePos: state.titlePos,
    effects: state.effects,
    seed: state.seed,
  });
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve({ blob, width: w, height: h }), "image/png");
  });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cover";
}

// ---- pointer: pick a panel, drag to pan its photo, wheel to zoom ----
let drag = null;
function canvasPoint(e) {
  const r = preview.getBoundingClientRect();
  const [w, h] = SIZES[state.size];
  return {
    x: ((e.clientX - r.left) / r.width) * w,
    y: ((e.clientY - r.top) / r.height) * h,
    w,
    h,
  };
}
preview.addEventListener("pointerdown", (e) => {
  const p = canvasPoint(e);
  const panels = layoutPanels(state.layout, p.w, p.h);
  const hit = panels.findIndex(
    (pn) => p.x >= pn.x * p.w && p.x <= (pn.x + pn.w) * p.w &&
      p.y >= pn.y * p.h && p.y <= (pn.y + pn.h) * p.h,
  );
  if (hit >= 0) {
    state.selected = hit;
    $("zoom").value = Math.round((state.crops[hit].zoom || 1) * 100);
    refreshPhotos();
  }
  drag = { x: e.clientX, y: e.clientY, panel: state.selected };
  preview.setPointerCapture(e.pointerId);
  render();
});
preview.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const r = preview.getBoundingClientRect();
  const [w, h] = SIZES[state.size];
  const crop = state.crops[drag.panel];
  crop.dx += ((e.clientX - drag.x) / r.width) * (w / Math.min(w, h)) * 0.9;
  crop.dy += ((e.clientY - drag.y) / r.height) * (h / Math.min(w, h)) * 0.9;
  crop.dx = Math.max(-0.6, Math.min(0.6, crop.dx));
  crop.dy = Math.max(-0.6, Math.min(0.6, crop.dy));
  drag.x = e.clientX;
  drag.y = e.clientY;
  render();
});
preview.addEventListener("pointerup", () => { drag = null; });
preview.addEventListener("wheel", (e) => {
  e.preventDefault();
  const crop = state.crops[state.selected];
  crop.zoom = Math.max(1, Math.min(2.6, (crop.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
  $("zoom").value = Math.round(crop.zoom * 100);
  render();
}, { passive: false });

// ---- controls ----
$("photo").addEventListener("change", (e) => addPhotoFiles([...e.target.files]));
$("use-samples").addEventListener("click", loadSamples);
$("fill-all").addEventListener("click", () => {
  if (!state.photos.length) return;
  state.assignments = state.assignments.map((_, i) => i % state.photos.length);
  render();
});
$("shuffle").addEventListener("click", () => {
  state.crops = state.crops.map(() => ({
    zoom: 1 + Math.random() * 0.5,
    dx: (Math.random() - 0.5) * 0.5,
    dy: (Math.random() - 0.5) * 0.5,
  }));
  state.seed = Math.floor(Math.random() * 1000);
  render();
});
bindChoices("layouts", "layout", (v) => { state.layout = v; });
bindChoices("grades", "grade", (v) => { state.grade = v; });
bindChoices("sizes", "size", (v) => { state.size = v; });
bindChoices("title-pos", "pos", (v) => { state.titlePos = v; });
$("title-colors").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-color]");
  if (!btn) return;
  state.titleColor = btn.dataset.color;
  [...$("title-colors").querySelectorAll("button")].forEach((b) =>
    b.classList.toggle("active", b === btn),
  );
  render();
});
$("title").addEventListener("input", (e) => { state.title = e.target.value; render(); });
$("subtitle").addEventListener("input", (e) => { state.subtitle = e.target.value; render(); });
$("zoom").addEventListener("input", (e) => {
  state.crops[state.selected].zoom = e.target.value / 100;
  render();
});
for (const key of ["halftone", "grain", "vignette", "ink"]) {
  $(`fx-${key}`).addEventListener("change", (e) => {
    state.effects[key] = e.target.checked;
    render();
  });
}
$("export").addEventListener("click", async () => {
  if (!state.photos.length) { setStatus("Add a photo first."); return; }
  const { blob, width, height } = await exportCover(state.size);
  download(blob, `sunset-cover-${slug(state.title)}-${state.size}.png`);
  setStatus(`Exported ${width} × ${height} PNG (${Math.round(blob.size / 1024)} KB).`);
});
$("export-all").addEventListener("click", async () => {
  if (!state.photos.length) { setStatus("Add a photo first."); return; }
  for (const size of Object.keys(SIZES)) {
    const { blob } = await exportCover(size);
    download(blob, `sunset-cover-${slug(state.title)}-${size}.png`);
    await new Promise((r) => setTimeout(r, 250));
  }
  setStatus("Exported all 3 sizes.");
});

// Drag and drop photos onto the whole page.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer?.files?.length) addPhotoFiles([...e.dataTransfer.files]);
});

// ---- screenshot scenes (?shot=cover | ?shot=editor) ----
async function applyShotParams() {
  const q = new URLSearchParams(location.search);
  const photo = q.get("photo");
  const caption = q.get("caption");
  const sub = q.get("subtitle");
  const layout = q.get("layout");
  const grade = q.get("grade");
  const size = q.get("size");
  if (caption) { state.title = caption; $("title").value = caption; }
  if (sub) { state.subtitle = sub; $("subtitle").value = sub; }
  if (layout && LAYOUTS[layout]) { state.layout = layout; markActive("layouts", "layout", layout); }
  if (grade && GRADES[grade]) { state.grade = grade; markActive("grades", "grade", grade); }
  if (size && SIZES[size]) { state.size = size; markActive("sizes", "size", size); }
  if (photo) {
    await loadSamples();
    const idx = state.photos.findIndex((p) => p.name.startsWith(photo));
    if (idx >= 0) {
      state.assignments = state.assignments.map((_, i) => idx);
      state.photos = [state.photos[idx], ...state.photos.filter((_, j) => j !== idx)];
      state.assignments = state.assignments.map(() => 0);
    }
  }
  await document.fonts.ready;
  render();
}

async function runShotScene() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  if (!shot) return;
  await applyShotParams();
  if (shot === "cover") {
    document.body.classList.add("cover-scene");
    let stage = $("cover-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "cover-stage";
      const c = document.createElement("canvas");
      c.id = "cover-canvas";
      stage.appendChild(c);
      document.body.appendChild(stage);
    }
    const canvas = $("cover-canvas");
    const [w, h] = SIZES[state.size];
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas.getContext("2d"), {
      photos: state.photos.map((p) => p.img),
      assignments: state.assignments,
      crops: state.crops,
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      titleColor: state.titleColor,
      titlePos: state.titlePos,
      effects: state.effects,
      seed: state.seed,
    });
  }
  window.__shotReady = true;
}

// Test hook: export without a download, for automated checks.
window.__coverApp = {
  state,
  render,
  loadSamples,
  exportPNG: async (sizeKey) => {
    const { blob, width, height } = await exportCover(sizeKey);
    const buf = new Uint8Array(await blob.arrayBuffer());
    return { width, height, bytes: buf.length, head: [...buf.slice(0, 8)] };
  },
};

markActive("layouts", "layout", state.layout);
markActive("grades", "grade", state.grade);
markActive("sizes", "size", state.size);
markActive("title-pos", "pos", state.titlePos);
refreshPhotos();
render();
runShotScene();
