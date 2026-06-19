/**
 * CulturePass Design System — Master Export
 * ============================================
 *
 * Single source of truth for all design tokens.
 */

import { Platform, Dimensions } from 'react-native';
import { Radius, Spacing, Breakpoints, Layout } from './spacing';
import {
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  TextStyles,
  DesktopTextStyles,
  Typography,
  M3Typography
} from './typography';
import { Elevation, ElevationAlias } from './elevation';
import { Duration, SpringConfig, prefersReducedMotion } from './animations';
import { gradients as _gradients, CultureTokens } from './colors';
import {
  Luxe,
  LuxeTextStyles,
  luxeGradients,
  BRAND_APP,
  BRAND_CULTURE,
  BRAND_PASS,
  DEEP_SAFFRON,
  RICH_INDIGO,
  EMERALD_HARMONY,
  HERITAGE_GOLD,
  DEEP_PLUM,
} from './luxeHeritage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export {
  default as Colors,
  light as lightColors,
  dark as darkColors,
  shadows,
  glass,
  gradients,
  neon,
  CTA_VIVID_BLUE,
  CategoryColors,
  EntityTypeColors,
  OlympicsColors,
} from './colors';

export { CultureTokens };

export {
  BRAND_CYAN,
  BRAND_CYAN_DEEP,
  BRAND_CYAN_LIGHT,
  JET_BLACK,
  JET_BLACK_SOFT,
  cyanAlpha,
  cyanDeepAlpha,
} from './brandCyanPalette';

export {
  BRAND_CULTURE_RED,
  BRAND_PASS_GREEN,
  BRAND_APP_BLUE,
  WORDMARK_COLORS,
  cultureRedAlpha,
  passGreenAlpha,
  appBlueAlpha,
} from './brandWordmarkPalette';

export const SignatureGradient = _gradients.culturepassBrand;

export { darkM3, lightM3 } from './material3';
export type { M3ColorScheme } from './material3';

export { Vitrine, vitrineGhostBorder, vitrinePlumShadowSoft } from './vitrineTheme';
export type { ColorTheme, ShadowStyle } from './colors';

// --- Luxe Heritage 2026 (new elevated system) ---
export {
  Luxe,
  luxeDark,
  luxeLight,
  LuxeTextStyles,
  luxeGradients,
  BRAND_APP,
  BRAND_CULTURE,
  BRAND_PASS,
  DEEP_SAFFRON,
  RICH_INDIGO,
  EMERALD_HARMONY,
  HERITAGE_GOLD,
  DEEP_PLUM,
} from './luxeHeritage';

// Explicitly re-exporting constants
export { Spacing, Radius, Breakpoints, Layout };
export {
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  TextStyles,
  DesktopTextStyles,
  Typography,
  M3Typography
};
export { Elevation, ElevationAlias };
export { Duration, SpringConfig, prefersReducedMotion };

// ---------------------------------------------------------------------------
// Component Tokens (Strictly Typed & UX Focused)
// ---------------------------------------------------------------------------

export const ButtonTokens = {
  height: {
    sm: 40,
    md: 48,
    lg: 54,
  },
  paddingH: {
    sm: 14,
    md: 18,
    lg: 24,
  },
  radius: Radius.md,
  radiusPill: Radius.full,
  fontSize: {
    sm: 13,
    md: 14,
    lg: 15,
  },
  iconGap: 6,
  pressScale: 0.97,
} as const;

export const LayoutRules = {
  screenHorizontalPadding: Spacing.md,
  cardHorizontalPadding: Spacing.md,
  cardVerticalPadding: Spacing.md,
  sectionSpacing: Spacing.xl,
  iconTextGap: 6,
  betweenCards: Spacing.md,
  buttonHeight: 48,
  borderRadius: Radius.md,
} as const;

export const CardTokens = {
  radius: Radius.lg,
  radiusLarge: Radius.xl,
  padding: Spacing.md,
  paddingLarge: Spacing.lg,
  imageHeight: {
    mobile: 108,
    tablet: 128,
    desktop: 148,
  },
  gap: {
    mobile: 12,
    desktop: 14,
  },
  minWidth: 160,
  hoverLift: 3,
  pressScale: 0.985,
} as const;

export const CardGrammarTokens = {
  width: 236,
  imageHeight: 128,
  radius: CardTokens.radius,
  borderWidth: 1,
  contentGap: 5,
  contentPadding: 10,
  trustChipRadius: Radius.full,
} as const;

export const MotionTokens = {
  pressScale: 0.98,
  hoverScale: 1.01,
  transitionMs: 180,
  spring: SpringConfig.smooth,
} as const;

export const AccessibilityTokens = {
  minTapTarget: 40,
  minButtonHeight: ButtonTokens.height.md,
} as const;

export const InputTokens = {
  height: 44,
  heightSearch: 40,
  radius: Radius.sm,
  fontSize: 14,
  paddingH: 12,
  paddingV: 8,
  iconSize: 18,
  iconGap: 6,
} as const;

export const ChipTokens = {
  height: 34,
  paddingH: 14,
  paddingV: 6,
  radius: Radius.full,
  fontSize: 12,
  gap: 6,
} as const;

export const HeaderTokens = {
  height: Platform.select({
    ios: 40,
    android: 40,
    web: 44,
    default: 40,
  }) || 40,
  paddingVertical: 10,
  paddingHorizontal: 16,
  iconSize: 22,
  titleFontSize: 18,
  titleFontFamily: FontFamily.bold,
} as const;

export const ScreenTokens = {
  topOffset: 12,
} as const;

export const SheetTokens = {
  borderRadius: Radius.xl,
  handleHeight: 4,
  handleWidth: 40,
  handleColor: 'rgba(0,0,0,0.2)',
  minHandleHitSlop: 20,
  headerHeight: 52,
} as const;

export const AvatarTokens = {
  size: {
    xs: 22,
    sm: 30,
    md: 38,
    lg: 52,
    xl: 68,
    xxl: 88,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: Radius.full,
  badgeSize: 12,
  badgeOffset: 2,
} as const;

export const TabBarTokens = {
  heightMobile: Platform.select({
    ios: 46,
    android: 58,
    web: 52,
    default: 56,
  }) || 56,
  heightDesktop: 52,
  iconSize: 22,
  labelSize: 9,
  labelSizeDesktop: 10,
} as const;

export const SectionTokens = {
  titleFontFamily: FontFamily.bold,
  titleFontSize: 18,
  titleLineHeight: 26,
  iconSize: 20,
  verticalPadding: 6,
  mobileHorizontalPadding: Spacing.md,
  desktopHorizontalPadding: Spacing.lg,
  sectionSpacing: Spacing.xl,
} as const;

// ---------------------------------------------------------------------------
// Icon & Z-Index Scales
// ---------------------------------------------------------------------------

export const IconSize = {
  xs: 11,
  sm: 15,
  md: 19,
  lg: 22,
  xl: 28,
  xxl: 36,
} as const;

export const ZIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ---------------------------------------------------------------------------
// Border & Glass System
// ---------------------------------------------------------------------------

export const BorderTokens = {
  black: '#000000',
  white: '#FFFFFF',
  widthBold: 3,
  widthNormal: 1.5,
} as const;

export const LiquidGlassTokens = {
  blurFallback: {
    ios: 56,
    android: 36,
    webPx: 44,
  },
  web: {
    blurPx: 18,
    saturation: 140,
    supportsFallbackOpacity: 0.86,
  },
  android: {
    hairline: true,
    elevation: 1,
  },
  corner: {
    mainCard: 24,
    innerRow: 16,
    valueRibbon: 14,
  },
  parallaxFactor: 0.14,
  entranceSpring: SpringConfig.smooth,
} as const;

export const MaterialExpressive = {
  shape: {
    cornerExtraLarge: Radius.xl,
    cornerLarge: Radius.lg,
    cornerMedium: Radius.md,
    cornerSmall: Radius.sm,
    full: Radius.full,
  },
  elevation: {
    level1: 2,
    level2: 3,
    level3: 5,
    level4: 8,
    fab: 10,
  },
  heroChrome: {
    iconFill: _gradients.culturepassBrand[0],
    iconOnFill: '#FFFFFF',
  },
} as const;

export const LiquidGlassAccents = {
  eventIconWell: `rgba(10, 140, 127, 0.18)`, // emerald harmony
  communityIconWell: `rgba(0, 167, 239, 0.18)`,
  perksIconWell: `rgba(0, 173, 239, 0.2)`,
  valueRibbonFill: `rgba(0, 173, 239, 0.14)`,
  valueRibbonBorder: `#00ADEF55`,
  hostAccentBar: CultureTokens.emeraldHarmony, // emerald harmony
  errorBannerFill: 'rgba(255, 94, 91, 0.16)',
  errorBannerBorder: '#FF5E5B55', // coral with opacity
} as const;

// ---------------------------------------------------------------------------
// Cultural Accent System
// ---------------------------------------------------------------------------

export const CulturalAccents = {
  cultureRed: CultureTokens.cultureRed,
  passGreen: CultureTokens.passGreen,
  appBlue: CultureTokens.appBlue,
  deepSaffron: CultureTokens.deepSaffron,
  richIndigo: CultureTokens.richIndigo,
  emeraldHarmony: CultureTokens.emeraldHarmony,
  heritageGold: CultureTokens.heritageGold,

  appBlueSurface: `rgba(0, 158, 219, 0.05)`,
  cultureRedSurface: `rgba(248, 0, 32, 0.05)`,
  passGreenSurface: `rgba(0, 166, 81, 0.05)`,
  saffronSurface: `rgba(0, 167, 239, 0.05)`,
  indigoSurface: `rgba(74, 94, 191, 0.05)`,
  emeraldSurface: `rgba(10, 140, 127, 0.05)`,
  goldSurface: `rgba(0, 173, 239, 0.05)`,

  appBlueBorder: `rgba(0, 158, 219, 0.3)`,
  cultureRedBorder: `rgba(248, 0, 32, 0.3)`,
  saffronBorder: `rgba(0, 167, 239, 0.3)`,
  indigoBorder: `rgba(74, 94, 191, 0.3)`,
  emeraldBorder: `rgba(10, 140, 127, 0.3)`,
  goldBorder: `rgba(0, 173, 239, 0.3)`,
} as const;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Platform-safe web box-shadow helper */
export function webShadow(shadow: string): { boxShadow: string } {
  return { boxShadow: shadow };
}

// Responsive helper
export const getResponsiveValue = <T>(mobile: T, tablet: T, desktop: T) => {
  if (SCREEN_WIDTH >= 1024) return desktop;
  if (SCREEN_WIDTH >= 768) return tablet;
  return mobile;
};

// ---------------------------------------------------------------------------
// Type Exports (for consumers)
// ---------------------------------------------------------------------------

export type ButtonSize = keyof typeof ButtonTokens.height;
export type IconSizeKey = keyof typeof IconSize;
export type ZIndexKey = keyof typeof ZIndex;
export type RadiusKey = keyof typeof Radius;

const theme = {
  Spacing,
  Radius,
  Breakpoints,
  Layout,
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  TextStyles,
  DesktopTextStyles,
  Typography,
  M3Typography,
  Elevation,
  ElevationAlias,
  Duration,
  SpringConfig,
  prefersReducedMotion,
  ButtonTokens,
  LayoutRules,
  CardTokens,
  CardGrammarTokens,
  MotionTokens,
  AccessibilityTokens,
  InputTokens,
  ChipTokens,
  HeaderTokens,
  ScreenTokens,
  SheetTokens,
  AvatarTokens,
  TabBarTokens,
  SectionTokens,
  IconSize,
  ZIndex,
  BorderTokens,
  LiquidGlassTokens,
  MaterialExpressive,
  LiquidGlassAccents,
  CulturalAccents,
  SignatureGradient,
  CultureTokens,

  // Luxe Heritage 2026 (full token set exposed for easy adoption)
  Luxe,
  LuxeTextStyles,
  luxeGradients,
  BRAND_APP,
  BRAND_CULTURE,
  BRAND_PASS,
  DEEP_SAFFRON,
  RICH_INDIGO,
  EMERALD_HARMONY,
  HERITAGE_GOLD,
  DEEP_PLUM,
};

export default theme;
