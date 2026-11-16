// main.js — LUMEN: Shadowfall entry point. Wires input, audio, world, renderer, and the
// fixed-timestep loop; owns the menu / pause / game-over key handling.

import { initInput, steerTarget, consumeDash, consumePause, consumeConfirm, consumeMute } from './input.js';
import { createWorld, startRun, updateWorld, togglePause } from './world.js';
import { audio } from './audio.js';
import { createRenderer } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const renderer = createRenderer(canvas);
const world = createWorld((Date.now() / 1000) & 0xffffffff);

initInput(canvas);

// First interaction unlocks WebAudio (autoplay policy).
const unlockAudio = () => audio.unlock();
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('pointerdown', unlockAudio, { once: true });

let last = performance.now();
const STEP = 1 / 120;      // fixed sim step
let acc = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += dt;

  // Edge events.
  if (consumeMute()) audio.toggleMute();
  if (consumePause() && world.phase === 'playing') togglePause(world);
  else if (consumePause() && world.phase === 'paused') togglePause(world);
  if (consumeConfirm()) {
    if (world.phase === 'menu' || world.phase === 'over') {
      startRun(world);
      audio.uiSelect();
      audio.startPulse(0);
    }
  }

  // Fixed-step simulation.
  while (acc >= STEP && world.phase === 'playing') {
    updateWorld(world, STEP, { steer: steerTarget, consumeDash }, audio);
    acc -= STEP;
  }
  if (world.phase !== 'playing') acc = 0;

  // Renderer takes the world as-is each frame.
  renderer.draw(ctx, world, canvas);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
