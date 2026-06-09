import { luxeGradients } from './luxeHeritage';
import { BorderTokens } from './theme';

/** Shared overlay palette for CultureShop / marketplace 1:1 tiles (FIXES-001 P4). */
export const MARKETPLACE_TILE_OVERLAY = {
  border: 'rgba(255,255,255,0.06)',
  gradientBottom: luxeGradients.heroOverlay,
  gradientBottomStrong: ['transparent', 'rgba(0,0,0,0.88)'] as const,
  titleText: BorderTokens.white,
  subtitleText: 'rgba(255,255,255,0.82)',
  lockIcon: BorderTokens.white,
  lockChipBorder: 'rgba(255,255,255,0.18)',
  lockChipBg: 'rgba(0,0,0,0.55)',
  lockChipOverlayBg: 'rgba(0,0,0,0.45)',
  plusPillBorder: 'rgba(0, 173, 239, 0.55)',
  plusPillBg: 'rgba(0,0,0,0.5)',
} as const;