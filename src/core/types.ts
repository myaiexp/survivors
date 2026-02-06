/**
 * CORE TYPE DEFINITIONS
 *
 * All shared types for the game live here. Content modules (weapons, enemies, etc.)
 * import from this file. If you're adding new content, check this file for the
 * type definitions you need.
 */

// ── Geometry ──────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Entity System ─────────────────────────────────────────────────────

export type EntityTag = 'player' | 'enemy' | 'projectile' | 'pickup' | 'effect';

export interface Entity {
  id: number;
  tag: EntityTag;
  pos: Vec2;
  vel: Vec2;
  size: number;         // collision radius
  hp: number;
  maxHp: number;
  alive: boolean;
  facing: Vec2;         // normalized direction entity faces
  speed: number;
  knockbackVel: Vec2;
  invulnTimer: number;  // seconds of invulnerability remaining
  flashTimer: number;   // seconds of hit-flash remaining
}

// ── Player-Specific ───────────────────────────────────────────────────

export interface PlayerState extends Entity {
  tag: 'player';
  xp: number;
  level: number;
  xpToNext: number;
  kills: number;
  weapons: ActiveWeapon[];
  stats: PlayerStats;
  characterId: string;
  magnetRadius: number;
  damageTaken: number;
  damageDealt: number;
}

export interface PlayerStats {
  maxHp: number;
  armor: number;
  speed: number;
  damage: number;       // multiplier, 1.0 = 100%
  attackSpeed: number;  // multiplier, 1.0 = 100%
  area: number;         // multiplier for weapon area
  projectileCount: number; // bonus projectiles
  luck: number;         // affects drop quality
  xpGain: number;       // multiplier for XP gained
  magnetRange: number;  // pickup magnet radius
}

export function defaultStats(): PlayerStats {
  return {
    maxHp: 100,
    armor: 0,
    speed: 180,
    damage: 1.0,
    attackSpeed: 1.0,
    area: 1.0,
    projectileCount: 0,
    luck: 1.0,
    xpGain: 1.0,
    magnetRange: 50,
  };
}

// ── Weapons ───────────────────────────────────────────────────────────

/**
 * Defines a weapon type. Content files in /content/weapons/ export these.
 * The combat system reads these definitions to spawn attacks.
 */
export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;       // seconds between attacks
  range: number;          // reach or projectile range
  area: number;           // size of the attack hitbox
  knockback: number;      // force applied to hit enemies
  piercing: number;       // how many enemies a projectile passes through (0 = dies on hit)
  projectileSpeed: number; // 0 for melee
  pattern: WeaponPattern;
  color: string;          // visual color for placeholder art
  trailColor: string;     // particle trail color
}

export type WeaponPattern = 'sweep' | 'projectile' | 'orbit' | 'aura' | 'chain' | 'nova';

export interface ActiveWeapon {
  defId: string;
  level: number;
  cooldownTimer: number;  // current cooldown remaining
}

// ── Enemies ───────────────────────────────────────────────────────────

/**
 * Defines an enemy type. Content files in /content/enemies/ export these.
 * The spawner reads these to create enemy instances.
 */
export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;          // contact damage
  size: number;            // collision radius
  xpValue: number;         // XP dropped on death
  color: string;           // placeholder art color
  behavior: EnemyBehavior;
  spawnWeight: number;     // relative spawn frequency
  minWave: number;         // earliest wave this can appear
}

export type EnemyBehavior = 'chase' | 'charge' | 'circle' | 'ranged';

// ── Characters ────────────────────────────────────────────────────────

/**
 * Defines a playable character. Characters modify starting stats
 * and begin with a specific weapon.
 */
export interface CharacterDef {
  id: string;
  name: string;
  description: string;
  startingWeaponId: string;
  statModifiers: Partial<PlayerStats>;
  color: string;           // placeholder art color
  unlocked: boolean;       // available from start?
}

// ── Upgrades ──────────────────────────────────────────────────────────

/**
 * Defines a level-up upgrade option. These appear when the player levels up.
 */
export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  icon: string;            // emoji or placeholder icon
  maxLevel: number;
  category: 'stat' | 'weapon' | 'special';
  apply: (player: PlayerState, level: number) => void;
  weight: number;          // selection weight (higher = more common)
}

// ── Pickups ───────────────────────────────────────────────────────────

export interface Pickup extends Entity {
  tag: 'pickup';
  pickupType: 'xp' | 'heal' | 'magnet';
  value: number;
  magnetized: boolean;
}

// ── Game State ─────────────────────────────────────────────────────────

export type SceneId = 'menu' | 'gameplay' | 'levelup' | 'gameover';

export interface GameState {
  scene: SceneId;
  runTime: number;        // seconds elapsed in current run
  runDuration: number;    // target run length in seconds
  wave: number;           // current difficulty wave
  paused: boolean;
  entities: Entity[];
  player: PlayerState | null;
  pendingUpgrades: UpgradeDef[];
  gameResult: 'victory' | 'defeat' | null;
}

// ── Rendering ─────────────────────────────────────────────────────────

export interface DrawCommand {
  type: 'circle' | 'rect' | 'arc' | 'line' | 'text';
  x: number;
  y: number;
  color: string;
  // Optional depending on type
  radius?: number;
  w?: number;
  h?: number;
  angle?: number;
  arcLength?: number;
  text?: string;
  fontSize?: number;
  alpha?: number;
}

// ── Scene Interface ───────────────────────────────────────────────────

export interface Scene {
  enter(state: GameState): void;
  update(state: GameState, dt: number): void;
  draw(state: GameState, ctx: CanvasRenderingContext2D): void;
  exit(state: GameState): void;
}

// ── Constants ─────────────────────────────────────────────────────────

export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const RUN_DURATION = 600; // 10 minutes in seconds
export const XP_BASE = 10;      // XP needed for level 2
export const XP_SCALE = 1.25;   // XP requirement growth per level
