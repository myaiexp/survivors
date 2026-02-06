/**
 * ENEMY: Skeleton
 * Behavior: chase — walks directly toward the player
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW ENEMIES WORK:
 *
 * Each enemy file exports an EnemyDef. The spawner system
 * (src/systems/spawner.ts) uses these to create enemy instances.
 *
 * Available behaviors:
 *   'chase'  — walks directly toward the player
 *   'charge' — pauses then dashes at the player
 *   'circle' — circles the player at a distance
 *   'ranged' — stays back and fires projectiles (future)
 *
 * Key fields:
 *   hp          — hit points
 *   speed       — movement speed in pixels/second
 *   damage      — contact damage per tick
 *   size        — collision radius in pixels
 *   xpValue     — XP gem value on death
 *   spawnWeight — relative chance to be picked when spawning
 *   minWave     — earliest wave number this enemy appears
 *
 * TO ADD A NEW ENEMY:
 *   1. Copy this file and rename it
 *   2. Modify the EnemyDef below
 *   3. Import and add it to src/content/enemies/index.ts
 * ═══════════════════════════════════════════════════════════════════════
 */

import { EnemyDef } from '../../core/types';

export const Skeleton: EnemyDef = {
  id: 'skeleton',
  name: 'Skeleton',
  hp: 20,
  speed: 60,
  damage: 8,
  size: 12,
  xpValue: 3,
  color: '#d4c5a9',
  behavior: 'chase',
  spawnWeight: 10,
  minWave: 0,
};
