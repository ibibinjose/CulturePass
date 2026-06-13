/**
 * Default membership catalog amounts (smallest currency unit) when Stripe is unavailable.
 * Production charges always come from Stripe Price IDs — these are display fallbacks + tests.
 */

import type { PricingMarketCode } from './pricingMarkets';

export type BillingPeriod = 'monthly' | 'yearly';

export type MembershipPlanId =
  | 'culturepass_plus_monthly'
  | 'culturepass_plus_yearly';

export interface CatalogMembershipAmounts {
  monthlyCents: number;
  yearlyCents: number;
  currency: string;
}

/** Reference catalog — update when Stripe Prices change; used for UI fallback + analytics baseline */
export const MEMBERSHIP_CATALOG_AMOUNTS: Record<PricingMarketCode, CatalogMembershipAmounts> = {
  AU: { monthlyCents: 799, yearlyCents: 6900, currency: 'AUD' },
  US: { monthlyCents: 499, yearlyCents: 4900, currency: 'USD' },
  GB: { monthlyCents: 499, yearlyCents: 4900, currency: 'GBP' },
  NZ: { monthlyCents: 899, yearlyCents: 7900, currency: 'NZD' },
  AE: { monthlyCents: 2900, yearlyCents: 24900, currency: 'AED' },
  DEFAULT: { monthlyCents: 799, yearlyCents: 6900, currency: 'AUD' },
};

export function membershipPlanId(period: BillingPeriod): MembershipPlanId {
  return period === 'yearly' ? 'culturepass_plus_yearly' : 'culturepass_plus_monthly';
}

export function stripeLookupKey(market: string, period: BillingPeriod): string {
  return `culturepass_plus_${period}_${market.toLowerCase()}`;
}