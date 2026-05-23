"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CULTURE_EXPLORER_POINT_MULTIPLIER = exports.BADGE_TIER_THRESHOLDS = void 0;
/**
 * Number of distinct events from the explored culture needed to reach each tier.
 * `none` is the implicit starting state (0 events).
 */
exports.BADGE_TIER_THRESHOLDS = {
    explorer: 1,
    insider: 3,
    local: 8,
    champion: 20,
};
/** Multiplier applied to base reward points when the event is for an explored, non-root culture. */
exports.CULTURE_EXPLORER_POINT_MULTIPLIER = 2;
//# sourceMappingURL=cultureExplorer.js.map