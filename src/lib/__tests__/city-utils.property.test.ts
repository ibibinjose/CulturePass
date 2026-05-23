/**
 * Property-Based Tests for city-utils.ts
 *
 * Property 14: City Selection Home City Invariant
 *
 * Validates: Requirements 7.2, 7.3
 */

import * as fc from 'fast-check';
import {
  createCitySession,
  viewCity,
  backToHomeCity,
  saveForTravel,
  type CityTabState,
} from '../city-utils';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const cityArb = fc.constantFrom('Sydney', 'Melbourne', 'Auckland', 'London', 'Dubai', 'Toronto');
const citySequenceArb = fc.array(cityArb, { minLength: 1, maxLength: 15 });

// ---------------------------------------------------------------------------
// Property 14a: homeCity never changes after any sequence of viewCity calls
// ---------------------------------------------------------------------------

it('Property 14a: homeCity is immutable after any sequence of city selections', () => {
  fc.assert(
    fc.property(cityArb, citySequenceArb, (homeCity, selections) => {
      let session = createCitySession(homeCity);
      for (const city of selections) {
        session = viewCity(session, city);
      }
      expect(session.homeCity).toBe(homeCity);
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 14b: Selecting home city resets viewingCity to null
// ---------------------------------------------------------------------------

it('Property 14b: selecting home city resets viewingCity to null', () => {
  fc.assert(
    fc.property(cityArb, cityArb, (homeCity, otherCity) => {
      if (homeCity === otherCity) return; // skip same-city case

      let session = createCitySession(homeCity);
      session = viewCity(session, otherCity);
      expect(session.viewingCity).toBe(otherCity);

      session = viewCity(session, homeCity);
      expect(session.viewingCity).toBeNull();
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 14c: Viewing a non-home city sets viewingCity correctly
// ---------------------------------------------------------------------------

it('Property 14c: viewingCity reflects the last non-home city selected', () => {
  fc.assert(
    fc.property(cityArb, cityArb, (homeCity, other) => {
      if (homeCity === other) return;
      const session = viewCity(createCitySession(homeCity), other);
      expect(session.viewingCity).toBe(other);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 14d: Session history grows with non-home city visits, caps at 10
// ---------------------------------------------------------------------------

it('Property 14d: sessionCityHistory never exceeds 10 entries', () => {
  fc.assert(
    fc.property(cityArb, citySequenceArb, (homeCity, selections) => {
      let session = createCitySession(homeCity);
      for (const city of selections) {
        session = viewCity(session, city);
      }
      expect(session.sessionCityHistory.length).toBeLessThanOrEqual(10);
    }),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 14e: backToHomeCity resets viewingCity to null, preserves homeCity
// ---------------------------------------------------------------------------

it('Property 14e: backToHomeCity resets viewingCity and preserves homeCity', () => {
  fc.assert(
    fc.property(cityArb, cityArb, (homeCity, other) => {
      if (homeCity === other) return;
      let session = createCitySession(homeCity);
      session = viewCity(session, other);
      session = backToHomeCity(session);
      expect(session.viewingCity).toBeNull();
      expect(session.homeCity).toBe(homeCity);
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 14f: saveForTravel always produces tag: 'travel' with correct fields
// ---------------------------------------------------------------------------

it('Property 14f: saveForTravel always tags the save as travel', () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      cityArb,
      fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
      (eventId, cityName, nowMs) => {
        const save = saveForTravel(eventId, cityName, nowMs);
        expect(save.tag).toBe('travel');
        expect(save.eventId).toBe(eventId);
        expect(save.cityName).toBe(cityName);
        expect(save.savedAt).toBe(nowMs);
      },
    ),
    { numRuns: 200 },
  );
});

// ---------------------------------------------------------------------------
// Property 14g: Home city never appears in sessionCityHistory
// ---------------------------------------------------------------------------

it('Property 14g: homeCity is never added to sessionCityHistory', () => {
  fc.assert(
    fc.property(cityArb, citySequenceArb, (homeCity, selections) => {
      let session = createCitySession(homeCity);
      for (const city of selections) {
        session = viewCity(session, city);
      }
      expect(session.sessionCityHistory).not.toContain(homeCity);
    }),
    { numRuns: 200 },
  );
});
