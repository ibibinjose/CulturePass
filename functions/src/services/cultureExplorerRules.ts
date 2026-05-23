/**
 * Pure decision rules for the Culture Explorer service.
 *
 * Kept in a separate module from `cultureExplorer.ts` so tests can exercise
 * the logic without booting firebase-admin. No imports from `../admin`,
 * `./wallets`, etc. — pure functions only.
 */

import { calculateRewardPoints } from '../handlers/utils';
import type { CultureBadgeTier, CultureQuest } from '../../../shared/schema';
import {
  BADGE_TIER_THRESHOLDS,
  CULTURE_EXPLORER_POINT_MULTIPLIER,
} from '../../../shared/schema';

/** Lowercase a value safely for tag comparison. */
export function tagify(value: string | undefined | null): string {
  return String(value ?? '').trim().toLowerCase();
}

/**
 * Pick the "primary" culture tag for an event. Prefers `cultureTag[]`
 * (canonical) and falls back to `cultureTags[]`. Returns the first
 * non-empty tag (lowercased) or null.
 */
export function pickEventCultureTag(event: {
  cultureTag?: string[];
  cultureTags?: string[];
}): string | null {
  const sources: string[] = [];
  if (Array.isArray(event.cultureTag)) sources.push(...event.cultureTag);
  if (Array.isArray(event.cultureTags)) sources.push(...event.cultureTags);
  const tags = sources.map(tagify).filter(Boolean);
  if (tags.length === 0) return null;
  return tags[0];
}

/**
 * Should an event for `eventCultureTag` award the explorer bonus to a user
 * with `exploringCultureIds` (canonical IDs) and `rootCultureIds`?
 *
 * Qualifies when the event's tag matches one of the user's exploring IDs
 * AND that same id is NOT in the user's root cultureIds.
 */
export function qualifiesForExplorerBonus(
  eventCultureTag: string | null,
  exploringCultureIds: string[] | undefined,
  rootCultureIds: string[] | undefined,
): boolean {
  if (!eventCultureTag) return false;
  const tag = tagify(eventCultureTag);
  const exploring = (exploringCultureIds ?? []).map(tagify);
  const roots = (rootCultureIds ?? []).map(tagify);
  if (!exploring.includes(tag)) return false;
  if (roots.includes(tag)) return false;
  return true;
}

/**
 * Compute the bonus points portion (additional reward over the base reward)
 * from a paid amount.
 *
 *   base = floor(amountCents / 100)               — already credited elsewhere
 *   total = base * CULTURE_EXPLORER_POINT_MULTIPLIER
 *   bonus = total - base                          — credited by the service
 */
export function computeBonusPoints(amountCents: number): number {
  const base = calculateRewardPoints(amountCents);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const total = base * CULTURE_EXPLORER_POINT_MULTIPLIER;
  return Math.max(0, total - base);
}

/** Translate a count of distinct attended events into a badge tier. */
export function evaluateBadgeTier(eventsCount: number): CultureBadgeTier {
  if (eventsCount >= BADGE_TIER_THRESHOLDS.champion) return 'champion';
  if (eventsCount >= BADGE_TIER_THRESHOLDS.local) return 'local';
  if (eventsCount >= BADGE_TIER_THRESHOLDS.insider) return 'insider';
  if (eventsCount >= BADGE_TIER_THRESHOLDS.explorer) return 'explorer';
  return 'none';
}

/** Compute the next milestone (count + label) for a current event count. */
export function nextBadgeMilestone(
  eventsCount: number,
): { at: number; label: Exclude<CultureBadgeTier, 'none'> } | null {
  const ladder: Array<[number, Exclude<CultureBadgeTier, 'none'>]> = [
    [BADGE_TIER_THRESHOLDS.explorer, 'explorer'],
    [BADGE_TIER_THRESHOLDS.insider, 'insider'],
    [BADGE_TIER_THRESHOLDS.local, 'local'],
    [BADGE_TIER_THRESHOLDS.champion, 'champion'],
  ];
  for (const [at, label] of ladder) {
    if (eventsCount < at) return { at, label };
  }
  return null;
}

/**
 * Decide whether an event satisfies a quest — same culture tag, and the
 * optional city/country scope matches when present.
 */
export function eventMatchesQuest(
  quest: Pick<CultureQuest, 'cultureTag' | 'city' | 'country'>,
  event: { city?: string; country?: string; cultureTag?: string[]; cultureTags?: string[] },
): boolean {
  const tag = pickEventCultureTag(event);
  if (!tag) return false;
  if (tagify(tag) !== tagify(quest.cultureTag)) return false;
  if (quest.city && tagify(event.city) !== tagify(quest.city)) return false;
  if (quest.country && tagify(event.country) !== tagify(quest.country)) return false;
  return true;
}

/**
 * Pure helper: project the next progress state given the current state, a
 * new eventId, and the quest. Returns null when the event is a duplicate
 * (already in the ledger). Used by the awardOnTicketPaid orchestrator and
 * by tests.
 */
export interface QuestProgressInput {
  eventsAttended: string[];
  count: number;
  completedAt?: string | null;
  rewardClaimedAt?: string | null;
}

export interface QuestProgressOutput {
  eventsAttended: string[];
  count: number;
  completedAt: string | null;
  rewardClaimedAt: string | null;
  justCompleted: boolean;
}

export function applyQuestEvent(
  current: QuestProgressInput,
  eventId: string,
  quest: Pick<CultureQuest, 'targetCount'>,
  nowIso: string,
): QuestProgressOutput | null {
  if (current.eventsAttended.includes(eventId)) return null;
  const eventsAttended = [...current.eventsAttended, eventId];
  const count = Math.min(eventsAttended.length, quest.targetCount);
  const wasCompleted = Boolean(current.completedAt);
  const justCompleted = !wasCompleted && count >= quest.targetCount;
  return {
    eventsAttended,
    count,
    completedAt: wasCompleted ? (current.completedAt ?? null) : justCompleted ? nowIso : null,
    rewardClaimedAt: current.rewardClaimedAt ?? null,
    justCompleted,
  };
}
