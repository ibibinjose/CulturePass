import type { ContentStatus, MembershipTier } from './common';
export type PerkType = 'discount_percent' | 'discount_fixed' | 'free_ticket' | 'early_access' | 'vip_upgrade' | 'cashback';
export interface Perk {
    id: string;
    title: string;
    description?: string;
    perkType: PerkType;
    discountPercent?: number;
    discountFixedCents?: number;
    providerType?: string;
    providerId?: string;
    providerName?: string;
    category?: string;
    isMembershipRequired?: boolean;
    requiredMembershipTier?: MembershipTier;
    usageLimit?: number;
    usedCount?: number;
    perUserLimit?: number;
    status?: ContentStatus;
    startDate?: string;
    endDate?: string;
    city?: string;
    country?: string;
    lgaCode?: string;
    councilId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    createdBy?: string;
    createdAt?: string;
}
export interface PerkRedemption {
    id: string;
    perkId: string;
    userId: string;
    redeemedAt: string;
}
export interface PerkData {
    id: string;
    title: string;
    description?: string;
    coverUrl?: string;
    thumbhash?: string;
    cultureTags?: string[];
    categories?: string[];
    priceTier?: 'free' | 'low' | 'medium' | 'high';
    perkType?: string;
    discountPercent?: number;
    partnerId?: string;
    partnerName?: string;
    status?: string;
    isMembershipRequired?: boolean;
    requiredMembershipTier?: MembershipTier;
    pointsCost?: number;
    usageLimit?: number;
    expiresAt?: string;
    city?: string;
    country?: string;
}
//# sourceMappingURL=perk.d.ts.map