import React from 'react';
import { Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { CultureTokens, FontFamily, type ColorTheme } from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';
import { TextStyles } from '@/design-system/tokens/typography';
import { GlassView } from '@/design-system/ui/GlassView';

/** Text on photographic heroes — do not use `colors.textOnBrandGradient` (dark ink) here. */
export const CITY_HERO_FG = '#FFFFFF';
export const CITY_HERO_FG_SOFT = 'rgba(255,255,255,0.9)';
export const CITY_HERO_FG_MUTED = 'rgba(255,255,255,0.78)';
export const CITY_HERO_BADGE_ON_GOLD = '#0F172A';

/** Heritage chrome over photographic heroes — wordmark blue + indigo depth */
export const CITY_HERO_CHROME_MATERIAL = 'rgba(227,106,78,0.38)';
export const CITY_HERO_CHROME_MATERIAL_TRACK = 'rgba(74,94,191,0.32)';
export const CITY_HERO_CHROME_MATERIAL_BORDER = 'rgba(255,255,255,0.28)';

const heroReadableShadow = Platform.select({
  web: { textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 16px rgba(0,0,0,0.55)' } as const,
  ios: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  android: {},
  default: {},
});

export const cityAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFill, opacity: 0.06 },
});

export function StatPill({
  icon,
  value,
  label,
  colors,
  color,
  onPress,
  compact = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  colors?: any;
  color?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  const accent = color || (colors ? colors.primary : CultureTokens.indigo);

  const inner = (
    <GlassView
      intensity={10}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact ? 5 : 8,
        backgroundColor: accent + '15',
        paddingHorizontal: compact ? 10 : 16,
        paddingVertical: compact ? 4 : 8,
        borderRadius: compact ? 10 : 16,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: accent + '30',
      }}
    >
      {icon && <Ionicons name={icon} size={compact ? 12 : 16} color={accent} />}
      <Text style={{ fontFamily: FontFamily.bold, fontSize: compact ? 12 : 14, color: accent, lineHeight: compact ? 14 : 18 }}>
        {value}
      </Text>
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: compact ? 10 : 11,
          color: accent,
          opacity: 0.9,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          lineHeight: compact ? 14 : 16,
        }}
      >
        {label}
      </Text>
    </GlassView>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
    >
      {inner}
    </Pressable>
  );
}

export function getCityDestinationStyles(
  colors: ColorTheme,
  insets: EdgeInsets,
  isDesktop: boolean,
  gridGap: number,
) {
  return StyleSheet.create({
    root: { flex: 1 },
    shell: { flex: 1 },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
    },
    content: { flexGrow: 1 },
    scroll: { paddingBottom: 40 },

    hero: { height: 400, position: 'relative', overflow: 'hidden' },
    heroImage: { ...StyleSheet.absoluteFill },
    heroTopBar: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    heroGlassCircleInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: CITY_HERO_CHROME_MATERIAL,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: CITY_HERO_CHROME_MATERIAL_BORDER,
      ...Platform.select({
        web: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
        } as const,
        default: {},
      }),
    },
    heroIconHit: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
    },
    heroGlassChipShell: { maxWidth: '58%' },
    heroGlassChipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: CITY_HERO_CHROME_MATERIAL_TRACK,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: CITY_HERO_CHROME_MATERIAL_BORDER,
      ...Platform.select({
        web: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        } as const,
        default: {},
      }),
    },
    chipText: {
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
      color: CITY_HERO_FG,
      ...heroReadableShadow,
    },

    heroContent: {
      paddingHorizontal: 24,
      paddingBottom: 36,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    heroBadge: {
      backgroundColor: CultureTokens.gold,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 10,
    },
    heroBadgeText: {
      fontSize: 10,
      fontFamily: 'Poppins_700Bold',
      letterSpacing: 1,
      color: CITY_HERO_BADGE_ON_GOLD,
    },
    heroCity: {
      ...TextStyles.display,
      fontSize: 52,
      lineHeight: 58,
      textAlign: 'center',
      color: CITY_HERO_FG,
      ...heroReadableShadow,
    },
    stateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 6 },
    stateText: {
      color: CITY_HERO_FG_SOFT,
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
      ...heroReadableShadow,
    },
    heroSubtitle: {
      ...TextStyles.callout,
      color: CITY_HERO_FG_SOFT,
      maxWidth: '92%',
      textAlign: 'center',
      ...heroReadableShadow,
    },

    statsStrip: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    statDivider: { width: 1, marginVertical: 10 },

    filterBar: {
      zIndex: 5,
      width: '100%',
    },
    filterBarGlassInner: {
      paddingBottom: 8,
    },
    modeTabs: {
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 0,
      flexDirection: 'row',
    },
    modeTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 4,
      borderRadius: 20, // reworked for glass segmented pill per DESIGN_MANUAL.md
      borderBottomWidth: 0,
    },
    modeTabActive: {
      backgroundColor: colors.primary, // emerald/violet active fill with glass
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    modeTabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    modeBadge: {
      backgroundColor: colors.primary, // violet/emerald badge per reworked buttons
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    modeBadgeText: { color: colors.textInverse, fontSize: 10, fontFamily: 'Poppins_700Bold' },
    clearAllTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginLeft: 8,
    },

    section: { paddingHorizontal: 20, paddingTop: 28 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    clearBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    clearBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

    trendingCard: {
      width: 280,
      height: 180,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      ...Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } as any,
        default: { elevation: 3 },
      }),
    },
    trendingImage: { ...StyleSheet.absoluteFill },
    trendingInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 3 },
    trendingCategoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.35)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginBottom: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    trendingCategoryText: {
      color: CITY_HERO_FG,
      fontSize: 10,
      fontFamily: 'Poppins_600SemiBold',
      ...heroReadableShadow,
    },
    trendingTitle: {
      color: CITY_HERO_FG,
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      lineHeight: 19,
      ...heroReadableShadow,
    },
    trendingDate: {
      color: CITY_HERO_FG_MUTED,
      fontSize: 11,
      fontFamily: 'Poppins_400Regular',
      ...heroReadableShadow,
    },

    venueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    venueCard: {
      width: isDesktop ? '31%' : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 12,
    },
    venueIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: CultureTokens.indigo + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    venueName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    venueCategory: { fontSize: 12, color: colors.textTertiary, fontFamily: 'Poppins_400Regular' },

    mapCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderLight,
      backgroundColor: colors.surfaceElevated,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    mapCardText: { fontSize: 14, fontFamily: FontFamily.semibold, color: colors.text },

    tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    tagPillText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
      justifyContent: isDesktop ? 'flex-start' : 'center',
    },

    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap },
    skeletonCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      opacity: 0.6,
    },

    emptyState: { height: 320, alignItems: 'center', justifyContent: 'center', gap: 16 },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 },
    retryButton: {
      marginTop: 18,
      backgroundColor: CultureTokens.indigo,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: Radius.full,
      shadowColor: CultureTokens.indigo,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    retryText: {
      color: colors.textOnBrandGradient,
      fontFamily: FontFamily.bold,
      fontSize: 16,
      letterSpacing: 0.2,
    },

    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      backgroundColor: CultureTokens.indigo,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 30,
      ...Platform.select({
        web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.28)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
        },
      }),
    },
    fabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  });
}
