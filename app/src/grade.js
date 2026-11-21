// Sunset / neon colour grades for Sunset Cover Studio.
// Every grade is drawn with plain canvas gradients and composite modes, so the
// app needs no image library and no network: the grade is pure code.
const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    wash: ['rgba(255, 122, 26, 0)', 'rgba(255, 122, 26, 0.28)', 'rgba(255, 45, 120, 0.42)', 'rgba(90, 20, 120, 0.5)'],
    glow: 'rgba(255, 170, 60, 0.55)',
    accent: '#ff2d78',
  },
  neon: {
    label: 'Neon Nights',
    wash: ['rgba(0, 229, 255, 0)', 'rgba(0, 229, 255, 0.22)', 'rgba(255, 45, 200, 0.4)', 'rgba(40, 0, 90, 0.55)'],
    glow: 'rgba(0, 229, 255, 0.5)',
    accent: '#00e5ff',
  },
  golden: {
    label: 'Golden Hour',
    wash: ['rgba(255, 200, 80, 0)', 'rgba(255, 180, 60, 0.3)', 'rgba(255, 110, 40, 0.4)', 'rgba(120, 40, 10, 0.45)'],
    glow: 'rgba(255, 220, 120, 0.6)',
    accent: '#ffb400',
  },
  noir: {
    label: 'Midnight Noir',
    wash: ['rgba(120, 140, 255, 0)', 'rgba(80, 90, 200, 0.25)', 'rgba(30, 20, 80, 0.45)', 'rgba(5, 5, 20, 0.6)'],
    glow: 'rgba(150, 170, 255, 0.4)',
    accent: '#8f9bff',
  },
};

/** The grade names the editor offers, in menu order. */
export function gradeNames() {
  return Object.keys(GRADES);
}

/** The accent colour of a grade, for captions and UI highlights. */
export function gradeAccent(name) {
  return (GRADES[name] ?? GRADES.sunset).accent;
}

/** Paints a grade's sunset wash over a rectangle: warm at the bottom, cool at the top. */
export function paintGradeWash(ctx, rect, name, strength) {
  const grade = GRADES[name] ?? GRADES.sunset;
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grade.wash.forEach((colour, i) => wash.addColorStop(i / (grade.wash.length - 1), colour));
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Paints a low sun glow: a soft radial disc near the panel's horizon. */
export function paintSunGlow(ctx, rect, name, strength) {
  const grade = GRADES[name] ?? GRADES.sunset;
  const cx = rect.x + rect.w * 0.68;
  const cy = rect.y + rect.h * 0.62;
  const radius = Math.max(rect.w, rect.h) * 0.42;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.save();
  ctx.globalAlpha = strength * 0.8;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Darkens a rectangle's corners so the middle of the photo stays bright. */
export function paintVignette(ctx, rect, strength) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const radius = Math.max(rect.w, rect.h) * 0.75;
  const shade = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, `rgba(10, 0, 20, ${0.42 * strength})`);
  ctx.save();
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

let grainTile = null;

/** A small tile of random grey noise, made once and stamped at low alpha. */
export function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 96 + Math.floor(Math.random() * 64);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

/** Stamps film grain over a rectangle at low alpha. */
export function paintGrain(ctx, rect, alpha) {
  const pattern = grainPattern(ctx);
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A gradient panel for a slot with no photo: sunset sky, horizon glow, dark street. */
export function paintEmptyPanel(ctx, rect, name) {
  const grade = GRADES[name] ?? GRADES.sunset;
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.62, '#ff7a1a');
  sky.addColorStop(0.78, '#ff2d78');
  sky.addColorStop(1, '#1a0b2e');
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  paintSunGlow(ctx, rect, name, 0.9);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 5, 35, 0.55)';
  ctx.fillRect(rect.x, rect.y + rect.h * 0.72, rect.w, rect.h * 0.28);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.72, rect.w, Math.max(2, rect.h * 0.004));
  ctx.restore();
}
