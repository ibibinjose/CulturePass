/**
 * Community topic picker — first step of the "Start a community" flow.
 * User picks a category, then the listing wizard opens with it pre-selected.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { LISTING_CREATE_ROUTE } from '@/constants/navigation/experienceNav';
import { COMMUNITY_CATEGORIES } from '@/modules/communities/components/create/types';
import type { CommunityCategory } from '@/shared/schema';

const ACCENT: Record<CommunityCategory, string> = {
  cultural:       CultureTokens.violet,
  local_community: CultureTokens.teal,
  arts_sports_club: CultureTokens.coral,
  business:       CultureTokens.indigo,
  brand:          '#F59E0B',
  professional:   CultureTokens.indigo,
  club:           CultureTokens.violet,
  charity:        '#EF4444',
  council:        CultureTokens.teal,
};

export default function CommunityTopicPickerScreen() {
  const colors  = useColors();
  const safeInsets = useSafeAreaInsetsWeb();
  const { hPad, isDesktop, isTablet, columnWidth, columnGap } = useLayout();
  const topInset    = safeInsets.top;
  const bottomInset = Math.max(safeInsets.bottom, 24);

  const cols      = isDesktop ? 3 : isTablet ? 3 : 2;
  const cardWidth = columnWidth(cols);

  function handlePick(category: CommunityCategory) {
    router.push(
      `${LISTING_CREATE_ROUTE}?listingEntityType=community&communityCategory=${encodeURIComponent(category)}` as never,
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={[CultureTokens.violet, CultureTokens.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: topInset + 16, paddingHorizontal: hPad, paddingBottom: 28 }]}
      >
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(tabs)/community' as never)
          }
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        <View style={s.headerContent}>
          <View style={s.eyebrowRow}>
            <Ionicons name="people-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={s.eyebrow}>Start a community</Text>
          </View>
          <Text style={s.title}>What will your community{'\n'}be about?</Text>
          <Text style={s.subtitle}>
            Choose a topic to help CulturePass Explorers discover your community
          </Text>
        </View>
      </LinearGradient>

      {/* Category grid */}
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingHorizontal: hPad, paddingBottom: bottomInset + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.grid, { gap: columnGap }]}>
          {COMMUNITY_CATEGORIES.map((cat) => {
            const accent = ACCENT[cat.value as CommunityCategory] ?? CultureTokens.indigo;
            return (
              <Pressable
                key={cat.value}
                onPress={() => handlePick(cat.value as CommunityCategory)}
                style={({ pressed }) => [
                  s.card,
                  {
                    width: cardWidth,
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
              >
                <View style={[s.iconWrap, { backgroundColor: accent + '1A' }]}>
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={26} color={accent} />
                </View>
                <Text style={[s.cardLabel, { color: colors.text }]} numberOfLines={2}>
                  {cat.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textTertiary}
                  style={s.cardArrow}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: { gap: 0 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 20,
  },
  headerContent: { gap: 10 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#fff',
    lineHeight: 33,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },

  scroll: { paddingTop: 20 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: 12,
    alignItems: 'flex-start',
    minHeight: 120,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 20,
    flexShrink: 1,
  },
  cardArrow: { alignSelf: 'flex-end' },
});
