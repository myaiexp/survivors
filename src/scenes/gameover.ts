/**
 * GAME OVER SCENE
 * Shows victory/defeat, run stats, and option to return to menu.
 */

import { GameState, CANVAS_W, CANVAS_H } from '../core/types';
import { input } from '../core/input';

let animTimer = 0;

export function enter(_state: GameState) {
  animTimer = 0;
}

export function update(state: GameState, dt: number) {
  animTimer += dt;

  // Wait a moment before accepting input
  if (animTimer < 0.5) return;

  if (input.consumeClick() || input.isKeyDown('enter') || input.isKeyDown(' ')) {
    state.scene = 'menu';
  }
}

export function draw(state: GameState, ctx: CanvasRenderingContext2D) {
  // Dark background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const player = state.player;
  const victory = state.gameResult === 'victory';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Result title
  ctx.font = 'bold 40px monospace';
  ctx.fillStyle = victory ? '#ffd700' : '#cc2222';
  ctx.fillText(victory ? 'VICTORY' : 'DEFEAT', CANVAS_W / 2, 100);

  // Subtitle
  ctx.font = '16px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(
    victory ? 'You survived the darkness!' : 'The darkness consumed you...',
    CANVAS_W / 2, 145
  );

  if (player) {
    // Stats
    const stats = [
      { label: 'Level Reached', value: player.level.toString() },
      { label: 'Enemies Slain', value: player.kills.toString() },
      { label: 'Time Survived', value: formatTime(state.runTime) },
      { label: 'Character', value: player.characterId },
    ];

    const startY = 200;
    ctx.font = '14px monospace';
    for (let i = 0; i < stats.length; i++) {
      const y = startY + i * 32;
      ctx.fillStyle = '#666';
      ctx.textAlign = 'right';
      ctx.fillText(stats[i].label, CANVAS_W / 2 - 16, y);
      ctx.fillStyle = '#ddd';
      ctx.textAlign = 'left';
      ctx.fillText(stats[i].value, CANVAS_W / 2 + 16, y);
    }
  }

  // Return prompt
  if (animTimer > 0.5) {
    const pulse = 0.5 + Math.sin(animTimer * 3) * 0.3;
    ctx.globalAlpha = pulse + 0.2;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a959';
    ctx.fillText('Click or press ENTER to continue', CANVAS_W / 2, CANVAS_H - 60);
    ctx.globalAlpha = 1;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function exit(_state: GameState) {}
