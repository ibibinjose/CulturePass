/**
 * Pricing markets — maps user-facing country names to billing market + currency.
 * Stripe Price IDs are resolved per market via Functions env (see pricing service).
 */

export type PricingMarketCode = 'AU' | 'US' | 'GB' | 'NZ' | 'AE' | 'DEFAULT';

export interface PricingMarket {
  code: PricingMarketCode;
  label: string;
  currency: string;
  /** Primary country name for display / default resolution */
  defaultCountry: string;
  /** Country names accepted by resolvePricingMarket (case-insensitive) */
  countries: string[];
}

export const DEFAULT_PRICING_MARKET: PricingMarketCode = 'AU';

export const PRICING_MARKETS: PricingMarket[] = [
  {
    code: 'AU',
    label: 'Australia',
    currency: 'AUD',
    defaultCountry: 'Australia',
    countries: ['Australia', 'AU'],
  },
  {
    code: 'US',
    label: 'United States',
    currency: 'USD',
    defaultCountry: 'United States',
    countries: ['United States', 'US', 'USA'],
  },
  {
    code: 'GB',
    label: 'United Kingdom',
    currency: 'GBP',
    defaultCountry: 'United Kingdom',
    countries: ['United Kingdom', 'GB', 'UK', 'Great Britain'],
  },
  {
    code: 'NZ',
    label: 'New Zealand',
    currency: 'NZD',
    defaultCountry: 'New Zealand',
    countries: ['New Zealand', 'NZ'],
  },
  {
    code: 'AE',
    label: 'United Arab Emirates',
    currency: 'AED',
    defaultCountry: 'United Arab Emirates',
    countries: ['United Arab Emirates', 'UAE', 'AE'],
  },
];

const MARKET_BY_CODE = new Map(PRICING_MARKETS.map((m) => [m.code, m]));

const COUNTRY_TO_MARKET = new Map<string, PricingMarketCode>();
for (const market of PRICING_MARKETS) {
  for (const c of market.countries) {
    COUNTRY_TO_MARKET.set(c.trim().toLowerCase(), market.code);
  }
}

export function getPricingMarket(code: PricingMarketCode): PricingMarket {
  return MARKET_BY_CODE.get(code) ?? MARKET_BY_CODE.get(DEFAULT_PRICING_MARKET)!;
}

/** Resolve billing market from a user country string (e.g. users/{uid}.country). */
export function resolvePricingMarket(country?: string | null): PricingMarket {
  if (!country?.trim()) {
    return getPricingMarket(DEFAULT_PRICING_MARKET);
  }
  const key = country.trim().toLowerCase();
  const code = COUNTRY_TO_MARKET.get(key) ?? DEFAULT_PRICING_MARKET;
  return getPricingMarket(code);
}