/**
 * LEVEL-UP SCENE
 * Overlay that pauses gameplay and presents upgrade choices.
 */

import { GameState, CANVAS_W, CANVAS_H, UpgradeDef } from '../core/types';
import { input } from '../core/input';
import { applyUpgrade, draw as drawGameplay } from './gameplay';

let animTimer = 0;

export function enter(_state: GameState) {
  animTimer = 0;
}

export function update(state: GameState, dt: number) {
  animTimer += dt;

  if (input.consumeClick()) {
    const mouse = input.getMouseScreen();
    const upgrades = state.pendingUpgrades;
    const cardW = 200;
    const cardH = 240;
    const gap = 20;
    const totalW = upgrades.length * cardW + (upgrades.length - 1) * gap;
    const startX = (CANVAS_W - totalW) / 2;
    const cardY = CANVAS_H / 2 - cardH / 2;

    for (let i = 0; i < upgrades.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (
        mouse.x >= cx && mouse.x <= cx + cardW &&
        mouse.y >= cardY && mouse.y <= cardY + cardH
      ) {
        applyUpgrade(state, upgrades[i].id);
        return;
      }
    }
  }

  // Keyboard shortcuts 1-3
  for (let i = 0; i < state.pendingUpgrades.length; i++) {
    if (input.isKeyDown((i + 1).toString())) {
      applyUpgrade(state, state.pendingUpgrades[i].id);
      return;
    }
  }
}

export function draw(state: GameState, ctx: CanvasRenderingContext2D) {
  // Draw gameplay underneath (frozen)
  drawGameplay(state, ctx);

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('LEVEL UP!', CANVAS_W / 2, 70);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Level ${state.player!.level} \u2022 Choose an upgrade`, CANVAS_W / 2, 100);

  // Upgrade cards
  const upgrades = state.pendingUpgrades;
  const cardW = 200;
  const cardH = 240;
  const gap = 20;
  const totalW = upgrades.length * cardW + (upgrades.length - 1) * gap;
  const startX = (CANVAS_W - totalW) / 2;
  const cardY = CANVAS_H / 2 - cardH / 2;

  const mouse = input.getMouseScreen();

  for (let i = 0; i < upgrades.length; i++) {
    const u = upgrades[i];
    const cx = startX + i * (cardW + gap);
    const hovered =
      mouse.x >= cx && mouse.x <= cx + cardW &&
      mouse.y >= cardY && mouse.y <= cardY + cardH;

    // Card bg
    ctx.fillStyle = hovered ? '#1e2a3a' : '#141c26';
    ctx.fillRect(cx, cardY, cardW, cardH);

    // Border
    ctx.strokeStyle = hovered ? '#c9a959' : '#333';
    ctx.lineWidth = hovered ? 2 : 1;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Number key hint
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${i + 1}]`, cx + 8, cardY + 20);

    // Icon
    ctx.textAlign = 'center';
    ctx.font = '36px monospace';
    ctx.fillStyle = '#c9a959';
    ctx.fillText(u.icon, cx + cardW / 2, cardY + 60);

    // Name
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(u.name, cx + cardW / 2, cardY + 100);

    // Category tag
    ctx.font = '10px monospace';
    ctx.fillStyle = u.category === 'stat' ? '#4a9' : u.category === 'weapon' ? '#f80' : '#a4f';
    ctx.fillText(u.category.toUpperCase(), cx + cardW / 2, cardY + 120);

    // Description
    ctx.font = '12px monospace';
    ctx.fillStyle = '#aaa';
    const words = u.description.split(' ');
    let line = '';
    let ly = cardY + 150;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > cardW - 24) {
        ctx.fillText(line, cx + cardW / 2, ly);
        line = word;
        ly += 16;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx + cardW / 2, ly);
  }
}

export function exit(_state: GameState) {}
