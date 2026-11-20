// Sunset Cover Studio — hand-in program for gta6-cover-art-01 (Node 22, stdlib only).
// Checks the entry is complete, copies app/ and screenshots/ to the output
// directory, and writes dossier.json with the kit's vendored library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const appDir = join(here, "app");
const shotsDir = join(here, "screenshots");

function fail(message) {
  throw new Error(`sunset-cover-studio: ${message}`);
}

function listFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

// Validate the entry before anything is copied.
if (!existsSync(join(appDir, "index.html"))) fail("app/index.html is missing");
if (!existsSync(join(appDir, "src", "cover.js"))) fail("app/src/cover.js is missing");
if (!existsSync(join(appDir, "src", "app.js"))) fail("app/src/app.js is missing");
const appFiles = listFiles(appDir);
if (appFiles.length > 993) fail(`app/ holds ${appFiles.length} files, over the 993 cap`);
const appBytes = appFiles.reduce((n, f) => n + statSync(f).size, 0);
if (appBytes > 48 * 1024 * 1024) fail(`app/ is ${appBytes} bytes, over the 48 MiB cap`);

const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((n) => !n.startsWith("."))
  : [];
if (shots.length < 3 || shots.length > 4) {
  fail(`screenshots/ holds ${shots.length} images, need 3 or 4`);
}
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 256 * 1024) fail(`screenshots/${shot} is ${size} bytes, over the 256 KiB cap`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(shot)) fail(`screenshots/${shot} has an invalid name`);
}

// Copy the app and its screenshots, then write the dossier the judge reads.
mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, "app"), { recursive: true });
cpSync(shotsDir, join(out, "screenshots"), { recursive: true });

writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(
  `sunset-cover-studio: handed in ${appFiles.length} app files ` +
    `(${(appBytes / 1024).toFixed(0)} KiB) and ${shots.length} screenshots -> ${out}`,
);
