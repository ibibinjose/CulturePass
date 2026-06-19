/**
 * Pricing catalog service — membership plans, market resolution, Stripe Price lookup.
 */

import type Stripe from 'stripe';
import {
  DEFAULT_PRICING_MARKET,
  PRICING_MARKETS,
  resolvePricingMarket,
  type PricingMarket,
  type PricingMarketCode,
} from '../../../shared/constants/pricingMarkets';
import {
  MEMBERSHIP_CATALOG_AMOUNTS,
  membershipPlanId,
  stripeLookupKey,
  type BillingPeriod,
  type MembershipPlanId,
} from '../../../shared/constants/pricingCatalog';
import { buildOrganizerTicketingFees } from '../../../shared/constants/organizerTicketingFees';
import type {
  MembershipChargeSnapshot,
  PlatformPricingConfig,
  PricingPlan,
  PricingPlansResponse,
} from '../../../shared/schema/pricing';
import { db, stripeClient } from '../admin';
import { getConnectPlatformFeeBps } from './stripeConnect';
import { nowIso } from '../handlers/utils';

const LOCALE_BY_MARKET: Record<string, string> = {
  AU: 'en-AU',
  US: 'en-US',
  GB: 'en-GB',
  NZ: 'en-NZ',
  AE: 'ar-AE',
  DEFAULT: 'en-AU',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND']);

function formatMoney(cents: number, currency: string, market: string): string {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
  const amount = isZeroDecimal ? cents : cents / 100;
  const locale = LOCALE_BY_MARKET[market] ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount);
}

function envStripePriceId(market: PricingMarketCode, period: BillingPeriod): string | null {
  const suffix = market === DEFAULT_PRICING_MARKET || market === 'DEFAULT' ? '' : `__${market}`;
  const key = period === 'monthly' ? `STRIPE_PRICE_MONTHLY_ID${suffix}` : `STRIPE_PRICE_YEARLY_ID${suffix}`;
  const value = process.env[key]?.trim();
  if (value) return value;
  if (suffix) {
    const fallbackKey = period === 'monthly' ? 'STRIPE_PRICE_MONTHLY_ID' : 'STRIPE_PRICE_YEARLY_ID';
    return process.env[fallbackKey]?.trim() ?? null;
  }
  return null;
}

async function readFirestorePlanOverride(
  market: PricingMarketCode,
  period: BillingPeriod,
): Promise<{ amountCents: number; currency: string; stripePriceId?: string } | null> {
  try {
    const docId = `${market}_${period}`;
    const snap = await db.collection('pricing_plans').doc(docId).get();
    if (!snap.exists) return null;
    const data = snap.data() as Record<string, unknown>;
    const amountCents = Number(data.amountCents);
    const currency = String(data.currency ?? '').trim();
    if (!Number.isFinite(amountCents) || amountCents < 0 || !currency) return null;
    return {
      amountCents: Math.round(amountCents),
      currency: currency.toUpperCase(),
      stripePriceId: typeof data.stripePriceId === 'string' ? data.stripePriceId : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchStripePriceAmount(
  priceId: string,
): Promise<{ amountCents: number; currency: string } | null> {
  if (!stripeClient) return null;
  try {
    const price = await stripeClient.prices.retrieve(priceId);
    const unit = price.unit_amount;
    const currency = price.currency?.toUpperCase();
    if (unit == null || !currency) return null;
    return { amountCents: unit, currency };
  } catch {
    return null;
  }
}

function catalogAmounts(market: PricingMarketCode) {
  return MEMBERSHIP_CATALOG_AMOUNTS[market] ?? MEMBERSHIP_CATALOG_AMOUNTS.DEFAULT;
}

async function buildMembershipPlan(
  market: PricingMarket,
  period: BillingPeriod,
): Promise<PricingPlan> {
  const marketCode = market.code;
  const catalog = catalogAmounts(marketCode);
  const id = membershipPlanId(period);
  let stripePriceId = envStripePriceId(marketCode, period);
  let amountCents = period === 'monthly' ? catalog.monthlyCents : catalog.yearlyCents;
  let currency = catalog.currency;
  let source: PricingPlan['source'] = 'catalog';

  const firestoreOverride = await readFirestorePlanOverride(marketCode, period);
  if (firestoreOverride) {
    amountCents = firestoreOverride.amountCents;
    currency = firestoreOverride.currency;
    if (firestoreOverride.stripePriceId) stripePriceId = firestoreOverride.stripePriceId;
    source = 'firestore';
  }

  if (stripePriceId) {
    const live = await fetchStripePriceAmount(stripePriceId);
    if (live) {
      amountCents = live.amountCents;
      currency = live.currency;
      source = 'stripe';
    }
  }

  const monthlyCents = period === 'monthly' ? amountCents : catalog.monthlyCents;
  const perMonthCents =
    period === 'yearly' ? Math.round(amountCents / 12) : undefined;
  const savingsCents =
    period === 'yearly' && monthlyCents > 0
      ? Math.max(0, monthlyCents * 12 - amountCents)
      : undefined;

  return {
    id,
    product: 'culturepass_plus',
    billingPeriod: period,
    market: marketCode,
    country: market.defaultCountry,
    currency,
    amountCents,
    amountFormatted: formatMoney(amountCents, currency, marketCode),
    perMonthCents,
    perMonthFormatted:
      perMonthCents != null ? formatMoney(perMonthCents, currency, marketCode) : undefined,
    savingsCents,
    savingsFormatted:
      savingsCents != null && savingsCents > 0
        ? formatMoney(savingsCents, currency, marketCode)
        : undefined,
    stripePriceId,
    stripeLookupKey: stripeLookupKey(marketCode, period),
    source,
  };
}

export function getPlatformPricingConfig(): PlatformPricingConfig {
  const bps = getConnectPlatformFeeBps();
  return {
    connectPlatformFeeBps: bps,
    connectPlatformFeePercent: bps / 100,
    defaultMarket: DEFAULT_PRICING_MARKET,
    supportedMarkets: PRICING_MARKETS.map((m) => m.code),
  };
}

export async function getMembershipPricingPlans(country?: string | null): Promise<PricingPlansResponse> {
  const market = resolvePricingMarket(country);
  const [monthly, yearly] = await Promise.all([
    buildMembershipPlan(market, 'monthly'),
    buildMembershipPlan(market, 'yearly'),
  ]);

  const platform = getPlatformPricingConfig();
  const organizer = buildOrganizerTicketingFees({
    connectPlatformFeeBps: platform.connectPlatformFeeBps,
    currency: market.currency,
    market: market.code,
  });

  return {
    market: market.code,
    country: market.defaultCountry,
    currency: market.currency,
    membership: [monthly, yearly],
    platform,
    organizer,
    fetchedAt: nowIso(),
  };
}

export async function resolveMembershipStripePriceId(
  period: BillingPeriod,
  country?: string | null,
): Promise<{ priceId: string; plan: PricingPlan; market: PricingMarket }> {
  const market = resolvePricingMarket(country);
  const plan = await buildMembershipPlan(market, period);
  if (!plan.stripePriceId) {
    throw new Error(`Subscription price not configured for market ${market.code} (${period})`);
  }
  return { priceId: plan.stripePriceId, plan, market };
}

export function billingPeriodFromPriceId(priceId: string): BillingPeriod | null {
  const monthly = envStripePriceId(DEFAULT_PRICING_MARKET, 'monthly');
  if (monthly && priceId === monthly) return 'monthly';
  const yearly = envStripePriceId(DEFAULT_PRICING_MARKET, 'yearly');
  if (yearly && priceId === yearly) return 'yearly';

  for (const m of PRICING_MARKETS) {
    const mc = m.code;
    const mo = envStripePriceId(mc, 'monthly');
    const ye = envStripePriceId(mc, 'yearly');
    if (mo && priceId === mo) return 'monthly';
    if (ye && priceId === ye) return 'yearly';
  }
  return null;
}

export function membershipPlanIdFromPeriod(period: BillingPeriod): MembershipPlanId {
  return membershipPlanId(period);
}

export async function recordMembershipCharge(
  userId: string,
  snapshot: MembershipChargeSnapshot,
): Promise<void> {
  await db.collection('users').doc(userId).set(
    { membershipPricing: snapshot, updatedAt: nowIso() },
    { merge: true },
  );
  await db.collection('membershipCharges').add({
    userId,
    ...snapshot,
    createdAt: nowIso(),
  });
}

export async function buildChargeSnapshotFromSubscription(
  subscription: Stripe.Subscription,
  country?: string | null,
  sessionId?: string,
): Promise<MembershipChargeSnapshot | null> {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  if (!price?.id) return null;

  const priceId = price.id;
  const period = billingPeriodFromPriceId(priceId) ?? 'monthly';
  const market = resolvePricingMarket(country);
  const amountCents = price.unit_amount ?? 0;
  const currency = (price.currency ?? market.currency).toUpperCase();

  return {
    planId: membershipPlanId(period),
    stripePriceId: priceId,
    stripeSubscriptionId: subscription.id,
    stripeSessionId: sessionId,
    amountCents,
    currency,
    market: market.code,
    country: market.defaultCountry,
    billingPeriod: period,
    recordedAt: nowIso(),
  };
}