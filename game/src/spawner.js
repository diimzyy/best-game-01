// spawner.js — LUMEN: Shadowfall world population. Seeded RNG (so screenshots and replays
// are reproducible), mote fields, hunter packs per wave, spawn timing.

export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function rng() {
    // mulberry32: small, fast, good enough for a garden.
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function spawnMote(rng, w, h) {
  const roll = rng();
  const kind = roll < 0.02 ? 'rare' : roll < 0.14 ? 'bright' : 'common';
  const edge = Math.floor(rng() * 4);
  const m = 24;
  const pos = edge === 0 ? { x: m + rng() * (w - 2 * m), y: m + rng() * 40 }
    : edge === 1 ? { x: m + rng() * (w - 2 * m), y: h - m - rng() * 40 }
    : edge === 2 ? { x: m + rng() * 40, y: m + rng() * (h - 2 * m) }
    : { x: w - m - rng() * 40, y: m + rng() * (h - 2 * m) };
  return {
    x: pos.x, y: pos.y,
    kind,
    age: 0,
    drift: { x: (rng() - 0.5) * 12, y: (rng() - 0.5) * 12 },
    phase: rng() * Math.PI * 2,
  };
}

export function spawnHunter(rng, w, h, kindName, waveIndex) {
  const def = HUNTER_DEFS[kindName];
  const edge = Math.floor(rng() * 4);
  const m = 30;
  const x = edge === 0 ? m + rng() * (w - 2 * m) : edge === 1 ? m + rng() * (w - 2 * m)
    : edge === 2 ? m + rng() * 60 : w - m - rng() * 60;
  const y = edge === 0 || edge === 1 ? (edge === 0 ? m : h - m) : m + rng() * (h - 2 * m);
  return {
    x, y,
    vx: 0, vy: 0,
    kind: kindName,
    ...def,
    hp: def.hp,
    spawnAge: 0,          // seconds since spawn; fades in, cannot hurt for 0.6s
    phase: rng() * Math.PI * 2,
    waveIndex,
  };
}

const HUNTER_DEFS = {
  wisp:   { radius: 11, speed: 88,  hp: 1, wobble: 26, value: 12, color: '#31415c' },
  reaper: { radius: 15, speed: 66,  hp: 2, wobble: 8,  value: 22, color: '#242e42' },
  hunter: { radius: 13, speed: 128, hp: 1, wobble: 40, value: 30, color: '#46293b' },
};

// Which hunter mix a wave sends. Early waves are wisps; reapers join at wave 3;
// fast hunters at wave 5; after that the mix tilts toward the fast and heavy.
export function waveMix(waveIndex, rng) {
  const n = Math.round(3 + waveIndex * 1.7);
  const pack = [];
  for (let i = 0; i < n; i++) {
    let kind = 'wisp';
    const r = rng();
    if (waveIndex >= 5) {
      kind = r < 0.45 ? 'wisp' : r < 0.8 ? 'hunter' : 'reaper';
    } else if (waveIndex >= 3) {
      kind = r < 0.6 ? 'wisp' : r < 0.85 ? 'reaper' : 'hunter';
    } else {
      kind = r < 0.85 ? 'wisp' : 'reaper';
    }
    pack.push(kind);
  }
  return pack;
}

// Spawn schedule for a wave: at most `budget` motes appear, in drifting bursts.
export function moteSchedule(waveIndex, rng) {
  const budget = Math.round(8 + waveIndex * 2.4);
  const events = [];
  let t = 0.5;
  for (let i = 0; i < budget; i++) {
    t += 0.7 + rng() * 1.9;
    events.push({ at: t, count: 1 + (rng() < 0.25 ? 1 : 0) });
  }
  return events;
}
