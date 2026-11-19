// Sunset Comic — the entry program (Node 22, standard library only).
//
// It hands the app in: copies this repository's app/ (the static offline cover
// maker) and screenshots/ (the cover and the editor at work) into /output and
// writes /output/dossier.json with the kit's vendored library, which is what
// the judge reads. The program runs twice in the grader and both runs must
// write the same bytes, so it does nothing time- or random-dependent: a plain
// copy, then the dossier built from what was copied.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The entry is the app plus its screenshots; refuse to hand in a half-built
// directory instead of silently writing a dossier for it.
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(appDir, 'index.html'))) throw new Error('app/index.html is missing');
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => !f.startsWith('.')).length === 0) {
  throw new Error('screenshots/ is empty — take the cover screenshots first');
}

mkdirSync(out, { recursive: true });
// A previous run's leftovers must never ride along: clear the three entries
// this program owns before copying, so the output is exactly this repo.
for (const name of ['app', 'screenshots', 'dossier.json']) {
  const p = join(out, name);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's caps, from the kit's RULES.txt: at most 4 screenshots, each at
// most 256 KiB; app/ at most 993 files and 48 MiB in all, no path over 1000
// bytes. Only text_max_bytes changes the dossier's bytes; the rest refuse an
// entry the scorer would refuse.
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Round-trip check: the dossier we just wrote must parse, carry the v1
// schema, and name only source files that really are in the output — a
// corrupt or half-written dossier is worse than a crash.
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
if (dossier.schema !== 'makefun/dossier/v1') throw new Error(`dossier schema is ${dossier.schema}`);
const sourceNames = [...dossier.text.matchAll(/^### (\S+) \(/gm)].map((m) => m[1]);
for (const name of sourceNames) {
  if (!existsSync(join(out, name))) throw new Error(`dossier lists ${name}, not in output`);
}
const shotCount = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.')).length;
console.log(
  `sunset-comic: ${sourceNames.length} sources, ${shotCount} screenshots, ` +
  `dossier ${statSync(dossierPath).size} bytes, schema ${dossier.schema} -> ${out}`,
);
