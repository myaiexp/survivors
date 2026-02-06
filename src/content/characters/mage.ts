/**
 * CHARACTER: Mage
 * Glass cannon — lower HP, higher damage, starts with Fireball
 *
 * See knight.ts for full documentation on how characters work.
 */

import { CharacterDef } from '../../core/types';

export const Mage: CharacterDef = {
  id: 'mage',
  name: 'Mage',
  description: 'A powerful sorcerer. Fragile but devastating. Starts with Fireball.',
  startingWeaponId: 'fireball',
  statModifiers: {
    maxHp: -20,     // 80 total HP
    damage: 0.2,    // +20% damage
    speed: -10,     // slightly slower
  },
  color: '#9b59b6',
  unlocked: true,
};
