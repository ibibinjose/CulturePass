/**
 * Property-Based Tests for my-space-utils.ts
 *
 * Property 15: My Space Section Ordering
 * Property 16: Notification Badge Formatting
 * Property 17: Membership Tier Progress Calculation
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import * as fc from 'fast-check';
import {
  orderMySpaceSections,
  formatBadgeCount,
  calculateTierProgress,
  type ActionItem,
  type MySpaceSectionType,
} from '../my-space-utils';
import type { Ticket, EventData, Community } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-05-17T12:00:00Z');

function makeTicket(id: string): Ticket {
  return { id, userId: 'u1', eventId: 'e1', status: 'confirmed' } as Ticket;
}

function makeEvent(id: string): EventData {
  return { id, title: 'Event', description: '', date: '2026-05-20', country: 'Australia', city: 'Sydney' };
}

function makeCommunity(id: string): Community {
  return { id, type: 'community', name: 'Community' } as Community;
}

function makeAction(type: string): ActionItem {
  return { type, label: `Complete ${type}` };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const ticketListArb = fc.array(fc.uuid().map(makeTicket), { minLength: 0, maxLength: 5 });
const eventListArb = fc.array(fc.uuid().map(makeEvent), { minLength: 0, maxLength: 5 });
const communityListArb = fc.array(fc.uuid().map(makeCommunity), { minLength: 0, maxLength: 5 });
const actionItemListArb = fc.array(
  fc.constantFrom('profile', 'perk_expiring').map(makeAction),
  { minLength: 0, maxLength: 3 },
);

const badgeCountArb = fc.integer({ min: 0, max: 200 });

const tierProgressArb = fc.tuple(
  fc.integer({ min: 0, max: 10000 }),  // currentPoints
  fc.integer({ min: 0, max: 5000 }),   // currentTierThreshold
  fc.integer({ min: 5001, max: 20000 }), // nextTierThreshold (always > current)
);

// ---------------------------------------------------------------------------
// Property 15: orderMySpaceSections
// ---------------------------------------------------------------------------

const SECTION_ORDER: MySpaceSectionType[] = [
  'upcoming_tickets',
  'action_required',
  'saved_events',
  'communities',
];

it('Property 15a: section ordering follows urgency (tickets > action > saved > communities)', () => {
  fc.assert(
    fc.property(
      ticketListArb,
      actionItemListArb,
      eventListArb,
      communityListArb,
      (tickets, actions, saved, communities) => {
        const result = orderMySpaceSections(tickets, actions, saved, communities, NOW);
        const types = result.map((s) => s.type);

        // Verify relative order: no section appears before a higher-urgency section
        for (let i = 0; i < types.length; i++) {
          for (let j = i + 1; j < types.length; j++) {
            const iRank = SECTION_ORDER.indexOf(types[i]!);
            const jRank = SECTION_ORDER.indexOf(types[j]!);
            expect(iRank).toBeLessThan(jRank);
          }
        }
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 15b: empty sections are never included', () => {
  fc.assert(
    fc.property(
      ticketListArb,
      actionItemListArb,
      eventListArb,
      communityListArb,
      (tickets, actions, saved, communities) => {
        const result = orderMySpaceSections(tickets, actions, saved, communities, NOW);
        for (const section of result) {
          expect(section.items.length).toBeGreaterThan(0);
        }
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 15c: result contains at most 4 sections', () => {
  fc.assert(
    fc.property(
      ticketListArb,
      actionItemListArb,
      eventListArb,
      communityListArb,
      (tickets, actions, saved, communities) => {
        const result = orderMySpaceSections(tickets, actions, saved, communities, NOW);
        expect(result.length).toBeLessThanOrEqual(4);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 15d: all empty inputs produces no sections', () => {
  const result = orderMySpaceSections([], [], [], [], NOW);
  expect(result).toHaveLength(0);
});

it('Property 15e: non-empty sections have correct item arrays', () => {
  const tickets = [makeTicket('t1'), makeTicket('t2')];
  const saved = [makeEvent('e1')];
  const result = orderMySpaceSections(tickets, [], saved, [], NOW);

  const ticketSection = result.find((s) => s.type === 'upcoming_tickets');
  expect(ticketSection?.items).toHaveLength(2);

  const savedSection = result.find((s) => s.type === 'saved_events');
  expect(savedSection?.items).toHaveLength(1);

  expect(result.find((s) => s.type === 'action_required')).toBeUndefined();
  expect(result.find((s) => s.type === 'communities')).toBeUndefined();
});

// ---------------------------------------------------------------------------
// Property 16: formatBadgeCount
// ---------------------------------------------------------------------------

it('Property 16a: returns empty string for 0', () => {
  expect(formatBadgeCount(0)).toBe('');
  expect(formatBadgeCount(-1)).toBe('');
});

it('Property 16b: returns exact count for 1–99', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 99 }), (count) => {
      expect(formatBadgeCount(count)).toBe(String(count));
    }),
    { numRuns: 99 },
  );
});

it('Property 16c: returns "99+" for counts >99', () => {
  fc.assert(
    fc.property(fc.integer({ min: 100, max: 10000 }), (count) => {
      expect(formatBadgeCount(count)).toBe('99+');
    }),
    { numRuns: 200 },
  );
});

it('Property 16d: result is never an empty string for count ≥1', () => {
  fc.assert(
    fc.property(badgeCountArb.filter((n) => n >= 1), (count) => {
      expect(formatBadgeCount(count).length).toBeGreaterThan(0);
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 17: calculateTierProgress
// ---------------------------------------------------------------------------

it('Property 17a: percentage is always clamped to [0, 100]', () => {
  fc.assert(
    fc.property(tierProgressArb, ([current, tierMin, nextMin]) => {
      const { percentage } = calculateTierProgress(current, tierMin, nextMin);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    }),
    { numRuns: 200 },
  );
});

it('Property 17b: pointsRemaining is always ≥0', () => {
  fc.assert(
    fc.property(tierProgressArb, ([current, tierMin, nextMin]) => {
      const { pointsRemaining } = calculateTierProgress(current, tierMin, nextMin);
      expect(pointsRemaining).toBeGreaterThanOrEqual(0);
    }),
    { numRuns: 200 },
  );
});

it('Property 17c: reaching nextTierThreshold gives 100% and 0 points remaining', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 5000 }),
      fc.integer({ min: 5001, max: 10000 }),
      (tierMin, nextMin) => {
        const { percentage, pointsRemaining } = calculateTierProgress(nextMin, tierMin, nextMin);
        expect(percentage).toBe(100);
        expect(pointsRemaining).toBe(0);
      },
    ),
    { numRuns: 100 },
  );
});

it('Property 17d: at currentTierThreshold, percentage is 0 and pointsRemaining = full range', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 5000 }),
      fc.integer({ min: 5001, max: 10000 }),
      (tierMin, nextMin) => {
        const { percentage, pointsRemaining } = calculateTierProgress(tierMin, tierMin, nextMin);
        expect(percentage).toBe(0);
        expect(pointsRemaining).toBe(nextMin - tierMin);
      },
    ),
    { numRuns: 100 },
  );
});

it('Property 17e: formula matches spec: (current - tierMin) / (nextMin - tierMin) * 100', () => {
  fc.assert(
    fc.property(tierProgressArb, ([current, tierMin, nextMin]) => {
      const { percentage } = calculateTierProgress(current, tierMin, nextMin);
      const range = nextMin - tierMin;
      const expected = Math.max(0, Math.min(100, ((current - tierMin) / range) * 100));
      expect(percentage).toBeCloseTo(expected, 10);
    }),
    { numRuns: 200 },
  );
});
