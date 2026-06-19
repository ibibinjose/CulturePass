import { modulesApi } from '@/modules/api';

type SearchScope = {
  city?: string;
  country?: string;
  lgaCode?: string;
};

export function searchDirectory(params: {
  q: string;
  city?: string;
  country?: string;
  lgaCode?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  pageSize?: number;
}) {
  return modulesApi.search.query(params);
}

export async function fetchTrendingSearchSources(scope: SearchScope) {
  const [eventsPage, communities, movies, profiles] = await Promise.all([
    modulesApi.events.list({
      city: scope.city,
      country: scope.country,
      lgaCode: scope.lgaCode,
      pageSize: 120,
    }),
    modulesApi.communities.list({ city: scope.city, country: scope.country }),
    modulesApi.movies.list({
      ...(scope.city ? { city: scope.city } : {}),
      ...(scope.country ? { country: scope.country } : {}),
      limit: '80',
    }),
    modulesApi.profiles.list({ city: scope.city, country: scope.country, pageSize: 80 }),
  ]);

  return {
    events: eventsPage?.events ?? [],
    communities,
    movies,
    profiles,
  };
}
