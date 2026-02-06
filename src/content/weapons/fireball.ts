/**
 * WEAPON: Fireball
 * Pattern: projectile — fires a fireball toward the nearest enemy
 *
 * See sword.ts for full documentation on how weapons work.
 */

import { WeaponDef } from '../../core/types';

export const Fireball: WeaponDef = {
  id: 'fireball',
  name: 'Fireball',
  description: 'Hurls a ball of flame at the nearest enemy.',
  damage: 18,
  cooldown: 1.4,
  range: 350,
  area: 12,            // projectile radius
  knockback: 40,
  piercing: 0,         // dies on first hit
  projectileSpeed: 280,
  pattern: 'projectile',
  color: '#ff6600',
  trailColor: '#ff3300',
};
