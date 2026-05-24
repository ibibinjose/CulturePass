/**
 * Culture Explorer — Cultural Passport + Quests (Phase 1).
 *
 * The Passport rewards users for attending events from cultures they want to
 * EXPLORE (not their root cultures). Quests are admin-curated city challenges
 * (e.g. "Visit 3 Lunar New Year events in Sydney") that grant bonus points
 * and unlock named badges on completion.
 *
 * Storage:
 *   - `cultureQuests/{questId}` — admin-curated quest catalog
 *   - `users/{uid}/cultureExplorerProgress/{cultureId}` — per-culture progress
 *   - `users/{uid}/questProgress/{questId}` — per-quest progress
 *
 * Awarding:
 *   - Driven by paid ticket events (no GPS check-in in v1).
 *   - Idempotent on `eventId`.
 */

/** Badge tiers earned per explored culture. Thresholds in `BADGE_TIER_THRESHOLDS`. */
export type CultureBadgeTier = 'none' | 'explorer' | 'insider' | 'local' | 'champion';

/**
 * Number of distinct events from the explored culture needed to reach each tier.
 * `none` is the implicit starting state (0 events).
 */
export const BADGE_TIER_THRESHOLDS: Record<Exclude<CultureBadgeTier, 'none'>, number> = {
  explorer:  1,
  insider:   3,
  local:     8,
  champion: 20,
};

/** Multiplier applied to base reward points when the event is for an explored, non-root culture. */
export const CULTURE_EXPLORER_POINT_MULTIPLIER = 2;

/** Admin-curated quest. */
export interface CultureQuest {
  id: string;
  title: string;
  description: string;
  /** The cultureTag (lowercased) that an event must include to count. */
  cultureTag: string;
  /** Optional city scope — when set, the event's city must match. */
  city?: string;
  /** Optional country scope — when set, the event's country must match. */
  country?: string;
  /** Number of qualifying events the user must attend to complete the quest. */
  targetCount: number;
  /** Bonus points awarded on completion (in addition to per-ticket rewards). */
  rewardPoints: number;
  /** Optional badge id awarded on completion (free-form, surfaced in UI). */
  badgeId?: string;
  /** ISO date — quest opens. */
  startsAt: string;
  /** ISO date — quest closes. */
  endsAt: string;
  /** Whether the quest is active. */
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt?: string;
}

/** Per-user, per-explored-culture progress (subcollection under the user doc). */
export interface CultureExplorerProgress {
  /** Matches the document id. */
  cultureId: string;
  /** Distinct event ids the user has attended for this culture (idempotency key). */
  eventsAttended: string[];
  /** Total bonus points awarded under this culture (multiplier portion). */
  pointsEarned: number;
  /** Highest tier reached so far. */
  badgeTier: CultureBadgeTier;
  /** ISO of the latest counted ticket. */
  lastSeenAt: string;
}

/** Per-user, per-quest progress (subcollection under the user doc). */
export interface QuestProgress {
  /** Matches the document id. */
  questId: string;
  /** Distinct event ids that have advanced this quest. */
  eventsAttended: string[];
  /** Current count toward `quest.targetCount`. */
  count: number;
  /** ISO when the quest was completed (count first reached targetCount), if any. */
  completedAt?: string;
  /** ISO when the bonus points were credited to the wallet, if any. */
  rewardClaimedAt?: string;
  /** ISO of the latest counted ticket. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

/** One row in the Passport panel — collected culture + tier + progress to next. */
export interface CulturePassportBadge {
  cultureId: string;
  cultureLabel: string;
  cultureEmoji?: string;
  eventsAttended: number;
  pointsEarned: number;
  badgeTier: CultureBadgeTier;
  /** Threshold count for the next tier, or null when the user is at champion. */
  nextTierAt: number | null;
  /** Tier label for the next milestone, or null. */
  nextTierLabel: Exclude<CultureBadgeTier, 'none'> | null;
}

/** Response for GET /api/culture-explorer/summary */
export interface CultureExplorerSummary {
  userId: string;
  /** Total wallet points (mirror of rewards summary, for one-shot panel render). */
  totalPoints: number;
  /** Sum of bonus points the user has earned via the explorer multiplier. */
  bonusPointsEarned: number;
  /** Cultures the user said they want to explore (canonical IDs). */
  exploringCultureIds: string[];
  /** One badge entry per explored culture the user has actually attended an event for. */
  badges: CulturePassportBadge[];
}

/** Per-user join on a quest, surfaced to the rail. */
export interface CultureQuestWithProgress {
  quest: CultureQuest;
  progress: {
    count: number;
    completedAt: string | null;
    rewardClaimedAt: string | null;
  };
}

/** Response for GET /api/culture-explorer/quests */
export interface CultureExplorerQuestsResponse {
  city: string;
  country: string;
  quests: CultureQuestWithProgress[];
}
