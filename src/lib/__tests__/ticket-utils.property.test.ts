/**
 * Property-Based Tests for ticket-utils.ts
 *
 * Property 6: Ticket Countdown Format
 * Property 7: Persistent Ticket Cards Selection
 *
 * Validates: Requirements 4.2, 4.3
 */

import * as fc from 'fast-check';
import { formatCountdown, getUpcomingTicketCards } from '../ticket-utils';
import type { Ticket } from '@/shared/schema';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

const NOW_MS = new Date('2026-05-17T12:00:00Z').getTime();

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** eventStartMs is within 7 days of now (positive diff for countdown). */
const futureDiffArb = fc.integer({ min: 1, max: SEVEN_DAYS_MS });

/** Any non-negative integer diff including 0 (edge: exactly at start). */
const nonNegDiffArb = fc.integer({ min: 0, max: SEVEN_DAYS_MS });

const makeTicket = (overrides: Partial<Ticket> & { eventId: string }): Ticket => ({
  id: overrides.eventId,
  userId: 'user-1',
  status: 'confirmed',
  eventDate: new Date(NOW_MS + ONE_HOUR_MS).toISOString(),
  history: [],
  ...overrides,
} as Ticket);

/** Arbitrary ticket with eventDate relative to NOW_MS. */
const ticketArb: fc.Arbitrary<Ticket> = fc.record({
  id: fc.uuid(),
  eventId: fc.uuid(),
  userId: fc.constant('user-1'),
  status: fc.constantFrom('confirmed' as const, 'reserved' as const, 'cancelled' as const, 'used' as const),
  history: fc.constant([]),
  eventDate: fc
    .integer({ min: -ONE_DAY_MS * 2, max: ONE_DAY_MS * 3 })
    .map((delta) => new Date(NOW_MS + delta).toISOString()),
} as any);

const ticketListArb = fc.array(ticketArb, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 6: formatCountdown
// ---------------------------------------------------------------------------

it('Property 6a: returns "X days" when diff > 24h, X is a positive integer', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: ONE_DAY_MS + 1, max: SEVEN_DAYS_MS }),
      (diff) => {
        const result = formatCountdown(NOW_MS + diff, NOW_MS);
        expect(result).toMatch(/^\d+ days$/);
        const x = parseInt(result, 10);
        expect(x).toBeGreaterThanOrEqual(1);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 6b: returns "X hours" when diff ≤ 24h, X is a positive integer', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: ONE_DAY_MS }),
      (diff) => {
        const result = formatCountdown(NOW_MS + diff, NOW_MS);
        expect(result).toMatch(/^\d+ hours$/);
        const x = parseInt(result, 10);
        expect(x).toBeGreaterThanOrEqual(1);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 6c: result never contains negative X', () => {
  fc.assert(
    fc.property(futureDiffArb, (diff) => {
      const result = formatCountdown(NOW_MS + diff, NOW_MS);
      const x = parseInt(result, 10);
      expect(x).toBeGreaterThan(0);
    }),
    { numRuns: 200 },
  );
});

it('Property 6d: diff exactly at 24h boundary returns hours not days', () => {
  const result = formatCountdown(NOW_MS + ONE_DAY_MS, NOW_MS);
  expect(result).toMatch(/hours$/);
});

// ---------------------------------------------------------------------------
// Property 7: getUpcomingTicketCards
// ---------------------------------------------------------------------------

it('Property 7a: result contains at most maxCards items', () => {
  fc.assert(
    fc.property(
      ticketListArb,
      fc.integer({ min: 1, max: 10 }),
      (tickets, maxCards) => {
        const result = getUpcomingTicketCards(tickets, NOW_MS, maxCards);
        expect(result.length).toBeLessThanOrEqual(maxCards);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 7b: all returned tickets have events within the next 24 hours', () => {
  fc.assert(
    fc.property(ticketListArb, (tickets) => {
      const result = getUpcomingTicketCards(tickets, NOW_MS);
      const windowEnd = NOW_MS + ONE_DAY_MS;
      for (const entry of result) {
        expect(entry.eventStartMs).toBeGreaterThanOrEqual(NOW_MS);
        expect(entry.eventStartMs).toBeLessThanOrEqual(windowEnd);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 7c: result is sorted by soonest event start time', () => {
  fc.assert(
    fc.property(ticketListArb, (tickets) => {
      const result = getUpcomingTicketCards(tickets, NOW_MS);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.eventStartMs).toBeLessThanOrEqual(result[i]!.eventStartMs);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 7d: cancelled/used/expired tickets are never included', () => {
  fc.assert(
    fc.property(ticketListArb, (tickets) => {
      const result = getUpcomingTicketCards(tickets, NOW_MS);
      for (const entry of result) {
        expect(['confirmed', 'reserved']).toContain(entry.ticket.status);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 7e: each entry has a non-empty countdown string', () => {
  fc.assert(
    fc.property(ticketListArb, (tickets) => {
      const result = getUpcomingTicketCards(tickets, NOW_MS);
      for (const entry of result) {
        expect(entry.countdown.length).toBeGreaterThan(0);
        expect(entry.countdown).toMatch(/\d+/);
      }
    }),
    { numRuns: 200 },
  );
});
