// Sunset Cover Studio — gta6-cover-art-01 entry (Node 22, standard library only).
// Hands the app in: checks the entry is complete (index.html present, app/ within
// the gate's caps, 3–4 screenshots inside 256 KiB each), copies app/ and
// screenshots/ from beside this file to /output, and writes /output/dossier.json
// with the vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

function fail(message) {
  throw new Error(`Sunset Cover Studio hand-in refused: ${message}`);
}

function walk(dir, base = dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) found.push(...walk(path, base));
    else if (stats.isFile()) found.push(path);
    else fail(`${path} is not a plain file`);
  }
  return found;
}

// The entry is only handed in when it is whole.
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
const appFiles = walk(appDir);
if (appFiles.length > 993) fail(`app/ holds ${appFiles.length} files, over the 993 cap`);
const appBytes = appFiles.reduce((sum, path) => sum + statSync(path).size, 0);
if (appBytes > 48 * 1024 * 1024) fail(`app/ is ${appBytes} bytes, over the 48 MiB cap`);
for (const path of appFiles) {
  if (Buffer.byteLength(path, 'utf8') > 1000) fail(`app path over 1000 bytes: ${path}`);
}
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) fail(`screenshots/ holds ${shots.length} images, need 3 or 4`);
for (const name of shots) {
  const path = join(shotsDir, name);
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('-')) fail(`bad screenshot name: ${name}`);
  if (statSync(path).size > 256 * 1024) fail(`screenshot over 256 KiB: ${name}`);
  // A screenshot is a whole JPEG or PNG, checked by its first bytes.
  const head = readFileSync(path).subarray(0, 8);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (!isJpeg && !isPng) fail(`screenshot is not a JPEG or PNG: ${name}`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Entry handed in: ${appFiles.length} app files (${appBytes} bytes), ${shots.length} screenshots.`);
