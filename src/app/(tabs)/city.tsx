/**
 * My City tab — personalized home-city command center.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FilterRail, type FilterRailMode } from '@/components/browse/FilterRail';
import {
  communityKeys,
  useCommunities,
  useFollowingCommunityIds,
  useJoinedCommunities,
} from '@/modules/communities/hooks/useCommunities';
import { useCityPage, type ListingTypeKey, type ExploreCategoryKey } from '@/hooks/useCityPage';
import { MyCityHeroShell } from '@/components/city/MyCityHeroShell';
import { CITY_STAT_COLORS } from '@/components/city/cityTheme';
import { MyCityFeedPanel } from '@/components/city/MyCityFeedPanel';
import { MyCityPersonalRails } from '@/components/city/MyCityPersonalRails';
import { DestinationBrowseByType } from '@/components/city/DestinationBrowseByType';
import { DestinationExploreChips } from '@/components/city/DestinationExploreChips';
import { DestinationMapFab } from '@/components/city/DestinationMapFab';
import { DestinationStickyBar } from '@/components/city/DestinationStickyBar';
import {
  buildDestinationListingHref,
  destinationFabBottom,
  destinationHeroHeight,
  destinationScrollBottom,
  filterEventsByExploreCategory,
  filterVenuesByExploreCategory,
  isVenuePrimaryExploreCategory,
} from '@/components/city/destinationLayout';
import { useSaved } from '@/contexts/SavedContext';
import type { Community } from '@/shared/schema';
import { CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { APP_NAME } from '@/lib/app-meta';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { createCitySession, backToHomeCity } from '@/lib/city-utils';

const MY_CITY_HEAD_TITLE = `My city · ${APP_NAME}`;
const MY_CITY_HEAD_DESC = 'Your home city on CulturePass — events, communities, and culture near you.';

function normPlace(v: string | undefined) {
  return (v ?? '').trim().toLowerCase();
}

function communitiesForIds(all: Community[], ids: string[]) {
  const map = new Map(all.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Community[];
}

export default function MyCityScreen() {
  const m3Colors = useM3Colors();
  const { hPad, tabBarHeight, windowSizeClass, isExpanded, isDesktop, isTablet, safeAreaBottom, contentWidth } = useLayout();
  const useSplitLayout = isDesktop || isTablet;
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const heroHeight = destinationHeroHeight({ isExpanded, isDesktop, variant: 'tab' });
  const fabBottom = destinationFabBottom(tabBarHeight, safeAreaBottom);
  const { state: onboarding } = useOnboarding();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const cityName = onboarding?.city ?? 'Sydney';
  const cityCountry = onboarding?.country ?? 'Australia';

  const [citySession, setCitySession] = React.useState(() => createCitySession(cityName));
  const effectiveCity = citySession.viewingCity ?? cityName;
  const isViewingNonHome = effectiveCity !== cityName;

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
      .filter((c) => normPlace(c.city) === cn && normPlace(c.country) === cc && !joinedSet.has(c.id))
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
        .filter(
          (e) =>
            (e.communityId && orbitSet.has(e.communityId)) ||
            (e.publisherProfileId && orbitSet.has(e.publisherProfileId)),
        )
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

  const railModes: FilterRailMode[] = useMemo(
    () => [
      { id: 'category', icon: 'apps-outline', accessibilityLabel: 'Filter by category', active: page.filterMode === 'category', onPress: () => page.setFilterMode('category') },
      { id: 'culture', icon: 'globe-outline', accessibilityLabel: 'Filter by culture', active: page.filterMode === 'culture', onPress: () => page.setFilterMode('culture') },
      { id: 'language', icon: 'chatbubble-outline', accessibilityLabel: 'Filter by language', active: page.filterMode === 'language', onPress: () => page.setFilterMode('language') },
    ],
    [page.filterMode, page.setFilterMode],
  );

  const railChips = page.filterOptions.map((opt) => ({
    id: opt,
    label: opt,
    active: page.activeFilters.includes(opt),
    onPress: () => page.onToggleFilter(opt),
  }));

  const openListingTypeResults = useCallback(
    (listingType: ListingTypeKey) => {
      router.push(buildDestinationListingHref(listingType, effectiveCity) as never);
    },
    [effectiveCity],
  );

  const filteredEventsByExplore = useMemo(
    () => filterEventsByExploreCategory(page.filteredEvents, activeExploreCategory),
    [activeExploreCategory, page.filteredEvents],
  );

  const filteredVenuesByExplore = useMemo(
    () => filterVenuesByExploreCategory(page.venues, activeExploreCategory),
    [activeExploreCategory, page.venues],
  );

  const showVenueResults = isVenuePrimaryExploreCategory(activeExploreCategory);
  const numCols = windowSizeClass === 'expanded' ? 3 : windowSizeClass === 'medium' ? 2 : 1;
  const showDiscovery = page.totalActiveFilters === 0;

  const heroStats = useMemo(
    () => [
      { icon: 'calendar' as const, value: page.allEvents.length, label: 'Events', color: CITY_STAT_COLORS.events },
      { icon: 'people' as const, value: joinedCommunities.length || '—', label: 'Hubs', color: CITY_STAT_COLORS.hubs },
      { icon: 'globe' as const, value: page.uniqueCultureTags.length, label: 'Cultures', color: CITY_STAT_COLORS.cultures },
      { icon: 'sparkles' as const, value: cultureXEventCount, label: 'CultureX', color: CITY_STAT_COLORS.cultureX },
    ],
    [page.allEvents.length, joinedCommunities.length, page.uniqueCultureTags.length, cultureXEventCount],
  );

  const quickActions = useMemo(
    () => [
      { key: 'map', label: 'Map', icon: 'map-outline' as const, color: Luxe.colors.emerald, onPress: () => router.push({ pathname: '/map', params: { city: effectiveCity } }) },
      { key: 'calendar', label: 'Calendar', icon: 'calendar-outline' as const, color: Luxe.colors.appBlue, onPress: () => router.push('/(tabs)/calendar') },
      { key: 'hubs', label: 'Culture hubs', icon: 'planet-outline' as const, color: Luxe.colors.indigo, onPress: () => router.push('/culturehub') },
      { key: 'community', label: 'Community', icon: 'people-outline' as const, color: Luxe.colors.plum, onPress: () => router.push('/(tabs)/community') },
      { key: 'perks', label: 'Perks', icon: 'pricetag-outline' as const, color: Luxe.colors.gold, onPress: () => router.push('/perks') },
    ],
    [effectiveCity],
  );

  const feedTitle = showVenueResults ? 'Local places' : page.sectionTitle;
  const feedSubtitle = showVenueResults
    ? `${filteredVenuesByExplore.length} places · ${effectiveCity}`
    : `${filteredEventsByExplore.length} results · ${effectiveCity}`;

  const browseBlock = (
    <DestinationBrowseByType
      counts={page.listingResultCounts}
      onSelect={openListingTypeResults}
      hPad={useSplitLayout ? 0 : hPad}
      contextName={effectiveCity}
      layout={useSplitLayout ? 'stack' : 'rail'}
      inSidebar={useSplitLayout}
      isDesktop={useSplitLayout}
      tone="m3"
    />
  );

  const personalRails = showDiscovery ? (
    <MyCityPersonalRails
      hPad={hPad}
      cityName={cityName}
      cityCountry={cityCountry}
      orbitIds={orbitIds}
      orbitEvents={orbitEvents}
      exploreNearby={exploreNearby}
      compact={isDesktop}
    />
  ) : null;

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
          stickyHeaderIndices={[1]}
          contentContainerStyle={[
            { paddingBottom: destinationScrollBottom(tabBarHeight, safeAreaBottom) },
            isDesktop && { width: contentWidth, alignSelf: 'center' },
          ]}
          refreshControl={
            <RefreshControl refreshing={page.refreshing} onRefresh={onRefresh} tintColor={m3Colors.primary} />
          }
        >
          <MyCityHeroShell
            heroImage={page.heroImage}
            heroHeight={heroHeight}
            topInset={topInset}
            hPad={hPad}
            cityName={effectiveCity}
            country={cityCountry}
            tagline={page.meta.tagline}
            isViewingNonHome={isViewingNonHome}
            isAuthenticated={isAuthenticated}
            firstName={firstName}
            subscribed={subscribed}
            onBackHome={isViewingNonHome ? () => setCitySession((prev) => backToHomeCity(prev)) : undefined}
            onShare={() => void page.handleShare()}
            onSubscribe={handleSubscribe}
            stats={heroStats}
            quickActions={quickActions}
          />

          <DestinationStickyBar tone="m3">
            <DestinationExploreChips
              active={activeExploreCategory}
              onSelect={setActiveExploreCategory}
              hPad={hPad}
              variant="accent"
            />
            <FilterRail
              modes={railModes}
              groups={[{ items: railChips }]}
              activeCount={page.activeFilters.length}
              onClearAll={page.clearModeFilter}
            />
          </DestinationStickyBar>

          {useSplitLayout ? (
            <View style={[s.desktopRow, { paddingHorizontal: hPad, gap: 28 }]}>
              <View style={s.desktopMain}>
                <View style={{ paddingTop: 24 }}>
                  <MyCityFeedPanel
                    title={feedTitle}
                    subtitle={feedSubtitle}
                    isLoading={page.isLoading}
                    showVenues={showVenueResults}
                    events={filteredEventsByExplore}
                    venues={filteredVenuesByExplore}
                    numCols={isDesktop ? 2 : numCols}
                    onClearFilters={page.totalActiveFilters > 0 ? page.clearAllFilters : undefined}
                  />
                </View>
              </View>
              <View style={s.desktopAside}>
                {browseBlock}
                {showDiscovery ? personalRails : null}
              </View>
            </View>
          ) : (
            <>
              <View style={{ paddingHorizontal: hPad, paddingTop: 20 }}>
                <MyCityFeedPanel
                  title={feedTitle}
                  subtitle={feedSubtitle}
                  isLoading={page.isLoading}
                  showVenues={showVenueResults}
                  events={filteredEventsByExplore}
                  venues={filteredVenuesByExplore}
                  numCols={numCols}
                  onClearFilters={page.totalActiveFilters > 0 ? page.clearAllFilters : undefined}
                />
              </View>
              {showDiscovery ? browseBlock : null}
              {showDiscovery ? personalRails : null}
            </>
          )}
        </ScrollView>

        <DestinationMapFab
          variant="gradient"
          bottom={fabBottom}
          enteringDelay={400}
          onPress={() => router.push({ pathname: '/map', params: { city: effectiveCity } })}
        />
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  desktopMain: { flex: 1.7, minWidth: 0 },
  desktopAside: { flex: 1, minWidth: 280, paddingTop: 24 },
});