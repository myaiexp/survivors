/**
 * WEAPON: Lightning Bolt
 * Pattern: projectile — fires a fast bolt at the nearest enemy
 */

import { WeaponDef } from '../../core/types';

export const Lightning: WeaponDef = {
  id: 'lightning',
  name: 'Lightning Bolt',
  description: 'Strikes the nearest enemy with crackling energy. Fast and deadly.',
  damage: 25,
  cooldown: 2.2,
  range: 400,
  area: 10,
  knockback: 120,
  piercing: 0,
  projectileSpeed: 800,
  pattern: 'projectile',
  color: '#88ccff',
  trailColor: '#ffffff',
};
