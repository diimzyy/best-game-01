// world.js — LUMEN: Shadowfall simulation. Owns the run state: wave flow, motes, hunters,
// shards, collisions, scoring, and the transitions between menu / playing / paused / over.

import { PLAYER, MOTE, SHARD, WAVE, SCORING } from './config.js';
import { createPlayer, updatePlayer, tryDash, hitPlayer } from './player.js';
import { makeRng, spawnMote, spawnHunter, waveMix, moteSchedule } from './spawner.js';

export function createWorld(seed) {
  return {
    phase: 'menu',        // menu | playing | paused | over
    time: 0,
    seed,
    rng: makeRng(seed),
    score: 0,
    waveIndex: 0,
    waveTime: 0,
    waveLen: 0,
    player: createPlayer(480, 320),
    motes: [],
    hunters: [],
    shards: [],
    hunterQueue: [],      // [{ kind, at }] spawned over the wave
    moteQueue: [],
    nextWaveIn: 0,        // inter-wave countdown
    bestScore: Number(localStorage.getItem('lumen-best') ?? 0),
  };
}

export function startRun(world) {
  world.phase = 'playing';
  world.time = 0;
  world.score = 0;
  world.waveIndex = 0;
  world.rng = makeRng(Date.now() & 0xffffffff);
  world.player = createPlayer(480, 320);
  world.motes = [];
  world.hunters = [];
  world.shards = [];
  startWave(world, 0);
}

function startWave(world, index) {
  world.waveIndex = index;
  world.waveTime = 0;
  world.waveLen = Math.max(WAVE.minTime, WAVE.baseTime - index * 1.2);
  const rng = world.rng;
  const mix = waveMix(index, rng);
  const startGap = WAVE.spawnStart + (index === 0 ? 1.2 : 0);
  world.hunterQueue = mix.map((kind, i) => ({ kind, at: startGap + (i * WAVE.spawnGrowth * 1.4) }));
  world.moteQueue = moteSchedule(index, rng);
  world.nextWaveIn = 0;
}

function endWave(world) {
  // Clear the field with a wave-clear bonus; short breather; next wave.
  world.score += SCORING.waveClearBonus + world.waveIndex * 12;
  world.motes = [];
  world.hunters = [];
  world.shards = [];
  world.phase = 'playing';
  world.nextWaveIn = 2.2;
}

export function updateWorld(world, dt, input, audio) {
  if (world.phase !== 'playing') return;
  world.time += dt;
  world.waveTime += dt;

  // Inter-wave breather.
  if (world.nextWaveIn > 0) {
    world.nextWaveIn -= dt;
    if (world.nextWaveIn <= 0) startWave(world, world.waveIndex + 1);
  }

  // Player.
  const target = input.steer(world.player);
  updatePlayer(world.player, target, dt);
  if (input.consumeDash()) {
    if (tryDash(world.player)) audio.dash();
  }

  // Light drains while a wave is live.
  world.player.lumen -= PLAYER.lumenDrain * dt * (world.nextWaveIn > 0 ? 0.25 : 1);
  if (world.player.lumen <= 0) {
    world.player.lumen = 0;
    gameOver(world);
    return;
  }

  // Scheduled spawns.
  while (world.hunterQueue.length && world.hunterQueue[0].at <= world.waveTime) {
    const h = world.hunterQueue.shift();
    world.hunters.push(spawnHunter(world.rng, 960, 640, h.kind, world.waveIndex));
  }
  while (world.moteQueue.length && world.moteQueue[0].at <= world.waveTime) {
    world.moteQueue.shift();
    const n = 1 + Math.floor(world.rng() * 2);
    for (let i = 0; i < n; i++) world.motes.push(spawnMote(world.rng, 960, 640));
  }

  // Motes drift and fade.
  for (const m of world.motes) {
    m.age += dt;
    m.x += m.drift.x * dt;
    m.y += m.drift.y * dt;
  }
  world.motes = world.motes.filter((m) => m.age < MOTE.lifetime);

  // Shards expire fast.
  for (const s of world.shards) s.age += dt;
  world.shards = world.shards.filter((s) => s.age < SHARD.lifetime);

  // Hunters: seek with a wobble, fade in on arrival.
  const p = world.player;
  for (const h of world.hunters) {
    h.spawnAge += dt;
    h.phase += dt * 2.2;
    if (h.spawnAge < 0.6) continue;
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    const dist = Math.hypot(dx, dy) || 1;
    // hunter kind: closes fast then orbits; wisp: slow drift; reaper: relentless.
    let steer = 1;
    if (h.kind === 'hunter' && dist < 90) steer = 0.35;
    h.vx += ((dx / dist) * h.speed * steer - h.vx) * Math.min(1, dt * 2.4);
    h.vy += ((dy / dist) * h.speed * steer - h.vy) * Math.min(1, dt * 2.4);
    // Wobble perpendicular to travel.
    const wob = Math.sin(h.phase * 3) * h.wobble;
    const sp = Math.hypot(h.vx, h.vy) || 1;
    h.x += (h.vx + (-h.vy / sp) * wob) * dt;
    h.y += (h.vy + (h.vx / sp) * wob) * dt;
  }

  // Collisions: motes feed you.
  for (const m of world.motes) {
    if (Math.hypot(m.x - p.x, m.y - p.y) < m.kind === 'common' ? MOTE.radius : MOTE.radius + 2) {
      // placeholder
    }
  }
  world.motes = world.motes.filter((m) => {
    const gain = m.kind === 'rare' ? SCORING.moteRare : m.kind === 'bright' ? SCORING.moteBright : SCORING.moteCommon;
    const r = m.kind === 'common' ? MOTE.radius : MOTE.radius + 2;
    if (Math.hypot(m.x - p.x, m.y - p.y) < r + p.radius) {
      world.score += gain;
      p.lumen = Math.min(PLAYER.lumenMax, p.lumen + MOTE.energy * (m.kind === 'rare' ? 2 : m.kind === 'bright' ? 1.4 : 1));
      audio.collectMote(m.kind !== 'common');
      return false;
    }
    return true;
  });

  // Shards: remnants worth grabbing.
  world.shards = world.shards.filter((s) => {
    if (Math.hypot(s.x - p.x, s.y - p.y) < s.radius + p.radius) {
      world.score += SHARD.value;
      p.lumen = Math.min(PLAYER.lumenMax, p.lumen + SHARD.energy);
      audio.shard();
      return false;
    }
    return true;
  });

  // Hunters: touch the dark and it takes your light.
  for (const h of world.hunters) {
    if (h.spawnAge < 0.6) continue;
    if (Math.hypot(h.x - p.x, h.y - p.y) < h.radius + p.radius) {
      if (hitPlayer(p, h.kind === 'reaper' ? 26 : 16)) {
        audio.hit();
        // Dash through a hunter (invulnerable) shatters it.
        if (p.invuln > 0) {
          // no-op: hitPlayer already applied damage; shatter happens on dash contact below
        }
      }
      // Dashing contact shatters the hunter instead.
      if (p.dashTime > 0) {
        h.hp -= 2;
        if (h.hp <= 0) shatter(world, h, audio);
      }
    }
  }
  world.hunters = world.hunters.filter((h) => h.hp > 0);

  // Survival score ticks up.
  world.score += SCORING.survivalPerSecond * dt;

  // Wave end.
  if (world.nextWaveIn <= 0 && world.waveTime >= world.waveLen && world.hunters.length === 0) {
    endWave(world);
    audio.waveClear();
  }
}

function shatter(world, h, audio) {
  world.score += h.value;
  const n = 3;
  for (let i = 0; i < n; i++) {
    world.shards.push({
      x: h.x + (world.rng() - 0.5) * 24,
      y: h.y + (world.rng() - 0.5) * 24,
      age: 0,
      radius: SHARD.radius,
      drift: { x: (world.rng() - 0.5) * 30, y: (world.rng() - 0.5) * 30 },
    });
  }
  audio.shard();
}

function gameOver(world) {
  world.phase = 'over';
  if (world.score > world.bestScore) {
    world.bestScore = Math.floor(world.score);
    localStorage.setItem('lumen-best', String(world.bestScore));
  }
}

export function togglePause(world) {
  if (world.phase === 'playing') world.phase = 'paused';
  else if (world.phase === 'paused') world.phase = 'playing';
}
