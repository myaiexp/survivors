/**
 * SPAWNER SYSTEM
 *
 * Controls enemy wave spawning. Enemies spawn off-screen and increase
 * in quantity and difficulty over time.
 */

import { Entity, PlayerState, CANVAS_W, CANVAS_H } from '../core/types';
import { getEnemiesForWave, enemyDefs } from '../content/enemies/index';
import { EnemyDef } from '../core/types';
import { randRange, randVec, fromAngle, weightedPick } from '../utils/math';

let spawnTimer = 0;
let waveTimer = 0;
let currentWave = 0;
let nextId = 1000;

const WAVE_DURATION = 30;      // seconds per wave
const BASE_SPAWN_RATE = 1.2;   // seconds between spawns at wave 0
const MIN_SPAWN_RATE = 0.15;   // minimum seconds between spawns
const SPAWN_MARGIN = 80;       // how far off-screen enemies spawn
const MAX_ENEMIES = 300;       // cap to prevent performance issues

export function resetSpawner() {
  spawnTimer = 0;
  waveTimer = 0;
  currentWave = 0;
  nextId = 1000;
}

export function getWave(): number {
  return currentWave;
}

export function updateSpawner(
  player: PlayerState,
  enemies: Entity[],
  runTime: number,
  dt: number
): Entity[] {
  const newEnemies: Entity[] = [];

  // Advance wave
  waveTimer += dt;
  if (waveTimer >= WAVE_DURATION) {
    waveTimer -= WAVE_DURATION;
    currentWave++;
  }

  // Scale spawn rate with wave
  const spawnRate = Math.max(
    MIN_SPAWN_RATE,
    BASE_SPAWN_RATE - currentWave * 0.08
  );

  // Scale enemies per spawn with wave
  const enemiesPerSpawn = 1 + Math.floor(currentWave * 0.5);

  spawnTimer -= dt;
  if (spawnTimer <= 0 && enemies.length < MAX_ENEMIES) {
    spawnTimer = spawnRate;

    const available = getEnemiesForWave(currentWave);
    for (let i = 0; i < enemiesPerSpawn; i++) {
      const def = weightedPick(
        available.map(e => ({ ...e, weight: e.spawnWeight }))
      );
      const enemy = spawnEnemy(def, player);
      newEnemies.push(enemy);
    }
  }

  return newEnemies;
}

function spawnEnemy(def: EnemyDef, player: PlayerState): Entity {
  // Spawn at a random position just off-screen
  const angle = Math.random() * Math.PI * 2;
  const dir = fromAngle(angle);
  const spawnDist = Math.max(CANVAS_W, CANVAS_H) / 2 + SPAWN_MARGIN;

  // Scale HP with wave
  const hpScale = 1 + currentWave * 0.15;

  return {
    id: nextId++,
    tag: 'enemy',
    pos: {
      x: player.pos.x + dir.x * spawnDist,
      y: player.pos.y + dir.y * spawnDist,
    },
    vel: { x: 0, y: 0 },
    size: def.size,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    alive: true,
    facing: { x: 0, y: 0 },
    speed: def.speed,
    knockbackVel: { x: 0, y: 0 },
    invulnTimer: 0,
    flashTimer: 0,
    // Store extra data on the entity
    ...({ enemyDefId: def.id, contactDamage: def.damage, xpValue: def.xpValue, color: def.color } as any),
  };
}

/** Get enemy-specific data stored on entity */
export function getEnemyData(e: Entity): {
  enemyDefId: string; contactDamage: number; xpValue: number; color: string;
} {
  return e as any;
}
