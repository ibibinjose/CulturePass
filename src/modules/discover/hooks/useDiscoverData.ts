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

export function useDiscoverData() {
  const { state } = useOnboarding();
  const { isAuthenticated, userId } = useAuth();

  const { currentTime, weatherSummary, selectedCityCoordinates } = useDiscoverServiceState(state.city);
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
  } = useDiscoverQueries(state, userId);

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

  const trendingEvents = useMemo(() => discoverFeed?.trendingEvents ?? [], [discoverFeed]);

  const distanceSortedEvents = useMemo(() => {
    if (!selectedCityCoordinates || allEvents.length === 0) return [];
    return allEvents
      .reduce((acc: (EventData & { distanceKm: number })[], event) => {
        if (!event.venue || !event.city) return acc;
        const coords = cityToCoordinates(event.city);
        if (!coords) return acc;
        const dist = calculateDistance(
          selectedCityCoordinates.latitude,
          selectedCityCoordinates.longitude,
          coords.latitude,
          coords.longitude,
        );
        acc.push({ ...event, distanceKm: dist });
        return acc;
      }, [])
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 12);
  }, [allEvents, selectedCityCoordinates]);

  const popularEvents = useMemo(() => {
    if (trendingEvents.length > 0) return trendingEvents;
    if (distanceSortedEvents.length > 0) return distanceSortedEvents;
    return allEvents
      .filter((e) => e.venue)
      .sort((a, b) => (b.attending || 0) - (a.attending || 0))
      .slice(0, 12);
  }, [trendingEvents, allEvents, distanceSortedEvents]);

  const forYouEvents = useMemo(() => {
    // Prefer server-ranked cultural events (includes both root + exploring culture matches)
    const serverRanked = discoverFeed?.forYouEvents?.map((r) => r.event as EventData) ?? [];
    if (serverRanked.length > 0) return serverRanked;
    // Fallback: client-side filter for unauthenticated users or when server data is absent
    const { nationalityId, cultureIds } = state;
    if (!nationalityId && (!cultureIds || cultureIds.length === 0)) return [];
    return allEvents
      .filter((e) => {
        const tags: string[] = Array.isArray(e.cultureTag) ? (e.cultureTag as string[]) : [];
        if (nationalityId && tags.some((t) => t.toLowerCase().includes(nationalityId.toLowerCase()))) return true;
        if (cultureIds?.length) return cultureIds.some((id: string) => tags.some((t) => t.toLowerCase().includes(id.toLowerCase())));
        return false;
      })
      .slice(0, 10);
  }, [discoverFeed, allEvents, state]);

  const nowBuckets = useMemo(() => {
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowTotalMinutes = nowHours * 60 + nowMinutes;

    const happeningNow: EventData[] = [];
    const startingSoon: EventData[] = [];
    const laterTonight: EventData[] = [];

    allEvents.forEach((event) => {
      if (!event.time) return;
      const [h, m] = event.time.split(':').map(Number);
      const eventMinutes = h * 60 + m;

      if (eventMinutes <= nowTotalMinutes + 30 && eventMinutes >= nowTotalMinutes - 120) {
        happeningNow.push(event);
      } else if (eventMinutes > nowTotalMinutes + 30 && eventMinutes <= nowTotalMinutes + 120) {
        startingSoon.push(event);
      } else if (eventMinutes > nowTotalMinutes + 120) {
        laterTonight.push(event);
      }
    });

    return { happeningNow, startingSoon, laterTonight };
  }, [allEvents]);

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
    return merged;
  }, [nowBuckets]);

  const featuredEvents = useMemo(() => {
    const featured = allEvents.filter((e) => e.isFeatured);
    if (featured.length >= 3) return featured.slice(0, 5);
    return [...featured, ...allEvents.filter((e) => !e.isFeatured)].slice(0, 5);
  }, [allEvents]);

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
    () => (Array.isArray(traditionalLandsRaw) ? traditionalLandsRaw.find((l) => l.city === state.city) : undefined),
    [traditionalLandsRaw, state.city],
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
    (): (EventData | string)[] => (eventsQuery.isLoading || discoverFeedQuery.isLoading ? ['s1', 's2', 's3', 's4'] : popularEvents),
    [eventsQuery.isLoading, discoverFeedQuery.isLoading, popularEvents],
  );

  const communityRailData = useMemo(
    (): (Community | string)[] => (communitiesQuery.isLoading ? ['s1', 's2', 's3', 's4'] : allCommunities),
    [communitiesQuery.isLoading, allCommunities],
  );

  const nearbyRailData = useMemo(
    (): (EventData | string)[] => (nearbyLoading ? ['s1', 's2', 's3', 's4'] : nearbyEvents),
    [nearbyLoading, nearbyEvents],
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
    if (nearbyLoading || nearbyEvents.length > 0) return null;
    if (eventsQuery.isError) return 'Could not load local events.';
    if (nearbyProbe.error) return nearbyProbe.error;
    if (nearbyProbe.status === 'error') return 'Could not determine your location. Try again.';
    return null;
  }, [nearbyLoading, nearbyEvents.length, eventsQuery.isError, nearbyProbe.error, nearbyProbe.status]);
  return {
    currentTime,
    weatherSummary,
    refreshing,
    handleRefresh: () =>
      handleRefresh({
        refetch: discoverFeedQuery.refetch,
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
  };
}
