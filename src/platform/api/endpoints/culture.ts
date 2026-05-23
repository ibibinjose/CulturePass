import type { ApiRequestFn } from '../client';

export interface CultureSuggestParams {
  q: string;
  type?: 'language' | 'ethnicity' | 'all';
  limit?: number;
}

export interface IndigenousOrganisation {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  nationOrPeople?: string;
  focusAreas: string[];
  featured: boolean;
  websiteUrl?: string;
  description: string;
  updatedAt?: string;
}

export interface IndigenousFestival {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  region: 'australia' | 'americas' | 'europe' | 'asia-pacific' | 'africa';
  indigenousLed?: boolean;
  monthHint?: string;
  significance: string;
  sourceName?: string;
  sourceUrl?: string;
  updatedAt?: string;
}

export interface IndigenousBusiness {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  category: 'art' | 'food' | 'tourism' | 'retail' | 'services';
  indigenousOwned: boolean;
  nationOrPeople?: string;
  description: string;
  websiteUrl?: string;
  featured: boolean;
  updatedAt?: string;
}

export interface IndigenousTraditionalLand {
  id: string;
  city: string;
  country: string;
  nationOrPeople: string;
  landName: string;
  traditionalCustodians: string;
  languageGroup?: string;
  description?: string;
  sourceUrl?: string;
  updatedAt?: string;
}

export function createCultureNamespace(request: ApiRequestFn) {
  return {
  suggest: (params: CultureSuggestParams) => {
    const qs = new URLSearchParams({ q: params.q });
    if (params.type) qs.set('type', params.type);
    if (params.limit != null) qs.set('limit', String(params.limit));
    return request<{ suggestions: string[]; source?: string }>('GET', `api/culture/suggest?${qs}`);
  },
  indigenousOrganisations: async (params?: { q?: string; country?: string; featured?: boolean; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.country) qs.set('country', params.country);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousOrganisation[] | { organisations: IndigenousOrganisation[] }>('GET', `api/indigenous/organisations${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { organisations: IndigenousOrganisation[] }).organisations || [];
  },
  indigenousFestivals: async (params?: {
    region?: IndigenousFestival['region'];
    indigenousOnly?: boolean;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.region) qs.set('region', params.region);
    if (params?.indigenousOnly) qs.set('indigenousOnly', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousFestival[] | { festivals: IndigenousFestival[] }>('GET', `api/indigenous/festivals${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { festivals: IndigenousFestival[] }).festivals || [];
  },
  indigenousBusinesses: async (params?: {
    q?: string;
    country?: string;
    featured?: boolean;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.country) qs.set('country', params.country);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousBusiness[] | { businesses: IndigenousBusiness[] }>('GET', `api/indigenous/businesses${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { businesses: IndigenousBusiness[] }).businesses || [];
  },
  indigenousTraditionalLands: async (city?: string) => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await request<{ lands: IndigenousTraditionalLand[] } | IndigenousTraditionalLand[]>('GET', `api/indigenous/traditional-lands${qs}`);
    return Array.isArray(res) ? res : (res as { lands: IndigenousTraditionalLand[] }).lands || [];
  },
  };
}
