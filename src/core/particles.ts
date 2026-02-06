/**
 * PARTICLE SYSTEM
 * Lightweight particle effects for game juice — hit effects, death bursts,
 * XP collection sparkles, weapon trails, etc.
 */

import { Vec2 } from './types';
import { camera } from './camera';
import { randRange, fromAngle } from '../utils/math';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shrink: boolean;
  gravity: number;
}

const MAX_PARTICLES = 2000;
const pool: Particle[] = [];
let activeCount = 0;

function emit(p: Omit<Particle, 'maxLife'>) {
  if (activeCount >= MAX_PARTICLES) return;
  if (activeCount < pool.length) {
    const existing = pool[activeCount];
    Object.assign(existing, p);
    existing.maxLife = p.life;
  } else {
    pool.push({ ...p, maxLife: p.life });
  }
  activeCount++;
}

/** Burst of particles from a point (e.g., enemy death) */
export function burstParticles(
  pos: Vec2, count: number, color: string,
  speed = 120, life = 0.4, size = 3
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dir = fromAngle(angle);
    const spd = randRange(speed * 0.5, speed);
    emit({
      x: pos.x, y: pos.y,
      vx: dir.x * spd, vy: dir.y * spd,
      life, size: randRange(size * 0.5, size * 1.5),
      color, shrink: true, gravity: 0,
    });
  }
}

/** Directional spray (e.g., hit impact) */
export function sprayParticles(
  pos: Vec2, dir: Vec2, count: number, color: string,
  spread = 0.5, speed = 150, life = 0.3
) {
  const baseAngle = Math.atan2(dir.y, dir.x);
  for (let i = 0; i < count; i++) {
    const a = baseAngle + randRange(-spread, spread);
    const d = fromAngle(a);
    const spd = randRange(speed * 0.6, speed);
    emit({
      x: pos.x, y: pos.y,
      vx: d.x * spd, vy: d.y * spd,
      life, size: randRange(2, 4),
      color, shrink: true, gravity: 0,
    });
  }
}

/** Floating text particle (damage numbers) */
export function floatingText(pos: Vec2, text: string, color = '#fff') {
  // We'll draw these as oversized "particles" — the draw function
  // handles text rendering for large sizes
  emit({
    x: pos.x, y: pos.y,
    vx: randRange(-20, 20), vy: -60,
    life: 0.8, size: 14,
    color, shrink: false, gravity: 0,
  });
  // Store text as a side-channel via the textParticles array
  textParticles.push({ x: pos.x, y: pos.y, text, vy: -60, life: 0.8, color });
}

interface TextParticle {
  x: number; y: number; text: string; vy: number; life: number; color: string;
}
const textParticles: TextParticle[] = [];

export function updateParticles(dt: number) {
  // Update regular particles
  let i = 0;
  while (i < activeCount) {
    const p = pool[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.life -= dt;
    if (p.life <= 0) {
      // Swap with last active
      activeCount--;
      if (i < activeCount) {
        const temp = pool[activeCount];
        pool[activeCount] = pool[i];
        pool[i] = temp;
      }
    } else {
      i++;
    }
  }
  // Update text particles
  for (let j = textParticles.length - 1; j >= 0; j--) {
    const tp = textParticles[j];
    tp.y += tp.vy * dt;
    tp.life -= dt;
    if (tp.life <= 0) textParticles.splice(j, 1);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < activeCount; i++) {
    const p = pool[i];
    if (!camera.isVisible(p.x, p.y, 50)) continue;
    const alpha = Math.min(1, p.life / (p.maxLife * 0.3));
    const size = p.shrink ? p.size * (p.life / p.maxLife) : p.size;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;

  // Draw text particles
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const tp of textParticles) {
    if (!camera.isVisible(tp.x, tp.y, 50)) continue;
    const alpha = Math.min(1, tp.life / 0.3);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(tp.text, tp.x + 1, tp.y + 1);
    ctx.fillStyle = tp.color;
    ctx.fillText(tp.text, tp.x, tp.y);
  }
  ctx.globalAlpha = 1;
}

export function clearParticles() {
  activeCount = 0;
  textParticles.length = 0;
}
