/**
 * Phase 5 — Unified “offering” view across domain collections.
 * Source of truth stays in restaurants / shops / activities / movies; this is a read model + mappers.
 */
import type { ActivityData } from './activity';
import type { MovieData } from './movie';
import type { RestaurantData } from './restaurant';
import type { ShopData } from './shopping';
export type OfferingDomain = 'restaurant' | 'shopping' | 'activity' | 'movie';
export type OfferingKind = 'restaurant_deal' | 'restaurant_menu_highlight' | 'shopping_deal' | 'activity_listing' | 'movie_showtime';
export declare const OFFERING_DOMAINS: readonly OfferingDomain[];
export declare const OFFERING_KINDS: readonly OfferingKind[];
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
export declare function offeringsFromRestaurant(r: RestaurantData): UnifiedOffering[];
export declare function offeringsFromShop(s: ShopData): UnifiedOffering[];
export declare function offeringFromActivity(a: ActivityData): UnifiedOffering | null;
export declare function offeringsFromMovie(m: MovieData, currency?: string): UnifiedOffering[];
export declare function buildUnifiedOfferings(input: {
    restaurants: RestaurantData[];
    shops: ShopData[];
    activities: ActivityData[];
    movies: MovieData[];
}): UnifiedOffering[];
export declare function filterUnifiedOfferings(rows: UnifiedOffering[], kinds?: ReadonlySet<OfferingKind>, domains?: ReadonlySet<OfferingDomain>): UnifiedOffering[];
//# sourceMappingURL=offering.d.ts.map