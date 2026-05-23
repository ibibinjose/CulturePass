import type { FirestoreEvent } from './events';

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
  /** User's root cultures (e.g. cultureIds from culturalIdentity) */
  cultureIds?: string[];
  /** Cultures the user is exploring — awarded 2/3 the weight of root matches */
  exploringCultureIds?: string[];
  savedEventIds?: string[];
  joinedCommunityIds?: string[];
  viewedEventIds?: string[];
}

export interface RankedEventResult {
  event: FirestoreEvent;
  rankScore: number;
  quality: EventQualityScore;
  matchReasons: string[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeEventQuality(event: FirestoreEvent): EventQualityScore {
  const organizerReputationScore = clampScore(event.organizerReputationScore ?? 50);
  const culturalRelevanceScore = clampScore(
    event.culturalRelevanceScore ?? ((event.cultureTag?.length ?? 0) * 20),
  );
  const popularityScore = clampScore(
    event.popularityScore ??
      ((event.attending ?? 0) * 0.8 +
        (event.ticketsSold ?? 0) * 0.4 +
        (event.isFeatured ? 12 : 0)),
  );
  const qualityScore = clampScore(
    organizerReputationScore * 0.35 + culturalRelevanceScore * 0.3 + popularityScore * 0.35,
  );
  return { eventId: event.id, qualityScore, organizerReputationScore, culturalRelevanceScore, popularityScore };
}

export function rankEventsForDiscover(
  events: FirestoreEvent[],
  signals: RecommendationSignalSet,
): RankedEventResult[] {
  const rootPrefs = new Set((signals.cultureIds ?? []).map((c) => c.toLowerCase()));
  const exploringPrefs = new Set((signals.exploringCultureIds ?? []).map((c) => c.toLowerCase()));
  const savedPrefs = new Set(signals.savedEventIds ?? []);

  return events
    .map((event) => {
      const quality = computeEventQuality(event);
      const reasons: string[] = [];
      let affinity = 0;

      if (signals.city && event.city?.toLowerCase() === signals.city.toLowerCase()) {
        affinity += 8;
        reasons.push('same_city');
      }
      if (signals.country && event.country?.toLowerCase() === signals.country.toLowerCase()) {
        affinity += 6;
        reasons.push('same_country');
      }
      if (savedPrefs.has(event.id)) {
        affinity += 10;
        reasons.push('saved');
      }

      // Merge both cultureTag variants, normalise to lowercase
      const tags = [
        ...(event.cultureTag ?? []),
        ...(event.cultureTags ?? []),
      ].map((t) => t.toLowerCase());

      if (tags.some((t) => rootPrefs.has(t))) {
        affinity += 60;
        reasons.push('culture_match');
      } else if (tags.some((t) => exploringPrefs.has(t))) {
        // Exploring path — meaningful boost but below root culture
        affinity += 40;
        reasons.push('exploring_culture_match');
      }

      if (event.isFeatured) {
        affinity += 5;
        reasons.push('featured');
      }

      const rankScore = clampScore(quality.qualityScore * 0.75 + affinity);
      return { event, rankScore, quality, matchReasons: reasons };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}
