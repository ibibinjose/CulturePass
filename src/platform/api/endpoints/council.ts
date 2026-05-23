import type { ApiRequestFn } from '../client';
import type { CouncilData, CouncilLgaContext } from '@/shared/schema';

export function createCouncilNamespace(request: ApiRequestFn) {
  return {
    /** Browse LGAs for directory / location pickers */
    list: async (params?: {
      q?: string;
      state?: string;
      verificationStatus?: 'verified' | 'unverified';
      sortBy?: 'name' | 'state' | 'verification';
      sortDir?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.state) qs.set('state', params.state);
      if (params?.verificationStatus) qs.set('verificationStatus', params.verificationStatus);
      if (params?.sortBy) qs.set('sortBy', params.sortBy);
      if (params?.sortDir) qs.set('sortDir', params.sortDir);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
      const q = qs.toString();
      const res = await request<{ councils: CouncilData[]; hasNextPage?: boolean; totalCount?: number; source?: string } | CouncilData[]>(
        'GET',
        `api/council/list${q ? `?${q}` : ''}`,
      );
      return {
        councils: Array.isArray(res) ? res : ((res as { councils: CouncilData[] }).councils ?? []),
        hasNextPage: !!(res as { hasNextPage?: boolean }).hasNextPage,
        totalCount: (res as { totalCount?: number }).totalCount ?? 0,
        source: (res as { source?: string }).source,
      };
    },
    /** Public: best LGA match for a place (e.g. business detail) */
    resolve: async (params?: { city?: string; state?: string; country?: string }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.state) qs.set('state', params.state);
      if (params?.country) qs.set('country', params.country);
      const q = qs.toString();
      return request<CouncilLgaContext>('GET', `api/council/resolve${q ? `?${q}` : ''}`);
    },
    getSelected: async () => {
      const res = await request<CouncilLgaContext>('GET', 'api/council/selected');
      return res?.council ? res : null;
    },
    select: (councilId: string) =>
      request<{ success: boolean; councilId: string; lgaCode: string | null }>('POST', 'api/council/select', { councilId }),
    /** Signed-in user’s LGA context for discover / calendar */
    my: async (params?: { postcode?: number; suburb?: string; city?: string; state?: string; country?: string }) => {
      const qs = new URLSearchParams();
      if (params?.postcode) qs.set('postcode', String(params.postcode));
      if (params?.suburb) qs.set('suburb', params.suburb);
      if (params?.city) qs.set('city', params.city);
      if (params?.state) qs.set('state', params.state);
      if (params?.country) qs.set('country', params.country);
      const q = qs.toString();
      const res = await request<CouncilLgaContext>('GET', `api/council/my${q ? `?${q}` : ''}`);
      return res?.council ? res : null;
    },
    get: (id: string) => request<CouncilData>('GET', `api/council/${id}`),
  };
}
