// audio.js — LUMEN: Shadowfall sound. Pure WebAudio, no files: every effect is synthesised,
// so the game stays self-contained. Muted until the player's first key or click (autoplay
// policy), and can be toggled with M.

const AUDIO = {
  ctx: null,
  master: null,
  muted: false,
  unlocked: false,
};

function ensureCtx() {
  if (AUDIO.ctx) return AUDIO.ctx;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  AUDIO.ctx = new Ctx();
  AUDIO.master = AUDIO.ctx.createGain();
  AUDIO.master.gain.value = 0.32;
  AUDIO.master.connect(AUDIO.ctx.destination);
  return AUDIO.ctx;
}

function unlock() {
  const ctx = ensureCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  AUDIO.unlocked = true;
}

// One blip: an oscillator with a pitch slide and a short envelope.
function blip({ freq = 440, to = null, time = 0.12, type = 'sine', gain = 0.5, delay = 0 }) {
  if (AUDIO.muted || !AUDIO.unlocked) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + time);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + time);
  osc.connect(env);
  env.connect(AUDIO.master);
  osc.start(t0);
  osc.stop(t0 + time + 0.05);
}

function noiseBurst({ time = 0.25, gain = 0.4, lowpass = 900 }) {
  if (AUDIO.muted || !AUDIO.unlocked) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * time);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(filter);
  filter.connect(env);
  env.connect(AUDIO.master);
  src.start(t0);
}

// The pulse: a slow two-note loop that quickens with the wave index.
const PULSE = { timer: null, wave: 0 };

function pulseTick() {
  const fast = Math.max(0.32, 1.5 - PULSE.wave * 0.09);
  const low = 96 + Math.min(PULSE.wave, 8) * 6;
  blip({ freq: low, to: low * 0.5, time: 0.5, type: 'triangle', gain: 0.16 });
  blip({ freq: low * 1.5, to: low, time: 0.34, type: 'triangle', gain: 0.1, delay: fast * 0.5 });
  PULSE.timer = setTimeout(pulseTick, fast * 1000);
}

export const audio = {
  unlock,
  startPulse(wave) { PULSE.wave = wave; if (!PULSE.timer) pulseTick(); },
  stopPulse() { clearTimeout(PULSE.timer); PULSE.timer = null; },
  setWave(wave) { PULSE.wave = wave; },
  collectMote(rare) {
    blip({ freq: rare ? 880 : 620, to: rare ? 1560 : 980, time: 0.1, type: 'sine', gain: 0.22 });
  },
  shard() { blip({ freq: 340, to: 210, time: 0.08, type: 'square', gain: 0.12 }); },
  hit() { noiseBurst({ time: 0.4, gain: 0.5, lowpass: 520 }); blip({ freq: 130, to: 60, time: 0.3, type: 'sawtooth', gain: 0.2 }); },
  dash() { blip({ freq: 240, to: 720, time: 0.14, type: 'sine', gain: 0.16 }); },
  waveClear() {
    [523, 659, 784, 1047].forEach((f, i) => blip({ freq: f, time: 0.18, type: 'sine', gain: 0.2, delay: i * 0.09 }));
  },
  gameOver() {
    [392, 311, 247, 175].forEach((f, i) => blip({ freq: f, to: f * 0.8, time: 0.3, type: 'triangle', gain: 0.22, delay: i * 0.16 }));
  },
  uiSelect() { blip({ freq: 500, to: 700, time: 0.06, type: 'sine', gain: 0.12 }); },
  toggleMute() {
    AUDIO.muted = !AUDIO.muted;
    return AUDIO.muted;
  },
};
