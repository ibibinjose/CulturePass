/**
 * Property-Based Tests for host-utils.ts
 *
 * Property 18: Quick Publish Defaults Application
 * Property 19: Event Creation Field Validation
 *
 * Validates: Requirements 9.3, 9.4
 */

import * as fc from 'fast-check';
import {
  applyQuickPublishDefaults,
  validateEventField,
  type EventBasics,
} from '../host-utils';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Valid title: 1–100 non-empty characters. */
const validTitleArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .map((s) => s.trim())
  .filter((s) => s.length >= 1 && s.length <= 100);

/** Valid description: 1–2000 non-empty characters. */
const validDescArb = fc
  .string({ minLength: 1, maxLength: 2000 })
  .map((s) => s.trim())
  .filter((s) => s.length >= 1 && s.length <= 2000);

/** Valid category: non-empty string. */
const validCategoryArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const validBasicsArb: fc.Arbitrary<EventBasics> = fc.record({
  title: validTitleArb,
  category: validCategoryArb,
  description: validDescArb,
});

const organiserVenueArb = fc.option(
  fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
  { nil: null },
);

// ---------------------------------------------------------------------------
// Property 18: applyQuickPublishDefaults
// ---------------------------------------------------------------------------

it('Property 18a: entryType is always "free"', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.entryType).toBe('free');
    }),
    { numRuns: 200 },
  );
});

it('Property 18b: priceCents is always 0', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.priceCents).toBe(0);
    }),
    { numRuns: 200 },
  );
});

it('Property 18c: capacityLimit is always null', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.capacityLimit).toBeNull();
    }),
    { numRuns: 200 },
  );
});

it('Property 18d: venue is organiserVenue when provided, "online" when null', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.venue).toBe(venue ?? 'online');
    }),
    { numRuns: 200 },
  );
});

it('Property 18e: endDate is exactly 7 days after date', () => {
  fc.assert(
    fc.property(
      validBasicsArb,
      organiserVenueArb,
      fc.integer({ min: 0, max: 1e12 }),
      (basics, venue, nowMs) => {
        const payload = applyQuickPublishDefaults(basics, venue, nowMs);
        const startMs = new Date(payload.date).getTime();
        const endMs = new Date(payload.endDate).getTime();
        expect(endMs - startMs).toBe(7 * ONE_DAY_MS);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 18f: basics fields are preserved verbatim in the payload', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.title).toBe(basics.title);
      expect(payload.category).toBe(basics.category);
      expect(payload.description).toBe(basics.description);
    }),
    { numRuns: 200 },
  );
});

it('Property 18g: status is "published"', () => {
  fc.assert(
    fc.property(validBasicsArb, organiserVenueArb, (basics, venue) => {
      const payload = applyQuickPublishDefaults(basics, venue);
      expect(payload.status).toBe('published');
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 19: validateEventField
// ---------------------------------------------------------------------------

it('Property 19a: valid title (1–100 chars) returns null', () => {
  fc.assert(
    fc.property(validTitleArb, (title) => {
      expect(validateEventField('title', title)).toBeNull();
    }),
    { numRuns: 200 },
  );
});

it('Property 19b: invalid title (empty or >100 chars) returns non-empty error', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(''),
        fc.constant('   '),
        fc.string({ minLength: 101, maxLength: 200 }).filter((s) => s.trim().length > 100),
      ),
      (title) => {
        const error = validateEventField('title', title);
        expect(typeof error).toBe('string');
        expect((error as string).length).toBeGreaterThan(0);
      },
    ),
    { numRuns: 100 },
  );
});

it('Property 19c: valid description (1–2000 chars) returns null', () => {
  fc.assert(
    fc.property(validDescArb, (desc) => {
      expect(validateEventField('description', desc)).toBeNull();
    }),
    { numRuns: 200 },
  );
});

it('Property 19d: invalid description (empty or >2000 chars) returns non-empty error', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(''),
        fc.string({ minLength: 2001, maxLength: 3000 }).filter((s) => s.trim().length > 2000),
      ),
      (desc) => {
        const error = validateEventField('description', desc);
        expect(typeof error).toBe('string');
        expect((error as string).length).toBeGreaterThan(0);
      },
    ),
    { numRuns: 100 },
  );
});

it('Property 19e: valid category (non-empty) returns null', () => {
  fc.assert(
    fc.property(validCategoryArb, (category) => {
      expect(validateEventField('category', category)).toBeNull();
    }),
    { numRuns: 100 },
  );
});

it('Property 19f: empty category returns non-empty error', () => {
  fc.assert(
    fc.property(fc.oneof(fc.constant(''), fc.constant('   ')), (category) => {
      const error = validateEventField('category', category);
      expect(typeof error).toBe('string');
      expect((error as string).length).toBeGreaterThan(0);
    }),
    { numRuns: 50 },
  );
});

it('Property 19g: non-string values always return an error', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('title' as const, 'description' as const, 'category' as const),
      fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
      (field, value) => {
        const error = validateEventField(field, value);
        expect(typeof error).toBe('string');
        expect((error as string).length).toBeGreaterThan(0);
      },
    ),
    { numRuns: 100 },
  );
});
