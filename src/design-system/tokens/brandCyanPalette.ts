/**
 * CulturePass cyan + jet black brand palette (2026).
 *
 * Replaces deprecated yellow, saffron, and gold accents across the app.
 * DO NOT reintroduce: #F5A623, #D4A017, #FFC857, #E5A93B, #FFD54F, #FFB300, etc.
 */

/** rgb(0, 173, 239) — primary accent (formerly gold) */
export const BRAND_CYAN = '#00ADEF' as const;

/** rgb(0, 167, 239) — secondary accent (formerly saffron) */
export const BRAND_CYAN_DEEP = '#00A7EF' as const;

/** Lighter cyan highlight for gradients and badges */
export const BRAND_CYAN_LIGHT = '#4DD4FF' as const;

/** Jet black — premium ink and dark chrome */
export const JET_BLACK = '#000000' as const;

/** Soft jet — text/ink on bright cyan surfaces */
export const JET_BLACK_SOFT = '#0A0A0A' as const;

export const BRAND_CYAN_RGB = '0, 173, 239' as const;
export const BRAND_CYAN_DEEP_RGB = '0, 167, 239' as const;

export function cyanAlpha(alpha: number): string {
  return `rgba(${BRAND_CYAN_RGB}, ${alpha})`;
}

export function cyanDeepAlpha(alpha: number): string {
  return `rgba(${BRAND_CYAN_DEEP_RGB}, ${alpha})`;
}

/** @deprecated Legacy alias — maps to BRAND_CYAN. Do not use for new code. */
export const LEGACY_GOLD_ALIAS = BRAND_CYAN;

/** @deprecated Legacy alias — maps to BRAND_CYAN_DEEP. Do not use for new code. */
export const LEGACY_SAFFRON_ALIAS = BRAND_CYAN_DEEP;