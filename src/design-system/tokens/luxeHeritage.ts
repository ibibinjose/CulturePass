/**
 * Luxe Heritage 2026 — CulturePass Design System 2.0
 * ==================================================
 *
 * The elevated visual language for CulturePass.
 * "Belong anywhere. Feel at home everywhere."
 *
 * This is the single source of truth for the 2026 visual rebuild.
 * All new components and refactored surfaces must use these tokens.
 *
 * Philosophy:
 * - Retain the warm cultural soul (terracotta + saffron signature).
 * - Make dark mode truly premium OLED with true black + layered depth.
 * - Add refined luxe secondary accents for sophistication.
 * - Typography pairing: Poppins (UI excellence) + premium display voice for heroes/branding.
 * - 4/8-point precision grid, cinematic layering, expressive motion.
 *
 * Usage:
 *   import { LuxeColors, LuxeTypography, LuxeSpacing, LuxeGradients } from '@/design-system/tokens/luxeHeritage';
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Core Luxe Color Palette (2026)
// ---------------------------------------------------------------------------

/** Primary cultural action — warm, human, trusted */
export const TERRACOTTA_GLOW = '#E36A4E';

/** Secondary warmth — festivals, highlights, energy */
export const DEEP_SAFFRON = '#F5A623';

/** Cultural depth — stories, links, map accents */
export const RICH_INDIGO = '#4A5EBF';

/** Trust & belonging — venues, community, global harmony */
export const EMERALD_HARMONY = '#0A8C7F';

/** Prestige marker — badges, membership, high moments (never body text) */
export const HERITAGE_GOLD = '#D4A017';

// --- New Luxe Secondary Accents (Premium Layering) ---

/** Deep plum — sophisticated hero anchors, overlays, cultural gravitas */
export const DEEP_PLUM = '#2E0052';

/** Warm bronze — subtle cultural depth, heritage moments */
export const WARM_BRONZE = '#8B5E3C';

/** Soft sage — calm balance, nature, secondary surfaces */
export const SOFT_SAGE = '#6B7F6B';

/** Electric ochre — high-priority moments only (sparingly) */
export const ELECTRIC_OCHRE = '#FCD400';

// ---------------------------------------------------------------------------
// Functional / Status Colors (Accessible)
// ---------------------------------------------------------------------------

export const SUCCESS = '#10B981';
export const WARNING = HERITAGE_GOLD;
export const ERROR = '#BA1A1A';
export const INFO = RICH_INDIGO;

// ---------------------------------------------------------------------------
// Luxe Dark Theme — True Premium "Night Festival" OLED
// ---------------------------------------------------------------------------

export const luxeDark = {
  // Core surfaces — true black for power + contrast
  background: '#000000',
  backgroundSecondary: '#0A0A0C',
  surface: '#0F0F11',
  surfaceElevated: '#1A1A1D',
  surfaceSecondary: '#161618',
  surfaceVariant: '#1E1E20',

  // Text
  text: '#FAF9F6',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textInverse: '#1C1917',
  textOnBrandGradient: '#FFFFFF',

  // Brand (elevated saturation for dark)
  primary: TERRACOTTA_GLOW,
  primaryContainer: '#3D1F1A',
  onPrimaryContainer: '#FFEDE8',

  secondary: DEEP_SAFFRON,
  secondaryContainer: '#3D2A0F',
  onSecondaryContainer: '#FFF4D9',

  accent: RICH_INDIGO,
  accentContainer: '#1F1A3D',
  onAccentContainer: '#E8E0FF',

  // Cultural accents
  emerald: EMERALD_HARMONY,
  gold: HERITAGE_GOLD,
  plum: DEEP_PLUM,
  bronze: WARM_BRONZE,
  sage: SOFT_SAGE,

  // Borders & dividers (subtle)
  border: '#27272A',
  borderLight: '#3F3F46',
  divider: '#18181B',

  // Status
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,

  // Glass (signature layered glassmorphism)
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.12)',

  // Tab bar / chrome
  tabBar: 'rgba(0,0,0,0.94)',
  tabBarBorder: 'rgba(39,39,42,0.6)',
  tabIconDefault: '#71717A',
  tabIconSelected: TERRACOTTA_GLOW,
} as const;

// ---------------------------------------------------------------------------
// Luxe Light Theme (Warm, Elegant, Secondary but Beautiful)
// ---------------------------------------------------------------------------

export const luxeLight = {
  background: '#FAF9F6',
  backgroundSecondary: '#F5F1EE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSecondary: '#F5F1EE',
  surfaceVariant: '#F0EBE8',

  text: '#1C1917',
  textSecondary: '#44403C',
  textTertiary: '#71717A',
  textInverse: '#FFFFFF',
  textOnBrandGradient: '#FFFFFF',

  primary: TERRACOTTA_GLOW,
  primaryContainer: '#FFEDE8',
  onPrimaryContainer: '#3D1F1A',

  secondary: DEEP_SAFFRON,
  secondaryContainer: '#FFF4D9',
  onSecondaryContainer: '#3D2A0F',

  accent: RICH_INDIGO,
  accentContainer: '#E8E0FF',
  onAccentContainer: '#1F1A3D',

  emerald: EMERALD_HARMONY,
  gold: HERITAGE_GOLD,
  plum: DEEP_PLUM,
  bronze: WARM_BRONZE,
  sage: SOFT_SAGE,

  border: '#D6D3D1',
  borderLight: '#E7E5E4',
  divider: '#F5F5F4',

  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,

  glass: 'rgba(255,255,255,0.72)',
  glassStrong: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(255,255,255,0.35)',

  tabBar: 'rgba(255,255,255,0.94)',
  tabBarBorder: 'rgba(231,229,228,0.5)',
  tabIconDefault: '#71717A',
  tabIconSelected: TERRACOTTA_GLOW,
} as const;

// ---------------------------------------------------------------------------
// Luxe Gradients (Cinematic + Cultural)
// ---------------------------------------------------------------------------

export const luxeGradients = {
  /** Signature — max ONE per screen (hero, onboarding, flagship CTA) */
  culturepassBrand: [TERRACOTTA_GLOW, DEEP_SAFFRON] as [string, string],

  /** Premium plum + ochre — sophisticated hero moments */
  plumOchre: [DEEP_PLUM, ELECTRIC_OCHRE] as [string, string],

  /** Warm heritage depth */
  terracottaBronze: [TERRACOTTA_GLOW, WARM_BRONZE] as [string, string],

  /** Trust & growth */
  emeraldIndigo: [EMERALD_HARMONY, RICH_INDIGO] as [string, string],

  /** Prestige gold */
  goldSaffron: [HERITAGE_GOLD, DEEP_SAFFRON] as [string, string],

  /** Cinematic hero overlay (transparent → deep) */
  heroOverlay: ['transparent', 'rgba(0,0,0,0.82)'] as [string, string],

  /** Subtle cultural blend for cards / sections */
  culturalBlend: [TERRACOTTA_GLOW, DEEP_SAFFRON, HERITAGE_GOLD] as [string, string, string],

  /** Success / positive */
  success: [SUCCESS, '#059669'] as [string, string],
} as const;

// ---------------------------------------------------------------------------
// Typography — Poppins (UI) + Premium Display Pairing
// ---------------------------------------------------------------------------

/**
 * Font loading is handled in src/app/_layout.tsx.
 * We define the families here for consistency.
 */
export const LuxeFontFamily = {
  // UI Voice — excellent modern, warm, readable
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',

  // Premium Display Voice (for heroes, branding, onboarding, marketing)
  // Loaded as "PlayfairDisplay_400Regular" / "PlayfairDisplay_700Bold" etc.
  // Fallback to Poppins bold if not loaded yet.
  display: 'PlayfairDisplay_700Bold',
  displayRegular: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
} as const;

/**
 * Refined type scale (4-point grid aligned, editorial feel)
 */
export const LuxeFontSize = {
  micro: 11,
  caption: 12,
  chip: 13,
  body2: 14,
  callout: 15,
  body: 16,
  title3: 18,
  title2: 20,
  title: 24,
  hero: 28,
  display: 32,
  displayHero: 40, // large marketing / onboarding
} as const;

export const LuxeLineHeight = {
  micro: 16,
  caption: 16,
  chip: 20,
  body2: 20,
  callout: 22,
  body: 24,
  title3: 28,
  title2: 28,
  title: 32,
  hero: 36,
  display: 40,
  displayHero: 48,
} as const;

export const LuxeLetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.8,
  cap: 1.2,
} as const;

// Composed text styles (ready for StyleSheet or inline)
const weight = (w: '400' | '500' | '600' | '700' | '800') =>
  Platform.select({ ios: w, android: 'normal', web: w }) as any;

export const LuxeTextStyles = {
  // Display / Hero (new premium voice)
  displayHero: {
    fontFamily: LuxeFontFamily.display,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.displayHero,
    lineHeight: LuxeLineHeight.displayHero,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  display: {
    fontFamily: LuxeFontFamily.display,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.display,
    lineHeight: LuxeLineHeight.display,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  hero: {
    fontFamily: LuxeFontFamily.display,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.hero,
    lineHeight: LuxeLineHeight.hero,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Screen & section titles (Poppins bold)
  title: {
    fontFamily: LuxeFontFamily.bold,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.title,
    lineHeight: LuxeLineHeight.title,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  title2: {
    fontFamily: LuxeFontFamily.bold,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.title2,
    lineHeight: LuxeLineHeight.title2,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  title3: {
    fontFamily: LuxeFontFamily.semibold,
    fontWeight: weight('600'),
    fontSize: LuxeFontSize.title3,
    lineHeight: LuxeLineHeight.title3,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Body & UI
  body: {
    fontFamily: LuxeFontFamily.regular,
    fontWeight: weight('400'),
    fontSize: LuxeFontSize.body,
    lineHeight: LuxeLineHeight.body,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  bodyMedium: {
    fontFamily: LuxeFontFamily.medium,
    fontWeight: weight('500'),
    fontSize: LuxeFontSize.body,
    lineHeight: LuxeLineHeight.body,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  callout: {
    fontFamily: LuxeFontFamily.regular,
    fontWeight: weight('400'),
    fontSize: LuxeFontSize.callout,
    lineHeight: LuxeLineHeight.callout,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Event cards (never gold for dates)
  eventCardTitle: {
    fontFamily: LuxeFontFamily.bold,
    fontWeight: weight('700'),
    fontSize: LuxeFontSize.body2,
    lineHeight: LuxeLineHeight.callout,
    letterSpacing: LuxeLetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  eventCardDate: {
    fontFamily: LuxeFontFamily.semibold,
    fontWeight: weight('600'),
    fontSize: LuxeFontSize.chip,
    lineHeight: LuxeLineHeight.chip,
    letterSpacing: 0.15,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Chips, badges, micro
  chip: {
    fontFamily: LuxeFontFamily.medium,
    fontWeight: weight('500'),
    fontSize: LuxeFontSize.chip,
    lineHeight: LuxeLineHeight.chip,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  badge: {
    fontFamily: LuxeFontFamily.semibold,
    fontWeight: weight('600'),
    fontSize: LuxeFontSize.micro,
    lineHeight: LuxeLineHeight.micro,
    letterSpacing: LuxeLetterSpacing.wide,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  badgeCaps: {
    fontFamily: LuxeFontFamily.semibold,
    fontWeight: weight('600'),
    fontSize: LuxeFontSize.micro,
    lineHeight: LuxeLineHeight.micro,
    letterSpacing: LuxeLetterSpacing.cap,
    textTransform: 'uppercase' as const,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Navigation
  tabLabel: {
    fontFamily: LuxeFontFamily.semibold,
    fontWeight: weight('600'),
    fontSize: 10,
    lineHeight: 12,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
} as const;

// ---------------------------------------------------------------------------
// Luxe Spacing, Radius, Elevation (4/8-point precision)
// ---------------------------------------------------------------------------

export const LuxeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const LuxeRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const LuxeElevation = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16,
} as const;

// ---------------------------------------------------------------------------
// Motion — Expressive Springs (Reanimated)
// ---------------------------------------------------------------------------

export const LuxeSpring = {
  snappy: { damping: 20, stiffness: 300 },
  smooth: { damping: 18, stiffness: 180 },
  gentle: { damping: 25, stiffness: 120 },
  bouncy: { damping: 14, stiffness: 220, mass: 0.8 },
} as const;

export const LuxeDuration = {
  instant: 80,
  fast: 140,
  normal: 220,
  slow: 320,
  verySlow: 480,
} as const;

// ---------------------------------------------------------------------------
// Container System (Responsive + Safe-Area Aware)
// ---------------------------------------------------------------------------

export const LuxeContainers = {
  maxContentWidth: 1280,
  tabletMaxWidth: 768,
  mobileWebShell: 480,
  sidebarWidth: 240,
  sidebarRailWidth: 64,
  sectionGap: LuxeSpacing.xl,
  cardGap: LuxeSpacing.md,
} as const;

// ---------------------------------------------------------------------------
// Glass Recipes (Signature Layered Glassmorphism)
// ---------------------------------------------------------------------------

export const LuxeGlass = {
  light: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(255,255,255,0.35)',
    blur: 18,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    blur: 24,
  },
  ultraLight: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(255,255,255,0.5)',
    blur: 14,
  },
  ultraDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    blur: 32,
  },
} as const;

// ---------------------------------------------------------------------------
// Convenience Export
// ---------------------------------------------------------------------------

export const Luxe = {
  colors: {
    dark: luxeDark,
    light: luxeLight,
    terracotta: TERRACOTTA_GLOW,
    saffron: DEEP_SAFFRON,
    indigo: RICH_INDIGO,
    emerald: EMERALD_HARMONY,
    gold: HERITAGE_GOLD,
    plum: DEEP_PLUM,
    bronze: WARM_BRONZE,
    sage: SOFT_SAGE,
    ochre: ELECTRIC_OCHRE,
  },
  typography: {
    fonts: LuxeFontFamily,
    sizes: LuxeFontSize,
    lineHeights: LuxeLineHeight,
    letterSpacing: LuxeLetterSpacing,
    styles: LuxeTextStyles,
  },
  spacing: LuxeSpacing,
  radius: LuxeRadius,
  elevation: LuxeElevation,
  spring: LuxeSpring,
  duration: LuxeDuration,
  containers: LuxeContainers,
  glass: LuxeGlass,
  gradients: luxeGradients,
} as const;

export default Luxe;
