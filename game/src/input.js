// input.js — LUMEN: Shadowfall controls. The firefly chases the pointer; SHIFT dashes;
// M mutes; ESC pauses; ENTER restarts / advances menus. Tracks edge events for the engine.

import { INPUT_DEADZONE } from './config.js';

const state = {
  pointer: { x: 480, y: 320, active: false },
  dash: false,        // edge-triggered
  dashHeld: false,
  pause: false,       // edge-triggered
  confirm: false,     // edge-triggered (ENTER)
  mute: false,        // edge-triggered
  keys: new Set(),
};

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    state.keys.add(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { state.dash = true; state.dashHeld = true; }
    if (e.code === 'Escape') state.pause = true;
    if (e.code === 'Enter') state.confirm = true;
    if (e.code === 'KeyM') state.mute = true;
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    state.keys.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.dashHeld = false;
  });

  const rect = () => canvas.getBoundingClientRect();
  canvas.addEventListener('pointermove', (e) => {
    const r = rect();
    state.pointer.x = ((e.clientX - r.left) / r.width) * canvas.width;
    state.pointer.y = ((e.clientY - r.top) / r.height) * canvas.height;
    state.pointer.active = true;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = rect();
    state.pointer.x = ((e.clientX - r.left) / r.width) * canvas.width;
    state.pointer.y = ((e.clientY - r.top) / r.height) * canvas.height;
    state.pointer.active = true;
    state.dash = true;
  });
}

// Target the firefly steers toward: pointer if it has moved, else keyboard WASD/arrows.
export function steerTarget(player) {
  const dx = state.pointer.x - player.x;
  const dy = state.pointer.y - player.y;
  if (state.pointer.active && Math.hypot(dx, dy) > INPUT_DEADZONE) {
    return { x: state.pointer.x, y: state.pointer.y };
  }
  let kx = 0, ky = 0;
  if (state.keys.has('KeyA') || state.keys.has('ArrowLeft')) kx -= 1;
  if (state.keys.has('KeyD') || state.keys.has('ArrowRight')) kx += 1;
  if (state.keys.has('KeyW') || state.keys.has('ArrowUp')) ky -= 1;
  if (state.keys.has('KeyS') || state.keys.has('ArrowDown')) ky += 1;
  if (kx || ky) {
    const len = Math.hypot(kx, ky);
    return { x: player.x + (kx / len) * 120, y: player.y + (ky / len) * 120 };
  }
  return null;
}

// Edge triggers: read once per frame, then cleared.
export function consumeDash() { const d = state.dash; state.dash = false; return d; }
export function consumePause() { const p = state.pause; state.pause = false; return p; }
export function consumeConfirm() { const c = state.confirm; state.confirm = false; return c; }
export function consumeMute() { const m = state.mute; state.mute = false; return m; }
