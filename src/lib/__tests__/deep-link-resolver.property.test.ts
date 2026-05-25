/**
 * DeepLinkResolver Property-Based Tests
 *
 * Properties 20, 21, 22, 23 from the App Flow Improvements spec.
 * Uses fast-check for property-based testing.
 *
 * Validates: Requirements 10.2, 10.3, 10.4, 10.6, 10.7
 */

import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { deepLinkResolver } from '../deep-link-resolver';
import { api } from '../api';

// Mock the api module
jest.mock('../api', () => ({
  api: {
    raw: jest.fn(),
    baseUrl: jest.fn(() => 'https://api.culturepass.app'),
  },
}));

const mockApiRaw = api.raw as jest.MockedFunction<typeof api.raw>;

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** All valid short link prefixes. */
const VALID_PREFIXES = ['e', 'c', 'b', 'v', 'u', 'o', 't'] as const;

/** Arbitrary valid prefix. */
const validPrefixArb = fc.constantFrom(...VALID_PREFIXES);

/** Arbitrary valid entity ID (alphanumeric, hyphens, underscores; 1–128 chars). */
const validIdArb = fc
  .string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')),
    minLength: 1,
    maxLength: 128,
  });

/** Arbitrary invalid prefix (not in VALID_PREFIXES). */
const invalidPrefixArb = fc
  .string({ minLength: 0, maxLength: 10 })
  .filter((s) => !VALID_PREFIXES.includes(s as typeof VALID_PREFIXES[number]));

/** Arbitrary malformed ID: empty, invalid chars, or exceeding max length. */
const malformedIdArb = fc.oneof(
  // Empty string
  fc.constant(''),
  // Contains invalid characters (spaces, dots, slashes, @, etc.)
  fc.tuple(
    fc.string({ unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), minLength: 1, maxLength: 5 }),
    fc.constantFrom(' ', '.', '/', '@', '#', '!', '?', '&', '=', '+'),
    fc.string({ unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), minLength: 1, maxLength: 5 }),
  ).map(([a, sep, b]) => `${a}${sep}${b}`),
  // Exceeds maximum length (129+ chars)
  fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 129,
    maxLength: 200,
  })
);

/** Arbitrary city name. */
const cityArb = fc.constantFrom('Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide');

/** Arbitrary ISO date string for createdAt. */
const dateStringArb = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2026-12-31'),
}).map((d) => {
  try {
    return d.toISOString();
  } catch {
    return new Date('2025-01-01').toISOString();
  }
});

/** Arbitrary fallback entity (as returned by the API). */
const fallbackEntityArb = fc.record({
  id: validIdArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  city: cityArb,
  createdAt: dateStringArb,
});

/** Arbitrary route string (simulating a deep link destination). */
const routeArb = fc.tuple(
  fc.constantFrom('/event/', '/community/', '/business/', '/venue/', '/user/', '/organiser/', '/tickets/'),
  validIdArb,
).map(([prefix, id]) => `${prefix}${id}`);

/** Arbitrary entity object for OG meta generation. */
const entityForOGArb = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  heroImage: fc.option(fc.webUrl(), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Property 20: Deep Link Fallback Resolution
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 10.2, 10.3**
 *
 * Property 20: For any deep link pointing to a non-existent entity, the fallback
 * resolver returns up to 5 entities of the same type in the same city, ordered by
 * creation date descending. When zero similar entities exist, the result indicates
 * navigation to Discover Tab (status: 'not_found').
 */
describe('Property 20: Deep Link Fallback Resolution', () => {
  beforeEach(async () => {
    mockApiRaw.mockReset();
    await AsyncStorage.clear();
  });

  it('returns at most 5 fallback entities of the same type when similar entities exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPrefixArb,
        validIdArb,
        fc.array(fallbackEntityArb, { minLength: 1, maxLength: 15 }),
        async (prefix, id, fallbackEntities) => {
          mockApiRaw.mockResolvedValueOnce({
            exists: false,
            fallbackEntities,
          });

          const result = await deepLinkResolver.resolve(prefix, id);

          // Must be 'fallback' status when entities are returned
          expect(result.status).toBe('fallback');
          // At most 5 entities
          expect(result.fallbackEntities!.length).toBeLessThanOrEqual(5);
          // All entities have the same type matching the prefix
          const expectedType = deepLinkResolver.getEntityType(prefix);
          for (const entity of result.fallbackEntities!) {
            expect(entity.type).toBe(expectedType);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('returns not_found when zero similar entities exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPrefixArb,
        validIdArb,
        async (prefix, id) => {
          mockApiRaw.mockResolvedValueOnce({
            exists: false,
            fallbackEntities: [],
          });

          const result = await deepLinkResolver.resolve(prefix, id);

          // Must be 'not_found' when no fallback entities
          expect(result.status).toBe('not_found');
          expect(result.fallbackEntities).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('fallback entities are limited to exactly 5 when more are available', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPrefixArb,
        validIdArb,
        fc.array(fallbackEntityArb, { minLength: 6, maxLength: 15 }),
        async (prefix, id, fallbackEntities) => {
          mockApiRaw.mockResolvedValueOnce({
            exists: false,
            fallbackEntities,
          });

          const result = await deepLinkResolver.resolve(prefix, id);

          expect(result.status).toBe('fallback');
          expect(result.fallbackEntities!.length).toBe(5);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21: Deep Link Auth Gate Destination Persistence
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 10.4**
 *
 * Property 21: For any deep link destination requiring authentication, the
 * destination route is persisted before redirecting to login, and is retrievable
 * and navigable after successful authentication. Test the round-trip:
 * persistDestination(route) → getPersistedDestination() === route.
 */
describe('Property 21: Deep Link Auth Gate Destination Persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persist/retrieve round-trip preserves the route exactly', async () => {
    await fc.assert(
      fc.asyncProperty(routeArb, async (route) => {
        await deepLinkResolver.persistDestination(route);
        const retrieved = await deepLinkResolver.getPersistedDestination();
        expect(retrieved).toBe(route);
      }),
      { numRuns: 100 }
    );
  });

  it('persisting a new route overwrites the previous one', async () => {
    await fc.assert(
      fc.asyncProperty(routeArb, routeArb, async (route1, route2) => {
        await deepLinkResolver.persistDestination(route1);
        await deepLinkResolver.persistDestination(route2);
        const retrieved = await deepLinkResolver.getPersistedDestination();
        expect(retrieved).toBe(route2);
      }),
      { numRuns: 50 }
    );
  });

  it('clearing persisted destination returns null on retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(routeArb, async (route) => {
        await deepLinkResolver.persistDestination(route);
        await deepLinkResolver.clearPersistedDestination();
        const retrieved = await deepLinkResolver.getPersistedDestination();
        expect(retrieved).toBeNull();
      }),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 22: Open Graph Meta Tag Generation
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 10.6**
 *
 * Property 22: For any valid entity with a recognised short link prefix
 * (/e/, /c/, /b/, /v/, /u/, /o/, /t/), the OG meta generator produces a
 * non-empty title, a valid image URL (string with length > 0), and a
 * non-empty description.
 */
describe('Property 22: Open Graph Meta Tag Generation', () => {
  it('always produces non-empty title, image, and description for valid prefixes', () => {
    fc.assert(
      fc.property(validPrefixArb, entityForOGArb, (prefix, entity) => {
        const meta = deepLinkResolver.generateOGMeta(prefix, entity);

        // Title must be non-empty
        expect(meta.title.length).toBeGreaterThan(0);
        // Image must be non-empty (either entity image or default)
        expect(meta.image.length).toBeGreaterThan(0);
        // Description must be non-empty
        expect(meta.description.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  it('uses entity title/name/displayName when available', () => {
    fc.assert(
      fc.property(
        validPrefixArb,
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          imageUrl: fc.webUrl(),
          description: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (prefix, entity) => {
          const meta = deepLinkResolver.generateOGMeta(prefix, entity);

          // When title is provided, it should be used
          expect(meta.title).toBe(entity.title);
          // When imageUrl is provided, it should be used
          expect(meta.image).toBe(entity.imageUrl);
          // When description is provided, it should be used
          expect(meta.description).toBe(entity.description);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('falls back to defaults when entity has no fields', () => {
    fc.assert(
      fc.property(validPrefixArb, (prefix) => {
        const meta = deepLinkResolver.generateOGMeta(prefix, {});

        // Should still produce valid non-empty values
        expect(meta.title.length).toBeGreaterThan(0);
        expect(meta.image.length).toBeGreaterThan(0);
        expect(meta.description.length).toBeGreaterThan(0);
        // Default image should be the CulturePass OG default
        expect(meta.image).toBe('https://culturepass.app/og-default.png');
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 23: Invalid Deep Link Handling
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 10.7**
 *
 * Property 23: For any deep link with an unrecognised prefix or a recognised
 * prefix with a malformed entity identifier (empty, containing invalid characters,
 * or exceeding maximum length), the resolver returns a "not_found" status.
 */
describe('Property 23: Invalid Deep Link Handling', () => {
  beforeEach(async () => {
    mockApiRaw.mockReset();
    await AsyncStorage.clear();
  });

  it('returns not_found for any unrecognised prefix', async () => {
    await fc.assert(
      fc.asyncProperty(invalidPrefixArb, validIdArb, async (prefix, id) => {
        const result = await deepLinkResolver.resolve(prefix, id);
        expect(result.status).toBe('not_found');
        // Should not call the API for invalid prefixes
        expect(mockApiRaw).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('returns not_found for any recognised prefix with malformed ID', async () => {
    await fc.assert(
      fc.asyncProperty(validPrefixArb, malformedIdArb, async (prefix, id) => {
        mockApiRaw.mockClear();
        const result = await deepLinkResolver.resolve(prefix, id);
        expect(result.status).toBe('not_found');
        // Should not call the API for malformed IDs
        expect(mockApiRaw).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('isValidPrefix returns false for all invalid prefixes', () => {
    fc.assert(
      fc.property(invalidPrefixArb, (prefix) => {
        expect(deepLinkResolver.isValidPrefix(prefix)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('isValidId returns false for all malformed IDs', () => {
    fc.assert(
      fc.property(malformedIdArb, (id) => {
        expect(deepLinkResolver.isValidId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
