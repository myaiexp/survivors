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
let lastEscPress = 0; // For ESC key debouncing

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
    damageTaken: 0,
    damageDealt: 0,
  };

  state.player = player;
  camera.x = 0;
  camera.y = 0;
}

export function update(state: GameState, dt: number) {
  const player = state.player!;
  if (!player.alive) return;

  // ESC key toggles pause menu (debounced)
  const now = performance.now();
  if (input.isKeyDown('escape') && now - lastEscPress > 200) {
    lastEscPress = now;
    if (!state.paused) {
      // Pause game (show menu)
      state.paused = true;
    } else if (state.pendingUpgrades.length === 0) {
      // Resume if paused by menu (not level-up)
      state.paused = false;
    }
    // If level-up active (pendingUpgrades > 0), ESC does nothing
  }

  // Handle paused state
  if (state.paused) {
    if (state.pendingUpgrades.length > 0) {
      // Level-up overlay
      handleLevelUpInput(state);
    } else {
      // Pause menu overlay
      handlePauseMenuInput(state);
    }
    return;
  }

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
    player.damageDealt += dmg;

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
      player.damageTaken += dmg;
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
  state.paused = true; // Pause gameplay instead of switching scenes
}

function handleLevelUpInput(state: GameState) {
  if (input.consumeClick()) {
    const mouse = input.getMouseScreen();
    const upgrades = state.pendingUpgrades;
    const cardW = 200;
    const cardH = 240;
    const gap = 20;
    const totalW = upgrades.length * cardW + (upgrades.length - 1) * gap;
    const startX = (CANVAS_W - totalW) / 2;
    const cardY = CANVAS_H / 2 - cardH / 2;

    for (let i = 0; i < upgrades.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (
        mouse.x >= cx && mouse.x <= cx + cardW &&
        mouse.y >= cardY && mouse.y <= cardY + cardH
      ) {
        applyUpgrade(state, upgrades[i].id);
        return;
      }
    }
  }

  // Keyboard shortcuts 1-3
  for (let i = 0; i < state.pendingUpgrades.length; i++) {
    if (input.isKeyDown((i + 1).toString())) {
      applyUpgrade(state, state.pendingUpgrades[i].id);
      return;
    }
  }
}

function handlePauseMenuInput(state: GameState) {
  if (input.consumeClick()) {
    const mouse = input.getMouseScreen();

    // Resume button: 330x40 at center Y: 240
    const resumeBtn = { x: 330, y: 240, w: 300, h: 40 };
    if (mouse.x >= resumeBtn.x && mouse.x <= resumeBtn.x + resumeBtn.w &&
        mouse.y >= resumeBtn.y && mouse.y <= resumeBtn.y + resumeBtn.h) {
      state.paused = false;
      return;
    }

    // Quit to Menu button: 330x40 at center Y: 300
    const quitBtn = { x: 330, y: 300, w: 300, h: 40 };
    if (mouse.x >= quitBtn.x && mouse.x <= quitBtn.x + quitBtn.w &&
        mouse.y >= quitBtn.y && mouse.y <= quitBtn.y + quitBtn.h) {
      state.paused = false;
      state.scene = 'menu';
      return;
    }
  }
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
  state.paused = false; // Resume gameplay instead of scene switch
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

  // ── Overlays ──
  if (state.paused) {
    if (state.pendingUpgrades.length > 0) {
      drawLevelUpOverlay(ctx, state);
    } else {
      drawPauseMenuOverlay(ctx, state);
    }
  }
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

function drawLevelUpOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('LEVEL UP!', CANVAS_W / 2, 70);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Level ${state.player!.level} • Choose an upgrade`, CANVAS_W / 2, 100);

  // Upgrade cards
  const upgrades = state.pendingUpgrades;
  const cardW = 200;
  const cardH = 240;
  const gap = 20;
  const totalW = upgrades.length * cardW + (upgrades.length - 1) * gap;
  const startX = (CANVAS_W - totalW) / 2;
  const cardY = CANVAS_H / 2 - cardH / 2;

  const mouse = input.getMouseScreen();

  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    const cx = startX + i * (cardW + gap);
    const hovered =
      mouse.x >= cx && mouse.x <= cx + cardW &&
      mouse.y >= cardY && mouse.y <= cardY + cardH;

    // Card bg
    ctx.fillStyle = hovered ? '#1e2a3a' : '#141c26';
    ctx.fillRect(cx, cardY, cardW, cardH);

    // Border
    ctx.strokeStyle = hovered ? '#c9a959' : '#333';
    ctx.lineWidth = hovered ? 2 : 1;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Number key hint
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${i + 1}]`, cx + 8, cardY + 20);

    // Icon
    ctx.textAlign = 'center';
    ctx.font = '36px monospace';
    ctx.fillStyle = '#c9a959';
    ctx.fillText(u.icon, cx + cardW / 2, cardY + 60);

    // Name
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(u.name, cx + cardW / 2, cardY + 100);

    // Category tag
    ctx.font = '10px monospace';
    ctx.fillStyle = u.category === 'stat' ? '#4a9' : u.category === 'weapon' ? '#f80' : '#a4f';
    ctx.fillText(u.category.toUpperCase(), cx + cardW / 2, cardY + 120);

    // Description
    ctx.font = '12px monospace';
    ctx.fillStyle = '#aaa';
    const words = u.description.split(' ');
    let line = '';
    let ly = cardY + 150;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > cardW - 24) {
        ctx.fillText(line, cx + cardW / 2, ly);
        line = word;
        ly += 16;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx + cardW / 2, ly);
  }
}

function drawPauseMenuOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  const player = state.player!;

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Helper function to draw info boxes
  function drawBox(x: number, y: number, w: number, h: number, title: string) {
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Title
    ctx.fillStyle = '#c9a959';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(title, x + 10, y + 20);

    return { contentX: x + 10, contentY: y + 35 };
  }

  // Helper to check button hover
  const mouse = input.getMouseScreen();
  function isHovered(x: number, y: number, w: number, h: number): boolean {
    return mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
  }

  // CENTER: Title and Buttons
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_W / 2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText('Press ESC to resume', CANVAS_W / 2, 220);

  // Resume Button
  const resumeBtn = { x: 330, y: 240, w: 300, h: 40 };
  const resumeHover = isHovered(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h);
  ctx.fillStyle = resumeHover ? '#2a3a4a' : '#1a2332';
  ctx.fillRect(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h);
  ctx.strokeStyle = resumeHover ? '#c9a959' : '#666';
  ctx.lineWidth = resumeHover ? 2 : 1;
  ctx.strokeRect(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('RESUME', resumeBtn.x + resumeBtn.w / 2, resumeBtn.y + 25);

  // Quit to Menu Button
  const quitBtn = { x: 330, y: 300, w: 300, h: 40 };
  const quitHover = isHovered(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h);
  ctx.fillStyle = quitHover ? '#3a2020' : '#1a2332';
  ctx.fillRect(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h);
  ctx.strokeStyle = quitHover ? '#c95959' : '#666';
  ctx.lineWidth = quitHover ? 2 : 1;
  ctx.strokeRect(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h);
  ctx.fillStyle = quitHover ? '#ff8888' : '#aaa';
  ctx.fillText('QUIT TO MENU', quitBtn.x + quitBtn.w / 2, quitBtn.y + 25);

  ctx.textAlign = 'left'; // Reset alignment

  // TOP: Character Info Box
  const charBox = drawBox(290, 40, 380, 80, 'CHARACTER');
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  const charDef = getCharacterDef(player.characterId);
  ctx.fillText(charDef.name, charBox.contentX, charBox.contentY);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(charDef.description, charBox.contentX, charBox.contentY + 20);

  // RIGHT: Player Stats Box
  const statsBox = drawBox(710, 150, 220, 280, 'PLAYER STATS');
  ctx.font = '11px monospace';
  let statsY = statsBox.contentY;
  const statsList = [
    `Max HP: ${player.stats.maxHp}`,
    `Armor: ${player.stats.armor}`,
    `Speed: ${player.stats.speed.toFixed(0)}`,
    `Damage: ${(player.stats.damage * 100).toFixed(0)}%`,
    `Atk Speed: ${(player.stats.attackSpeed * 100).toFixed(0)}%`,
    `Area: ${(player.stats.area * 100).toFixed(0)}%`,
    `Projectiles: +${player.stats.projectileCount}`,
    `Luck: ${player.stats.luck.toFixed(1)}`,
    `XP Gain: ${(player.stats.xpGain * 100).toFixed(0)}%`,
    `Magnet: ${player.stats.magnetRange.toFixed(0)}`,
  ];
  ctx.fillStyle = '#fff';
  for (const stat of statsList) {
    ctx.fillText(stat, statsBox.contentX, statsY);
    statsY += 16;
  }

  // LEFT: Weapons & Upgrades Box
  const weaponsBox = drawBox(30, 150, 220, 280, 'WEAPONS & UPGRADES');
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#c9a959';
  let leftY = weaponsBox.contentY;
  ctx.fillText('Weapons:', weaponsBox.contentX, leftY);
  leftY += 18;

  ctx.font = '11px monospace';
  ctx.fillStyle = '#fff';
  if (player.weapons.length === 0) {
    ctx.fillStyle = '#666';
    ctx.fillText('None', weaponsBox.contentX, leftY);
    leftY += 16;
  } else {
    for (const wpn of player.weapons) {
      const wpnDef = getWeaponDef(wpn.defId);
      ctx.fillText(`${wpnDef.name} Lv${wpn.level}`, weaponsBox.contentX, leftY);
      leftY += 16;
    }
  }

  leftY += 10;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#c9a959';
  ctx.fillText('Upgrades:', weaponsBox.contentX, leftY);
  leftY += 18;

  // Note: upgradeTakenCounts is local to gameplay.ts module
  // Show upgrade counts from the map
  ctx.font = '11px monospace';
  ctx.fillStyle = '#fff';
  if (upgradeTakenCounts.size === 0) {
    ctx.fillStyle = '#666';
    ctx.fillText('None', weaponsBox.contentX, leftY);
  } else {
    for (const [upgradeId, count] of upgradeTakenCounts) {
      const upgrade = upgradeDefs.find(u => u.id === upgradeId);
      if (upgrade) {
        ctx.fillText(`${upgrade.name} x${count}`, weaponsBox.contentX, leftY);
        leftY += 16;
        if (leftY > weaponsBox.contentY + 220) break; // Prevent overflow
      }
    }
  }

  // BOTTOM: Run Progress Box
  const progressBox = drawBox(40, 450, 880, 70, 'RUN PROGRESS');
  ctx.font = '12px monospace';
  ctx.fillStyle = '#fff';

  // Format time as MM:SS
  const mins = Math.floor(state.runTime / 60);
  const secs = Math.floor(state.runTime % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Calculate DPS
  const avgDps = state.runTime > 0 ? (player.damageDealt / state.runTime).toFixed(1) : '0.0';

  // Layout in 3 columns
  const col1X = progressBox.contentX;
  const col2X = progressBox.contentX + 250;
  const col3X = progressBox.contentX + 500;
  const rowY = progressBox.contentY;

  ctx.fillText(`Level: ${player.level}`, col1X, rowY);
  ctx.fillText(`XP: ${player.xp} / ${player.xpToNext}`, col1X, rowY + 18);

  ctx.fillText(`Kills: ${player.kills}`, col2X, rowY);
  ctx.fillText(`Time: ${timeStr}`, col2X, rowY + 18);

  ctx.fillText(`Dmg Taken: ${player.damageTaken}`, col3X, rowY);
  ctx.fillText(`Avg DPS: ${avgDps}`, col3X, rowY + 18);
}

export function exit(_state: GameState) {
  // cleanup if needed
}
