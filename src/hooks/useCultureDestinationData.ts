import { useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventData, Profile } from '@/shared/schema';
import type { CultureDestinationDefinition } from '@/constants/cultureDestinations';
import type { CultureHubScope } from '@/lib/cultureDestinationScope';
import {
  countriesForCultureHubQueries,
  eventMatchesCultureTerms,
  sortEventsForCultureDestination,
} from '@/lib/cultureDestinationScope';

function profileMatchesTerms(p: Profile, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const c = p as Profile & {
    cultureTags?: string[];
    cultures?: string[];
    languageIds?: string[];
    languages?: string[];
    description?: string;
  };
  const hay = [
    p.name,
    c.description,
    p.category,
    p.city,
    p.country,
    ...(c.cultureTags ?? []),
    ...(c.cultures ?? []),
    ...(c.languageIds ?? []),
    ...(c.languages ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return terms.some((t) => hay.includes(t.toLowerCase().trim()));
}

function sortProfilesForHub(
  profiles: Profile[],
  viewerCountry: string,
  viewerStateCode: string | undefined,
): Profile[] {
  const vc = viewerCountry.toLowerCase().trim();
  const vs = viewerStateCode?.toLowerCase().trim();
  return [...profiles].sort((a, b) => {
    const ac = (a.country ?? '').toLowerCase().trim() === vc ? 1 : 0;
    const bc = (b.country ?? '').toLowerCase().trim() === vc ? 1 : 0;
    if (bc !== ac) return bc - ac;
    if (vs) {
      const as = (a as { state?: string }).state?.toLowerCase().trim() === vs ? 1 : 0;
      const bs = (b as { state?: string }).state?.toLowerCase().trim() === vs ? 1 : 0;
      if (bs !== as) return bs - as;
    }
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export type CultureDestinationQueryOptions = {
  focusCountry: string;
  focusStateCode?: string;
  scope: CultureHubScope;
};

export function useCultureDestinationData(def: CultureDestinationDefinition, options: CultureDestinationQueryOptions) {
  const { focusCountry, focusStateCode, scope } = options;
  const countries = useMemo(
    () => countriesForCultureHubQueries(focusCountry, scope),
    [focusCountry, scope],
  );
  const terms = def.matchTerms;

  const eventQueries = useQueries({
    queries: countries.map((country) => ({
      queryKey: ['culture-destination', 'events', def.slug, country, scope],
      queryFn: () => api.events.list({ country, pageSize: scope === 'singleCountry' ? 120 : 80 }),
      staleTime: 120_000,
    })),
  });

  const venueQueries = useQueries({
    queries: countries.map((country) => ({
      queryKey: ['culture-destination', 'venues', def.slug, country, scope],
      queryFn: () => api.businesses.list({ country }),
      staleTime: 300_000,
    })),
  });

  const eventData = eventQueries.map((q) => q.data);
  const eventsPending = eventQueries.some((q) => q.isPending);

  const rawEvents = useMemo(() => {
    const map = new Map<string, EventData>();
    for (const d of eventData) {
      for (const e of d?.events ?? []) {
        if (eventMatchesCultureTerms(e, terms)) map.set(e.id, e);
      }
    }
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventData.length, eventsPending, terms]);

  const allEvents = useMemo(
    () =>
      sortEventsForCultureDestination(rawEvents, focusCountry, focusStateCode, {
        originCountryHint: def.originCountryHint,
        originKeywords: def.originKeywords,
      }),
    [rawEvents, focusCountry, focusStateCode, def.originCountryHint, def.originKeywords],
  );

  const venueData = venueQueries.map((q) => q.data);
  const venuesPending = venueQueries.some((q) => q.isPending);

  const venues = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const d of venueData) {
      for (const p of d ?? []) {
        if (profileMatchesTerms(p, terms)) map.set(p.id, p);
      }
    }
    return sortProfilesForHub(Array.from(map.values()), focusCountry, focusStateCode).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueData.length, venuesPending, terms, focusCountry, focusStateCode]);

  const isLoading = eventsPending || venuesPending;

  const refetch = useCallback(() => {
    void Promise.all([
      ...eventQueries.map((q) => q.refetch()),
      ...venueQueries.map((q) => q.refetch()),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.join(','), def.slug]);

  return { allEvents, venues, isLoading, refetch, countriesQueried: countries };
}
