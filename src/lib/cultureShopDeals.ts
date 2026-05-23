/**
 * Client fallback when GET /api/culture-shop/* is unreachable or errors.
 * Mirrors functions/src/handlers/cultureShop.ts mock data shapes.
 */
import { api } from '@/lib/api';
import type { DailyDeal, MarketplaceFeedResponse, ShopListing } from '@/shared/schema';

function todayWindow(): { startsIso: string; endsIso: string } {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const startsAt = new Date(today);
  startsAt.setHours(0, 0, 0, 0);
  return { startsIso: startsAt.toISOString(), endsIso: end.toISOString() };
}

export function getClientFallbackDailyDeals(): DailyDeal[] {
  const { startsIso, endsIso } = todayWindow();
  return [
    {
      id: 'client-fallback-reward',
      title: 'Rewards & points',
      subtitle: 'Earn on tickets and redeem partner perks',
      kind: 'reward',
      href: '/payment/wallet',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 30,
      createdAt: startsIso,
      createdBy: 'client-fallback',
      accentKey: 'teal',
    },
    {
      id: 'client-fallback-offer',
      title: 'Member offers',
      subtitle: 'Browse cultural perks near you',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 20,
      createdAt: startsIso,
      createdBy: 'client-fallback',
      accentKey: 'indigo',
    },
    {
      id: 'client-fallback-plus',
      title: 'CulturePass+ exclusives',
      subtitle: 'Extra savings for subscribers',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'premium_required',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 10,
      createdAt: startsIso,
      createdBy: 'client-fallback',
      accentKey: 'violet',
    },
  ];
}

export async function fetchDailyDealsWithFallback(): Promise<{ deals: DailyDeal[]; usedFallback: boolean }> {
  try {
    const res = await api.cultureShop.dailyDeals();
    const deals = res.deals ?? [];
    if (deals.length > 0) {
      return { deals, usedFallback: false };
    }
    return { deals: getClientFallbackDailyDeals(), usedFallback: true };
  } catch {
    return { deals: getClientFallbackDailyDeals(), usedFallback: true };
  }
}

function getClientFallbackMarketplaceFeed(): MarketplaceFeedResponse {
  return {
    heroTagline:
      'Browse curated deals for fashion, food, tech and experiences — CulturePass+ unlocks premium partner links.',
    sections: [
      {
        id: 'client-fallback-discover',
        title: 'Discover offers',
        subtitle: 'Preview tiles while we load live listings',
        viewMoreHref: '/offers',
        viewMoreLabel: 'View more',
        items: [
          {
            id: 'cf-perks',
            kind: 'perk',
            title: 'Member offers',
            subtitle: 'Perks near you',
            badge: null,
            href: '/offers',
            imageUrl: null,
            premiumLocked: false,
          },
          {
            id: 'cf-shop',
            kind: 'shop',
            title: 'Shopping directory',
            subtitle: 'Stores & services',
            badge: null,
            href: '/shopping',
            imageUrl: null,
            premiumLocked: false,
          },
        ],
      },
    ],
  };
}

export async function fetchMarketplaceFeedWithFallback(params?: {
  city?: string;
  country?: string;
}): Promise<{ feed: MarketplaceFeedResponse; usedFallback: boolean }> {
  try {
    const feed = await api.cultureShop.feed(params);
    if (feed.sections?.length) {
      return { feed, usedFallback: false };
    }
    return { feed: getClientFallbackMarketplaceFeed(), usedFallback: true };
  } catch {
    return { feed: getClientFallbackMarketplaceFeed(), usedFallback: true };
  }
}

// ── Listings ──────────────────────────────────────────────────────────────────

export async function fetchListingsWithFallback(params?: {
  category?: string;
  type?: string;
  city?: string;
  country?: string;
  limit?: number;
  featured?: boolean;
}): Promise<{ listings: ShopListing[]; usedFallback: boolean }> {
  try {
    const res = await api.cultureShop.getListings(params);
    return { listings: res.listings ?? [], usedFallback: false };
  } catch {
    return { listings: [], usedFallback: false };
  }
}

export async function fetchListingWithFallback(id: string): Promise<{ listing: ShopListing | null; usedFallback: boolean }> {
  try {
    const listing = await api.cultureShop.getListing(id);
    return { listing, usedFallback: false };
  } catch {
    return { listing: null, usedFallback: false };
  }
}
