import type { EventData } from './event';
export interface EventQualityScore {
    eventId: string;
    qualityScore: number;
    organizerReputationScore: number;
    culturalRelevanceScore: number;
    popularityScore: number;
}
export interface RecommendationSignalSet {
    userId: string;
    city?: string;
    country?: string;
    cultureIds?: string[];
    /** Cultures the user is exploring — awarded 2/3 the weight of root matches */
    exploringCultureIds?: string[];
    savedEventIds?: string[];
    joinedCommunityIds?: string[];
    viewedEventIds?: string[];
}
export interface RankedEventResult {
    event: EventData;
    rankScore: number;
    quality: EventQualityScore;
    matchReasons: string[];
}
export interface DiscoverFeedContract {
    meta: {
        userId: string;
        generatedAt: string;
        source: 'cache' | 'live';
    };
    rankedEvents: RankedEventResult[];
    /** Top 15 events matched to the user's root or exploring cultures */
    forYouEvents?: RankedEventResult[];
    trendingEvents: EventData[];
    suggestedCommunities: string[];
}
//# sourceMappingURL=recommendation.d.ts.map