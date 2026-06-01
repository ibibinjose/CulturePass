import { Platform } from 'react-native';

/**
 * Typography scale for CulturePass.
 *
 * Design rules:
 *  - Font family: Poppins (400–700), loaded in app/_layout.tsx — exported as FontFamily.* below
 *  - Base body: 16px / 24px line-height (1.5 ratio)
 *  - Display text: tighter leading (~1.2–1.3×) — large sizes read better compressed
 *  - All sizes and line-heights are multiples of 4 (aligns with the 4-point spacing grid)
 *  - Letter spacing follows Apple HIG conventions adapted for the brand face
 *
 * Usage:
 *   import { TextStyles, FontFamily, FontSize } from '@/design-system/tokens/typography';
 *   <Text style={TextStyles.title}>Hello</Text>
 *
 *   // Responsive override (spread + override):
 *   <Text style={[TextStyles.title, isDesktop && DesktopTextStyles.title]}>Hello</Text>
 */

// ---------------------------------------------------------------------------
// Font family aliases
// ---------------------------------------------------------------------------
export const FontFamily = {
  // Kept key names for backwards compatibility across existing style usage.
  // In app/_layout.tsx these keys are mapped to Inter font files.
  regular:  'Poppins_400Regular',
  medium:   'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
} as const;

// ---------------------------------------------------------------------------
// Font size scale (all multiples of 4 or standard type sizes)
// ---------------------------------------------------------------------------
export const FontSize = {
  tab:     10,   // Tab bar labels only
  micro:   11,   // Badges, pills, micro-labels
  caption: 12,   // Timestamps, secondary metadata
  chip:    13,   // Filter chips, tag labels
  body2:   14,   // Card body, secondary labels
  callout: 15,   // Supporting text, callouts
  body:    16,   // Primary reading text (base)
  title3:  18,   // Card headers, section subheadings
  title2:  20,   // Screen sub-headers
  title:   24,   // Screen-level headings
  hero:    28,   // Hero section headings
  display: 32,   // Landing / marketing display
} as const;

// ---------------------------------------------------------------------------
// Line height scale (multiples of 4 — stays on 4-point grid)
// ---------------------------------------------------------------------------
export const LineHeight = {
  tab:     12,
  micro:   16,
  caption: 16,
  chip:    20,
  body2:   20,
  callout: 22,  // ~1.47× callout
  body:    24,  // 1.5× body — optimal for reading
  title3:  28,  // 1.55× title3
  title2:  28,  // 1.4× title2
  title:   32,  // 1.33× title
  hero:    36,  // 1.29× hero
  display: 40,  // 1.25× display — tight at large sizes
} as const;

// ---------------------------------------------------------------------------
// Letter spacing
// ---------------------------------------------------------------------------
export const LetterSpacing = {
  tight:  -0.5,
  normal:  0,
  wide:    0.3,
  wider:   0.8,
  cap:     1.2,   // All-caps labels (RSVP, SYD, etc.)
} as const;

// ---------------------------------------------------------------------------
// Composed text style presets — ready for StyleSheet / inline use
// ---------------------------------------------------------------------------
const weight = (w: '400' | '500' | '600' | '700' | '800') => 
  Platform.select({ ios: w, android: 'normal', web: w }) as any;

export const TextStyles = {

  // Display / marketing
  display: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   FontSize.display,
    lineHeight: LineHeight.display,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  hero: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   FontSize.hero,
    lineHeight: LineHeight.hero,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Screen headings
  title: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   FontSize.title,
    lineHeight: LineHeight.title,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  title2: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   FontSize.title2,
    lineHeight: LineHeight.title2,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  title3: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.title3,
    lineHeight: LineHeight.title3,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // UI text
  headline: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.body,
    lineHeight: LineHeight.body,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  body: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.body,
    lineHeight: LineHeight.body,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontWeight: weight('500'),
    fontSize:   FontSize.body,
    lineHeight: LineHeight.body,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.caption,
    lineHeight: LineHeight.caption,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  callout: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.callout,
    lineHeight: LineHeight.callout,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Card / component text
  cardTitle: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.body2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  cardBody: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.body2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  /** Event listing cards (Discover rail, events grid) — pair with `colors.eventDate` for datetime */
  eventCardTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.callout,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  eventCardDate: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.chip,
    lineHeight: LineHeight.chip,
    letterSpacing: 0.15,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  eventCardMeta: {
    fontFamily: FontFamily.medium,
    fontWeight: weight('500'),
    fontSize:   FontSize.chip,
    lineHeight: LineHeight.chip,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  label: {
    fontFamily: FontFamily.medium,
    fontWeight: weight('500'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.body2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  labelSemibold: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.body2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Metadata / secondary
  chip: {
    fontFamily: FontFamily.medium,
    fontWeight: weight('500'),
    fontSize:   FontSize.chip,
    lineHeight: LineHeight.chip,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.caption,
    lineHeight: LineHeight.caption,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  captionStrong: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.caption,
    lineHeight: LineHeight.caption,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  captionSemibold: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.caption,
    lineHeight: LineHeight.caption,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  title1: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize:   28,
    lineHeight: 36,
    letterSpacing: LetterSpacing.tight,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Badges / pills / micro
  badge: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.micro,
    lineHeight: LineHeight.micro,
    letterSpacing: LetterSpacing.wide,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  badgeCaps: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.micro,
    lineHeight: LineHeight.micro,
    letterSpacing: LetterSpacing.cap,
    textTransform: 'uppercase' as const,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  // Navigation
  tabLabel: {
    fontFamily: FontFamily.semibold,
    fontWeight: weight('600'),
    fontSize:   FontSize.tab,
    lineHeight: LineHeight.tab,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

  /** @deprecated use callout or cardBody */
  subhead: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize:   FontSize.body2,
    lineHeight: LineHeight.body2,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },

} as const;

// ---------------------------------------------------------------------------
// Desktop overrides — spread over TextStyles for larger screens
//
// Usage: style={[TextStyles.title, isDesktop && DesktopTextStyles.title]}
// ---------------------------------------------------------------------------
export const DesktopTextStyles = {
  display: { fontSize: 40, lineHeight: 52 },
  hero:    { fontSize: 36, lineHeight: 44 },
  title:   { fontSize: 28, lineHeight: 36 },
  title2:  { fontSize: 24, lineHeight: 32 },
} as const;

// ---------------------------------------------------------------------------
// Legacy export: keeps existing code that imports { Typography } compiling.
// Prefer TextStyles for all new code.
// ---------------------------------------------------------------------------
/** @deprecated Use TextStyles from this file instead */
export const Typography = {
  largeTitle:   { ...TextStyles.title,  fontSize: 34, lineHeight: 40 },
  title1:       { ...TextStyles.title,  fontSize: 28, lineHeight: 36 },
  title2:       TextStyles.title2,
  title3:       TextStyles.title3,
  headline:     TextStyles.headline,
  body:         TextStyles.body,
  callout:      TextStyles.callout,
  subheadline:  TextStyles.callout,
  footnote:     TextStyles.caption,
  caption1:     TextStyles.caption,
  caption2:     TextStyles.badge,
  hero:         TextStyles.hero,
  section:      TextStyles.title3,
  cardTitle:    TextStyles.cardTitle,
  small:        TextStyles.caption,
};

// ---------------------------------------------------------------------------
// Material 3 Expressive Type Scale
// ---------------------------------------------------------------------------

export const M3Typography = {
  displayLarge: {
    fontFamily: FontFamily.bold,
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: FontFamily.bold,
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: FontFamily.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: FontFamily.semibold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: FontFamily.semibold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  // ─────────────────────────────────────────────────────────────
  // Editorial Name + Tagline treatment (Jony Ive / display lockup style)
  // Use for prominent creator, host, community, business, artist names + their one-liner.
  // The NAME is massive, bold, uppercase, tight-tracked.
  // The TAGLINE is small, elegant, sentence case.
  // ─────────────────────────────────────────────────────────────
  nameDisplay: {
    fontFamily: FontFamily.bold,
    fontWeight: weight('700'),
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.8,
    textTransform: 'uppercase' as const,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  taglineEditorial: {
    fontFamily: FontFamily.regular,
    fontWeight: weight('400'),
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
} as const;
