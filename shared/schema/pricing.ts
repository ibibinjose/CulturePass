import type { BillingPeriod, MembershipPlanId } from '../constants/pricingCatalog';

export type { BillingPeriod, MembershipPlanId } from '../constants/pricingCatalog';

export type PricingPlanProduct = 'culturepass_plus' | 'platform_fee';

export type PricingAmountSource = 'stripe' | 'catalog' | 'firestore';

/** Canonical membership plan row returned by GET /api/pricing/plans */
export interface PricingPlan {
  id: MembershipPlanId;
  product: PricingPlanProduct;
  billingPeriod: BillingPeriod;
  /** Market code — AU, US, GB, … */
  market: string;
  /** Resolved country label for this market */
  country: string;
  currency: string;
  amountCents: number;
  /** Pre-formatted display string (server-side Intl) */
  amountFormatted: string;
  /** Monthly equivalent when billingPeriod is yearly */
  perMonthCents?: number;
  perMonthFormatted?: string;
  /** Yearly savings vs 12× monthly (membership yearly plans) */
  savingsCents?: number;
  savingsFormatted?: string;
  stripePriceId: string | null;
  stripeLookupKey?: string | null;
  effectiveFrom?: string;
  source: PricingAmountSource;
}

export interface PlatformPricingConfig {
  connectPlatformFeeBps: number;
  connectPlatformFeePercent: number;
  defaultMarket: string;
  supportedMarkets: string[];
}

export type OrganizerTierId = 'standard' | 'premium';

/** Paid-ticket fee row for organiser pricing page (derived from Connect bps). */
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

export interface PricingPlansResponse {
  market: string;
  country: string;
  currency: string;
  membership: PricingPlan[];
  platform: PlatformPricingConfig;
  /** Live organiser ticket fees — Standard matches Connect; Premium is discounted. */
  organizer: OrganizerTicketingFeesConfig;
  fetchedAt: string;
}

/** Snapshot stored on user + membershipCharges for analytics */
export interface MembershipChargeSnapshot {
  planId: MembershipPlanId;
  stripePriceId: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  amountCents: number;
  currency: string;
  market: string;
  country: string;
  billingPeriod: BillingPeriod;
  recordedAt: string;
}