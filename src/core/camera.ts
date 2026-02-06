/**
 * CAMERA
 * Follows the player with smooth lerp. Supports screen shake for game feel.
 */

import { Vec2, CANVAS_W, CANVAS_H } from './types';
import { lerp, randRange } from '../utils/math';

class Camera {
  x = 0;
  y = 0;
  private shakeAmount = 0;
  private shakeTimer = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  /** Smoothly follow a target position */
  follow(target: Vec2, dt: number) {
    const smoothing = 1 - Math.pow(0.001, dt); // framerate-independent lerp
    this.x = lerp(this.x, target.x, smoothing);
    this.y = lerp(this.y, target.y, smoothing);
  }

  /** Trigger screen shake */
  shake(amount: number, duration: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  update(dt: number) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const intensity = this.shakeAmount * (this.shakeTimer > 0 ? 1 : 0);
      this.shakeOffsetX = randRange(-intensity, intensity);
      this.shakeOffsetY = randRange(-intensity, intensity);
      if (this.shakeTimer <= 0) {
        this.shakeAmount = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  /** Apply camera transform to the rendering context */
  applyTransform(ctx: CanvasRenderingContext2D) {
    ctx.translate(
      -this.x + CANVAS_W / 2 + this.shakeOffsetX,
      -this.y + CANVAS_H / 2 + this.shakeOffsetY,
    );
  }

  /** Convert world position to screen position */
  worldToScreen(wx: number, wy: number): Vec2 {
    return {
      x: wx - this.x + CANVAS_W / 2 + this.shakeOffsetX,
      y: wy - this.y + CANVAS_H / 2 + this.shakeOffsetY,
    };
  }

  /** Check if a world position is visible on screen (with margin) */
  isVisible(wx: number, wy: number, margin = 100): boolean {
    const sx = wx - this.x + CANVAS_W / 2;
    const sy = wy - this.y + CANVAS_H / 2;
    return sx > -margin && sx < CANVAS_W + margin &&
           sy > -margin && sy < CANVAS_H + margin;
  }
}

export const camera = new Camera();
