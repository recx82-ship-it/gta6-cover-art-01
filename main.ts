// Sunset Cover Studio — the gta6-cover-art-01 entry program (Node 22, standard
// library only). The app is plain static files under app/ (index.html plus its
// ES modules, styles and sample photos; nothing loads over the network), and
// this program hands it in: it copies app/ and screenshots/ from beside this
// file into /output and writes /output/dossier.json with the kit's vendored
// make.fun library, buildDossier from vendor/makefun-app.ts.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The same caps the scorer's gate applies, so this program refuses an entry
// the scorer would refuse instead of handing in a broken one: at most 4
// screenshots of at most 256 KiB each, app/ at most 993 entries and 48 MiB,
// and no app/ path over 1000 bytes. Only text_max_bytes shapes the dossier's
// bytes; the rest are refusals. buildDossier is deterministic, so the grader's
// two runs write the same dossier.json bytes.
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
