# Survivors Game Testing Guide

A comprehensive testing strategy for survivors-genre games — from solo-dev sanity checks to full automated regression suites. Written with a Halls of Torment-scale finished product in mind, applicable at every stage of development.

---

## Table of Contents

1. [Why Survivors Games Are Hard to Test](#1-why-survivors-games-are-hard-to-test)
2. [Testing Layers Overview](#2-testing-layers-overview)
3. [Layer 1: Unit Testing Pure Logic](#3-layer-1-unit-testing-pure-logic)
4. [Layer 2: Stat & Formula Verification](#4-layer-2-stat--formula-verification)
5. [Layer 3: Weapon System Testing](#5-layer-3-weapon-system-testing)
6. [Layer 4: Enemy Behavior & Spawning](#6-layer-4-enemy-behavior--spawning)
7. [Layer 5: Upgrade & Build Combinatorics](#7-layer-5-upgrade--build-combinatorics)
8. [Layer 6: Character Balance & Parity](#8-layer-6-character-balance--parity)
9. [Layer 7: Economy & Progression](#9-layer-7-economy--progression)
10. [Layer 8: Performance & Entity Limits](#10-layer-8-performance--entity-limits)
11. [Layer 9: Edge Cases & Degenerate States](#11-layer-9-edge-cases--degenerate-states)
12. [Layer 10: Full Run Simulation](#12-layer-10-full-run-simulation)
13. [Layer 11: Visual & Audio Integrity](#13-layer-11-visual--audio-integrity)
14. [Layer 12: Regression Testing](#14-layer-12-regression-testing)
15. [Automation Strategies](#15-automation-strategies)
16. [Recommended Tooling & Infrastructure](#16-recommended-tooling--infrastructure)
17. [Prioritization for Solo Devs](#17-prioritization-for-solo-devs)

---

## 1. Why Survivors Games Are Hard to Test

Survivors-genre games suffer from **combinatorial explosion** in ways most genres don't:

- **Multiplicative complexity**: 10 weapons x 8 characters x 40 upgrades x 5 levels each = millions of possible build states. Every combination is a potential bug surface.
- **Emergent interactions**: Stat stacking creates emergent behavior. +50% area on a sweep weapon feels fine; +50% area on a nova with +3 projectiles might cover the entire screen and tank FPS.
- **Time-dependent bugs**: A build might feel fine at minute 2 and crash the game at minute 8 when 200 enemies are on screen and every weapon is firing at 0.1s cooldowns.
- **Silent balance bugs**: Unlike a crash, a broken damage formula that makes one build 10x stronger than intended is invisible unless you're looking for it. Players discover these as "exploits."
- **State accumulation**: The game state is a product of every upgrade choice, every kill, every XP gem. Bugs can hide in specific sequences of level-up choices that a dev would never think to try.

**The core problem**: A solo dev plays maybe 5-10 runs per testing session. A finished game with 10+ characters, 20+ weapons, and 50+ upgrades has thousands of meaningfully different runs. Manual testing covers a tiny fraction.

---

## 2. Testing Layers Overview

Testing a survivors game requires layered coverage, from fast isolated checks to slow full-simulation runs:

| Layer | What It Tests | Speed | When to Run |
|-------|--------------|-------|-------------|
| Unit tests | Pure math, formulas, utilities | ms | Every commit |
| Stat verification | Stat stacking, caps, formulas | ms | Every commit |
| Weapon tests | Fire patterns, hitboxes, interactions | ms-s | Every commit |
| Enemy tests | AI behavior, spawning, scaling | ms-s | Every commit |
| Upgrade combos | Build interactions, stacking | s | Pre-release |
| Character parity | Cross-character balance | s | Content changes |
| Economy tests | XP curves, progression rate | s | Balance changes |
| Performance | Entity caps, frame budgets | s-min | Weekly / content changes |
| Edge cases | Overflow, division-by-zero, degenerate states | ms-s | Every commit |
| Full run sims | Headless 10-min run simulations | min | Nightly / pre-release |
| Visual/audio | Rendering correctness, no orphan particles | manual + screenshot | Pre-release |
| Regression | Known-bug reproductions | ms-s | Every commit |

---

## 3. Layer 1: Unit Testing Pure Logic

These are the cheapest, fastest tests. Pure functions with no game state dependencies.

### 3.1 Math Utilities

```
- Vec2 operations: add, subtract, normalize, distance, dot product, length
- Angle calculations: atan2 wrapping, angle-between, arc containment
- Collision detection: circle-circle, circle-rect, point-in-arc
- Random utilities: weighted random selection, seeded RNG consistency
- Clamping, lerp, easing functions
```

**What to test**:
- Zero vectors (normalize of {0,0} should not produce NaN)
- Negative/wraparound angles (e.g., -10 degrees vs 350 degrees should overlap)
- Very large/small values (distance between entities at {0,0} and {999999, 999999})
- Floating point edge cases (is 0.1 + 0.2 === 0.3 going to break a threshold check?)

### 3.2 Formula Correctness

Every formula in the game should have an isolated test:

```
XP curve:       xpForLevel(1) = 10, xpForLevel(10) ≈ 75, xpForLevel(20) ≈ 554
Damage:         baseDmg * statDmg * weaponLevelMultiplier
Cooldown:       baseCooldown / attackSpeed
Enemy HP:       baseHP * (1 + wave * scaling)
Spawn rate:     max(floor, base - wave * reduction)
Armor:          max(1, incomingDmg - armor)
```

**What to test**:
- Formulas produce expected values at key breakpoints (level 1, 10, 20, 50)
- Formulas don't produce negative, NaN, or Infinity values at any input
- Integer overflow doesn't occur at extreme levels/waves (wave 100+)
- Edge: what happens when attackSpeed = 0? When armor > damage?

### 3.3 Weighted Random Selection

```
- With one item at weight 100 and one at weight 1, the first should appear ~99% of the time
- Zero-weight items should never be selected
- Negative weights should be treated as 0 or rejected
- Empty arrays should not crash
- Seed determinism: same seed always produces same sequence
```

---

## 4. Layer 2: Stat & Formula Verification

Stats are the backbone of a survivors game and the #1 source of subtle bugs.

### 4.1 Stat Initialization

For every character, verify that:
```
- Base stats + character modifiers produce correct starting stats
- No stat is negative, NaN, or zero when it shouldn't be
- Speed of 0 doesn't cause division-by-zero in movement
- Starting weapon matches character definition
- Starting HP equals maxHp (not 0, not undefined)
```

### 4.2 Stat Stacking Correctness

Test every upgrade applied 1 through maxLevel times:
```
- Additive stats (maxHp, armor, speed, magnetRange) grow linearly
- Multiplicative stats (damage, attackSpeed, area, xpGain) stack correctly
- No stat exceeds design-intended caps (if caps exist)
- No stat reaches 0 or negative where that would break systems
```

**Critical interactions to verify**:
```
- attackSpeed near 0: does cooldown approach infinity? Is there a minimum?
- armor > enemy damage: does min(1) damage rule hold? Or does it hit 0?
- area multiplier at 5x+: do hitboxes extend off-screen?
- projectileCount + multishot: does the spray angle become degenerate?
- speed at 3x+: can the player outrun camera follow? Exit the game world?
- damage at 10x+: do enemies die before their death animation plays?
- xpGain at 5x+: does the player level up multiple times per frame? Does UI handle this?
```

### 4.3 Stat Snapshot vs. Live Reference

A common bug class: **when are stats read?**
```
- If a weapon caches damage at fire time, mid-flight buffs won't apply (correct?)
- If a weapon reads damage at hit time, buffing damage between fire and hit changes the result
- Decide on a rule and test that all weapons follow it consistently
- Test: apply a damage upgrade while a projectile is in flight. Does it affect that projectile?
```

### 4.4 Stat Display Accuracy

```
- HUD shows correct current HP / max HP
- Damage numbers shown match actual damage dealt
- Tooltip/description text matches actual stat values
- Upgrade descriptions match their actual apply() effects
- "15% damage" means the same thing everywhere (additive to multiplier, not compounding)
```

---

## 5. Layer 3: Weapon System Testing

### 5.1 Per-Weapon Verification

For each weapon, test in isolation:

```
Cooldown:
  - Fires at correct interval (baseCooldown / attackSpeed)
  - First shot fires immediately (or after initial cooldown — pick one, test it)
  - Cooldown resets correctly after firing
  - Pausing the game doesn't advance cooldown

Damage:
  - Correct base damage at weapon level 1
  - Correct scaling per weapon level (+20% per level or whatever the rule is)
  - Correct interaction with player damage multiplier
  - Damage numbers displayed match damage applied

Hitbox:
  - Sweep: correct arc angle and range, hits enemies inside arc, misses enemies outside
  - Projectile: correct collision radius, travels correct distance, correct speed
  - Nova: correct number of projectiles, even angular distribution
  - Orbit: correct radius, rotation speed, hit frequency
  - Aura: correct radius, tick rate, damage per tick
  - Chain: jumps correct number of times, no infinite loops, no double-hits

Piercing:
  - Piercing 0 = dies on first hit
  - Piercing N = passes through N enemies, dies on N+1
  - Piercing 99 (infinite) = never dies from hits, only from lifetime
  - hitEnemies set prevents double-damage on same enemy

Knockback:
  - Applied in correct direction (away from hit source)
  - Magnitude scales with weapon knockback value
  - Doesn't push enemies through walls (if walls exist)
  - Doesn't push enemies off the game world
```

### 5.2 Multi-Weapon Interactions

When the player has 2+ weapons equipped simultaneously:

```
- All weapons fire independently on their own cooldowns
- Weapons don't interfere with each other's hit tracking
- Projectiles from different weapons can hit the same enemy
- Kill credit is tracked correctly (for stats/achievements)
- Having 6 weapons doesn't cause the attack system to skip frames
```

### 5.3 Weapon + Stat Interactions

Test every weapon against every stat modifier:

```
                    | Sweep  | Projectile | Nova | Orbit | Aura | Chain
--------------------|--------|------------|------|-------|------|------
+damage             | ✓      | ✓          | ✓    | ✓     | ✓    | ✓
+attackSpeed        | ✓      | ✓          | ✓    | ✓     | ✓    | ✓
+area               | ✓      | ✓          | ✓    | ✓     | ✓    | ✓
+projectileCount    | N/A?   | ✓          | ✓    | N/A?  | N/A? | N/A?
+range (if stat)    | ✓      | ✓          | ✓    | ✓     | ✓    | ✓
+knockback (if stat)| ✓      | ✓          | ✓    | ✓     | ✓    | ✓
```

Each cell should verify:
- The stat affects the weapon in the expected way
- The stat doesn't affect the weapon in unexpected ways (e.g., +projectileCount adding sweeps?)
- Extreme values of the stat don't break the weapon

### 5.4 Weapon Leveling (Evolutions)

For games with weapon evolution systems (like Vampire Survivors):
```
- Each weapon level applies correct bonuses
- Visual changes at evolution thresholds
- Evolution requirements (specific upgrade + weapon level) are checked correctly
- Evolved weapon replaces base weapon cleanly (no ghost weapons)
- Evolution mid-combat doesn't cause state corruption
- Can't evolve the same weapon twice
- Tooltip/description updates for evolved form
```

---

## 6. Layer 4: Enemy Behavior & Spawning

### 6.1 Per-Enemy Behavior Verification

For each enemy type and behavior pattern:

```
Chase:
  - Moves toward player at correct speed
  - Doesn't get stuck on other enemies (separation works)
  - Deals correct contact damage
  - Contact damage respects damage cooldown (no rapid-fire damage)
  - Dies at 0 HP, drops XP gem of correct value

Charge:
  - Winds up for correct duration
  - Charges in correct direction (player's position at charge start, not tracking)
  - Charge distance/speed is correct
  - Post-charge cooldown works
  - Deals damage during charge, not during wind-up

Circle:
  - Maintains correct orbit distance from player
  - Orbit speed is correct
  - Attacks at correct intervals (ranged attack or dive-in)

Ranged:
  - Maintains distance from player
  - Fires projectiles at correct interval
  - Projectiles travel toward player's position at fire time
  - Projectiles have correct speed, damage, size
  - Enemy retreats if player gets too close

All:
  - HP scaling per wave is correct
  - Knockback response is proportional and directional
  - Invulnerability frames work (if enemies have them)
  - Death triggers: XP drop, particle effects, kill counter increment
  - Enemies don't spawn inside the player
  - Enemies don't spawn inside walls/obstacles
```

### 6.2 Spawner System

```
Wave Progression:
  - Wave number increments at correct intervals
  - Correct enemies unlock at correct waves
  - HP scaling formula matches spec at wave 0, 5, 10, 15, 20
  - Spawn rate increases at correct pace
  - Enemy count per spawn increases correctly

Spawn Positioning:
  - Enemies spawn off-screen (never visible pop-in)
  - Spawn distance accounts for camera position, not just player position
  - Enemies don't spawn in inaccessible areas
  - Spawn positions have reasonable distribution (not all from one side)

Enemy Cap:
  - Spawner stops at entity limit (e.g., 300)
  - When enemies die, spawner resumes
  - Cap is never exceeded, even with burst spawns

Elite/Boss Spawning (for finished game):
  - Bosses spawn at correct wave/time triggers
  - Only one instance of unique bosses
  - Boss health bar appears/disappears correctly
  - Boss death triggers correct rewards
  - Boss abilities fire on correct timers
  - Boss doesn't despawn if player runs away
```

### 6.3 Enemy Interaction Edge Cases

```
- 200+ enemies chasing player simultaneously: performance and behavior
- Enemies stacking on top of each other: separation force sufficient?
- Enemy pushed off-screen by knockback: does it come back?
- Enemy killed at exact same frame it deals damage: does damage apply?
- All enemies killed at once (screen-clear): XP gems all spawn correctly?
- Enemy with 1 HP remaining hit by 1000 damage: no weird overflow behavior?
```

---

## 7. Layer 5: Upgrade & Build Combinatorics

This is the **most critical** and **most commonly overlooked** testing layer.

### 7.1 Individual Upgrade Verification

For every upgrade at every level:
```
- apply() modifies exactly the stats described in the description
- apply() doesn't modify any stats NOT described
- Applying the same upgrade N times produces the expected cumulative result
- maxLevel is respected (upgrade doesn't appear after max)
- Visual/audio feedback on application
```

### 7.2 Upgrade Interaction Matrix

Test pairs of upgrades that might interact:

```
Damage + AttackSpeed:
  - DPS should be (damage * attackSpeed). Verify the math composes correctly.
  - At max stacks of both: is DPS reasonable? Or does it one-shot everything?

AttackSpeed + Projectile:
  - More projectiles * faster firing = screen full of projectiles
  - Performance test: at max attack speed + max projectiles, how many entities exist?

Area + Projectile Count (Nova):
  - Large area + many projectiles = potential full-screen coverage
  - Verify no enemies can exist in a "safe zone" between projectiles

Armor + Max HP:
  - High armor + high HP = potential invincibility
  - Verify enemies can always deal at least 1 damage
  - Check if player can still die at max armor + max HP (are waves hard enough?)

Magnet Range + XP Gain:
  - Large magnet + high XP gain = rapid leveling
  - Verify XP curve still provides meaningful progression
  - Check for level-up spam (multiple level-ups per second)

Multishot + Area + AttackSpeed (combo):
  - The "everything at once" combo
  - Performance: how many attack entities exist simultaneously?
  - Visual: can the player see anything through the particle storm?
```

### 7.3 Build Archetype Testing

Define representative builds and simulate full runs:

```
Glass Cannon:    max damage, max attack speed, no HP/armor upgrades
Tank:            max HP, max armor, min damage
Speed Clear:     max move speed, max XP gain, max magnet
Projectile Spam: max projectile count, max attack speed, all projectile weapons
Melee Only:      only sweep/aura weapons, max area, max damage
AFK Build:       orbit + aura weapons, max area (tests "can you win without moving?")
Pacifist:        no damage upgrades, max HP/armor (tests "can you survive 10 minutes?")
```

### 7.4 Upgrade Selection Pool

```
- Offered upgrades are never duplicates within the same selection
- Maxed upgrades don't appear in the pool
- Weighted selection actually respects weights (statistical test over many samples)
- If all upgrades are maxed, the level-up still works (reroll, gold, skip, etc.)
- Weapon-specific upgrades only appear if player has that weapon
- Character-locked upgrades only appear for correct character
```

---

## 8. Layer 6: Character Balance & Parity

### 8.1 Per-Character Smoke Test

For every character, run an automated 10-minute simulation and verify:

```
- Character can survive at least 3 minutes with no upgrades
- Character can complete a full 10-minute run with reasonable upgrade RNG
- Starting weapon functions correctly for that character
- Stat modifiers apply correctly on top of base stats
- Character-specific abilities (if any) work as described
- Character selection UI shows correct info
- Unlock conditions work (if applicable)
```

### 8.2 Cross-Character Parity

Run the same deterministic simulation (same seed, same enemy spawns) with every character:

```
- Win rate across characters should be within an acceptable range (e.g., 40-70%)
- Average kill count should vary by character playstyle, not by bugs
- No character should be strictly dominant in every metric
- Time-to-first-death should correlate with character archetype (tanks survive longer)
```

### 8.3 Character + Weapon Compatibility

```
- Every character can use every weapon (unless deliberately restricted)
- Stat modifiers affect all weapons correctly (mage damage bonus applies to sword)
- Starting weapon level is always 1 (no accidental level 0 or 2)
- Swapping starting weapon via upgrade works (if that's a feature)
```

---

## 9. Layer 7: Economy & Progression

### 9.1 XP Curve

```
- Plot xpForLevel(1..50). Verify smooth exponential growth, no jumps.
- At each wave, calculate average XP income per second
- Verify expected level at each minute of a run:
  - Minute 1: level ~3-4
  - Minute 5: level ~10-15
  - Minute 10: level ~25-35
  (adjust to design intent)
- Verify a player can reach a "strong" build by minute 6-7 (the fun zone)
- Verify leveling doesn't stop feeling meaningful at any point
```

### 9.2 XP Economy Balance

```
- Kill rate at each wave * XP per kill = XP income rate
- XP income rate vs. XP required per level = leveling speed
- Verify leveling speed stays within design bounds across all waves
- Test with different XP gain multipliers (1x, 2x, 3x):
  - At 3x XP, does the player max out too early? (boring last 3 minutes)
  - At 1x XP with bad RNG, does the player feel stuck?
```

### 9.3 Meta-Progression (if applicable)

For games with persistent unlocks, currencies, achievement systems:

```
- Gold/currency earned per run is within expected range
- Permanent upgrades apply correctly on new runs
- Permanent upgrades don't stack with per-run upgrades in broken ways
- Unlocks trigger at correct conditions
- Save/load doesn't corrupt progression
- Resetting progression actually resets everything
```

---

## 10. Layer 8: Performance & Entity Limits

### 10.1 Entity Count Stress Tests

```
Spawn escalating entity counts and measure frame time:
  - 50 enemies:  should be well under 16ms frame time
  - 100 enemies: should be under 16ms
  - 200 enemies: should be under 16ms (target for normal gameplay)
  - 300 enemies: should be under 16ms (cap)
  - 500 enemies: (over cap) test graceful degradation
  - 1000 enemies: (way over cap) verify no crash

Same for projectiles:
  - 10, 50, 100, 200 simultaneous projectiles
  - Measure collision detection time specifically

Same for particles:
  - 100, 500, 1000, 2000 particles
  - Verify pool recycling (no memory leak)

Same for XP gems:
  - 100, 500, 1000 gems on ground
  - Magnet pickup of 500 gems at once: FPS drop? All collected?
```

### 10.2 Worst-Case Build Performance

Identify the build that creates the most entities and test it:
```
- Max attack speed + max projectile count + nova weapon + all projectile weapons
- Expected entity count: (projectiles_per_weapon * weapons * attacks_per_second) + enemies
- Verify game stays above 30 FPS in worst case
- If not, verify graceful degradation (slowdown, not crash)
```

### 10.3 Memory Stability

```
- Run a 10-minute simulation and graph memory usage over time
- Memory should plateau, not grow linearly
- No leaked event listeners, particle objects, entity references
- After game over + restart, memory returns to baseline
- Test 5 consecutive runs without page refresh: no memory growth
```

### 10.4 Garbage Collection

For JavaScript/TypeScript games specifically:
```
- GC pauses should not cause visible frame drops
- Object pooling is used for frequently created/destroyed objects:
  - Projectiles
  - Particles
  - XP gems
  - Damage numbers
  - Enemy entities
- Verify no per-frame allocations (new objects, array copies, closures)
```

---

## 11. Layer 9: Edge Cases & Degenerate States

### 11.1 Numeric Edge Cases

```
Division by zero:
  - attackSpeed = 0 → cooldown = base / 0 = Infinity
  - speed = 0 → normalize(velocity) = NaN?
  - area = 0 → hitbox size = 0 → can't hit anything

Overflow:
  - damage multiplier at 100x → damage = 1200 per hit. Fine.
  - damage multiplier at 10000x → is it still a number?
  - XP at level 100 → xpForLevel = 10 * 1.25^99. Is this Infinity?

Negative stats:
  - Character modifier reduces HP below 0 at start?
  - Speed penalty makes speed negative → walks backwards?
  - Armor so high that max(1, dmg - armor) always = 1 → fine, but test it

NaN propagation:
  - If any stat becomes NaN, does it propagate to position, HP, etc.?
  - Every stat calculation should be tested with NaN inputs
```

### 11.2 Timing Edge Cases

```
- Pause at exact moment of level-up: does upgrade screen appear after unpause?
- Pause during weapon cooldown: does cooldown freeze?
- Game over at exact moment of victory (timer hits 0 same frame HP hits 0)
- Level-up at exact moment of death
- Enemy death at exact moment of XP gem collection
- Two weapons killing the same enemy on the same frame
- Multiple level-ups in a single frame (high XP gain + big XP gem)
- Tab away from game → tab back: time jump? Or paused?
```

### 11.3 Spatial Edge Cases

```
- Player at world boundary: can they leave? What happens?
- Enemy spawned at exact same position as player
- 100 enemies on exact same position (zero separation distance)
- Projectile fired at zero-length direction vector
- Entity position at very large coordinates (floating point precision)
- Camera at world edge: does it clamp correctly?
```

### 11.4 State Machine Edge Cases

```
- Pressing start during game-over transition
- Opening level-up screen during pause
- Closing browser tab during save (if applicable)
- Rapid scene transitions (menu → gameplay → pause → unpause → game over)
- Re-entering gameplay scene without proper cleanup from previous run
```

---

## 12. Layer 10: Full Run Simulation

### 12.1 Headless Simulation

Run the entire game loop without rendering for 10 in-game minutes:

```
Inputs to the simulation:
  - Character selection
  - Seed for RNG (deterministic enemy spawns, upgrade offers)
  - Upgrade selection strategy (random, specific build, always-first, etc.)
  - Movement strategy (stand still, random walk, kite enemies, move toward gems)

Outputs to verify:
  - Player survived (or not) — and at what minute they died
  - Total kills
  - Total levels gained
  - Total damage dealt / taken
  - Max entities on screen at any point
  - Peak frame time (simulated)
  - Any NaN/Infinity/undefined values in game state
  - Final player stats
  - Weapons and their levels
  - No assertion failures or exceptions
```

### 12.2 Deterministic Replay

```
- Record all RNG seeds and player inputs during a run
- Replay with same seeds and inputs
- Verify identical game state at every frame
- Use this for regression: if a bug is found in a run, the replay file becomes a test case
```

### 12.3 Monte Carlo Simulation

Run thousands of headless simulations with random seeds and random upgrade choices:

```
Aggregate statistics:
  - Win rate per character
  - Average survival time per character
  - Distribution of final levels
  - Kill count percentiles (p10, p50, p90)
  - Most/least chosen upgrades (by weight vs. actual)
  - Builds that always win vs. builds that always lose
  - Average DPS at each minute mark
  - Entity count over time (mean + p99)
```

This reveals:
- Overpowered/underpowered characters
- Mandatory vs. trap upgrades
- Whether the game is too easy or too hard on average
- Whether RNG variance is too high (some runs trivial, some impossible)

---

## 13. Layer 11: Visual & Audio Integrity

These are harder to automate but still important.

### 13.1 Visual Checks

```
Rendering correctness:
  - All entities render at correct positions (world-to-screen transform)
  - Camera shake doesn't permanently offset the view
  - Particles render in front of / behind correct layers
  - HP bars are aligned with entities
  - HUD elements don't overlap game view in problematic ways
  - No rendering artifacts when entities are created/destroyed
  - Damage numbers are readable (not overlapping, correct values)

Animation states:
  - Hit flash triggers on damage
  - Death animation plays before entity is removed
  - Weapon animations match actual hitbox timing
  - Invulnerability visual feedback is visible

Screen transitions:
  - Menu → gameplay: no flash/artifact
  - Gameplay → level-up: game world still visible behind overlay
  - Level-up → gameplay: seamless resume
  - Gameplay → game-over: appropriate transition
```

### 13.2 Screenshot Diff Testing

```
- Capture screenshots at specific game states (deterministic seed, specific frame)
- Compare against golden screenshots pixel-by-pixel
- Flag any differences above a threshold
- Useful for catching: rendering regressions, Z-order bugs, color changes, UI layout shifts
```

### 13.3 Audio Checks (for games with audio)

```
- Attack sound plays on weapon fire (not on cooldown tick)
- Hit sound plays on enemy damage
- Death sound plays on enemy death
- Level-up sound plays once (not per frame during multi-level)
- Music loops correctly
- No audio overlap/stacking (100 enemies dying = not 100 simultaneous sounds)
- Volume controls work
- Mute works (all sounds, not just music)
```

---

## 14. Layer 12: Regression Testing

### 14.1 Bug Reproduction Tests

Every bug that gets fixed should produce a test:

```
Structure:
  1. Set up exact game state that triggers the bug
  2. Execute the action that causes the bug
  3. Assert the bug doesn't occur

Example:
  Bug: "Fireball damage doesn't apply damage multiplier at weapon level 3+"
  Test: Create player with damage 2.0, give fireball at level 3, fire at enemy,
        assert damage = baseDmg * 2.0 * (1 + 2 * 0.2) = baseDmg * 2.8
```

### 14.2 Content Addition Regression

Every time new content is added:
```
- Run all existing weapon tests (new enemy doesn't break old weapons)
- Run all existing enemy tests (new weapon doesn't break old enemies)
- Run all upgrade interaction tests (new upgrade doesn't break existing combos)
- Run performance benchmarks (new content doesn't degrade FPS)
- Run full simulation (new content doesn't change win rate dramatically)
```

### 14.3 Balance Regression

Maintain a baseline of expected balance metrics:
```
- Average win rate per character: 50% ± 15%
- Average survival time (on loss): 5-8 minutes
- Average DPS at minute 5: X ± Y
- Average level at minute 5: L ± M
```

If any patch changes these metrics beyond thresholds, the CI flags it for review.

---

## 15. Automation Strategies

### 15.1 Decouple Logic from Rendering

**This is the single most important architectural decision for testability.**

The game must be runnable without a canvas, without a DOM, without requestAnimationFrame:

```typescript
// BAD: logic and rendering interleaved
function update(ctx: CanvasRenderingContext2D) {
  enemies.forEach(e => {
    e.pos.x += e.vel.x * dt;
    ctx.fillRect(e.pos.x, e.pos.y, e.size, e.size);
  });
}

// GOOD: logic is pure, rendering is separate
function updateEnemies(enemies: Enemy[], dt: number): void {
  enemies.forEach(e => {
    e.pos.x += e.vel.x * dt;
  });
}

function renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
  enemies.forEach(e => {
    ctx.fillRect(e.pos.x, e.pos.y, e.size, e.size);
  });
}
```

With this separation, the entire game can run headlessly:

```typescript
// Headless 10-minute simulation
const state = createGameState({ character: 'knight', seed: 12345 });
const dt = 1/60;
for (let frame = 0; frame < 60 * 600; frame++) {
  updateGame(state, dt, simulatedInput);
}
assert(state.player.alive, "Knight should survive a full run with seed 12345");
```

### 15.2 Seeded RNG

Replace all `Math.random()` with a seeded PRNG:

```typescript
// A simple seedable PRNG (e.g., mulberry32)
function createRng(seed: number) {
  return function(): number {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage: deterministic simulation
const rng = createRng(42);
const state = createGameState({ rng });
// This run will always produce identical results
```

This enables:
- Deterministic replay (record seed, not every random call)
- Bug reproduction ("bug happens with seed 847291")
- Statistical testing (run 1000 different seeds, analyze distribution)

### 15.3 Simulated Input

Create an input abstraction that can be driven by AI or scripts:

```typescript
interface InputProvider {
  getMovement(): Vec2;        // WASD equivalent
  getAimDirection(): Vec2;    // mouse direction
  selectUpgrade(): number;    // 0, 1, or 2 (upgrade choice)
}

// Real input
class KeyboardInput implements InputProvider { ... }

// AI-driven input for testing
class SimulatedInput implements InputProvider {
  getMovement(): Vec2 {
    // Strategy: kite enemies (move away from nearest enemy)
    const nearest = findNearestEnemy(this.gameState);
    if (!nearest) return { x: 0, y: 0 };
    return normalize(subtract(this.gameState.player.pos, nearest.pos));
  }

  selectUpgrade(): number {
    // Strategy: always pick the first offered upgrade
    return 0;
    // Or: pick specific upgrades by ID
    // Or: random selection
    // Or: follow a predetermined build order
  }
}
```

### 15.4 Game State Snapshots & Assertions

Create utility functions to inspect game state mid-run:

```typescript
interface GameStateSnapshot {
  frame: number;
  runTime: number;
  playerHp: number;
  playerLevel: number;
  playerStats: PlayerStats;
  weaponStates: ActiveWeapon[];
  enemyCount: number;
  pickupCount: number;
  totalKills: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
}

function takeSnapshot(state: GameState): GameStateSnapshot { ... }

// Use in tests:
const snap1min = takeSnapshot(state); // after simulating 1 minute
assert(snap1min.playerLevel >= 2, "Should be at least level 2 by minute 1");
assert(snap1min.enemyCount <= 300, "Entity cap should be respected");
assert(!isNaN(snap1min.playerHp), "Player HP should never be NaN");
```

### 15.5 Invariant Checking

Define invariants that must ALWAYS be true and check them every frame during test runs:

```typescript
function checkInvariants(state: GameState): string[] {
  const violations: string[] = [];

  // Player invariants
  if (state.player) {
    if (state.player.hp > state.player.maxHp)
      violations.push(`HP ${state.player.hp} > maxHP ${state.player.maxHp}`);
    if (isNaN(state.player.pos.x) || isNaN(state.player.pos.y))
      violations.push("Player position is NaN");
    if (state.player.stats.attackSpeed < 0)
      violations.push("Attack speed is negative");
    for (const [key, val] of Object.entries(state.player.stats)) {
      if (typeof val === 'number' && (isNaN(val) || !isFinite(val)))
        violations.push(`Stat ${key} is ${val}`);
    }
  }

  // Entity invariants
  for (const entity of state.entities) {
    if (entity.alive && entity.hp <= 0)
      violations.push(`Entity ${entity.id} alive with ${entity.hp} HP`);
    if (isNaN(entity.pos.x) || isNaN(entity.pos.y))
      violations.push(`Entity ${entity.id} position is NaN`);
  }

  // Global invariants
  const enemies = state.entities.filter(e => e.tag === 'enemy' && e.alive);
  if (enemies.length > 500)
    violations.push(`Too many enemies: ${enemies.length}`);

  return violations;
}
```

Run this every frame during simulation. Any violation = test failure.

### 15.6 Property-Based Testing

Instead of testing specific cases, test properties that should always hold:

```typescript
// Property: damage dealt should always equal base * multipliers
property("damage formula is consistent", (baseDmg, statDmg, weaponLvl) => {
  const expected = baseDmg * statDmg * (1 + (weaponLvl - 1) * 0.2);
  const actual = calculateDamage(baseDmg, statDmg, weaponLvl);
  return actual === expected;
});

// Property: armor never reduces damage below 1
property("minimum damage is 1", (incomingDmg, armor) => {
  return calculateDamageTaken(incomingDmg, armor) >= 1;
});

// Property: leveling up always increases xpToNext
property("XP curve is monotonically increasing", (level) => {
  return xpForLevel(level + 1) > xpForLevel(level);
});

// Property: enemy spawns are always off-screen
property("enemies spawn off-screen", (angle, playerPos) => {
  const spawnPos = calculateSpawnPosition(angle, playerPos);
  return !isOnScreen(spawnPos, playerPos);
});
```

Use a library like fast-check for TypeScript property-based testing.

### 15.7 Stat Combination Fuzzing

Automatically test random stat combinations for invariant violations:

```typescript
function fuzzStatCombinations(iterations: number): void {
  const rng = createRng(Date.now());

  for (let i = 0; i < iterations; i++) {
    // Random stat values within plausible ranges
    const stats: PlayerStats = {
      maxHp: 20 + rng() * 500,
      armor: rng() * 30,
      speed: rng() * 600,
      damage: 0.1 + rng() * 10,
      attackSpeed: 0.1 + rng() * 5,
      area: 0.1 + rng() * 5,
      projectileCount: Math.floor(rng() * 10),
      luck: 0.5 + rng() * 5,
      xpGain: 0.5 + rng() * 5,
      magnetRange: rng() * 300,
    };

    // Try every weapon with these stats
    for (const weapon of allWeapons) {
      const cooldown = weapon.cooldown / stats.attackSpeed;
      assert(isFinite(cooldown) && cooldown > 0, `Cooldown broke with attackSpeed=${stats.attackSpeed}`);

      const damage = weapon.damage * stats.damage;
      assert(isFinite(damage) && damage > 0, `Damage broke with stats.damage=${stats.damage}`);

      const area = weapon.area * stats.area;
      assert(isFinite(area) && area > 0, `Area broke with stats.area=${stats.area}`);
    }
  }
}
```

### 15.8 Automated Balance Monitoring

Create a CI job that runs nightly Monte Carlo simulations:

```typescript
async function balanceReport(): Promise<BalanceReport> {
  const results: RunResult[] = [];

  for (const character of allCharacters) {
    for (let seed = 0; seed < 500; seed++) {
      const result = simulateRun({
        character: character.id,
        seed,
        upgradeStrategy: 'random',
        movementStrategy: 'kite',
      });
      results.push(result);
    }
  }

  return {
    winRateByCharacter: calculateWinRates(results),
    avgLevelByMinute: calculateLevelProgression(results),
    avgDpsByMinute: calculateDpsProgression(results),
    mostPickedUpgrades: calculateUpgradeFrequency(results),
    entityCountP99: calculateEntityCountPercentiles(results),
  };
}
```

Output this as a report that can be diff'd against the previous version. Flag changes outside thresholds.

---

## 16. Recommended Tooling & Infrastructure

### 16.1 Test Framework

| Tool | Purpose |
|------|---------|
| **Vitest** or **Jest** | Unit tests, integration tests (TypeScript native) |
| **fast-check** | Property-based testing |
| **Playwright** | E2E browser tests, screenshot comparison |
| **Custom harness** | Headless game simulation (no DOM dependency) |

### 16.2 CI Pipeline

```
On every commit:
  ├── TypeScript type check (tsc --noEmit)
  ├── Unit tests (formulas, math, stat calculations)
  ├── Integration tests (weapon behavior, enemy behavior)
  ├── Invariant fuzzing (1000 random stat combos)
  ├── Regression tests (known bug reproductions)
  └── Build verification (esbuild produces output)

Nightly:
  ├── Full run simulations (100 runs per character, all strategies)
  ├── Performance benchmarks (entity stress tests)
  ├── Balance report generation (Monte Carlo)
  ├── Memory leak detection (5 consecutive runs)
  └── Screenshot diff tests (visual regression)

Pre-release:
  ├── Extended Monte Carlo (1000+ runs per character)
  ├── All upgrade combination tests (full matrix)
  ├── Extended performance tests (worst-case builds)
  └── Manual playtest checklist (see below)
```

### 16.3 Manual Playtest Checklist (can't be automated)

Some things still require human judgment:

```
Feel & Responsiveness:
  □ Movement feels responsive (no input lag)
  □ Attacks feel satisfying (visual + audio + screen shake)
  □ Hits feel impactful (knockback + flash + damage numbers)
  □ Level-up feels rewarding
  □ Game over doesn't feel unfair (player understands why they died)

Visual Clarity:
  □ Player is always visible (not lost in particle effects)
  □ Enemy attacks are readable (telegraphed, not instant)
  □ HP bar is always visible
  □ Upgrades are distinguishable from each other
  □ Important enemies (elites, bosses) are visually distinct

Pacing:
  □ Early game (0-2 min) feels engagingly dangerous
  □ Mid game (3-6 min) feels like growing power
  □ Late game (7-10 min) feels like a climactic challenge
  □ No "dead zones" where nothing interesting happens
  □ Victory feels earned, not trivial
```

### 16.4 Project Structure for Tests

```
tests/
├── unit/
│   ├── math.test.ts              # Vec2 ops, collision, angles
│   ├── formulas.test.ts          # Damage, XP, scaling formulas
│   └── rng.test.ts               # Weighted selection, seed determinism
├── integration/
│   ├── weapons/
│   │   ├── sweep.test.ts
│   │   ├── projectile.test.ts
│   │   └── nova.test.ts
│   ├── enemies/
│   │   ├── chase.test.ts
│   │   └── spawner.test.ts
│   ├── stats/
│   │   ├── stacking.test.ts
│   │   └── caps.test.ts
│   └── upgrades/
│       ├── individual.test.ts
│       └── interactions.test.ts
├── simulation/
│   ├── headless-runner.ts        # Headless game loop
│   ├── input-strategies.ts       # AI input providers
│   ├── invariants.ts             # Per-frame invariant checks
│   ├── full-run.test.ts          # 10-minute run tests
│   └── monte-carlo.test.ts       # Statistical balance tests
├── performance/
│   ├── entity-stress.test.ts
│   ├── memory-leak.test.ts
│   └── worst-case-build.test.ts
├── regression/
│   └── bugs/                     # One file per fixed bug
│       ├── fireball-dmg-level3.test.ts
│       └── ...
└── visual/
    ├── screenshots/              # Golden screenshots
    └── screenshot-diff.test.ts
```

---

## 17. Prioritization for Solo Devs

You won't build all of this at once. Here's the order of highest impact-to-effort:

### Phase 1: Immediate (do this now)

1. **Seeded RNG** — Replace `Math.random()` with a seedable PRNG. This is foundational for everything else. A few hours of work that enables all future testing.

2. **Decouple update from render** — Ensure you can call `updateGame(state, dt)` without a canvas. This may already be partially done.

3. **Formula unit tests** — Test every damage/XP/scaling formula in isolation. Catches 50% of balance bugs with 1% of the effort.

4. **Invariant checker** — Write `checkInvariants(state)` and call it after every update during development. Catches NaN propagation, entity cap violations, and state corruption immediately.

### Phase 2: Before adding content (do this before the game gets bigger)

5. **Headless simulation harness** — Run 10-minute games without rendering. This is the most powerful testing tool for the genre.

6. **Per-weapon integration tests** — Verify each weapon fires, hits, and damages correctly. Run these on every commit.

7. **Stat interaction tests** — Test each stat at extreme values with each weapon type.

### Phase 3: Ongoing (scale with content)

8. **Regression test per bug** — Every fixed bug becomes a test. This is what prevents re-introducing bugs when adding content.

9. **Monte Carlo balance runs** — Run nightly. Watch for win rate drift.

10. **Performance benchmarks** — Catch performance regressions early, before they compound.

### Phase 4: Pre-release polish

11. **Full combinatorial upgrade testing**
12. **Screenshot diff testing**
13. **Extended stress testing**
14. **Manual playtesting with checklist**

---

## Summary

The core insight: **survivors games are combinatorial systems, and combinatorial systems need automated coverage.**

A solo dev manually playtesting will explore maybe 0.1% of the possibility space. The remaining 99.9% is where the bugs live — the weird stat combinations, the edge-case frame timings, the degenerate builds that make the game trivial or impossible.

The investment in testability (seeded RNG, headless simulation, logic/render separation) pays for itself the moment you add your fourth weapon or your third character. Without it, every new piece of content is a roll of the dice on whether it silently breaks something else.

Start with formulas and invariants. Build up to simulation. The bugs you catch in CI are the ones your players never see.
