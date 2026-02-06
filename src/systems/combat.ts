/**
 * COMBAT SYSTEM
 *
 * Handles weapon attacks: cooldowns, spawning projectiles/sweeps,
 * hit detection, damage application, and visual feedback.
 */

import { Entity, PlayerState, ActiveWeapon, WeaponDef, Vec2, CANVAS_W, CANVAS_H } from '../core/types';
import { getWeaponDef } from '../content/weapons/index';
import { camera } from '../core/camera';
import { burstParticles, sprayParticles, floatingText } from '../core/particles';
import {
  dist, sub, normalize, angle, fromAngle, scale, add,
  circlesOverlap, randRange,
} from '../utils/math';

// ── Attack entities (projectiles, sweeps) ────────────────────────────

export interface AttackEntity {
  weaponId: string;
  pos: Vec2;
  vel: Vec2;
  size: number;
  damage: number;
  knockback: number;
  piercing: number;
  hitEnemies: Set<number>; // track which enemies we've already hit
  lifetime: number;
  maxLifetime: number;
  pattern: string;
  angle: number;   // for sweep rendering
  arcLen: number;   // for sweep rendering
}

const attacks: AttackEntity[] = [];

export function getAttacks(): readonly AttackEntity[] {
  return attacks;
}

export function clearAttacks() {
  attacks.length = 0;
}

// ── Weapon firing ────────────────────────────────────────────────────

export function updateWeapons(player: PlayerState, enemies: Entity[], dt: number) {
  for (const weapon of player.weapons) {
    weapon.cooldownTimer -= dt;
    if (weapon.cooldownTimer <= 0) {
      fireWeapon(player, weapon, enemies);
      const def = getWeaponDef(weapon.defId);
      weapon.cooldownTimer = def.cooldown / player.stats.attackSpeed;
    }
  }
}

function fireWeapon(player: PlayerState, weapon: ActiveWeapon, enemies: Entity[]) {
  const def = getWeaponDef(weapon.defId);
  const dmg = def.damage * player.stats.damage * (1 + (weapon.level - 1) * 0.2);
  const area = def.area * player.stats.area;

  switch (def.pattern) {
    case 'sweep':
      fireSweep(player, def, dmg, area);
      break;
    case 'projectile':
      fireProjectile(player, def, dmg, area, enemies);
      break;
    case 'nova':
      fireNova(player, def, dmg, area);
      break;
    default:
      fireSweep(player, def, dmg, area);
  }
}

function fireSweep(player: PlayerState, def: WeaponDef, dmg: number, area: number) {
  const dir = player.facing;
  const a = angle(dir);
  const arcLen = (area * Math.PI) / 180; // convert degrees to radians

  attacks.push({
    weaponId: def.id,
    pos: { ...player.pos },
    vel: { x: 0, y: 0 },
    size: def.range * player.stats.area,
    damage: dmg,
    knockback: def.knockback,
    piercing: def.piercing,
    hitEnemies: new Set(),
    lifetime: 0.2,
    maxLifetime: 0.2,
    pattern: 'sweep',
    angle: a,
    arcLen,
  });
}

function fireProjectile(
  player: PlayerState, def: WeaponDef, dmg: number, area: number,
  enemies: Entity[]
) {
  // Find nearest enemy to aim at
  const target = findNearestEnemy(player.pos, enemies);
  let dir: Vec2;
  if (target) {
    dir = normalize(sub(target.pos, player.pos));
  } else {
    dir = { ...player.facing };
  }

  const count = 1 + player.stats.projectileCount;
  const spreadAngle = count > 1 ? 0.15 : 0; // slight spread for multishot

  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? (i - (count - 1) / 2) * spreadAngle : 0;
    const a = angle(dir) + offset;
    const d = fromAngle(a);

    attacks.push({
      weaponId: def.id,
      pos: { ...player.pos },
      vel: scale(d, def.projectileSpeed),
      size: area,
      damage: dmg,
      knockback: def.knockback,
      piercing: def.piercing,
      hitEnemies: new Set(),
      lifetime: def.range / def.projectileSpeed,
      maxLifetime: def.range / def.projectileSpeed,
      pattern: 'projectile',
      angle: a,
      arcLen: 0,
    });
  }
}

function fireNova(player: PlayerState, def: WeaponDef, dmg: number, area: number) {
  const count = 8 + player.stats.projectileCount * 2;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const d = fromAngle(a);
    attacks.push({
      weaponId: def.id,
      pos: { ...player.pos },
      vel: scale(d, def.projectileSpeed),
      size: area,
      damage: dmg,
      knockback: def.knockback,
      piercing: def.piercing,
      hitEnemies: new Set(),
      lifetime: def.range / def.projectileSpeed,
      maxLifetime: def.range / def.projectileSpeed,
      pattern: 'projectile',
      angle: a,
      arcLen: 0,
    });
  }
}

// ── Attack update & hit detection ────────────────────────────────────

export interface HitResult {
  enemyId: number;
  damage: number;
  knockbackDir: Vec2;
  knockback: number;
  pos: Vec2;
  weaponColor: string;
}

export function updateAttacks(enemies: Entity[], dt: number): HitResult[] {
  const hits: HitResult[] = [];

  for (let i = attacks.length - 1; i >= 0; i--) {
    const atk = attacks[i];
    const def = getWeaponDef(atk.weaponId);

    // Move projectiles
    atk.pos.x += atk.vel.x * dt;
    atk.pos.y += atk.vel.y * dt;
    atk.lifetime -= dt;

    // Check hits against enemies
    for (const enemy of enemies) {
      if (!enemy.alive || atk.hitEnemies.has(enemy.id)) continue;

      let hit = false;
      if (atk.pattern === 'sweep') {
        hit = checkSweepHit(atk, enemy);
      } else {
        hit = circlesOverlap(
          atk.pos.x, atk.pos.y, atk.size,
          enemy.pos.x, enemy.pos.y, enemy.size
        );
      }

      if (hit) {
        atk.hitEnemies.add(enemy.id);
        const knockDir = normalize(sub(enemy.pos, atk.pos));
        hits.push({
          enemyId: enemy.id,
          damage: atk.damage,
          knockbackDir: knockDir,
          knockback: atk.knockback,
          pos: { ...enemy.pos },
          weaponColor: def.trailColor,
        });

        if (atk.piercing <= 0) {
          atk.lifetime = 0;
          break;
        }
        atk.piercing--;
      }
    }

    if (atk.lifetime <= 0) {
      attacks.splice(i, 1);
    }
  }

  return hits;
}

function checkSweepHit(atk: AttackEntity, enemy: Entity): boolean {
  const dx = enemy.pos.x - atk.pos.x;
  const dy = enemy.pos.y - atk.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > atk.size + enemy.size) return false;

  // Check if enemy is within sweep arc
  const enemyAngle = Math.atan2(dy, dx);
  let angleDiff = enemyAngle - atk.angle;
  // Normalize to [-PI, PI]
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  return Math.abs(angleDiff) <= atk.arcLen / 2;
}

// ── Helpers ──────────────────────────────────────────────────────────

function findNearestEnemy(pos: Vec2, enemies: Entity[]): Entity | null {
  let nearest: Entity | null = null;
  let nearestDist = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = dist(pos, e.pos);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e;
    }
  }
  return nearest;
}

// ── Drawing ──────────────────────────────────────────────────────────

export function drawAttacks(ctx: CanvasRenderingContext2D) {
  for (const atk of attacks) {
    if (!camera.isVisible(atk.pos.x, atk.pos.y, atk.size + 50)) continue;
    const def = getWeaponDef(atk.weaponId);
    const progress = 1 - atk.lifetime / atk.maxLifetime;

    if (atk.pattern === 'sweep') {
      // Draw arc sweep
      ctx.save();
      ctx.translate(atk.pos.x, atk.pos.y);
      ctx.globalAlpha = 0.6 * (1 - progress);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, atk.size, atk.angle - atk.arcLen / 2, atk.angle + atk.arcLen / 2);
      ctx.closePath();
      ctx.fillStyle = def.color;
      ctx.fill();
      // Bright edge
      ctx.strokeStyle = def.trailColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      // Draw projectile
      ctx.beginPath();
      ctx.arc(atk.pos.x, atk.pos.y, atk.size, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(atk.pos.x, atk.pos.y, atk.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = def.trailColor;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
