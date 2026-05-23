/**
 * Property-Based Tests for community-utils.ts
 *
 * Property 11: Community Recommendations Threshold
 * Property 12: Community Events Section
 * Property 13: New Events Badge Count
 *
 * Validates: Requirements 6.1, 6.2, 6.4
 */

import * as fc from 'fast-check';
import {
  getCommunityRecommendations,
  getCommunityEventSection,
  calculateCommunityBadgeCount,
} from '../community-utils';
import type { Community, EventData } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-05-17T12:00:00Z');
const NOW_MS = NOW.getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toISO(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]!;
}

function makeCommunity(overrides: Partial<Community> & { id: string }): Community {
  return {
    type: 'community',
    name: `Community ${overrides.id}`,
    ...overrides,
  } as Community;
}

function makeEvent(overrides: Partial<EventData> & { id: string }): EventData {
  return {
    title: `Event ${overrides.id}`,
    description: '',
    date: toISO(NOW_MS + ONE_DAY_MS),
    country: 'Australia',
    city: 'Sydney',
    ...overrides,
  } as EventData;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const cultureTagArb = fc.constantFrom('tamil', 'malayali', 'punjabi', 'chinese', 'greek', 'italian');

const communityArb: fc.Arbitrary<Community> = fc.record({
  id: fc.uuid(),
  type: fc.constant('community' as const),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  cultureIds: fc.array(cultureTagArb, { minLength: 0, maxLength: 3 }),
} as any);

const communityListArb = fc.array(communityArb, { minLength: 0, maxLength: 15 });

const eventArb: fc.Arbitrary<EventData> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 40 }),
  description: fc.constant(''),
  communityId: fc.constant('c1'),
  country: fc.constant('Australia'),
  city: fc.constant('Sydney'),
  date: fc
    .integer({ min: -ONE_DAY_MS * 2, max: ONE_DAY_MS * 10 })
    .map((delta) => toISO(NOW_MS + delta)),
  status: fc.constantFrom('published' as const, 'draft' as const, 'cancelled' as const),
} as any);

const eventListArb = fc.array(eventArb, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 11: getCommunityRecommendations
// ---------------------------------------------------------------------------

it('Property 11a: returns empty array when user has ≥3 joined communities', () => {
  fc.assert(
    fc.property(
      fc.array(fc.uuid(), { minLength: 3, maxLength: 10 }),
      communityListArb,
      fc.array(cultureTagArb, { minLength: 1, maxLength: 5 }),
      (joined, communities, tags) => {
        const result = getCommunityRecommendations(tags, communities, joined);
        expect(result).toHaveLength(0);
      },
    ),
    { numRuns: 100 },
  );
});

it('Property 11b: result never exceeds maxRecs', () => {
  fc.assert(
    fc.property(
      fc.array(cultureTagArb, { minLength: 1, maxLength: 3 }),
      communityListArb,
      fc.constant([] as string[]),
      fc.integer({ min: 1, max: 10 }),
      (tags, communities, joined, maxRecs) => {
        const result = getCommunityRecommendations(tags, communities, joined, maxRecs);
        expect(result.length).toBeLessThanOrEqual(maxRecs);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 11c: recommended communities are not in the joined set', () => {
  fc.assert(
    fc.property(
      fc.array(cultureTagArb, { minLength: 1, maxLength: 3 }),
      communityListArb,
      fc.array(fc.uuid(), { minLength: 0, maxLength: 2 }),
      (tags, communities, joined) => {
        const joinedSet = new Set(joined);
        const result = getCommunityRecommendations(tags, communities, joined);
        for (const community of result) {
          expect(joinedSet.has(community.id)).toBe(false);
        }
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 11d: empty user culture tags returns no recommendations', () => {
  fc.assert(
    fc.property(communityListArb, (communities) => {
      const result = getCommunityRecommendations([], communities, []);
      expect(result).toHaveLength(0);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 12: getCommunityEventSection
// ---------------------------------------------------------------------------

it('Property 12a: result never exceeds maxEvents', () => {
  fc.assert(
    fc.property(
      eventListArb,
      fc.integer({ min: 1, max: 10 }),
      (events, maxEvents) => {
        const result = getCommunityEventSection('c1', events, NOW, maxEvents);
        expect(result.length).toBeLessThanOrEqual(maxEvents);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 12b: result contains only upcoming events (date > now)', () => {
  fc.assert(
    fc.property(eventListArb, (events) => {
      const result = getCommunityEventSection('c1', events, NOW);
      for (const event of result) {
        expect(new Date(event.date).getTime()).toBeGreaterThan(NOW_MS);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 12c: result is sorted by date ascending', () => {
  fc.assert(
    fc.property(eventListArb, (events) => {
      const result = getCommunityEventSection('c1', events, NOW);
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1]!.date).getTime();
        const curr = new Date(result[i]!.date).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 12d: cancelled and draft events are excluded', () => {
  fc.assert(
    fc.property(eventListArb, (events) => {
      const result = getCommunityEventSection('c1', events, NOW);
      for (const event of result) {
        expect(event.status).not.toBe('cancelled');
        expect(event.status).not.toBe('draft');
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 12e: only events with the matching communityId are returned', () => {
  const events = [
    makeEvent({ id: 'e1', communityId: 'c1', date: toISO(NOW_MS + ONE_DAY_MS) }),
    makeEvent({ id: 'e2', communityId: 'c2', date: toISO(NOW_MS + ONE_DAY_MS) }),
  ];
  const result = getCommunityEventSection('c1', events, NOW);
  expect(result.map((e) => e.id)).toEqual(['e1']);
});

// ---------------------------------------------------------------------------
// Property 13: calculateCommunityBadgeCount
// ---------------------------------------------------------------------------

it('Property 13a: returns empty string when count is 0', () => {
  // All events before lastOpenedMs → no new events
  const oldEvent = makeEvent({ id: 'old', date: toISO(NOW_MS - ONE_DAY_MS * 5) });
  const result = calculateCommunityBadgeCount([oldEvent], NOW_MS);
  expect(result).toBe('');
});

it('Property 13b: returns "9+" when count exceeds 9', () => {
  const events = Array.from({ length: 15 }, (_, i) =>
    makeEvent({ id: `e${i}`, date: toISO(NOW_MS + ONE_DAY_MS * (i + 1)) }),
  );
  const result = calculateCommunityBadgeCount(events, NOW_MS - 1000);
  expect(result).toBe('9+');
});

it('Property 13c: returns numeric string for counts 1–9', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 9 }), (count) => {
      // lastOpened = yesterday; events = tomorrow+ so they're clearly "new"
      const lastOpened = NOW_MS - ONE_DAY_MS;
      const events = Array.from({ length: count }, (_, i) =>
        makeEvent({ id: `e${i}`, date: toISO(NOW_MS + ONE_DAY_MS * (i + 1)) }),
      );
      const result = calculateCommunityBadgeCount(events, lastOpened);
      expect(result).toBe(String(count));
    }),
    { numRuns: 9 },
  );
});

it('Property 13d: cancelled and draft events do not contribute to badge count', () => {
  const cancelled = makeEvent({ id: 'c', date: toISO(NOW_MS + ONE_DAY_MS), status: 'cancelled' });
  const draft = makeEvent({ id: 'd', date: toISO(NOW_MS + ONE_DAY_MS), status: 'draft' });
  const result = calculateCommunityBadgeCount([cancelled, draft], NOW_MS - 1000);
  expect(result).toBe('');
});
