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

  // ═══════════════════════════════════════════════════════════════════
  // WEAPON UPGRADES
  // ═══════════════════════════════════════════════════════════════════

  // Sword (Knight's starting weapon)
  {
    id: 'weapon_sword',
    name: 'Iron Sword',
    description: 'Unlock: A reliable blade that sweeps in an arc.',
    icon: '⚔️',
    maxLevel: 1,
    category: 'weapon',
    weight: 10,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'sword')) {
        p.weapons.push({ defId: 'sword', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_sword',
    name: 'Iron Sword+',
    description: '+20% damage to Iron Sword',
    icon: '⚔️+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'sword');
      if (weapon) weapon.level++;
    },
  },

  // Fireball (Mage's starting weapon)
  {
    id: 'weapon_fireball',
    name: 'Fireball',
    description: 'Unlock: Launches a blazing projectile at enemies.',
    icon: '🔥',
    maxLevel: 1,
    category: 'weapon',
    weight: 10,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'fireball')) {
        p.weapons.push({ defId: 'fireball', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_fireball',
    name: 'Fireball+',
    description: '+20% damage to Fireball',
    icon: '🔥+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'fireball');
      if (weapon) weapon.level++;
    },
  },

  // Lightning Bolt
  {
    id: 'weapon_lightning',
    name: 'Lightning Bolt',
    description: 'Unlock: Strikes enemies with crackling energy. Fast and deadly.',
    icon: '⚡',
    maxLevel: 1,
    category: 'weapon',
    weight: 7,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'lightning')) {
        p.weapons.push({ defId: 'lightning', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_lightning',
    name: 'Lightning Bolt+',
    description: '+20% damage to Lightning Bolt',
    icon: '⚡+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'lightning');
      if (weapon) weapon.level++;
    },
  },

  // Frost Nova
  {
    id: 'weapon_frost_nova',
    name: 'Frost Nova',
    description: 'Unlock: Releases a burst of ice shards in all directions.',
    icon: '❄️',
    maxLevel: 1,
    category: 'weapon',
    weight: 7,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'frost_nova')) {
        p.weapons.push({ defId: 'frost_nova', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_frost_nova',
    name: 'Frost Nova+',
    description: '+20% damage to Frost Nova',
    icon: '❄️+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'frost_nova');
      if (weapon) weapon.level++;
    },
  },

  // Executioner's Axe
  {
    id: 'weapon_axe',
    name: "Executioner's Axe",
    description: 'Unlock: A massive axe that cleaves through enemies with brutal force.',
    icon: '🪓',
    maxLevel: 1,
    category: 'weapon',
    weight: 7,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'axe')) {
        p.weapons.push({ defId: 'axe', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_axe',
    name: "Executioner's Axe+",
    description: "+20% damage to Executioner's Axe",
    icon: '🪓+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'axe');
      if (weapon) weapon.level++;
    },
  },

  // Magic Missile
  {
    id: 'weapon_magic_missile',
    name: 'Magic Missile',
    description: 'Unlock: A homing bolt of arcane energy that pierces through foes.',
    icon: '✨',
    maxLevel: 1,
    category: 'weapon',
    weight: 7,
    apply: (p: PlayerState, _lvl: number) => {
      if (!p.weapons.find(w => w.defId === 'magic_missile')) {
        p.weapons.push({ defId: 'magic_missile', level: 1, cooldownTimer: 0 });
      }
    },
  },
  {
    id: 'up_magic_missile',
    name: 'Magic Missile+',
    description: '+20% damage to Magic Missile',
    icon: '✨+',
    maxLevel: 4,
    category: 'weapon',
    weight: 8,
    apply: (p: PlayerState, _lvl: number) => {
      const weapon = p.weapons.find(w => w.defId === 'magic_missile');
      if (weapon) weapon.level++;
    },
  },
];

/** Get upgrade defs that the player hasn't maxed yet */
export function getAvailableUpgrades(
  player: PlayerState,
  takenCounts: Map<string, number>
): UpgradeDef[] {
  const weaponCount = player.weapons.length;
  const ownedWeaponIds = new Set(player.weapons.map(w => w.defId));

  return upgradeDefs.filter(u => {
    // Check if already maxed
    const taken = takenCounts.get(u.id) ?? 0;
    if (taken >= u.maxLevel) return false;

    // If weapon unlock upgrade
    if (u.category === 'weapon' && u.id.startsWith('weapon_')) {
      const weaponId = u.id.replace('weapon_', '');
      // Hide if already owned
      if (ownedWeaponIds.has(weaponId)) return false;
      // Hide if 6 weapons already (cap enforcement)
      if (weaponCount >= 6) return false;
    }

    // If weapon levelup upgrade
    if (u.category === 'weapon' && u.id.startsWith('up_')) {
      const weaponId = u.id.replace('up_', '');
      // Only show if player owns this weapon
      if (!ownedWeaponIds.has(weaponId)) return false;
    }

    return true;
  });
}
