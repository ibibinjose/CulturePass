/**
 * CulturePass UI Token System (2026)
 * ==================================
 *
 * Canonical palette: docs/DESIGN_TOKENS.md
 *
 * Wordmark (CulturePass.App):
 *   - cultureRed #f80020 — "Culture"
 *   - passGreen  #00A651 — "Pass"
 *   - appBlue    #009EDB — ".App" primary chrome
 *
 * Platform UI:
 *   - indigo, violet, coral, teal, BRAND_CYAN family
 */

import {
  BRAND_CYAN,
  BRAND_CYAN_DEEP,
  BRAND_CYAN_LIGHT,
  JET_BLACK,
} from './brandCyanPalette';
import {
  BRAND_APP_BLUE,
  BRAND_CULTURE_RED,
  BRAND_PASS_GREEN,
} from './brandWordmarkPalette';

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
const BRAND_VIOLET = "#4F46E5"; // Unified with BRAND_INDIGO — no standalone purple
const BRAND_CORAL = "#FF5E5B";

/** @deprecated Name retained for API compat — value is BRAND_CYAN, not gold. */
const BRAND_GOLD = BRAND_CYAN;
const BRAND_TEAL = "#0D9488";
const BRAND_PURPLE = "#4F46E5"; // Remapped to indigo — purple removed from brand palette

/**
 * Core Cultural Colors
 * Primary cultural identity and action palette.
 */
/** @deprecated Name retained — value is BRAND_CYAN_DEEP (replaces saffron). */
const DEEP_SAFFRON = BRAND_CYAN_DEEP;
const RICH_INDIGO = "#4A5EBF";        // Accent 1 - Cultural stories, map pins, links
const EMERALD_HARMONY = "#0A8C7F";    // Accent 2 - Trust, events, community sections
/** @deprecated Name retained — value is BRAND_CYAN (replaces heritage gold). */
const HERITAGE_GOLD = BRAND_CYAN;

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

  // Wordmark palette (CulturePass.App)
  cultureRed: BRAND_CULTURE_RED,
  passGreen: BRAND_PASS_GREEN,
  appBlue: BRAND_APP_BLUE,

  // Cyan-backed accent aliases
  deepSaffron: DEEP_SAFFRON,
  richIndigo: RICH_INDIGO,
  emeraldHarmony: EMERALD_HARMONY,
  heritageGold: HERITAGE_GOLD,

  // Theme surface tokens (referenced by light/dark ColorTheme; enables proper light mode)
  backgroundLight: '#FAF9F6',
  backgroundDark: '#000000',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#121214',
  grey500: '#71717A',
} as const;

/** Olympics 5-ring colors for filter chips, buttons, and accents (mostly black/white base per request). */
export const OlympicsColors = {
  blue: BRAND_INDIGO,
  yellow: BRAND_CYAN,
  black: JET_BLACK,
  green: BRAND_TEAL,
  red: BRAND_CORAL,
} as const;

/**
 * Browse category colors — used for category chips, icons, and tints
 * across Discover, search, and filter screens.
 */
export const CategoryColors = {
  events: CultureTokens.emeraldHarmony,
  festivals: CultureTokens.deepSaffron,
  food: "#F97316",              // Orange
  art: "#EC4899",               // Pink
  music: "#8B5CF6",             // Purple
  language: CultureTokens.richIndigo,
  community: CultureTokens.heritageGold,
  indigenous: "#06B6D4",        // Cyan
  movies: CultureTokens.movie,
} as const;

/**
 * Entity type colors — used in community/profile listings to
 * colour-code organisations, venues, artists, etc.
 */
export type EntityType = 'event' | 'venue' | 'community' | 'organizer' | 'organiser' | 'host' | 'festival' | 'tradition' | 'organisation' | 'council' | 'government' | 'charity' | 'business';
export const EntityTypeColors: Record<EntityType, string> = {
  event: CultureTokens.emeraldHarmony,
  venue: CultureTokens.richIndigo,
  community: CultureTokens.heritageGold,
  organizer: CultureTokens.deepSaffron,
  organiser: CultureTokens.deepSaffron,
  host: CultureTokens.appBlue,
  festival: CultureTokens.deepSaffron,
  tradition: "#8B5CF6",
  organisation: CultureTokens.indigo,
  council: CultureTokens.teal,
  government: CultureTokens.indigo,
  charity: CultureTokens.coral,
  business: CultureTokens.emeraldHarmony,
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

  // Material 3 / Modern surfaces
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;

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

  primary: CultureTokens.indigo,
  primaryLight: "#E8DDFF",
  primaryDark: "#1B0B4B",
  primaryGlow: "rgba(79, 70, 229, 0.15)",
  primarySoft: "rgba(79, 70, 229, 0.08)",

  secondary: CultureTokens.deepSaffron,
  secondaryLight: "#E0F7FF",
  secondaryDark: "#006B8F",

  accent: CultureTokens.appBlue,
  accentLight: "#B3E5FC",

  background: CultureTokens.backgroundLight,
  backgroundSecondary: "#F5F1EE",

  surface: CultureTokens.surfaceLight,
  surfaceElevated: "#FFFFFF",
  surfaceSecondary: "#F5F1EE",

  border: "#D6D3D1",
  borderLight: "#E7E5E4",
  divider: "#F5F5F4",

  text: "#1C1917",
  textSecondary: "#44403C",
  textTertiary: "#71717A",
  textInverse: "#FFFFFF",
  textOnBrandGradient: "#FFFFFF",

  eventDate: "#DC2626",
  eventDateOnMedia: "#FECACA",

  card: "#FFFFFF",
  cardBorder: "#E7E5E4",

  surfaceVariant: "#F5F1EE",
  onSurfaceVariant: "#44403C",
  surfaceContainerLow: "#FCFAFA",
  surfaceContainerHigh: "#F0EBE8",

  tabBar: "rgba(255,255,255,0.92)",
  tabBarBorder: "rgba(231,229,228,0.5)",
  tabIconDefault: "#71717A",
  tabIconSelected: CultureTokens.indigo,

  tint: CultureTokens.indigo,

  cultureBrand: CultureTokens.appBlue,
  culturePrimary: CultureTokens.cultureRed,
  cultureSecondary: CultureTokens.passGreen,
  cultureAccent: CultureTokens.heritageGold,
  cultureHighlight: CultureTokens.emeraldHarmony,
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

  primary: CultureTokens.indigo,
  primaryLight: "#C8C1FF",
  primaryDark: "#23105E",
  primaryGlow: "rgba(79, 70, 229, 0.35)",
  primarySoft: "rgba(79, 70, 229, 0.15)",

  secondary: CultureTokens.deepSaffron,
  secondaryLight: "#005A78",
  secondaryDark: "#E0F7FF",

  accent: CultureTokens.appBlue,
  accentLight: "#004A6E",

  background: CultureTokens.backgroundDark,
  backgroundSecondary: "#121214",

  surface: CultureTokens.surfaceDark,
  surfaceElevated: "#1E1E20",
  surfaceSecondary: "#1E1E20",

  border: "#27272A",
  borderLight: "#3F3F46",
  divider: "#18181B",

  text: "#FAF9F6",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textInverse: "#1C1917",
  textOnBrandGradient: "#FFFFFF",

  eventDate: "#F87171",
  eventDateOnMedia: "#FECACA",

  card: "#121214",
  cardBorder: "#27272A",

  surfaceVariant: "#1E1E20",
  onSurfaceVariant: "#A1A1AA",
  surfaceContainerLow: "#161618",
  surfaceContainerHigh: "#27272A",

  tabBar: "rgba(0,0,0,0.92)",
  tabBarBorder: "rgba(39,39,42,0.6)",
  tabIconDefault: "#71717A",
  tabIconSelected: CultureTokens.indigo,

  tint: CultureTokens.indigo,

  cultureBrand: CultureTokens.appBlue,
  culturePrimary: CultureTokens.cultureRed,
  cultureSecondary: CultureTokens.passGreen,
  cultureAccent: CultureTokens.heritageGold,
  cultureHighlight: CultureTokens.emeraldHarmony,
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
   * CulturePass Signature Gradient — wordmark spectrum (Culture red → .App blue).
   * Max ONE per screen. Hero / onboarding / flagship CTA only.
   */
  culturepassBrand: [
    CultureTokens.cultureRed,
    CultureTokens.appBlue,
  ] as [string, string],

  /** Primary brand gradient alias */
  primary: [
    CultureTokens.cultureRed,
    CultureTokens.appBlue,
  ] as [string, string],

  /** Midnight / dark depth gradient */
  midnight: [
    "#121214",
    "#000000",
  ] as [string, string],

  /** Cultural Harmony Gradient — Emerald Harmony → Rich Indigo */
  culturalHarmony: [
    CultureTokens.emeraldHarmony,
    CultureTokens.richIndigo,
  ] as [string, string],

  /** Coral pressed gradient — Movement Coral → deep coral. Used for live/age badges on event surfaces. */
  coralPressed: [
    CultureTokens.coral,
    "#CC237F",
  ] as [string, string],

  /** Cyan welcome gradient — Brand Cyan Deep → Brand Cyan */
  warmWelcome: [
    BRAND_CYAN_DEEP,
    BRAND_CYAN,
  ] as [string, string],
  /** Premium cyan gradient for membership/pro badges */
  gold: [BRAND_CYAN, BRAND_CYAN_DEEP] as [string, string],
  /** Wordmark sunset — culture red → app blue */
  brandSunset: [
    CultureTokens.cultureRed,
    CultureTokens.appBlue,
  ] as [string, string],
  /** Hero banner overlay (transparent → dark) */
  heroOverlay: ["transparent", "rgba(0,0,0,0.8)"] as [string, string],
  /** Success / positive action — Apple Green */
  success: ["#10B981", "#059669"] as [string, string],
  /** Indigo Depth Gradient — Rich Indigo → Purple */
  indigoDepth: [
    CultureTokens.richIndigo,
    "#7C3AED",
  ] as [string, string],
  /** Emerald Growth Gradient — Emerald Harmony → Bright Emerald */
  emeraldGrowth: [
    CultureTokens.emeraldHarmony,
    "#10B981",
  ] as [string, string],
  /** Cyan accent gradient */
  goldAccent: [
    BRAND_CYAN,
    BRAND_CYAN_LIGHT,
  ] as [string, string],
  /** Wordmark tricolor — Culture → Pass → .App */
  culturalBlend: [
    CultureTokens.cultureRed,
    CultureTokens.passGreen,
    CultureTokens.appBlue,
  ] as [string, string, string],
  /** Passport prestige — Cyan → Cyan Deep → Rich Indigo */
  passportPrestige: [
    BRAND_CYAN,
    BRAND_CYAN_DEEP,
    CultureTokens.richIndigo,
  ] as [string, string, string],
};

/**
 * Neon glow tokens for interactive elements (futuristic highlights, active states).
 * Use sparingly — only on focal points, not general UI.
 */
export const neon = {
  culturalHighlight: { color: CultureTokens.appBlue, glow: "rgba(0, 158, 219, 0.3)" },
  festivalGlow: { color: BRAND_CYAN_DEEP, glow: "rgba(0, 167, 239, 0.3)" },
  storySpotlight: { color: CultureTokens.richIndigo, glow: "rgba(74, 94, 191, 0.3)" },          // Indigo glow
  communityPulse: { color: CultureTokens.emeraldHarmony, glow: "rgba(10, 140, 127, 0.3)" },         // Emerald glow
  achievementRadiance: { color: BRAND_CYAN, glow: "rgba(0, 173, 239, 0.3)" },
} as const;

export default {
  ...light, // Default export maps to light mode variables
  light,
  dark,
  shadow: shadows,
  shadows,
  glass,
  gradients,
  tokens: CultureTokens, // Cultural brand tokens
  cultureTokens: CultureTokens,
  neon,
  categoryColors: CategoryColors,
  entityTypeColors: EntityTypeColors,
} as const;
