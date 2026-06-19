/**
 * Organiser paid-ticket fee display — derived from Stripe Connect platform fee (bps).
 * Standard tier matches STRIPE_CONNECT_PLATFORM_FEE_BPS; Premium is a reduced rate.
 */

import type { PricingMarketCode } from './pricingMarkets';

export type OrganizerTierId = 'standard' | 'premium';

/** Premium tier discount vs Connect bps (250 = 2.5 percentage points lower). */
export const PREMIUM_ORGANIZER_FEE_BPS_OFFSET = 250;

export interface OrganizerTicketingTierFee {
  id: OrganizerTierId;
  percentBps: number;
  percentDisplay: string;
  fixedFeeCents: number;
  fixedFeeDisplay: string | null;
  priceLine: string;
  priceSub: string;
}

export interface OrganizerTicketingFeesConfig {
  market: string;
  currency: string;
  connectPlatformFeeBps: number;
  standard: OrganizerTicketingTierFee;
  premium: OrganizerTicketingTierFee;
}

const LOCALE_BY_MARKET: Record<string, string> = {
  AU: 'en-AU',
  US: 'en-US',
  GB: 'en-GB',
  NZ: 'en-NZ',
  AE: 'ar-AE',
  DEFAULT: 'en-AU',
};

/** Optional per-ticket fixed platform fee (smallest currency unit) — 0 = percentage only. */
export const ORGANIZER_TICKET_FIXED_FEE_CENTS: Record<
  PricingMarketCode,
  { standard: number; premium: number }
> = {
  AU: { standard: 0, premium: 0 },
  US: { standard: 0, premium: 0 },
  GB: { standard: 0, premium: 0 },
  NZ: { standard: 0, premium: 0 },
  AE: { standard: 0, premium: 0 },
  DEFAULT: { standard: 0, premium: 0 },
};

export function formatOrganizerFeePercent(bps: number): string {
  const pct = bps / 100;
  const rounded = Math.round(pct * 100) / 100;
  if (rounded % 1 === 0) return `${rounded.toFixed(0)}%`;
  return `${rounded.toFixed(1).replace(/\.0$/, '')}%`;
}

function formatFixedFee(cents: number, currency: string, market: string): string | null {
  if (cents <= 0) return null;
  const locale = LOCALE_BY_MARKET[market] ?? 'en-AU';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function buildPriceLine(percentDisplay: string, fixedFeeDisplay: string | null): string {
  if (fixedFeeDisplay) return `${percentDisplay} + ${fixedFeeDisplay}`;
  return percentDisplay;
}

function buildTierFee(
  id: OrganizerTierId,
  percentBps: number,
  fixedFeeCents: number,
  currency: string,
  market: string,
): OrganizerTicketingTierFee {
  const percentDisplay = formatOrganizerFeePercent(percentBps);
  const fixedFeeDisplay = formatFixedFee(fixedFeeCents, currency, market);
  return {
    id,
    percentBps,
    percentDisplay,
    fixedFeeCents,
    fixedFeeDisplay,
    priceLine: buildPriceLine(percentDisplay, fixedFeeDisplay),
    priceSub: 'Per paid ticket',
  };
}

export function buildOrganizerTicketingFees(params: {
  connectPlatformFeeBps: number;
  currency: string;
  market: string;
}): OrganizerTicketingFeesConfig {
  const marketKey = (params.market in ORGANIZER_TICKET_FIXED_FEE_CENTS
    ? params.market
    : 'DEFAULT') as PricingMarketCode;
  const fixed = ORGANIZER_TICKET_FIXED_FEE_CENTS[marketKey] ?? ORGANIZER_TICKET_FIXED_FEE_CENTS.DEFAULT;
  const standardBps = Math.max(0, Math.min(10000, params.connectPlatformFeeBps));
  const premiumBps = Math.max(0, standardBps - PREMIUM_ORGANIZER_FEE_BPS_OFFSET);

  return {
    market: params.market,
    currency: params.currency,
    connectPlatformFeeBps: standardBps,
    standard: buildTierFee('standard', standardBps, fixed.standard, params.currency, params.market),
    premium: buildTierFee('premium', premiumBps, fixed.premium, params.currency, params.market),
  };
}