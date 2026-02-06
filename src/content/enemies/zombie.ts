/**
 * ENEMY: Zombie
 * Behavior: chase — tanky and slow, hits hard
 *
 * See skeleton.ts for full documentation on how enemies work.
 */

import { EnemyDef } from '../../core/types';

export const Zombie: EnemyDef = {
  id: 'zombie',
  name: 'Undead Brute',
  hp: 50,
  speed: 35,
  damage: 15,
  size: 16,
  xpValue: 8,
  color: '#3d5c3a',
  behavior: 'chase',
  spawnWeight: 4,
  minWave: 2,
};
