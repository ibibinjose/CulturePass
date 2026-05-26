import { Router, type Request, type Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { eventsService } from '../services/events';
import { qstr, captureRouteError } from './utils';

export const calendarRouter = Router();

function formatDateToIcsString(dateStr: string, timeStr = '00:00'): string {
  const cleanDate = dateStr.replace(/[^0-9]/g, '').slice(0, 8);
  const cleanTime = timeStr.replace(/[^0-9]/g, '').slice(0, 4).padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

function getIcsEndString(startDateStr: string, startTimeStr: string, endDateStr?: string | null, endTimeStr?: string | null): string {
  if (endDateStr) {
    return formatDateToIcsString(endDateStr, endTimeStr || startTimeStr);
  }
  
  const dateObj = new Date(`${startDateStr}T${startTimeStr || '00:00'}:00`);
  if (!isNaN(dateObj.getTime())) {
    dateObj.setHours(dateObj.getHours() + 2);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${min}00`;
  }
  
  const cleanDate = startDateStr.replace(/[^0-9]/g, '').slice(0, 8);
  return `${cleanDate}T020000`;
}

function escapeIcsText(text = ''): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

function generateIcsFeed(city: string, siteOrigin: string, events: any[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//City Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:CulturePass - ${city}`,
    'X-WR-TIMEZONE:Australia/Sydney',
  ];

  for (const e of events) {
    const uid = `${e.id}@culturepass.co`;
    const dtstamp = e.createdAt ? e.createdAt.replace(/[^0-9]/g, '').slice(0, 15) + 'Z' : '20260527T000000Z';
    const dtstart = formatDateToIcsString(e.date, e.time);
    const dtend = getIcsEndString(e.date, e.time, e.endDate, e.endTime);
    const summary = escapeIcsText(e.title);
    const location = escapeIcsText((e.venue || '') + (e.address ? `, ${e.address}` : '') + `, ${e.city} ${e.state || ''}`);
    const eventUrl = `${siteOrigin}/event/${e.id}`;
    
    let descriptionText = e.description || '';
    if (descriptionText) {
      if (descriptionText.length > 300) {
        descriptionText = descriptionText.slice(0, 300) + '...';
      }
    }
    descriptionText += `\n\nMore details and tickets: ${eventUrl}`;
    const description = escapeIcsText(descriptionText);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`LOCATION:${location}`);
    lines.push(`URL;VALUE=URI:${eventUrl}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

calendarRouter.get('/calendar/city.ics', async (req: Request, res: Response) => {
  try {
    const city = qstr(req.query.city).trim();
    const country = qstr(req.query.country).trim() || 'Australia';

    if (!city) {
      return res.status(400).send('City query parameter is required');
    }

    const originHeader = req.headers.host;
    let siteOrigin = 'https://culturepass.co';
    if (originHeader) {
      if (originHeader.includes('culturekerala.com')) {
        siteOrigin = 'https://culturekerala.com';
      } else if (originHeader.includes('culturepass.app')) {
        siteOrigin = 'https://culturepass.app';
      } else if (originHeader.includes('localhost') || originHeader.includes('127.0.0.1')) {
        siteOrigin = `http://${originHeader}`;
      }
    }

    if (!isFirestoreConfigured) {
      const emptyIcs = generateIcsFeed(city, siteOrigin, []);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${city.toLowerCase().replace(/\s+/g, '_')}_calendar.ics"`);
      return res.send(emptyIcs);
    }

    const result = await eventsService.list(
      { city, country, status: 'published' },
      { page: 1, pageSize: 200 }
    );

    const icsContent = generateIcsFeed(city, siteOrigin, result.items);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${city.toLowerCase().replace(/\s+/g, '_')}_calendar.ics"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(icsContent);
  } catch (err) {
    captureRouteError(err, 'GET /calendar/city.ics');
    return res.status(500).send('Failed to generate calendar feed');
  }
});