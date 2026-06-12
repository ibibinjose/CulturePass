/**
 * Property-Based Tests for breadcrumb-utils, notification-utils, accessibility
 *
 * Property 24: Breadcrumb Generation
 * Property 28: Notification Payload Route Resolution
 * Property 30: ARIA Live Region Politeness Selection
 *
 * Validates: Requirements 11.3, 15.4, 15.5, 16.6
 */

import * as fc from 'fast-check';
import { generateBreadcrumbs, ELLIPSIS_ROUTE } from '../breadcrumb-utils';
import {
  resolveNotificationRoute,
  isResolvedRoute,
  type NotificationEntityType,
  type NotificationPayload,
} from '../notification-utils';
import {
  getAnnouncementPoliteness,
  buildScreenAnnouncement,
  type ContentChangeType,
} from '../accessibility';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const routeSegmentArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0 && !s.includes('…'));

const navigationPathArb = fc.array(routeSegmentArb, { minLength: 0, maxLength: 20 });

const entityTypeArb = fc.constantFrom<NotificationEntityType>(
  'event', 'community', 'profile', 'tickets', 'perks',
);

const notificationPayloadArb: fc.Arbitrary<NotificationPayload> = fc.record({
  type: entityTypeArb,
  entityId: fc.uuid(),
  section: fc.option(fc.constantFrom('updates', 'activity', 'feed'), { nil: undefined }),
});

const contentTypeArb = fc.constantFrom<ContentChangeType>('toast', 'error', 'loading', 'info');

// ---------------------------------------------------------------------------
// Property 24: generateBreadcrumbs
// ---------------------------------------------------------------------------

it('Property 24a: empty path returns empty array', () => {
  expect(generateBreadcrumbs([])).toHaveLength(0);
});

it('Property 24b: result length is always min(N, maxSegments)', () => {
  fc.assert(
    fc.property(
      navigationPathArb,
      fc.integer({ min: 1, max: 10 }),
      (path, maxSegments) => {
        const result = generateBreadcrumbs(path, maxSegments);
        const expected = Math.min(path.length, maxSegments);
        expect(result.length).toBe(expected);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 24c: when path ≤ maxSegments, all segments are returned without ellipsis', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 5 }).chain((max) =>
        fc.tuple(
          fc.array(routeSegmentArb, { minLength: 1, maxLength: max }),
          fc.constant(max),
        ),
      ),
      ([path, maxSegments]) => {
        const result = generateBreadcrumbs(path, maxSegments);
        expect(result).toHaveLength(path.length);
        expect(result.every((s) => !s.isEllipsis)).toBe(true);
        for (let i = 0; i < path.length; i++) {
          expect(result[i]!.route).toBe(path[i]);
        }
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 24d: when path > maxSegments, first segment is preserved', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 2, max: 5 }).chain((max) =>
        fc.tuple(
          fc.array(routeSegmentArb, { minLength: max + 1, maxLength: max + 10 }),
          fc.constant(max),
        ),
      ),
      ([path, maxSegments]) => {
        const result = generateBreadcrumbs(path, maxSegments);
        expect(result[0]!.route).toBe(path[0]);
        expect(result[0]!.isEllipsis).toBeFalsy();
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 24e: when path > maxSegments, second segment is ellipsis', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 3, max: 5 }).chain((max) =>
        fc.tuple(
          fc.array(routeSegmentArb, { minLength: max + 1, maxLength: max + 10 }),
          fc.constant(max),
        ),
      ),
      ([path, maxSegments]) => {
        const result = generateBreadcrumbs(path, maxSegments);
        expect(result[1]!.isEllipsis).toBe(true);
        expect(result[1]!.route).toBe(ELLIPSIS_ROUTE);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 24f: last segment in result matches last segment in path (when maxSegments >= 3)', () => {
  fc.assert(
    fc.property(
      // Need maxSegments >= 3 so the last tail item is actually the last path item
      fc.integer({ min: 3, max: 5 }).chain((max) =>
        fc.tuple(
          fc.array(routeSegmentArb, { minLength: max + 1, maxLength: max + 10 }),
          fc.constant(max),
        ),
      ),
      ([path, maxSegments]) => {
        const result = generateBreadcrumbs(path, maxSegments);
        const lastResult = result[result.length - 1]!;
        const lastPath = path[path.length - 1]!;
        // Tail has maxSegments-2 items; last tail item = last path item
        expect(lastResult.route).toBe(lastPath);
        expect(lastResult.isEllipsis).toBeFalsy();
      },
    ),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 28: resolveNotificationRoute
// ---------------------------------------------------------------------------

it('Property 28a: when entity exists, returns a resolved route (has "route" key)', () => {
  fc.assert(
    fc.property(notificationPayloadArb, (payload) => {
      const result = resolveNotificationRoute(payload, true);
      expect(isResolvedRoute(result)).toBe(true);
    }),
    { numRuns: 200 },
  );
});

it('Property 28b: when entity deleted, returns a fallback with non-empty message', () => {
  fc.assert(
    fc.property(notificationPayloadArb, (payload) => {
      const result = resolveNotificationRoute(payload, false);
      expect(isResolvedRoute(result)).toBe(false);
      if (!isResolvedRoute(result)) {
        expect(result.fallbackTab.length).toBeGreaterThan(0);
        expect(result.message.length).toBeGreaterThan(0);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 28c: event deletions fall back to Discover tab (/(tabs))', () => {
  const result = resolveNotificationRoute({ type: 'event', entityId: 'e1' }, false);
  expect(isResolvedRoute(result)).toBe(false);
  if (!isResolvedRoute(result)) {
    expect(result.fallbackTab).toBe('/(tabs)');
  }
});

it('Property 28d: community deletions fall back to Community tab', () => {
  const result = resolveNotificationRoute({ type: 'community', entityId: 'c1' }, false);
  expect(isResolvedRoute(result)).toBe(false);
  if (!isResolvedRoute(result)) {
    expect(result.fallbackTab).toBe('/(tabs)/community');
  }
});

it('Property 28e: profile/tickets deletions fall back to My Space', () => {
  for (const type of ['profile', 'tickets'] as NotificationEntityType[]) {
    const result = resolveNotificationRoute({ type, entityId: 'x1' }, false);
    expect(isResolvedRoute(result)).toBe(false);
    if (!isResolvedRoute(result)) {
      expect(result.fallbackTab).toBe('/(tabs)/myspace');
    }
  }
});

it('Property 28e2: perks deletions fall back to perks listing', () => {
  const result = resolveNotificationRoute({ type: 'perks', entityId: 'x1' }, false);
  expect(isResolvedRoute(result)).toBe(false);
  if (!isResolvedRoute(result)) {
    expect(result.fallbackTab).toBe('/perks');
  }
});

it('Property 28f: section in payload is forwarded to scrollToSection when entity exists', () => {
  const result = resolveNotificationRoute(
    { type: 'event', entityId: 'e1', section: 'updates' },
    true,
  );
  expect(isResolvedRoute(result)).toBe(true);
  if (isResolvedRoute(result)) {
    expect(result.scrollToSection).toBe('updates');
  }
});

it('Property 28g: resolved route contains the entityId', () => {
  fc.assert(
    fc.property(notificationPayloadArb.filter((p) => p.type !== 'perks'), (payload) => {
      const result = resolveNotificationRoute(payload, true);
      if (isResolvedRoute(result)) {
        expect(result.route).toContain(encodeURIComponent(payload.entityId));
      }
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 30: getAnnouncementPoliteness
// ---------------------------------------------------------------------------

it('Property 30a: error content type returns "assertive"', () => {
  expect(getAnnouncementPoliteness('error')).toBe('assertive');
});

it('Property 30b: all non-error types return "polite"', () => {
  fc.assert(
    fc.property(
      contentTypeArb.filter((t) => t !== 'error'),
      (contentType) => {
        expect(getAnnouncementPoliteness(contentType)).toBe('polite');
      },
    ),
    { numRuns: 50 },
  );
});

it('Property 30c: result is always either "assertive" or "polite"', () => {
  fc.assert(
    fc.property(contentTypeArb, (contentType) => {
      const result = getAnnouncementPoliteness(contentType);
      expect(['assertive', 'polite']).toContain(result);
    }),
    { numRuns: 50 },
  );
});

// ---------------------------------------------------------------------------
// buildScreenAnnouncement (no property test needed — trivial pure function)
// ---------------------------------------------------------------------------

it('buildScreenAnnouncement: formats as "tabName, screenTitle"', () => {
  expect(buildScreenAnnouncement('Discover', 'Diwali Gala')).toBe('Discover, Diwali Gala');
  expect(buildScreenAnnouncement('Calendar', 'May 2026')).toBe('Calendar, May 2026');
});
