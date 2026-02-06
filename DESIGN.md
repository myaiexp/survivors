# Survivors Roguelite — Design Overview

## Vision
A dark medieval survivors-style roguelite. Free game, released on itch.io.
Top-down 2D, WASD movement, auto-aim attacks with manual aim option.
10-minute timed runs. Target audience: adults who respect good games.

## Core Loop (MVP — CURRENT)
1. Pick a character (determines starting weapon + stat bonuses)
2. Enter a 10-minute run
3. Enemies spawn in waves, increasing over time
4. Kill enemies → XP gems → level up → pick an upgrade
5. Survive 10 minutes = victory

## Architecture
See `src/` structure. Key principle: **modularity**.
Each content type (weapons, enemies, characters, upgrades) has its own
directory with self-documenting files. To add content, copy a template
file and register it in the directory's `index.ts`.

```
src/
  core/         — Engine: game loop, input, camera, particles, types
  systems/      — Game systems: combat, spawner, XP
  content/      — MODULAR CONTENT (weapons, enemies, characters, upgrades)
  scenes/       — Game scenes: menu, gameplay, level-up, game over
  ui/           — HUD and UI components
  meta/         — Save system, progression (future)
  utils/        — Math helpers
```

## Characters
- Gacha-based unlock system (future)
- Duplicates increase character stats by ~5%
- Each character has a starting weapon and stat modifiers

## Weapons
- Starting weapon determined by character
- Additional weapons acquired during runs (from level-ups, bosses, quests)
- Weapon patterns: sweep, projectile, orbit, aura, chain, nova
- Weapons forged from materials outside of runs (future)

## Upgrades
- Offered on level-up (pick 1 of 3)
- Stat boosts, weapon upgrades, special abilities
- Some have max levels, some are repeatable

## Future Features (not in MVP)
- [ ] More weapons (orbit, aura, chain, nova patterns)
- [ ] More enemies (charge, circle, ranged behaviors)
- [ ] Boss encounters at wave milestones
- [ ] Equipment forging (meta-progression between runs)
- [ ] Character gacha / unlock system
- [ ] Pets that fight alongside player
- [ ] Spells / active abilities
- [ ] Secret objectives and optional quests during runs
- [ ] Infinite mode (no timer, endless scaling)
- [ ] Achievements system
- [ ] Daily/event runs with limited attempts
- [ ] Sound effects and music
- [ ] Proper pixel art (replace placeholder shapes)
- [ ] Save/load system for meta-progression
- [ ] More upgrade variety (weapon-specific upgrades, synergies)
