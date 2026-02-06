# Feature Upgrades & Enhancement Roadmap

> **Codebase Overview**: A dark medieval survivors-style roguelite built in TypeScript with pure canvas rendering. The game features 2 playable characters, 6 weapons, 3 enemy types, 10-minute timed runs, and a modular content-driven architecture.

**Last Updated**: 2026-02-06
**Current Version**: 0.1.0

---

## Current State Summary

### ✅ Implemented Features

**Core Gameplay**
- WASD movement with smooth controls
- Auto-attack weapon system (cooldown-based)
- XP collection with magnetic pickup
- Level-up system with upgrade choices
- 10-minute timed runs with victory/defeat conditions
- Wave-based enemy spawning with difficulty scaling
- Screen shake and particle effects for juice

**Content**
- **Characters**: 2 (Knight, Mage)
- **Weapons**: 6 total
  - Melee: Iron Sword, Executioner's Axe (sweep pattern)
  - Ranged: Fireball, Lightning Bolt, Magic Missile (projectile pattern)
  - AoE: Frost Nova (nova pattern)
- **Enemies**: 3 (Skeleton, Shadow Bat, Undead Brute)
- **Upgrades**: 10 stat upgrades + weapon unlock/level system
  - Stats: Vitality, Speed, Damage, Attack Speed, Armor, Area, XP Gain, Magnet Range, Multishot, Healing

**Technical**
- DPI-aware canvas scaling (RENDER_SCALE = 2)
- Typography system with consistent text rendering
- Pause menu functionality
- Stats tracking (damage dealt/taken)
- Modular content system (easy to add weapons/enemies/upgrades)

---

## Priority 1: Core Gameplay Enhancements

### 1.1 Missing Weapon Patterns

**Status**: High Priority
**Effort**: Medium
**Impact**: High (gameplay variety)

**Description**: The type system defines 6 weapon patterns, but only 3 are implemented:
- ✅ `sweep` - Melee arc (Sword, Axe)
- ✅ `projectile` - Directional projectiles (Fireball, Lightning, Magic Missile)
- ✅ `nova` - Burst in all directions (Frost Nova)
- ❌ `orbit` - Entities circling the player
- ❌ `aura` - Continuous damage zone around player
- ❌ `chain` - Hits one enemy then jumps to nearby enemies

**Proposed Implementation**:
```typescript
// Example: Orbit weapon (e.g., "Spirit Orbs")
{
  id: 'spirit_orbs',
  name: 'Spirit Orbs',
  pattern: 'orbit',
  damage: 8,
  cooldown: 0.2,  // tick rate for orbit damage
  range: 80,       // orbit radius
  area: 15,        // orb size
  // Creates 2-3 orbs that circle the player and damage on contact
}

// Example: Aura weapon (e.g., "Toxic Cloud")
{
  id: 'toxic_cloud',
  name: 'Toxic Cloud',
  pattern: 'aura',
  damage: 3,       // damage per tick
  cooldown: 0.5,   // tick interval
  range: 100,      // aura radius
  area: 100,       // aura size (same as range typically)
}

// Example: Chain weapon (e.g., "Chain Lightning")
{
  id: 'chain_lightning',
  name: 'Chain Lightning',
  pattern: 'chain',
  damage: 20,
  cooldown: 2.5,
  range: 300,      // max jump distance
  piercing: 5,     // number of jumps
  area: 8,         // visual effect size
}
```

**Files to modify**:
- `src/systems/combat.ts` - Add pattern handlers in `fireWeapon()`
- `src/content/weapons/` - Create new weapon files
- `src/content/weapons/index.ts` - Register new weapons

---

### 1.2 Enemy Behavior Variants

**Status**: High Priority
**Effort**: Low-Medium
**Impact**: High (combat variety)

**Description**: Only 1 of 4 enemy behaviors is implemented:
- ✅ `chase` - Walks directly toward player (all 3 current enemies)
- ❌ `charge` - Pauses then dashes at player
- ❌ `circle` - Circles player at distance
- ❌ `ranged` - Stays back and fires projectiles

**Proposed Implementation**:
```typescript
// Charging enemy (bull-rush style)
{
  id: 'wraith',
  name: 'Wraith',
  behavior: 'charge',
  hp: 30,
  speed: 150,      // dash speed
  damage: 20,
  // AI: Move slowly, pause 1.5s, then dash at player's position
}

// Circling enemy (archer style)
{
  id: 'cursed_archer',
  name: 'Cursed Archer',
  behavior: 'circle',
  hp: 25,
  speed: 70,
  damage: 5,
  // AI: Maintain distance of 200px, circle player, occasional ranged attack
}

// Ranged enemy (necromancer)
{
  id: 'necromancer',
  name: 'Dark Necromancer',
  behavior: 'ranged',
  hp: 40,
  speed: 50,
  damage: 0,       // no contact damage
  // AI: Stay 250px away, fire projectiles every 2.5s
}
```

**Files to modify**:
- `src/scenes/gameplay.ts` - Add behavior logic in enemy update loop
- `src/content/enemies/` - Create new enemy files with new behaviors
- Enemy projectiles may need to be tracked separately from player attacks

---

### 1.3 Boss Encounters

**Status**: Medium Priority
**Effort**: High
**Impact**: High (memorable moments)

**Description**: Add elite/boss enemies at specific wave milestones.

**Proposed Design**:
- **Mini-bosses** at waves 5, 10, 15 (every 2.5 minutes)
- **Final boss** at wave 20 (10 minutes)
- Bosses have:
  - 10x normal HP
  - Unique attack patterns (multiple phases)
  - Visual distinction (larger, different color, name displayed)
  - Guaranteed upgrade on kill

**Implementation Approach**:
```typescript
// In spawner.ts
if (currentWave % 5 === 0 && !bossSpawned[currentWave]) {
  spawnBoss(getBossForWave(currentWave));
  bossSpawned[currentWave] = true;
}

// Boss definition
export interface BossDef extends EnemyDef {
  isBoss: true;
  phases: BossPhase[];  // Different attack patterns at HP thresholds
  bossName: string;     // Display name (e.g., "The Skeleton King")
}
```

**Files to modify**:
- `src/systems/spawner.ts` - Boss spawning logic
- `src/core/types.ts` - Add `BossDef` type
- `src/content/enemies/bosses.ts` - New file for boss definitions
- `src/ui/hud.ts` - Boss health bar display

---

## Priority 2: Character & Progression

### 2.1 Additional Characters

**Status**: Medium Priority
**Effort**: Low (content creation)
**Impact**: Medium (replayability)

**Current**: 2 characters (Knight, Mage)
**Target**: 4-6 characters with distinct playstyles

**Proposed Characters**:

```typescript
// Rogue - High mobility, crit-focused
{
  id: 'rogue',
  name: 'Shadow Rogue',
  description: 'Swift and deadly. Starts with bonus speed and crit chance.',
  startingWeaponId: 'dual_daggers',  // New weapon
  statModifiers: {
    speed: 30,        // +30 speed
    damage: 0.2,      // +20% damage
    maxHp: -20,       // -20 HP (glass cannon)
  },
  unlocked: true,
}

// Paladin - Tank, healing focus
{
  id: 'paladin',
  name: 'Holy Paladin',
  description: 'Blessed warrior. High HP and regeneration.',
  startingWeaponId: 'holy_hammer',   // New weapon
  statModifiers: {
    maxHp: 50,        // +50 HP
    armor: 5,         // +5 armor
    speed: -20,       // -20 speed (heavy armor)
  },
  unlocked: true,
}

// Necromancer - Summon-focused
{
  id: 'necromancer',
  name: 'Necromancer',
  description: 'Master of the dead. Commands skeletal minions.',
  startingWeaponId: 'summon_skeletons',  // New weapon (orbit pattern)
  statModifiers: {
    damage: -0.2,     // -20% personal damage
    area: 0.3,        // +30% area (for summons)
  },
  unlocked: false,  // Unlock by surviving 10 minutes as any character
}
```

**Files to modify**:
- `src/content/characters/` - Add new character files
- `src/content/characters/index.ts` - Register characters
- `src/content/weapons/` - Create starting weapons for new characters

---

### 2.2 Character Unlocks & Achievements

**Status**: Low Priority
**Effort**: Medium
**Impact**: Medium (progression hooks)

**Description**: Add unlock conditions for characters and track achievements.

**Proposed System**:
```typescript
// Unlock conditions
export interface UnlockCondition {
  type: 'survival' | 'kills' | 'weapon_mastery' | 'secret';
  requirement: number;
  description: string;
}

// Example unlocks
{
  id: 'necromancer',
  unlocked: false,
  unlockCondition: {
    type: 'survival',
    requirement: 600,  // Survive 10 minutes
    description: 'Survive a full 10-minute run with any character',
  }
}

// Achievements (store in localStorage)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;  // timestamp
}
```

**Files to modify**:
- `src/core/types.ts` - Add unlock types
- `src/systems/achievements.ts` - New file for achievement tracking
- `src/scenes/menu.ts` - Display locked characters with unlock hints
- `src/scenes/gameover.ts` - Check for new unlocks after run

---

### 2.3 Meta-Progression System

**Status**: Low Priority
**Effort**: High
**Impact**: High (long-term engagement)

**Description**: Permanent upgrades that persist between runs.

**Proposed Design**:
- Earn "Soul Shards" from completed runs (based on performance)
- Spend shards in a meta-upgrade tree
- Upgrades apply to ALL characters

**Example Meta-Upgrades**:
```typescript
// Health upgrades
{ id: 'meta_hp_1', name: 'Vitality I', cost: 50, effect: '+10 starting HP' }
{ id: 'meta_hp_2', name: 'Vitality II', cost: 150, effect: '+20 starting HP', requires: 'meta_hp_1' }

// Starting resources
{ id: 'meta_start_level', name: 'Head Start', cost: 500, effect: 'Start at level 2' }
{ id: 'meta_start_weapon', name: 'Arsenal', cost: 300, effect: 'Start with 2 weapons' }

// Luck/drops
{ id: 'meta_xp_boost', name: 'Scholar', cost: 200, effect: '+10% XP gain' }
{ id: 'meta_rare_up', name: 'Fortune', cost: 400, effect: 'Better upgrade choices' }
```

**Files to modify**:
- `src/systems/meta_progression.ts` - New file
- `src/scenes/meta_upgrade.ts` - New scene for meta-upgrade UI
- `src/scenes/menu.ts` - Add button to access meta-upgrades
- `src/scenes/gameover.ts` - Calculate and award soul shards

---

## Priority 3: Content Expansion

### 3.1 More Enemies

**Status**: High Priority
**Effort**: Low (content creation)
**Impact**: High (combat variety)

**Current**: 3 enemy types
**Target**: 10-12 enemy types with varied threat profiles

**Proposed Enemies by Wave**:

**Early Game (Waves 0-3)**
- ✅ Skeleton (melee, balanced)
- ✅ Shadow Bat (fast, weak)
- ✅ Undead Brute (slow, tanky) [Wave 2+]
- 🆕 Ghoul (medium speed, applies slow on hit)
- 🆕 Imp (fast, low HP, spawns in groups)

**Mid Game (Waves 4-10)**
- 🆕 Wraith (charge behavior, high damage)
- 🆕 Cursed Archer (ranged, circles player)
- 🆕 Dark Knight (medium, high armor)
- 🆕 Plague Bearer (explodes on death, AoE damage)

**Late Game (Waves 11+)**
- 🆕 Death Knight (high HP, charge behavior, heavy damage)
- 🆕 Lich (ranged caster, summons skeletons)
- 🆕 Demon (fast, teleports near player)

**Files to modify**:
- `src/content/enemies/` - Create new enemy files
- `src/content/enemies/index.ts` - Register enemies
- `src/systems/spawner.ts` - May need spawn group logic (e.g., Imps spawn 3 at once)

---

### 3.2 Environmental Hazards

**Status**: Low Priority
**Effort**: Medium
**Impact**: Medium (map variety)

**Description**: Add environmental dangers that spawn during runs.

**Proposed Hazards**:
```typescript
// Red zones that telegraph then deal damage
export interface Hazard {
  type: 'fire_zone' | 'ice_spike' | 'meteor' | 'death_circle';
  pos: Vec2;
  radius: number;
  telegraphTime: number;  // seconds before activation
  duration: number;       // seconds active
  damagePerTick: number;
  tickRate: number;       // damage interval
}
```

**Examples**:
- **Fire Zones**: Random areas that burn for 5s, dealing 5 dmg/sec
- **Meteor Strike**: Telegraphed large AoE after 2s warning
- **Ice Spikes**: Line hazard that shoots across screen
- **Death Circle**: Arena shrinks temporarily, forcing combat

**Files to modify**:
- `src/systems/hazards.ts` - New file for hazard logic
- `src/scenes/gameplay.ts` - Integrate hazard updates
- `src/core/types.ts` - Add Hazard type

---

### 3.3 Elite Enemy Modifiers

**Status**: Medium Priority
**Effort**: Medium
**Impact**: Medium (threat variety)

**Description**: Random chance for enemies to spawn as "Elites" with modifiers.

**Proposed Modifiers**:
```typescript
export type EliteModifier =
  | 'champion'    // +200% HP, +50% damage, +50% XP
  | 'swift'       // +100% speed
  | 'regenerating' // Heals 5% HP per second
  | 'explosive'   // Explodes on death
  | 'splitting'   // Splits into 2 smaller enemies on death
  | 'vampiric'    // Heals when hitting player
  | 'arcane'      // Projects shield around nearby enemies

// Visual indicators
- Crown icon above elite
- Colored aura (gold for champion, red for explosive, etc.)
- Name prefix (e.g., "Champion Skeleton")
```

**Spawn Rate**: 5% chance at wave 3+, increasing to 15% by wave 15

**Files to modify**:
- `src/systems/spawner.ts` - Elite spawning logic
- `src/core/types.ts` - Add `EliteModifier` type to `Entity`
- `src/scenes/gameplay.ts` - Elite modifier effects in update loop

---

## Priority 4: Polish & Juice

### 4.1 Sound Effects & Music

**Status**: High Priority
**Effort**: Medium
**Impact**: High (game feel)

**Description**: Add audio system with SFX and background music.

**Proposed Implementation**:
```typescript
// Audio manager using Web Audio API
export interface AudioManager {
  playSound(id: string, volume?: number): void;
  playMusic(id: string, loop: boolean): void;
  stopMusic(): void;
  setVolume(type: 'sfx' | 'music', volume: number): void;
}
```

**Required Sounds**:
- **SFX**: Hit, kill, level up, weapon fire, player hurt, XP pickup, victory, defeat
- **Music**: Menu theme, gameplay theme (intense), victory fanfare, defeat sting

**Free Audio Sources**:
- Freesound.org (CC0/CC-BY licensed SFX)
- OpenGameArt.org (music and SFX)
- Generate with sfxr/jsfxr for placeholder sounds

**Files to modify**:
- `src/core/audio.ts` - New audio manager
- `src/main.ts` - Initialize audio
- Add audio triggers throughout gameplay events

---

### 4.2 Visual Effects Improvements

**Status**: Medium Priority
**Effort**: Low-Medium
**Impact**: Medium (polish)

**Current**: Basic particle system exists
**Improvements**:

1. **Better Hit Feedback**
   - Flash sprite white on hit
   - Spawn blood/spark particles
   - Damage numbers float upward

2. **Weapon Trails**
   - Sword leaves arc trail
   - Projectiles have particle trails (partially done)
   - Frost Nova adds ice crystals

3. **Environmental Effects**
   - Atmospheric particles (fog, embers)
   - Ground cracks under heavy enemies
   - Level-up aura effect

4. **Death Animations**
   - Enemy dissolve/fade
   - Explosion for elite deaths
   - XP gems scatter then magnetize

**Files to modify**:
- `src/core/particles.ts` - Extend particle system
- `src/systems/combat.ts` - Add hit VFX
- `src/scenes/gameplay.ts` - Environmental particles

---

### 4.3 UI/UX Improvements

**Status**: Medium Priority
**Effort**: Medium
**Impact**: Medium (player experience)

**Proposed Enhancements**:

1. **HUD Improvements**
   ```typescript
   // Add to HUD:
   - Mini-map showing enemy clusters
   - Active weapon cooldown indicators
   - Combo counter (kills in last 5s)
   - DPS meter (optional toggle)
   - Next wave countdown timer
   ```

2. **Menu Enhancements**
   - Settings menu (audio volume, keybinds)
   - Stats screen (total kills, best time, etc.)
   - Codex/compendium (view enemies, weapons unlocked)

3. **Visual Clarity**
   - Outline enemies when off-screen (directional arrows)
   - Different colored HP bars for elites/bosses
   - Danger indicator when HP < 20%

**Files to modify**:
- `src/ui/hud.ts` - Enhanced HUD elements
- `src/scenes/menu.ts` - Settings/stats screens
- `src/ui/minimap.ts` - New file for minimap

---

## Priority 5: Systems & Technical

### 5.1 Save System

**Status**: High Priority
**Effort**: Low
**Impact**: High (player retention)

**Description**: Persist progress using localStorage.

**Data to Save**:
```typescript
export interface SaveData {
  version: string;
  characters: {
    [id: string]: {
      unlocked: boolean;
      runsPlayed: number;
      bestTime: number;
      totalKills: number;
    }
  };
  metaProgression: {
    soulShards: number;
    unlockedUpgrades: string[];
  };
  achievements: Achievement[];
  settings: {
    volumeSfx: number;
    volumeMusic: number;
    keybinds: KeyBindings;
  };
  stats: {
    totalPlaytime: number;
    totalRuns: number;
    totalKills: number;
    totalDeaths: number;
  };
}
```

**Files to modify**:
- `src/systems/save.ts` - New file for save/load
- `src/main.ts` - Load on init, auto-save on key events
- `src/scenes/gameover.ts` - Save run statistics

---

### 5.2 Difficulty Modes

**Status**: Low Priority
**Effort**: Low
**Impact**: Medium (replayability)

**Proposed Modes**:

```typescript
export type DifficultyMode = 'normal' | 'hard' | 'nightmare' | 'endless';

// Difficulty modifiers
const difficultyConfig = {
  normal: {
    enemyHpMult: 1.0,
    enemyDamageMult: 1.0,
    enemySpeedMult: 1.0,
    xpMult: 1.0,
  },
  hard: {
    enemyHpMult: 1.5,
    enemyDamageMult: 1.3,
    enemySpeedMult: 1.1,
    xpMult: 1.2,  // Slight XP boost for challenge
  },
  nightmare: {
    enemyHpMult: 2.0,
    enemyDamageMult: 1.8,
    enemySpeedMult: 1.3,
    xpMult: 1.5,
    eliteSpawnRate: 0.25,  // 25% elite spawn rate
  },
  endless: {
    // No 10-minute timer, waves continue until death
    // Difficulty scales infinitely
  },
};
```

**Files to modify**:
- `src/core/types.ts` - Add difficulty setting to GameState
- `src/scenes/menu.ts` - Difficulty selection
- `src/systems/spawner.ts` - Apply difficulty modifiers

---

### 5.3 Performance Optimizations

**Status**: Low Priority
**Effort**: Medium
**Impact**: Low (already performant)

**Potential Optimizations**:

1. **Spatial Partitioning**
   - Implement quadtree for collision detection
   - Only check nearby enemies for attacks
   - Current: O(n*m), Optimized: O(n*log(m))

2. **Object Pooling**
   - Reuse entity objects instead of creating/destroying
   - Pre-allocate particle pools
   - Reduce GC pressure

3. **Render Culling**
   - Skip drawing entities far off-screen
   - Batch draw calls by color/type
   - Use OffscreenCanvas for static UI elements

**Note**: Only implement if performance issues arise (300+ enemies on screen)

**Files to modify**:
- `src/utils/spatial.ts` - New file for quadtree
- `src/systems/combat.ts` - Use spatial queries
- `src/core/game.ts` - Object pools

---

## Priority 6: Advanced Features

### 6.1 Weapon Synergies

**Status**: Low Priority
**Effort**: High
**Impact**: High (build depth)

**Description**: Weapons interact with each other for combo effects.

**Example Synergies**:
```typescript
// Fire + Ice = Steam Cloud (damage + slow zone)
if (hasWeapon('fireball') && hasWeapon('frost_nova')) {
  unlockSynergy('steam_cloud');
}

// Lightning + Sword = Thunder Blade (sword crackles with lightning)
if (hasWeapon('lightning') && hasWeapon('sword')) {
  applySynergyBonus('sword', { damage: 1.5, addEffect: 'chain_lightning' });
}

// Magic Missile + Any 3 weapons = Arcane Mastery (+20% all damage)
if (player.weapons.length >= 4 && hasWeapon('magic_missile')) {
  unlockSynergy('arcane_mastery');
}
```

**Files to modify**:
- `src/systems/synergies.ts` - New file for synergy detection
- `src/scenes/gameplay.ts` - Check for synergies after weapon unlocks
- `src/ui/hud.ts` - Display active synergies

---

### 6.2 Procedural Maps

**Status**: Low Priority
**Effort**: Very High
**Impact**: High (replayability)

**Description**: Replace flat arena with procedurally generated maps.

**Proposed Features**:
- Multiple biomes (graveyard, cathedral, forest, crypt)
- Obstacles (walls, pillars, tombstones)
- Chokepoints and open areas
- Visual variety with different tilesets

**Technical Approach**:
- Use noise generation for organic layouts
- Ensure no dead-ends (player must be able to escape)
- Spawn enemies only in reachable areas

**Files to modify**:
- `src/systems/map_generator.ts` - New file
- `src/scenes/gameplay.ts` - Use generated map
- `src/core/types.ts` - Add tile/collision data
- Rendering changes for tile-based backgrounds

---

### 6.3 Multiplayer / Co-op

**Status**: Very Low Priority
**Effort**: Very High
**Impact**: High (new audience)

**Description**: Local or online co-op for 2-4 players.

**Massive Scope - Consider for "2.0" version**
- Requires networking (WebRTC or WebSockets)
- Shared enemy scaling
- Friendly fire toggle
- Revive mechanics
- Split XP or individual progression

**Not recommended for current scope** - would require fundamental refactoring.

---

## Implementation Priority Recommendation

### Phase 1: Core Content (1-2 weeks)
1. ✅ Missing weapon patterns (orbit, aura, chain)
2. ✅ Enemy behaviors (charge, circle, ranged)
3. ✅ 5-7 new enemy types
4. ✅ Sound effects + basic music

### Phase 2: Progression (1 week)
5. ✅ 2-3 new characters
6. ✅ Save system
7. ✅ Character unlocks

### Phase 3: Advanced Content (1-2 weeks)
8. ✅ Boss encounters
9. ✅ Elite modifiers
10. ✅ Visual effects improvements

### Phase 4: Polish (1 week)
11. ✅ UI/UX improvements
12. ✅ Difficulty modes
13. ✅ Achievement system

### Phase 5: Advanced Features (Optional)
14. ⏳ Meta-progression
15. ⏳ Weapon synergies
16. ⏳ Procedural maps

---

## Quick Wins (Easy Additions)

These can be added in < 1 hour each:

1. **Damage Numbers** - Float text showing damage dealt
2. **Kill Counter** - Display total kills in HUD
3. **Combo System** - Bonus XP for rapid kills
4. **Screen Shake Intensity** - Vary shake based on damage
5. **Critical Hits** - 5% chance for 2x damage
6. **Background Music Loop** - Single track (even CC0 placeholder)
7. **Restart Button** - Quick restart from game over
8. **Leaderboard** (Local) - Top 10 runs stored in localStorage
9. **Enemy Spawn Warnings** - Red flash at screen edge
10. **Health Regen** - 1 HP/sec when not taking damage for 5s

---

## Content Creation Checklist

### Adding a New Weapon
- [ ] Create weapon file in `src/content/weapons/`
- [ ] Define WeaponDef with all properties
- [ ] Register in `src/content/weapons/index.ts`
- [ ] Add unlock upgrade in `src/content/upgrades/index.ts`
- [ ] Add level-up upgrade in `src/content/upgrades/index.ts`
- [ ] Test in-game at level 1 and max level
- [ ] Ensure pattern is implemented in `src/systems/combat.ts`

### Adding a New Enemy
- [ ] Create enemy file in `src/content/enemies/`
- [ ] Define EnemyDef with all properties
- [ ] Register in `src/content/enemies/index.ts`
- [ ] Test spawn at correct wave
- [ ] Test behavior pattern works correctly
- [ ] Verify HP scaling with waves
- [ ] Check XP drop amount is balanced

### Adding a New Character
- [ ] Create character file in `src/content/characters/`
- [ ] Define CharacterDef with stat modifiers
- [ ] Create starting weapon if new
- [ ] Register in `src/content/characters/index.ts`
- [ ] Test full run with character
- [ ] Verify stat modifiers apply correctly
- [ ] Add unlock condition if applicable

---

## Balance Considerations

### Current Balance Issues to Monitor
1. **XP Scaling** - Does player level up too fast/slow?
2. **Enemy Density** - Too many/few enemies at wave X?
3. **Weapon Damage** - Is any weapon significantly better than others?
4. **Survivability** - Can player survive without health upgrades?
5. **Run Timer** - Is 10 minutes the right length?

### Testing Checklist for New Content
- [ ] Can player survive 10 minutes with default stats?
- [ ] Does new content appear at expected frequency?
- [ ] Is new content visually distinct from existing?
- [ ] Does performance remain smooth (60 FPS) with new content?
- [ ] Are tooltips/descriptions clear?

---

## Technical Debt & Refactoring

### Known Issues
1. **No Type Safety for Upgrade IDs** - String literals, prone to typos
2. **Combat System Growing Large** - Consider splitting by pattern
3. **No Entity Component System** - Enemies/player share monolithic type
4. **Hard-coded Constants** - Magic numbers scattered in code
5. **No Debug Mode** - Would help with content testing

### Suggested Refactors (Low Priority)
```typescript
// 1. Centralize constants
export const GAME_CONFIG = {
  PLAYER_BASE_SPEED: 180,
  PLAYER_BASE_HP: 100,
  XP_MAGNET_BASE: 50,
  // ... etc
};

// 2. Debug mode toggle
export const DEBUG = {
  enabled: false,
  godMode: false,
  showColliders: false,
  instantLevelUp: false,
  unlockAll: false,
};

// 3. Type-safe IDs
export type WeaponId = 'sword' | 'fireball' | 'lightning' | /* ... */;
export type EnemyId = 'skeleton' | 'bat' | 'zombie' | /* ... */;
```

---

## Playtesting Questions

### For Internal Testing
1. Which weapon feels most satisfying to use?
2. Which enemy type is most threatening?
3. At what wave does difficulty spike noticeably?
4. Which upgrades feel mandatory vs optional?
5. Is visual feedback clear for taking damage?
6. Can you read all text at native resolution?
7. Does the game feel "juicy" enough?
8. Is the tutorial/first-run experience clear?

### For External Playtest
1. Did you understand controls immediately?
2. How long was your first run?
3. What killed you?
4. Which character did you pick and why?
5. Would you play again? Why/why not?
6. What felt unfair or frustrating?
7. What was the most fun moment?
8. Any bugs encountered?

---

## Marketing & Distribution (Post-MVP)

### Potential Platforms
- **Itch.io** - Primary indie game platform
- **GitHub Pages** - Free hosting for web version
- **Newgrounds** - Active community for browser games
- **Kongregate** - Established web game portal

### Pre-Launch Checklist
- [ ] Trailer video (30-60 seconds)
- [ ] Screenshot gallery (5-10 images)
- [ ] Itch.io page with clear description
- [ ] GIF showcasing gameplay
- [ ] Link to source code (if open source)
- [ ] Credits for any CC-BY assets

---

## Final Notes

This document should be updated as features are implemented. Mark items with:
- ✅ Completed
- 🚧 In Progress
- ❌ Cancelled
- ⏳ Planned

**Next Steps**: Review with team/stakeholders and prioritize Phase 1 items.
