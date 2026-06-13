/**
 * Community tab — discover, join, and follow cultural hubs.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3SectionHeader } from '@/design-system/ui';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import { useAuth } from '@/lib/auth';
import { getCommunityRecommendations } from '@/lib/community-utils';
import {
  communityKeys,
  useCommunities,
  useJoinedCommunities,
  useFollowingCommunityIds,
} from '@/modules/communities/hooks/useCommunities';
import { CommunityHeroShell } from '@/components/community/CommunityHeroShell';
import { CommunityStickyFilters } from '@/components/community/CommunityStickyFilters';
import { CommunityHubRails } from '@/components/community/CommunityHubRails';
import { CommunityDiscoverGrid } from '@/components/community/CommunityDiscoverGrid';
import {
  communityHubHeroHeight,
  communityHubScrollBottom,
  filterHubCommunities,
  type CommunityCategoryFilter,
  type CommunityHubSegment,
  type CommunityLocationFilter,
  type CommunitySortMode,
} from '@/components/community/communityHubLayout';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { APP_NAME } from '@/lib/app-meta';
import type { Community } from '@/shared/schema';

const HEAD_TITLE = `Communities · ${APP_NAME}`;
const HEAD_DESC = 'Discover and join cultural communities near you on CulturePass.';

export default function CommunityTabScreen() {
  const m3Colors = useM3Colors();
  const insets = useSafeAreaInsetsWeb();
  const { hPad, tabBarHeight, windowSizeClass, isExpanded, isDesktop, isTablet, contentWidth } = useLayout();
  const useSplitLayout = isDesktop || isTablet;

  const { state: onboarding } = useOnboarding();
  const { user } = useAuth();
  const { savedCommunityBookmarks } = useSaved();
  const queryClient = useQueryClient();

  const userCity = onboarding?.city?.trim() || 'Sydney';
  const userCultureTags = onboarding?.interests ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState<CommunityHubSegment>('discover');
  const [category, setCategory] = useState<CommunityCategoryFilter>('all');
  const [location, setLocation] = useState<CommunityLocationFilter>('near-you');
  const [sort, setSort] = useState<CommunitySortMode>('activity');

  const { data: allCommunities = [], isLoading } = useCommunities();
  const { data: joinedData } = useJoinedCommunities();
  const { data: followingIds = [] } = useFollowingCommunityIds();

  const joinedSet = useMemo(() => new Set(joinedData?.communityIds ?? []), [joinedData]);
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const joinedCommunities = useMemo(
    () => allCommunities.filter((c) => joinedSet.has(c.id)),
    [allCommunities, joinedSet],
  );

  const followingCommunities = useMemo(
    () => allCommunities.filter((c) => followingSet.has(c.id) && !joinedSet.has(c.id)),
    [allCommunities, followingSet, joinedSet],
  );

  const recommendedCommunities = useMemo(
    () => getCommunityRecommendations(userCultureTags, allCommunities, Array.from(joinedSet), 8),
    [userCultureTags, allCommunities, joinedSet],
  );

  const filteredCommunities = useMemo(
    () =>
      filterHubCommunities(allCommunities, {
        segment,
        category,
        location,
        userCity,
        joinedIds: joinedSet,
        followingIds: followingSet,
        savedIds: savedCommunityBookmarks,
        sort,
      }),
    [allCommunities, segment, category, location, userCity, joinedSet, followingSet, savedCommunityBookmarks, sort],
  );

  const numColumns = useSplitLayout ? (isDesktop ? 3 : 2) : windowSizeClass === 'expanded' ? 3 : 2;
  const heroHeight = communityHubHeroHeight(isDesktop, isExpanded);

  const onRefresh = useCallback(async () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: communityKeys.all }),
        queryClient.invalidateQueries({ queryKey: communityKeys.joined() }),
        queryClient.invalidateQueries({ queryKey: communityKeys.followingCommunities() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const clearFilters = useCallback(() => {
    setSegment('discover');
    setCategory('all');
    setLocation('near-you');
    setSort('activity');
  }, []);

  const heroStats = useMemo(
    () => [
      { icon: 'people' as const, value: joinedCommunities.length, label: 'Joined', color: Luxe.colors.indigo },
      { icon: 'bookmark' as const, value: followingCommunities.length, label: 'Following', color: Luxe.colors.appBlue },
      { icon: 'heart' as const, value: savedCommunityBookmarks.length, label: 'Saved', color: Luxe.colors.plum },
      { icon: 'globe' as const, value: allCommunities.length, label: 'Hubs', color: Luxe.colors.emerald },
    ],
    [joinedCommunities.length, followingCommunities.length, savedCommunityBookmarks.length, allCommunities.length],
  );

  const quickActions = useMemo(
    () => [
      { key: 'create', label: 'Create hub', icon: 'add-circle-outline' as const, color: Luxe.colors.indigo, onPress: () => router.push('/create/community') },
      { key: 'culture', label: 'Culture hubs', icon: 'planet-outline' as const, color: Luxe.colors.appBlue, onPress: () => router.push('/culturehub') },
      { key: 'city', label: 'My city', icon: 'location-outline' as const, color: Luxe.colors.emerald, onPress: () => router.push('/(tabs)/city') },
      { key: 'calendar', label: 'Events', icon: 'calendar-outline' as const, color: Luxe.colors.gold, onPress: () => router.push('/(tabs)/calendar') },
      { key: 'discover', label: 'Discover', icon: 'compass-outline' as const, color: Luxe.colors.plum, onPress: () => router.push('/(tabs)/discover') },
    ],
    [],
  );

  const segmentTitle =
    segment === 'joined'
      ? 'My hubs'
      : segment === 'following'
        ? 'Following'
        : segment === 'saved'
          ? 'Saved hubs'
          : 'Discover communities';

  const personalRails =
    segment === 'discover' ? (
      <CommunityHubRails
        hPad={hPad}
        joined={joinedCommunities}
        following={followingCommunities}
        recommended={recommendedCommunities}
        compact={useSplitLayout}
      />
    ) : null;

  const discoverGrid = (
    <View style={{ paddingTop: useSplitLayout ? 20 : 12 }}>
      {!useSplitLayout ? (
        <View style={{ paddingHorizontal: hPad, marginBottom: 8 }}>
          <M3SectionHeader title={segmentTitle} subtitle={`${filteredCommunities.length} results`} />
        </View>
      ) : null}
      <View style={{ paddingHorizontal: useSplitLayout ? 0 : hPad }}>
        <CommunityDiscoverGrid
          communities={filteredCommunities}
          numColumns={numColumns}
          isLoading={isLoading}
          onClearFilters={filteredCommunities.length === 0 ? clearFilters : undefined}
        />
      </View>
    </View>
  );

  return (
    <ErrorBoundary>
      <Head>
        <title>{HEAD_TITLE}</title>
        <meta name="description" content={HEAD_DESC} />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.root, { backgroundColor: m3Colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          contentContainerStyle={[
            { paddingBottom: communityHubScrollBottom(tabBarHeight, insets.bottom) },
            (isDesktop || isExpanded) && { width: contentWidth, alignSelf: 'center' },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={m3Colors.primary} />}
        >
          <CommunityHeroShell
            heroHeight={heroHeight}
            topInset={insets.top}
            hPad={hPad}
            cityName={userCity}
            headline="Find your people"
            subtitle="Cultural hubs, local groups, and diaspora communities — all in one place."
            isAuthenticated={!!user}
            stats={heroStats}
            quickActions={quickActions}
          />

          <CommunityStickyFilters
            hPad={hPad}
            segment={segment}
            onSegmentChange={setSegment}
            category={category}
            onCategoryChange={setCategory}
            location={location}
            onLocationChange={setLocation}
            sort={sort}
            onSortChange={setSort}
            resultCount={filteredCommunities.length}
            cityName={userCity}
            onClearAll={clearFilters}
          />

          {useSplitLayout ? (
            <View style={[s.splitRow, { paddingHorizontal: hPad, gap: 28 }]}>
              <View style={s.mainCol}>
                <View style={{ paddingHorizontal: 0 }}>
                  <M3SectionHeader title={segmentTitle} subtitle={`${filteredCommunities.length} communities`} />
                </View>
                {discoverGrid}
              </View>
              <View style={s.sideCol}>{personalRails}</View>
            </View>
          ) : (
            <>
              {personalRails}
              {discoverGrid}
            </>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  splitRow: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 24 },
  mainCol: { flex: 1.65, minWidth: 0 },
  sideCol: { flex: 1, minWidth: 260, paddingTop: 8 },
});