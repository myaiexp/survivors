/**
 * INPUT MANAGER
 * Handles keyboard and mouse input. Supports WASD + arrow movement,
 * mouse position for manual aiming, and click for interactions.
 */

import { Vec2, CANVAS_W, CANVAS_H } from './types';
import { normalize } from '../utils/math';

class InputManager {
  private keys = new Set<string>();
  private mousePos: Vec2 = { x: CANVAS_W / 2, y: CANVAS_H / 2 };
  private mouseWorld: Vec2 = { x: 0, y: 0 };
  private _mouseDown = false;
  private _click = false;

  init(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      // Prevent arrow key page scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      this.mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    });
    canvas.addEventListener('mousedown', (e) => {
      // Only track left-click (button 0)
      if (e.button === 0) {
        this._mouseDown = true;
        this._click = true;
      }
      // Prevent right-click context menu from stealing focus
      if (e.button === 2) {
        e.preventDefault();
      }
    });
    canvas.addEventListener('mouseup', (e) => {
      // Only track left-click (button 0)
      if (e.button === 0) {
        this._mouseDown = false;
      }
    });
    // Prevent context menu from appearing on right-click
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    // Reset keys on window blur to prevent stuck keys
    window.addEventListener('blur', () => {
      this.keys.clear();
      this._mouseDown = false;
    });
  }

  /** Get normalized movement direction from WASD / arrow keys */
  getMovement(): Vec2 {
    let x = 0;
    let y = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    return normalize({ x, y });
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMouseScreen(): Vec2 {
    return { ...this.mousePos };
  }

  /** Update world-space mouse position based on camera offset */
  updateMouseWorld(cameraX: number, cameraY: number) {
    this.mouseWorld = {
      x: this.mousePos.x + cameraX - CANVAS_W / 2,
      y: this.mousePos.y + cameraY - CANVAS_H / 2,
    };
  }

  getMouseWorld(): Vec2 {
    return { ...this.mouseWorld };
  }

  isMouseDown(): boolean {
    return this._mouseDown;
  }

  /** Returns true once per click, then resets */
  consumeClick(): boolean {
    if (this._click) {
      this._click = false;
      return true;
    }
    return false;
  }
}

export const input = new InputManager();
