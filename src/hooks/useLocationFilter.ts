import { useMemo, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import type { Locatable, EventData, Community } from '@shared/schema';

/**
 * CulturePass Sydney Location Filters v2.0
 * Kerala diaspora + Sydney hyper-local
 */

export interface LocationFilterResult {
  // Core filters
  filterByLocation: <T extends Locatable>(items: T[]) => T[];
  filterSydneyEvents: (events: EventData[]) => EventData[];
  filterSydneyCommunities: (communities: Community[]) => Community[];

  // Sydney-first logic
  prioritizeSydney: <T extends Locatable>(items: T[]) => T[];
  nearbyEvents: (events: EventData[]) => EventData[];

  // State
  country: string;
  city: string;
  isSydneyUser: boolean;
  locationRadius: 'city' | 'country' | 'all';
}

export function useLocationFilter(): LocationFilterResult {
  const { state } = useOnboarding();
  const { savedEvents } = useSaved();

  const { country, city } = state;
  const isSydneyUser = state.city?.toLowerCase().includes('sydney') ?? false;

  // Primary location filter (progressive: city → country → all)
  const filterByLocation = useCallback(<T extends Locatable>(items: T[]): T[] => {
    if (!country || country === 'All') return items;

    const countryMatch = items.filter(item =>
      item.country.toLowerCase() === country.toLowerCase()
    );

    if (!city || city === 'All') return countryMatch;

    const cityMatch = countryMatch.filter(item =>
      item.city.toLowerCase() === city.toLowerCase()
    );

    // Fallback to country if no city events
    return cityMatch.length > 0 ? cityMatch : countryMatch;
  }, [country, city]);

  // Sydney hyper-local (Sydney first, then Australia)
  const filterSydneyEvents = useCallback((events: EventData[]): EventData[] => {
    const sydney = events.filter(e =>
      e.city.toLowerCase().includes('sydney') ||
      (e.venue ?? '').toLowerCase().includes('sydney')
    );

    const australia = events.filter(e =>
      e.country.toLowerCase() === 'australia' &&
      !e.city.toLowerCase().includes('sydney')
    );

    return [...sydney, ...australia];
  }, []);

  const filterSydneyCommunities = useCallback((communities: Community[]): Community[] => {
    return communities.filter(c => {
      const city = (c.city ?? '').toLowerCase();
      const country = (c.country ?? '').toLowerCase();
      return (
        city.includes('sydney') ||
        (country === 'australia' && !city.includes('sydney'))
      );
    });
  }, []);

  // Prioritize Sydney in mixed lists
  const prioritizeSydney = useCallback(<T extends Locatable>(items: T[]): T[] => {
    const sydney = items.filter(item =>
      item.city.toLowerCase().includes('sydney')
    );

    const australia = items.filter(item =>
      item.country.toLowerCase() === 'australia' &&
      !item.city.toLowerCase().includes('sydney')
    );

    const international = items.filter(item =>
      item.country.toLowerCase() !== 'australia'
    );

    return [...sydney, ...australia, ...international];
  }, []);

  // Nearby logic (Sydney suburbs + saved events boost)
  const nearbyEvents = useCallback((events: EventData[]): EventData[] => {
    if (!isSydneyUser) return filterByLocation(events);

    const score = (event: EventData): number => {
      const city = event.city.toLowerCase();
      const country = event.country.toLowerCase();
      let s = city.includes('sydney') ? 3 : country === 'australia' ? 2 : 1;
      if (savedEvents.includes(event.id)) s += 2;
      return s;
    };

    return [...events].sort((a, b) => score(b) - score(a)).slice(0, 50);
  }, [filterByLocation, isSydneyUser, savedEvents]);

  const locationRadius = useMemo(() => {
    if (city && city !== 'All') return 'city';
    if (country && country !== 'All') return 'country';
    return 'all';
  }, [city, country]);

  return useMemo(() => ({
    filterByLocation,
    filterSydneyEvents,
    filterSydneyCommunities,
    prioritizeSydney,
    nearbyEvents,
    country,
    city,
    isSydneyUser,
    locationRadius,
  }), [
    filterByLocation, filterSydneyEvents, filterSydneyCommunities,
    prioritizeSydney, nearbyEvents, country, city, isSydneyUser, locationRadius
  ]);
}

// Sydney-specific hook
export function useSydneyFilter() {
  const filters = useLocationFilter();

  return {
    ...filters,
    // Sydney hyper-local shortcuts
    sydneyEventsOnly: filters.filterSydneyEvents,
    sydneyCommunitiesOnly: filters.filterSydneyCommunities,
    sydneyFirst: filters.prioritizeSydney,
  };
}

// Typed convenience filters
export function useSydneyEventsFilter(events: EventData[]) {
  const { filterSydneyEvents } = useLocationFilter();
  return filterSydneyEvents(events);
}

export function useSydneyCommunitiesFilter(communities: Community[]) {
  const { filterSydneyCommunities } = useLocationFilter();
  return filterSydneyCommunities(communities);
}

// All hooks above are already exported via their declarations.
