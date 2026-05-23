import type { ApiRequestFn } from '../client';
import type { EventData, Profile, User } from '@/shared/schema';

export interface SearchParams {
  q: string;
  type?: string;
  city?: string;
  country?: string;
  category?: string;
  cultureTag?: string;
  entryType?: string;
  eventType?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  lgaCode?: string;
  page?: number;
  pageSize?: number;
}

export function createSearchNamespace(request: ApiRequestFn) {
  return {
    query: (params: SearchParams) => {
      const qs = new URLSearchParams({ q: params.q });
      if (params.type) qs.set('type', params.type);
      if (params.city) qs.set('city', params.city);
      if (params.country) qs.set('country', params.country);
      if (params.category) qs.set('category', params.category);
      if (params.cultureTag) qs.set('cultureTag', params.cultureTag);
      if (params.entryType) qs.set('entryType', params.entryType);
      if (params.eventType) qs.set('eventType', params.eventType);
      if (params.publisherProfileId) qs.set('publisherProfileId', params.publisherProfileId);
      if (params.venueProfileId) qs.set('venueProfileId', params.venueProfileId);
      if (params.lgaCode) qs.set('lgaCode', params.lgaCode);
      if (params.page != null) qs.set('page', String(params.page));
      if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
      return request<{ events: EventData[]; profiles: Profile[]; movies: import('@shared/schema').MovieData[]; users: User[] }>(
        'GET',
        `api/search?${qs}`,
      );
    },
  };
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
  originalQuery: string;
}

export interface TrendingSearchItem {
  query: string;
  count: number;
}

export function createSearchFlowNamespace(request: ApiRequestFn) {
  return {
    /** Alternative query suggestions for zero-result searches */
    suggestions: (query: string) =>
      request<SearchSuggestionsResponse>(
        'GET',
        `api/search/suggestions?q=${encodeURIComponent(query)}`,
      ),

    /** Trending searches by city */
    trending: (city: string) =>
      request<{ items: TrendingSearchItem[] }>(
        'GET',
        `api/search/trending?city=${encodeURIComponent(city)}`,
      ),
  };
}
