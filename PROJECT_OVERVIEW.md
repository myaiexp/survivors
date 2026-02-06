# Survivors Roguelite

A dark medieval survivors-style roguelite. Free game for itch.io.

## Quick Start

```bash
npm install
npm run dev    # dev server at localhost:8080
npm run build  # production build to dist/
```

## Project Vision

- **Genre**: Top-down 2D survivors roguelite (think Vampire Survivors)
- **Theme**: Slightly dark medieval swords & magic
- **Target audience**: Adults who respect good games
- **Release**: Free on itch.io (and similar sites)
- **Monetization**: None. Completely free.
- **Edge**: Satisfying, snappy gameplay and interesting varied builds

## Core Loop

1. Pick a character (each has unique starting weapon + stat bonuses)
2. Enter a 10-minute timed run
3. Kill enemies → collect XP gems → level up → pick upgrades
4. Survive 10 minutes = victory
5. Between runs: unlock characters, forge equipment (future)

## Key Design Decisions

- **Movement**: WASD primary. All attacks auto-aim but manual aim is possible.
- **Runs**: 10-minute timed runs (short to compensate for limited early content). Infinite mode and other run types planned later.
- **Characters**: Gacha-based unlock system (future). Duplicates give ~5% stat boost.
- **Weapons**: Starting weapon tied to character. Forged from materials between runs (future). In-run weapon pickups from bosses/levels/quests.
- **No stamina**: Players can run as much as they want. Daily/event limited runs added later.
- **No multiplayer**: Solo only.
- **No leaderboards**: Just the player vs the game.

## Architecture — Modularity First

The codebase is structured so you can work on specific systems without reading everything. Each content directory has self-documenting files with instructions for adding new content.

```
src/
  core/           Game engine (loop, input, camera, particles, types)
  systems/        Game systems (combat, spawner, XP/leveling)
  content/        MODULAR CONTENT — where most additions happen
    weapons/      One file per weapon. Copy sword.ts → modify → register in index.ts
    enemies/      One file per enemy. Copy skeleton.ts → modify → register in index.ts
    characters/   One file per character. Copy knight.ts → modify → register
    upgrades/     All upgrades in index.ts, add objects to the array
  scenes/         Game flow (menu, gameplay, level-up overlay, game over)
  ui/             HUD and UI components
  meta/           Save system, progression (future, empty for now)
  utils/          Math/vector helpers
```

## Current Content

**Characters**: Knight (sword, tanky), Mage (fireball, glass cannon)
**Weapons**: Iron Sword (melee sweep), Fireball (auto-aim projectile)
**Enemies**: Skeleton (balanced), Shadow Bat (fast/weak), Undead Brute (tanky/slow)
**Upgrades**: 10 types (Vitality, Swift Boots, Might, Fervor, Iron Skin, Reach, Wisdom, Magnetism, Multishot, Healing Surge)

## Future Features (roughly prioritized)

1. More weapon patterns (orbit, aura, chain, nova — patterns already defined in types)
2. More enemies (charge, circle, ranged behaviors — behaviors already defined in types)
3. Boss encounters at wave milestones
4. Sound effects and music
5. Better placeholder art / proper pixel art
6. Equipment forging (meta-progression between runs)
7. Character gacha / unlock system
8. Pets
9. Spells / active abilities
10. Secret objectives and optional quests during runs
11. Infinite mode
12. Achievements
13. Daily/event runs
14. Save/load for meta-progression

## Tech Stack

- TypeScript + HTML5 Canvas (no framework)
- esbuild for bundling
- Zero runtime dependencies
