/**
 * My Space tab utility pure functions.
 *
 * - orderMySpaceSections: urgency-ranked section list, empty sections excluded
 * - formatBadgeCount: notification count display ("1"–"99" or "99+", "" for 0)
 * - calculateTierProgress: membership tier percentage + points remaining
 *
 * All functions are pure (no side effects) for testability.
 */

import type { EventData, Ticket, Community } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MySpaceSectionType =
  | 'upcoming_tickets'
  | 'action_required'
  | 'saved_events'
  | 'communities';

export interface ActionItem {
  type: string;
  label: string;
}

export interface SectionData {
  type: MySpaceSectionType;
  items: unknown[];
  urgencyScore: number;
}

// ---------------------------------------------------------------------------
// Urgency scores (fixed ordering per requirements)
// ---------------------------------------------------------------------------

const URGENCY: Record<MySpaceSectionType, number> = {
  upcoming_tickets: 400,
  action_required: 300,
  saved_events: 200,
  communities: 100,
};

// ---------------------------------------------------------------------------
// orderMySpaceSections
// ---------------------------------------------------------------------------

/**
 * Returns My Space sections in urgency order with empty sections excluded.
 *
 * Order: upcoming tickets → action-required → saved events → communities
 * Empty sections are never returned.
 *
 * @param tickets - All user tickets (Requirement 8.1: upcoming tickets first)
 * @param actionItems - Action-required items (incomplete profile, expiring perks, etc.)
 * @param savedEvents - User's saved events
 * @param communities - User's joined communities
 * @param _now - Reference time (reserved for future time-based scoring)
 */
export function orderMySpaceSections(
  tickets: Ticket[],
  actionItems: ActionItem[],
  savedEvents: EventData[],
  communities: Community[],
  _now: Date,
): SectionData[] {
  const candidates: SectionData[] = [
    {
      type: 'upcoming_tickets',
      items: tickets,
      urgencyScore: URGENCY.upcoming_tickets,
    },
    {
      type: 'action_required',
      items: actionItems,
      urgencyScore: URGENCY.action_required,
    },
    {
      type: 'saved_events',
      items: savedEvents,
      urgencyScore: URGENCY.saved_events,
    },
    {
      type: 'communities',
      items: communities,
      urgencyScore: URGENCY.communities,
    },
  ];

  return candidates
    .filter((section) => section.items.length > 0)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);
}

// ---------------------------------------------------------------------------
// formatBadgeCount
// ---------------------------------------------------------------------------

/**
 * Formats a notification count for display on section header badges.
 *
 * - 0 → "" (no badge rendered)
 * - 1–99 → exact numeric string ("1", "42", "99")
 * - >99 → "99+"
 *
 * @param count - Non-negative integer notification count
 */
export function formatBadgeCount(count: number): string {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(Math.floor(count));
}

// ---------------------------------------------------------------------------
// calculateTierProgress
// ---------------------------------------------------------------------------

export interface TierProgress {
  /** Percentage progress from currentTierThreshold to nextTierThreshold, clamped [0, 100]. */
  percentage: number;
  /** Points still needed to reach the next tier. Minimum 0. */
  pointsRemaining: number;
}

/**
 * Calculates membership tier progress toward the next tier.
 *
 * percentage = (currentPoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold) * 100
 * Clamped to [0, 100].
 *
 * pointsRemaining = nextTierThreshold - currentPoints, minimum 0.
 *
 * @param currentPoints - User's current points balance
 * @param currentTierThreshold - Minimum points for the current tier
 * @param nextTierThreshold - Minimum points required for the next tier
 */
export function calculateTierProgress(
  currentPoints: number,
  currentTierThreshold: number,
  nextTierThreshold: number,
): TierProgress {
  const range = nextTierThreshold - currentTierThreshold;

  let percentage: number;
  if (range <= 0) {
    percentage = currentPoints >= nextTierThreshold ? 100 : 0;
  } else {
    const raw = ((currentPoints - currentTierThreshold) / range) * 100;
    percentage = Math.max(0, Math.min(100, raw));
  }

  const pointsRemaining = Math.max(0, nextTierThreshold - currentPoints);

  return { percentage, pointsRemaining };
}
