/** Discover community-home promo banner (admin-managed). */
export interface CommunityHomeBanner {
    id: string;
    title: string;
    subtitle?: string;
    ctaLabel: string;
    /** Expo Router path, e.g. `/(tabs)/community` */
    ctaRoute: string;
    imageUrl?: string;
    /** Bumped on publish or admin "rebroadcast" so dismissed users see it again. */
    revision: number;
    isActive: boolean;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
}
export interface CommunityHomeBannerDismissState {
    bannerId: string;
    revision: number;
}
//# sourceMappingURL=communityHomeBanner.d.ts.map