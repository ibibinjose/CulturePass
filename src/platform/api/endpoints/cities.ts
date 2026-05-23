import type { ApiRequestFn } from '../client';

export interface FeaturedCityData {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  countryEmoji: string;
  stateCode?: string;
  imageUrl?: string;
  featured: boolean;
  order: number;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export function createCitiesNamespace(request: ApiRequestFn) {
  return {
    /** Public — returns featured cities for Discover CityRail */
    featured: () =>
      request<{ cities: FeaturedCityData[] }>('GET', 'api/cities/featured').then((r) => r.cities),

    /** Admin — full city catalogue (auth + admin role). */
    listAll: () =>
      request<{ cities: FeaturedCityData[] }>('GET', 'api/cities').then((r) => r.cities),

    patch: (id: string, data: Partial<Pick<FeaturedCityData, 'featured' | 'order' | 'imageUrl' | 'name'>>) =>
      request<{ ok: boolean }>('PATCH', `api/cities/${encodeURIComponent(id)}`, data),

    seed: () => request<{ ok: boolean; message?: string }>('POST', 'api/cities/seed'),
  };
}
