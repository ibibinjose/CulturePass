import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin';
import { requireRole } from '../middleware/auth';
import { logger } from 'firebase-functions';
import { runGeohashBackfill } from '../jobs/geohashBackfill';
import { db, isFirestoreConfigured } from '../admin';
import { nowIso } from './utils';
import {
  createCommunityHomeBanner,
  deleteCommunityHomeBanner,
  listCommunityHomeBanners,
  publishCommunityHomeBanner,
  triggerCommunityHomeBanner,
  updateCommunityHomeBanner,
} from '../services/communityHomeBanner';

export const adminRouter = Router();

// All admin routes require at least 'admin' role
adminRouter.use(requireRole('admin'));

/**
 * GET /api/admin/stats
 * Aggregate platform-wide statistics.
 */
adminRouter.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Retrieve recent administrative actions.
 */
adminRouter.get('/admin/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await adminService.getAuditLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/admin/reports
 * Retrieve moderation reports.
 */
adminRouter.get('/admin/reports', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const limit = parseInt(req.query.limit as string) || 50;
    const reports = await adminService.getReports(status, limit);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /api/admin/reports/:id/context
 * Retrieve a moderation report with target and reporter snapshots.
 */
adminRouter.get('/admin/reports/:id/context', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Report id is required' });

    const context = await adminService.getReportContext(id);
    if (!context) return res.status(404).json({ error: 'Report not found' });

    res.json(context);
  } catch (error) {
    logger.error('Admin Report Context Error:', error);
    res.status(500).json({ error: 'Failed to fetch report context' });
  }
});

/**
 * POST /api/admin/reports/:id/resolve
 * Resolve a moderation report with an action.
 */
adminRouter.post('/admin/reports/:id/resolve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { action } = req.body;
    const adminUser = (req as any).user;

    await adminService.resolveReport(id, adminUser.id, action);

    await adminService.logAction({
      action: 'resolve_report',
      userId: adminUser.id,
      userName: adminUser.displayName || adminUser.email,
      targetId: id,
      metadata: { action }
    });

    res.json({ ok: true, status: 'resolved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

/**
 * GET /api/admin/finance/transactions
 * Retrieve recent transactions.
 */
adminRouter.get('/admin/finance/transactions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await adminService.getRecentTransactions(limit);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/admin/platform/config
 * Retrieve global platform configuration.
 */
adminRouter.get('/admin/platform/config', async (req: Request, res: Response) => {
  try {
    const config = await adminService.getPlatformConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform config' });
  }
});

/**
 * PUT /api/admin/platform/config
 * Update global platform configuration.
 */
adminRouter.put('/admin/platform/config', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    await adminService.updatePlatformConfig(req.body);

    await adminService.logAction({
      action: 'update_platform_config',
      userId: adminUser.id,
      userName: adminUser.displayName || adminUser.email,
      metadata: req.body
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update platform config' });
  }
});

/**
 * POST /api/admin/jobs/geohash-backfill
 * Backfill event geo coordinates and geohashes (admin-only operation).
 */
adminRouter.post('/admin/jobs/geohash-backfill', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as {
      forceGeoHash?: boolean;
      overwriteCoordinates?: boolean;
      limit?: number;
    };
    const result = await runGeohashBackfill({
      forceGeoHash: body.forceGeoHash === true,
      overwriteCoordinates: body.overwriteCoordinates === true,
      limit: typeof body.limit === 'number' ? body.limit : undefined,
    });
    return res.json({ ok: true, result });
  } catch (error) {
    logger.error('Geohash Backfill Error:', error);
    return res.status(500).json({ error: 'Failed to run geohash backfill job' });
  }
});

/**
 * GET /api/admin/analytics/events/:eventId
 * Organizer/admin event analytics snapshot (v1).
 */
adminRouter.get('/admin/analytics/events/:eventId', async (req: Request, res: Response) => {
  const eventId = String(req.params.eventId ?? '').trim();
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });
  if (!isFirestoreConfigured) {
    return res.json({
      eventId,
      totals: { tickets: 0, paidTickets: 0, grossRevenueCents: 0 },
      trend: [],
    });
  }

  try {
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

    const [ticketsSnap, activitySnap] = await Promise.all([
      db.collection('tickets').where('eventId', '==', eventId).limit(5000).get(),
      db.collection('activities').where('eventId', '==', eventId).limit(5000).get(),
    ]);

    const tickets = ticketsSnap.docs.map((d) => d.data() as { paymentStatus?: string; status?: string; totalPriceCents?: number; priceCents?: number; createdAt?: string });
    const paidTickets = tickets.filter((t) => t.paymentStatus === 'paid' || t.status === 'paid');
    const grossRevenueCents = paidTickets.reduce((sum, t) => sum + Number(t.totalPriceCents ?? t.priceCents ?? 0), 0);

    const byDay = new Map<string, { tickets: number; revenueCents: number; views: number }>();
    const dayKey = (isoLike: string | undefined) => String(isoLike ?? '').slice(0, 10);
    for (const t of paidTickets) {
      const day = dayKey(t.createdAt);
      if (!day) continue;
      const row = byDay.get(day) ?? { tickets: 0, revenueCents: 0, views: 0 };
      row.tickets += 1;
      row.revenueCents += Number(t.totalPriceCents ?? t.priceCents ?? 0);
      byDay.set(day, row);
    }

    for (const a of activitySnap.docs.map((d) => d.data() as { action?: string; createdAt?: string })) {
      const isView = a.action === 'event_view' || a.action === 'view_event';
      if (!isView) continue;
      const day = dayKey(a.createdAt);
      if (!day) continue;
      const row = byDay.get(day) ?? { tickets: 0, revenueCents: 0, views: 0 };
      row.views += 1;
      byDay.set(day, row);
    }

    const trend = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, stats]) => ({ day, ...stats }));

    return res.json({
      eventId,
      totals: {
        tickets: tickets.length,
        paidTickets: paidTickets.length,
        grossRevenueCents,
      },
      trend,
    });
  } catch (error) {
    logger.error('Event analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

// ── Promo Codes ───────────────────────────────────────────────────────────────

const promoCodeSchema = z.object({
  code:        z.string().min(3).max(32).transform(s => s.trim().toUpperCase()),
  type:        z.enum(['free_plus']),
  durationDays: z.number().int().min(1).max(3650),
  maxUses:     z.number().int().min(1).nullable().default(null),
  expiresAt:   z.string().datetime({ offset: true }).nullable().default(null),
  note:        z.string().max(200).default(''),
});

/**
 * GET /api/admin/promo-codes
 * List all promo codes, newest first.
 */
adminRouter.get('/admin/promo-codes', async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  try {
    const snap = await db.collection('promoCodes').orderBy('createdAt', 'desc').limit(200).get();
    const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ codes });
  } catch (err) {
    logger.error('promo-codes/list', err);
    return res.status(500).json({ error: 'Failed to list promo codes' });
  }
});

/**
 * POST /api/admin/promo-codes
 * Create a new promo code.
 */
adminRouter.post('/admin/promo-codes', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  let parsed: z.infer<typeof promoCodeSchema>;
  try { parsed = promoCodeSchema.parse(req.body); }
  catch (e) { return res.status(400).json({ error: 'Invalid body', detail: String(e) }); }

  // Uniqueness check
  const existing = await db.collection('promoCodes').where('code', '==', parsed.code).limit(1).get();
  if (!existing.empty) return res.status(409).json({ error: 'Code already exists' });

  try {
    const ref = await db.collection('promoCodes').add({
      code: parsed.code,
      type: parsed.type,
      durationDays: parsed.durationDays,
      maxUses: parsed.maxUses,
      expiresAt: parsed.expiresAt,
      note: parsed.note,
      isActive: true,
      usedCount: 0,
      usedBy: [],
      createdBy: req.user!.id,
      createdAt: nowIso(),
    });
    return res.status(201).json({ id: ref.id, code: parsed.code });
  } catch (err) {
    logger.error('promo-codes/create', err);
    return res.status(500).json({ error: 'Failed to create promo code' });
  }
});

/**
 * PATCH /api/admin/promo-codes/:id
 * Toggle active status (disable/re-enable a code).
 */
adminRouter.patch('/admin/promo-codes/:id', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive (boolean) required' });
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  try {
    await db.collection('promoCodes').doc(id).update({ isActive });
    return res.json({ ok: true });
  } catch (err) {
    logger.error('promo-codes/patch', err);
    return res.status(500).json({ error: 'Failed to update promo code' });
  }
});

/** GET /api/admin/community-home-banners */
adminRouter.get('/admin/community-home-banners', async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  try {
    const banners = await listCommunityHomeBanners();
    return res.json({ banners });
  } catch (err) {
    logger.error('community-home-banners/list', err);
    return res.status(500).json({ error: 'Failed to list banners' });
  }
});

/** POST /api/admin/community-home-banners */
adminRouter.post('/admin/community-home-banners', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const body = req.body ?? {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 2) return res.status(400).json({ error: 'title is required' });
  try {
    const banner = await createCommunityHomeBanner(
      {
        title,
        subtitle: typeof body.subtitle === 'string' ? body.subtitle : undefined,
        ctaLabel: typeof body.ctaLabel === 'string' ? body.ctaLabel : 'Explore',
        ctaRoute: typeof body.ctaRoute === 'string' ? body.ctaRoute : '/(tabs)/community',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      },
      req.user?.id ?? 'admin',
    );
    await db.collection('auditLogs').add({
      action: 'community_home_banner_created',
      userId: req.user?.id ?? '',
      userName: String(req.user?.id ?? 'admin'),
      metadata: { bannerId: banner.id },
      createdAt: nowIso(),
    });
    return res.status(201).json({ banner });
  } catch (err) {
    logger.error('community-home-banners/create', err);
    return res.status(500).json({ error: 'Failed to create banner' });
  }
});

/** PUT /api/admin/community-home-banners/:id */
adminRouter.put('/admin/community-home-banners/:id', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  const body = req.body ?? {};
  try {
    const banner = await updateCommunityHomeBanner(
      id,
      {
        title: typeof body.title === 'string' ? body.title : undefined,
        subtitle: typeof body.subtitle === 'string' ? body.subtitle : undefined,
        ctaLabel: typeof body.ctaLabel === 'string' ? body.ctaLabel : undefined,
        ctaRoute: typeof body.ctaRoute === 'string' ? body.ctaRoute : undefined,
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      },
      req.user?.id ?? 'admin',
    );
    return res.json({ banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update banner';
    const status = message.includes('not found') ? 404 : 500;
    logger.error('community-home-banners/update', err);
    return res.status(status).json({ error: message });
  }
});

/** POST /api/admin/community-home-banners/:id/publish — set as live banner (bumps revision) */
adminRouter.post('/admin/community-home-banners/:id/publish', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  try {
    const banner = await publishCommunityHomeBanner(id, req.user?.id ?? 'admin');
    await db.collection('auditLogs').add({
      action: 'community_home_banner_published',
      userId: req.user?.id ?? '',
      userName: String(req.user?.id ?? 'admin'),
      metadata: { bannerId: banner.id, revision: banner.revision },
      createdAt: nowIso(),
    });
    return res.json({ banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish banner';
    const status = message.includes('not found') ? 404 : 500;
    logger.error('community-home-banners/publish', err);
    return res.status(status).json({ error: message });
  }
});

/** POST /api/admin/community-home-banners/:id/trigger — rebroadcast to users who dismissed */
adminRouter.post('/admin/community-home-banners/:id/trigger', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  try {
    const banner = await triggerCommunityHomeBanner(id, req.user?.id ?? 'admin');
    await db.collection('auditLogs').add({
      action: 'community_home_banner_triggered',
      userId: req.user?.id ?? '',
      userName: String(req.user?.id ?? 'admin'),
      metadata: { bannerId: banner.id, revision: banner.revision },
      createdAt: nowIso(),
    });
    return res.json({ banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to trigger banner';
    const status = message.includes('not found') ? 404 : 500;
    logger.error('community-home-banners/trigger', err);
    return res.status(status).json({ error: message });
  }
});

/** DELETE /api/admin/community-home-banners/:id */
adminRouter.delete('/admin/community-home-banners/:id', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  try {
    await deleteCommunityHomeBanner(id);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete banner';
    const status = message.includes('not found') || message.includes('Cannot delete') ? 400 : 500;
    logger.error('community-home-banners/delete', err);
    return res.status(status).json({ error: message });
  }
});
