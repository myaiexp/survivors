/**
 * XP & LEVELING SYSTEM
 *
 * Manages XP gems (pickups), magnet attraction, collection,
 * and level-up threshold calculations.
 */

import { PlayerState, Pickup, Vec2, XP_BASE, XP_SCALE } from '../core/types';
import { dist, sub, normalize, scale, add } from '../utils/math';
import { burstParticles } from '../core/particles';

let pickups: Pickup[] = [];
let nextPickupId = 5000;

export function getPickups(): Pickup[] {
  return pickups;
}

export function clearPickups() {
  pickups = [];
  nextPickupId = 5000;
}

/** Spawn an XP gem at position */
export function spawnXpGem(pos: Vec2, value: number) {
  pickups.push({
    id: nextPickupId++,
    tag: 'pickup',
    pos: { x: pos.x, y: pos.y },
    vel: { x: 0, y: 0 },
    size: 4 + Math.min(value, 10),
    hp: 1,
    maxHp: 1,
    alive: true,
    facing: { x: 0, y: 0 },
    speed: 0,
    knockbackVel: { x: 0, y: 0 },
    invulnTimer: 0,
    flashTimer: 0,
    pickupType: 'xp',
    value,
    magnetized: false,
  });
}

/** Update pickup magnetism and collection */
export function updatePickups(player: PlayerState, dt: number): number {
  let xpGained = 0;
  const magnetRange = player.magnetRadius;
  const collectRange = 16;

  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if (!p.alive) {
      pickups.splice(i, 1);
      continue;
    }

    const d = dist(p.pos, player.pos);

    // Magnet attraction
    if (d < magnetRange || p.magnetized) {
      p.magnetized = true;
      const dir = normalize(sub(player.pos, p.pos));
      const attractSpeed = 400;
      p.pos.x += dir.x * attractSpeed * dt;
      p.pos.y += dir.y * attractSpeed * dt;
    }

    // Collection
    if (d < collectRange) {
      p.alive = false;
      if (p.pickupType === 'xp') {
        const gained = Math.round(p.value * player.stats.xpGain);
        xpGained += gained;
        burstParticles(p.pos, 4, '#ffd700', 60, 0.3, 2);
      } else if (p.pickupType === 'heal') {
        player.hp = Math.min(player.hp + p.value, player.maxHp);
        burstParticles(p.pos, 6, '#44ff44', 80, 0.4, 3);
      }
      pickups.splice(i, 1);
    }
  }

  return xpGained;
}

/** Calculate XP needed for a given level */
export function xpForLevel(level: number): number {
  return Math.round(XP_BASE * Math.pow(XP_SCALE, level - 1));
}

/** Add XP and return number of level-ups */
export function addXp(player: PlayerState, amount: number): number {
  player.xp += amount;
  let levelUps = 0;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = xpForLevel(player.level);
    levelUps++;
  }
  return levelUps;
}

// ── Drawing ──────────────────────────────────────────────────────────

export function drawPickups(ctx: CanvasRenderingContext2D) {
  for (const p of pickups) {
    if (!p.alive) continue;
    const pulse = 1 + Math.sin(Date.now() * 0.005 + p.id) * 0.15;
    const s = p.size * pulse;

    if (p.pickupType === 'xp') {
      // Diamond shape
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      ctx.rotate(Math.PI / 4);
      // Glow
      ctx.fillStyle = '#ffd700';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
      // Gem
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
      ctx.restore();
    } else if (p.pickupType === 'heal') {
      ctx.fillStyle = '#44ff44';
      ctx.fillRect(p.pos.x - 2, p.pos.y - s / 2, 4, s);
      ctx.fillRect(p.pos.x - s / 2, p.pos.y - 2, s, 4);
    }
  }
}
