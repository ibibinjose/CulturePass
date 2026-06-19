import { buildOrganizerTicketingFees } from '@shared/constants/organizerTicketingFees';
import type { OrganizerTicketingFeesConfig, PricingPlansResponse } from '@/shared/schema';

import hostPricing from '@/data/static/hostPricing.json';

/** Matches functions stripeConnect DEFAULT_FEE_BPS when API is unavailable. */
const FALLBACK_CONNECT_BPS = 1000;

type TierCardConfig = (typeof hostPricing.tiers)[number];

export type ResolvedTierCard = TierCardConfig & {
  priceLine: string;
  priceSub: string;
  isLive: boolean;
};

const FREE_TIER_COPY = {
  priceLine: 'Nothing.',
  priceSub: 'zero.',
} as const;

export function resolveOrganizerTierCards(
  organizer: OrganizerTicketingFeesConfig | undefined,
  options?: { market?: string; currency?: string; useFallback?: boolean },
): ResolvedTierCard[] {
  const fees =
    organizer
    ?? (options?.useFallback
      ? buildOrganizerTicketingFees({
          connectPlatformFeeBps: FALLBACK_CONNECT_BPS,
          currency: options.currency ?? 'AUD',
          market: options.market ?? 'AU',
        })
      : undefined);

  return hostPricing.tiers.map((tier) => {
    if (tier.id === 'free') {
      return { ...tier, ...FREE_TIER_COPY, isLive: false };
    }
    if (tier.id === 'ngo') {
      return { ...tier, isLive: false };
    }
    if (tier.id === 'standard' && fees?.standard) {
      return {
        ...tier,
        priceLine: fees.standard.priceLine,
        priceSub: fees.standard.priceSub,
        isLive: Boolean(organizer),
      };
    }
    if (tier.id === 'premium' && fees?.premium) {
      return {
        ...tier,
        priceLine: fees.premium.priceLine,
        priceSub: fees.premium.priceSub,
        isLive: Boolean(organizer),
      };
    }
    return { ...tier, isLive: false };
  });
}

export function organizerPricingMeta(plans: PricingPlansResponse | undefined): string | null {
  if (!plans?.organizer) return null;
  const { country, currency, organizer } = plans;
  return `Live fees for ${country} (${currency}): Standard ${organizer.standard.priceLine}, Premium ${organizer.premium.priceLine} — synced from Stripe Connect (${organizer.connectPlatformFeeBps / 100}% base).`;
}