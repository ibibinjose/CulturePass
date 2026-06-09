import { BorderTokens } from './theme';

/** CultureMarket homepage hero, sell banner, and FAQ palette (FIXES-001 P16). */
export const CULTURE_MARKET_HOME = {
  heroBg: '#0F0B1A',
  heroGradient: ['#0F0B1A', '#1C162E', '#0A0812'] as const,
  inkOnDark: BorderTokens.white,
  sellBannerGradientEnd: '#130C2A',
  sellCtaGradientEnd: '#CC237F',
  faqFooterBg: '#1A1624',
  brandTileFallbackBg: BorderTokens.white,
} as const;