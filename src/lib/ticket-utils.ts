/**
 * Ticket utility pure functions.
 *
 * - formatCountdown: human-readable countdown for an upcoming event
 * - getUpcomingTicketCards: tickets for events within the next 24 hours
 *
 * All functions are pure (no side effects) for testability.
 */

import type { Ticket } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// ---------------------------------------------------------------------------
// formatCountdown
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable countdown string for a ticket event.
 *
 * - When the event is MORE than 24 hours away: "X days"
 * - When the event is 24 hours or fewer away: "X hours"
 * - X is always a positive integer (minimum 1)
 *
 * @param eventStartMs - Event start timestamp (milliseconds)
 * @param nowMs - Current timestamp (milliseconds)
 * @returns Countdown string (e.g. "3 days", "5 hours")
 */
export function formatCountdown(eventStartMs: number, nowMs: number): string {
  const diffMs = eventStartMs - nowMs;

  if (diffMs > ONE_DAY_MS) {
    const days = Math.floor(diffMs / ONE_DAY_MS);
    return `${Math.max(1, days)} days`;
  }

  const hours = Math.ceil(diffMs / ONE_HOUR_MS);
  return `${Math.max(1, hours)} hours`;
}

// ---------------------------------------------------------------------------
// getUpcomingTicketCards
// ---------------------------------------------------------------------------

/**
 * A ticket enriched with the event start timestamp for card rendering.
 * The `eventStartMs` comes from the ticket's date/eventDate fields.
 */
export interface UpcomingTicketEntry {
  ticket: Ticket;
  eventStartMs: number;
  countdown: string;
}

/**
 * Returns tickets for events that start within the next 24 hours,
 * sorted by soonest event start time, capped at maxCards.
 *
 * Only includes tickets whose event:
 *  - Has not yet started (eventStartMs >= nowMs)
 *  - Starts within 24 hours (eventStartMs <= nowMs + 24h)
 *  - Has status 'confirmed' or 'reserved'
 *
 * @param tickets - All user tickets (with eventDate or date fields)
 * @param nowMs - Current timestamp in milliseconds
 * @param maxCards - Maximum cards to return (default 3)
 */
export function getUpcomingTicketCards(
  tickets: Ticket[],
  nowMs: number,
  maxCards = 3,
): UpcomingTicketEntry[] {
  const windowEnd = nowMs + ONE_DAY_MS;

  return tickets
    .filter((t) => {
      if (t.status !== 'confirmed' && t.status !== 'reserved') return false;
      const dateStr = t.eventDate ?? t.date;
      if (!dateStr) return false;
      const eventMs = new Date(dateStr).getTime();
      return eventMs >= nowMs && eventMs <= windowEnd;
    })
    .sort((a, b) => {
      const aMs = new Date(a.eventDate ?? a.date ?? '').getTime();
      const bMs = new Date(b.eventDate ?? b.date ?? '').getTime();
      return aMs - bMs;
    })
    .slice(0, maxCards)
    .map((ticket) => {
      const eventStartMs = new Date(ticket.eventDate ?? ticket.date ?? '').getTime();
      return {
        ticket,
        eventStartMs,
        countdown: formatCountdown(eventStartMs, nowMs),
      };
    });
}
