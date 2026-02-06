/**
 * TYPOGRAPHY
 * Centralized typography system with fonts, colors, and text rendering helpers.
 * Provides consistent, readable text styling across all UI elements.
 */

// ── Font Definitions ──────────────────────────────────────────────────

export const FONT_DISPLAY = "'Georgia', 'Palatino Linotype', serif";
export const FONT_BODY = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

// ── Color Palette ─────────────────────────────────────────────────────

// Primary text colors
export const TEXT_PRIMARY = '#e8e6e3';      // Warm off-white (replaces harsh #fff)
export const TEXT_SECONDARY = '#b8b5b0';    // Medium warm gray
export const TEXT_TERTIARY = '#8a8580';     // Light gray (hints, secondary info)
export const TEXT_DISABLED = '#5a5855';     // Very dim (inactive)

// Accent colors
export const TEXT_GOLD = '#d4af37';         // Rich gold (titles, important)
export const TEXT_GOLD_BRIGHT = '#f4d03f';  // Bright gold (special highlights)
export const TEXT_DANGER = '#dc4545';       // Softer red (still urgent)
export const TEXT_SUCCESS = '#5fb85f';      // Softer green (positive)
export const TEXT_INFO = '#5ba3d0';         // Softer blue (XP, info)

// HP bar text (contrasts with bar background)
export const TEXT_HP_HIGH = '#2d2d2d';      // Dark text for bright green bar
export const TEXT_HP_MED = '#2d2d2d';       // Dark text for yellow bar
export const TEXT_HP_LOW = '#ffffff';       // White text for dark red bar

// HP bar background colors (adjusted for better contrast)
export const HP_HIGH = '#52c752';           // Slightly darker green
export const HP_MED = '#e5a835';            // Adjusted yellow-orange
export const HP_LOW = '#dc4545';            // Adjusted red

// ── TextStyle Interface ───────────────────────────────────────────────

export interface TextStyle {
  font: string;                             // Font family
  size: number;                             // Font size in px
  weight: 'normal' | 'bold';                // Font weight
  color: string;                            // Fill color
  shadowColor?: string;                     // Shadow color (optional)
  shadowOffsetX?: number;                   // Shadow offset X
  shadowOffsetY?: number;                   // Shadow offset Y
  align?: CanvasTextAlign;                  // Text alignment
  baseline?: CanvasTextBaseline;            // Text baseline
}

// ── Predefined Text Styles ────────────────────────────────────────────

export const TEXT_STYLES: Record<string, TextStyle> = {
  // Large titles (menus, overlays)
  titleLarge: {
    font: FONT_DISPLAY,
    size: 40,
    weight: 'bold',
    color: TEXT_GOLD,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffsetX: 2,
    shadowOffsetY: 2,
  },

  // Medium titles (level-up, pause)
  titleMedium: {
    font: FONT_DISPLAY,
    size: 28,
    weight: 'bold',
    color: TEXT_GOLD_BRIGHT,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffsetX: 2,
    shadowOffsetY: 2,
  },

  // Large headers (buttons, important labels)
  headerLarge: {
    font: FONT_BODY,
    size: 18,
    weight: 'bold',
    color: TEXT_PRIMARY,
  },

  // Medium headers (card titles)
  headerMedium: {
    font: FONT_BODY,
    size: 16,
    weight: 'bold',
    color: TEXT_PRIMARY,
  },

  // Small headers (section titles)
  headerSmall: {
    font: FONT_BODY,
    size: 14,
    weight: 'bold',
    color: TEXT_GOLD,
  },

  // Large body text (main descriptions)
  bodyLarge: {
    font: FONT_BODY,
    size: 14,
    weight: 'normal',
    color: TEXT_SECONDARY,
  },

  // Medium body text (standard UI text)
  bodyMedium: {
    font: FONT_BODY,
    size: 12,
    weight: 'normal',
    color: TEXT_SECONDARY,
  },

  // Small body text (HUD, compact info)
  bodySmall: {
    font: FONT_BODY,
    size: 11,
    weight: 'bold',
    color: TEXT_PRIMARY,
  },

  // Tiny text (hints, footnotes)
  bodyTiny: {
    font: FONT_BODY,
    size: 10,
    weight: 'normal',
    color: TEXT_TERTIARY,
  },

  // Timer (large, readable)
  timer: {
    font: FONT_BODY,
    size: 20,
    weight: 'bold',
    color: TEXT_PRIMARY,
  },
};

// ── Helper Functions ──────────────────────────────────────────────────

/**
 * Apply a TextStyle to a canvas context
 */
export function setTextStyle(ctx: CanvasRenderingContext2D, style: TextStyle): void {
  ctx.font = `${style.weight} ${style.size}px ${style.font}`;
  ctx.fillStyle = style.color;
  if (style.align !== undefined) ctx.textAlign = style.align;
  if (style.baseline !== undefined) ctx.textBaseline = style.baseline;
}

/**
 * Draw text with the specified style
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle
): void {
  setTextStyle(ctx, style);
  ctx.fillText(text, x, y);
}

/**
 * Draw text with a drop shadow for better visibility and depth
 */
export function drawShadowedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle
): void {
  setTextStyle(ctx, style);

  // Shadow layer
  if (style.shadowColor) {
    ctx.fillStyle = style.shadowColor;
    const offsetX = style.shadowOffsetX ?? 0;
    const offsetY = style.shadowOffsetY ?? 0;
    ctx.fillText(text, x + offsetX, y + offsetY);
  }

  // Main text layer
  ctx.fillStyle = style.color;
  ctx.fillText(text, x, y);
}

/**
 * Measure text width with the specified style
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle
): number {
  setTextStyle(ctx, style);
  return ctx.measureText(text).width;
}
