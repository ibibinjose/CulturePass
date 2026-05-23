/**
 * Phase 5 — Unified “offering” view across domain collections.
 * Source of truth stays in restaurants / shops / activities / movies; this is a read model + mappers.
 */

import type { ActivityData } from './activity';
import type { MovieData, MovieShowtime } from './movie';
import type { RestaurantData, RestaurantDeal } from './restaurant';
import type { ShopData, ShopDeal } from './shopping';

export type OfferingDomain = 'restaurant' | 'shopping' | 'activity' | 'movie';

export type OfferingKind =
  | 'restaurant_deal'
  | 'restaurant_menu_highlight'
  | 'shopping_deal'
  | 'activity_listing'
  | 'movie_showtime';

export const OFFERING_DOMAINS: readonly OfferingDomain[] = [
  'restaurant',
  'shopping',
  'activity',
  'movie',
] as const;

export const OFFERING_KINDS: readonly OfferingKind[] = [
  'restaurant_deal',
  'restaurant_menu_highlight',
  'shopping_deal',
  'activity_listing',
  'movie_showtime',
] as const;

export interface UnifiedOffering {
  /** Composite id (not a single Firestore document). */
  id: string;
  kind: OfferingKind;
  domain: OfferingDomain;
  parentId: string;
  parentTitle: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  /** Smallest currency unit when known (e.g. showtime.price treated as whole AUD dollars → × 100). */
  priceCents?: number;
  priceLabel?: string;
  currency?: string;
  city: string;
  country: string;
  validFrom?: string;
  validTo?: string;
  isPromoted: boolean;
  /** In-app route (Expo Router), e.g. /r/abc */
  href: string;
  externalUrl?: string;
}

function showtimePriceCents(price: number): number | undefined {
  if (!Number.isFinite(price)) return undefined;
  return Math.max(0, Math.round(price * 100));
}

function showtimePriceLabel(price: number, currency: string): string {
  const sym = currency === 'AUD' ? '$' : `${currency} `;
  return `${sym}${Number(price).toFixed(Number.isInteger(price) ? 0 : 2)}`;
}

export function offeringsFromRestaurant(r: RestaurantData): UnifiedOffering[] {
  const base = { city: r.city, country: r.country, parentId: r.id, parentTitle: r.name, isPromoted: r.isPromoted };
  const href = `/r/${r.id}`;
  const out: UnifiedOffering[] = [];

  for (const deal of r.deals ?? []) {
    if (deal.isActive === false) continue;
    out.push({
      id: `restaurant:${r.id}:deal:${deal.id}`,
      kind: 'restaurant_deal',
      domain: 'restaurant',
      ...base,
      title: deal.title,
      subtitle: deal.discount,
      description: deal.description,
      imageUrl: r.imageUrl,
      validTo: deal.validTill,
      href,
    });
  }

  (r.menuHighlights ?? []).forEach((line, idx) => {
    const title = line.trim();
    if (!title) return;
    out.push({
      id: `restaurant:${r.id}:menu:${idx}`,
      kind: 'restaurant_menu_highlight',
      domain: 'restaurant',
      ...base,
      title,
      subtitle: r.cuisine,
      imageUrl: r.imageUrl,
      href,
    });
  });

  return out;
}

export function offeringsFromShop(s: ShopData): UnifiedOffering[] {
  const base = { city: s.city, country: s.country, parentId: s.id, parentTitle: s.name, isPromoted: s.isPromoted };
  const href = `/s/${s.id}`;
  const out: UnifiedOffering[] = [];

  for (const deal of s.deals ?? []) {
    if (deal.isActive === false) continue;
    out.push({
      id: `shopping:${s.id}:deal:${deal.id}`,
      kind: 'shopping_deal',
      domain: 'shopping',
      ...base,
      title: deal.title,
      subtitle: deal.discount,
      description: deal.description,
      imageUrl: s.imageUrl,
      validTo: deal.validTill,
      href,
    });
  }

  return out;
}

export function offeringFromActivity(a: ActivityData): UnifiedOffering | null {
  if (a.status === 'draft' || a.status === 'archived') return null;
  return {
    id: `activity:${a.id}`,
    kind: 'activity_listing',
    domain: 'activity',
    parentId: a.id,
    parentTitle: a.name,
    title: a.name,
    subtitle: a.category,
    description: a.description,
    imageUrl: a.imageUrl,
    priceLabel: a.priceLabel,
    city: a.city,
    country: a.country,
    isPromoted: a.isPromoted === true,
    href: `/a/${a.id}`,
  };
}

export function offeringsFromMovie(m: MovieData, currency = 'AUD'): UnifiedOffering[] {
  const base = {
    city: m.city,
    country: m.country,
    parentId: m.id,
    parentTitle: m.title,
    isPromoted: m.isPromoted,
  };
  const href = `/m/${m.id}`;
  const poster = m.posterUrl;

  return (m.showtimes ?? []).map((st: MovieShowtime) => ({
    id: `movie:${m.id}:showtime:${st.id}`,
    kind: 'movie_showtime' as const,
    domain: 'movie' as const,
    ...base,
    title: m.title,
    subtitle: `${st.venueName} · ${st.date} ${st.time}`,
    description: m.description,
    imageUrl: poster,
    priceCents: showtimePriceCents(st.price),
    priceLabel: showtimePriceLabel(st.price, currency),
    currency,
    validFrom: st.date,
    href,
    externalUrl: st.bookingUrl,
  }));
}

export function buildUnifiedOfferings(input: {
  restaurants: RestaurantData[];
  shops: ShopData[];
  activities: ActivityData[];
  movies: MovieData[];
}): UnifiedOffering[] {
  const rows: UnifiedOffering[] = [
    ...input.restaurants.flatMap(offeringsFromRestaurant),
    ...input.shops.flatMap(offeringsFromShop),
    ...input.activities.map(offeringFromActivity).filter((o): o is UnifiedOffering => o !== null),
    ...input.movies.flatMap((m) => offeringsFromMovie(m)),
  ];

  rows.sort((a, b) => {
    const pr = Number(b.isPromoted) - Number(a.isPromoted);
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });

  return rows;
}

export function filterUnifiedOfferings(
  rows: UnifiedOffering[],
  kinds?: ReadonlySet<OfferingKind>,
  domains?: ReadonlySet<OfferingDomain>,
): UnifiedOffering[] {
  return rows.filter(
    (o) =>
      (!domains || domains.size === 0 || domains.has(o.domain)) &&
      (!kinds || kinds.size === 0 || kinds.has(o.kind)),
  );
}
