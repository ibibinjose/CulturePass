/**
 * ical.ts — multi-event ICS generation and export helpers.
 *
 * Web:     triggers a .ics file download via a hidden <a> element.
 * Native:  delegates to expo-calendar via useCalendarSync.native.ts.
 *          Call `exportEventsToCalendar` from within the hook on native.
 */
import { Platform } from 'react-native';
import type { EventData } from '@/shared/schema';

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseEventDate(event: EventData): Date {
  try {
    const raw: unknown = event.date;
    if (raw instanceof Date) return raw;
    if (typeof raw === 'string' && raw.length) {
      const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
    if (raw && typeof raw === 'object' && 'toDate' in raw)
      return (raw as { toDate: () => Date }).toDate();
  } catch { /* fall through */ }
  return new Date();
}

// ─── ICS formatting ───────────────────────────────────────────────────────────

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function eventToVEVENT(event: EventData): string {
  const start = parseEventDate(event);
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2 h
  const location = [event.venue, event.address, event.city].filter(Boolean).join(', ');
  const desc = (event.description ?? '').replace(/\n/g, '\\n').slice(0, 500);

  const lines = [
    'BEGIN:VEVENT',
    `UID:culturepass-${event.id}@culturepass.app`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(event.title ?? 'CulturePass Event')}`,
    location  ? `LOCATION:${icsEscape(location)}`  : '',
    desc      ? `DESCRIPTION:${desc}`               : '',
    `URL:https://culturepass.app/e/${event.id}`,
    'END:VEVENT',
  ];
  return lines.filter(Boolean).join('\r\n');
}

function buildCalendar(events: EventData[], calName = 'CulturePass Events'): string {
  const vevents = events.map(eventToVEVENT).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:UTC',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

// ─── Export functions ─────────────────────────────────────────────────────────

/**
 * Download a .ics file containing all supplied events (web only).
 * On native, fall back to single-event export via the device calendar hook.
 */
export function downloadICS(events: EventData[], filename = 'culturepass-events'): boolean {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  if (events.length === 0) return false;

  const ics  = buildCalendar(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename.replace(/[^a-z0-9-_]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Build the HTTPS URL for the city calendar .ics feed.
 * Import buildCityCalendarHttpsUrl from calendar-utils for new code;
 * this re-export keeps existing call sites working.
 */
export { buildCityCalendarHttpsUrl as buildCityCalendarUrl } from '@/lib/calendar-utils';
