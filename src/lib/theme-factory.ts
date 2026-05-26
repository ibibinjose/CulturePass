/**
 * CulturePass Theme Factory
 * =========================
 * Generates consistent, theme-aware style objects from the design token system.
 *
 * Every style factory function is pure — it takes the current color theme and
 * returns a StyleSheet-compatible object. Wrap in `useThemeFactory()` to get
 * the fully-bound version for the active theme.
 *
 * Usage (component):
 *   const tf = useThemeFactory();
 *   <View style={tf.card.base}>…</View>
 *   <Text style={tf.button.primary.label}>…</Text>
 *
 * Usage (StyleSheet.create outside render):
 *   import { makeCardStyles } from '@/lib/theme-factory';
 *   const colors = useColors();
 *   const cardStyles = makeCardStyles(colors);
 */

import { StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { ColorTheme } from '@/design-system/tokens/colors';
import {
  ButtonTokens,
  CardTokens,
  InputTokens,
  ChipTokens,
  AvatarTokens,
  Spacing,
  Radius,
  Elevation,
  TextStyles,
  ZIndex,
  IconSize,
  CultureTokens,
  CategoryColors,
  EntityTypeColors,
} from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

export type CardVariant = 'base' | 'raised' | 'featured' | 'glass' | 'hero';

export interface CardStyleSet {
  base: ReturnType<typeof StyleSheet.create>[string];
  raised: ReturnType<typeof StyleSheet.create>[string];
  featured: ReturnType<typeof StyleSheet.create>[string];
  glass: ReturnType<typeof StyleSheet.create>[string];
  hero: ReturnType<typeof StyleSheet.create>[string];
  /** 16:9 aspect image container for cards */
  imageContainer: ReturnType<typeof StyleSheet.create>[string];
  /** Image container with fixed mobile height */
  imageContainerFixed: ReturnType<typeof StyleSheet.create>[string];
  body: ReturnType<typeof StyleSheet.create>[string];
}

export function makeCardStyles(colors: ColorTheme): CardStyleSet {
  return {
    base: {
      backgroundColor: colors.card,
      borderRadius: CardTokens.radius,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      ...Elevation[1],
    },
    raised: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: CardTokens.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...Elevation[2],
    },
    featured: {
      backgroundColor: colors.card,
      borderRadius: CardTokens.radiusLarge,
      borderWidth: 1.5,
      borderColor: colors.primary + '33', // 20% primary tint
      overflow: 'hidden',
      ...Elevation[3],
    },
    glass: {
      backgroundColor: 'rgba(255,255,255,0.72)',
      borderRadius: CardTokens.radius,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      overflow: 'hidden',
      ...Elevation[2],
    },
    hero: {
      borderRadius: CardTokens.radiusLarge,
      overflow: 'hidden',
      ...Elevation[3],
    },
    imageContainer: {
      aspectRatio: 16 / 9,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    imageContainerFixed: {
      height: CardTokens.imageHeight.mobile,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    body: {
      padding: CardTokens.padding,
      gap: Spacing.sm,
    },
  };
}

// ---------------------------------------------------------------------------
// Button variants
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gold' | 'teal';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonSizeStyle {
  container: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
}

export interface ButtonVariantStyle {
  sm: ButtonSizeStyle;
  md: ButtonSizeStyle;
  lg: ButtonSizeStyle;
}

export interface ButtonStyleSet {
  primary: ButtonVariantStyle;
  secondary: ButtonVariantStyle;
  ghost: ButtonVariantStyle;
  destructive: ButtonVariantStyle;
  gold: ButtonVariantStyle;
  teal: ButtonVariantStyle;
}

function makeButtonVariant(
  bg: string,
  labelColor: string,
  borderColor: string | undefined,
): ButtonVariantStyle {
  const base = {
    borderRadius: ButtonTokens.radius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: ButtonTokens.iconGap,
    borderWidth: borderColor ? 1.5 : 0,
    borderColor: borderColor ?? 'transparent',
    backgroundColor: bg,
  };
  return {
    sm: {
      container: { ...base, height: ButtonTokens.height.sm, paddingHorizontal: ButtonTokens.paddingH.sm },
      label: { ...TextStyles.label, color: labelColor, fontSize: ButtonTokens.fontSize.sm },
    },
    md: {
      container: { ...base, height: ButtonTokens.height.md, paddingHorizontal: ButtonTokens.paddingH.md },
      label: { ...TextStyles.label, color: labelColor, fontSize: ButtonTokens.fontSize.md },
    },
    lg: {
      container: { ...base, height: ButtonTokens.height.lg, paddingHorizontal: ButtonTokens.paddingH.lg },
      label: { ...TextStyles.label, color: labelColor, fontSize: ButtonTokens.fontSize.lg },
    },
  };
}

export function makeButtonStyles(colors: ColorTheme): ButtonStyleSet {
  return {
    primary: makeButtonVariant(colors.primary, '#FFFFFF', undefined),
    secondary: makeButtonVariant(colors.surface, colors.primary, colors.primary),
    ghost: makeButtonVariant('transparent', colors.primary, colors.border),
    destructive: makeButtonVariant(colors.error + '18', colors.error, colors.error + '66'),
    gold: makeButtonVariant(CultureTokens.gold, '#1B0F2E', undefined),
    teal: makeButtonVariant(CultureTokens.teal, '#FFFFFF', undefined),
  };
}

// ---------------------------------------------------------------------------
// Pill / round button
// ---------------------------------------------------------------------------

export interface PillStyleSet {
  primary: ReturnType<typeof StyleSheet.create>[string];
  secondary: ReturnType<typeof StyleSheet.create>[string];
  label: {
    primary: ReturnType<typeof StyleSheet.create>[string];
    secondary: ReturnType<typeof StyleSheet.create>[string];
  };
}

export function makePillStyles(colors: ColorTheme): PillStyleSet {
  const base = {
    height: ButtonTokens.height.sm,
    borderRadius: ButtonTokens.radiusPill,
    paddingHorizontal: ButtonTokens.paddingH.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: ButtonTokens.iconGap,
  };
  return {
    primary: { ...base, backgroundColor: colors.primary },
    secondary: { ...base, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
    label: {
      primary: { ...TextStyles.label, color: '#FFFFFF', fontSize: ButtonTokens.fontSize.sm },
      secondary: { ...TextStyles.label, color: colors.primary, fontSize: ButtonTokens.fontSize.sm },
    },
  };
}

// ---------------------------------------------------------------------------
// Input variants
// ---------------------------------------------------------------------------

export type InputState = 'default' | 'focused' | 'error' | 'disabled';

export interface InputStyleSet {
  default: ReturnType<typeof StyleSheet.create>[string];
  focused: ReturnType<typeof StyleSheet.create>[string];
  error: ReturnType<typeof StyleSheet.create>[string];
  disabled: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
  helperText: ReturnType<typeof StyleSheet.create>[string];
  errorText: ReturnType<typeof StyleSheet.create>[string];
  placeholder: string; // color string for placeholder prop
}

export function makeInputStyles(colors: ColorTheme): InputStyleSet {
  const base = {
    height: InputTokens.height,
    borderRadius: InputTokens.radius,
    paddingHorizontal: InputTokens.paddingH,
    paddingVertical: InputTokens.paddingV,
    fontSize: InputTokens.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  };
  return {
    default: base,
    focused: { ...base, borderColor: colors.primary, ...Elevation[1] },
    error: { ...base, borderColor: colors.error, backgroundColor: colors.error + '0A' },
    disabled: { ...base, opacity: 0.5, borderColor: colors.borderLight },
    label: { ...TextStyles.label, color: colors.text, marginBottom: Spacing.xs },
    helperText: { ...TextStyles.caption, color: colors.textSecondary, marginTop: Spacing.xs },
    errorText: { ...TextStyles.caption, color: colors.error, marginTop: Spacing.xs },
    placeholder: colors.textTertiary,
  };
}

// ---------------------------------------------------------------------------
// Chip / filter pill variants
// ---------------------------------------------------------------------------

export interface ChipStyleSet {
  default: ReturnType<typeof StyleSheet.create>[string];
  selected: ReturnType<typeof StyleSheet.create>[string];
  label: {
    default: ReturnType<typeof StyleSheet.create>[string];
    selected: ReturnType<typeof StyleSheet.create>[string];
  };
}

export function makeChipStyles(colors: ColorTheme): ChipStyleSet {
  const base = {
    height: ChipTokens.height,
    borderRadius: ChipTokens.radius,
    paddingHorizontal: ChipTokens.paddingH,
    paddingVertical: ChipTokens.paddingV,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: ChipTokens.gap,
    borderWidth: 1.5,
  };
  return {
    default: {
      ...base,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    selected: {
      ...base,
      backgroundColor: colors.primary + '18',
      borderColor: colors.primary,
    },
    label: {
      default: { ...TextStyles.chip, color: colors.textSecondary },
      selected: { ...TextStyles.chip, color: colors.primary },
    },
  };
}

// ---------------------------------------------------------------------------
// Badge / tag variants
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gold'
  | 'teal'
  | 'coral'
  | 'free'
  | 'new';

export interface BadgeStyle {
  container: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
}

export interface BadgeStyleSet extends Record<BadgeVariant, BadgeStyle> {
  /** Category-coloured badges (music, dance, food, etc.) */
  category: (category: keyof typeof CategoryColors) => BadgeStyle;
  /** Entity-type badges (community, artist, venue, etc.) */
  entity: (entityType: keyof typeof EntityTypeColors) => BadgeStyle;
}

function makeBadge(bg: string, labelColor: string): BadgeStyle {
  return {
    container: {
      backgroundColor: bg,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { ...TextStyles.badge, color: labelColor },
  };
}

export function makeBadgeStyles(colors: ColorTheme): BadgeStyleSet {
  return {
    default: makeBadge(colors.surface, colors.textSecondary),
    primary: makeBadge(colors.primary, '#FFFFFF'),
    success: makeBadge(colors.success + '20', colors.success),
    warning: makeBadge(colors.warning + '20', '#8B5200'),
    error: makeBadge(colors.error + '18', colors.error),
    info: makeBadge(colors.info + '18', colors.info),
    gold: makeBadge(CultureTokens.gold + '25', '#7A5500'),
    teal: makeBadge(CultureTokens.teal + '20', CultureTokens.teal),
    coral: makeBadge(CultureTokens.coral + '18', CultureTokens.coral),
    free: makeBadge(colors.success + '15', colors.success),
    new: makeBadge(CultureTokens.coral, '#FFFFFF'),
    category: (category) => {
      const color = CategoryColors[category];
      return makeBadge(color + '20', color);
    },
    entity: (entityType) => {
      const color = EntityTypeColors[entityType];
      return makeBadge(color + '18', color);
    },
  };
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export type AvatarSize = keyof typeof AvatarTokens.size;

export interface AvatarStyleSet {
  xs: ReturnType<typeof StyleSheet.create>[string];
  sm: ReturnType<typeof StyleSheet.create>[string];
  md: ReturnType<typeof StyleSheet.create>[string];
  lg: ReturnType<typeof StyleSheet.create>[string];
  xl: ReturnType<typeof StyleSheet.create>[string];
  xxl: ReturnType<typeof StyleSheet.create>[string];
  placeholder: (size: AvatarSize) => ReturnType<typeof StyleSheet.create>[string];
  label: (size: AvatarSize) => ReturnType<typeof StyleSheet.create>[string];
}

export function makeAvatarStyles(colors: ColorTheme): AvatarStyleSet {
  const make = (size: AvatarSize) => ({
    width: AvatarTokens.size[size],
    height: AvatarTokens.size[size],
    borderRadius: AvatarTokens.radius,
    backgroundColor: colors.primaryGlow,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  return {
    xs: make('xs'),
    sm: make('sm'),
    md: make('md'),
    lg: make('lg'),
    xl: make('xl'),
    xxl: make('xxl'),
    placeholder: (size) => ({
      ...make(size),
      backgroundColor: colors.primary + '20',
    }),
    label: (size) => ({
      ...TextStyles.badge,
      fontSize: AvatarTokens.fontSize[size],
      color: colors.primary,
    }),
  };
}

// ---------------------------------------------------------------------------
// Screen / layout containers
// ---------------------------------------------------------------------------

export interface ScreenStyleSet {
  /** Full-screen safe container */
  screen: ReturnType<typeof StyleSheet.create>[string];
  /** Padded scrollable content area */
  content: ReturnType<typeof StyleSheet.create>[string];
  /** Horizontal section padding */
  section: ReturnType<typeof StyleSheet.create>[string];
  /** Inline row with gap */
  row: ReturnType<typeof StyleSheet.create>[string];
  /** Divider line */
  divider: ReturnType<typeof StyleSheet.create>[string];
  /** Empty state container */
  emptyState: ReturnType<typeof StyleSheet.create>[string];
}

export function makeScreenStyles(colors: ColorTheme): ScreenStyleSet {
  return {
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.md,
    },
    section: {
      paddingHorizontal: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginVertical: Spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxxl,
      gap: Spacing.md,
    },
  };
}

// ---------------------------------------------------------------------------
// Section header (rail title + "See All" row)
// ---------------------------------------------------------------------------

export interface SectionHeaderStyleSet {
  row: ReturnType<typeof StyleSheet.create>[string];
  title: ReturnType<typeof StyleSheet.create>[string];
  seeAll: ReturnType<typeof StyleSheet.create>[string];
}

export function makeSectionHeaderStyles(colors: ColorTheme): SectionHeaderStyleSet {
  return {
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    title: {
      ...TextStyles.title3,
      color: colors.text,
      flex: 1,
    },
    seeAll: {
      ...TextStyles.label,
      color: colors.primary,
    },
  };
}

// ---------------------------------------------------------------------------
// Modal / bottom sheet
// ---------------------------------------------------------------------------

export interface ModalStyleSet {
  overlay: ReturnType<typeof StyleSheet.create>[string];
  sheet: ReturnType<typeof StyleSheet.create>[string];
  handle: ReturnType<typeof StyleSheet.create>[string];
  header: ReturnType<typeof StyleSheet.create>[string];
  title: ReturnType<typeof StyleSheet.create>[string];
}

export function makeModalStyles(colors: ColorTheme): ModalStyleSet {
  return {
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: ZIndex.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: Spacing.xxxl,
      ...Elevation[4],
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    title: {
      ...TextStyles.title3,
      color: colors.text,
    },
  };
}

// ---------------------------------------------------------------------------
// List / menu items
// ---------------------------------------------------------------------------

export interface ListItemStyleSet {
  row: ReturnType<typeof StyleSheet.create>[string];
  rowDestructive: ReturnType<typeof StyleSheet.create>[string];
  iconContainer: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
  labelDestructive: ReturnType<typeof StyleSheet.create>[string];
  sublabel: ReturnType<typeof StyleSheet.create>[string];
  separator: ReturnType<typeof StyleSheet.create>[string];
}

export function makeListItemStyles(colors: ColorTheme): ListItemStyleSet {
  return {
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
      backgroundColor: colors.surface,
    },
    rowDestructive: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
      backgroundColor: colors.surface,
    },
    iconContainer: {
      width: IconSize.xl,
      height: IconSize.xl,
      borderRadius: Radius.sm,
      backgroundColor: colors.primaryGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...TextStyles.body,
      color: colors.text,
      flex: 1,
    },
    labelDestructive: {
      ...TextStyles.body,
      color: colors.error,
      flex: 1,
    },
    sublabel: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: Spacing.md + IconSize.xl + Spacing.md,
    },
  };
}

// ---------------------------------------------------------------------------
// Status / empty / loading states
// ---------------------------------------------------------------------------

export interface StateStyleSet {
  loadingContainer: ReturnType<typeof StyleSheet.create>[string];
  errorContainer: ReturnType<typeof StyleSheet.create>[string];
  errorTitle: ReturnType<typeof StyleSheet.create>[string];
  errorBody: ReturnType<typeof StyleSheet.create>[string];
  emptyTitle: ReturnType<typeof StyleSheet.create>[string];
  emptyBody: ReturnType<typeof StyleSheet.create>[string];
}

export function makeStateStyles(colors: ColorTheme): StateStyleSet {
  return {
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxxl,
    },
    errorContainer: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxxl,
      gap: Spacing.md,
    },
    errorTitle: {
      ...TextStyles.title3,
      color: colors.error,
      textAlign: 'center',
    },
    errorBody: {
      ...TextStyles.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyTitle: {
      ...TextStyles.title3,
      color: colors.text,
      textAlign: 'center',
    },
    emptyBody: {
      ...TextStyles.callout,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  };
}

// ---------------------------------------------------------------------------
// Full theme factory object
// ---------------------------------------------------------------------------

export interface ThemeFactory {
  card: CardStyleSet;
  button: ButtonStyleSet;
  pill: PillStyleSet;
  input: InputStyleSet;
  chip: ChipStyleSet;
  badge: BadgeStyleSet;
  avatar: AvatarStyleSet;
  screen: ScreenStyleSet;
  sectionHeader: SectionHeaderStyleSet;
  modal: ModalStyleSet;
  listItem: ListItemStyleSet;
  state: StateStyleSet;
  /** Convenience: current color theme */
  colors: ColorTheme;
}

/**
 * Build a complete ThemeFactory from a ColorTheme.
 * Pure function — call from `useThemeFactory()` or test utilities.
 */
export function buildThemeFactory(colors: ColorTheme): ThemeFactory {
  return {
    card: makeCardStyles(colors),
    button: makeButtonStyles(colors),
    pill: makePillStyles(colors),
    input: makeInputStyles(colors),
    chip: makeChipStyles(colors),
    badge: makeBadgeStyles(colors),
    avatar: makeAvatarStyles(colors),
    screen: makeScreenStyles(colors),
    sectionHeader: makeSectionHeaderStyles(colors),
    modal: makeModalStyles(colors),
    listItem: makeListItemStyles(colors),
    state: makeStateStyles(colors),
    colors,
  };
}

// ---------------------------------------------------------------------------
// React hook — primary usage in components
// ---------------------------------------------------------------------------

/**
 * Returns a complete set of theme-aware style factories for the active theme.
 *
 * @example
 * const tf = useThemeFactory();
 * return (
 *   <Pressable style={tf.button.primary.md.container}>
 *     <Text style={tf.button.primary.md.label}>Book Now</Text>
 *   </Pressable>
 * );
 */
export function useThemeFactory(): ThemeFactory {
  const colors = useColors();
  return buildThemeFactory(colors);
}
