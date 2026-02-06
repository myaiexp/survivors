/**
 * WEAPON: Frost Nova
 * Pattern: nova — burst of ice shards in all directions
 */

import { WeaponDef } from '../../core/types';

export const FrostNova: WeaponDef = {
  id: 'frost_nova',
  name: 'Frost Nova',
  description: 'Releases a burst of ice shards in all directions.',
  damage: 10,
  cooldown: 3.0,
  range: 250,
  area: 14,
  knockback: 60,
  piercing: 1,
  projectileSpeed: 180,
  pattern: 'nova',
  color: '#66ccff',
  trailColor: '#aaeeff',
};
