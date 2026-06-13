import { useMemo, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { calculateDistance } from '@shared/location/australian-postcodes';
import type { ActivityData } from '@/lib/api';
import type { Community, EventData } from '@/shared/schema';
import { isEventInDiscoverLiveWindow, parseEventStartMs } from '@/lib/dateUtils';
import { captureDiscoverView, captureReturn } from '@/lib/analytics-funnel';
import { useDiscoverAdaptiveRails } from '@/hooks/discover/useDiscoverAdaptiveRails';
import { useDiscoverPreviewRails } from '@/hooks/discover/useDiscoverPreviewRails';
import { cityToCoordinates, useDiscoverServiceState } from './useDiscoverServices';
import { useDiscoverUIState } from './useDiscoverUIState';
import { useDiscoverQueries } from './useDiscoverQueries';
import { useLocation } from '@/contexts/LocationContext';
import {
  bucketEventsByTimeOfDay,
  eventMatchesCity,
  filterLocalEvents,
  mergeLocalWithFallback,
  rankCommunitiesByLocation,
  rankEventsByLocation,
  type LocationScope,
} from '@/lib/locationFallback';

export function useDiscoverData() {
  const { state } = useOnboarding();
  const { isAuthenticated, userId } = useAuth();

  const location = useLocation();
  const {
    currentTime,
    dateLabel,
    timeLabel,
    weatherSummary,
    selectedCityCoordinates,
    locationDisplayLabel,
  } = useDiscoverServiceState(location);

  const { refreshing, discoverViewedRef, handleRefresh } = useDiscoverUIState();
  const {
    eventsQuery,
    communitiesQuery,
    activitiesQuery,
    discoverFeedQuery,
    traditionalLandsQuery,
    indigenousOrganisationsQuery,
    restaurantsQuery,
    moviesQuery,
    shoppingQuery,
    perksQuery,
    council,
    councilEvents,
    nearbyProbe,
    nearbyEvents,
  } = useDiscoverQueries(state, userId, location);

  const effectiveCity = location.city || state.city || '';
  const effectiveCountry = location.country || state.country || 'Australia';

  const allEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const allCommunities = useMemo(() => communitiesQuery.data ?? [], [communitiesQuery.data]);
  const allActivities = useMemo(() => activitiesQuery.data ?? [], [activitiesQuery.data]);
  const discoverFeed = discoverFeedQuery.data;
  const traditionalLandsRaw = traditionalLandsQuery.data;
  const indigenousOrganisations = indigenousOrganisationsQuery.data ?? [];
  const restaurantsRaw = restaurantsQuery.data ?? [];
  const moviesRaw = moviesQuery.data ?? [];
  const shoppingRaw = shoppingQuery.data ?? [];
  const perksRaw = perksQuery.data ?? [];

  const nearbyIds = useMemo(() => new Set(nearbyEvents.map((e) => e.id)), [nearbyEvents]);

  const localEventScope = useMemo(
    () => ({
      city: effectiveCity,
      country: effectiveCountry,
      council,
      nearbyIds,
    }),
    [effectiveCity, effectiveCountry, council, nearbyIds],
  );

  const localUpcomingEvents = useMemo(
    () => filterLocalEvents(allEvents, localEventScope),
    [allEvents, localEventScope],
  );

  const trendingEvents = useMemo(() => discoverFeed?.trendingEvents ?? [], [discoverFeed]);

  const distanceSortedEvents = useMemo(() => {
    if (!selectedCityCoordinates || allEvents.length === 0) return [];
    const pool = localUpcomingEvents.length > 0 ? localUpcomingEvents : allEvents;
    const withDistance: (EventData & { distanceKm: number })[] = [];
    const withoutDistance: EventData[] = [];

    for (const event of pool) {
      if (!event.city) {
        withoutDistance.push(event);
        continue;
      }
      const coords = cityToCoordinates(event.city);
      if (!coords) {
        withoutDistance.push(event);
        continue;
      }
      const dist = calculateDistance(
        selectedCityCoordinates.latitude,
        selectedCityCoordinates.longitude,
        coords.latitude,
        coords.longitude,
      );
      withDistance.push({ ...event, distanceKm: dist });
    }

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return [...withDistance, ...withoutDistance.map((e) => ({ ...e, distanceKm: 9999 }))].slice(0, 12);
  }, [allEvents, localUpcomingEvents, selectedCityCoordinates]);

  const popularEvents = useMemo(() => {
    const localTrending = trendingEvents.filter((e) =>
      localUpcomingEvents.some((l) => l.id === e.id) || nearbyIds.has(e.id),
    );
    if (localTrending.length > 0) return localTrending;
    if (trendingEvents.length > 0 && localUpcomingEvents.length === 0) return trendingEvents;
    if (distanceSortedEvents.length > 0) return distanceSortedEvents;
    if (localUpcomingEvents.length > 0) {
      return [...localUpcomingEvents]
        .sort((a, b) => (b.attending || 0) - (a.attending || 0))
        .slice(0, 12);
    }
    return [...allEvents]
      .sort((a, b) => (b.attending || 0) - (a.attending || 0))
      .slice(0, 12);
  }, [trendingEvents, allEvents, distanceSortedEvents, localUpcomingEvents, nearbyIds]);

  const forYouEvents = useMemo(() => {
    const serverRanked = discoverFeed?.forYouEvents?.map((r) => r.event as EventData) ?? [];
    if (serverRanked.length > 0) {
      const localRanked = serverRanked.filter((e) =>
        localUpcomingEvents.some((l) => l.id === e.id) || nearbyIds.has(e.id),
      );
      if (localRanked.length > 0) return localRanked;
      if (localUpcomingEvents.length > 0) return serverRanked;
      return serverRanked;
    }

    const { nationalityId, cultureIds } = state;
    const culturePool = localUpcomingEvents.length > 0 ? localUpcomingEvents : allEvents;
    const cultureMatched = culturePool.filter((e) => {
      const tags: string[] = [
        ...(Array.isArray(e.cultureTag) ? (e.cultureTag as string[]) : []),
        ...(Array.isArray(e.cultureTags) ? e.cultureTags : []),
      ];
      if (nationalityId && tags.some((t) => t.toLowerCase().includes(nationalityId.toLowerCase()))) return true;
      if (cultureIds?.length) {
        return cultureIds.some((id: string) => tags.some((t) => t.toLowerCase().includes(id.toLowerCase())));
      }
      return false;
    });

    if (cultureMatched.length > 0) return cultureMatched.slice(0, 10);
    return popularEvents.slice(0, 10);
  }, [discoverFeed, allEvents, localUpcomingEvents, nearbyIds, state, popularEvents]);

  const nowBuckets = useMemo(() => {
    const localBuckets = bucketEventsByTimeOfDay(localUpcomingEvents);
    if (
      localBuckets.happeningNow.length > 0 ||
      localBuckets.startingSoon.length > 0 ||
      localBuckets.laterTonight.length > 0
    ) {
      return localBuckets;
    }
    return bucketEventsByTimeOfDay(allEvents);
  }, [localUpcomingEvents, allEvents]);

  const startingSoonRailData = useMemo(() => {
    const seen = new Set<string>();
    const merged: EventData[] = [];
    for (const e of nowBuckets.happeningNow) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
    for (const e of nowBuckets.startingSoon) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
    const now = Date.now();
    merged.sort((a, b) => {
      const ta = parseEventStartMs(a.date, a.time);
      const tb = parseEventStartMs(b.date, b.time);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      const aLive = isEventInDiscoverLiveWindow(ta, now);
      const bLive = isEventInDiscoverLiveWindow(tb, now);
      if (aLive !== bLive) return aLive ? -1 : 1;
      return ta - tb;
    });
    if (merged.length > 0) return merged;
    if (localUpcomingEvents.length > 0) return localUpcomingEvents.slice(0, 8);
    return allEvents.slice(0, 8);
  }, [nowBuckets, allEvents, localUpcomingEvents]);

  const nearbyEventsMerged = useMemo(() => {
    const localCityEvents = allEvents.filter((e) => eventMatchesCity(e, effectiveCity));
    const local =
      nearbyEvents.length > 0
        ? nearbyEvents
        : councilEvents.length > 0
          ? councilEvents
          : localCityEvents;
    const ranked = rankEventsByLocation(allEvents, effectiveCity, effectiveCountry);
    return mergeLocalWithFallback(local, ranked, { minLocal: 1, limit: 12 });
  }, [nearbyEvents, councilEvents, allEvents, effectiveCity, effectiveCountry]);

  const discoverCommunitiesMerged = useMemo(() => {
    const local = allCommunities.filter((c) => {
      const hubCity = (c.city ?? '').trim().toLowerCase();
      if (!hubCity) return true;
      return (
        hubCity === effectiveCity.trim().toLowerCase() ||
        (c.chapterCities ?? []).some((ch) => ch.trim().toLowerCase() === effectiveCity.trim().toLowerCase())
      );
    });
    const ranked = rankCommunitiesByLocation(allCommunities, effectiveCity, effectiveCountry);
    return mergeLocalWithFallback(local, ranked, { minLocal: 3, limit: 16 });
  }, [allCommunities, effectiveCity, effectiveCountry]);

  const featuredEvents = useMemo(() => {
    const localFeatured = allEvents.filter(
      (e) => e.isFeatured && (localUpcomingEvents.some((l) => l.id === e.id) || nearbyIds.has(e.id)),
    );
    if (localFeatured.length >= 3) return localFeatured.slice(0, 5);
    const featured = allEvents.filter((e) => e.isFeatured);
    if (featured.length >= 3) return featured.slice(0, 5);
    const pool = localUpcomingEvents.length > 0 ? localUpcomingEvents : allEvents;
    return pool.slice(0, 5);
  }, [allEvents, localUpcomingEvents, nearbyIds]);

  useEffect(() => {
    if (discoverViewedRef.current || allEvents.length === 0) return;
    captureDiscoverView(userId ?? 'guest', 'discover_home');
    captureReturn(userId ?? 'guest', 'discover_home_session');
    discoverViewedRef.current = true;
  }, [allEvents.length, userId, discoverViewedRef]);

  const { unifiedCultureCards, adaptiveCultureRails } = useDiscoverAdaptiveRails({
    allEvents,
    restaurantsRaw,
    allCommunities,
  });

  const land = useMemo(
    () =>
      Array.isArray(traditionalLandsRaw)
        ? traditionalLandsRaw.find((l) => l.city === effectiveCity || l.city === state.city)
        : undefined,
    [traditionalLandsRaw, effectiveCity, state.city],
  );

  const nearbyLoading = nearbyProbe.isLoading || eventsQuery.isLoading;

  const { restaurantPreviewItems, moviePreviewItems, shoppingPreviewItems, perksPreviewItems } = useDiscoverPreviewRails({
    restaurantsRaw,
    restaurantsLoading: restaurantsQuery.isLoading,
    moviesRaw,
    moviesLoading: moviesQuery.isLoading,
    shoppingRaw,
    shoppingLoading: shoppingQuery.isLoading,
    perksRaw,
    perksLoading: perksQuery.isLoading,
  });

  const popularRailData = useMemo(
    (): (EventData | string)[] =>
      eventsQuery.isLoading || discoverFeedQuery.isLoading ? ['s1', 's2', 's3', 's4'] : popularEvents,
    [eventsQuery.isLoading, discoverFeedQuery.isLoading, popularEvents],
  );

  const communityRailData = useMemo(
    (): (Community | string)[] =>
      communitiesQuery.isLoading ? ['s1', 's2', 's3', 's4'] : discoverCommunitiesMerged.items,
    [communitiesQuery.isLoading, discoverCommunitiesMerged.items],
  );

  const nearbyRailData = useMemo(
    (): (EventData | string)[] =>
      nearbyLoading ? ['s1', 's2', 's3', 's4'] : nearbyEventsMerged.items,
    [nearbyLoading, nearbyEventsMerged.items],
  );

  const activityRailData = useMemo(
    (): (ActivityData | string)[] => (activitiesQuery.isLoading ? ['s1', 's2', 's3', 's4'] : allActivities),
    [activitiesQuery.isLoading, allActivities],
  );

  const eventsRailError = useMemo(
    () => (eventsQuery.isError ? 'Could not load events. Check your connection and try again.' : null),
    [eventsQuery.isError],
  );
  const communitiesRailError = useMemo(
    () => (communitiesQuery.isError ? 'Could not load communities. Pull to refresh or try again.' : null),
    [communitiesQuery.isError],
  );
  const activitiesRailError = useMemo(
    () => (activitiesQuery.isError ? 'Could not load activities. Try again in a moment.' : null),
    [activitiesQuery.isError],
  );
  const nearbyRailError = useMemo(() => {
    if (nearbyLoading || nearbyEventsMerged.items.length > 0) return null;
    if (eventsQuery.isError) return 'Could not load events.';
    if (nearbyProbe.error) return nearbyProbe.error;
    if (nearbyProbe.status === 'error' && allEvents.length === 0) {
      return 'Could not determine your location. Showing nationwide events when available.';
    }
    return null;
  }, [nearbyLoading, nearbyEventsMerged.items.length, eventsQuery.isError, nearbyProbe.error, nearbyProbe.status, allEvents.length]);

  const nearbyScope: LocationScope = nearbyEventsMerged.scope;
  const communitiesScope: LocationScope = discoverCommunitiesMerged.scope;

  return {
    currentTime,
    dateLabel,
    timeLabel,
    weatherSummary,
    locationDisplayLabel,
    location,
    refreshing,
    handleRefresh: () =>
      handleRefresh({
        refetch: discoverFeedQuery.refetch,
        refreshLocation: location.refresh,
      }),
    allEvents,
    eventsLoading: eventsQuery.isLoading,
    allCommunities,
    communitiesLoading: communitiesQuery.isLoading,
    allActivities,
    activitiesLoading: activitiesQuery.isLoading,
    nearbyEvents,
    nearbyLoading,
    popularEvents,
    forYouEvents,
    featuredEvents,
    land,
    indigenousOrganisations,
    nowBuckets,
    startingSoonRailData,
    popularRailData,
    communityRailData,
    nearbyRailData,
    activityRailData,
    councilEvents,
    unifiedCultureCards,
    adaptiveCultureRails,
    discoverLoading: discoverFeedQuery.isLoading,
    council,
    state,
    isAuthenticated,
    userId,
    restaurantPreviewItems,
    restaurantsLoading: restaurantsQuery.isLoading,
    moviePreviewItems,
    moviesLoading: moviesQuery.isLoading,
    shoppingPreviewItems,
    shoppingLoading: shoppingQuery.isLoading,
    perksPreviewItems,
    perksLoading: perksQuery.isLoading,
    eventsError: eventsQuery.isError,
    communitiesError: communitiesQuery.isError,
    activitiesError: activitiesQuery.isError,
    refetchEvents: eventsQuery.refetch,
    refetchCommunities: communitiesQuery.refetch,
    refetchActivities: activitiesQuery.refetch,
    retryNearbyProbe: nearbyProbe.trigger,
    eventsRailError,
    communitiesRailError,
    activitiesRailError,
    nearbyRailError,
    nearbyScope,
    communitiesScope,
    discoverCommunities: discoverCommunitiesMerged.items,
    effectiveCity,
    effectiveCountry,
    localUpcomingEvents,
  };
}