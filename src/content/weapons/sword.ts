/**
 * WEAPON: Iron Sword
 * Pattern: sweep — a melee arc that hits all enemies in front of the player
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW WEAPONS WORK:
 *
 * Each weapon file exports a WeaponDef object. The combat system
 * (src/systems/combat.ts) reads these definitions to spawn attacks.
 *
 * Available patterns:
 *   'sweep'      — melee arc in front of player (like a sword swing)
 *   'projectile' — fires a projectile in the aim direction
 *   'orbit'      — entities orbiting the player
 *   'aura'       — damage zone around the player
 *   'chain'      — hits one enemy then jumps to nearby enemies
 *   'nova'       — burst of projectiles in all directions
 *
 * Key fields:
 *   damage      — base damage per hit
 *   cooldown    — seconds between attacks
 *   range       — reach (melee) or travel distance (projectile)
 *   area        — hitbox size (radius for aura, arc width for sweep)
 *   knockback   — push force on hit enemies
 *   piercing    — enemies a projectile passes through (0 = dies on first hit)
 *
 * TO ADD A NEW WEAPON:
 *   1. Copy this file and rename it (e.g., axe.ts)
 *   2. Modify the WeaponDef below
 *   3. Import and add it to src/content/weapons/index.ts
 * ═══════════════════════════════════════════════════════════════════════
 */

import { WeaponDef } from '../../core/types';

export const Sword: WeaponDef = {
  id: 'sword',
  name: 'Iron Sword',
  description: 'A reliable blade. Sweeps in an arc, hitting all nearby enemies.',
  damage: 12,
  cooldown: 1.0,
  range: 70,
  area: 90,           // arc angle in degrees
  knockback: 80,
  piercing: 99,        // sweep hits everything in range
  projectileSpeed: 0,  // melee weapon
  pattern: 'sweep',
  color: '#c0c0c0',
  trailColor: '#ffffff',
};
