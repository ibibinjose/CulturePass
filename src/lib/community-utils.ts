/**
 * Community utility pure functions.
 *
 * - getCommunityRecommendations: communities to suggest based on user culture tags
 * - getCommunityEventSection: upcoming events for a community detail page
 * - calculateCommunityBadgeCount: new-event badge count since last tab open
 *
 * All functions are pure (no side effects) for testability.
 */

import type { EventData, Community } from '@/shared/schema';

// ---------------------------------------------------------------------------
// getCommunityRecommendations
// ---------------------------------------------------------------------------

/**
 * Returns community recommendations for users with fewer than 3 joined communities.
 *
 * Matching logic: a community matches when its `cultureIds`, `cultures`, or
 * `cultureTags` overlap with the user's selected culture tags (case-insensitive).
 *
 * @param userCultureTags - The user's selected culture IDs (from OnboardingContext)
 * @param allCommunities - The full community catalogue
 * @param joinedCommunityIds - IDs of communities the user has already joined
 * @param maxRecs - Maximum recommendations to return (default 6)
 * @returns Recommended communities; empty array when user has ≥3 joined communities
 */
export function getCommunityRecommendations(
  userCultureTags: string[],
  allCommunities: Community[],
  joinedCommunityIds: string[],
  maxRecs = 6,
): Community[] {
  // Section is hidden when user already has 3+ communities (Requirement 6.1)
  if (joinedCommunityIds.length >= 3) return [];

  const joinedSet = new Set(joinedCommunityIds);
  const userTagsLower = new Set(userCultureTags.map((t) => t.toLowerCase()));

  if (userTagsLower.size === 0) return [];

  return allCommunities
    .filter((community) => {
      if (joinedSet.has(community.id)) return false;

      // Check cultureIds (typed)
      const cultureIds = (community.cultureIds ?? []).map((t) => t.toLowerCase());
      if (cultureIds.some((id) => userTagsLower.has(id))) return true;

      // Check legacy cultures (free-text)
      const cultures = (community.cultures ?? []).map((t) => t.toLowerCase());
      if (cultures.some((c) => userTagsLower.has(c))) return true;

      // Check cultureTags (from Profile)
      const cultureTags = (community.cultureTags ?? []).map((t) => t.toLowerCase());
      if (cultureTags.some((t) => userTagsLower.has(t))) return true;

      return false;
    })
    .slice(0, maxRecs);
}

// ---------------------------------------------------------------------------
// getCommunityEventSection
// ---------------------------------------------------------------------------

/**
 * Returns upcoming events for a community's detail page, sorted by date ascending.
 * Only events with a start date after `now` are included.
 *
 * @param communityId - The community to fetch events for
 * @param allEvents - The full event catalogue (pre-filtered by caller to be relevant)
 * @param now - Reference time
 * @param maxEvents - Maximum events to return (default 5)
 */
export function getCommunityEventSection(
  communityId: string,
  allEvents: EventData[],
  now: Date,
  maxEvents = 5,
): EventData[] {
  const nowMs = now.getTime();

  return allEvents
    .filter((event) => {
      if (event.communityId !== communityId) return false;
      if (event.status === 'cancelled' || event.status === 'draft') return false;
      return new Date(event.date).getTime() > nowMs;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents);
}

// ---------------------------------------------------------------------------
// calculateCommunityBadgeCount
// ---------------------------------------------------------------------------

/**
 * Returns the number of events added to a community after `lastOpenedMs`,
 * formatted as a display string:
 *   - "9+" for counts greater than 9
 *   - Numeric string ("1"–"9") for counts 1–9
 *   - Empty string for zero (no badge shown)
 *
 * "Added" is determined by comparing event.createdAt (or publishedAt) to lastOpenedMs.
 * Falls back to event.date when neither timestamp field is present.
 *
 * @param communityEvents - Events belonging to the community
 * @param lastOpenedMs - Timestamp (ms) of the last time the user opened the Community tab
 */
export function calculateCommunityBadgeCount(
  communityEvents: EventData[],
  lastOpenedMs: number,
): string {
  let count = 0;

  for (const event of communityEvents) {
    if (event.status === 'cancelled' || event.status === 'draft') continue;

    // Use publishedAt if available, fall back to date
    const addedMs = new Date(event.date).getTime();
    if (addedMs > lastOpenedMs) count++;
  }

  if (count === 0) return '';
  if (count > 9) return '9+';
  return String(count);
}
