import type {
  DailyDeal,
  DailyDealListResponse,
  MarketplaceFeedResponse,
  ShopListing,
  ShopListingsResponse,
  CreateShopListingInput,
  UpdateShopListingInput,
} from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export function createCultureShopNamespace(request: ApiRequestFn) {
  return {
    // ── Feed & deals ──────────────────────────────────────────────────────────
    feed: (params?: { city?: string; country?: string }) => {
      const qs =
        params?.city || params?.country
          ? '?' + new URLSearchParams({
              ...(params.city ? { city: params.city } : {}),
              ...(params.country ? { country: params.country } : {}),
            }).toString()
          : '';
      return request<MarketplaceFeedResponse>('GET', `api/culture-market/feed${qs}`);
    },
    dailyDeals: () => request<DailyDealListResponse>('GET', 'api/culture-shop/daily-deals'),
    createDailyDeal: (data: Record<string, unknown>) =>
      request<DailyDeal>('POST', 'api/culture-shop/daily-deals', data),
    updateDailyDeal: (id: string, data: Record<string, unknown>) =>
      request<DailyDeal>('PUT', `api/culture-shop/daily-deals/${id}`, data),
    deleteDailyDeal: (id: string) =>
      request<{ success: boolean }>('DELETE', `api/culture-shop/daily-deals/${id}`),

    // ── Listings ──────────────────────────────────────────────────────────────
    getListings: (params?: {
      category?: string;
      type?: string;
      city?: string;
      country?: string;
      limit?: number;
      featured?: boolean;
      /** When true, returns listings for the authenticated user only (requires Bearer token). */
      mine?: boolean;
    }) => {
      const p: Record<string, string> = {};
      if (params?.category) p.category = params.category;
      if (params?.type) p.type = params.type;
      if (params?.city) p.city = params.city;
      if (params?.country) p.country = params.country;
      if (params?.limit) p.limit = String(params.limit);
      if (params?.featured) p.featured = 'true';
      if (params?.mine) p.mine = 'true';
      const qs = Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : '';
      return request<ShopListingsResponse>('GET', `api/culture-market/listings${qs}`);
    },
    getListing: (id: string) =>
      request<ShopListing>('GET', `api/culture-market/listings/${id}`),
    createListing: (data: CreateShopListingInput & { sellerName?: string }) =>
      request<ShopListing>('POST', 'api/culture-market/listings', data as unknown as Record<string, unknown>),
    updateListing: (id: string, data: UpdateShopListingInput) =>
      request<ShopListing>('PUT', `api/culture-market/listings/${id}`, data as unknown as Record<string, unknown>),
    deleteListing: (id: string) =>
      request<{ success: boolean }>('DELETE', `api/culture-market/listings/${id}`),
    getCategories: () =>
      request<{ categories: { id: string; count: number }[] }>('GET', 'api/culture-market/categories'),
  };
}
