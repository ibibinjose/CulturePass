/**
 * Property-Based Tests for storage.ts pure functions
 *
 * **Property 1: Continue Browsing Rail Invariants**
 * For any list of RecentVisit entries, getContinueBrowsingItems SHALL return
 * at most 3 items ordered by visitedAt descending (most recent first), and
 * SHALL return an empty array when the input is empty.
 *
 * Validates: Requirements 1.1, 1.5
 */

import * as fc from 'fast-check';

import { getContinueBrowsingItems, type RecentVisit } from '../storage';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const entityTypeArb = fc.constantFrom('event' as const, 'community' as const, 'city' as const);

/** Arbitrary RecentVisit. Timestamps can be any non-negative integer. */
const recentVisitArb: fc.Arbitrary<RecentVisit> = fc.record({
  entityId: fc.uuid(),
  entityType: entityTypeArb,
  visitedAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

/** Arbitrary list of visits (0–20 items). */
const visitListArb = fc.array(recentVisitArb, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 1a: Result length is always at most 3
// ---------------------------------------------------------------------------

it('Property 1a: getContinueBrowsingItems returns at most 3 items', () => {
  fc.assert(
    fc.property(visitListArb, (visits) => {
      const result = getContinueBrowsingItems(visits);
      expect(result.length).toBeLessThanOrEqual(3);
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 1b: Result is sorted by visitedAt descending (most recent first)
// ---------------------------------------------------------------------------

it('Property 1b: result is ordered most-recent-first (visitedAt descending)', () => {
  fc.assert(
    fc.property(visitListArb, (visits) => {
      const result = getContinueBrowsingItems(visits);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.visitedAt).toBeGreaterThanOrEqual(result[i]!.visitedAt);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 1c: Empty input always returns empty array
// ---------------------------------------------------------------------------

it('Property 1c: empty input produces an empty result', () => {
  const result = getContinueBrowsingItems([]);
  expect(result).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Property 1d: All returned items are present in the input
// ---------------------------------------------------------------------------

it('Property 1d: all returned items come from the input', () => {
  fc.assert(
    fc.property(visitListArb, (visits) => {
      const result = getContinueBrowsingItems(visits);
      const inputIds = new Set(visits.map((v) => v.entityId));
      for (const item of result) {
        expect(inputIds.has(item.entityId)).toBe(true);
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 1e: The returned items are the 3 most recent in the input
// ---------------------------------------------------------------------------

it('Property 1e: returned items are the top-3 most recent visits', () => {
  fc.assert(
    fc.property(
      fc.array(recentVisitArb, { minLength: 1, maxLength: 20 }),
      (visits) => {
        const result = getContinueBrowsingItems(visits);

        // Sort input the same way the function should
        const sorted = [...visits].sort((a, b) => b.visitedAt - a.visitedAt).slice(0, 3);

        expect(result).toHaveLength(sorted.length);
        for (let i = 0; i < sorted.length; i++) {
          expect(result[i]!.entityId).toBe(sorted[i]!.entityId);
          expect(result[i]!.visitedAt).toBe(sorted[i]!.visitedAt);
        }
      },
    ),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 1f: Custom maxItems is respected
// ---------------------------------------------------------------------------

it('Property 1f: custom maxItems parameter is respected', () => {
  fc.assert(
    fc.property(
      visitListArb,
      fc.integer({ min: 0, max: 10 }),
      (visits, maxItems) => {
        const result = getContinueBrowsingItems(visits, maxItems);
        expect(result.length).toBeLessThanOrEqual(maxItems);
        expect(result.length).toBeLessThanOrEqual(visits.length);
      },
    ),
    { numRuns: 200 },
  );
});
