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
/**
 * CulturePass Cultural Color System
 * ================================
 *
 * A comprehensive, theme-aware cultural color system designed for global heritage experiences.
 *
 * Core Cultural Colors:
 *   - Terracotta Glow (#E36A4E) — Primary action, cultural identity
 *   - Deep Saffron (#F5A623) — Secondary action, warm highlights
 *   - Rich Indigo (#4A5EBF) — Accent 1, cultural stories, links
 *   - Emerald Harmony (#0A8C7F) — Accent 2, trust, community sections
 *   - Heritage Gold (#D4A017) — Accent 3, premium elements
 *
 * Design Principles:
 *   ✓ Cultural authenticity over generic palettes
 *   ✓ Warm heritage tones for discovery and action
 *   ✓ Accessible contrast ratios (WCAG AA minimum)
 *   ✓ Platform-agnostic design with native performance
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

/**
 * Core Cultural Colors
 * Primary cultural identity and action palette.
 */
const TERRACOTTA_GLOW = "#E36A4E";    // Primary - Main buttons, accents, hero highlights
const DEEP_SAFFRON = "#F5A623";       // Secondary - CTAs, festival tags, warm highlights
const RICH_INDIGO = "#4A5EBF";        // Accent 1 - Cultural stories, map pins, links
const EMERALD_HARMONY = "#0A8C7F";    // Accent 2 - Trust, events, community sections
const HERITAGE_GOLD = "#D4A017";      // Accent 3 - Badges, stamps, premium/passport elements

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

  // Cultural Accents
  terracottaGlow: TERRACOTTA_GLOW,
  deepSaffron: DEEP_SAFFRON,
  richIndigo: RICH_INDIGO,
  emeraldHarmony: EMERALD_HARMONY,
  heritageGold: HERITAGE_GOLD,

  // Theme surface tokens (referenced by light/dark ColorTheme; enables proper light mode)
  backgroundLight: '#FAF9F6',
  backgroundDark: '#000000',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#121214',
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
export type EntityType = 'event' | 'venue' | 'community' | 'organizer' | 'host' | 'festival' | 'tradition' | 'organisation' | 'council' | 'government' | 'charity' | 'business';
export const EntityTypeColors: Record<EntityType, string> = {
  event: CultureTokens.emeraldHarmony,
  venue: CultureTokens.richIndigo,
  community: CultureTokens.heritageGold,
  organizer: CultureTokens.deepSaffron,
  host: CultureTokens.terracottaGlow,
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
  secondaryLight: "#FFF0D9",
  secondaryDark: "#524500",

  accent: CultureTokens.terracottaGlow,
  accentLight: "#FFDBCB",

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

  cultureBrand: CultureTokens.terracottaGlow,
  culturePrimary: CultureTokens.terracottaGlow,
  cultureSecondary: CultureTokens.deepSaffron,
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
  secondaryLight: "#765D00",
  secondaryDark: "#FFF0D9",

  accent: CultureTokens.terracottaGlow,
  accentLight: "#7D2900",

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

  cultureBrand: CultureTokens.terracottaGlow,
  culturePrimary: CultureTokens.terracottaGlow,
  cultureSecondary: CultureTokens.deepSaffron,
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
   * CulturePass Signature Gradient (2026)
   * Terracotta Glow #E36A4E → Deep Saffron #F5A623 — warm heritage vibe.
   * Max ONE per screen. Hero / onboarding / CulturePass+ only.
   */
  culturepassBrand: [
    CultureTokens.terracottaGlow,
    CultureTokens.deepSaffron,
  ] as [string, string],

  /** Primary brand gradient alias */
  primary: [
    CultureTokens.terracottaGlow,
    CultureTokens.deepSaffron,
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

  /** Warm Welcome Gradient — Deep Saffron → Heritage Gold */
  warmWelcome: [
    CultureTokens.deepSaffron,
    CultureTokens.heritageGold,
  ] as [string, string],
  /** Premium gold gradient for membership/pro badges */
  gold: [BRAND_GOLD, "#E6A900"] as [string, string],
  /** Terracotta Sunset Gradient — Terracotta Glow → Deep Saffron */
  terracottaSunset: [
    CultureTokens.terracottaGlow,
    "#F59E0B",
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
  /** Gold Accent Gradient — Heritage Gold → Warm Gold */
  goldAccent: [
    CultureTokens.heritageGold,
    "#FBBF24",
  ] as [string, string],
  /** Cultural Blend Gradient — Terracotta Glow → Deep Saffron → Heritage Gold */
  culturalBlend: [
    CultureTokens.terracottaGlow,
    CultureTokens.deepSaffron,
    CultureTokens.heritageGold,
  ] as [string, string, string],
  /** Passport Prestige Gradient — Heritage Gold → Deep Saffron → Rich Indigo */
  passportPrestige: [
    CultureTokens.heritageGold,
    "#F59E0B",
    CultureTokens.richIndigo,
  ] as [string, string, string],
};

/**
 * Neon glow tokens for interactive elements (futuristic highlights, active states).
 * Use sparingly — only on focal points, not general UI.
 */
export const neon = {
  culturalHighlight: { color: CultureTokens.terracottaGlow, glow: "rgba(227, 106, 78, 0.3)" },      // Terracotta glow
  festivalGlow: { color: CultureTokens.deepSaffron, glow: "rgba(245, 166, 35, 0.3)" },           // Saffron glow
  storySpotlight: { color: CultureTokens.richIndigo, glow: "rgba(74, 94, 191, 0.3)" },          // Indigo glow
  communityPulse: { color: CultureTokens.emeraldHarmony, glow: "rgba(10, 140, 127, 0.3)" },         // Emerald glow
  achievementRadiance: { color: CultureTokens.heritageGold, glow: "rgba(212, 160, 23, 0.3)" },    // Gold glow
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
