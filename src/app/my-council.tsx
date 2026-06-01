import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { LinearGradient } from 'expo-linear-gradient';

import { useCouncil } from '@/hooks/useCouncil';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { modulesApi } from '@/modules/api';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { Button } from '@/design-system/ui/Button';
import { CultureTokens, Spacing, FontFamily, FontSize, CardTokens, shadows } from '@/design-system/tokens/theme';
import { EVENT_CATEGORIES, type EventCategory } from '@/constants/eventCategories';
import type { EventData } from '@/shared/schema';
import EventCard from '@/modules/events/components/EventCard';

const isWeb = Platform.OS === 'web';

type HubLink = {
  id: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function MyCouncilScreen() {
  const colors = useColors();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const { hPad, isDesktop } = useLayout();
  const { state } = useOnboarding();
  const { council, councilId, lgaCode, isLoading: councilLoading, isAuthenticated } = useCouncil();

  const pushCouncilEvents = useCallback(
    (extra?: { category?: EventCategory }) => {
      if (!lgaCode && !councilId) return;
      router.push({
        pathname: '/events',
        params: {
          ...(lgaCode ? { lgaCode } : {}),
          ...(councilId ? { councilId } : {}),
          ...(extra?.category ? { category: extra.category } : {}),
        },
      });
    },
    [lgaCode, councilId],
  );

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['my-council', 'events-preview', lgaCode, councilId, state.city],
    queryFn: () =>
      modulesApi.events.list({
        lgaCode: lgaCode || undefined,
        councilId: councilId || undefined,
        city: state.city || undefined,
        country: state.country || undefined,
        page: 1,
        pageSize: 10,
      }),
    enabled: Boolean(lgaCode || councilId),
  });

  const previewEvents: EventData[] = useMemo(
    () => (previewData?.events ? previewData.events.slice(0, 6) : []),
    [previewData],
  );

  const citySlug = state.city?.trim();
  const locationLinks: HubLink[] = useMemo(() => {
    const links: HubLink[] = [
      {
        id: 'events',
        label: 'Events',
        sub: 'Ticketed & free in your LGA',
        icon: 'calendar-outline',
        onPress: () => pushCouncilEvents(),
      },
    ];
    if (citySlug) {
      links.push(
        {
          id: 'city',
          label: 'Culture & language',
          sub: `Heritage hub · ${citySlug}`,
          icon: 'globe-outline',
          onPress: () => router.push(`/city/${encodeURIComponent(citySlug)}` as never),
        },
        {
          id: 'artists',
          label: 'Artists',
          sub: 'Directory profiles',
          icon: 'color-palette-outline',
          onPress: () => router.push('/(tabs)/directory'),
        },
      );
    } else {
      links.push({
        id: 'artists',
        label: 'Artists',
        sub: 'Directory',
        icon: 'color-palette-outline',
        onPress: () => router.push('/(tabs)/directory'),
      });
    }
    links.push(
      {
        id: 'movies',
        label: 'Movies',
        sub: 'Cinema from your city',
        icon: 'film-outline',
        onPress: () => router.push('/movies'),
      },
      {
        id: 'dining',
        label: 'Dining',
        sub: 'Restaurants near you',
        icon: 'restaurant-outline',
        onPress: () => router.push('/restaurants'),
      },
      {
        id: 'activities',
        label: 'Activities',
        sub: 'Tours & experiences',
        icon: 'compass-outline',
        onPress: () => router.push('/a'),
      },
      {
        id: 'shopping',
        label: 'Shopping',
        sub: 'Retail & markets',
        icon: 'bag-outline',
        onPress: () => router.push('/shopping'),
      },
      {
        id: 'offers',
        label: 'Offers',
        sub: 'Perks & member deals',
        icon: 'pricetag-outline',
        onPress: () => router.push('/perks'),
      },
      {
        id: 'directory',
        label: 'Directory',
        sub: 'Venues, businesses & communities',
        icon: 'grid-outline',
        onPress: () => router.push('/(tabs)/directory'),
      },
      {
        id: 'search',
        label: 'Search',
        sub: 'Find anything local',
        icon: 'search-outline',
        onPress: () => router.push('/search'),
      },
      {
        id: 'map',
        label: 'Map',
        sub: 'Browse on a map',
        icon: 'map-outline',
        onPress: () => router.push('/map'),
      },
      {
        id: 'indigenous',
        label: 'Indigenous',
        sub: 'Events & experiences',
        icon: 'leaf-outline',
        onPress: () => router.push({ pathname: '/explore', params: { focus: 'indigenous' } }),
      },
    );
    return links;
  }, [citySlug, pushCouncilEvents]);

  const hasCouncil = Boolean(council?.name);

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>
        <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider }]}>
          <BackButton fallback="/(tabs)" style={[styles.backBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]} />
          <Text style={[styles.title, { color: colors.text }]}>My council</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad, paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[`${CultureTokens.teal}22`, `${CultureTokens.indigo}14`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: colors.borderLight }]}
          >
            <Ionicons name="location" size={28} color={CultureTokens.teal} />
            {councilLoading ? (
              <Text style={[styles.heroTitle, { color: colors.text }]}>Finding your council…</Text>
            ) : hasCouncil ? (
              <>
                <Text style={[styles.heroTitle, { color: colors.text }]}>{council!.name}</Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                  {council!.suburb ? `${council!.suburb}, ` : ''}
                  {council!.state}
                  {lgaCode ? ` · LGA ${lgaCode}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.heroTitle, { color: colors.text }]}>Council not set yet</Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                  {isAuthenticated
                    ? 'Choose your city in onboarding or pick a council in Settings so we can match local listings.'
                    : 'Set your Australian city to see which local government area you are in.'}
                </Text>
              </>
            )}
            <Button
              variant="secondary"
              size="md"
              onPress={() => router.push(isAuthenticated ? '/settings/location' : '/(onboarding)/location')}
              accessibilityLabel={isAuthenticated ? 'Open location settings' : 'Set your location'}
              style={{ marginTop: Spacing.md }}
            >
              {isAuthenticated ? 'Update in Settings' : 'Set location'}
            </Button>
          </LinearGradient>

          {hasCouncil && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by category</Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Event listings tagged with your LGA
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {EVENT_CATEGORIES.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => pushCouncilEvents({ category: c.id })}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        borderColor: colors.borderLight,
                        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Events in council: ${c.id}`}
                  >
                    <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={16} color={CultureTokens.indigo} />
                    <Text style={[styles.chipLabel, { color: colors.text }]} numberOfLines={1}>
                      {c.id}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
                Happening in your council
              </Text>
              {previewLoading ? (
                <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.regular }}>Loading events…</Text>
              ) : previewEvents.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.regular }}>
                  No published events with an LGA match yet — try CultureX or widen to your city.
                </Text>
              ) : (
                <View style={isDesktop ? styles.previewGridDesktop : styles.previewCol}>
                  {previewEvents.map((ev) => (
                    <View key={ev.id} style={styles.previewCardWrap}>
                      <EventCard event={ev} />
                    </View>
                  ))}
                </View>
              )}
              <Button variant="primary" size="lg" fullWidth onPress={() => pushCouncilEvents()} style={{ marginTop: Spacing.md }}>
                See all council events
              </Button>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
            Explore locally
          </Text>
          <View style={styles.linkGrid}>
            {locationLinks.map((link) => (
              <Pressable
                key={link.id}
                onPress={link.onPress}
                style={({ pressed }) => [
                  styles.linkCard,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                    ...(!isWeb ? shadows.small : {}),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={link.label}
              >
                <View style={[styles.linkIconWrap, { backgroundColor: `${CultureTokens.teal}18` }]}>
                  <Ionicons name={link.icon} size={22} color={CultureTokens.teal} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={2}>
                    {link.label}
                  </Text>
                  <Text style={[styles.linkSub, { color: colors.textSecondary }]} numberOfLines={2}>
                    {link.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.title3 },
  scroll: { paddingTop: Spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hero: {
    borderRadius: CardTokens.radius + 8,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.title2, marginTop: Spacing.sm },
  heroSub: { fontFamily: FontFamily.regular, fontSize: FontSize.body2, marginTop: 6, lineHeight: 22 },
  sectionTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.body },
  sectionHint: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 4, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 280,
  },
  chipLabel: { fontFamily: FontFamily.medium, fontSize: 12 },
  previewCol: { gap: Spacing.md },
  previewGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  previewCardWrap: { flex: 1, minWidth: 260, maxWidth: 360 },
  linkGrid: { gap: 10, marginTop: Spacing.sm },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  linkIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  linkSub: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
});
