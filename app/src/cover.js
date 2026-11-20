// Sunset Cover Studio — cover rendering engine (pure 2D canvas, no libraries).
// One function, paintCover, turns a cover state into finished poster art on any
// canvas: a Vice City style sunset backdrop, up to four photo panels in one of
// six layouts, a neon colour grade, inked bands, halftone, grain, vignette and
// bold Anton title lettering with a Pacifico neon subtitle.

export const LAYOUTS = {
  full: { label: 'Full bleed', panels: 1 },
  duo: { label: 'Duo split', panels: 2 },
  hero: { label: 'Hero + two', panels: 3 },
  grid: { label: 'Four grid', panels: 4 },
  tilt: { label: 'Tilted snaps', panels: 3 },
  strips: { label: 'Strip trio', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Sunset', sky: ['#2b1055', '#ff6b35', '#f7c548'], tint: '#ff8c42', glow: '#ffd166' },
  neon: { label: 'Neon Vice', sky: ['#12002e', '#ff2e88', '#00e5ff'], tint: '#ff2e88', glow: '#00e5ff' },
  heat: { label: 'Heat', sky: ['#3d0c02', '#e63b12', '#ffb347'], tint: '#e63b12', glow: '#ffdf6b' },
  teal: { label: 'Teal Noir', sky: ['#02141f', '#0e5a6d', '#2dd4bf'], tint: '#0e7490', glow: '#5eead4' },
  mono: { label: 'Mono Pop', sky: ['#111111', '#555555', '#f5f5f5'], tint: '#ffffff', glow: '#ffde59' },
};

export const SIZES = {
  square: { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

// A tiny seeded random so grain and palm wobble are identical on every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Panel rectangles for a layout, in 0..1 cover space. rot is in degrees.
function panelRects(layout, w, h) {
  const band = 0.012; // white band between panels, as a share of the short side
  const g = band * Math.min(w, h) / w;
  const gv = band * Math.min(w, h) / h;
  switch (layout) {
    case 'full':
      return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
    case 'duo':
      return [
        { x: 0, y: 0, w: 0.5 - g / 2, h: 1, rot: 0 },
        { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 1, rot: 0 },
      ];
    case 'hero':
      return [
        { x: 0, y: 0, w: 1, h: 0.62 - gv / 2, rot: 0 },
        { x: 0, y: 0.62 + gv / 2, w: 0.5 - g / 2, h: 0.38 - gv / 2, rot: 0 },
        { x: 0.5 + g / 2, y: 0.62 + gv / 2, w: 0.5 - g / 2, h: 0.38 - gv / 2, rot: 0 },
      ];
    case 'grid':
      return [
        { x: 0, y: 0, w: 0.5 - g / 2, h: 0.5 - gv / 2, rot: 0 },
        { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 0.5 - gv / 2, rot: 0 },
        { x: 0, y: 0.5 + gv / 2, w: 0.5 - g / 2, h: 0.5 - gv / 2, rot: 0 },
        { x: 0.5 + g / 2, y: 0.5 + gv / 2, w: 0.5 - g / 2, h: 0.5 - gv / 2, rot: 0 },
      ];
    case 'tilt':
      return [
        { x: 0.07, y: 0.06, w: 0.52, h: 0.52, rot: -4 },
        { x: 0.44, y: 0.30, w: 0.50, h: 0.46, rot: 3 },
        { x: 0.12, y: 0.62, w: 0.62, h: 0.30, rot: -1.5 },
      ];
    case 'strips':
    default:
      return [
        { x: 0, y: 0, w: 1, h: 0.34 - gv, rot: 0 },
        { x: 0, y: 0.34, w: 1, h: 0.32 - gv, rot: 0 },
        { x: 0, y: 0.66, w: 1, h: 0.34 - gv, rot: 0 },
      ];
  }
}

function drawPalm(ctx, x, y, s, lean, rng) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  // Trunk, gently curved, kept short so only the crown peeks into frame.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -42, 2, -88);
  ctx.stroke();
  // Fronds fanning from the crown, short and tight.
  for (let i = 0; i < 7; i++) {
    const a = (-150 + i * 50) * (Math.PI / 180) + (rng() - 0.5) * 0.1;
    const len = 34 + rng() * 16;
    const tipX = 2 + Math.cos(a) * len;
    const tipY = -88 + Math.sin(a) * len * 0.6;
    ctx.beginPath();
    ctx.moveTo(2, -88);
    ctx.quadraticCurveTo(2 + Math.cos(a) * len * 0.5, -88 + Math.sin(a) * len * 0.75, tipX, tipY);
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackdrop(ctx, w, h, grade, showPalms) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Sun disc with a soft halo.
  const cx = w * 0.5;
  const cy = h * 0.42;
  const r = Math.min(w, h) * 0.17;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  halo.addColorStop(0, grade.glow + 'aa');
  halo.addColorStop(1, grade.glow + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Horizon glow band.
  const horizon = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.8);
  horizon.addColorStop(0, grade.glow + '00');
  horizon.addColorStop(0.5, grade.glow + '55');
  horizon.addColorStop(1, grade.glow + '00');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, h * 0.62, w, h * 0.18);
  // Palm silhouettes only where the backdrop is actually visible: in the
  // edge-to-edge layouts they would only poke through the band gaps as smudges.
  if (showPalms) {
    const rng = mulberry32(20261120);
    drawPalm(ctx, w * 0.02, h * 1.02, Math.min(w, h) / 900, 0.22, rng);
    drawPalm(ctx, w * 0.99, h * 1.03, Math.min(w, h) / 1100, -0.3, rng);
    drawPalm(ctx, w * 0.9, h * 1.0, Math.min(w, h) / 1400, -0.12, rng);
  }
}

function drawPhotoInto(ctx, img, rect, zoom, ox, oy, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + ox * w;
    const dy = y + (h - dh) / 2 + oy * h;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = '#241a33';
    ctx.fillRect(x, y, w, h);
  }
  // Grade wash: a warm tint plus a vertical light falloff.
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const fall = ctx.createLinearGradient(0, y, 0, y + h);
  fall.addColorStop(0, grade.sky[0] + '30');
  fall.addColorStop(1, grade.sky[2] + '22');
  ctx.fillStyle = fall;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Inked white band around the panel.
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawHalftone(ctx, w, h, color) {
  const step = Math.max(10, Math.min(w, h) / 64);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  for (let yy = h * 0.06; yy < h * 0.24; yy += step) {
    for (let xx = w * 0.62; xx < w * 0.97; xx += step) {
      const r = step * 0.28 * (1 - (yy - h * 0.06) / (h * 0.18));
      ctx.beginPath();
      ctx.arc(xx, yy, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h) {
  const rng = mulberry32(77);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#000000';
  const n = Math.floor((w * h) / 9000);
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rng() * w, rng() * h, 1.6, 1.6);
  }
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n / 2; i++) {
    ctx.fillRect(rng() * w, rng() * h, 1.2, 1.2);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, '#00000000');
  g.addColorStop(1, '#00000088');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, fontFamily, maxWidth, startPx) {
  let px = startPx;
  ctx.font = `900 ${px}px ${fontFamily}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `900 ${px}px ${fontFamily}`;
  }
  return px;
}

function drawLettering(ctx, w, h, state) {
  const { title, subtitle, captionPos, titleColor } = state;
  const pad = Math.min(w, h) * 0.045;
  const bandH = Math.min(w, h) * 0.17;
  const top = captionPos === 'top';
  const by = top ? 0 : h - bandH;
  // Dark scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, by, 0, by + bandH);
  scrim.addColorStop(0, top ? '#000000cc' : '#00000000');
  scrim.addColorStop(1, top ? '#00000000' : '#000000cc');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, by, w, bandH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = w - pad * 2;
  const titlePx = fitFont(ctx, title.toUpperCase(), 'Anton, sans-serif', maxW, Math.min(w, h) * 0.115);
  const ty = by + bandH * (subtitle ? 0.36 : 0.5);
  ctx.save();
  ctx.lineWidth = Math.max(2, titlePx * 0.09);
  ctx.strokeStyle = '#160a24';
  ctx.lineJoin = 'round';
  ctx.strokeText(title.toUpperCase(), w / 2, ty);
  ctx.fillStyle = titleColor;
  ctx.fillText(title.toUpperCase(), w / 2, ty);
  ctx.restore();
  if (subtitle) {
    const subPx = Math.min(w, h) * 0.052;
    ctx.font = `${subPx}px Pacifico, cursive`;
    const sy = by + bandH * 0.78;
    ctx.save();
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.min(w, h) * 0.02;
    ctx.fillStyle = '#ffe9f5';
    ctx.fillText(subtitle, w / 2, sy);
    ctx.restore();
  }
}

function drawBadge(ctx, w, h, grade) {
  const r = Math.min(w, h) * 0.052;
  const cx = w - r - Math.min(w, h) * 0.035;
  const cy = r + Math.min(w, h) * 0.035;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle = grade.tint;
  ctx.stroke();
  ctx.fillStyle = grade.tint;
  ctx.font = `900 ${r * 0.52}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', cx, cy - r * 0.06);
  ctx.font = `900 ${r * 0.3}px Anton, sans-serif`;
  ctx.fillText('VICE', cx, cy + r * 0.42);
  ctx.restore();
}

// Paint one finished cover. state: { layout, grade, title, subtitle,
// captionPos, titleColor, effects: {halftone, grain, vignette, badge},
// photos: [{img}], slots: [{photo, zoom, ox, oy}] }.
export function paintCover(ctx, w, h, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, w, h);
  drawBackdrop(ctx, w, h, grade, state.layout === 'tilt' || state.layout === 'strips');
  const rects = panelRects(state.layout, w, h);
  rects.forEach((r, i) => {
    const slot = state.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[slot.photo];
    const px = r.x * w;
    const py = r.y * h;
    const pw = r.w * w;
    const ph = r.h * h;
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((r.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
      drawPhotoInto(ctx, photo ? photo.img : null, { x: 0, y: 0, w: pw, h: ph }, slot.zoom, slot.ox, slot.oy, grade);
    } else {
      drawPhotoInto(ctx, photo ? photo.img : null, { x: px, y: py, w: pw, h: ph }, slot.zoom, slot.ox, slot.oy, grade);
    }
    ctx.restore();
  });
  if (state.effects.halftone) drawHalftone(ctx, w, h, '#ffffff');
  if (state.effects.grain) drawGrain(ctx, w, h);
  if (state.effects.vignette) drawVignette(ctx, w, h);
  drawLettering(ctx, w, h, state);
  if (state.effects.badge) drawBadge(ctx, w, h, grade);
}

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'Vice Coast nights',
    captionPos: 'bottom',
    titleColor: '#ffffff',
    size: 'square',
    effects: { halftone: true, grain: true, vignette: true, badge: true },
    photos: [],
    slots: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.15, ox: 0.05, oy: 0 },
      { photo: 1, zoom: 1.1, ox: -0.04, oy: 0 },
    ],
  };
}
