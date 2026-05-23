import type { ApiRequestFn } from '../client';
import type {
  ActivityData,
  ActivityInput,
  MovieData,
  MovieInput,
  Profile,
  RestaurantData,
  RestaurantInput,
  ShopData,
  ShopInput,
  UnifiedOffering,
} from '@/shared/schema';

function directoryNamespace<T = Profile>(request: ApiRequestFn, basePath: string) {
  return {
    list: (params?: Record<string, string>) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return request<T[]>('GET', `${basePath}${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<T>('GET', `${basePath}/${id}`),
  };
}

export function createDirectoryNamespaces(request: ApiRequestFn) {
  const restaurants = {
    list: (params?: { city?: string; country?: string; cuisine?: string }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.cuisine) qs.set('cuisine', params.cuisine);
      const q = qs.toString();
      return request<RestaurantData[]>('GET', `api/restaurants${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<RestaurantData>('GET', `api/restaurants/${id}`),
    create: (payload: RestaurantInput) =>
      request<RestaurantData>('POST', 'api/restaurants', payload),
    update: (id: string, payload: Partial<RestaurantInput>) =>
      request<RestaurantData>('PUT', `api/restaurants/${id}`, payload),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/restaurants/${id}`),
    setPromoted: (id: string, isPromoted: boolean) =>
      request<RestaurantData>('POST', `api/restaurants/${id}/promote`, { isPromoted }),
  };

  const shopping = {
    list: (params?: { city?: string; country?: string; category?: string }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.category) qs.set('category', params.category);
      const q = qs.toString();
      return request<ShopData[]>('GET', `api/shopping${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<ShopData>('GET', `api/shopping/${id}`),
    create: (payload: ShopInput) => request<ShopData>('POST', 'api/shopping', payload),
    update: (id: string, payload: Partial<ShopInput>) =>
      request<ShopData>('PUT', `api/shopping/${id}`, payload),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/shopping/${id}`),
    setPromoted: (id: string, isPromoted: boolean) =>
      request<ShopData>('POST', `api/shopping/${id}/promote`, { isPromoted }),
  };

  const movies = {
    list: (params?: Record<string, string>) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return request<MovieData[]>('GET', `api/movies${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<MovieData>('GET', `api/movies/${id}`),
    create: (payload: MovieInput) => request<MovieData>('POST', 'api/movies', payload),
    update: (id: string, payload: Partial<MovieInput>) =>
      request<MovieData>('PUT', `api/movies/${id}`, payload),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/movies/${id}`),
  };

  const activities = {
    list: async (params?: {
      city?: string;
      country?: string;
      category?: string;
      ownerId?: string;
      promoted?: boolean;
    }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.category) qs.set('category', params.category);
      if (params?.ownerId) qs.set('ownerId', params.ownerId);
      if (params?.promoted) qs.set('promoted', 'true');
      const q = qs.toString();
      const res = await request<ActivityData[] | { activities: ActivityData[] }>(
        'GET',
        `api/activities${q ? `?${q}` : ''}`,
      );
      if (Array.isArray(res)) return res;
      return (res as { activities: ActivityData[] }).activities ?? [];
    },
    get: (id: string) => request<ActivityData>('GET', `api/activities/${id}`),
    create: (payload: ActivityInput) => request<ActivityData>('POST', 'api/activities', payload),
    update: (id: string, payload: Partial<ActivityInput>) =>
      request<ActivityData>('PUT', `api/activities/${id}`, payload),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/activities/${id}`),
    promote: (id: string, isPromoted = true) =>
      request<ActivityData>('POST', `api/activities/${id}/promote`, { isPromoted }),
  };

  const offerings = {
    list: (params?: {
      city?: string;
      country?: string;
      kinds?: string;
      domains?: string;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.kinds) qs.set('kinds', params.kinds);
      if (params?.domains) qs.set('domains', params.domains);
      if (params?.limit != null) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return request<{ offerings: UnifiedOffering[]; total: number }>(
        'GET',
        `api/offerings${q ? `?${q}` : ''}`,
      );
    },
  };

  const businesses = {
    ...directoryNamespace<Profile>(request, 'api/businesses'),
    list: async (params?: { city?: string; country?: string; sponsored?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.sponsored) qs.set('sponsored', 'true');
      const q = qs.toString();
      const res = await request<{ businesses: Profile[] }>('GET', `api/businesses${q ? `?${q}` : ''}`);
      return res.businesses ?? [];
    },
  };

  return { restaurants, shopping, movies, activities, offerings, businesses };
}
