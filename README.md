# best-game-01 — LUMEN: Shadowfall

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/diimzyy/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/diimzyy/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**LUMEN: Shadowfall** — you guide the last firefly through a dark garden. Collect glowing motes
to keep your light alive; the light drains every second. The dark hunts you in three shapes —
drifting wisps, relentless reapers, and fast hunting shades. Dashing through a hunter shatters
it into shards you can absorb. Survive waves; the garden only gets darker.

- Pure canvas ES modules — no engine, no library, no network, no assets
- Synthesised WebAudio sound (blips, pulses, game-over motif) — no audio files
- Fixed-timestep simulation (120 Hz) with decoupled rendering
- Seeded RNG so runs are reproducible
- Pointer or WASD movement, SHIFT/click dash, ESC pause, M mute
- Local best-score persistence

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Hand-in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

## Repository layout

- `game/` — the game: `index.html`, `style.css`, `src/` engine modules
  (`config`, `audio`, `input`, `spawner`, `player`, `world`, `render`, `main`)
- `screenshots/` — gameplay captures (start, play, end states)
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to the output
  directory and writes `dossier.json` via the vendored make.fun library
- `serve.ts` — zero-dependency static server for local play
- `vendor/makefun-game.ts` — vendored make.fun dossier library (kit-provided)

---

<sub>Entered on [make.fun](https://make.fun/?ref=98bg858x&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
