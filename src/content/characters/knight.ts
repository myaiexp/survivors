/**
 * CHARACTER: Knight
 * Starting character — balanced stats, begins with Iron Sword
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW CHARACTERS WORK:
 *
 * Each character file exports a CharacterDef. Characters determine:
 *   - Starting weapon for the run
 *   - Stat modifiers (bonuses/penalties to base stats)
 *   - Visual appearance (placeholder color for now)
 *
 * statModifiers are ADDED to default stats. For multiplier stats
 * (damage, attackSpeed, etc.), the default is 1.0, so +0.1 = 10% bonus.
 * For flat stats (maxHp, speed, armor), these add directly.
 *
 * TO ADD A NEW CHARACTER:
 *   1. Copy this file and rename it
 *   2. Modify the CharacterDef below
 *   3. Import and add it to src/content/characters/index.ts
 * ═══════════════════════════════════════════════════════════════════════
 */

import { CharacterDef } from '../../core/types';

export const Knight: CharacterDef = {
  id: 'knight',
  name: 'Knight',
  description: 'A steadfast warrior. Balanced stats, starts with Iron Sword.',
  startingWeaponId: 'sword',
  statModifiers: {
    maxHp: 10,  // 110 total HP
    armor: 1,
  },
  color: '#5b8dd9',
  unlocked: true,
};
