// Sunset Cover Studio — cover rendering engine.
// Pure canvas drawing: no DOM access here, so the editor, the screenshot
// scenes and the export path all draw the exact same cover.

export const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
};

export const LAYOUTS = {
  full: { name: "Full bleed", panels: 1 },
  duo: { name: "Duo split", panels: 2 },
  hero: { name: "Hero + two", panels: 3 },
  grid: { name: "Four grid", panels: 4 },
  tilt: { name: "Tilted snaps", panels: 3 },
  strips: { name: "Strip trio", panels: 3 },
};

export const GRADES = {
  sunset: "Sunset",
  neon: "Neon Vice",
  heat: "Heat",
  teal: "Teal Noir",
  mono: "Mono Pop",
};

// Panel rectangles in unit space (fractions of the cover), with an optional
// rotation in degrees for the snapshot look.
export function layoutPanels(layout, w, h) {
  const portrait = h > w;
  switch (layout) {
    case "duo":
      return [
        { x: 0, y: 0, w: 0.5, h: 1, rot: 0 },
        { x: 0.5, y: 0, w: 0.5, h: 1, rot: 0 },
      ];
    case "hero":
      if (portrait) {
        return [
          { x: 0, y: 0, w: 1, h: 0.62, rot: 0 },
          { x: 0, y: 0.62, w: 0.5, h: 0.38, rot: 0 },
          { x: 0.5, y: 0.62, w: 0.5, h: 0.38, rot: 0 },
        ];
      }
      return [
        { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
        { x: 0.62, y: 0, w: 0.38, h: 0.5, rot: 0 },
        { x: 0.62, y: 0.5, w: 0.38, h: 0.5, rot: 0 },
      ];
    case "grid":
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5, rot: 0 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5, rot: 0 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
      ];
    case "tilt":
      return [
        { x: 0.05, y: 0.08, w: 0.44, h: 0.58, rot: -4 },
        { x: 0.52, y: 0.05, w: 0.44, h: 0.56, rot: 3 },
        { x: 0.27, y: 0.44, w: 0.48, h: 0.5, rot: -1 },
      ];
    case "strips":
      return [
        { x: 0, y: 0, w: 1, h: 0.34, rot: 0 },
        { x: 0, y: 0.33, w: 1, h: 0.34, rot: 0 },
        { x: 0, y: 0.66, w: 1, h: 0.34, rot: 0 },
      ];
    case "full":
    default:
      return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
  }
}

function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function drawPhotoInto(ctx, img, px, py, pw, ph, crop) {
  const zoom = crop.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = px + (pw - dw) / 2 + (crop.dx || 0) * pw;
  const dy = py + (ph - dh) / 2 + (crop.dy || 0) * ph;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// One colour grade, painted over a clipped panel (or the whole cover).
function applyGrade(ctx, grade, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  switch (grade) {
    case "neon":
      g.addColorStop(0, "rgba(255,46,136,0.55)");
      g.addColorStop(0.55, "rgba(123,47,247,0.35)");
      g.addColorStop(1, "rgba(45,226,255,0.55)");
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,46,136,0.12)";
      ctx.fillRect(x, y, w, h);
      break;
    case "heat":
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(255,90,0,0.28)";
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(255,180,60,0.35)";
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,60,40,0.10)";
      ctx.fillRect(x, y, w, h);
      break;
    case "teal":
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(0,70,80,0.42)";
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,214,150,0.20)";
      ctx.fillRect(x, y, w, h);
      break;
    case "mono":
      ctx.globalCompositeOperation = "source-over";
      break;
    case "sunset":
    default:
      g.addColorStop(0, "rgba(255,154,61,0.42)");
      g.addColorStop(0.5, "rgba(255,94,120,0.30)");
      g.addColorStop(1, "rgba(123,47,247,0.42)");
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,190,90,0.10)";
      ctx.fillRect(x, y, w, h);
      break;
  }
  ctx.globalCompositeOperation = "source-over";
}

// Stylised palm silhouette, drawn from paths — original art, no photos.
function drawPalm(ctx, x, y, size, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.1, -size * 0.5, size * 0.28, -size * 0.85);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (-15 - i * 28) * (Math.PI / 180);
    const len = size * (0.42 - Math.abs(i - 2.5) * 0.05);
    const bx = size * 0.28 + Math.cos(a) * len;
    const by = -size * 0.85 + Math.sin(a) * len * 0.7;
    ctx.beginPath();
    ctx.moveTo(size * 0.28, -size * 0.85);
    ctx.quadraticCurveTo(
      size * 0.28 + Math.cos(a) * len * 0.5,
      -size * 0.85 + Math.sin(a) * len * 0.5 - size * 0.12,
      bx,
      by,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackdrop(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (grade === "neon") {
    sky.addColorStop(0, "#1b0b3b");
    sky.addColorStop(0.5, "#a4136e");
    sky.addColorStop(1, "#ff7e5f");
  } else if (grade === "teal") {
    sky.addColorStop(0, "#04222e");
    sky.addColorStop(0.55, "#0e5a6b");
    sky.addColorStop(1, "#e8a34c");
  } else if (grade === "mono") {
    sky.addColorStop(0, "#111111");
    sky.addColorStop(0.6, "#3a3a3a");
    sky.addColorStop(1, "#8a8a8a");
  } else if (grade === "heat") {
    sky.addColorStop(0, "#2b0a12");
    sky.addColorStop(0.5, "#b3202e");
    sky.addColorStop(1, "#ff9a3d");
  } else {
    sky.addColorStop(0, "#2b1055");
    sky.addColorStop(0.5, "#ff5e78");
    sky.addColorStop(1, "#feb47b");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Setting sun with a soft glow.
  const sunR = Math.min(w, h) * 0.16;
  const sunX = w * 0.5;
  const sunY = h * 0.42;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, "rgba(255,220,130,0.85)");
  glow.addColorStop(0.4, "rgba(255,150,80,0.35)");
  glow.addColorStop(1, "rgba(255,150,80,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Palm silhouettes along the bottom corners.
  const palmColor = "rgba(24,8,32,0.85)";
  drawPalm(ctx, w * 0.02, h * 1.0, Math.min(w, h) * 0.42, false, palmColor);
  drawPalm(ctx, w * 0.98, h * 1.0, Math.min(w, h) * 0.36, true, palmColor);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawTitleBlock(ctx, opts, w, h) {
  const { title, subtitle, titleColor, titlePos } = opts;
  const unit = Math.min(w, h);
  const margin = w * 0.05;
  const maxWidth = w - margin * 2;
  const atTop = titlePos === "top";
  const bandH = h * (subtitle ? 0.2 : 0.15);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Dark band behind the lettering so it reads over any photo.
  const bandY = atTop ? 0 : h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (atTop) {
    band.addColorStop(0, "rgba(10,5,20,0.82)");
    band.addColorStop(1, "rgba(10,5,20,0)");
  } else {
    band.addColorStop(0, "rgba(10,5,20,0)");
    band.addColorStop(1, "rgba(10,5,20,0.85)");
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);

  const centerY = atTop ? bandH * 0.45 : h - bandH * (subtitle ? 0.58 : 0.5);
  const titlePx = fitFont(ctx, title.toUpperCase(), maxWidth, unit * 0.115, '"Anton", sans-serif', 400);
  const lines = wrapLines(ctx, title.toUpperCase(), maxWidth);
  const lineH = titlePx * 1.02;
  const firstY = centerY - ((lines.length - 1) * lineH) / 2 + (subtitle ? -titlePx * 0.18 : 0);

  ctx.save();
  ctx.translate(w / 2, firstY);
  ctx.rotate(-0.012);
  ctx.translate(-w / 2, -firstY);
  lines.forEach((line, i) => {
    const y = firstY + i * lineH;
    ctx.lineWidth = Math.max(2, titlePx * 0.09);
    ctx.strokeStyle = "rgba(12,6,20,0.9)";
    ctx.lineJoin = "round";
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = titleColor || "#ffffff";
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();

  if (subtitle) {
    const subPx = fitFont(ctx, subtitle, maxWidth, unit * 0.048, '"Pacifico", cursive', 400);
    const subY = firstY + lines.length * lineH * 0.5 + subPx * 0.9;
    ctx.font = `${subPx}px "Pacifico", cursive`;
    ctx.shadowColor = "rgba(255,46,136,0.9)";
    ctx.shadowBlur = subPx * 0.45;
    const grad = ctx.createLinearGradient(w / 2 - maxWidth / 2, 0, w / 2 + maxWidth / 2, 0);
    grad.addColorStop(0, "#ffd166");
    grad.addColorStop(0.5, "#ff5e78");
    grad.addColorStop(1, "#2de2ff");
    ctx.fillStyle = grad;
    ctx.fillText(subtitle, w / 2, subY);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawBadge(ctx, w, h) {
  const unit = Math.min(w, h);
  const pad = unit * 0.022;
  const text = "★ ★ ★  SUNSET COVER STUDIO";
  ctx.save();
  ctx.font = `400 ${Math.max(10, unit * 0.02)}px "Anton", sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + pad * 2.4;
  const bh = unit * 0.052;
  const bx = w - bw - unit * 0.03;
  const by = unit * 0.03;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = "#1d1226";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

function drawHalftone(ctx, w, h, seed) {
  const rand = seededRandom(seed);
  const unit = Math.min(w, h);
  const gap = unit * 0.028;
  ctx.save();
  ctx.fillStyle = "rgba(12,6,20,0.16)";
  for (let y = h * 0.62; y < h; y += gap) {
    for (let x = (y / gap) % 2 ? gap / 2 : 0; x < w; x += gap) {
      const r = gap * 0.16 * (0.5 + rand() * 0.7);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, w, h, seed) {
  const rand = seededRandom(seed + 7);
  const unit = Math.min(w, h);
  const count = Math.floor((w * h) / (unit * unit) * 2600);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(8,4,16,0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Draw the cover onto ctx's canvas at its own size.
// opts: { photos, assignments, crops, layout, grade, title, subtitle,
//         titleColor, titlePos, effects, seed }
export function drawCover(ctx, opts) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const { photos, layout, grade } = opts;
  const effects = opts.effects || {};
  const panels = layoutPanels(layout, w, h);
  const unit = Math.min(w, h);
  const gutter = unit * 0.012;

  drawBackdrop(ctx, w, h, grade);

  panels.forEach((panel, i) => {
    const px = panel.x * w;
    const py = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;
    const photo = photos[opts.assignments?.[i] ?? 0];
    const crop = opts.crops?.[i] || { zoom: 1, dx: 0, dy: 0 };
    ctx.save();
    if (panel.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    // Snapshot-style white frame for tilted panels; thin keyline otherwise.
    if (panel.rot) {
      ctx.fillStyle = "#fdfaf2";
      ctx.fillRect(-gutter * 1.6, -gutter * 1.6, pw + gutter * 3.2, ph + gutter * 3.2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-gutter * 1.6 + 4, ph + gutter * 1.6 - 2, pw + gutter * 3.2, 6);
    }
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (photo) {
      if (grade === "mono") ctx.filter = "grayscale(1) contrast(1.22) brightness(1.05)";
      drawPhotoInto(ctx, photo, 0, 0, pw, ph, crop);
      ctx.filter = "none";
      applyGrade(ctx, grade, 0, 0, pw, ph);
    } else {
      ctx.fillStyle = "#241a33";
      ctx.fillRect(0, 0, pw, ph);
    }
    ctx.restore();

    if (effects.ink !== false) {
      ctx.save();
      ctx.strokeStyle = panel.rot ? "rgba(20,10,28,0.35)" : "#fdfaf2";
      ctx.lineWidth = panel.rot ? 1 : gutter;
      ctx.strokeRect(px + gutter / 2, py + gutter / 2, pw - gutter, ph - gutter);
      ctx.restore();
    }
  });

  if (effects.halftone) drawHalftone(ctx, w, h, opts.seed || 11);
  if (effects.grain) drawGrain(ctx, w, h, opts.seed || 11);
  if (effects.vignette !== false) drawVignette(ctx, w, h);

  // Outer poster border.
  if (effects.ink !== false) {
    ctx.save();
    ctx.strokeStyle = "#fdfaf2";
    ctx.lineWidth = unit * 0.014;
    ctx.strokeRect(unit * 0.007, unit * 0.007, w - unit * 0.014, h - unit * 0.014);
    ctx.restore();
  }

  if (opts.title) drawTitleBlock(ctx, opts, w, h);
  drawBadge(ctx, w, h);
}
