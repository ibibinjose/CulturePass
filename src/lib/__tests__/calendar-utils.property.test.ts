/**
 * Property-Based Tests for calendar-utils.ts
 *
 * Property 8: Calendar Dot Classification
 * Property 9: Calendar Day View Sorting and Limiting
 * Property 10: Webcal URL Generation
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5
 */

import * as fc from 'fast-check';
import {
  getCalendarDots,
  shouldShowDiscoverThisWeek,
  getDayViewEvents,
  generateWebcalUrl,
} from '../calendar-utils';
import type { EventData, Ticket } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_DATE = new Date('2026-05-17T00:00:00Z');
const BASE_DATE_STR = '2026-05-17';
const OTHER_DATE_STR = '2026-05-20';

function makeEvent(overrides: Partial<EventData> & { id: string }): EventData {
  return {
    title: 'Test Event',
    description: '',
    date: BASE_DATE_STR,
    country: 'Australia',
    city: 'Sydney',
    ...overrides,
  } as EventData;
}

function makeTicket(overrides: Partial<Ticket> & { eventId: string }): Ticket {
  return {
    id: overrides.eventId,
    userId: 'u1',
    status: 'confirmed',
    eventDate: BASE_DATE_STR,
    history: [],
    ...overrides,
  } as Ticket;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const cultureTagArb = fc.constantFrom('tamil', 'malayali', 'punjabi', 'chinese', 'greek');
const optCultureTagArb = fc.option(cultureTagArb, { nil: undefined });

const eventArb: fc.Arbitrary<EventData> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 40 }),
  description: fc.constant(''),
  date: fc.constantFrom(BASE_DATE_STR, OTHER_DATE_STR),
  country: fc.constant('Australia'),
  city: fc.constant('Sydney'),
  cultureTag: fc.array(cultureTagArb, { minLength: 0, maxLength: 3 }),
  time: fc.option(
    fc.tuple(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 59 }),
    ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
    { nil: undefined },
  ),
} as any);

const eventListArb = fc.array(eventArb, { minLength: 0, maxLength: 20 });

const ticketArb: fc.Arbitrary<Ticket> = fc.record({
  id: fc.uuid(),
  eventId: fc.uuid(),
  userId: fc.constant('u1'),
  status: fc.constantFrom('confirmed' as const, 'reserved' as const, 'cancelled' as const),
  eventDate: fc.constantFrom(BASE_DATE_STR, OTHER_DATE_STR),
  history: fc.constant([]),
} as any);

const ticketListArb = fc.array(ticketArb, { minLength: 0, maxLength: 10 });
const savedIdListArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 10 });
const cultureFilterArb = fc.array(cultureTagArb, { minLength: 0, maxLength: 5 });

// ---------------------------------------------------------------------------
// Property 8: getCalendarDots
// ---------------------------------------------------------------------------

it('Property 8a: result never exceeds maxDots', () => {
  fc.assert(
    fc.property(
      ticketListArb,
      eventListArb,
      eventListArb,
      fc.integer({ min: 1, max: 5 }),
      (tickets, saved, recommended, maxDots) => {
        const result = getCalendarDots(BASE_DATE, tickets, saved, recommended, [], maxDots);
        expect(result.length).toBeLessThanOrEqual(maxDots);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 8b: ticketed events get solid dots', () => {
  fc.assert(
    fc.property(ticketListArb, eventListArb, (tickets, saved) => {
      const result = getCalendarDots(BASE_DATE, tickets, saved, []);
      for (const dot of result) {
        if (dot.source === 'ticketed') {
          expect(dot.type).toBe('solid');
        }
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 8c: saved and recommended events get outlined dots', () => {
  fc.assert(
    fc.property(eventListArb, eventListArb, (saved, recommended) => {
      const result = getCalendarDots(BASE_DATE, [], saved, recommended);
      for (const dot of result) {
        if (dot.source === 'saved' || dot.source === 'recommended') {
          expect(dot.type).toBe('outlined');
        }
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 8d: culture filter excludes events not matching any active tag', () => {
  // Events with only 'tamil' tag should not appear when filter is ['chinese']
  const tamilEvent = makeEvent({ id: 'tamil-e', date: BASE_DATE_STR, cultureTag: ['tamil'] });
  const chineseEvent = makeEvent({ id: 'chinese-e', date: BASE_DATE_STR, cultureTag: ['chinese'] });

  const result = getCalendarDots(BASE_DATE, [], [tamilEvent, chineseEvent], [], ['chinese']);
  const dotIds = result.map((d) => d.eventId);
  expect(dotIds).toContain('chinese-e');
  expect(dotIds).not.toContain('tamil-e');
});

it('Property 8e: no duplicate event IDs in dots for a single date', () => {
  fc.assert(
    fc.property(ticketListArb, eventListArb, eventListArb, (tickets, saved, recommended) => {
      const result = getCalendarDots(BASE_DATE, tickets, saved, recommended);
      const ids = result.map((d) => d.eventId);
      expect(new Set(ids).size).toBe(ids.length);
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 9: getDayViewEvents
// ---------------------------------------------------------------------------

it('Property 9a: result never exceeds maxEvents', () => {
  fc.assert(
    fc.property(
      eventListArb,
      ticketListArb,
      savedIdListArb,
      fc.integer({ min: 1, max: 25 }),
      (events, tickets, saved, maxEvents) => {
        const result = getDayViewEvents(BASE_DATE, events, tickets, saved, maxEvents);
        expect(result.length).toBeLessThanOrEqual(maxEvents);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 9b: result contains only events matching the given date', () => {
  fc.assert(
    fc.property(eventListArb, (events) => {
      const result = getDayViewEvents(BASE_DATE, events, [], []);
      for (const { event } of result) {
        expect(event.date).toBe(BASE_DATE_STR);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 9c: events are sorted by start time ascending', () => {
  fc.assert(
    fc.property(eventListArb, ticketListArb, (events, tickets) => {
      const result = getDayViewEvents(BASE_DATE, events, tickets, []);
      for (let i = 1; i < result.length; i++) {
        const prevTime = result[i - 1]!.event.time ?? '99:99';
        const currTime = result[i]!.event.time ?? '99:99';
        expect(prevTime <= currTime).toBe(true);
      }
    }),
    { numRuns: 200 },
  );
});

it('Property 9d: status is "owned" for tickets, "saved" for saved, "recommended" otherwise', () => {
  const ticket = makeTicket({ eventId: 'e-owned', eventDate: BASE_DATE_STR });
  const ownedEvent = makeEvent({ id: 'e-owned', date: BASE_DATE_STR });
  const savedEvent = makeEvent({ id: 'e-saved', date: BASE_DATE_STR });
  const recEvent = makeEvent({ id: 'e-rec', date: BASE_DATE_STR });

  const result = getDayViewEvents(BASE_DATE, [ownedEvent, savedEvent, recEvent], [ticket], ['e-saved']);
  const byId = Object.fromEntries(result.map((r) => [r.event.id, r.status]));

  expect(byId['e-owned']).toBe('owned');
  expect(byId['e-saved']).toBe('saved');
  expect(byId['e-rec']).toBe('recommended');
});

// ---------------------------------------------------------------------------
// Property 10: generateWebcalUrl
// ---------------------------------------------------------------------------

it('Property 10a: always produces a webcal:// URL', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      (city) => {
        const url = generateWebcalUrl(city);
        expect(url.startsWith('webcal://')).toBe(true);
      },
    ),
    { numRuns: 200 },
  );
});

it('Property 10b: URL contains the city identifier', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('sydney', 'melbourne', 'auckland', 'london', 'dubai'),
      (city) => {
        const url = generateWebcalUrl(city);
        expect(url).toContain(encodeURIComponent(city));
      },
    ),
    { numRuns: 50 },
  );
});

it('Property 10c: URL contains the .ics extension', () => {
  const url = generateWebcalUrl('Sydney');
  expect(url).toContain('.ics');
});
