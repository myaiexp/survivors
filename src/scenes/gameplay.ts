/**
 * GAMEPLAY SCENE
 *
 * The main game loop scene. Handles player movement, enemy AI, combat,
 * XP collection, leveling, and the run timer.
 */

import {
  GameState, PlayerState, Entity, CANVAS_W, CANVAS_H, RUN_DURATION,
  defaultStats, ActiveWeapon, Pickup,
} from '../core/types';
import { input } from '../core/input';
import { camera } from '../core/camera';
import { updateParticles, drawParticles, clearParticles, burstParticles, sprayParticles, floatingText } from '../core/particles';
import { updateWeapons, updateAttacks, drawAttacks, clearAttacks, getAttacks, HitResult } from '../systems/combat';
import { updateSpawner, resetSpawner, getEnemyData, getWave } from '../systems/spawner';
import { updatePickups, drawPickups, clearPickups, spawnXpGem, addXp, xpForLevel } from '../systems/xp';
import { drawHud } from '../ui/hud';
import { getCharacterDef } from '../content/characters/index';
import { getWeaponDef } from '../content/weapons/index';
import { getAvailableUpgrades, upgradeDefs } from '../content/upgrades/index';
import {
  normalize, sub, dist, scale, add, clamp, circlesOverlap, randRange,
} from '../utils/math';

// ── State ────────────────────────────────────────────────────────────

let enemies: Entity[] = [];
let damageCooldowns = new Map<number, number>(); // enemy id -> cooldown for contact dmg
let upgradeTakenCounts = new Map<string, number>();
let selectedCharacterId = 'knight';

export function setCharacter(id: string) {
  selectedCharacterId = id;
}

// ── Scene Interface ──────────────────────────────────────────────────

export function enter(state: GameState) {
  enemies = [];
  damageCooldowns.clear();
  upgradeTakenCounts.clear();
  clearAttacks();
  clearPickups();
  clearParticles();
  resetSpawner();

  state.runTime = 0;
  state.wave = 0;
  state.gameResult = null;
  state.paused = false;

  // Create player
  const charDef = getCharacterDef(selectedCharacterId);
  const stats = defaultStats();

  // Apply character stat modifiers
  for (const [key, val] of Object.entries(charDef.statModifiers)) {
    if (key in stats) {
      (stats as any)[key] += val;
    }
  }

  const player: PlayerState = {
    id: 0,
    tag: 'player',
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    size: 14,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    alive: true,
    facing: { x: 1, y: 0 },
    speed: stats.speed,
    knockbackVel: { x: 0, y: 0 },
    invulnTimer: 0,
    flashTimer: 0,
    xp: 0,
    level: 1,
    xpToNext: xpForLevel(1),
    kills: 0,
    weapons: [{
      defId: charDef.startingWeaponId,
      level: 1,
      cooldownTimer: 0,
    }],
    stats,
    characterId: selectedCharacterId,
    magnetRadius: stats.magnetRange,
  };

  state.player = player;
  camera.x = 0;
  camera.y = 0;
}

export function update(state: GameState, dt: number) {
  const player = state.player!;
  if (!player.alive) return;

  // ── Run Timer ──
  state.runTime += dt;
  state.wave = getWave();
  if (state.runTime >= RUN_DURATION) {
    state.gameResult = 'victory';
    state.scene = 'gameover';
    return;
  }

  // ── Player Movement ──
  const moveDir = input.getMovement();
  player.vel.x = moveDir.x * player.stats.speed;
  player.vel.y = moveDir.y * player.stats.speed;

  // Update facing direction
  if (moveDir.x !== 0 || moveDir.y !== 0) {
    player.facing = { ...moveDir };
  }

  // Apply velocity + knockback
  player.pos.x += (player.vel.x + player.knockbackVel.x) * dt;
  player.pos.y += (player.vel.y + player.knockbackVel.y) * dt;

  // Decay knockback
  player.knockbackVel.x *= 0.85;
  player.knockbackVel.y *= 0.85;

  // Invulnerability
  if (player.invulnTimer > 0) player.invulnTimer -= dt;
  if (player.flashTimer > 0) player.flashTimer -= dt;

  // ── Camera ──
  camera.follow(player.pos, dt);
  camera.update(dt);
  input.updateMouseWorld(camera.x, camera.y);

  // ── Enemy Spawning ──
  const newEnemies = updateSpawner(player, enemies, state.runTime, dt);
  enemies.push(...newEnemies);

  // ── Enemy AI ──
  updateEnemies(player, dt);

  // ── Weapons ──
  updateWeapons(player, enemies, dt);

  // ── Attack Hit Detection ──
  const hits = updateAttacks(enemies, dt);
  processHits(hits, player);

  // ── Contact Damage ──
  processContactDamage(player, dt);

  // ── Pickups ──
  const xpGained = updatePickups(player, dt);
  if (xpGained > 0) {
    const levelUps = addXp(player, xpGained);
    for (let i = 0; i < levelUps; i++) {
      triggerLevelUp(state);
    }
  }

  // ── Particles ──
  updateParticles(dt);

  // ── Death Check ──
  if (player.hp <= 0) {
    player.alive = false;
    player.hp = 0;
    burstParticles(player.pos, 30, '#ff4444', 150, 0.6, 5);
    state.gameResult = 'defeat';
    // Brief delay before game over
    setTimeout(() => {
      state.scene = 'gameover';
    }, 1000);
  }

  // ── Cleanup dead enemies ──
  enemies = enemies.filter(e => e.alive);
}

function updateEnemies(player: PlayerState, dt: number) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const data = getEnemyData(enemy);

    // Chase behavior
    const dir = normalize(sub(player.pos, enemy.pos));
    enemy.facing = dir;
    enemy.vel.x = dir.x * enemy.speed;
    enemy.vel.y = dir.y * enemy.speed;

    // Apply velocity + knockback
    enemy.pos.x += (enemy.vel.x + enemy.knockbackVel.x) * dt;
    enemy.pos.y += (enemy.vel.y + enemy.knockbackVel.y) * dt;

    // Decay knockback
    enemy.knockbackVel.x *= 0.85;
    enemy.knockbackVel.y *= 0.85;

    // Timers
    if (enemy.invulnTimer > 0) enemy.invulnTimer -= dt;
    if (enemy.flashTimer > 0) enemy.flashTimer -= dt;
  }

  // Simple enemy-enemy push (prevent stacking)
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      if (!a.alive || !b.alive) continue;
      const d = dist(a.pos, b.pos);
      const minDist = a.size + b.size;
      if (d < minDist && d > 0) {
        const push = normalize(sub(b.pos, a.pos));
        const overlap = (minDist - d) * 0.5;
        a.pos.x -= push.x * overlap * 0.3;
        a.pos.y -= push.y * overlap * 0.3;
        b.pos.x += push.x * overlap * 0.3;
        b.pos.y += push.y * overlap * 0.3;
      }
    }
  }
}

function processHits(hits: HitResult[], player: PlayerState) {
  for (const hit of hits) {
    const enemy = enemies.find(e => e.id === hit.enemyId);
    if (!enemy || !enemy.alive) continue;

    const data = getEnemyData(enemy);

    // Apply damage
    const dmg = Math.max(1, Math.round(hit.damage));
    enemy.hp -= dmg;

    // Knockback
    enemy.knockbackVel.x += hit.knockbackDir.x * hit.knockback;
    enemy.knockbackVel.y += hit.knockbackDir.y * hit.knockback;

    // Visual feedback
    enemy.flashTimer = 0.1;
    sprayParticles(hit.pos, hit.knockbackDir, 4, hit.weaponColor, 0.6, 100, 0.25);
    floatingText(hit.pos, dmg.toString(), '#fff');

    // Kill
    if (enemy.hp <= 0) {
      enemy.alive = false;
      player.kills++;
      burstParticles(enemy.pos, 8, data.color, 100, 0.35, 3);
      camera.shake(3, 0.08);
      spawnXpGem(enemy.pos, data.xpValue);

      // Small chance to drop heal
      if (Math.random() < 0.03) {
        // We'd spawn a heal pickup here — for MVP just give some HP
        player.hp = Math.min(player.hp + 3, player.maxHp);
      }
    } else {
      camera.shake(1.5, 0.05);
    }
  }
}

function processContactDamage(player: PlayerState, dt: number) {
  // Decay cooldowns
  for (const [id, cd] of damageCooldowns) {
    damageCooldowns.set(id, cd - dt);
    if (cd - dt <= 0) damageCooldowns.delete(id);
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (damageCooldowns.has(enemy.id)) continue;

    if (circlesOverlap(
      player.pos.x, player.pos.y, player.size,
      enemy.pos.x, enemy.pos.y, enemy.size
    )) {
      const data = getEnemyData(enemy);
      const dmg = Math.max(1, data.contactDamage - player.stats.armor);
      player.hp -= dmg;
      player.invulnTimer = 0.2;
      player.flashTimer = 0.15;

      // Knockback player away from enemy
      const pushDir = normalize(sub(player.pos, enemy.pos));
      player.knockbackVel.x += pushDir.x * 150;
      player.knockbackVel.y += pushDir.y * 150;

      floatingText(player.pos, dmg.toString(), '#ff4444');
      camera.shake(4, 0.12);
      damageCooldowns.set(enemy.id, 0.5);
    }
  }
}

function triggerLevelUp(state: GameState) {
  // Get available upgrades
  const available = getAvailableUpgrades(upgradeTakenCounts);
  if (available.length === 0) return;

  // Pick 3 random options
  const options = [];
  const pool = [...available];
  const count = Math.min(3, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    options.push(pool[idx]);
    pool.splice(idx, 1);
  }

  state.pendingUpgrades = options;
  state.scene = 'levelup';
}

export function applyUpgrade(state: GameState, upgradeId: string) {
  const upgrade = upgradeDefs.find(u => u.id === upgradeId);
  if (!upgrade || !state.player) return;

  const count = (upgradeTakenCounts.get(upgradeId) ?? 0) + 1;
  upgradeTakenCounts.set(upgradeId, count);

  upgrade.apply(state.player, count);

  // Update derived stats
  state.player.speed = state.player.stats.speed;
  state.player.maxHp = state.player.stats.maxHp;
  state.player.magnetRadius = state.player.stats.magnetRange;

  state.pendingUpgrades = [];
  state.scene = 'gameplay';
}

// ── Drawing ──────────────────────────────────────────────────────────

export function draw(state: GameState, ctx: CanvasRenderingContext2D) {
  const player = state.player!;

  // ── Background ──
  drawBackground(ctx, player);

  // ── World-space rendering ──
  ctx.save();
  camera.applyTransform(ctx);

  // Pickups (draw under everything)
  drawPickups(ctx);

  // Enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (!camera.isVisible(enemy.pos.x, enemy.pos.y, enemy.size + 20)) continue;
    const data = getEnemyData(enemy);
    drawEnemy(ctx, enemy, data.color);
  }

  // Attacks
  drawAttacks(ctx);

  // Player
  drawPlayer(ctx, player);

  // Particles
  drawParticles(ctx);

  ctx.restore();

  // ── Screen-space UI ──
  drawHud(ctx, player, state.runTime);
}

function drawBackground(ctx: CanvasRenderingContext2D, player: PlayerState) {
  // Dark green background
  ctx.fillStyle = '#1a2e1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid for spatial reference
  ctx.save();
  camera.applyTransform(ctx);
  ctx.strokeStyle = '#223322';
  ctx.lineWidth = 1;
  const gridSize = 80;
  const startX = Math.floor((camera.x - CANVAS_W / 2) / gridSize) * gridSize;
  const startY = Math.floor((camera.y - CANVAS_H / 2) / gridSize) * gridSize;
  for (let x = startX; x < startX + CANVAS_W + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + CANVAS_H + gridSize);
    ctx.stroke();
  }
  for (let y = startY; y < startY + CANVAS_H + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + CANVAS_W + gridSize, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState) {
  const { x, y } = player.pos;
  const charDef = getCharacterDef(player.characterId);

  // Hit flash
  if (player.flashTimer > 0) {
    ctx.fillStyle = '#fff';
  } else {
    ctx.fillStyle = charDef.color;
  }

  // Body
  ctx.fillRect(x - 10, y - 14, 20, 28);

  // Darker border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 10, y - 14, 20, 28);

  // Eyes (direction indicator)
  const eyeX = x + player.facing.x * 4;
  const eyeY = y - 4 + player.facing.y * 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(eyeX - 3, eyeY - 2, 3, 4);
  ctx.fillRect(eyeX + 1, eyeY - 2, 3, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(eyeX - 2, eyeY - 1, 2, 2);
  ctx.fillRect(eyeX + 2, eyeY - 1, 2, 2);

  // Invuln flash effect
  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer * 20) % 2 === 0) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 12, y - 16, 24, 32);
    ctx.globalAlpha = 1;
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Entity, color: string) {
  const { x, y } = enemy.pos;
  const s = enemy.size;

  // Hit flash
  ctx.fillStyle = enemy.flashTimer > 0 ? '#fff' : color;

  // Body (circle-ish)
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fill();

  // Dark border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eyes
  const ex = x + enemy.facing.x * s * 0.3;
  const ey = y + enemy.facing.y * s * 0.3 - 2;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(ex - 2, ey - 1, 2, 2);
  ctx.fillRect(ex + 1, ey - 1, 2, 2);

  // HP bar (if damaged)
  if (enemy.hp < enemy.maxHp) {
    const barW = s * 2;
    const barH = 3;
    const barY = y - s - 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barW / 2, barY, barW, barH);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(x - barW / 2, barY, barW * (enemy.hp / enemy.maxHp), barH);
  }
}

export function exit(_state: GameState) {
  // cleanup if needed
}
