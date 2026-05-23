/**
 * Property-Based Tests for getCommunityEventsRail
 *
 * **Property 2: Community Events Rail Filtering and Sorting**
 * For any (joinedCommunityIds, events, now) input:
 * - Only events whose communityId is in joinedCommunityIds are included
 * - Only events whose date is within 7 days of now are included
 * - Events are sorted by date ascending (soonest first)
 * - At most maxItems (default 10) events are returned
 * - Empty joinedCommunityIds always returns []
 *
 * Validates: Requirements 1.2
 */

import * as fc from 'fast-check';

import { getCommunityEventsRail } from '../CommunityEventsRail';
import type { EventData } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Formats a timestamp as an ISO date string (YYYY-MM-DD). */
function toISODate(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]!;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Base "now" timestamp — fixed so window arithmetic is consistent. */
const NOW = new Date('2026-05-17T12:00:00Z');
const NOW_TS = NOW.getTime();

/** Community IDs pool. */
const communityIds = ['c1', 'c2', 'c3', 'c4', 'c5'];

/** Arbitrary community ID (or undefined). */
const communityIdArb = fc.option(fc.constantFrom(...communityIds), { nil: undefined });

/**
 * Arbitrary EventData with a date relative to NOW.
 * deltaMs can be negative (past), zero, or positive (future).
 */
const eventArb: fc.Arbitrary<EventData> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 60 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  country: fc.constant('Australia'),
  city: fc.constant('Sydney'),
  date: fc
    .integer({ min: -(SEVEN_DAYS_MS * 2), max: SEVEN_DAYS_MS * 3 })
    .map((delta) => toISODate(NOW_TS + delta)),
  communityId: communityIdArb,
} as any);

/** Arbitrary event list (0–30 items). */
const eventListArb = fc.array(eventArb, { minLength: 0, maxLength: 30 });

/** Arbitrary list of joined community IDs (subset of communityIds). */
const joinedIdsArb = fc
  .array(fc.constantFrom(...communityIds), { minLength: 0, maxLength: communityIds.length })
  .map((arr) => Array.from(new Set(arr)));

// ---------------------------------------------------------------------------
// Property 2a: Only events from joined communities are included
// ---------------------------------------------------------------------------

it('Property 2a: result only contains events from joined communities', () => {
  fc.assert(
    fc.property(joinedIdsArb, eventListArb, (joined, events) => {
      const result = getCommunityEventsRail(joined, events, NOW);
      const joinedSet = new Set(joined);
      for (const event of result) {
        expect(event.communityId).toBeDefined();
        expect(joinedSet.has(event.communityId!)).toBe(true);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 2b: Only events within the next 7 days are included
// ---------------------------------------------------------------------------

it('Property 2b: result only contains events within 7 days of now', () => {
  fc.assert(
    fc.property(joinedIdsArb, eventListArb, (joined, events) => {
      const result = getCommunityEventsRail(joined, events, NOW);
      const windowEnd = NOW_TS + SEVEN_DAYS_MS;

      for (const event of result) {
        const eventTs = new Date(event.date).getTime();
        expect(eventTs).toBeGreaterThanOrEqual(NOW_TS);
        expect(eventTs).toBeLessThanOrEqual(windowEnd);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 2c: Result is sorted by date ascending (soonest first)
// ---------------------------------------------------------------------------

it('Property 2c: result is sorted by event date ascending', () => {
  fc.assert(
    fc.property(joinedIdsArb, eventListArb, (joined, events) => {
      const result = getCommunityEventsRail(joined, events, NOW);
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1]!.date).getTime();
        const curr = new Date(result[i]!.date).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 2d: Result length never exceeds maxItems (default 10)
// ---------------------------------------------------------------------------

it('Property 2d: result length never exceeds maxItems', () => {
  fc.assert(
    fc.property(
      joinedIdsArb,
      eventListArb,
      fc.integer({ min: 1, max: 20 }),
      (joined, events, maxItems) => {
        const result = getCommunityEventsRail(joined, events, NOW, maxItems);
        expect(result.length).toBeLessThanOrEqual(maxItems);
      },
    ),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 2e: Empty joinedCommunityIds always returns []
// ---------------------------------------------------------------------------

it('Property 2e: empty joinedCommunityIds always returns empty array', () => {
  fc.assert(
    fc.property(eventListArb, (events) => {
      const result = getCommunityEventsRail([], events, NOW);
      expect(result).toHaveLength(0);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 2f: All returned events are present in the input
// ---------------------------------------------------------------------------

it('Property 2f: all returned events come from the input list', () => {
  fc.assert(
    fc.property(joinedIdsArb, eventListArb, (joined, events) => {
      const result = getCommunityEventsRail(joined, events, NOW);
      const inputIds = new Set(events.map((e) => e.id));
      for (const event of result) {
        expect(inputIds.has(event.id)).toBe(true);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Known-value tests
// ---------------------------------------------------------------------------

describe('Known scenarios', () => {
  const makeEvent = (overrides: Partial<EventData> & { id: string }): EventData => ({
    title: 'Test Event',
    description: '',
    date: toISODate(NOW_TS + 2 * 24 * 60 * 60 * 1000),
    country: 'Australia',
    city: 'Sydney',
    ...overrides,
  } as EventData);

  it('returns events sorted by date when multiple qualifying events exist', () => {
    const events: EventData[] = [
      makeEvent({ id: 'e3', communityId: 'c1', date: toISODate(NOW_TS + 3 * 86400000) }),
      makeEvent({ id: 'e1', communityId: 'c1', date: toISODate(NOW_TS + 1 * 86400000) }),
      makeEvent({ id: 'e2', communityId: 'c1', date: toISODate(NOW_TS + 2 * 86400000) }),
    ];

    const result = getCommunityEventsRail(['c1'], events, NOW);
    expect(result.map((e) => e.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('excludes events from non-joined communities', () => {
    const events: EventData[] = [
      makeEvent({ id: 'e1', communityId: 'c1' }),
      makeEvent({ id: 'e2', communityId: 'c2' }),
      makeEvent({ id: 'e3', communityId: 'c3' }),
    ];

    const result = getCommunityEventsRail(['c1'], events, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('e1');
  });

  it('excludes past events', () => {
    const events: EventData[] = [
      makeEvent({ id: 'e_past', communityId: 'c1', date: toISODate(NOW_TS - 86400000) }),
      makeEvent({ id: 'e_future', communityId: 'c1', date: toISODate(NOW_TS + 86400000) }),
    ];

    const result = getCommunityEventsRail(['c1'], events, NOW);
    expect(result.map((e) => e.id)).toEqual(['e_future']);
  });

  it('excludes events beyond the 7-day window', () => {
    const events: EventData[] = [
      makeEvent({ id: 'e_within', communityId: 'c1', date: toISODate(NOW_TS + 6 * 86400000) }),
      makeEvent({ id: 'e_beyond', communityId: 'c1', date: toISODate(NOW_TS + 8 * 86400000) }),
    ];

    const result = getCommunityEventsRail(['c1'], events, NOW);
    expect(result.map((e) => e.id)).toEqual(['e_within']);
  });
});
