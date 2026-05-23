// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Normalises a time string to 12-hour AM/PM format.
 *
 * Handles:
 *   "15:30"   → "3:30 PM"   (24-hour input)
 *   "3:30 PM" → "3:30 PM"   (already 12-hour — pass through)
 *   "00:00"   → "12:00 AM"  (midnight)
 *   "12:00"   → "12:00 PM"  (noon)
 *
 * Returns the original string unchanged when it cannot be parsed.
 */
export function formatEventTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';

  // Already 12-hour format (e.g. "3:30 PM") — normalise case only
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampmMatch) {
    const [, h, m, ampm] = ampmMatch;
    return `${h}:${m} ${ampm.toUpperCase()}`;
  }

  // 24-hour format: HH:MM or H:MM
  const h24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const mins  = h24Match[2];
    if (hours === 0)  return `12:${mins} AM`;
    if (hours < 12)  return `${hours}:${mins} AM`;
    if (hours === 12) return `12:${mins} PM`;
    return `${hours - 12}:${mins} PM`;
  }

  return timeStr; // unrecognised format — return unchanged
}

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

const US_CA_COUNTRIES = ['United States', 'USA', 'US', 'Canada', 'CA'];

/**
 * Returns the BCP 47 locale string for the given country.
 * AU / NZ / UK / most of the world → en-AU (DD/MM/YYYY)
 * US / CA → en-US (MM/DD/YYYY)
 */
export function getLocaleForCountry(country?: string): string {
  if (!country) return 'en-AU';
  if (US_CA_COUNTRIES.includes(country)) return 'en-US';
  return 'en-AU';
}

/**
 * Returns the ISO 4217 currency code for the given country name.
 */
export function getCurrencyForCountry(country?: string): string {
  const map: Record<string, string> = {
    'New Zealand': 'NZD',
    'United Kingdom': 'GBP',
    'United States': 'USD',
    'USA': 'USD',
    'Canada': 'CAD',
    'UAE': 'AED',
    'United Arab Emirates': 'AED',
  };
  return map[country ?? ''] ?? 'AUD';
}

/**
 * Formats a YYYY-MM-DD date string for display, respecting country locale.
 */
export function formatDateForCountry(dateStr: string, country?: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const locale = getLocaleForCountry(country);
  return d.toLocaleDateString(locale, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats a price in cents to a currency string for a given country.
 */
export function formatPrice(priceCents: number, country?: string): string {
  const currency = getCurrencyForCountry(country);
  const locale = getLocaleForCountry(country);
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0 }).format(priceCents / 100);
}

// ---------------------------------------------------------------------------

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDateTime(date: string, time?: string, country?: string): string {
  const day = toDate(date);
  if (!day) return date;

  const locale = getLocaleForCountry(country);
  const dateLabel = day.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (!time) return dateLabel;
  return `${dateLabel} • ${formatEventTime(time)}`;
}

export function formatEventDateTimeBadge(date: string, time?: string, country?: string): string {
  const day = toDate(date);
  if (!day) return time ? `${date} • ${formatEventTime(time)}` : date;

  const locale = getLocaleForCountry(country);
  const dateLabel = day.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

  return time ? `${dateLabel} • ${formatEventTime(time)}` : dateLabel;
}

/** Discover “live” badge window after scheduled start (no endTime on most events). */
export const DISCOVER_EVENT_LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * Parses local start time from `YYYY-MM-DD` plus optional `HH:MM` or `h:mm am/pm`.
 * Uses the device’s local timezone.
 */
export function parseEventStartMs(dateStr: string, timeStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const t = timeStr?.trim();
  if (t) {
    const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
    if (h24) {
      const hh = h24[1].padStart(2, '0');
      const d = new Date(`${dateStr}T${hh}:${h24[2]}:00`);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (ampm) {
      let h = parseInt(ampm[1], 10);
      const m = ampm[2];
      const ap = ampm[3].toLowerCase();
      if (ap === 'pm' && h !== 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${m}:00`);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
  }
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Human-readable countdown for “Starts in …” (e.g. `1h 05m`, `12:04`).
 */
export function formatStartsInCountdown(msUntilStart: number): string {
  if (msUntilStart <= 0) return '0:00';
  const totalSec = Math.ceil(msUntilStart / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function isEventInDiscoverLiveWindow(startMs: number, nowMs: number = Date.now()): boolean {
  return startMs <= nowMs && nowMs < startMs + DISCOVER_EVENT_LIVE_WINDOW_MS;
}

export function timeAgo(date: string | Date | null | undefined): string {
  const from = toDate(date);
  if (!from) return 'just now';

  const seconds = Math.max(1, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
