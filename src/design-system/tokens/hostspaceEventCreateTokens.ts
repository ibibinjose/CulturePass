import { CultureTokens } from './colors';
import { BorderTokens } from './theme';

/** Muji-inspired host event create form palette (FIXES-001 P15). */
export const HOSTSPACE_MUJI_FORM = {
  bg: '#FAF8F5',
  card: '#F6F1EA',
  border: '#DED8CE',
  text: '#3C3A35',
  textMuted: '#8E877E',
  accent: '#7D7060',
  accentLight: '#EFEAE0',
  white: BorderTokens.white,
  accentDark: '#4A4135',
  requiredAccent: '#C08A7C',
} as const;

/** Sponsor tier swatches for event partner chips. */
export const HOSTSPACE_SPONSOR_TIER_COLORS = {
  platinum: '#E5E4E2',
  gold: CultureTokens.gold,
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  supporter: CultureTokens.teal,
} as const;

/** Event preview card dark surfaces. */
export const HOSTSPACE_EVENT_PREVIEW = {
  shadow: BorderTokens.black,
  cardFill: '#111111',
  imageFill: '#18181B',
  inkOnDark: BorderTokens.white,
} as const;

/** Social share mock surfaces. */
export const HOSTSPACE_SOCIAL_PREVIEW = {
  surfaceDark: '#1A1A1A',
  surfaceLight: '#F0F2F5',
} as const;

/** Legacy-form deprecation banner (shared host create surfaces, FIXES-001 P17). */
export const HOSTSPACE_LEGACY_WIZARD_BANNER = {
  bg: '#FEF3C7',
  ink: '#92400E',
  ctaInk: BorderTokens.white,
} as const;

export const HOSTSPACE_FORM_SECONDARY_HINT = '#666666' as const;