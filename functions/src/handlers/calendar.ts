import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { usersService } from '../services/users';
import { eventsService } from '../services/events';
import { captureRouteError, parseBody } from './utils';

export const calendarRouter = Router();

const calendarSettingsSchema = z.object({
  autoAddTickets: z.boolean().optional(),
  showPersonalEvents: z.boolean().optional(),
  deviceConnected: z.boolean().optional(),
  lastSyncedAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// ICS helpers (server-side — mirrors src/lib/ical.ts on the client)
// ---------------------------------------------------------------------------

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

interface IcsEvent {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  description?: string;
  venue?: string;
  address?: string;
  city?: string;
}

function buildVEVENT(event: IcsEvent): string {
  const dateStr = event.date ?? new Date().toISOString().split('T')[0];
  const timeStr = event.time ?? '00:00';
  const startIso = `${dateStr}T${timeStr}:00`;
  const start = new Date(startIso.includes('T') ? startIso : `${startIso}T00:00:00`);
  if (isNaN(start.getTime())) return '';

  const end = event.endDate
    ? new Date(`${event.endDate}T${event.endTime ?? '23:59'}:00`)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const location = [event.venue, event.address, event.city].filter(Boolean).join(', ');
  const desc = (event.description ?? '').replace(/\n/g, '\\n').slice(0, 500);

  const lines = [
    'BEGIN:VEVENT',
    `UID:culturepass-${event.id}@culturepass.app`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(event.title ?? 'CulturePass Event')}`,
    location ? `LOCATION:${icsEscape(location)}` : '',
    desc      ? `DESCRIPTION:${desc}` : '',
    `URL:https://culturepass.app/e/${event.id}`,
    'END:VEVENT',
  ];
  return lines.filter(Boolean).join('\r\n');
}

function buildICS(events: IcsEvent[], calName: string): string {
  const vevents = events.map(buildVEVENT).filter(Boolean).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:UTC',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

// ---------------------------------------------------------------------------
// Public city calendar subscription endpoint
// No auth required — webcal:// clients cannot send Bearer tokens
// ---------------------------------------------------------------------------

/**
 * GET /api/calendar/city.ics?city=Sydney&country=Australia
 *
 * Returns a valid iCalendar (.ics) feed for the next 90 days of published
 * events in the requested city. Suitable for webcal:// subscription from
 * any calendar app (iOS Calendar, Google Calendar, Outlook, etc.).
 *
 * CORS is open (*) because subscription clients send no credentials.
 */
calendarRouter.get('/calendar/city.ics', async (req: Request, res: Response) => {
  const city    = typeof req.query.city    === 'string' ? req.query.city.trim()    : '';
  const country = typeof req.query.country === 'string' ? req.query.country.trim() : 'Australia';

  if (!city) {
    return res.status(400).type('text/plain').send('Missing required query param: city');
  }

  // Allow webcal clients (no-cookie, no-auth cross-origin fetch)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1-hour CDN cache

  try {
    const now      = new Date();
    const horizon  = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const dateFrom = now.toISOString().split('T')[0]!;

    const result = await eventsService.list(
      { city, country, status: 'published' },
      { page: 1, pageSize: 200 },
    );

    // Filter to the 90-day window (list may return past events)
    const upcoming = result.items.filter((e) => {
      const d = new Date(e.date ?? '');
      return !isNaN(d.getTime()) && d >= now && d <= horizon;
    });

    const calName = `CulturePass ${city} Events`;
    // Normalise nulls to undefined so IcsEvent is satisfied
    const icsEvents: IcsEvent[] = upcoming.map((e) => ({
      id: e.id,
      title: e.title ?? undefined,
      date: e.date ?? undefined,
      time: e.time ?? undefined,
      endDate: e.endDate ?? undefined,
      endTime: e.endTime ?? undefined,
      description: e.description ?? undefined,
      venue: e.venue ?? undefined,
      address: e.address ?? undefined,
      city: e.city ?? undefined,
    }));
    const ics = buildICS(icsEvents, calName);

    const safeCity = city.toLowerCase().replace(/[^a-z0-9]/g, '-');
    res
      .status(200)
      .type('text/calendar; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="culturepass-${safeCity}.ics"`)
      .send(ics);
  } catch (err) {
    captureRouteError(err, 'GET /api/calendar/city.ics');
    return res.status(500).type('text/plain').send('Failed to generate calendar');
  }
});

// ---------------------------------------------------------------------------
// Authenticated user settings
// ---------------------------------------------------------------------------

/** GET /api/calendar/settings */
calendarRouter.get('/calendar/settings', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    return res.json(user.calendarSettings || {
      autoAddTickets: false,
      showPersonalEvents: true,
      deviceConnected: false,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/calendar/settings');
    return res.status(500).json({ error: 'Failed to fetch calendar settings' });
  }
});

/** PUT /api/calendar/settings */
calendarRouter.put('/calendar/settings', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const updates = parseBody(calendarSettingsSchema, req.body);
    
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const newSettings = {
      ...(user.calendarSettings || {}),
      ...updates,
    };
    
    await usersService.update(userId, { calendarSettings: newSettings });
    
    return res.json(newSettings);
  } catch (err: any) {
    captureRouteError(err, 'PUT /api/calendar/settings');
    return res.status(500).json({ error: err.message || 'Failed to update calendar settings' });
  }
});
