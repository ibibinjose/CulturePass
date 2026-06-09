import { BorderTokens } from './theme';

/** Connect teaser card fills — opaque for readable web rails (FIXES-001 P9). */
export const CONNECT_FEATURE_FILLS = {
  meetups: '#0078FF',
  groups: '#BD00FF',
  cultureMatch: '#00ADEF',
  matrimony: '#01FF1F',
  languageCircles: '#E3FF00',
} as const;

/** Contrast ink for luminous vs deep card fills. */
export const CONNECT_CARD_INK = {
  onLightFill: {
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    chevron: '#475569',
    badgeDot: '#0F172A',
  },
  onDarkFill: {
    primary: BorderTokens.white,
    secondary: '#E2E8F0',
    tertiary: '#CBD5E1',
    chevron: '#E2E8F0',
    badgeDot: BorderTokens.white,
  },
} as const;

export const CONNECT_TEASER_SHADOW = BorderTokens.black;