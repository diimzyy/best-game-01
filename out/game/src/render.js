// render.js — LUMEN: Shadowfall painting. Everything is drawn: the night garden backdrop,
// the glowing firefly with wings and trail, motes, hunters with spawn fades, shards, HUD,
// and the menu / pause / game-over screens. No images, no fonts beyond the page.

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return { draw };
}

function draw(ctx, world, canvas) {
  const W = canvas.width, H = canvas.height;

  // Night garden backdrop: vignette + soft star specks (static per seed).
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, world.seed, W, H);
  drawVignette(ctx, W, H);

  // Light radius follows lumen: the more light you hold, the further you see.
  const p = world.player;
  const lightR = 130 + (p.lumen / PLAYER_MAX) * 240;
  drawLight(ctx, p.x, p.y, lightR);

  // Motes, shards, hunters, player.
  for (const s of world.shards) drawShard(ctx, s);
  for (const m of world.motes) drawMote(ctx, m);
  for (const h of world.hunters) drawHunter(ctx, h);
  drawPlayer(ctx, p);

  // HUD.
  drawHud(ctx, world, W, H);

  // Overlays.
  if (world.phase === 'menu') drawMenu(ctx, W, H, world);
  if (world.phase === 'paused') drawPause(ctx, W, H);
  if (world.phase === 'over') drawOver(ctx, W, H, world);
}

const PLAYER_MAX = 140;

function drawStars(ctx, seed, W, H) {
  let s = (seed >>> 0) || 7;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const x = rng() * W, y = rng() * H;
    const a = 0.05 + rng() * 0.16;
    ctx.fillStyle = `rgba(220,232,242,${a})`;
    ctx.fillRect(x, y, rng() < 0.12 ? 2 : 1, rng() < 0.12 ? 2 : 1);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H * 0.58, H * 0.2, W / 2, H * 0.58, W * 0.75);
  g.addColorStop(0, 'rgba(11,15,20,0)');
  g.addColorStop(1, 'rgba(4,6,9,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawLight(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,211,92,0.20)');
  g.addColorStop(0.35, 'rgba(255,211,92,0.08)');
  g.addColorStop(1, 'rgba(255,211,92,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, p) {
  // Trail first: fading afterglow.
  for (const t of p.trail) {
    ctx.fillStyle = `rgba(255,157,46,${t.a * 0.22})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4 * t.a + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const flick = 0.9 + Math.sin(p.wingPhase) * 0.1;
  // Glow.
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 * flick);
  g.addColorStop(0, 'rgba(255,224,130,0.9)');
  g.addColorStop(0.4, 'rgba(255,211,92,0.45)');
  g.addColorStop(1, 'rgba(255,157,46,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26 * flick, 0, Math.PI * 2);
  ctx.fill();

  // Body: a small bright core.
  ctx.fillStyle = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 ? '#ffffff' : '#ffe082';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Wings: two ellipses beating.
  const flap = Math.abs(Math.sin(p.wingPhase)) * 0.9 + 0.25;
  ctx.fillStyle = 'rgba(255,240,200,0.35)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(side * (0.7 + flap * 0.35));
    ctx.beginPath();
    ctx.ellipse(0, -p.radius * 1.1, p.radius * 0.42, p.radius * 1.1 * flap, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMote(ctx, m) {
  const fade = m.age < 1 ? m.age : Math.max(0, (MOTE_LIFE - m.age) / 1.5);
  if (fade <= 0) return;
  const color = m.kind === 'rare' ? '#9be8ff' : m.kind === 'bright' ? '#fff2b0' : '#ffd35c';
  const r = m.kind === 'rare' ? 9 : m.kind === 'bright' ? 7 : 5;
  const pulse = 0.85 + Math.sin(m.phase + performance.now() * 0.004) * 0.15;
  const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 2.4 * pulse);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,211,92,0)');
  ctx.globalAlpha = fade;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(m.x, m.y, r * 2.4 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const MOTE_LIFE = 9.5;

function drawHunter(ctx, h) {
  const fadeIn = Math.min(1, h.spawnAge / 0.6);
  const wob = Math.sin(h.phase * 3) * 0.12;
  ctx.save();
  ctx.globalAlpha = 0.22 + fadeIn * 0.6;
  ctx.translate(h.x, h.y);
  ctx.rotate(h.phase * 0.7 + wob);
  // Body: dark shard with a cold rim.
  ctx.beginPath();
  const spikes = h.kind === 'reaper' ? 5 : h.kind === 'hunter' ? 3 : 4;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? h.radius : h.radius * 0.55;
    ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = h.color;
  ctx.fill();
  ctx.strokeStyle = h.kind === 'hunter' ? 'rgba(255,92,122,0.55)' : 'rgba(125,143,163,0.4)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Eye.
  ctx.fillStyle = h.kind === 'hunter' ? '#ff5c7a' : '#7d8fa3';
  ctx.beginPath();
  ctx.arc(0, 0, h.radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShard(ctx, s) {
  const fade = Math.max(0, (SHARD_LIFE - s.age) / 1.2);
  ctx.globalAlpha = fade * 0.9;
  ctx.fillStyle = '#bfe3ff';
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.age * 2);
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();
  ctx.globalAlpha = 1;
}

const SHARD_LIFE = 5;

function drawHud(ctx, world, W, H) {
  const p = world.player;
  ctx.save();
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(220,232,242,0.85)';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 16, 24);
  ctx.fillText(`WAVE ${world.waveIndex + 1}`, 16, 42);
  ctx.fillText(`BEST ${world.bestScore}`, W - 110, 24);

  // Lumen bar.
  const bx = 16, by = H - 20, bw = 220;
  ctx.fillStyle = 'rgba(31,42,58,0.8)';
  ctx.fillRect(bx, by, bw, 8);
  const frac = Math.max(0, p.lumen / PLAYER_MAX);
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#ffd35c');
  grad.addColorStop(1, frac < 0.3 ? '#ff5c7a' : '#ffe082');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw * frac, 8);
  ctx.fillStyle = 'rgba(125,143,163,0.9)';
  ctx.fillText('LUMEN', bx, by - 6);
  ctx.restore();
}

function drawMenu(ctx, W, H, world) {
  overlay(ctx, W, H, 0.55);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd35c';
  ctx.font = '42px ui-monospace, monospace';
  ctx.fillText('LUMEN', W / 2, H / 2 - 60);
  ctx.fillStyle = '#dce8f2';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText('Shadowfall', W / 2, H / 2 - 34);
  ctx.fillStyle = 'rgba(220,232,242,0.75)';
  ctx.fillText('guide the firefly · collect motes · shatter the dark', W / 2, H / 2 + 6);
  ctx.fillText('move: pointer / WASD · dash: SHIFT or click · M mute · ESC pause', W / 2, H / 2 + 28);
  if (world.bestScore > 0) ctx.fillText(`best ${world.bestScore}`, W / 2, H / 2 + 58);
  ctx.fillStyle = '#ffe082';
  ctx.fillText('press ENTER to begin', W / 2, H / 2 + 96);
  ctx.restore();
}

function drawPause(ctx, W, H) {
  overlay(ctx, W, H, 0.5);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#dce8f2';
  ctx.font = '30px ui-monospace, monospace';
  ctx.fillText('paused', W / 2, H / 2);
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(220,232,242,0.7)';
  ctx.fillText('ESC to resume', W / 2, H / 2 + 26);
  ctx.restore();
}

function drawOver(ctx, W, H, world) {
  overlay(ctx, W, H, 0.68);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5c7a';
  ctx.font = '34px ui-monospace, monospace';
  ctx.fillText('the light fades', W / 2, H / 2 - 24);
  ctx.fillStyle = '#dce8f2';
  ctx.font = '18px ui-monospace, monospace';
  ctx.fillText(`score ${Math.floor(world.score)} · wave ${world.waveIndex + 1}`, W / 2, H / 2 + 8);
  ctx.fillStyle = 'rgba(220,232,242,0.75)';
  ctx.fillText(`best ${world.bestScore}`, W / 2, H / 2 + 32);
  ctx.fillStyle = '#ffe082';
  ctx.fillText('ENTER to fly again', W / 2, H / 2 + 68);
  ctx.restore();
}

function overlay(ctx, W, H, alpha) {
  ctx.fillStyle = `rgba(4,6,9,${alpha})`;
  ctx.fillRect(0, 0, W, H);
}
