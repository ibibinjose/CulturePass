/**
 * CultureShop — Daily Deals curated from rewards (wallet/points), offers (perks),
 * and featured marketplace highlights.
 */
export type DailyDealKind = 'reward' | 'offer' | 'featured';
/** Who can follow the primary link without upgrade friction */
export type DailyDealLinkPolicy = 'public' | 'premium_required';
export interface DailyDeal {
    id: string;
    title: string;
    subtitle?: string | null;
    kind: DailyDealKind;
    /** Expo Router path (e.g. /payment/wallet, /perks/abc, /offers) */
    href: string;
    perkId?: string | null;
    linkPolicy: DailyDealLinkPolicy;
    coverUrl?: string | null;
    accentKey?: 'indigo' | 'violet' | 'teal' | 'coral' | null;
    startsAt: string;
    endsAt: string;
    status: 'draft' | 'active';
    priority: number;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
}
export interface DailyDealListResponse {
    deals: DailyDeal[];
}
//# sourceMappingURL=dailyDeal.d.ts.map