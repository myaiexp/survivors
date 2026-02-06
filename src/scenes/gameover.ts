/**
 * GAME OVER SCENE
 * Shows victory/defeat, run stats, and option to return to menu.
 */

import { GameState, CANVAS_W, CANVAS_H } from '../core/types';
import { input } from '../core/input';
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_GOLD,
  TEXT_STYLES, drawShadowedText, setTextStyle
} from '../ui/typography';

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

  // Result title with shadow
  const titleColor = victory ? '#ffd700' : '#cc2222';
  const titleStyle = { ...TEXT_STYLES.titleLarge, color: titleColor, align: 'center' as CanvasTextAlign, baseline: 'middle' as CanvasTextBaseline };
  drawShadowedText(ctx, victory ? 'VICTORY' : 'DEFEAT', CANVAS_W / 2, 100, titleStyle);

  // Subtitle
  const subtitleStyle = { ...TEXT_STYLES.headerMedium, color: TEXT_TERTIARY, align: 'center' as CanvasTextAlign, baseline: 'middle' as CanvasTextBaseline };
  setTextStyle(ctx, subtitleStyle);
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
    const labelStyle = { ...TEXT_STYLES.bodyLarge, color: TEXT_SECONDARY, align: 'right' as CanvasTextAlign };
    const valueStyle = { ...TEXT_STYLES.bodyLarge, color: TEXT_PRIMARY, align: 'left' as CanvasTextAlign };

    for (let i = 0; i < stats.length; i++) {
      const y = startY + i * 32;
      setTextStyle(ctx, labelStyle);
      ctx.fillText(stats[i].label, CANVAS_W / 2 - 16, y);
      setTextStyle(ctx, valueStyle);
      ctx.fillText(stats[i].value, CANVAS_W / 2 + 16, y);
    }
  }

  // Return prompt
  if (animTimer > 0.5) {
    const pulse = 0.5 + Math.sin(animTimer * 3) * 0.3;
    ctx.globalAlpha = pulse + 0.2;
    const promptStyle = { ...TEXT_STYLES.headerMedium, color: TEXT_GOLD, align: 'center' as CanvasTextAlign };
    setTextStyle(ctx, promptStyle);
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
