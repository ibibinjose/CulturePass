/**
 * CulturePass.App wordmark palette — canonical brand colors (2026).
 *
 * Source: `CulturePassWordmark` / WebSidebar header treatment.
 *   - "Culture" → culture red
 *   - "Pass"    → pass green
 *   - ".App"    → app blue (primary chrome, links, active nav)
 *
 * DO NOT reintroduce deprecated terracotta (#E36A4E) or saffron gold (#F5A623).
 */

/** Wordmark "Culture" */
export const BRAND_CULTURE_RED = '#f80020' as const;

/** Wordmark "Pass" */
export const BRAND_PASS_GREEN = '#00A651' as const;

/** Wordmark ".App" — UN Blue; primary brand chrome */
export const BRAND_APP_BLUE = '#009EDB' as const;

export const BRAND_CULTURE_RED_RGB = '248, 0, 32' as const;
export const BRAND_PASS_GREEN_RGB = '0, 166, 81' as const;
export const BRAND_APP_BLUE_RGB = '0, 158, 219' as const;

export function cultureRedAlpha(alpha: number): string {
  return `rgba(${BRAND_CULTURE_RED_RGB}, ${alpha})`;
}

export function passGreenAlpha(alpha: number): string {
  return `rgba(${BRAND_PASS_GREEN_RGB}, ${alpha})`;
}

export function appBlueAlpha(alpha: number): string {
  return `rgba(${BRAND_APP_BLUE_RGB}, ${alpha})`;
}

/** Official split-color wordmark defaults for UI components */
export const WORDMARK_COLORS = {
  culture: BRAND_CULTURE_RED,
  pass: BRAND_PASS_GREEN,
  suffix: BRAND_APP_BLUE,
} as const;