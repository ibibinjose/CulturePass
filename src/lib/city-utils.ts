/**
 * City tab utility pure functions.
 *
 * Key invariant: selecting a non-home city NEVER mutates the user's home city.
 * The home city is set once (from the user's profile) and remains unchanged for
 * the entire session, regardless of which city the user browses.
 *
 * - createCitySession: initialises session state
 * - viewCity: records a city browse (keeps homeCity immutable)
 * - backToHomeCity: resets viewingCity to homeCity
 * - saveForTravel: creates a TravelSave for an event in a non-home city
 *
 * All functions are pure (no side effects) for testability.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CityTabState {
  /** The user's home city — IMMUTABLE throughout the session. */
  readonly homeCity: string;
  /** Currently viewed city (null when viewing home city). */
  viewingCity: string | null;
  /** All non-home cities viewed this session (for "Back to X" chip). */
  sessionCityHistory: string[];
}

export interface TravelSave {
  eventId: string;
  cityName: string;
  savedAt: number;
  /** Distinguishes travel saves from home-city saves. */
  tag: 'travel';
}

// ---------------------------------------------------------------------------
// createCitySession
// ---------------------------------------------------------------------------

/**
 * Creates an initial CityTabState with the given home city.
 * The user is viewing their home city; no browsing history yet.
 */
export function createCitySession(homeCity: string): CityTabState {
  return {
    homeCity,
    viewingCity: null,
    sessionCityHistory: [],
  };
}

// ---------------------------------------------------------------------------
// viewCity
// ---------------------------------------------------------------------------

/**
 * Returns a new CityTabState reflecting the user browsing a given city.
 *
 * - If `city` is the home city: resets to home (viewingCity = null)
 * - If `city` differs: sets viewingCity to that city and records in history
 * - homeCity is NEVER modified
 *
 * @param session - Current session state
 * @param city - City the user selected
 */
export function viewCity(session: CityTabState, city: string): CityTabState {
  const { homeCity, sessionCityHistory } = session;

  if (city === homeCity) {
    return { ...session, viewingCity: null };
  }

  // Add to history (deduplicate, max 10 entries)
  const filtered = sessionCityHistory.filter((c) => c !== city);
  const newHistory = [city, ...filtered].slice(0, 10);

  return {
    homeCity, // immutable
    viewingCity: city,
    sessionCityHistory: newHistory,
  };
}

// ---------------------------------------------------------------------------
// backToHomeCity
// ---------------------------------------------------------------------------

/**
 * Resets the viewed city back to the home city.
 * Preserves session history so the "Back to [Home City]" chip works.
 */
export function backToHomeCity(session: CityTabState): CityTabState {
  return { ...session, viewingCity: null };
}

// ---------------------------------------------------------------------------
// saveForTravel
// ---------------------------------------------------------------------------

/**
 * Creates a TravelSave for an event discovered in a non-home city.
 * The 'travel' tag distinguishes this from a home-city save.
 *
 * @param eventId - ID of the event to save
 * @param cityName - City where the event was found
 * @param nowMs - Current timestamp in ms (injectable for testing)
 */
export function saveForTravel(
  eventId: string,
  cityName: string,
  nowMs = Date.now(),
): TravelSave {
  return {
    eventId,
    cityName,
    savedAt: nowMs,
    tag: 'travel',
  };
}
