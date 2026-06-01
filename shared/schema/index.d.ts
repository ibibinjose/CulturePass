export * from './activity';
export * from './admin';
export * from './booking';
export * from './browse';
export * from './checkin';
export * from './common';
export * from './communityHomeBanner';
export * from './council';
export * from './cultureCard';
export * from './cultureExplorer';
export * from './cultureShopListing';
export * from './cultureToday';
export * from './cultureX';
export * from './dailyDeal';
export * from './discover';
export * from './entities';
export * from './event';
export * from './eventAnalytics';
export * from './feedItem';
export * from './feedSection';
export * from './hostApplication';
export * from './hostProfile';
export * from './hostProfileAnalytics';
export * from './hostProfileDraft';
export * from './hostProfileVersion';
export * from './hostTypes';
export * from './hostVerificationTask';
export * from './marketplaceFeed';
export * from './media';
export * from './message';
export * from './moderation';
export * from './movie';
export * from './notification';
export * from './offering';
export * from './perk';
export * from './profile';
export * from './restaurant';
export * from './savedItem';
export * from './shopping';
export * from './social';
export * from './supportTicket';
export * from './ticket';
export * from './update';
export * from './user';
export * from './waitlist';
export * from './wallet';
export * from './widget';
export interface InterestCategory {
    id: string;
    name: string;
    emoji: string;
    interests: Interest[];
    accentColor?: string;
    softColor?: string;
}
export interface Interest {
    id: string;
    name: string;
    categoryId: string;
    icon?: string;
    popularity?: number;
}
export interface AustralianState {
    code: string;
    name: string;
    emoji?: string;
}
//# sourceMappingURL=index.d.ts.map