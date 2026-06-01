/**
 * CultureShop marketplace homepage feed — category sections of shops & perks (UNiDAYS-style rails).
 */
export type MarketplaceTileKind = 'shop' | 'perk';
export interface MarketplaceTile {
    id: string;
    kind: MarketplaceTileKind;
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    /** Short discount / perk label, e.g. "15% off" */
    badge?: string | null;
    /** Expo Router path */
    href: string;
    /** True when tile destination requires CulturePass+ (UI may blur / gate) */
    premiumLocked?: boolean;
}
export interface MarketplaceSection {
    id: string;
    title: string;
    subtitle?: string | null;
    viewMoreHref?: string | null;
    viewMoreLabel?: string | null;
    items: MarketplaceTile[];
}
export interface MarketplaceFeedResponse {
    sections: MarketplaceSection[];
    /** Optional marketing line for hero */
    heroTagline?: string;
}
//# sourceMappingURL=marketplaceFeed.d.ts.map