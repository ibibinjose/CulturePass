import type { PerkData } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export function createPerksNamespace(request: ApiRequestFn) {
  return {
    list: async (params?: { city?: string; country?: string; category?: string; q?: string; status?: string; pageSize?: number }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.category) qs.set('category', params.category);
      if (params?.q) qs.set('q', params.q);
      if (params?.status) qs.set('status', params.status);
      if (params?.pageSize != null) qs.set('pageSize', String(params.pageSize));
      const query = qs.toString();
      const res = await request<PerkData[] | { perks: PerkData[] }>('GET', `api/perks${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : (res as { perks: PerkData[] }).perks || [];
    },
    get: (id: string) => request<PerkData>('GET', `api/perks/${id}`),
    create: (data: Record<string, unknown>) => request<PerkData>('POST', 'api/perks', data),
    redeem: (id: string) =>
      request<{ success: boolean; redemption?: Record<string, unknown> }>('POST', `api/perks/${id}/redeem`),
    redemptions: () =>
      request<{ redemptions: { id: string; perkId: string; userId: string; redeemedAt: string; status?: string }[] }>('GET', 'api/redemptions'),
    update: (id: string, data: Partial<PerkData>) => request<PerkData>('PUT', `api/perks/${id}`, data),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/perks/${id}`),
  };
}
