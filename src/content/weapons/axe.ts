/**
 * WEAPON: Executioner's Axe
 * Pattern: sweep — heavy melee arc with wide coverage
 */

import { WeaponDef } from '../../core/types';

export const Axe: WeaponDef = {
  id: 'axe',
  name: "Executioner's Axe",
  description: 'A massive axe that cleaves through enemies with brutal force.',
  damage: 28,
  cooldown: 1.8,
  range: 65,
  area: 110,
  knockback: 150,
  piercing: 99,
  projectileSpeed: 0,
  pattern: 'sweep',
  color: '#8b4513',
  trailColor: '#cd853f',
};
