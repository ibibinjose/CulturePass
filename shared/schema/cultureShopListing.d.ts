/**
 * CultureMarket Listings — types for the cultural marketplace.
 * Businesses can list products for sale, offer services, or link to their site.
 */
export type ShopListingType = 'product' | 'service' | 'link';
export type ShopListingStatus = 'draft' | 'active' | 'sold' | 'paused';
export interface ShopListing {
    id: string;
    /** 'product' → priced item; 'service' → bookable; 'link' → drives to external site */
    type: ShopListingType;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    priceCents?: number | null;
    isFree: boolean;
    currency: string;
    imageUrl?: string | null;
    /** Square brand/seller logo shown as white tile overlay (bottom-right of card) */
    logoUrl?: string | null;
    accentKey?: 'violet' | 'coral' | 'teal' | 'gold';
    sellerName: string;
    sellerUserId: string;
    sellerProfileId?: string | null;
    sellerAvatarUrl?: string | null;
    externalUrl?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    city?: string | null;
    country?: string | null;
    isOnline: boolean;
    cultureTags?: string[];
    cityTags?: string[];
    status: ShopListingStatus;
    isFeatured: boolean;
    tags?: string[];
    cultureTag?: string | null;
    viewCount: number;
    saveCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface MarketSubcategory {
    id: string;
    label: string;
}
export interface MarketCategory {
    id: string;
    label: string;
    icon: string;
    accentKey: 'violet' | 'coral' | 'teal' | 'gold';
    subcategories: MarketSubcategory[];
}
export declare const MARKET_CATEGORIES: MarketCategory[];
export declare const CULTURE_TAGS: string[];
export declare const CITY_TAGS: string[];
export declare const SHOP_CATEGORIES: MarketCategory[];
export type ShopListingCategory = string;
export type MarketCategoryId = string;
export interface ShopListingsResponse {
    listings: ShopListing[];
    total: number;
    hasMore: boolean;
}
export interface CreateShopListingInput {
    type: ShopListingType;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    priceCents?: number;
    isFree: boolean;
    currency?: string;
    imageUrl?: string;
    logoUrl?: string;
    externalUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    city?: string;
    country?: string;
    isOnline?: boolean;
    tags?: string[];
    cultureTag?: string;
    cultureTags?: string[];
    cityTags?: string[];
}
export interface UpdateShopListingInput extends Partial<CreateShopListingInput> {
    status?: ShopListingStatus;
}
export declare function getMockShopListings(): ShopListing[];
//# sourceMappingURL=cultureShopListing.d.ts.map