/**
 * ENEMY REGISTRY
 *
 * All enemies must be imported and added here.
 * The spawner system references enemies by ID from this registry.
 *
 * To register a new enemy:
 *   1. Import it from its file
 *   2. Add it to the enemyDefs array below
 */

import { EnemyDef } from '../../core/types';
import { Skeleton } from './skeleton';
import { Bat } from './bat';
import { Zombie } from './zombie';

export const enemyDefs: EnemyDef[] = [Skeleton, Bat, Zombie];

export function getEnemyDef(id: string): EnemyDef {
  const def = enemyDefs.find(e => e.id === id);
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}

/** Get enemies available at a given wave number */
export function getEnemiesForWave(wave: number): EnemyDef[] {
  return enemyDefs.filter(e => e.minWave <= wave);
}

export { Skeleton, Bat, Zombie };
