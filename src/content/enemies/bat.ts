/**
 * ENEMY: Bat
 * Behavior: chase — faster but weaker than skeleton
 *
 * See skeleton.ts for full documentation on how enemies work.
 */

import { EnemyDef } from '../../core/types';

export const Bat: EnemyDef = {
  id: 'bat',
  name: 'Shadow Bat',
  hp: 8,
  speed: 100,
  damage: 5,
  size: 8,
  xpValue: 2,
  color: '#6b3a7d',
  behavior: 'chase',
  spawnWeight: 8,
  minWave: 0,
};
