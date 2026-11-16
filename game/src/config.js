// config.js — shared tuning for LUMEN: Shadowfall.
// Every number the game's feel depends on lives here, so waves, drift and economy stay tweakable
// without touching the systems that read them.

export const CANVAS_W = 960;
export const CANVAS_H = 640;

// The firefly: fast, floaty, forgiving. Acceleration rather than raw speed.
export const PLAYER = {
  radius: 9,
  accel: 2400,        // px/s^2 toward the pointer
  damping: 5.2,       // friction per second
  maxSpeed: 430,
  lumenStart: 100,    // light energy: drains in shadow, refills on motes
  lumenMax: 140,
  lumenDrain: 7.5,    // per second while a wave is live
  invulnTime: 1.1,    // seconds after a hit
};

// Motes: the light-pollen you collect. Collecting is the score and the fuel.
export const MOTE = {
  radius: 6,
  value: 4,
  energy: 18,
  lifetime: 9.5,      // seconds before a mote fades
  rarity: { common: 0.86, bright: 0.12, rare: 0.02 },
};

// Shards: what a shattered shadow leaves behind.
export const SHARD = {
  radius: 5,
  value: 2,
  energy: 6,
  lifetime: 5,
};

// The dark: what hunts you. Each kind has its own shape of pursuit.
export const HUNTER = {
  wisp:    { radius: 11, speed: 88,  hp: 1, wobble: 26, value: 12, color: '#31415c' },
  reaper:  { radius: 15, speed: 66,  hp: 2, wobble: 8,  value: 22, color: '#242e42' },
  hunter:  { radius: 13, speed: 128, hp: 1, wobble: 40, value: 30, color: '#46293b' },
};

// Wave pacing: seconds per wave and the spawn budget that grows with the index.
export const WAVE = {
  baseTime: 26,
  minTime: 14,
  spawnStart: 1.6,
  spawnGrowth: 1.14,
  budgetBase: 6,
  budgetGrowth: 1.22,
  huntersPerWave: (i) => Math.round(3 + i * 1.7),
};

// Levels of light the HUD shows; lumen is scored as glow points at wave end.
export const SCORING = {
  moteCommon: 4,
  moteBright: 10,
  moteRare: 26,
  waveClearBonus: 40,
  survivalPerSecond: 1,
};

// Input deadzone so a resting cursor does not drag the firefly.
export const INPUT_DEADZONE = 6;
