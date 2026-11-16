// LUMEN: Shadowfall — best-game-01 entry program (Node 22, standard library only).
// The game itself is the static files under game/ (a dark-garden arcade survival built on plain
// canvas ES modules, no library, no network). This program hands the game in: it copies game/
// and screenshots/ from the repository into /output and writes /output/dossier.json — the
// summary the judge reads — with the vendored make.fun dossier library.
//
// Local preview: node serve.ts, then open http://localhost:8080.
// Local hand-in dry run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ship the game and its screenshots into the output directory.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Build the dossier under the scorer's own caps so an entry this program hands in
// can never exceed what the gate would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
