/** CulturePass+ upgrade screen palette — member card, promo errors (FIXES-001 P18). */

import {
  BRAND_CYAN,
  BRAND_CYAN_DEEP,
  BRAND_CYAN_LIGHT,
  JET_BLACK,
  JET_BLACK_SOFT,
  cyanAlpha,
} from './brandCyanPalette';

export const PLUS_CARD_GRADIENT = [
  BRAND_CYAN,
  BRAND_CYAN_LIGHT,
  BRAND_CYAN_DEEP,
  '#33C4F5',
  JET_BLACK_SOFT,
] as const;

export const PLUS_CARD_SHIMMER = [
  'rgba(255,255,255,0.35)',
  'rgba(255,255,255,0.08)',
  'transparent',
] as const;

export const PLUS_CARD_INK = JET_BLACK;
export const PLUS_CARD_INK_DARK = JET_BLACK_SOFT;
export const PLUS_CARD_SHADOW = JET_BLACK;
export const PLUS_CARD_CHIP_BG = cyanAlpha(0.12);
export const PLUS_CARD_CHIP_BORDER = cyanAlpha(0.25);
export const PLUS_CARD_BORDER = 'rgba(255,255,255,0.3)' as const;

export const UPGRADE_PROMO_ERROR = '#EF4444' as const;
export const UPGRADE_PROMO_ERROR_SOFT = '#EF444420' as const;