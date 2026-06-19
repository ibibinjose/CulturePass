import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCouncil } from '@/hooks/useCouncil';
import { eventsApi } from '@/modules/events/api';
import { api, type ActivityData, type IndigenousOrganisation, type IndigenousTraditionalLand } from '@/lib/api';
import type { Community, DiscoverFeedContract, EventData, MovieData, PerkData, RestaurantData, ShopData } from '@/shared/schema';
import type { DiscoverLocation } from './useDiscoverLocation';
import { eventMatchesCouncil } from '@/lib/locationFallback';

type DiscoverStateShape = {
  city?: string;
  country?: string;
  cultureIds?: string[];
};

export function useDiscoverQueries(
  state: DiscoverStateShape,
  userId: string | null | undefined,
  location: DiscoverLocation,
  today?: string,
) {
  const stableToday = today ?? new Date().toLocaleDateString('en-CA');
  const effectiveCity = location.city || state.city || '';
  const effectiveCountry = location.country || state.country || 'Australia';

  const eventsQuery = useQuery<EventData[]>({
    queryKey: ['/api/events', effectiveCountry, stableToday],
    queryFn: async () => {
      const result = await api.events.list({
        country: effectiveCountry || undefined,
        pageSize: 50,
        dateFrom: stableToday,
      });
      return Array.isArray(result.events) ? result.events : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const communitiesQuery = useQuery<Community[]>({
    queryKey: ['/api/communities', effectiveCountry, 'country-wide'],
    queryFn: () => api.communities.list({ country: effectiveCountry || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const activitiesQuery = useQuery<ActivityData[]>({
    queryKey: ['/api/activities', effectiveCountry, effectiveCity],
    queryFn: () =>
      api.activities.list({
        country: effectiveCountry || undefined,
        city: effectiveCity || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const discoverFeedQuery = useQuery<DiscoverFeedContract>({
    queryKey: ['/api/discover', userId ?? 'guest', effectiveCity, effectiveCountry, stableToday],
    queryFn: () =>
      api.discover.feed(userId ?? 'guest', {
        city: effectiveCity || undefined,
        country: effectiveCountry || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const traditionalLandsQuery = useQuery<IndigenousTraditionalLand[]>({
    queryKey: ['/api/indigenous/traditional-lands'],
    queryFn: () => api.culture.indigenousTraditionalLands(),
    staleTime: Infinity,
  });

  const indigenousOrganisationsQuery = useQuery<IndigenousOrganisation[]>({
    queryKey: ['/api/indigenous/organisations', effectiveCountry],
    queryFn: () =>
      api.culture.indigenousOrganisations({
        country: effectiveCountry || 'Australia',
        featured: true,
        limit: 6,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const restaurantsQuery = useQuery<RestaurantData[]>({
    queryKey: ['/api/restaurants', effectiveCity, effectiveCountry],
    queryFn: () =>
      api.restaurants.list({
        city: effectiveCity || undefined,
        country: effectiveCountry || undefined,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const moviesQuery = useQuery<MovieData[]>({
    queryKey: ['/api/movies', effectiveCity, effectiveCountry],
    queryFn: () =>
      (api.movies as { list: (params: Record<string, unknown>) => Promise<MovieData[]> }).list({
        city: effectiveCity || undefined,
        country: effectiveCountry || undefined,
        pageSize: 8,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const shoppingQuery = useQuery<ShopData[]>({
    queryKey: ['/api/shopping', effectiveCity, effectiveCountry],
    queryFn: () =>
      api.shopping.list({
        city: effectiveCity || undefined,
        country: effectiveCountry || undefined,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const perksQuery = useQuery<PerkData[]>({
    queryKey: ['/api/perks', effectiveCity, effectiveCountry],
    queryFn: () =>
      api.perks.list({
        city: effectiveCity || undefined,
        country: effectiveCountry || undefined,
        pageSize: 8,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: councilData } = useCouncil();
  const onboardingCouncil = councilData?.council ?? null;
  const council = location.council ?? onboardingCouncil;

  const councilEventsQuery = useQuery<EventData[]>({
    queryKey: ['/api/events/council', council?.id, council?.lgaCode, stableToday],
    queryFn: async () => {
      if (!council) return [];
      const result = await api.events.list({
        councilId: council.id,
        lgaCode: council.lgaCode || undefined,
        pageSize: 30,
        dateFrom: stableToday,
      });
      return Array.isArray(result.events) ? result.events : [];
    },
    enabled: !!council,
    staleTime: 5 * 60 * 1000,
  });

  const nearbyCoords = location.coordinates;
  const nearbyEventsQuery = useQuery({
    queryKey: ['/api/events/nearby', nearbyCoords?.latitude, nearbyCoords?.longitude, 15, 20],
    queryFn: () =>
      eventsApi.events.nearby({
        lat: nearbyCoords!.latitude,
        lng: nearbyCoords!.longitude,
        radius: 15,
        pageSize: 20,
      }),
    enabled: nearbyCoords != null && location.status === 'ready',
    staleTime: 5 * 60 * 1000,
  });

  const nearbyProbe = useMemo(
    () => ({
      isLoading:
        location.status === 'detecting' ||
        (nearbyCoords != null && location.status === 'ready' && nearbyEventsQuery.isFetching),
      status:
        location.status === 'detecting'
          ? ('locating' as const)
          : location.status === 'denied'
            ? ('denied' as const)
            : location.status === 'unavailable'
              ? ('unavailable' as const)
              : location.status === 'error'
                ? ('error' as const)
                : nearbyEventsQuery.isFetching
                  ? ('fetching' as const)
                  : nearbyEventsQuery.data
                    ? ('success' as const)
                    : ('idle' as const),
      error: location.errorMessage,
      coords: nearbyCoords
        ? { lat: nearbyCoords.latitude, lng: nearbyCoords.longitude }
        : null,
      trigger: location.refresh,
    }),
    [
      location.status,
      location.errorMessage,
      location.refresh,
      nearbyCoords,
      nearbyEventsQuery.isFetching,
      nearbyEventsQuery.data,
    ],
  );

  const councilEvents = useMemo(() => {
    const fromCouncilQuery = councilEventsQuery.data ?? [];
    const fromCityQuery = eventsQuery.data ?? [];
    const seen = new Set<string>();
    const merged: EventData[] = [];

    const add = (e: EventData) => {
      if (seen.has(e.id)) return;
      if (eventMatchesCouncil(e, council)) {
        seen.add(e.id);
        merged.push(e);
      }
    };

    fromCouncilQuery.forEach(add);
    fromCityQuery.forEach(add);

    return merged;
  }, [council, eventsQuery.data, councilEventsQuery.data]);

  const gpsNearbyEvents = nearbyEventsQuery.data?.events ?? [];
  const nearbyEvents = useMemo(() => {
    if (gpsNearbyEvents.length > 0) return gpsNearbyEvents.slice(0, 12);
    if (councilEvents.length > 0) return councilEvents.slice(0, 12);
    return [];
  }, [gpsNearbyEvents, councilEvents]);

  return {
    stableToday,
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
    councilEventsQuery,
    nearbyProbe,
    nearbyEvents,
    councilEvents,
    location,
  };
}