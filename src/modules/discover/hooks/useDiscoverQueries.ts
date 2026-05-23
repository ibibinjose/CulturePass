import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCouncil } from '@/hooks/useCouncil';
import { useNearbyEvents } from '@/modules/events/hooks/useNearbyEvents';
import { api, type ActivityData, type IndigenousOrganisation, type IndigenousTraditionalLand } from '@/lib/api';
import type { Community, DiscoverFeedContract, EventData, MovieData, PerkData, RestaurantData, ShopData } from '@/shared/schema';

type DiscoverStateShape = {
  city?: string;
  country?: string;
  cultureIds?: string[];
};

export function useDiscoverQueries(state: DiscoverStateShape, userId?: string | null, today?: string) {
  const stableToday = today ?? new Date().toLocaleDateString('en-CA');

  const eventsQuery = useQuery<EventData[]>({
    queryKey: ['/api/events', state.country, state.city, stableToday],
    queryFn: async () => {
      const result = await api.events.list({
        country: state.country || undefined,
        city: state.city || undefined,
        pageSize: 50,
        dateFrom: stableToday,
      });
      return Array.isArray(result.events) ? result.events : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const communitiesQuery = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country],
    queryFn: () => api.communities.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const activitiesQuery = useQuery<ActivityData[]>({
    queryKey: ['/api/activities', state.country, state.city],
    queryFn: () => api.activities.list({ country: state.country || undefined, city: state.city || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const discoverFeedQuery = useQuery<DiscoverFeedContract>({
    queryKey: ['/api/discover', userId ?? 'guest', state.city, state.country, stableToday],
    queryFn: () =>
      api.discover.feed(userId ?? 'guest', {
        city: state.city || undefined,
        country: state.country || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const traditionalLandsQuery = useQuery<IndigenousTraditionalLand[]>({
    queryKey: ['/api/indigenous/traditional-lands'],
    queryFn: () => api.culture.indigenousTraditionalLands(),
    staleTime: Infinity,
  });

  const indigenousOrganisationsQuery = useQuery<IndigenousOrganisation[]>({
    queryKey: ['/api/indigenous/organisations', state.country],
    queryFn: () =>
      api.culture.indigenousOrganisations({
        country: state.country || 'Australia',
        featured: true,
        limit: 6,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const restaurantsQuery = useQuery<RestaurantData[]>({
    queryKey: ['/api/restaurants', state.city, state.country],
    queryFn: () => api.restaurants.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 10 * 60 * 1000,
  });

  const moviesQuery = useQuery<MovieData[]>({
    queryKey: ['/api/movies', state.city, state.country],
    queryFn: () =>
      (api.movies as { list: (params: Record<string, unknown>) => Promise<MovieData[]> }).list({
        city: state.city || undefined,
        country: state.country || undefined,
        pageSize: 8,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const shoppingQuery = useQuery<ShopData[]>({
    queryKey: ['/api/shopping', state.city, state.country],
    queryFn: () => api.shopping.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 10 * 60 * 1000,
  });

  const perksQuery = useQuery<PerkData[]>({
    queryKey: ['/api/perks', state.city, state.country],
    queryFn: () => api.perks.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: councilData } = useCouncil();
  const council = councilData?.council;

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

  const nearbyProbe = useNearbyEvents({ radiusKm: 15, pageSize: 20 });
  const triggerNearbyProbe = nearbyProbe.trigger;
  useEffect(() => {
    triggerNearbyProbe();
  }, [triggerNearbyProbe]);

  const councilEvents = useMemo(() => {
    const fromCouncilQuery = councilEventsQuery.data ?? [];
    const fromCityQuery = eventsQuery.data ?? [];

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: EventData[] = [];

    const add = (e: EventData) => {
      if (seen.has(e.id)) return;
      // Double check LGA match if it's from city query
      if (
        (e.lgaCode && council?.lgaCode && e.lgaCode === council.lgaCode) ||
        (e.councilId && council?.id && e.councilId === council.id)
      ) {
        seen.add(e.id);
        merged.push(e);
      }
    };

    fromCouncilQuery.forEach(add);
    fromCityQuery.forEach(add);

    return merged;
  }, [council, eventsQuery.data, councilEventsQuery.data]);

  const nearbyEvents = useMemo(() => {
    if (nearbyProbe.events.length > 0) return nearbyProbe.events.slice(0, 10);
    return councilEvents.slice(0, 10);
  }, [nearbyProbe.events, councilEvents]);

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
  };
}
