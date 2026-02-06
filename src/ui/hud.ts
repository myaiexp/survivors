/**
 * HUD
 * In-game heads-up display: HP bar, XP bar, timer, level, kill count.
 */

import { PlayerState, CANVAS_W, CANVAS_H, RUN_DURATION } from '../core/types';
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_DANGER,
  TEXT_HP_HIGH, TEXT_HP_MED, TEXT_HP_LOW,
  HP_HIGH, HP_MED, HP_LOW,
  TEXT_STYLES, setTextStyle
} from './typography';

export function drawHud(ctx: CanvasRenderingContext2D, player: PlayerState, runTime: number) {
  ctx.save();

  // ── HP Bar (top-left) ──
  const hpBarX = 16;
  const hpBarY = 16;
  const hpBarW = 200;
  const hpBarH = 16;
  const hpPct = player.hp / player.maxHp;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);

  // HP fill with improved colors
  const hpColor = hpPct > 0.5 ? HP_HIGH : hpPct > 0.25 ? HP_MED : HP_LOW;
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);

  // Text with contrasting color based on HP level (FIXES white-on-lime-green!)
  const hpTextColor = hpPct > 0.5 ? TEXT_HP_HIGH : hpPct > 0.25 ? TEXT_HP_MED : TEXT_HP_LOW;
  const hpStyle = { ...TEXT_STYLES.bodySmall, color: hpTextColor, align: 'center' as CanvasTextAlign, baseline: 'middle' as CanvasTextBaseline };
  setTextStyle(ctx, hpStyle);
  ctx.fillText(
    `${Math.ceil(player.hp)} / ${player.maxHp}`,
    hpBarX + hpBarW / 2, hpBarY + hpBarH / 2
  );

  // ── XP Bar (top, full width) ──
  const xpBarY = 0;
  const xpBarH = 6;
  const xpPct = player.xp / player.xpToNext;
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(0, xpBarY, CANVAS_W, xpBarH);
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(0, xpBarY, CANVAS_W * xpPct, xpBarH);

  // ── Level (top-left, below HP) ──
  const levelStyle = { ...TEXT_STYLES.bodySmall, size: 13, color: TEXT_SECONDARY, align: 'left' as CanvasTextAlign, baseline: 'top' as CanvasTextBaseline };
  setTextStyle(ctx, levelStyle);
  ctx.fillText(`Lv ${player.level}`, hpBarX, hpBarY + hpBarH + 6);

  // ── Kill Count ──
  ctx.fillText(`Kills: ${player.kills}`, hpBarX, hpBarY + hpBarH + 24);

  // ── Timer (top-right) ──
  const remaining = Math.max(0, RUN_DURATION - runTime);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  // Use danger color when low, otherwise primary
  const timerStyle = { ...TEXT_STYLES.timer, color: remaining < 30 ? TEXT_DANGER : TEXT_PRIMARY, align: 'right' as CanvasTextAlign, baseline: 'top' as CanvasTextBaseline };
  setTextStyle(ctx, timerStyle);
  ctx.fillText(timeStr, CANVAS_W - 16, 12);

  // ── Weapon icons (bottom-left) ──
  const weaponStyle = { ...TEXT_STYLES.bodySmall, color: TEXT_TERTIARY, align: 'left' as CanvasTextAlign, baseline: 'bottom' as CanvasTextBaseline };
  setTextStyle(ctx, weaponStyle);
  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    ctx.fillText(`[${w.defId} Lv${w.level}]`, 16, CANVAS_H - 16 - i * 18);
  }

  ctx.restore();
}
