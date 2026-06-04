import { createHash } from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { db, authAdmin } from '../admin';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { getRolloutConfig, isFeatureEnabledForUser } from '../services/rollout';
import { adminService } from '../services/admin';
import { usersService } from '../services/firestore';
import { getActiveCommunityHomeBanner } from '../services/communityHomeBanner';

export const miscRouter = Router();

const mediaAttachSchema = z.object({
  targetType: z.enum(['user', 'profile', 'event', 'business', 'post']),
  targetId: z.string().min(1),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

const reportCreateSchema = z.object({
  targetType: z.enum(['event', 'community', 'profile', 'post', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(1),
  details: z.string().optional(),
});

const cultureXSubscribeSchema = z.object({
  email: z.string().email().max(254),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
});

const CULTUREX_EXPLORES_CULTURE_TAG = 'culturex-explores';

type AdminReportStatus = 'pending' | 'resolved' | 'dismissed';

async function safeCollectionCount(path: string, where?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }) {
  try {
    const base = db.collection(path);
    const query = where ? base.where(where.field, where.op, where.value) : base;
    const snap = await query.count().get();
    return snap.data().count ?? 0;
  } catch {
    return 0;
  }
}

function toIso(value: unknown): string {
  if (!value) return nowIso();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in (value as Record<string, unknown>)) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return d.toISOString();
    } catch {
      return nowIso();
    }
  }
  return nowIso();
}

function hasCultureXSignal(data: FirebaseFirestore.DocumentData): boolean {
  const values = [
    data.cultureTag,
    data.cultureTags,
    data.tags,
    data.searchTags,
  ].flatMap((value) => Array.isArray(value) ? value : [value]);
  return values.some((value) => String(value ?? '').trim().toLowerCase() === CULTUREX_EXPLORES_CULTURE_TAG);
}

/** POST /api/media/attach — attach media to an entity */
miscRouter.post('/media/attach', requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = parseBody(mediaAttachSchema, req.body);
    const ref = db.collection('media').doc();
    const thumbnailUrl = payload.thumbnailUrl ?? payload.imageUrl;
    const media = { ...payload, thumbnailUrl, id: ref.id, uploadedBy: req.user!.id, createdAt: nowIso() };
    await ref.set(media);
    return res.status(201).json(media);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to attach media' });
  }
});

/** GET /api/media/:targetType/:targetId — list media for target */
miscRouter.get('/media/:targetType/:targetId', async (req: Request, res: Response) => {
  const targetType = String(req.params.targetType ?? '');
  const targetId = String(req.params.targetId ?? '');
  try {
    const snap = await db.collection('media')
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/** GET /api/media/base64 — proxy a remote image URL to base64 data URL */
miscRouter.get('/media/base64', requireAuth, async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).json({ error: 'url parameter is required' });
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'CulturePass-Base64Proxy/1.0',
      },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Requested URL is not an image' });
    }

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return res.json({ dataUrl: `data:${contentType};base64,${base64}` });
  } catch (err: any) {
    captureRouteError(err, 'GET /media/base64');
    return res.status(500).json({ error: 'Failed to fetch remote image' });
  }
});

/** POST /api/reports — submit a content report */
miscRouter.post('/reports', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const payload = parseBody(reportCreateSchema, req.body);
    const ref = db.collection('reports').doc();
    const report = { ...payload, id: ref.id, reporterUserId: req.user!.id, status: 'pending', createdAt: nowIso() };
    await ref.set(report);
    return res.status(201).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit report' });
  }
});

/** GET /api/privacy/settings/:userId — get privacy settings */
miscRouter.get('/privacy/settings/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const snap = await db.collection('privacySettings').doc(userId).get();
    if (!snap.exists) return res.json({ profileVisible: true, searchable: true });
    return res.json(snap.data());
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

/** PUT /api/privacy/settings/:userId — update privacy settings */
miscRouter.put('/privacy/settings/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const updates = req.body ?? {};
    await db.collection('privacySettings').doc(userId).set(updates, { merge: true });
    const snap = await db.collection('privacySettings').doc(userId).get();
    return res.json(snap.data());
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/** DELETE /api/account/:userId — delete account and all data */
miscRouter.delete('/account/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });

  // Prevent admins from self-deleting their accounts (per product requirement)
  if (req.user!.id === userId) {
    const requesterRole = req.user!.role || 'user';
    const ADMIN_ROLES = ['admin', 'platformAdmin', 'superAdmin'];
    if (ADMIN_ROLES.includes(requesterRole)) {
      return res.status(403).json({ 
        error: 'Administrator accounts cannot be deleted through self-service. Please contact platform support.' 
      });
    }
  }
  
  try {
    // 1. Delete from Firebase Auth
    await authAdmin.deleteUser(userId);
    
    // 2. Recursive delete from Firestore
    await db.recursiveDelete(db.collection('users').doc(userId));
    
    return res.json({ ok: true, userId });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/account/:userId');
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

const emailChangeSchema = z.object({
  newEmail: z.string().email().max(254),
});

/** POST /api/account/email-change — secure server-side step for email change */
miscRouter.post('/account/email-change', requireAuth, async (req: Request, res: Response) => {
  try {
    const { newEmail } = parseBody(emailChangeSchema, req.body);
    const normalized = newEmail.toLowerCase().trim();
    const userId = req.user!.id;

    // Defense-in-depth uniqueness check on the server
    const existing = await db.collection('users').where('email', '==', normalized).limit(1).get();
    if (!existing.empty && existing.docs[0].id !== userId) {
      return res.status(409).json({ error: 'Email address is already in use by another account' });
    }

    await db.collection('users').doc(userId).update({
      email: normalized,
      updatedAt: nowIso(),
    });

    return res.json({ ok: true, email: normalized });
  } catch (err: any) {
    captureRouteError(err, 'POST /api/account/email-change');
    if (err.name === 'RequestValidationError' || err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    return res.status(500).json({ error: 'Failed to complete email change' });
  }
});

/** GET /api/account/username-available — fast availability check for live username editing */
miscRouter.get('/account/username-available', requireAuth, async (req: Request, res: Response) => {
  try {
    const raw = String(req.query.username ?? '').trim();
    const normalized = raw.toLowerCase().replace(/^@/, '');

    if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(normalized)) {
      return res.json({ available: false, normalized });
    }

    const snap = await db.collection('users').where('username', '==', normalized).limit(1).get();
    const available = snap.empty;

    return res.json({ available, normalized });
  } catch (err) {
    captureRouteError(err, 'GET /api/account/username-available');
    return res.status(500).json({ available: false, normalized: '' });
  }
});

/** GET /api/rollout/config — get rollout phase configuration for a user */
miscRouter.get('/rollout/config', (req: Request, res: Response) => {
  const userId = String(req.query.userId ?? 'guest');
  const config = getRolloutConfig();
  const features: Record<string, boolean> = {};
  for (const key of ['discovery', 'perks', 'council', 'calendar', 'scanner']) {
    features[key] = isFeatureEnabledForUser(key, userId);
  }
  return res.json({ ...config, userId, features });
});

/**
 * POST /api/culture-x/subscribe
 * Opt-in for CultureX invitation / heads-up emails (marketing / product updates).
 * Idempotent per email (upsert). Optional auth attaches userId.
 */
miscRouter.post('/culture-x/subscribe', async (req: Request, res: Response) => {
  try {
    const payload = parseBody(cultureXSubscribeSchema, req.body);
    const email = payload.email.trim().toLowerCase();
    const docId = createHash('sha256').update(email).digest('hex');
    await db
      .collection('cultureXSubscribers')
      .doc(docId)
      .set(
        {
          email,
          city: payload.city?.trim() || null,
          country: payload.country?.trim() || null,
          userId: req.user?.id ?? null,
          source: 'culturex_tab',
          updatedAt: nowIso(),
        },
        { merge: true },
      );
    if (req.user?.id) {
      let suggestedEvents: { id: string; title: string }[] = [];
      try {
        let query: FirebaseFirestore.Query = db.collection('events').limit(30);
        if (payload.city?.trim()) {
          query = db.collection('events').where('city', '==', payload.city.trim()).limit(30);
        }
        const snap = await query.get();
        suggestedEvents = snap.docs
          .map((doc) => ({ id: doc.id, data: doc.data() }))
          .filter(({ data }) => !data.deletedAt && hasCultureXSignal(data))
          .slice(0, 3)
          .map(({ id, data }) => ({ id, title: String(data.title ?? 'CultureX event') }));
      } catch {
        suggestedEvents = [];
      }
      const first = suggestedEvents[0];
      const extraCount = Math.max(0, suggestedEvents.length - 1);
      const recommendationMessage = first
        ? `${first.title}${extraCount > 0 ? ` and ${extraCount} more ${extraCount === 1 ? 'pick' : 'picks'} are ready.` : ' is ready.'}`
        : 'You are subscribed. We will send cultural event and community recommendations as new matches appear.';
      await db.collection('notifications').add({
        userId: req.user.id,
        title: first ? 'CultureX has events for you' : 'CultureX invites are on',
        message: recommendationMessage,
        type: 'recommendation',
        entityType: first ? 'event' : undefined,
        entityId: first?.id,
        actionUrl: first ? `/event/${first.id}` : '/CultureX',
        isRead: false,
        createdAt: nowIso(),
        metadata: {
          source: 'culturex_subscribe',
          city: payload.city?.trim() || null,
          country: payload.country?.trim() || null,
          suggestedEvents,
        },
      });
    }
    return res.status(201).json({ ok: true });
  } catch (err: unknown) {
    captureRouteError(err, 'POST /api/culture-x/subscribe');
    const message = err instanceof Error ? err.message : 'Subscribe failed';
    const validation =
      /invalid|required|email|Invalid/i.test(message) && !/Firestore|network|internal/i.test(message);
    return res.status(validation ? 400 : 500).json({
      error: validation ? message : 'Could not subscribe right now.',
    });
  }
});

/** GET /api/community-home-banner — active Discover community-home banner (public) */
miscRouter.get('/community-home-banner', async (_req: Request, res: Response) => {
  try {
    const banner = await getActiveCommunityHomeBanner();
    return res.json({ banner });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/community-home-banner');
    return res.status(500).json({ error: 'Failed to load community home banner' });
  }
});

/** GET /api/cpid/lookup/:cpid — lookup entity by CulturePass ID */
miscRouter.get('/cpid/lookup/:cpid', async (req: Request, res: Response) => {
  const cpid = String(req.params.cpid ?? '').toUpperCase();
  try {
    const userSnap = await db.collection('users').where('culturePassId', '==', cpid).limit(1).get();
    if (!userSnap.empty) return res.json({ entityType: 'user', targetId: userSnap.docs[0].id });
    
    const profileSnap = await db.collection('profiles').where('cpid', '==', cpid).limit(1).get();
    if (!profileSnap.empty) return res.json({ entityType: 'profile', targetId: profileSnap.docs[0].id });
    
    return res.status(404).json({ error: 'CPID not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

/** GET /api/admin/stats — aggregate admin dashboard metrics */
miscRouter.get('/admin/stats', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const [usersSnap, eventsSnap, ticketsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('events').count().get(),
      db.collection('tickets').count().get(),
    ]);

    const paidTicketsSnap = await db.collection('tickets').where('paymentStatus', '==', 'paid').get();
    const revenue = paidTicketsSnap.docs.reduce((sum, doc) => {
      const d = doc.data() as Record<string, unknown>;
      const cents = Number(d.totalPriceCents ?? d.priceCents ?? 0);
      return sum + (Number.isFinite(cents) ? cents : 0);
    }, 0);

    return res.json({
      users: usersSnap.data().count ?? 0,
      events: eventsSnap.data().count ?? 0,
      tickets: ticketsSnap.data().count ?? 0,
      revenue,
    });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/stats');
    return res.status(500).json({ error: 'Failed to load admin stats' });
  }
});

/** GET /api/admin/audit-logs — latest admin activity */
miscRouter.get('/admin/audit-logs', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
    try {
      const snap = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(limit).get();
      const logs = snap.docs.map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          action: String(d.action ?? 'updated settings'),
          userId: String(d.userId ?? ''),
          userName: String(d.userName ?? 'System'),
          targetId: d.targetId ? String(d.targetId) : undefined,
          metadata: (d.metadata as Record<string, unknown>) ?? undefined,
          createdAt: toIso(d.createdAt),
        };
      });
      return res.json({ logs });
    } catch (err: any) {
      const isIndexError = err?.code === 9 || /index/i.test(err?.message || '');
      if (isIndexError) {
        captureRouteError(err, 'GET /api/admin/audit-logs (fallback)');
        res.setHeader('X-Query-Mode', 'fallback');
        const snap = await db.collection('auditLogs').limit(limit * 2).get();
        const items = snap.docs.map((doc) => {
          const d = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            action: String(d.action ?? 'updated settings'),
            userId: String(d.userId ?? ''),
            userName: String(d.userName ?? 'System'),
            targetId: d.targetId ? String(d.targetId) : undefined,
            metadata: (d.metadata as Record<string, unknown>) ?? undefined,
            createdAt: toIso(d.createdAt),
          };
        });
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return res.json({ logs: items.slice(0, limit) });
      }
      throw err;
    }
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/audit-logs');
    return res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

/** GET /api/admin/reports — moderation queue */
miscRouter.get('/admin/reports', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin', 'moderator'), async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status ?? 'pending') as AdminReportStatus;
    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 100;
    
    // Validate status parameter
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter. Must be pending, resolved, or dismissed.' });
    }
    
    let query = db.collection('reports').orderBy('createdAt', 'desc').limit(limit);
    if (status === 'pending' || status === 'resolved' || status === 'dismissed') {
      query = query.where('status', '==', status) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
    }
    
    let snap;
    let usedFallback = false;
    try {
      snap = await query.get();
    } catch (queryErr: any) {
      const isIndexError = queryErr?.code === 9 || /index/i.test(queryErr?.message || '');
      if (isIndexError) {
        usedFallback = true;
        res.setHeader('X-Query-Mode', 'fallback');
        // Fallback path: fetch without orderBy and sort in memory
        let fbQuery = db.collection('reports') as FirebaseFirestore.Query;
        if (status === 'pending' || status === 'resolved' || status === 'dismissed') {
          fbQuery = fbQuery.where('status', '==', status);
        }
        const fbSnap = await fbQuery.limit(limit * 2).get();
        const items = fbSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIso(doc.data().createdAt) }));
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return res.json({ reports: items.slice(0, limit) });
      }
      // If the collection doesn't exist yet, or there are permission/initialization issues, return empty array
      if (queryErr instanceof Error) {
        const errorMsg = queryErr.message.toLowerCase();
        if (errorMsg.includes('not_found') || 
            errorMsg.includes('notfound') || 
            errorMsg.includes('collection') && errorMsg.includes('exist') ||
            errorMsg.includes('permission') || 
            errorMsg.includes('unavailable') || 
            errorMsg.includes('initialization') ||
            errorMsg.includes('resource') && errorMsg.includes('not found')) {
          return res.json({ reports: [] });
        }
      }
      // Log the actual error for debugging purposes and return empty array instead of throwing
      console.warn('Warning: Failed to fetch reports collection:', queryErr);
      return res.json({ reports: [] });
    }
    
    const reports = snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIso(doc.data().createdAt) }));
    return res.json({ reports });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/reports');
    return res.status(500).json({ error: 'Failed to load reports' });
  }
});

/** GET /api/admin/reports/:id/context — report plus target/reporter snapshots */
miscRouter.get('/admin/reports/:id/context', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin', 'moderator'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    if (!id) return res.status(400).json({ error: 'Report id is required' });

    const context = await adminService.getReportContext(id);
    if (!context) return res.status(404).json({ error: 'Report not found' });

    return res.json(context);
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/reports/:id/context');
    return res.status(500).json({ error: 'Failed to load report context' });
  }
});

/** POST /api/admin/reports/:id/resolve — resolve moderation item */
miscRouter.post('/admin/reports/:id/resolve', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin', 'moderator'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    if (!id) return res.status(400).json({ error: 'Report id is required' });
    const action = String(req.body?.action ?? 'resolved');
    const normalized =
      action === 'dismissed'
        ? 'dismissed'
        : action === 'keep_content' || action === 'resolved'
          ? 'keep_content'
          : action === 'remove_item'
            ? 'remove_item'
            : action === 'ban_user'
              ? 'ban_user'
              : 'keep_content';

    await adminService.resolveReport(id, req.user?.id ?? 'system', normalized);

    await adminService.logAction({
      action: 'resolve_report',
      userId: req.user?.id ?? '',
      userName: String(req.user?.email ?? req.user?.id ?? 'admin'),
      targetId: id,
      metadata: { resolutionAction: normalized },
    });

    const nextStatus: AdminReportStatus = normalized === 'dismissed' ? 'dismissed' : 'resolved';
    return res.json({ ok: true, status: nextStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Report not found')) {
      return res.status(404).json({ error: 'Report not found' });
    }
    captureRouteError(err, 'POST /api/admin/reports/:id/resolve');
    return res.status(500).json({ error: 'Failed to resolve report' });
  }
});

const ADMIN_USER_PATCH = z.object({
  role: z
    .enum(['user', 'organizer', 'business', 'sponsor', 'cityAdmin', 'moderator', 'admin', 'platformAdmin'])
    .optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

/** PATCH /api/admin/users/:id — role / account status (admin console) */
miscRouter.patch(
  '/admin/users/:id',
  requireAuth,
  requireRole('admin', 'superAdmin', 'platformAdmin'),
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id ?? '').trim();
      if (!userId) return res.status(400).json({ error: 'user id required' });

      const parsed = ADMIN_USER_PATCH.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid body', detail: parsed.error.flatten() });
      }
      const { role, status } = parsed.data;
      if (!role && status === undefined) {
        return res.status(400).json({ error: 'role and/or status required' });
      }

      if (userId === req.user?.id) {
        return res.status(400).json({ error: 'Cannot modify your own account from the console' });
      }

      const target = await usersService.getById(userId);
      if (!target) return res.status(404).json({ error: 'User not found' });

      if (role === 'platformAdmin' && req.user?.role !== 'platformAdmin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updates: Record<string, unknown> = { updatedAt: nowIso() };
      if (status === 'active') {
        updates.status = 'active';
      } else if (status === 'suspended') {
        updates.status = 'suspended';
      }
      if (role) {
        updates.role = role;
      }

      await usersService.update(userId, updates as Parameters<typeof usersService.update>[1]);

      if (role) {
        try {
          const rec = await authAdmin.getUser(userId);
          const claims = { ...(rec.customClaims ?? {}), role };
          await authAdmin.setCustomUserClaims(userId, claims);
        } catch (e) {
          captureRouteError(e, 'PATCH /api/admin/users/:id claims');
        }
      }

      if (status === 'suspended') {
        try {
          await authAdmin.revokeRefreshTokens(userId);
        } catch (e) {
          captureRouteError(e, 'PATCH /api/admin/users/:id revoke');
        }
      }

      await adminService.logAction({
        action: 'admin_user_updated',
        userId: req.user?.id ?? '',
        userName: String(req.user?.email ?? req.user?.id ?? 'admin'),
        targetId: userId,
        metadata: { role, status },
      });

      return res.json({ ok: true });
    } catch (err: unknown) {
      captureRouteError(err, 'PATCH /api/admin/users/:id');
      return res.status(500).json({ error: 'Failed to update user' });
    }
  },
);

/** GET /api/admin/finance/transactions — recent paid/refunded tickets */
miscRouter.get('/admin/finance/transactions', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query.limit ?? 40);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 40;
    const snap = await db.collection('tickets').orderBy('createdAt', 'desc').limit(limit).get();
    const transactions = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const cents = Number(d.totalPriceCents ?? d.priceCents ?? 0);
      return {
        id: doc.id,
        userId: String(d.userId ?? ''),
        eventId: String(d.eventId ?? ''),
        eventTitle: String(d.eventTitle ?? 'Event'),
        amountCents: Number.isFinite(cents) ? cents : 0,
        paymentStatus: String(d.paymentStatus ?? 'unknown'),
        status: String(d.status ?? 'unknown'),
        createdAt: toIso(d.createdAt),
      };
    });
    return res.json({ transactions });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/finance/transactions');
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
});

/** GET /api/admin/platform/config — control panel settings */
miscRouter.get('/admin/platform/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const configSnap = await db.collection('admin').doc('platformConfig').get();
    const defaults = {
      maintenanceMode: false,
      readOnlyMode: false,
      feeBps: 1000,
      minimumPayoutThresholdCents: 5000,
    };
    const config = configSnap.exists ? { ...defaults, ...(configSnap.data() ?? {}) } : defaults;
    return res.json(config);
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/platform/config');
    return res.status(500).json({ error: 'Failed to load platform config' });
  }
});

/** GET /api/admin/system/health — operational heartbeat for admin dashboard */
miscRouter.get('/admin/system/health', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const [pendingReports, pendingHostApps, auditEntries24h] = await Promise.all([
      safeCollectionCount('reports', { field: 'status', op: '==', value: 'pending' }),
      safeCollectionCount('hostApplications', { field: 'status', op: '==', value: 'pending' }),
      (async () => {
        try {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const snap = await db.collection('auditLogs').where('createdAt', '>=', since).limit(500).get();
          return snap.size;
        } catch {
          return 0;
        }
      })(),
    ]);

    const checks = [
      {
        id: 'firestore',
        name: 'Firestore',
        status: 'operational',
        healthy: true,
        detail: 'Primary datastore reachable',
      },
      {
        id: 'moderation',
        name: 'Moderation Queue',
        status: pendingReports > 50 ? 'degraded' : 'operational',
        healthy: pendingReports <= 50,
        metric: pendingReports,
        detail: `${pendingReports} pending report${pendingReports === 1 ? '' : 's'}`,
      },
      {
        id: 'hostApplications',
        name: 'Host Applications',
        status: pendingHostApps > 100 ? 'degraded' : 'operational',
        healthy: pendingHostApps <= 100,
        metric: pendingHostApps,
        detail: `${pendingHostApps} application${pendingHostApps === 1 ? '' : 's'} awaiting review`,
      },
      {
        id: 'audit',
        name: 'Audit Logging',
        status: 'operational',
        healthy: true,
        metric: auditEntries24h,
        detail: `${auditEntries24h} entries in the past 24h`,
      },
    ] as const;

    return res.json({
      generatedAt: new Date().toISOString(),
      checks,
    });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/system/health');
    return res.status(500).json({ error: 'Failed to load system health' });
  }
});

/** GET /api/admin/compliance/summary — compliance dashboard aggregates */
miscRouter.get('/admin/compliance/summary', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const [pendingReports, resolvedReports, auditLogs] = await Promise.all([
      safeCollectionCount('reports', { field: 'status', op: '==', value: 'pending' }),
      safeCollectionCount('reports', { field: 'status', op: '==', value: 'resolved' }),
      safeCollectionCount('auditLogs'),
    ]);

    const requests = [
      {
        id: 'pending-report-queue',
        user: 'Moderation Queue',
        type: 'Pending Reports',
        status: pendingReports > 0 ? 'Pending' : 'Clear',
        date: new Date().toISOString().slice(0, 10),
        count: pendingReports,
      },
      {
        id: 'resolved-report-actions',
        user: 'Moderation Queue',
        type: 'Resolved Reports',
        status: 'Processed',
        date: new Date().toISOString().slice(0, 10),
        count: resolvedReports,
      },
      {
        id: 'audit-log-volume',
        user: 'System',
        type: 'Audit Entries',
        status: 'Tracked',
        date: new Date().toISOString().slice(0, 10),
        count: auditLogs,
      },
    ];

    return res.json({
      pendingReports,
      resolvedReports,
      auditLogs,
      requests,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/compliance/summary');
    return res.status(500).json({ error: 'Failed to load compliance summary' });
  }
});

/** PUT /api/admin/platform/config — update control panel settings */
miscRouter.put('/admin/platform/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const updates = req.body ?? {};
    const payload: Record<string, unknown> = {};
    if (typeof updates.maintenanceMode === 'boolean') payload.maintenanceMode = updates.maintenanceMode;
    if (typeof updates.readOnlyMode === 'boolean') payload.readOnlyMode = updates.readOnlyMode;
    if (Number.isFinite(Number(updates.feeBps))) payload.feeBps = Math.max(0, Math.floor(Number(updates.feeBps)));
    if (Number.isFinite(Number(updates.minimumPayoutThresholdCents))) {
      payload.minimumPayoutThresholdCents = Math.max(0, Math.floor(Number(updates.minimumPayoutThresholdCents)));
    }
    payload.updatedAt = nowIso();
    payload.updatedBy = req.user?.id ?? null;
    await db.collection('admin').doc('platformConfig').set(payload, { merge: true });

    const actorName = String(req.user?.id ?? 'admin');
    await db.collection('auditLogs').add({
      action: 'platform_config_updated',
      userId: req.user?.id ?? '',
      userName: actorName,
      metadata: payload,
      createdAt: nowIso(),
    });

    return res.json({ ok: true });
  } catch (err: unknown) {
    captureRouteError(err, 'PUT /api/admin/platform/config');
    return res.status(500).json({ error: 'Failed to update platform config' });
  }
});

/** GET /api/admin/finance/config — financial controls for admin finance screen */
miscRouter.get('/admin/finance/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('admin').doc('financeConfig').get();
    const defaults = {
      feeBps: 1000,
      minimumPayoutThresholdCents: 5000,
      reserveRateBps: 300,
      autoPayoutsEnabled: true,
    };
    const config = snap.exists ? { ...defaults, ...(snap.data() ?? {}) } : defaults;
    return res.json(config);
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/finance/config');
    return res.status(500).json({ error: 'Failed to load finance config' });
  }
});

/** PUT /api/admin/finance/config — update financial controls */
miscRouter.put('/admin/finance/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const payload: Record<string, unknown> = {
      updatedAt: nowIso(),
      updatedBy: req.user?.id ?? null,
    };
    if (Number.isFinite(Number(body.feeBps))) payload.feeBps = Math.max(0, Math.floor(Number(body.feeBps)));
    if (Number.isFinite(Number(body.minimumPayoutThresholdCents))) {
      payload.minimumPayoutThresholdCents = Math.max(0, Math.floor(Number(body.minimumPayoutThresholdCents)));
    }
    if (Number.isFinite(Number(body.reserveRateBps))) payload.reserveRateBps = Math.max(0, Math.floor(Number(body.reserveRateBps)));
    if (typeof body.autoPayoutsEnabled === 'boolean') payload.autoPayoutsEnabled = body.autoPayoutsEnabled;
    await db.collection('admin').doc('financeConfig').set(payload, { merge: true });
    await db.collection('auditLogs').add({
      action: 'finance_config_updated',
      userId: req.user?.id ?? '',
      userName: String(req.user?.id ?? 'admin'),
      metadata: payload,
      createdAt: nowIso(),
    });
    return res.json({ ok: true });
  } catch (err: unknown) {
    captureRouteError(err, 'PUT /api/admin/finance/config');
    return res.status(500).json({ error: 'Failed to update finance config' });
  }
});

/** GET /api/admin/discovery/config — discover and curation settings */
miscRouter.get('/admin/discovery/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('admin').doc('discoveryConfig').get();
    const defaults = {
      trendingMultiplier: 1.2,
      socialProofGate: 5,
      featuredCityIds: [] as string[],
      heroSlides: [] as { id: string; title: string; city: string; status: 'active' | 'scheduled' | 'paused'; image: string }[],
    };
    const config = snap.exists ? { ...defaults, ...(snap.data() ?? {}) } : defaults;
    return res.json(config);
  } catch (err: unknown) {
    captureRouteError(err, 'GET /api/admin/discovery/config');
    return res.status(500).json({ error: 'Failed to load discovery config' });
  }
});

/** PUT /api/admin/discovery/config — update discover curation settings */
miscRouter.put('/admin/discovery/config', requireAuth, requireRole('admin', 'superAdmin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const payload: Record<string, unknown> = {
      updatedAt: nowIso(),
      updatedBy: req.user?.id ?? null,
    };
    if (Number.isFinite(Number(body.trendingMultiplier))) {
      payload.trendingMultiplier = Math.max(0, Math.min(5, Number(body.trendingMultiplier)));
    }
    if (Number.isFinite(Number(body.socialProofGate))) payload.socialProofGate = Math.max(0, Math.floor(Number(body.socialProofGate)));
    if (Array.isArray(body.featuredCityIds)) payload.featuredCityIds = body.featuredCityIds.filter((x: unknown) => typeof x === 'string');
    if (Array.isArray(body.heroSlides)) payload.heroSlides = body.heroSlides;
    await db.collection('admin').doc('discoveryConfig').set(payload, { merge: true });
    await db.collection('auditLogs').add({
      action: 'discovery_config_updated',
      userId: req.user?.id ?? '',
      userName: String(req.user?.id ?? 'admin'),
      metadata: payload,
      createdAt: nowIso(),
    });
    return res.json({ ok: true });
  } catch (err: unknown) {
    captureRouteError(err, 'PUT /api/admin/discovery/config');
    return res.status(500).json({ error: 'Failed to update discovery config' });
  }
});
