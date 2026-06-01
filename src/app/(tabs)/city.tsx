/**
 * My City tab — personalized view of the user's home city.
 *
 * Refined for Material 3 Expressive Design.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { M3CommunityCard } from '@/modules/communities/components/M3CommunityCard';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { M3Button, M3Card, M3FilterChip, M3SectionHeader, Skeleton } from '@/design-system/ui';
import {
  communityKeys,
  useCommunities,
  useFollowingCommunityIds,
  useJoinedCommunities,
} from '@/modules/communities/hooks/useCommunities';
import { useCityPage, LISTING_TYPE_ROWS, type ListingTypeKey, type ExploreCategoryKey } from '@/hooks/useCityPage';
import { PopularEventsRail } from '@/components/city/PopularEventsRail';
import { CultureTokens } from '@/design-system/tokens/colors';
import { M3Typography, Radius, gradients, FontFamily } from '@/design-system/tokens/theme';
import { useSaved } from '@/contexts/SavedContext';
import type { Community, EventData } from '@/shared/schema';
import { CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { APP_NAME } from '@/lib/app-meta';
import { withAlpha } from '@/lib/withAlpha';
import { createCitySession, backToHomeCity, type CityTabState } from '@/lib/city-utils';

const MY_CITY_HEAD_TITLE = `My city · ${APP_NAME}`;
const MY_CITY_HEAD_DESC = 'Your home city on CulturePass — events, communities, and culture near you.';

const ORBIT_CARD_W = 260;
const COMMUNITY_CARD_W = 280;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXPLORE_CATEGORY_LINKS: readonly {
  key: ExploreCategoryKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'movies', label: 'Movies', icon: 'film-outline' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline' },
  { key: 'activities', label: 'Activities', icon: 'compass-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { key: 'offers', label: 'Offers', icon: 'pricetag-outline' },
  { key: 'artists', label: 'Artists', icon: 'color-palette-outline' },
  { key: 'directory', label: 'Directory', icon: 'grid-outline' },
  { key: 'indigenous', label: 'Indigenous', icon: 'leaf-outline' },
];

function normPlace(v: string | undefined) {
  return (v ?? '').trim().toLowerCase();
}

function communitiesForIds(all: Community[], ids: string[]): Community[] {
  const map = new Map(all.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Community[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  onPress?: () => void;
  color: string;
}) {
  const m3Colors = useM3Colors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.statPill,
        { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant },
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[s.statIcon, { backgroundColor: withAlpha(color, 0.12) }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={s.statText}>
        <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface }]}>{value}</Text>
        <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function EmptyOrbitCard({ onDiscover }: { onDiscover: () => void }) {
  const m3Colors = useM3Colors();
  return (
    <M3Card variant="filled" style={s.emptyOrbitCard}>
      <View style={[s.emptyOrbitIcon, { backgroundColor: m3Colors.primaryContainer }]}>
        <Ionicons name="people-outline" size={24} color={m3Colors.onPrimaryContainer} />
      </View>
      <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface, textAlign: 'center' }]}>Connect with hubs</Text>
      <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
        Join communities to see their upcoming events in your personalized orbit.
      </Text>
      <M3Button variant="tonal" onPress={onDiscover} style={{ marginTop: 8 }}>Find Hubs</M3Button>
    </M3Card>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function MyCityScreen() {
  const m3Colors = useM3Colors();
  const { hPad, tabBarHeight, windowSizeClass, isExpanded } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const { state: onboarding } = useOnboarding();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const cityName = onboarding?.city ?? 'Sydney';
  const cityCountry = onboarding?.country ?? 'Australia';

  // Cross-city session state — homeCity is immutable (Req 7.2)
  const [citySession, setCitySession] = React.useState<CityTabState>(() =>
    createCitySession(cityName),
  );
  const effectiveCity = citySession.viewingCity ?? cityName;
  const isViewingNonHome = effectiveCity !== cityName;

  const handleBackToHome = useCallback(() => {
    setCitySession((prev) => backToHomeCity(prev));
  }, []);

  const page = useCityPage(effectiveCity, cityCountry);
  const { isCitySubscribed, toggleSubscribeCity } = useSaved();
  const subscribed = isCitySubscribed(cityName, cityCountry);

  const { data: allCommunities = [] } = useCommunities();
  const { data: joinedData } = useJoinedCommunities();
  const { data: followingIds = [] } = useFollowingCommunityIds();

  const joinedIds = useMemo(() => joinedData?.communityIds ?? [], [joinedData]);
  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds]);
  const orbitIds = useMemo(() => Array.from(new Set([...joinedIds, ...followingIds])), [joinedIds, followingIds]);
  const orbitSet = useMemo(() => new Set(orbitIds), [orbitIds]);

  const joinedCommunities = useMemo(() => communitiesForIds(allCommunities, joinedIds), [allCommunities, joinedIds]);
  const exploreNearby = useMemo(() => {
    const cn = normPlace(cityName);
    const cc = normPlace(cityCountry);
    return allCommunities
      .filter((c: Community) => normPlace(c.city) === cn && normPlace(c.country) === cc && !joinedSet.has(c.id))
      .slice(0, 12);
  }, [allCommunities, cityName, cityCountry, joinedSet]);

  const [activeExploreCategory, setActiveExploreCategory] = React.useState<ExploreCategoryKey>('events');

  const cultureXEventCount = useMemo(() => {
    const cx = CULTUREX_EXPLORES_CULTURE_TAG.toLowerCase();
    return page.allEvents.filter((e) => {
      const tags = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
      return tags.some((t) => String(t).toLowerCase() === cx);
    }).length;
  }, [page.allEvents]);

  const { data: orbitEvents = [] } = useQuery({
    queryKey: ['my-city', 'orbit', cityName, cityCountry, orbitIds.sort().join(',')],
    queryFn: async () => {
      if (orbitIds.length === 0) return [];
      const res = await modulesApi.events.list({ city: cityName, country: cityCountry, pageSize: 60 });
      return (res.events ?? [])
        .filter((e) => (e.communityId && orbitSet.has(e.communityId)) || (e.publisherProfileId && orbitSet.has(e.publisherProfileId)))
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
        .slice(0, 24);
    },
    enabled: orbitIds.length > 0,
  });

  const onRefresh = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([
      page.onRefresh(),
      queryClient.invalidateQueries({ queryKey: communityKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['my-city'] }),
    ]);
  }, [page, queryClient]);

  const handleSubscribe = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', `Sign in to sync ${cityName} subscriptions.`);
      return;
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    toggleSubscribeCity(cityName, cityCountry);
  }, [cityName, cityCountry, isAuthenticated, toggleSubscribeCity]);

  const firstName = user?.displayName?.split(' ')[0] ?? user?.username ?? null;

  const railChips = page.filterOptions.map((opt) => ({
    id: opt,
    label: opt,
    active: page.activeFilters.includes(opt),
    onPress: () => page.onToggleFilter(opt),
  }));

  const openListingTypeResults = useCallback(
    (listingType: ListingTypeKey) => {
      const hubQuery = encodeURIComponent(cityName);
      const routes: Record<ListingTypeKey, string> = {
        event: `/events`,
        festival: `/search?q=${encodeURIComponent(`${cityName} festival`)}`,
        concert: `/search?q=${encodeURIComponent(`${cityName} concert`)}`,
        workshop: `/search?q=${encodeURIComponent(`${cityName} workshop`)}`,
        movie: `/movies`,
        dining: `/restaurants`,
        shopping: `/shopping`,
        activity: `/a`,
        professional: `/search?q=${encodeURIComponent(`${cityName} professional`)}`,
        organisation: `/search?q=${encodeURIComponent(`${cityName} organisation`)}`,
        business: `/directory`,
        artist: `/search?q=${encodeURIComponent(`${cityName} artist`)}`,
        perk: `/perks`,
      };
      const route = routes[listingType];
      if (route.includes('?q=')) {
        router.push(route as never);
        return;
      }
      const suffix = route.includes('?') ? '&' : '?';
      router.push(`${route}${suffix}q=${hubQuery}` as never);
    },
    [cityName],
  );

  const filteredEventsByExplore = useMemo(() => {
    const includesAny = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n));
    return page.filteredEvents.filter((e) => {
      const blob = `${e.category ?? ''} ${(e.tags ?? []).join(' ')} ${(e.cultureTag ?? []).join(' ')} ${(e.cultureTags ?? []).join(' ')}`.toLowerCase();
      switch (activeExploreCategory) {
        case 'events':
          return true;
        case 'movies':
          return includesAny(blob, ['movie', 'film', 'cinema', 'screening']);
        case 'activities':
          return includesAny(blob, ['activity', 'tour', 'experience', 'workshop', 'class']);
        case 'offers':
          return includesAny(blob, ['offer', 'deal', 'discount', 'free', 'perk']);
        case 'indigenous':
          return includesAny(blob, ['indigenous', 'aboriginal', 'first nations', 'torres strait']);
        case 'artists':
          return includesAny(blob, ['artist', 'music', 'dance', 'creative', 'performance', 'concert']);
        default:
          return true;
      }
    });
  }, [activeExploreCategory, page.filteredEvents]);

  const numCols = windowSizeClass === 'expanded' ? 3 : windowSizeClass === 'medium' ? 2 : 1;
  const { contentWidth } = useLayout();

  return (
    <ErrorBoundary>
      <Head>
        <title>{MY_CITY_HEAD_TITLE}</title>
        <meta name="description" content={MY_CITY_HEAD_DESC} />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.root, { backgroundColor: m3Colors.background }]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: tabBarHeight + safeInsets.bottom + 40 },
            Platform.OS === 'web' && isExpanded && { width: contentWidth, alignSelf: 'center' }
          ]}
          stickyHeaderIndices={[3]}
          refreshControl={
            <RefreshControl refreshing={page.refreshing} onRefresh={onRefresh} tintColor={m3Colors.primary} />
          }
        >
          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <View style={[s.hero, { height: isExpanded ? 520 : 440 }]}>
            <Image source={{ uri: page.heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Nav */}
            <View style={[s.heroNav, { paddingTop: topInset + 16, paddingHorizontal: hPad }]}>
              <M3Button
                variant="tonal"
                leftIcon={isViewingNonHome ? 'home-outline' : 'share-social-outline'}
                onPress={isViewingNonHome ? handleBackToHome : () => {}}
                style={s.heroNavBtn}
              />
              <View style={s.heroNavCenter}>
                <Pressable
                  onPress={() => router.push('/cities')}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                >
                  <M3Card variant="elevated" style={[s.locPill, { gap: 8, paddingRight: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location" size={14} color={m3Colors.primary} />
                      <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface }]} numberOfLines={1}>
                        {effectiveCity}
                      </Text>
                    </View>
                    <View style={{ width: 1, height: 14, backgroundColor: m3Colors.outlineVariant }} />
                    <Text style={[M3Typography.labelMedium, { color: m3Colors.primary, fontFamily: FontFamily.bold }]}>
                      Explore
                    </Text>
                  </M3Card>
                </Pressable>
              </View>
              <M3Button
                variant="tonal"
                leftIcon="settings-outline"
                onPress={() => router.push('/settings')}
                style={s.heroNavBtn}
              />
            </View>

            {/* Content */}
            <View style={[s.heroContent, { paddingHorizontal: hPad }]}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <View
                  style={[
                    s.heroBadge,
                    {
                      backgroundColor: isViewingNonHome
                        ? m3Colors.secondaryContainer
                        : m3Colors.primaryContainer,
                    },
                  ]}
                >
                  <Text
                    style={[
                      M3Typography.labelSmall,
                      {
                        color: isViewingNonHome
                          ? m3Colors.onSecondaryContainer
                          : m3Colors.onPrimaryContainer,
                        letterSpacing: 1.5,
                      },
                    ]}
                  >
                    {isViewingNonHome ? 'EXPLORING' : 'MY CITY HUB'}
                  </Text>
                </View>
              </Animated.View>

              <Animated.Text entering={FadeInDown.delay(200).springify()} style={[M3Typography.displayLarge, { color: '#fff', textAlign: 'center' }]}>
                {cityName}
              </Animated.Text>

              <Animated.View entering={FadeInDown.delay(300).springify()} style={s.heroGreetingRow}>
                {isAuthenticated && firstName && !isViewingNonHome ? (
                  <Text style={[M3Typography.titleLarge, { color: '#fff', opacity: 0.9 }]}>
                    Welcome home, {firstName} 👋
                  </Text>
                ) : (
                  <Text style={[M3Typography.bodyLarge, { color: '#fff', opacity: 0.8, textAlign: 'center' }]}>
                    {page.meta.tagline}
                  </Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 24 }}>
                <M3Button
                  variant={subscribed ? 'tonal' : 'filled'}
                  leftIcon={subscribed ? 'notifications' : 'notifications-outline'}
                  onPress={handleSubscribe}
                >
                  {subscribed ? 'Subscribed' : 'Get Updates'}
                </M3Button>
              </Animated.View>
            </View>
          </View>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <View style={[s.statsStrip, { backgroundColor: m3Colors.surface, borderBottomColor: m3Colors.outlineVariant }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.statsContent, { paddingHorizontal: hPad, paddingRight: hPad + 40 }]}>
              <StatPill icon="calendar" value={page.allEvents.length} label="Events" color={m3Colors.primary} />
              <StatPill icon="people" value={joinedCommunities.length || '—'} label="Your Hubs" color={m3Colors.secondary} />
              <StatPill icon="globe" value={page.uniqueCultureTags.length} label="Cultures" color={m3Colors.tertiary} />
              <StatPill icon="sparkles" value={cultureXEventCount} label="CultureX" color={CultureTokens.coral} />
            </ScrollView>
          </View>



          {/* ── Sticky Filters ────────────────────────────────────────────── */}
          <View style={[s.stickyFilters, { backgroundColor: m3Colors.surface, borderBottomColor: m3Colors.outlineVariant }]}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                s.exploreRow,
                { paddingHorizontal: hPad, paddingVertical: 8, paddingRight: hPad + 32 },
              ]}
            >
              {EXPLORE_CATEGORY_LINKS.map((item) => {
                const active = activeExploreCategory === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setActiveExploreCategory(item.key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${item.label}`}
                    accessibilityState={{ selected: active }}
                  >
                    {active ? (
                      <LinearGradient
                        colors={gradients.culturepassBrand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.exploreChipGradient}
                      >
                        <Ionicons name={item.icon} size={14} color="#fff" />
                        <Text style={s.exploreChipOnGradient}>{item.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          s.exploreChipIdle,
                          {
                            backgroundColor: m3Colors.surfaceVariant,
                            borderColor: m3Colors.outlineVariant,
                          },
                        ]}
                      >
                        <Ionicons name={item.icon} size={14} color={m3Colors.onSurfaceVariant} />
                        <Text style={[s.exploreChipIdleText, { color: m3Colors.onSurfaceVariant }]}>
                          {item.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 8, paddingVertical: 12, paddingRight: hPad + 40 }}>
              {railChips.map((chip) => (
                <M3FilterChip key={chip.id} label={chip.label} selected={chip.active} onPress={chip.onPress} />
              ))}
            </ScrollView>
          </View>

          {/* ── Orbit Section ────────────────────────────────────────────── */}
          {page.totalActiveFilters === 0 && (
            <Animated.View entering={FadeInDown.delay(500)} style={s.section}>
              <View style={{ paddingHorizontal: hPad }}>
                <M3SectionHeader title="From Your Orbit" subtitle="Latest updates from your joined communities" onAction={() => router.push('/(tabs)/calendar')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 16, paddingVertical: 8, paddingRight: hPad + 40 }}>
                {orbitIds.length === 0 ? (
                  <EmptyOrbitCard onDiscover={() => router.push('/(tabs)/community')} />
                ) : orbitEvents.length === 0 ? (
                  <M3Card variant="filled" style={s.emptyOrbitCard}>
                    <Ionicons name="calendar-outline" size={32} color={m3Colors.onSurfaceVariant} />
                    <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>Quiet in your orbit</Text>
                    <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>No upcoming events found from your hubs today.</Text>
                  </M3Card>
                ) : (
                  orbitEvents.map((ev: EventData, i: number) => (
                    <View key={ev.id} style={{ width: ORBIT_CARD_W }}>
                      <M3EventCard event={ev} variant="elevated" />
                    </View>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Popular Rail ─────────────────────────────────────────────── */}
          {page.totalActiveFilters === 0 && (
            <Animated.View entering={FadeInDown.delay(600)} style={s.section}>
              <PopularEventsRail city={cityName} country={cityCountry} hPad={hPad} />
            </Animated.View>
          )}

          {/* ── Browse by Type ───────────────────────────────────────────── */}
          {page.totalActiveFilters === 0 && (
            <View style={s.section}>
              <View style={{ paddingHorizontal: hPad }}>
                <M3SectionHeader title="Browse by Type" subtitle="Explore your city's cultural listings" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 12, paddingVertical: 8, paddingRight: hPad + 40 }}>
                {LISTING_TYPE_ROWS.map((row) => (
                  <Pressable
                    key={row.key}
                    onPress={() => openListingTypeResults(row.key)}
                    style={({ pressed }) => [
                      {
                        width: 220,
                        borderWidth: 1.5,
                        borderColor: m3Colors.outlineVariant,
                        borderRadius: Radius.lg,
                        padding: 16,
                        backgroundColor: m3Colors.surfaceContainerLow,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${row.title} results`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]}>
                        {row.title}
                      </Text>
                      <View style={{ borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: m3Colors.primaryContainer }}>
                        <Text style={[M3Typography.labelSmall, { color: m3Colors.onPrimaryContainer, fontFamily: FontFamily.bold }]}>
                          {page.listingResultCounts[row.key]}
                        </Text>
                      </View>
                    </View>
                    <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>
                      {row.description}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Main Grid ─────────────────────────────────────────────────── */}
          <View style={[s.section, { paddingHorizontal: hPad }]}>
            <M3SectionHeader title={page.sectionTitle} subtitle={`${filteredEventsByExplore.length} items found`} onAction={page.totalActiveFilters > 0 ? page.clearAllFilters : undefined} actionLabel="Clear" />

            {page.isLoading ? (
              <View style={s.grid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[s.gridItem, { width: `${100 / numCols}%` as any }]}>
                    <Skeleton height={240} borderRadius={Radius.lg} />
                  </View>
                ))}
              </View>
            ) : filteredEventsByExplore.length === 0 ? (
              <M3Card variant="outlined" style={s.emptyGrid}>
                <Ionicons name="search-outline" size={48} color={m3Colors.onSurfaceVariant} />
                <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface }]}>No matches found</Text>
                <M3Button variant="filled" onPress={page.clearAllFilters}>Reset Filters</M3Button>
              </M3Card>
            ) : (
              <View style={s.grid}>
                {filteredEventsByExplore.map((ev, i) => (
                  <Animated.View key={ev.id} entering={FadeInDown.delay(i * 50).springify()} style={[s.gridItem, { width: `${100 / numCols}%` as any }]}>
                    <M3EventCard event={ev} variant="filled" />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* ── Community Discovery ──────────────────────────────────────── */}
          {page.totalActiveFilters === 0 && exploreNearby.length > 0 && (
            <View style={s.section}>
              <View style={{ paddingHorizontal: hPad }}>
                <M3SectionHeader title="Nearby Hubs" subtitle="Connect with local groups" onAction={() => router.push('/(tabs)/community')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 16, paddingVertical: 8, paddingRight: hPad + 40 }}>
                {exploreNearby.map((c: Community) => (
                  <View key={c.id} style={{ width: COMMUNITY_CARD_W }}>
                    <M3CommunityCard community={c} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        </ScrollView>

        {/* Floating Map FAB */}
        <Animated.View entering={FadeInDown.delay(800)} style={[s.fab, { bottom: safeInsets.bottom + tabBarHeight + 16 }]}>
          <Pressable
            onPress={() => router.push({ pathname: '/map', params: { city: cityName } })}
            style={({ pressed }) => [
              s.fabBtn,
              { backgroundColor: m3Colors.primaryContainer },
              pressed && { scale: 0.95, opacity: 0.9 }
            ]}
          >
            <Ionicons name="map" size={24} color={m3Colors.onPrimaryContainer} />
            <Text style={[M3Typography.labelLarge, { color: m3Colors.onPrimaryContainer, marginLeft: 8 }]}>Map</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  heroNavBtn: { width: 48, height: 48, borderRadius: 14, paddingHorizontal: 0 },
  heroNavCenter: { flex: 1, alignItems: 'center' },
  locPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  heroContent: { paddingBottom: 40, alignItems: 'center', gap: 8 },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, marginBottom: 8 },
  heroGreetingRow: { marginTop: 8 },

  statsStrip: { borderBottomWidth: 1, paddingVertical: 12 },
  statsContent: { gap: 12 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1, minWidth: 120 },
  statIcon: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statText: { gap: 1 },

  stickyFilters: { borderBottomWidth: 1, zIndex: 50 },

  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  exploreChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  exploreChipOnGradient: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  exploreChipIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exploreChipIdleText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  section: { paddingTop: 32, gap: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  gridItem: { padding: 8 },
  emptyGrid: { padding: 48, alignItems: 'center', gap: 20, marginTop: 12 },

  emptyOrbitCard: { width: ORBIT_CARD_W, padding: 24, alignItems: 'center', gap: 12 },
  emptyOrbitIcon: { width: 56, height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },

  fab: { position: 'absolute', right: 16, zIndex: 1000 },
  fabBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    height: 56, 
    borderRadius: 28, 
    ...Platform.select({
      web: { boxShadow: '0 3px 4.5px rgba(0,0,0,0.3)' },
      default: {
        elevation: 6, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 3 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 4.5 
      }
    })
  },
});
