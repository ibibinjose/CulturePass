/**
 * Property-Based Tests for SearchManager
 *
 * **Property 4: Search History Management**
 * For any sequence of addRecentSearch calls, the stored list SHALL contain at
 * most 5 items in most-recent-first order, with duplicate queries deduplicated
 * (moved to front). clearRecentSearches SHALL always produce an empty list.
 *
 * **Property 5: Search Result Grouping**
 * For any flat list of SearchResultItems, groupResults SHALL produce at most 3
 * items per entity type. The hasMore flag for a type SHALL be true if and only
 * if more than 3 items of that type were present in the input.
 *
 * Validates: Requirements 3.2, 3.3, 3.5, 3.6
 */

import * as fc from 'fast-check';

import { searchManager, type SearchEntityType, type SearchResultItem } from '../search-manager';

// ---------------------------------------------------------------------------
// AsyncStorage is mocked globally via jest.setup.js
// Reset its state between tests via a fresh mock
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await searchManager.clearRecentSearches();
});

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Non-empty, printable query strings (trimmed, min length 1). */
const queryArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/** Sequences of queries to add (1–20 calls). */
const querySequenceArb = fc.array(queryArb, { minLength: 1, maxLength: 20 });

const entityTypes: SearchEntityType[] = ['event', 'community', 'business', 'venue', 'artist'];

/** Arbitrary entity type. */
const entityTypeArb = fc.constantFrom(...entityTypes);

/** Arbitrary SearchResultItem. */
const searchResultItemArb: fc.Arbitrary<SearchResultItem> = fc.record({
  id: fc.uuid(),
  type: entityTypeArb,
  title: fc.string({ minLength: 1, maxLength: 60 }),
  imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  city: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

/** Arbitrary flat list of search result items (0–30 items). */
const searchResultListArb = fc.array(searchResultItemArb, { minLength: 0, maxLength: 30 });

// ---------------------------------------------------------------------------
// Property 4a: Max 5 items after any sequence of addRecentSearch
// ---------------------------------------------------------------------------

it('Property 4a: recent search list never exceeds 5 items', async () => {
  await fc.assert(
    fc.asyncProperty(querySequenceArb, async (queries) => {
      await searchManager.clearRecentSearches();
      for (const q of queries) {
        await searchManager.addRecentSearch(q);
      }
      const result = await searchManager.getRecentSearches();
      expect(result.length).toBeLessThanOrEqual(5);
    }),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 4b: Most recently added query appears first (when unique)
// ---------------------------------------------------------------------------

it('Property 4b: last added unique query appears at index 0', async () => {
  await fc.assert(
    fc.asyncProperty(querySequenceArb, queryArb, async (prior, unique) => {
      // Ensure `unique` does not collide with any prior query (case-insensitive)
      const uniqueNorm = unique.toLowerCase();
      const priorNorm = prior.map((q) => q.toLowerCase());
      if (priorNorm.includes(uniqueNorm)) return;

      await searchManager.clearRecentSearches();
      for (const q of prior) {
        await searchManager.addRecentSearch(q);
      }
      await searchManager.addRecentSearch(unique);

      const result = await searchManager.getRecentSearches();
      expect(result[0]?.toLowerCase()).toBe(uniqueNorm);
    }),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 4c: Duplicate query moves to front, does not grow the list
// ---------------------------------------------------------------------------

it('Property 4c: re-adding an existing query moves it to front without duplicating', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(queryArb, { minLength: 1, maxLength: 5 }),
      async (queries) => {
        // Deduplicate the seed queries to ensure unique entries
        const unique = Array.from(new Set(queries.map((q) => q.toLowerCase()))).map(
          (q) => queries.find((orig) => orig.toLowerCase() === q)!,
        );
        if (unique.length < 2) return; // need at least 2 distinct queries

        await searchManager.clearRecentSearches();
        for (const q of unique) {
          await searchManager.addRecentSearch(q);
        }

        const before = await searchManager.getRecentSearches();
        const target = before[before.length - 1]!; // least recent

        await searchManager.addRecentSearch(target);
        const after = await searchManager.getRecentSearches();

        // Still max 5 items, target is now first, no duplicates
        expect(after.length).toBeLessThanOrEqual(5);
        expect(after[0]?.toLowerCase()).toBe(target.toLowerCase());
        const lowerAfter = after.map((q) => q.toLowerCase());
        expect(new Set(lowerAfter).size).toBe(lowerAfter.length);
      },
    ),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// Property 4d: clearRecentSearches always produces an empty list
// ---------------------------------------------------------------------------

it('Property 4d: clearRecentSearches always results in an empty list', async () => {
  await fc.assert(
    fc.asyncProperty(querySequenceArb, async (queries) => {
      for (const q of queries) {
        await searchManager.addRecentSearch(q);
      }
      await searchManager.clearRecentSearches();
      const result = await searchManager.getRecentSearches();
      expect(result).toHaveLength(0);
    }),
    { numRuns: 30 },
  );
});

// ---------------------------------------------------------------------------
// Property 4e: FIFO — oldest entry is dropped when list overflows
// ---------------------------------------------------------------------------

it('Property 4e: when >5 distinct queries added, oldest are dropped', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(queryArb, { minLength: 6, maxLength: 12 }).filter((arr) => {
        // Need at least 6 distinct lowercase values
        const uniq = new Set(arr.map((q) => q.toLowerCase()));
        return uniq.size >= 6;
      }),
      async (queries) => {
        // Deduplicate keeping insertion order
        const seen = new Set<string>();
        const deduped: string[] = [];
        for (const q of queries) {
          const k = q.toLowerCase();
          if (!seen.has(k)) {
            seen.add(k);
            deduped.push(q);
          }
        }

        await searchManager.clearRecentSearches();
        for (const q of deduped) {
          await searchManager.addRecentSearch(q);
        }

        const result = await searchManager.getRecentSearches();
        expect(result).toHaveLength(5);

        // The last 5 added queries should be present (most recent first)
        const last5 = deduped.slice(-5).reverse();
        for (let i = 0; i < 5; i++) {
          expect(result[i]?.toLowerCase()).toBe(last5[i]?.toLowerCase());
        }
      },
    ),
    { numRuns: 30 },
  );
});

// ---------------------------------------------------------------------------
// Property 5a: groupResults never returns more than 3 items per entity type
// ---------------------------------------------------------------------------

it('Property 5a: groupResults returns at most 3 items per entity type', () => {
  fc.assert(
    fc.property(searchResultListArb, (items) => {
      const grouped = searchManager.groupResults(items);

      expect(grouped.events.length).toBeLessThanOrEqual(3);
      expect(grouped.communities.length).toBeLessThanOrEqual(3);
      expect(grouped.businesses.length).toBeLessThanOrEqual(3);
      expect(grouped.venues.length).toBeLessThanOrEqual(3);
      expect(grouped.artists.length).toBeLessThanOrEqual(3);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 5b: hasMore is true iff more than 3 items of that type exist
// ---------------------------------------------------------------------------

it('Property 5b: hasMore flag is true iff input has >3 items of that type', () => {
  fc.assert(
    fc.property(searchResultListArb, (items) => {
      const grouped = searchManager.groupResults(items);

      const countByType = (type: SearchEntityType) => items.filter((i) => i.type === type).length;

      expect(grouped.hasMore['events']).toBe(countByType('event') > 3);
      expect(grouped.hasMore['communities']).toBe(countByType('community') > 3);
      expect(grouped.hasMore['businesses']).toBe(countByType('business') > 3);
      expect(grouped.hasMore['venues']).toBe(countByType('venue') > 3);
      expect(grouped.hasMore['artists']).toBe(countByType('artist') > 3);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 5c: All items in each group have the correct entity type
// ---------------------------------------------------------------------------

it('Property 5c: all items in each group have the correct type', () => {
  fc.assert(
    fc.property(searchResultListArb, (items) => {
      const grouped = searchManager.groupResults(items);

      for (const item of grouped.events) expect(item.type).toBe('event');
      for (const item of grouped.communities) expect(item.type).toBe('community');
      for (const item of grouped.businesses) expect(item.type).toBe('business');
      for (const item of grouped.venues) expect(item.type).toBe('venue');
      for (const item of grouped.artists) expect(item.type).toBe('artist');
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 5d: groupResults is stable — empty input produces all-empty groups
// ---------------------------------------------------------------------------

it('Property 5d: empty input produces empty groups and all hasMore false', () => {
  const grouped = searchManager.groupResults([]);

  expect(grouped.events).toHaveLength(0);
  expect(grouped.communities).toHaveLength(0);
  expect(grouped.businesses).toHaveLength(0);
  expect(grouped.venues).toHaveLength(0);
  expect(grouped.artists).toHaveLength(0);

  expect(grouped.hasMore['events']).toBe(false);
  expect(grouped.hasMore['communities']).toBe(false);
  expect(grouped.hasMore['businesses']).toBe(false);
  expect(grouped.hasMore['venues']).toBe(false);
  expect(grouped.hasMore['artists']).toBe(false);
});
