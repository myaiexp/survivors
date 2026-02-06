/**
 * MENU SCENE
 * Character selection and game start.
 */

import { GameState, Scene, CANVAS_W, CANVAS_H } from '../core/types';
import { input } from '../core/input';
import { getUnlockedCharacters, characterDefs } from '../content/characters/index';
import { getWeaponDef } from '../content/weapons/index';
import { setCharacter } from './gameplay';

let selectedIndex = 0;
let startFlash = 0;

export function enter(_state: GameState) {
  selectedIndex = 0;
  startFlash = 0;
}

export function update(state: GameState, dt: number) {
  startFlash += dt;
  const chars = getUnlockedCharacters();

  // Character selection with A/D or arrows
  if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) {
    // debounce handled by scene transition
  }
  if (input.isKeyDown('d') || input.isKeyDown('arrowright')) {
    // debounce handled by scene transition
  }

  // Click-based selection
  if (input.consumeClick()) {
    const mouse = input.getMouseScreen();
    // Check if clicking a character card
    const cardW = 160;
    const cardH = 180;
    const gap = 24;
    const totalW = chars.length * cardW + (chars.length - 1) * gap;
    const startX = (CANVAS_W - totalW) / 2;
    const cardY = CANVAS_H / 2 - 40;

    for (let i = 0; i < chars.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (
        mouse.x >= cx && mouse.x <= cx + cardW &&
        mouse.y >= cardY && mouse.y <= cardY + cardH
      ) {
        if (selectedIndex === i) {
          // Double-click starts game
          setCharacter(chars[selectedIndex].id);
          state.scene = 'gameplay';
          return;
        }
        selectedIndex = i;
      }
    }

    // Check start button
    const btnW = 200;
    const btnH = 48;
    const btnX = CANVAS_W / 2 - btnW / 2;
    const btnY = CANVAS_H - 90;
    if (
      mouse.x >= btnX && mouse.x <= btnX + btnW &&
      mouse.y >= btnY && mouse.y <= btnY + btnH
    ) {
      setCharacter(chars[selectedIndex].id);
      state.scene = 'gameplay';
      return;
    }
  }

  // Enter to start
  if (input.isKeyDown('enter') || input.isKeyDown(' ')) {
    setCharacter(chars[selectedIndex].id);
    state.scene = 'gameplay';
  }
}

export function draw(_state: GameState, ctx: CanvasRenderingContext2D) {
  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#c9a959';
  ctx.fillText('SURVIVORS ROGUELITE', CANVAS_W / 2, 60);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('Choose your champion', CANVAS_W / 2, 100);

  // Character cards
  const chars = getUnlockedCharacters();
  const cardW = 160;
  const cardH = 180;
  const gap = 24;
  const totalW = chars.length * cardW + (chars.length - 1) * gap;
  const startX = (CANVAS_W - totalW) / 2;
  const cardY = CANVAS_H / 2 - 40;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const weapon = getWeaponDef(char.startingWeaponId);
    const cx = startX + i * (cardW + gap);
    const selected = i === selectedIndex;

    // Card background
    ctx.fillStyle = selected ? '#1c2433' : '#12161e';
    ctx.fillRect(cx, cardY, cardW, cardH);

    // Border
    ctx.strokeStyle = selected ? '#c9a959' : '#333';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Character preview (colored rectangle)
    ctx.fillStyle = char.color;
    ctx.fillRect(cx + cardW / 2 - 15, cardY + 20, 30, 42);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + cardW / 2 - 15, cardY + 20, 30, 42);

    // Name
    ctx.fillStyle = selected ? '#fff' : '#aaa';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(char.name, cx + cardW / 2, cardY + 80);

    // Description
    ctx.fillStyle = '#777';
    ctx.font = '10px monospace';
    const desc = char.description;
    // Simple word wrap
    const words = desc.split(' ');
    let line = '';
    let ly = cardY + 100;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > cardW - 16) {
        ctx.fillText(line, cx + cardW / 2, ly);
        line = word;
        ly += 14;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx + cardW / 2, ly);

    // Starting weapon
    ctx.fillStyle = '#5a8';
    ctx.font = '11px monospace';
    ctx.fillText(`Weapon: ${weapon.name}`, cx + cardW / 2, cardY + cardH - 16);
  }

  // Start button
  const btnW = 200;
  const btnH = 48;
  const btnX = CANVAS_W / 2 - btnW / 2;
  const btnY = CANVAS_H - 90;
  const pulse = 0.8 + Math.sin(startFlash * 3) * 0.2;

  ctx.fillStyle = `rgba(201, 169, 89, ${pulse * 0.15})`;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#c9a959';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle = '#c9a959';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START RUN', CANVAS_W / 2, btnY + btnH / 2);

  // Controls hint
  ctx.fillStyle = '#444';
  ctx.font = '11px monospace';
  ctx.fillText('Click to select \u2022 Click START or press ENTER', CANVAS_W / 2, CANVAS_H - 24);
}

export function exit(_state: GameState) {}
