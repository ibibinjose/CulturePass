import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/auth';
import { captureRouteError, qparam, qstr } from './utils';
import { cultureTodayCalendarService, toDayKey } from '../services/cultureTodayCalendar';
import { eventsService } from '../services/firestore';
import type { CultureTodayEntry, CultureTodayScopeType } from '../../../shared/schema/cultureToday';
import { CULTURE_TODAY_EVENT_TAG } from '../../../shared/schema/cultureToday';

export const cultureTodayRouter = Router();

const scopeEnum = z.enum(['global', 'country', 'state', 'culture']);

const entryWriteSchema = z.object({
  dayKey: z.string().regex(/^\d{2}-\d{2}$/).optional(),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  body: z.string().max(8000).optional(),
  learnMoreUrl: z.string().url().optional().or(z.literal('')),
  scopeType: scopeEnum,
  countryCode: z.string().max(3).optional(),
  countryName: z.string().max(120).optional(),
  stateRegion: z.string().max(120).optional(),
  cultureLabel: z.string().max(120).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  published: z.boolean().optional(),
});

function normalizeWrite(
  body: z.infer<typeof entryWriteSchema>,
  existing?: CultureTodayEntry,
): Omit<CultureTodayEntry, 'id' | 'createdAt' | 'updatedAt'> {
  const dk = body.dayKey ?? toDayKey(body.month, body.day);
  return {
    dayKey: dk,
    month: body.month,
    day: body.day,
    title: body.title.trim(),
    subtitle: body.subtitle?.trim() || undefined,
    body: body.body?.trim() || undefined,
    learnMoreUrl: body.learnMoreUrl === '' ? undefined : body.learnMoreUrl,
    scopeType: body.scopeType as CultureTodayScopeType,
    countryCode: body.countryCode?.trim() || undefined,
    countryName: body.countryName?.trim() || undefined,
    stateRegion: body.stateRegion?.trim() || undefined,
    cultureLabel: body.cultureLabel?.trim() || undefined,
    sortOrder: body.sortOrder ?? existing?.sortOrder ?? 0,
    published: body.published ?? existing?.published ?? true,
  };
}

/** GET /culture-today/today — published entries for today's calendar day */
cultureTodayRouter.get('/culture-today/today', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dk = toDayKey(now.getMonth() + 1, now.getDate());
    const entries = await cultureTodayCalendarService.listByDayKey(dk, true);
    const primary = entries[0];
    return res.json({
      dayKey: dk,
      entries,
      promoTitle: primary?.title,
      promoSubtitle: primary?.subtitle ?? primary?.body?.slice(0, 140),
    });
  } catch (err) {
    captureRouteError(err, 'GET /culture-today/today');
    return res.status(500).json({ error: 'Failed to load Culture Today' });
  }
});

/** GET /culture-today/month/:month — 1–12 */
cultureTodayRouter.get('/culture-today/month/:month', async (req: Request, res: Response) => {
  try {
    const m = Math.min(12, Math.max(1, parseInt(qparam(req.params.month), 10) || 0));
    if (!m) return res.status(400).json({ error: 'Invalid month' });
    const entries = await cultureTodayCalendarService.listByMonth(m, true);
    return res.json({ month: m, entries });
  } catch (err) {
    captureRouteError(err, 'GET /culture-today/month/:month');
    return res.status(500).json({ error: 'Failed to load month' });
  }
});

/** GET /culture-today/day/:dayKey — MM-DD */
cultureTodayRouter.get('/culture-today/day/:dayKey', async (req: Request, res: Response) => {
  try {
    const dk = qparam(req.params.dayKey);
    if (!/^\d{2}-\d{2}$/.test(dk)) return res.status(400).json({ error: 'dayKey must be MM-DD' });
    const entries = await cultureTodayCalendarService.listByDayKey(dk, true);
    return res.json({ dayKey: dk, entries });
  } catch (err) {
    captureRouteError(err, 'GET /culture-today/day/:dayKey');
    return res.status(500).json({ error: 'Failed to load day' });
  }
});

/** GET /culture-today/events — published events tagged CultureToday */
cultureTodayRouter.get('/culture-today/events', async (req: Request, res: Response) => {
  try {
    const pageSize = Math.min(60, Math.max(1, parseInt(qstr(req.query.pageSize) || '24', 10) || 24));
    const result = await eventsService.list({ status: 'published', tag: CULTURE_TODAY_EVENT_TAG }, { page: 1, pageSize });
    return res.json({ events: result.items, total: result.total });
  } catch (err) {
    captureRouteError(err, 'GET /culture-today/events');
    return res.status(500).json({ error: 'Failed to load events' });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

cultureTodayRouter.get(
  '/admin/culture-today/entries',
  requireRole('admin', 'platformAdmin'),
  async (_req: Request, res: Response) => {
    try {
      const entries = await cultureTodayCalendarService.listAllForAdmin();
      return res.json({ entries });
    } catch (err) {
      captureRouteError(err, 'GET /admin/culture-today/entries');
      return res.status(500).json({ error: 'Failed to list entries' });
    }
  },
);

cultureTodayRouter.post(
  '/admin/culture-today/entries',
  requireRole('admin', 'platformAdmin'),
  async (req: Request, res: Response) => {
    try {
      const parsed = entryWriteSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request payload' });
      }
      const row = normalizeWrite(parsed.data);
      const created = await cultureTodayCalendarService.upsert(undefined, row);
      return res.status(201).json(created);
    } catch (err) {
      captureRouteError(err, 'POST /admin/culture-today/entries');
      return res.status(500).json({ error: 'Failed to create entry' });
    }
  },
);

cultureTodayRouter.patch(
  '/admin/culture-today/entries/:id',
  requireRole('admin', 'platformAdmin'),
  async (req: Request, res: Response) => {
    try {
      const id = qparam(req.params.id);
      const existing = await cultureTodayCalendarService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const parsed = entryWriteSchema.partial().safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request payload' });
      }
      const merged = {
        month: parsed.data.month ?? existing.month,
        day: parsed.data.day ?? existing.day,
        title: parsed.data.title ?? existing.title,
        subtitle: parsed.data.subtitle ?? existing.subtitle,
        body: parsed.data.body ?? existing.body,
        learnMoreUrl: parsed.data.learnMoreUrl ?? existing.learnMoreUrl,
        scopeType: parsed.data.scopeType ?? existing.scopeType,
        countryCode: parsed.data.countryCode ?? existing.countryCode,
        countryName: parsed.data.countryName ?? existing.countryName,
        stateRegion: parsed.data.stateRegion ?? existing.stateRegion,
        cultureLabel: parsed.data.cultureLabel ?? existing.cultureLabel,
        sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
        published: parsed.data.published ?? existing.published,
      };
      const full = entryWriteSchema.parse(merged);
      const row = normalizeWrite(full, existing);
      const updated = await cultureTodayCalendarService.upsert(id, row);
      return res.json(updated);
    } catch (err) {
      captureRouteError(err, 'PATCH /admin/culture-today/entries/:id');
      return res.status(500).json({ error: 'Failed to update entry' });
    }
  },
);

cultureTodayRouter.delete(
  '/admin/culture-today/entries/:id',
  requireRole('admin', 'platformAdmin'),
  async (req: Request, res: Response) => {
    try {
      const id = qparam(req.params.id);
      await cultureTodayCalendarService.delete(id);
      return res.json({ ok: true });
    } catch (err) {
      captureRouteError(err, 'DELETE /admin/culture-today/entries/:id');
      return res.status(500).json({ error: 'Failed to delete entry' });
    }
  },
);

const SEED_ROWS: Omit<CultureTodayEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    dayKey: '04-13',
    month: 4,
    day: 13,
    title: 'Songkran & Southeast Asian New Year',
    subtitle: 'Thailand, Laos, Cambodia & Myanmar — water festivals and temple visits',
    body: 'Mid-April marks the traditional New Year across much of mainland Southeast Asia. Songkran in Thailand, Pi Mai in Laos, Chaul Chnam Thmey in Cambodia, and Thingyan in Myanmar each blend joyful water splashing with family reunions and spiritual renewal.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Songkran',
    scopeType: 'global',
    sortOrder: 10,
    published: true,
  },
  {
    dayKey: '08-09',
    month: 8,
    day: 9,
    title: "International Day of the World's Indigenous Peoples",
    subtitle: 'United Nations observance — 9 August',
    body: 'A global observance highlighting Indigenous rights, languages, and cultures. Communities host forums, cultural performances, and educational events to honour First Nations continuity and self-determination.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/International_Day_of_the_World%27s_Indigenous_Peoples',
    scopeType: 'global',
    sortOrder: 10,
    published: true,
  },
  {
    dayKey: '12-25',
    month: 12,
    day: 25,
    title: 'Christmas Day',
    subtitle: 'Christian diaspora & multicultural street celebrations',
    body: 'Christmas is celebrated worldwide with carols, gift-giving, and gatherings. Many cities host night markets, midnight services, and inclusive public festivals.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Christmas',
    scopeType: 'global',
    sortOrder: 10,
    published: true,
  },
  {
    dayKey: '01-26',
    month: 1,
    day: 26,
    title: 'Australia Day / Survival Day',
    subtitle: 'National public holiday — Invasion Day/Survival Day observances',
    body: '26 January marks the arrival of the First Fleet in 1788. Many Australians attend Survival Day marches, reflection ceremonies, and cultural events led by Aboriginal and Torres Strait Islander communities.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Australia_Day',
    scopeType: 'country',
    countryName: 'Australia',
    sortOrder: 10,
    published: true,
  },
  {
    dayKey: '02-17',
    month: 2,
    day: 17,
    title: 'Lunar New Year (2026 peak)',
    subtitle: 'Chinese diaspora & East Asian communities',
    body: 'Lunar New Year welcomes spring with reunion dinners, red envelopes, lion dances, and fireworks. Exact dates follow the lunisolar calendar each year — this seed row targets a common peak window; admins should adjust yearly.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Chinese_New_Year',
    scopeType: 'culture',
    cultureLabel: 'Chinese diaspora',
    sortOrder: 10,
    published: true,
  },
];

cultureTodayRouter.post(
  '/admin/culture-today/seed',
  requireRole('admin', 'platformAdmin'),
  async (_req: Request, res: Response) => {
    try {
      const out: CultureTodayEntry[] = [];
      for (let i = 0; i < SEED_ROWS.length; i++) {
        const id = `seed-${SEED_ROWS[i].dayKey}-${i}`;
        const row = { ...SEED_ROWS[i], dayKey: toDayKey(SEED_ROWS[i].month, SEED_ROWS[i].day) };
        const saved = await cultureTodayCalendarService.upsert(id, row);
        out.push(saved);
      }
      return res.json({ ok: true, count: out.length, entries: out });
    } catch (err) {
      captureRouteError(err, 'POST /admin/culture-today/seed');
      return res.status(500).json({ error: 'Failed to seed calendar' });
    }
  },
);
