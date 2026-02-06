/**
 * WEAPON REGISTRY
 *
 * All weapons must be imported and added to this registry.
 * The combat system and upgrade system reference weapons by ID from here.
 *
 * To register a new weapon:
 *   1. Import it from its file
 *   2. Add it to the weaponDefs map below
 */

import { WeaponDef } from '../../core/types';
import { Sword } from './sword';
import { Fireball } from './fireball';
import { Lightning } from './lightning';
import { FrostNova } from './frost_nova';
import { Axe } from './axe';
import { MagicMissile } from './magic_missile';

export const weaponDefs: Map<string, WeaponDef> = new Map();

// Register all weapons
[Sword, Fireball, Lightning, FrostNova, Axe, MagicMissile].forEach(w => weaponDefs.set(w.id, w));

export function getWeaponDef(id: string): WeaponDef {
  const def = weaponDefs.get(id);
  if (!def) throw new Error(`Unknown weapon: ${id}`);
  return def;
}

export { Sword, Fireball, Lightning, FrostNova, Axe, MagicMissile };
