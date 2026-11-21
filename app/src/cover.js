// The cover engine: lays photos out in GTA-poster panels, grades them with a
// Vice City sunset / neon wash, and sets the caption in bold poster lettering.
// drawCover(canvas, state, width, height) draws the whole cover at any size, so
// the live preview and the exported PNGs are the same drawing at different sizes.
import { paintEmptyPanel, paintGradeWash, paintGrain, paintSunGlow, paintVignette, gradeAccent } from './grade.js';

export const LAYOUTS = {
  'vice-grid': 'Vice Grid',
  'sunset-strip': 'Sunset Strip',
  'neon-duo': 'Neon Duo',
  'full-bleed': 'Full Bleed',
};

/** Panel rectangles for a layout: each panel's x, y, w, h plus the caption band. */
export function layoutPanels(layout, width, height) {
  const gutter = Math.round(Math.min(width, height) * 0.018);
  const edge = Math.round(Math.min(width, height) * 0.028);
  const bandH = Math.round(height * 0.2);
  const inner = { x: edge, y: edge, w: width - edge * 2, h: height - edge * 2 - bandH };
  if (layout === 'sunset-strip') {
    const pw = (inner.w - gutter * 2) / 3;
    return {
      panels: [0, 1, 2].map((i) => ({ x: inner.x + i * (pw + gutter), y: inner.y, w: pw, h: inner.h })),
      band: { x: edge, y: height - edge - bandH, w: width - edge * 2, h: bandH },
    };
  }
  if (layout === 'neon-duo') {
    const leftW = inner.w * 0.6;
    const rightW = inner.w - leftW - gutter;
    const halfH = (inner.h - gutter) / 2;
    return {
      panels: [
        { x: inner.x, y: inner.y, w: leftW, h: inner.h },
        { x: inner.x + leftW + gutter, y: inner.y, w: rightW, h: halfH },
        { x: inner.x + leftW + gutter, y: inner.y + halfH + gutter, w: rightW, h: halfH },
      ],
      band: { x: edge, y: height - edge - bandH, w: width - edge * 2, h: bandH },
    };
  }
  if (layout === 'full-bleed') {
    return {
      panels: [{ x: edge, y: edge, w: width - edge * 2, h: height - edge * 2 - bandH }],
      band: { x: edge, y: height - edge - bandH, w: width - edge * 2, h: bandH },
    };
  }
  const heroH = inner.h * 0.58;
  const lowH = inner.h - heroH - gutter;
  const halfW = (inner.w - gutter) / 2;
  return {
    panels: [
      { x: inner.x, y: inner.y, w: inner.w, h: heroH },
      { x: inner.x, y: inner.y + heroH + gutter, w: halfW, h: lowH },
      { x: inner.x + halfW + gutter, y: inner.y + heroH + gutter, w: halfW, h: lowH },
    ],
    band: { x: edge, y: height - edge - bandH, w: width - edge * 2, h: bandH },
  };
}

/** Draws one photo cover-fit inside a panel, with zoom and pan offsets (-1..1). */
export function drawPhotoInPanel(ctx, photo, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const maxX = Math.max(0, (pw - rect.w) / 2);
  const maxY = Math.max(0, (ph - rect.h) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 - panX * maxX, rect.y + (rect.h - ph) / 2 - panY * maxY, pw, ph);
  ctx.restore();
}

/** One panel: photo (or gradient sky when empty), grade, glow, vignette, keyline. */
export function drawPanel(ctx, rect, photo, state, zoom, panX, panY) {
  if (photo) drawPhotoInPanel(ctx, photo, rect, zoom, panX, panY);
  else paintEmptyPanel(ctx, rect, state.grade);
  paintGradeWash(ctx, rect, state.grade, state.strength);
  paintSunGlow(ctx, rect, state.grade, state.strength * 0.7);
  paintVignette(ctx, rect, state.strength);
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 8, 30, 0.85)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Shrinks text until it fits, then returns the size. */
export function fitCaptionSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

/** The caption band: kicker, bold poster caption, sub-caption, studio credit. */
export function drawCaptionBand(ctx, band, state, width) {
  const accent = gradeAccent(state.grade);
  ctx.save();
  ctx.fillStyle = '#14081f';
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = accent;
  ctx.fillRect(band.x, band.y, band.w, Math.max(3, band.h * 0.03));
  const pad = band.w * 0.03;
  const kicker = (state.kicker || '').trim().toUpperCase();
  if (kicker) {
    const kSize = Math.max(12, band.h * 0.13);
    ctx.textAlign = 'left';
    ctx.font = `700 ${kSize}px "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(kSize * 0.35)}px`; } catch { /* older canvas: no letter spacing */ }
    ctx.fillStyle = accent;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(kicker, band.x + pad, band.y + band.h * 0.24);
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }
  const caption = (state.caption || 'SUNSET HEIST').trim().toUpperCase();
  const size = fitCaptionSize(ctx, caption, band.w - pad * 2, band.h * 0.44);
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const cy = band.y + band.h * 0.68;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = '#14081f';
  ctx.strokeText(caption, band.x + pad, cy);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.25;
  ctx.shadowOffsetY = size * 0.05;
  ctx.fillText(caption, band.x + pad, cy);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const sub = (state.subcaption || '').trim();
  if (sub) {
    const sSize = Math.max(11, band.h * 0.11);
    ctx.font = `italic 700 ${sSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(sub, band.x + pad, band.y + band.h * 0.9);
  }
  const credit = 'SUNSET COVER STUDIO';
  const cSize = Math.max(10, band.h * 0.09);
  ctx.font = `700 ${cSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'right';
  ctx.fillText(credit, band.x + band.w - pad, band.y + band.h * 0.9);
  ctx.textAlign = 'left';
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at `width` x `height`.
 * state: { layout, grade, strength, caption, kicker, subcaption,
 *   photos: [Image|null, ...], panelPhoto: [photoIndex|-1, ...],
 *   panelZoom: [n, ...], panelPan: [[x, y], ...] }.
 */
export function drawCover(canvas, state, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5efe4';
  ctx.fillRect(0, 0, width, height);
  const { panels, band } = layoutPanels(state.layout, width, height);
  panels.forEach((rect, i) => {
    const slot = state.panelPhoto?.[i] ?? i % 3;
    const photo = slot >= 0 ? state.photos?.[slot] ?? null : null;
    const zoom = state.panelZoom?.[i] ?? 1;
    const pan = state.panelPan?.[i] ?? [0, 0];
    drawPanel(ctx, rect, photo, state, zoom, pan[0], pan[1]);
  });
  drawCaptionBand(ctx, band, state, width);
  paintGrain(ctx, { x: 0, y: 0, w: width, h: height }, 0.05);
}
