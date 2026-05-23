import { searchService } from './firestore';
import { InMemoryTtlCache } from './cache';
import { rankEventsForDiscover, type RankedEventResult, type RecommendationSignalSet } from './ranking';
import type { FirestoreEvent } from './events';

export interface DiscoverFeedContract {
  meta: {
    userId: string;
    generatedAt: string;
    source: 'cache' | 'live';
  };
  rankedEvents: RankedEventResult[];
  /** Top 15 events matched to the user's root or exploring cultures */
  forYouEvents: RankedEventResult[];
  trendingEvents: FirestoreEvent[];
  suggestedCommunities: string[];
}

const discoverCache = new InMemoryTtlCache(60_000);

function discoverCacheKey(userId: string, city?: string, country?: string): string {
  return `discover:${userId}:${city ?? 'any'}:${country ?? 'any'}`;
}

export async function getDiscoverFeedWithContracts(
  userId: string,
  signals: RecommendationSignalSet,
): Promise<DiscoverFeedContract> {
  const key = discoverCacheKey(userId, signals.city, signals.country);
  const cached = discoverCache.get<DiscoverFeedContract>(key);
  if (cached) {
    return {
      ...cached,
      meta: { ...cached.meta, source: 'cache', generatedAt: new Date().toISOString() },
    };
  }

  const trendingEvents = (await searchService.getTrending(30)) as unknown as FirestoreEvent[];
  const allRanked = rankEventsForDiscover(trendingEvents, signals);
  const rankedEvents = allRanked.slice(0, 20);

  const forYouEvents = allRanked
    .filter((r) =>
      r.matchReasons.includes('culture_match') ||
      r.matchReasons.includes('exploring_culture_match'),
    )
    .slice(0, 15);

  const response: DiscoverFeedContract = {
    meta: {
      userId,
      generatedAt: new Date().toISOString(),
      source: 'live',
    },
    rankedEvents,
    forYouEvents,
    trendingEvents: trendingEvents.slice(0, 12),
    suggestedCommunities: [],
  };

  discoverCache.set(key, response, 60_000);
  return response;
}
