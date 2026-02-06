/**
 * HUD
 * In-game heads-up display: HP bar, XP bar, timer, level, kill count.
 */

import { PlayerState, CANVAS_W, CANVAS_H, RUN_DURATION } from '../core/types';

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
  // HP fill
  const hpColor = hpPct > 0.5 ? '#44aa44' : hpPct > 0.25 ? '#cc8800' : '#cc2222';
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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
  ctx.fillStyle = '#ddd';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Lv ${player.level}`, hpBarX, hpBarY + hpBarH + 6);

  // ── Kill Count ──
  ctx.fillText(`Kills: ${player.kills}`, hpBarX, hpBarY + hpBarH + 24);

  // ── Timer (top-right) ──
  const remaining = Math.max(0, RUN_DURATION - runTime);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  // Pulse red when low
  ctx.fillStyle = remaining < 30 ? '#ff4444' : '#ddd';
  ctx.fillText(timeStr, CANVAS_W - 16, 12);

  // ── Weapon icons (bottom-left) ──
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#aaa';
  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    ctx.fillText(`[${w.defId} Lv${w.level}]`, 16, CANVAS_H - 16 - i * 18);
  }

  ctx.restore();
}
