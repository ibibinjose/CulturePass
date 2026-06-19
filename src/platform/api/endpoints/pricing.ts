import type { PricingPlansResponse } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export interface MembershipPricingResponse {
  market: string;
  country: string;
  currency: string;
  plans: PricingPlansResponse['membership'];
  platform: PricingPlansResponse['platform'];
  organizer: PricingPlansResponse['organizer'];
  fetchedAt: string;
}

export function createPricingNamespace(request: ApiRequestFn) {
  return {
    plans: (country?: string) => {
      const q = country?.trim() ? `?country=${encodeURIComponent(country.trim())}` : '';
      return request<PricingPlansResponse>('GET', `api/pricing/plans${q}`);
    },
    membership: (country?: string) => {
      const q = country?.trim() ? `?country=${encodeURIComponent(country.trim())}` : '';
      return request<MembershipPricingResponse>('GET', `api/pricing/membership${q}`);
    },
  };
}