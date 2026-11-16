// player.js — LUMEN: Shadowfall's firefly. Floaty acceleration toward the steer target,
// a dash with a cooldown, light (lumen) as health, brief invulnerability after a hit.

import { PLAYER } from './config.js';

export function createPlayer(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    radius: PLAYER.radius,
    lumen: PLAYER.lumenStart,
    invuln: 0,
    dashCd: 0,
    dashTime: 0,
    trail: [],           // fading afterglow positions
    wingPhase: 0,
  };
}

export function updatePlayer(p, target, dt) {
  p.wingPhase += dt * 34;

  if (p.dashTime > 0) {
    p.dashTime -= dt;
    // Dash: keep momentum, skip steering friction for its duration.
  } else if (target) {
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const want = Math.min(dist * 8, PLAYER.accel);
    p.vx += (dx / dist) * want * dt;
    p.vy += (dy / dist) * want * dt;
  }

  // Damping and speed clamp.
  const damp = Math.exp(-PLAYER.damping * dt);
  p.vx *= damp;
  p.vy *= damp;
  const sp = Math.hypot(p.vx, p.vy);
  const cap = p.dashTime > 0 ? PLAYER.maxSpeed * 2.3 : PLAYER.maxSpeed;
  if (sp > cap) {
    p.vx = (p.vx / sp) * cap;
    p.vy = (p.vy / sp) * cap;
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Keep the firefly in the garden.
  const r = p.radius;
  p.x = Math.max(r, Math.min(960 - r, p.x));
  p.y = Math.max(r, Math.min(640 - r, p.y));

  // Timers.
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashCd > 0) p.dashCd -= dt;

  // Trail.
  p.trail.push({ x: p.x, y: p.y, a: 1 });
  if (p.trail.length > 26) p.trail.shift();
  for (const t of p.trail) t.a -= dt * 2.6;
  p.trail = p.trail.filter((t) => t.a > 0);
}

export function tryDash(p) {
  if (p.dashCd > 0) return false;
  p.dashCd = 2.4;
  p.dashTime = 0.16;
  return true;
}

export function hitPlayer(p, dmg) {
  if (p.invuln > 0) return false;
  p.lumen -= dmg;
  p.invuln = PLAYER.invulnTime;
  return true;
}
