import { BorderTokens } from './theme';

/** Discover home screen accents and CultureWheel promo palette (FIXES-001 P14). */
export const DISCOVER_HOME = {
  categoryIndigenousAccent: '#2E7D32',
  wheelPromoGradientDark: ['#E64A19', '#880E4F', '#4A148C'] as const,
  wheelPromoGradientLight: ['#FF7043', '#EC407A', '#7E57C2'] as const,
  promoInk: BorderTokens.white,
  wheelBlueprintStroke: BorderTokens.white,
  newBadgeGradient: ['#4DD4FF', '#00ADEF'] as const,
  newBadgeInk: '#1C1917',
  mutedTextFallback: '#888888',
  shadow: BorderTokens.black,
  wheelEmojiCircleBg: 'rgba(255, 255, 255, 0.22)',
  wheelEmojiCircleBorder: 'rgba(255, 255, 255, 0.45)',
  promoDescInk: 'rgba(255, 255, 255, 0.92)',
  newBadgeBorder: 'rgba(255, 255, 255, 0.45)',
  wheelArrowOrbBg: 'rgba(255, 255, 255, 0.25)',
  wheelArrowOrbBorder: 'rgba(255, 255, 255, 0.35)',
  wheelPromoBorderDark: 'rgba(255, 255, 255, 0.15)',
  wheelPromoBorderLight: 'rgba(0, 0, 0, 0.05)',
} as const;