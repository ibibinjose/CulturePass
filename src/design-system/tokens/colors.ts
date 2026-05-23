/**
 * CulturePass UI Token System
 * ===========================
 *
 * A comprehensive, theme-aware color system designed for cultural discovery.
 *
 * Core Brand Tokens (2026 — see docs/DESIGN_TOKENS.md & docs/STYLE_GUIDE.md):
 *   - Indigo-Violet (#4F46E5) — primary brand identity
 *   - Rich Violet (#9333EA) — active states, gradient start
 *   - Movement Coral (#FF5E5B) — action and emotion
 *   - Temple Gold (#FFC857) — premium/cultural marker (accent only, not body/datetime text)
 *   - Warm Teal (#0D9488) — global belonging, venues
 *
 * Design Principles:
 *   ✓ Black-first premium surfaces across all platforms
 *   ✓ Warm discovery + action-oriented CTAs
 *   ✓ Cultural authenticity over tech-startup aesthetics
 *   ✓ Accessible contrast ratios (WCAG AA minimum)
 *
 * Usage:
 *   import { useColors } from '@/hooks/useColors';
 *   const colors = useColors(); // Runtime theme access
 */

export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
  boxShadow?: string;
}

const createShadow = (
  width: number,
  height: number,
  opacity: number,
  radius: number,
  elevation: number,
  color: string = "#000"
): any => {
  return {
    boxShadow: `${width}px ${height}px ${radius}px rgba(0, 0, 0, ${opacity})`,
  };
};

/**
 * Cultural Brand Tokens
 * Use these for primary interactions and cultural markers.
 */
/** Primary brand indigo — keep M3 `lightM3.primaryContainer` / brand chrome aligned. */
const BRAND_INDIGO = "#4F46E5";
const BRAND_VIOLET = "#9333EA";
const BRAND_CORAL = "#FF5E5B";
const BRAND_GOLD = "#FFC857";
const BRAND_TEAL = "#0D9488";
const BRAND_PURPLE = "#A855F7";

/** Vivid CTA fill for high-emphasis actions. */
export const CTA_VIVID_BLUE = BRAND_INDIGO;

export const CultureTokens = {
  // Core brand palette — CulturePass M3 roles.
  indigo: BRAND_INDIGO,
  violet: BRAND_VIOLET,
  coral: BRAND_CORAL,
  gold: BRAND_GOLD,
  teal: BRAND_TEAL,
  emerald: "#10B981",
  purple: BRAND_PURPLE,

  // Functional overrides
  event: BRAND_INDIGO,
  eventSoft: "#E8DDFF",
  artist: BRAND_CORAL,
  artistSoft: "#FFEDEA",
  venue: BRAND_TEAL,
  venueSoft: "#D8FFFA",
  movie: BRAND_VIOLET,
  movieSoft: "#F1D9FF",
  community: BRAND_INDIGO,
  communitySoft: "#E8DDFF",

  success: "#10B981",
  warning: BRAND_GOLD,
  error: "#BA1A1A",
  info: BRAND_INDIGO,

  /** Onboarding / auth primary button fill */
  ctaVivid: CTA_VIVID_BLUE,
} as const;

/** Olympics 5-ring colors for filter chips, buttons, and accents (mostly black/white base per request). */
export const OlympicsColors = {
  blue: BRAND_INDIGO,
  yellow: BRAND_GOLD,
  black: '#1C1C1C',
  green: BRAND_TEAL,
  red: BRAND_CORAL,
} as const;

/**
 * Browse category colors — used for category chips, icons, and tints
 * across Discover, search, and filter screens.
 */
export const CategoryColors = {
  music:       OlympicsColors.red,
  dance:       OlympicsColors.blue,
  food:        CultureTokens.coral,
  art:         OlympicsColors.blue,
  wellness:    OlympicsColors.green,
  movies:      OlympicsColors.red,
  workshop:    OlympicsColors.black,
  heritage:    CultureTokens.teal,
  activities:  OlympicsColors.green,
  nightlife:   OlympicsColors.red,
  comedy:      CultureTokens.violet,
  sports:      OlympicsColors.blue,
  monuments:   OlympicsColors.black,
  artists:     CultureTokens.indigo,
  shopping:    OlympicsColors.red,
  /** Browse / CategoryRail slugs (`id.toLowerCase().replace(/[^a-z]/g, '')`) */
  kidsyouth:   CultureTokens.teal,
  family:      CultureTokens.indigo,
  communitycauses: CultureTokens.violet,
  exhibitions: OlympicsColors.blue,
  festival:    CultureTokens.coral,
  fooddrink:   CultureTokens.coral,
  shoppingmarketsfairs: CultureTokens.gold,
  sportfitness: OlympicsColors.green,
  talkscoursesworkshops: CultureTokens.indigo,
  theatredancefilm: CultureTokens.violet,
  toursexperiences: CultureTokens.teal,
} as const;

/**
 * Entity type colors — used in community/profile listings to
 * colour-code organisations, venues, artists, etc.
 */
export const EntityTypeColors = {
  community:    BRAND_INDIGO,
  organisation: BRAND_INDIGO,
  venue:        BRAND_TEAL,
  council:      BRAND_GOLD,
  government:   BRAND_INDIGO,
  artist:       BRAND_CORAL,
  business:     BRAND_VIOLET,
  charity:      BRAND_CORAL,
} as const;

export type ColorTheme = {
  // Core brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primarySoft: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  accent: string;
  accentLight: string;

  gold: string;

  // Backgrounds
  background: string;
  backgroundSecondary: string;

  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;

  // Borders
  border: string;
  borderLight: string;
  divider: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  /** High-contrast text on saturated brand gradients (hero ribbons, CTAs on color). */
  textOnBrandGradient: string;

  /**
   * Event datetime emphasis on light surfaces (card bodies, lists).
   * Reddish — never use gold/yellow for event date text.
   */
  eventDate: string;
  /**
   * Event datetime on dark imagery / gradients (hero overlays).
   */
  eventDateOnMedia: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interaction
  overlay: string;
  tabIconDefault: string;
  tabIconSelected: string;
  card: string;
  cardBorder: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;

  tint: string;

  // Cultural tokens (brand-aware)
  cultureBrand: string;
  culturePrimary: string;
  cultureSecondary: string;
  cultureAccent: string;
  cultureHighlight: string;
};

// Colors that stay exactly the same regardless of light/dark mode
const sharedBase = {
  secondary: BRAND_VIOLET,
  secondaryLight: "#B66CFF",
  secondaryDark: "#5C1F8A",

  accent: BRAND_CORAL,
  accentLight: "#FF8A85",

  gold: BRAND_GOLD,

  success: "#10B981",
  warning: BRAND_GOLD,
  error: "#BA1A1A",
  info: BRAND_INDIGO,

  overlay: "rgba(0,0,0,0.4)",
} as const;

/**
 * Light Mode Theme
 * For web and optional light mode support.
 */
export const light: ColorTheme = {
  ...sharedBase,

  primary: BRAND_INDIGO,
  primaryLight: "#7C74FF",
  primaryDark: "#3730A3",
  primaryGlow: "rgba(79, 70, 229, 0.22)",
  primarySoft: "rgba(79, 70, 229, 0.10)",

  background: "#FFFBF7",
  backgroundSecondary: "#F5F1EE",

  surface: "#FFFDFA",
  surfaceElevated: "#FFFBF7",
  surfaceSecondary: "#F5F1EE",

  border: "#E7E5E4",
  borderLight: "#D6D3D1",
  divider: "#E7E5E4",

  text: "#1C1917",
  textSecondary: "#44403C",
  textTertiary: "#78716C",
  textInverse: "#FFFFFF",
  textOnBrandGradient: "#FFFFFF",

  eventDate: "#DC2626",
  eventDateOnMedia: "#FECACA",

  card: "#FFFDFA",
  cardBorder: "#E7E5E4",

  tabBar: "rgba(255,255,255,0.96)",
  tabBarBorder: "rgba(231,229,228,0.9)",
  tabIconDefault: "#78716C",
  tabIconSelected: BRAND_INDIGO,

  tint: BRAND_INDIGO,

  cultureBrand: BRAND_INDIGO,
  culturePrimary: BRAND_INDIGO,
  cultureSecondary: BRAND_VIOLET,
  cultureAccent: CultureTokens.coral,
  cultureHighlight: OlympicsColors.green,
};

/**
 * Dark Theme Tokens
 * Native default — “Night Festival” + OLED-friendly base (ui-ux-pro-max: deep black,
 * layered greys, brand accents; still CultureTokens-driven, not generic purple templates).
 *
 * Color hierarchy:
 *   True black / near-black — primary background (OLED power + contrast anchor)
 *   Lifted navy surfaces — cards and chrome
 *   Indigo-violet accents — elevated/active surfaces (`CultureTokens`, gradients)
 */
export const dark: ColorTheme = {
  ...sharedBase,

  primary: "#C8C1FF",
  primaryLight: "#E8DDFF",
  primaryDark: BRAND_INDIGO,
  primaryGlow: "rgba(200, 193, 255, 0.30)",
  primarySoft: "rgba(200, 193, 255, 0.12)",

  background: "#0C0A09",
  backgroundSecondary: "#0C0A09",

  surface: "#1C1917",
  surfaceElevated: "#292524",
  surfaceSecondary: "#1C1917",

  border: "#44403C",
  borderLight: "#57534E",
  divider: "#292524",

  text: "#FAF9F6",
  textSecondary: "#A8A29E",
  textTertiary: "#78716C",
  textInverse: "#1C1917",
  textOnBrandGradient: "#FFFFFF",

  eventDate: "#F87171",
  eventDateOnMedia: "#FECACA",

  card: "#1C1917",
  cardBorder: "#44403C",

  tabBar: "rgba(12,10,9,0.94)",
  tabBarBorder: "rgba(68,64,60,0.6)",
  tabIconDefault: "#78716C",
  tabIconSelected: "#C8C1FF",

  tint: "#C8C1FF",

  cultureBrand: "#C8C1FF",
  culturePrimary: "#C8C1FF",
  cultureSecondary: "#E5B7FF",
  cultureAccent: CultureTokens.coral,
  cultureHighlight: OlympicsColors.green,
};

export const shadows = {
  small: createShadow(0, 1, 0.04, 3, 1),
  medium: createShadow(0, 2, 0.08, 8, 3),
  large: createShadow(0, 4, 0.12, 16, 6),
  heavy: createShadow(0, 8, 0.16, 24, 10),
};

/**
 * Glassmorphism and futuristic surface presets.
 * Use these on cards/modals for a modern frosted-glass feel.
 */
export const glass = {
  light: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  dark: {
    backgroundColor: "rgba(30,41,59,0.82)",
    borderColor: "rgba(148,163,184,0.12)",
  },
  /** Semi-transparent overlay for modals/popovers */
  overlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  /** Ultra-clear glass — for hero sections and featured cards */
  ultraLight: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  /** Deep dark glass — for dark mode hero sections */
  ultraDark: {
    backgroundColor: "rgba(0,0,0,0.82)",
    borderColor: "rgba(255,255,255,0.06)",
  },
} as const;

/**
 * Gradient tuples ready for LinearGradient `colors` prop.
 * Each pair is [start, end] or triple for [start, middle, end].
 */
export const gradients = {
  /**
   * CulturePass Signature Gradient (2026)
   * Violet #9333EA → Coral #FF5E5B — sunset/festival vibe.
   * Max ONE per screen. Hero / onboarding / CulturePass+ only.
   */
  culturepassBrand: [
    CultureTokens.violet,
    CultureTokens.coral,
  ] as [string, string],

  /** CulturePass Signature Gradient (reversed: Emerald → Violet) */
  culturepassBrandReversed: [
    CultureTokens.teal,
    CultureTokens.indigo,
  ] as [string, string],

  /** Coral pressed gradient — Movement Coral → deep coral. Used for live/age badges on event surfaces. */
  coralPressed: [
    CultureTokens.coral,
    "#CC237F",
  ] as [string, string],

  /** Primary brand gradient — saturated blue ramp */
  primary: [BRAND_INDIGO, "#3730A3"] as [string, string],
  /** Accent gradient — coral to gold */
  accent: [BRAND_CORAL, BRAND_GOLD] as [string, string],
  /** Premium gold gradient for membership/pro badges */
  gold: [BRAND_GOLD, "#E6A900"] as [string, string],
  /** Dark surface gradient for cards on dark mode */
  darkSurface: ["#1C1C1E", "#2C2C2E"] as [string, string],
  /** Hero banner overlay (transparent → dark) */
  heroOverlay: ["transparent", "rgba(0,0,0,0.6)"] as [string, string],
  /** Success / positive action — Apple Green */
  success: ["#10B981", "#059669"] as [string, string],
  /** Aurora — brand blue, green, pink */
  aurora: [
    CultureTokens.indigo,
    BRAND_TEAL,
    BRAND_CORAL,
  ] as [string, string, string],
  /** Sunset — Pink to Yellow */
  sunset: [
    BRAND_CORAL,
    "#FF7DC3",
    BRAND_GOLD,
  ] as [string, string, string],
  /** Midnight — deep dark */
  midnight: [
    "#000000",
    "#1C1C1E",
    "#2C2C2E",
  ] as [string, string, string],
  /** Festival / Apple brights */
  festival: [
    CultureTokens.indigo,
    BRAND_TEAL,
    BRAND_CORAL,
  ] as [string, string, string],
  /** Olympic — full rings (kept for compatibility) */
  olympic: [
    CultureTokens.indigo,
    BRAND_GOLD,
    BRAND_CORAL,
  ] as [string, string, string],
};

/**
 * Neon glow tokens for interactive elements (futuristic highlights, active states).
 * Use sparingly — only on focal points, not general UI.
 */
export const neon = {
  blue: { color: BRAND_INDIGO, glow: "rgba(79, 70, 229, 0.45)" },
  purple: { color: BRAND_VIOLET, glow: "rgba(147, 51, 234, 0.45)" },
  teal: { color: BRAND_TEAL, glow: "rgba(13, 148, 136, 0.45)" },
  gold: { color: BRAND_GOLD, glow: "rgba(255, 200, 87, 0.50)" },
  coral: { color: BRAND_CORAL, glow: "rgba(255, 94, 91, 0.45)" },
} as const;

const Colors = {
  ...light, // Default export maps to light mode variables
  light,
  dark,
  shadow: shadows,
  shadows,
  glass,
  gradients,
  tokens: CultureTokens, // Cultural brand tokens
  cultureTokens: CultureTokens,
} as const;

export default Colors;
