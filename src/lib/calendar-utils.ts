/**
 * Calendar utility pure functions.
 *
 * - getCalendarDots: dot classification for the monthly grid
 * - shouldShowDiscoverThisWeek: prompt when no saved events this week
 * - getDayViewEvents: sorted, annotated events for a day view
 * - generateWebcalUrl: webcal:// subscription URL for a city calendar
 *
 * All functions are pure (no side effects) for testability.
 */

import type { EventData, Ticket } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DotType = 'solid' | 'outlined';
export type EventStatus = 'owned' | 'saved' | 'recommended';

export interface CalendarDot {
  type: DotType;
  eventId: string;
  source: 'ticketed' | 'saved' | 'recommended';
}

export interface DayViewEvent {
  event: EventData;
  status: EventStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when a date string (YYYY-MM-DD) matches a given Date. */
function isSameDay(dateStr: string, date: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

/** Parses an optional time string ("HH:MM") into minutes-since-midnight, or Infinity. */
function timeToMinutes(time?: string): number {
  if (!time) return Infinity;
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Returns true when the event matches at least one active culture tag. */
function matchesCultureFilter(event: EventData, activeTags: string[]): boolean {
  if (activeTags.length === 0) return true;
  const eventTags = event.cultureTag ?? event.cultureTags ?? [];
  return activeTags.some((tag) =>
    eventTags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
}

// ---------------------------------------------------------------------------
// getCalendarDots
// ---------------------------------------------------------------------------

/**
 * Produces dot markers for a given date on the monthly calendar grid.
 *
 * Priority (when more than maxDots sources qualify):
 *   ticketed → saved → recommended
 *
 * Solid dot = ticketed event
 * Outlined dot = saved or recommended event
 *
 * @param date - The calendar date cell being rendered
 * @param tickets - User's confirmed/reserved tickets
 * @param savedEvents - Events in the user's saved list
 * @param recommendedEvents - Events matching the user's culture tags in their city
 * @param activeCultureFilter - Active tag filter (max 5); empty array = no filter
 * @param maxDots - Maximum dots per cell (default 3)
 */
export function getCalendarDots(
  date: Date,
  tickets: Ticket[],
  savedEvents: EventData[],
  recommendedEvents: EventData[],
  activeCultureFilter: string[] = [],
  maxDots = 3,
): CalendarDot[] {
  const dots: CalendarDot[] = [];

  // Collect event IDs already represented to avoid duplicates
  const seen = new Set<string>();

  // 1. Ticketed events (solid, highest priority)
  for (const ticket of tickets) {
    if (dots.length >= maxDots) break;
    const dateStr = ticket.eventDate ?? ticket.date;
    if (!dateStr || !isSameDay(dateStr, date)) continue;
    if (ticket.status !== 'confirmed' && ticket.status !== 'reserved') continue;
    if (seen.has(ticket.eventId)) continue;

    // Resolve event for culture filter (ticketed events always pass if no filter active)
    // We don't have the full event here — ticketed entries bypass culture filter
    seen.add(ticket.eventId);
    dots.push({ type: 'solid', eventId: ticket.eventId, source: 'ticketed' });
  }

  // 2. Saved events (outlined)
  for (const event of savedEvents) {
    if (dots.length >= maxDots) break;
    if (!isSameDay(event.date, date)) continue;
    if (seen.has(event.id)) continue;
    if (!matchesCultureFilter(event, activeCultureFilter)) continue;
    seen.add(event.id);
    dots.push({ type: 'outlined', eventId: event.id, source: 'saved' });
  }

  // 3. Recommended events (outlined)
  for (const event of recommendedEvents) {
    if (dots.length >= maxDots) break;
    if (!isSameDay(event.date, date)) continue;
    if (seen.has(event.id)) continue;
    if (!matchesCultureFilter(event, activeCultureFilter)) continue;
    seen.add(event.id);
    dots.push({ type: 'outlined', eventId: event.id, source: 'recommended' });
  }

  return dots;
}

// ---------------------------------------------------------------------------
// shouldShowDiscoverThisWeek
// ---------------------------------------------------------------------------

/**
 * Returns true when the user has no saved events during the current calendar week.
 * Ticket ownership does NOT affect this check.
 *
 * "Current week" is defined as Monday 00:00 to Sunday 23:59:59 of the week
 * containing `now`.
 */
export function shouldShowDiscoverThisWeek(savedEvents: EventData[], now: Date): boolean {
  // ISO week: Monday = 0, Sunday = 6
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekEnd.getTime();

  return !savedEvents.some((event) => {
    const eventMs = new Date(event.date).getTime();
    return eventMs >= weekStartMs && eventMs <= weekEndMs;
  });
}

// ---------------------------------------------------------------------------
// getDayViewEvents
// ---------------------------------------------------------------------------

/**
 * Returns events for a given date, sorted by start time ascending,
 * annotated with status (owned / saved / recommended), limited to maxEvents.
 *
 * Status priority: owned > saved > recommended
 */
export function getDayViewEvents(
  date: Date,
  allEvents: EventData[],
  tickets: Ticket[],
  savedEventIds: string[],
  maxEvents = 20,
): DayViewEvent[] {
  const ownedIds = new Set(
    tickets
      .filter((t) => t.status === 'confirmed' || t.status === 'reserved')
      .map((t) => t.eventId),
  );
  const savedSet = new Set(savedEventIds);

  return allEvents
    .filter((event) => isSameDay(event.date, date))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .slice(0, maxEvents)
    .map((event) => {
      let status: EventStatus = 'recommended';
      if (ownedIds.has(event.id)) status = 'owned';
      else if (savedSet.has(event.id)) status = 'saved';
      return { event, status };
    });
}

// ---------------------------------------------------------------------------
// Calendar subscription URLs
// ---------------------------------------------------------------------------

/**
 * Base HTTPS URL for the public city calendar endpoint.
 * Uses the known Cloud Functions URL — consistent across web and native.
 *
 * In local dev, set EXPO_PUBLIC_API_URL to the emulator URL and this
 * will automatically use that base instead.
 */
function calendarApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    // Strip trailing slash and /api suffix if present, then re-add /api
    const base = envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${base}/api`;
  }
  return 'https://us-central1-culturepass-4f264.cloudfunctions.net/api';
}

/**
 * Returns the HTTPS URL for the city calendar .ics feed.
 * Use this for the download fallback and as the basis for webcal:// URLs.
 */
export function buildCityCalendarHttpsUrl(city: string, country = 'Australia'): string {
  const base = calendarApiBase();
  return `${base}/calendar/city.ics?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
}

/**
 * Returns a webcal:// subscription URL for device calendar apps.
 * Identical to the HTTPS URL but with the scheme replaced.
 * Most calendar apps (iOS Calendar, macOS Calendar, Google Calendar) follow
 * the webcal:// redirect to the underlying HTTPS feed.
 */
export function generateWebcalUrl(city: string, country = 'Australia'): string {
  return buildCityCalendarHttpsUrl(city, country).replace(/^https:\/\//, 'webcal://');
}
