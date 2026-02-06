/**
 * UPGRADE REGISTRY
 *
 * Upgrades are offered when the player levels up. Each upgrade can be
 * picked multiple times up to its maxLevel.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW UPGRADES WORK:
 *
 * When the player levels up, the system picks 3 random upgrades
 * (weighted by the 'weight' field) that haven't been maxed out yet.
 * The player picks one, and its `apply` function is called.
 *
 * Categories:
 *   'stat'    — passive stat boosts (more HP, speed, damage, etc.)
 *   'weapon'  — add or upgrade a weapon
 *   'special' — unique effects (future: shields, dashes, etc.)
 *
 * TO ADD A NEW UPGRADE:
 *   1. Add a new UpgradeDef object to the upgradeDefs array below
 *   2. The `apply` function receives (player, currentLevel) where
 *      currentLevel is 1 on first pick, 2 on second, etc.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { UpgradeDef, PlayerState } from '../../core/types';

export const upgradeDefs: UpgradeDef[] = [
  {
    id: 'up_max_hp',
    name: 'Vitality',
    description: '+20 Max HP and heal 20 HP',
    icon: '\u2665',
    maxLevel: 5,
    category: 'stat',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.maxHp += 20;
      p.maxHp = p.stats.maxHp;
      p.hp = Math.min(p.hp + 20, p.maxHp);
    },
  },
  {
    id: 'up_speed',
    name: 'Swift Boots',
    description: '+15% movement speed',
    icon: '\u2192',
    maxLevel: 3,
    category: 'stat',
    weight: 6,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.speed += 27; // ~15% of base 180
    },
  },
  {
    id: 'up_damage',
    name: 'Might',
    description: '+15% damage',
    icon: '\u2694',
    maxLevel: 5,
    category: 'stat',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.damage += 0.15;
    },
  },
  {
    id: 'up_attack_speed',
    name: 'Fervor',
    description: '+12% attack speed',
    icon: '\u26A1',
    maxLevel: 5,
    category: 'stat',
    weight: 7,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.attackSpeed += 0.12;
    },
  },
  {
    id: 'up_armor',
    name: 'Iron Skin',
    description: '+2 armor (reduces damage taken)',
    icon: '\u26E8',
    maxLevel: 5,
    category: 'stat',
    weight: 5,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.armor += 2;
    },
  },
  {
    id: 'up_area',
    name: 'Reach',
    description: '+15% weapon area',
    icon: '\u25CE',
    maxLevel: 3,
    category: 'stat',
    weight: 5,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.area += 0.15;
    },
  },
  {
    id: 'up_xp_gain',
    name: 'Wisdom',
    description: '+20% XP gain',
    icon: '\u2606',
    maxLevel: 3,
    category: 'stat',
    weight: 6,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.xpGain += 0.2;
    },
  },
  {
    id: 'up_magnet',
    name: 'Magnetism',
    description: '+40 pickup range',
    icon: '\u2609',
    maxLevel: 3,
    category: 'stat',
    weight: 5,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.magnetRange += 40;
      p.magnetRadius = p.stats.magnetRange;
    },
  },
  {
    id: 'up_projectile',
    name: 'Multishot',
    description: '+1 projectile for ranged weapons',
    icon: '\u2023',
    maxLevel: 2,
    category: 'stat',
    weight: 4,
    apply: (p: PlayerState, _lvl: number) => {
      p.stats.projectileCount += 1;
    },
  },
  {
    id: 'up_heal',
    name: 'Healing Surge',
    description: 'Restore 30 HP',
    icon: '+',
    maxLevel: 99,
    category: 'special',
    weight: 4,
    apply: (p: PlayerState, _lvl: number) => {
      p.hp = Math.min(p.hp + 30, p.maxHp);
    },
  },
];

/** Get upgrade defs that the player hasn't maxed yet */
export function getAvailableUpgrades(
  takenCounts: Map<string, number>
): UpgradeDef[] {
  return upgradeDefs.filter(u => {
    const taken = takenCounts.get(u.id) ?? 0;
    return taken < u.maxLevel;
  });
}
