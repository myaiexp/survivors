/**
 * GAME
 * Main game class — owns the canvas, game loop, and scene management.
 */

import { GameState, SceneId, CANVAS_W, CANVAS_H, RUN_DURATION } from './types';
import { input } from './input';
import * as menuScene from '../scenes/menu';
import * as gameplayScene from '../scenes/gameplay';
import * as levelupScene from '../scenes/levelup';
import * as gameoverScene from '../scenes/gameover';

type SceneModule = {
  enter(state: GameState): void;
  update(state: GameState, dt: number): void;
  draw(state: GameState, ctx: CanvasRenderingContext2D): void;
  exit(state: GameState): void;
};

const scenes: Record<SceneId, SceneModule> = {
  menu: menuScene,
  gameplay: gameplayScene,
  levelup: levelupScene,
  gameover: gameoverScene,
};

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState;
  private currentScene: SceneId = 'menu';
  private lastTime = 0;
  private running = false;

  constructor() {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.state = {
      scene: 'menu',
      runTime: 0,
      runDuration: RUN_DURATION,
      wave: 0,
      paused: false,
      entities: [],
      player: null,
      pendingUpgrades: [],
      gameResult: null,
    };

    // Scale canvas to fit window
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    input.init(this.canvas);
  }

  private resizeCanvas() {
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    const scaleX = maxW / CANVAS_W;
    const scaleY = maxH / CANVAS_H;
    const scale = Math.min(scaleX, scaleY);
    this.canvas.style.width = `${CANVAS_W * scale}px`;
    this.canvas.style.height = `${CANVAS_H * scale}px`;
  }

  start() {
    this.running = true;
    scenes[this.currentScene].enter(this.state);
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(time: number) {
    if (!this.running) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // cap dt to 50ms
    this.lastTime = time;

    // Scene transition detection
    if (this.state.scene !== this.currentScene) {
      scenes[this.currentScene].exit(this.state);
      this.currentScene = this.state.scene;
      scenes[this.currentScene].enter(this.state);
    }

    // Update
    scenes[this.currentScene].update(this.state, dt);

    // Check for scene change after update (e.g. level-up trigger)
    if (this.state.scene !== this.currentScene) {
      scenes[this.currentScene].exit(this.state);
      this.currentScene = this.state.scene;
      scenes[this.currentScene].enter(this.state);
    }

    // Draw
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    scenes[this.currentScene].draw(this.state, this.ctx);

    requestAnimationFrame((t) => this.loop(t));
  }
}
