/**
 * WEAPON: Magic Missile
 * Pattern: projectile — homing bolt with piercing
 */

import { WeaponDef } from '../../core/types';

export const MagicMissile: WeaponDef = {
  id: 'magic_missile',
  name: 'Magic Missile',
  description: 'A homing bolt of arcane energy that pierces through foes.',
  damage: 14,
  cooldown: 1.1,
  range: 320,
  area: 11,
  knockback: 30,
  piercing: 2,
  projectileSpeed: 300,
  pattern: 'projectile',
  color: '#9966ff',
  trailColor: '#cc99ff',
};
