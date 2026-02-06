/**
 * MATH UTILITIES
 * Common math/vector helpers used throughout the game.
 */

import { Vec2 } from '../core/types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dist(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function fromAngle(rad: number): Vec2 {
  return { x: Math.cos(rad), y: Math.sin(rad) };
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

export function randVec(): Vec2 {
  const a = Math.random() * Math.PI * 2;
  return fromAngle(a);
}

/** Pick a random element from an array */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Weighted random selection */
export function weightedPick<T extends { weight?: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + (i.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight ?? 1;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

/** Check if two circles overlap */
export function circlesOverlap(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const combined = ar + br;
  return dx * dx + dy * dy < combined * combined;
}
