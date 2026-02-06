# CLAUDE.md — Instructions for AI assistants working on this codebase

## Build & Run

```bash
npm install          # install deps (esbuild + typescript)
npm run dev          # dev server with hot reload at localhost:8080
npm run build        # production build to dist/
npx tsc --noEmit     # type-check without emitting (run after changes)
```

## Architecture Principle: Modularity

This codebase is designed so you can work on individual systems without reading the entire project. Each content type lives in `src/content/` with self-documenting files.

**When adding content**, you typically only need to read:
1. The relevant content file (e.g., `src/content/weapons/sword.ts`) — has full docs
2. The directory's `index.ts` — to register the new content
3. Optionally `src/core/types.ts` — for type definitions

**You do NOT need to read** the game loop, renderer, or scene files to add new weapons/enemies/characters/upgrades.

## How to Add Content

### New Weapon
1. Read `src/content/weapons/sword.ts` (has full pattern docs)
2. Create new file in `src/content/weapons/`
3. Export a `WeaponDef` object
4. Register in `src/content/weapons/index.ts`

### New Enemy
1. Read `src/content/enemies/skeleton.ts` (has full behavior docs)
2. Create new file in `src/content/enemies/`
3. Export an `EnemyDef` object
4. Register in `src/content/enemies/index.ts`

### New Character
1. Read `src/content/characters/knight.ts` (has full stat docs)
2. Create new file in `src/content/characters/`
3. Export a `CharacterDef` object
4. Register in `src/content/characters/index.ts`

### New Upgrade
1. Read `src/content/upgrades/index.ts` (all upgrades + docs in one file)
2. Add a new `UpgradeDef` object to the `upgradeDefs` array

## Key Files Reference

| Purpose | File |
|---------|------|
| All shared types | `src/core/types.ts` |
| Game constants (canvas size, run duration, XP scaling) | `src/core/types.ts` (bottom) |
| Game loop & scene management | `src/core/game.ts` |
| Main gameplay logic | `src/scenes/gameplay.ts` |
| Weapon attack patterns & hit detection | `src/systems/combat.ts` |
| Enemy wave spawning & scaling | `src/systems/spawner.ts` |
| XP gems, leveling, pickup magnet | `src/systems/xp.ts` |
| Particle effects (juice) | `src/core/particles.ts` |
| Camera (follow + screen shake) | `src/core/camera.ts` |

## Code Style

- TypeScript strict mode
- No runtime dependencies — pure canvas rendering
- Functional module pattern (not classes) for systems and scenes
- Content files are data-driven (plain objects, not classes)
- Keep files focused and under ~300 lines where practical

## Game Design Context

- Dark medieval swords & magic theme
- Survivors-style auto-battler with WASD movement
- 10-minute timed runs
- Completely free, no monetization
- Priority: satisfying snappy gameplay > content quantity
- Placeholder art uses colored geometric shapes — should still look decent
