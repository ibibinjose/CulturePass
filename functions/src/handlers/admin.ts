import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, isFirestoreConfigured } from '../admin';
import { requireRole } from '../middleware/auth';
import { nowIso, qstr } from './utils';
import { adminService } from '../services/admin';
import { 
  listCommunityHomeBanners, 
  createCommunityHomeBanner, 
  updateCommunityHomeBanner, 
  publishCommunityHomeBanner, 
  triggerCommunityHomeBanner, 
  deleteCommunityHomeBanner 
} from '../services/communityHomeBanner';
import { verificationService } from '../services/verificationService';
import { logger } from 'firebase-functions';
import { runGeohashBackfill } from '../jobs/geohashBackfill';
import { syncEventbriteEvents } from '../services/eventbriteSync';
import { syncEventikEvents } from '../services/eventikSync';
import { profilesService } from '../services/profiles';
import { hostPageService } from '../services/host-page.service';

// Define request body types for better type safety
interface AdminRequest extends Request {
  user?: {
    id: string;
    username: string;
    displayName?: string;
    email?: string;
    role: 'user' | 'organizer' | 'business' | 'sponsor' | 'cityAdmin' | 'platformAdmin' | 'moderator' | 'admin' | 'superAdmin';
    tier?: string;
    city?: string;
    country?: string;
    issuedAt: number;
  };
}

export const adminRouter = Router();

// Scope role guard to /admin/* only — a bare router.use() would block every
// later-mounted /api route (e.g. /api/host-pages/*) for non-admin users.
adminRouter.use('/admin', requireRole('admin'));

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
 * POST /api/admin/stats/recompute-daily
 * Manually trigger daily stats aggregation (useful for testing or backfill).
 * Only super admins should call this in production.
 */
adminRouter.post('/admin/stats/recompute-daily', requireRole('superAdmin'), async (req: Request, res: Response) => {
  try {
    const { computeDailyStats } = await import('../triggers/dailyStats');
    const stats = await computeDailyStats();

    const today = new Date().toISOString().split('T')[0];
    await db.collection('dailyStats').doc(today).set({
      ...stats,
      date: today,
      computedAt: nowIso(),
      manuallyTriggeredBy: req.user!.id,
    });

    res.json({ ok: true, date: today, stats });
  } catch (error) {
    logger.error('Manual daily stats recompute error:', error);
    res.status(500).json({ error: 'Failed to recompute daily stats' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Retrieve recent administrative actions.
 */
adminRouter.get('/admin/audit-logs', async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(qstr(req.query.limit) || '50');
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
    const logs = await adminService.getAuditLogs(limit);
    if ((adminService as { _lastAuditUsedFallback?: boolean })._lastAuditUsedFallback) {
      res.setHeader('X-Query-Mode', 'fallback');
    }
    res.json({ logs });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/admin/reports
 * Retrieve moderation reports.
 */
adminRouter.get('/admin/reports', async (req: Request, res: Response) => {
  try {
    const status = qstr(req.query.status) || 'pending';
    const limitRaw = Number(qstr(req.query.limit) || '50');
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
    const reports = await adminService.getReports(status, limit);

    if ((adminService as { _lastReportsUsedFallback?: boolean })._lastReportsUsedFallback) {
      res.setHeader('X-Query-Mode', 'fallback');
    }

    res.json({ reports });
  } catch (error) {
    logger.error('Admin Reports Error:', error);
    // Firestore often returns a helpful message with an index creation URL
    const message = error instanceof Error ? error.message : 'Failed to fetch reports';
    res.status(500).json({ error: 'Failed to load reports', details: message });
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
adminRouter.post('/admin/reports/:id/resolve', async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { action } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await adminService.resolveReport(id, adminUser.id, action);

    await adminService.logAction({
      action: 'resolve_report',
      userId: adminUser.id,
      userName: adminUser.displayName ?? adminUser.email ?? adminUser.username ?? adminUser.id,
      targetId: id,
      metadata: { action }
    });

    res.json({ ok: true, status: 'resolved' });
  } catch (error) {
    logger.error('Report resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

/**
 * POST /api/admin/reports/:id/escalate
 * Escalate a moderation report to a higher level.
 */
adminRouter.post('/admin/reports/:id/escalate', async (req: AdminRequest, res: Response) => {
  try {
    const reportId = req.params.id as string;
    const { escalationLevel } = req.body;
    const adminUser = req.user!;
    const auditEntry = {
      action: 'escalate_report',
      targetId: reportId,
      targetCollection: 'reports',
      userId: adminUser.id,
      userName: adminUser.displayName || adminUser.email || adminUser.username || adminUser.id,
      timestamp: nowIso(),
      metadata: { escalatedTo: escalationLevel },
    };
    await adminService.logAction(auditEntry);
    res.json({ ok: true, status: 'escalated' });
  } catch (error) {
    logger.error('Report escalation error:', error);
    res.status(500).json({ error: 'Failed to escalate report' });
  }
});

/**
 * GET /api/admin/finance/transactions
 * Retrieve recent transactions.
 */
adminRouter.get('/admin/finance/transactions', async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(qstr(req.query.limit) || '50');
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
    const transactions = await adminService.getRecentTransactions(limit);
    if ((adminService as { _lastTransactionsUsedFallback?: boolean })._lastTransactionsUsedFallback) {
      res.setHeader('X-Query-Mode', 'fallback');
    }
    res.json({ transactions });
  } catch (_error) {
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
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch platform config' });
  }
});

/**
 * PUT /api/admin/platform/config
 * Update global platform configuration.
 */
adminRouter.put('/admin/platform/config', async (req: Request, res: Response) => {
  try {
    const adminUser = (req as AdminRequest).user!;
    await adminService.updatePlatformConfig(req.body);

    await adminService.logAction({
      action: 'update_platform_config',
      userId: adminUser.id,
      userName: adminUser.displayName ?? adminUser.email ?? adminUser.username ?? adminUser.id,
      metadata: req.body
    });

    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to update platform config' });
  }
});

/**
 * POST /api/admin/jobs/geohash-backfill
 * Backfill event geo coordinates and geohashes (admin-only operation).
 */
adminRouter.post('/admin/jobs/geohash-backfill', async (req: AdminRequest, res: Response) => {
  try {
    const body = req.body as {
      forceGeoHash?: boolean;
      overwriteCoordinates?: boolean;
      limit?: number;
    };
    
    const result = await runGeohashBackfill({
      forceGeoHash: Boolean(body.forceGeoHash),
      overwriteCoordinates: Boolean(body.overwriteCoordinates),
      limit: body.limit
    });
    
    return res.json({ ok: true, result });
  } catch (error) {
    logger.error('Geohash Backfill Error:', error);
    return res.status(500).json({ error: 'Failed to run geohash backfill job' });
  }
});

/**
 * POST /api/admin/integrations/eventbrite/sync
 * Manual Eventbrite Australia import (superAdmin).
 */
adminRouter.post('/admin/integrations/eventbrite/sync', async (req: AdminRequest, res: Response) => {
  try {
    if (req.user?.role !== 'superAdmin') {
      return res.status(403).json({ error: 'superAdmin required' });
    }
    const result = await syncEventbriteEvents();
    return res.json({ ok: true, result });
  } catch (error) {
    logger.error('Eventbrite sync error:', error);
    return res.status(500).json({ error: 'Eventbrite sync failed' });
  }
});

/**
 * POST /api/admin/integrations/eventik/sync
 * Manual Eventik import (superAdmin).
 */
adminRouter.post('/admin/integrations/eventik/sync', async (req: AdminRequest, res: Response) => {
  try {
    if (req.user?.role !== 'superAdmin') {
      return res.status(403).json({ error: 'superAdmin required' });
    }
    const result = await syncEventikEvents();
    return res.json({ ok: true, result });
  } catch (error) {
    logger.error('Eventik sync error:', error);
    return res.status(500).json({ error: 'Eventik sync failed' });
  }
});

/**
 * GET /api/admin/analytics/events/:eventId
 * Organizer/admin event analytics snapshot (v1).
 */
adminRouter.get('/admin/analytics/events/:eventId', async (req: AdminRequest, res: Response) => {
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

    const tickets = ticketsSnap.docs.map((d) => d.data() as { 
      paymentStatus?: string; 
      status?: string; 
      totalPriceCents?: number; 
      priceCents?: number; 
      createdAt?: string 
    });
    
    const paidTickets = tickets.filter((t) => t.paymentStatus === 'paid' || t.status === 'paid');
    const grossRevenueCents = paidTickets.reduce((sum, t) => sum + Number(t.totalPriceCents ?? t.priceCents ?? 0), 0);

    const byDay = new Map<string, { tickets: number; revenueCents: number; views: number }>();
    
    for (const t of paidTickets) {
      const day = t.createdAt?.slice(0, 10);
      if (!day) continue;
      const row = byDay.get(day) ?? { tickets: 0, revenueCents: 0, views: 0 };
      row.tickets += 1;
      row.revenueCents += Number(t.totalPriceCents ?? t.priceCents ?? 0);
      byDay.set(day, row);
    }

    for (const a of activitySnap.docs.map((d) => d.data() as { action?: string; createdAt?: string })) {
      if (a.action === 'event_view' || a.action === 'view_event') {
        const day = a.createdAt?.slice(0, 10);
        if (day) {
          const row = byDay.get(day) ?? { tickets: 0, revenueCents: 0, views: 0 };
          row.views += 1;
          byDay.set(day, row);
        }
      }
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
  type:        z.enum(['free_plus', 'ticket_discount']),
  // For free_plus (membership gift)
  durationDays: z.number().int().min(1).max(3650).optional(),
  // For ticket_discount
  discountType: z.enum(['fixed', 'percent']).optional(),
  discountValue: z.number().min(0).optional(),
  eventId: z.string().optional(), // optional restrict
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  // Common
  maxUses:     z.number().int().min(1).nullable().default(null), // alias for maxRedemptions in free_plus
  expiresAt:   z.string().datetime({ offset: true }).nullable().default(null),
  note:        z.string().max(200).default(''),
}).refine((data) => {
  if (data.type === 'free_plus') {
    return typeof data.durationDays === 'number';
  }
  if (data.type === 'ticket_discount') {
    return typeof data.discountType === 'string' && typeof data.discountValue === 'number';
  }
  return true;
}, { message: 'Missing required fields for promo type' });

/**
 * GET /api/admin/promo-codes
 * List all promo codes, newest first.
 */
adminRouter.get('/admin/promo-codes', async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  try {
    try {
      const snap = await db.collection('promoCodes').orderBy('createdAt', 'desc').limit(200).get();
      const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ codes });
    } catch (err: unknown) {
      const errorObj = err as { code?: number; message?: string };
      const isIndexError = errorObj?.code === 9 || /index/i.test(errorObj?.message || '');
      if (isIndexError) {
        logger.warn('listPromoCodes: Missing index. Falling back.');
        const snap = await db.collection('promoCodes').limit(400).get();
        const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }) as { id: string; createdAt?: string });
        codes.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        res.setHeader('X-Query-Mode', 'fallback');
        return res.json({ codes: codes.slice(0, 200) });
      }
      throw err;
    }
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

  // Uniqueness check - use doc id for code to support ticket lookup by doc(code)
  const promoRef = db.collection('promoCodes').doc(parsed.code);
  const existing = await promoRef.get();
  if (existing.exists) return res.status(409).json({ error: 'Code already exists' });

  try {
    const baseData = {
      code: parsed.code,
      type: parsed.type,
      isActive: true,
      usedCount: 0,
      redeemedCount: 0,
      createdBy: req.user!.id,
      createdAt: nowIso(),
      expiresAt: parsed.expiresAt,
      note: parsed.note,
      maxUses: parsed.maxUses,
      maxRedemptions: parsed.maxRedemptions ?? parsed.maxUses,
    };

    let fullData: Record<string, unknown> = { ...baseData };
    if (parsed.type === 'free_plus') {
      fullData.durationDays = parsed.durationDays;
      fullData.usedBy = [];
    } else if (parsed.type === 'ticket_discount') {
      fullData.discountType = parsed.discountType;
      fullData.discountValue = parsed.discountValue;
      fullData.eventId = parsed.eventId || null;
      fullData.redeemedCount = 0;
    }

    await promoRef.set(fullData);
    return res.status(201).json({ id: parsed.code, code: parsed.code });
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

// ─────────────────────────────────────────────────────────────────────────────
// Verification Workflow (2nd-layer host/profile approvals: ABN, venues, pros, etc.)
// Routes called by /admin/verification/* UI. All require admin+ role (already applied at router level).
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/admin/verification/tasks — list with filters */
adminRouter.get('/admin/verification/tasks', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.json({ tasks: [] });
  try {
    const status = qstr(req.query.status) || undefined;
    const entityType = qstr(req.query.entityType) || undefined;
    const assignedTo = qstr(req.query.assignedTo) || undefined;
    const overdueSla = qstr(req.query.overdueSla) === 'true';

    const tasks = await verificationService.listTasks({
      status: status as 'pending' | 'in-review' | 'approved' | 'rejected' | 'more-info-needed',
      entityType: entityType as 'artist' | 'business' | 'venue' | 'community' | 'organiser' | 'professional',
      assignedTo,
      overdueSla,
    });
    if ((verificationService as any)._lastVerificationUsedFallback) {
      res.setHeader('X-Query-Mode', 'fallback');
    }
    return res.json({ tasks });
  } catch (err) {
    logger.error('admin/verification/tasks list', err);
    return res.status(500).json({ error: 'Failed to list verification tasks' });
  }
});

/** GET /api/admin/verification/tasks/:id */
adminRouter.get('/admin/verification/tasks/:id', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  try {
    const task = await verificationService.getTask(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    return res.json(task);
  } catch (err) {
    logger.error('admin/verification/task get', err);
    return res.status(500).json({ error: 'Failed to fetch verification task' });
  }
});

/** GET /api/admin/verification/stats */
adminRouter.get('/admin/verification/stats', async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) {
    return res.json({ pending: 0, inReview: 0, approved: 0, rejected: 0, moreInfoNeeded: 0, overdueSla: 0 });
  }
  try {
    const stats = await verificationService.getStatistics();
    return res.json(stats);
  } catch (err) {
    logger.error('admin/verification/stats', err);
    return res.status(500).json({ error: 'Failed to fetch verification stats' });
  }
});

/** POST /api/admin/verification/tasks/:id/approve */
adminRouter.post('/admin/verification/tasks/:id/approve', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  const { adminNotes } = req.body || {};
  try {
    await verificationService.approveTask(taskId, req.user!.id, adminNotes);
    await db.collection('auditLogs').add({
      action: 'verification_task_approved',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: taskId,
      targetType: 'verificationTask',
      metadata: { adminNotes: adminNotes || null },
      createdAt: nowIso(),
    });
    logger.info(`Verification task ${taskId} approved by ${req.user!.id}`);
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error('admin/verification/approve', err);
    const errorObj = err as { message?: string };
    const status = errorObj?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: errorObj?.message || 'Failed to approve verification' });
  }
});

/** POST /api/admin/verification/tasks/:id/reject */
adminRouter.post('/admin/verification/tasks/:id/reject', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  const { rejectionReason, adminNotes } = req.body || {};
  if (!rejectionReason || typeof rejectionReason !== 'string') {
    return res.status(400).json({ error: 'rejectionReason is required' });
  }
  try {
    await verificationService.rejectTask(taskId, req.user!.id, rejectionReason, adminNotes);
    await db.collection('auditLogs').add({
      action: 'verification_task_rejected',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: taskId,
      targetType: 'verificationTask',
      metadata: { rejectionReason, adminNotes: adminNotes || null },
      createdAt: nowIso(),
    });
    logger.info(`Verification task ${taskId} rejected by ${req.user!.id}`);
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error('admin/verification/reject', err);
    const errorObj = err as { message?: string };
    const status = errorObj?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: errorObj?.message || 'Failed to reject verification' });
  }
});

/** POST /api/admin/verification/tasks/:id/request-info */
adminRouter.post('/admin/verification/tasks/:id/request-info', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  const { requestMessage } = req.body || {};
  if (!requestMessage || typeof requestMessage !== 'string') {
    return res.status(400).json({ error: 'requestMessage is required' });
  }
  try {
    await verificationService.requestMoreInfo(taskId, req.user!.id, requestMessage);
    await db.collection('auditLogs').add({
      action: 'verification_task_requested_info',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: taskId,
      targetType: 'verificationTask',
      metadata: { requestMessage },
      createdAt: nowIso(),
    });
    logger.info(`Verification task ${taskId} requested more info by ${req.user!.id}`);
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error('admin/verification/request-info', err);
    const errorObj = err as { message?: string };
    const status = errorObj?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: errorObj?.message || 'Failed to request more info' });
  }
});

/** POST /api/admin/verification/tasks/:id/assign */
adminRouter.post('/admin/verification/tasks/:id/assign', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  const { adminId } = req.body || {};
  if (!adminId) return res.status(400).json({ error: 'adminId is required' });
  try {
    await verificationService.assignTask(taskId, adminId);
    await db.collection('auditLogs').add({
      action: 'verification_task_assigned',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: taskId,
      targetType: 'verificationTask',
      metadata: { assignedTo: adminId },
      createdAt: nowIso(),
    });
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error('admin/verification/assign', err);
    const errorObj = err as { message?: string };
    const status = errorObj?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: errorObj?.message || 'Failed to assign verification task' });
  }
});

/** PUT /api/admin/verification/tasks/:id/checklist */
adminRouter.put('/admin/verification/tasks/:id/checklist', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const taskId = (req.params['id'] as string) || '';
  if (!taskId) return res.status(400).json({ error: 'Task id required' });
  const { checklist } = req.body || {};
  if (!Array.isArray(checklist)) {
    return res.status(400).json({ error: 'checklist array is required' });
  }
  try {
    await verificationService.updateTask(taskId, { checklist });
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error('admin/verification/checklist', err);
    const errorObj = err as { message?: string };
    const status = errorObj?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: errorObj?.message || 'Failed to update checklist' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Host Pages (unified Create a Page — admin moderation)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/admin/host-pages/:id — fetch page for verification review */
adminRouter.get('/admin/host-pages/:id', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const pageId = (req.params['id'] as string) || '';
  if (!pageId) return res.status(400).json({ error: 'Page id required' });
  try {
    const page = await hostPageService.getById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    return res.json(page);
  } catch (err) {
    logger.error('admin/host-pages/get', err);
    return res.status(500).json({ error: 'Failed to fetch host page' });
  }
});

/** POST /api/admin/host-pages/:id/block */
adminRouter.post('/admin/host-pages/:id/block', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const pageId = (req.params['id'] as string) || '';
  const { reason } = req.body || {};
  if (!pageId) return res.status(400).json({ error: 'Page id required' });
  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'reason is required' });
  }
  try {
    const page = await hostPageService.blockPage(pageId, req.user!.id, reason);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    await db.collection('auditLogs').add({
      action: 'host_page_blocked',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: pageId,
      targetType: 'hostPage',
      metadata: { reason },
      createdAt: nowIso(),
    });
    return res.json({ ok: true, page });
  } catch (err) {
    logger.error('admin/host-pages/block', err);
    return res.status(500).json({ error: 'Failed to block host page' });
  }
});

/** POST /api/admin/host-pages/:id/unblock */
adminRouter.post('/admin/host-pages/:id/unblock', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const pageId = (req.params['id'] as string) || '';
  if (!pageId) return res.status(400).json({ error: 'Page id required' });
  try {
    const page = await hostPageService.unblockPage(pageId, req.user!.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    await db.collection('auditLogs').add({
      action: 'host_page_unblocked',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: pageId,
      targetType: 'hostPage',
      metadata: {},
      createdAt: nowIso(),
    });
    return res.json({ ok: true, page });
  } catch (err) {
    logger.error('admin/host-pages/unblock', err);
    return res.status(500).json({ error: 'Failed to unblock host page' });
  }
});

/**
 * POST /api/admin/profiles/:id/block
 * Block (suspend) a profile.
 */
adminRouter.post('/admin/profiles/:id/block', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawProfileId = req.params.id;
  const profileId = Array.isArray(rawProfileId) ? rawProfileId[0] : rawProfileId;
  if (!profileId) return res.status(400).json({ error: 'Profile id required' });
  try {
    const existing = await profilesService.getById(profileId);
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const updated = await profilesService.update(profileId, {
      status: 'suspended',
    });
    await db.collection('auditLogs').add({
      action: 'profile_blocked',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: profileId,
      targetType: 'profile',
      metadata: { previousStatus: existing.status || null },
      createdAt: nowIso(),
    });
    logger.info(`Profile ${profileId} suspended/blocked by ${req.user!.id}`);
    return res.json({ ok: true, profile: updated });
  } catch (err: unknown) {
    logger.error('admin/profiles/block', err);
    const errorObj = err as { message?: string };
    return res.status(500).json({ error: errorObj?.message || 'Failed to block profile' });
  }
});

/**
 * POST /api/admin/profiles/:id/unblock
 * Unblock (unsuspend) a profile.
 */
adminRouter.post('/admin/profiles/:id/unblock', async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore unavailable' });
  const rawProfileId = req.params.id;
  const profileId = Array.isArray(rawProfileId) ? rawProfileId[0] : rawProfileId;
  if (!profileId) return res.status(400).json({ error: 'Profile id required' });
  try {
    const existing = await profilesService.getById(profileId);
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const updated = await profilesService.update(profileId, {
      status: 'published',
    });
    await db.collection('auditLogs').add({
      action: 'profile_unblocked',
      userId: req.user!.id,
      userName: req.user!.username || req.user!.id,
      targetId: profileId,
      targetType: 'profile',
      metadata: { previousStatus: existing.status || null },
      createdAt: nowIso(),
    });
    logger.info(`Profile ${profileId} unsuspended/unblocked by ${req.user!.id}`);
    return res.json({ ok: true, profile: updated });
  } catch (err: unknown) {
    logger.error('admin/profiles/unblock', err);
    const errorObj = err as { message?: string };
    return res.status(500).json({ error: errorObj?.message || 'Failed to unblock profile' });
  }
});
