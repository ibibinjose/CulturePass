import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, isAdminUser } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { randomUUID } from 'node:crypto';
import { sendToUsers } from '../services/fcmService';

export const socialRouter = Router();

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return typeof v === 'string' ? v : '';
}

function userMini(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    displayName: (data.displayName as string | undefined) ?? (data.username as string | undefined) ?? 'Member',
    username: (data.username as string | undefined) ?? null,
    handle: (data.handle as string | undefined) ?? (data.username as string | undefined) ?? null,
    avatarUrl: (data.avatarUrl as string | undefined) ?? null,
    city: (data.city as string | undefined) ?? null,
    country: (data.country as string | undefined) ?? null,
  };
}

async function fetchUsersByIds(ids: string[]): Promise<Map<string, FirebaseFirestore.DocumentData>> {
  const unique = [...new Set(ids)].filter(Boolean);
  const out = new Map<string, FirebaseFirestore.DocumentData>();
  const chunkSize = 30;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const snaps = await db.getAll(...chunk.map((id) => db.collection('users').doc(id)));
    for (const s of snaps) {
      if (s.exists) out.set(s.id, s.data()!);
    }
  }
  return out;
}

async function bumpUserFollowCounts(followerId: string, followedId: string, delta: 1 | -1) {
  const batch = db.batch();
  batch.set(
    db.collection('users').doc(followedId),
    { followersCount: FieldValue.increment(delta) },
    { merge: true },
  );
  batch.set(
    db.collection('users').doc(followerId),
    { followingCount: FieldValue.increment(delta) },
    { merge: true },
  );
  await batch.commit();
}

function followDocId(userId: string, targetType: string, targetId: string): string {
  return `${userId}_${targetType}_${targetId}`;
}

// Normalize Firestore doc (uses isRead) to client schema (uses read).
function normalizeNotif(id: string, data: FirebaseFirestore.DocumentData) {
  const { isRead, ...rest } = data;
  return { id, ...rest, read: isRead ?? false };
}

/** GET /api/notifications — list for current user, newest first */
socialRouter.get('/notifications', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const limit  = Math.min(Number(req.query.limit ?? 80), 200);
  if (!isFirestoreConfigured) return res.json([]);
  try {
    const snap = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return res.json(snap.docs.map(d => normalizeNotif(d.id, d.data())));
  } catch (err) {
    captureRouteError(err, 'GET /api/notifications');
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/** GET /api/notifications/unread-count */
socialRouter.get('/notifications/unread-count', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) return res.json({ count: 0 });
  try {
    const snap = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
    return res.json({ count: snap.size });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/** PUT /api/notifications/:id/read — mark single notification as read */
socialRouter.put('/notifications/:id/read', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  let { id } = req.params;
  if (Array.isArray(id)) id = id[0];
  if (!isFirestoreConfigured) return res.json({ success: true });
  try {
    const ref  = db.collection('notifications').doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await ref.update({ isRead: true });
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'PUT /api/notifications/:id/read');
    return res.status(500).json({ error: 'Failed to mark read' });
  }
});

/** POST /api/notifications/mark-all-read */
socialRouter.post('/notifications/mark-all-read', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) return res.json({ success: true });
  try {
    const snap  = await db.collection('notifications').where('userId', '==', userId).where('isRead', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'POST /notifications/mark-all-read');
    return res.status(500).json({ error: 'Failed to mark all read' });
  }
});

/** DELETE /api/notifications/:id — delete a single notification */
socialRouter.delete('/notifications/:id', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  let { id } = req.params;
  if (Array.isArray(id)) id = id[0];
  if (!isFirestoreConfigured) return res.json({ success: true });
  try {
    const ref  = db.collection('notifications').doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await ref.delete();
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/notifications/:id');
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/** DELETE /api/notifications — clear ALL notifications for current user */
socialRouter.delete('/notifications', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) return res.json({ success: true, deleted: 0 });
  try {
    const snap  = await db.collection('notifications').where('userId', '==', userId).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return res.json({ success: true, deleted: snap.size });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/notifications');
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

/** POST /api/notifications/register-token — register Expo push token */
socialRouter.post('/notifications/register-token', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token) return res.status(400).json({ error: 'token required' });
  if (isFirestoreConfigured) {
    await db.collection('pushTokens').doc(`${userId}_${platform ?? 'unknown'}`).set(
      { userId, token, platform: platform ?? 'unknown', updatedAt: nowIso() },
      { merge: true },
    );
  }
  return res.json({ ok: true });
});

/** GET /api/notifications/preferences — user notification preference categories */
socialRouter.get('/notifications/preferences', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) {
    return res.json({
      categories: {
        events: true,
        communities: true,
        perks: true,
        updates: true,
      },
    });
  }
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    const prefs = (userSnap.data()?.notificationPreferences ??
      {}) as { categories?: Record<string, boolean> };
    return res.json({
      categories: {
        events: prefs.categories?.events ?? true,
        communities: prefs.categories?.communities ?? true,
        perks: prefs.categories?.perks ?? true,
        updates: prefs.categories?.updates ?? true,
      },
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/notifications/preferences');
    return res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

/** PUT /api/notifications/preferences — persist user category preferences */
socialRouter.put('/notifications/preferences', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const schema = z.object({
    categories: z
      .object({
        events: z.boolean().optional(),
        communities: z.boolean().optional(),
        perks: z.boolean().optional(),
        updates: z.boolean().optional(),
      })
      .optional(),
  });

  try {
    const body = parseBody(schema, req.body);
    if (!isFirestoreConfigured) return res.json({ ok: true });
    await db
      .collection('users')
      .doc(userId)
      .set(
        {
          notificationPreferences: {
            categories: {
              events: body.categories?.events ?? true,
              communities: body.categories?.communities ?? true,
              perks: body.categories?.perks ?? true,
              updates: body.categories?.updates ?? true,
            },
          },
          updatedAt: nowIso(),
        },
        { merge: true },
      );
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PUT /api/notifications/preferences');
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update preferences' });
  }
});

/**
 * POST /api/notifications/targeted — send targeted FCM push notifications (admin only).
 * Used by the digest trigger and admin broadcast UI.
 */
socialRouter.post('/notifications/targeted', requireAuth, async (req, res) => {
  try {
    if (!isAdminUser(req.user!)) return res.status(403).json({ error: 'Forbidden' });
    if (!isFirestoreConfigured) return res.json({ ok: true, targetedCount: 0, dryRun: true });

    const {
      title,
      body: bodyText,
      city,
      country,
      interestsAny,
      communitiesAny,
      category = 'events',
      dryRun = false,
      limit: maxUsers = 500,
      deepLink,
    } = req.body ?? {};

    if (!title || !bodyText) return res.status(400).json({ error: 'title and body are required' });

    // Build user query filters
    let query = db.collection('users') as FirebaseFirestore.Query;
    if (city) query = query.where('city', '==', city);
    if (country) query = query.where('country', '==', country);

    const usersSnap = await query.limit(Math.min(Number(maxUsers) || 500, 2000)).get();

    // Filter by opt-in and optional interest/community arrays
    const eligibleIds: string[] = [];
    for (const doc of usersSnap.docs) {
      const u = doc.data();
      if (u.notificationPreferences?.categories?.[category] === false) continue;
      if (interestsAny?.length) {
        const userInterests: string[] = u.interests ?? [];
        if (!interestsAny.some((i: string) => userInterests.includes(i))) continue;
      }
      if (communitiesAny?.length) {
        const userCommunities: string[] = u.communities ?? [];
        if (!communitiesAny.some((c: string) => userCommunities.includes(c))) continue;
      }
      eligibleIds.push(doc.id);
    }

    if (dryRun) {
      return res.json({ dryRun: true, targetedCount: eligibleIds.length, audiencePreview: eligibleIds.slice(0, 5) });
    }

    await sendToUsers(eligibleIds, { title: String(title), body: String(bodyText) }, deepLink ? { deepLink } : undefined);
    return res.json({ ok: true, targetedCount: eligibleIds.length, dryRun: false });
  } catch (err) {
    captureRouteError(err, 'POST /api/notifications/targeted');
    return res.status(500).json({ error: 'Failed to send targeted notifications' });
  }
});

/** POST /api/social/events/:eventId/message-attendees — organizer outreach */
socialRouter.post('/social/events/:eventId/message-attendees', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const eventId = paramStr(req.params.eventId);
  const schema = z.object({
    title: z.string().min(3).max(120),
    message: z.string().min(5).max(600),
    category: z.enum(['events', 'communities', 'perks', 'updates']).default('events'),
    deepLinkPath: z.string().optional(),
  });

  if (!eventId) return res.status(400).json({ error: 'eventId is required' });
  if (!isFirestoreConfigured) return res.json({ ok: true, recipients: 0 });

  try {
    const payload = parseBody(schema, req.body);
    const category = payload.category ?? 'events';
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
    const eventData = eventSnap.data() as { organizerId?: string; title?: string };
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'platformAdmin';
    if (!isAdmin && eventData.organizerId !== userId) {
      return res.status(403).json({ error: 'Only organizers can message attendees for this event' });
    }

    const ticketsSnap = await db.collection('tickets').where('eventId', '==', eventId).limit(1500).get();
    const attendeeIds = [...new Set(
      ticketsSnap.docs
        .map((d) => (d.data() as { userId?: string; status?: string; paymentStatus?: string }))
        .filter((t) => !!t.userId && (t.status === 'paid' || t.paymentStatus === 'paid' || t.status === 'active'))
        .map((t) => t.userId as string),
    )];

    if (attendeeIds.length === 0) return res.json({ ok: true, recipients: 0 });

    const userDocs = await db.getAll(...attendeeIds.map((id) => db.collection('users').doc(id)));
    const allowedAttendeeIds = new Set<string>();
    for (const userDoc of userDocs) {
      if (!userDoc.exists) continue;
      const prefs = userDoc.data()?.notificationPreferences as { categories?: Record<string, boolean> } | undefined;
      const allowed = prefs?.categories?.[category] ?? true;
      if (allowed) allowedAttendeeIds.add(userDoc.id);
    }

    const now = nowIso();
    const batch = db.batch();
    let created = 0;
    for (const attendeeId of attendeeIds) {
      if (!allowedAttendeeIds.has(attendeeId)) continue;
      const ref = db.collection('notifications').doc();
      batch.set(ref, {
        userId: attendeeId,
        title: payload.title,
        message: payload.message,
        type: 'organizer_update',
        isRead: false,
        metadata: {
          eventId,
          eventTitle: eventData.title ?? null,
          deepLinkPath: payload.deepLinkPath ?? `/event/${eventId}`,
          category,
        },
        createdAt: now,
      });
      created += 1;
    }
    if (created > 0) await batch.commit();
    return res.json({ ok: true, recipients: created });
  } catch (err) {
    captureRouteError(err, 'POST /api/social/events/:eventId/message-attendees');
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to message attendees' });
  }
});

/** POST /api/social/follow/:targetType/:targetId — follow a profile/user */
socialRouter.post('/social/follow/:targetType/:targetId', requireAuth, async (req, res) => {
  const targetType = paramStr(req.params.targetType);
  const targetId = paramStr(req.params.targetId);
  const userId = req.user!.id;

  if (targetType === 'user' && targetId === userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  if (isFirestoreConfigured) {
    const followId = followDocId(userId, targetType, targetId);
    const ref = db.collection('follows').doc(followId);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({
        userId,
        targetType,
        targetId,
        createdAt: nowIso(),
      });
      if (targetType === 'user') {
        try {
          await bumpUserFollowCounts(userId, targetId, 1);
        } catch (err) {
          captureRouteError(err, 'POST /api/social/follow bump counts');
        }
      }
    }
  }
  return res.json({ ok: true });
});

/** DELETE /api/social/follow/:targetType/:targetId — unfollow */
socialRouter.delete('/social/follow/:targetType/:targetId', requireAuth, async (req, res) => {
  const targetType = paramStr(req.params.targetType);
  const targetId = paramStr(req.params.targetId);
  const userId = req.user!.id;

  if (isFirestoreConfigured) {
    const ref = db.collection('follows').doc(followDocId(userId, targetType, targetId));
    const legacyRef = db.collection('follows').doc(`${userId}_${targetId}`);
    const [snap, legacySnap] = await Promise.all([ref.get(), legacyRef.get()]);
    if (snap.exists) {
      await ref.delete();
      if (targetType === 'user') {
        try {
          await bumpUserFollowCounts(userId, targetId, -1);
        } catch (err) {
          captureRouteError(err, 'DELETE /api/social/follow bump counts');
        }
      }
    } else if (legacySnap.exists) {
      await legacyRef.delete();
    }
  }
  return res.json({ ok: true });
});

/** GET /api/social/is-following/:targetType/:targetId */
socialRouter.get('/social/is-following/:targetType/:targetId', requireAuth, async (req, res) => {
  const targetType = paramStr(req.params.targetType);
  const targetId = paramStr(req.params.targetId);
  const userId = req.user!.id;
  if (!isFirestoreConfigured) {
    return res.json({ following: false });
  }
  try {
    const [snap, legacySnap] = await Promise.all([
      db.collection('follows').doc(followDocId(userId, targetType, targetId)).get(),
      db.collection('follows').doc(`${userId}_${targetId}`).get(),
    ]);
    if (!snap.exists && !legacySnap.exists) return res.json({ following: false });
    if (!snap.exists && legacySnap.exists) {
      const legacy = legacySnap.data() as { targetType?: string; targetId?: string } | undefined;
      return res.json({ following: legacy?.targetId === targetId && legacy?.targetType === targetType });
    }
    const d = snap.data() as { targetType?: string; targetId?: string } | undefined;
    const following = d?.targetId === targetId && d?.targetType === targetType;
    return res.json({ following });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/is-following');
    return res.status(500).json({ error: 'Failed to check follow state' });
  }
});

/** GET /api/social/following-users — CulturePass users you follow */
socialRouter.get('/social/following-users', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 80), 200);
  if (!isFirestoreConfigured) {
    return res.json({ users: [] });
  }
  try {
    const snap = await db.collection('follows').where('userId', '==', userId).limit(300).get();
    const targetIds = snap.docs
      .map((d) => d.data() as { targetType?: string; targetId?: string })
      .filter((row) => row.targetType === 'user' && typeof row.targetId === 'string')
      .map((row) => row.targetId as string)
      .slice(0, limit);
    const userMap = await fetchUsersByIds(targetIds);
    const users = targetIds
      .map((id) => {
        const data = userMap.get(id);
        return data ? userMini(id, data) : null;
      })
      .filter((u): u is ReturnType<typeof userMini> => u !== null);
    return res.json({ users });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/following-users');
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

/** GET /api/social/followers — users who follow you */
socialRouter.get('/social/followers', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 80), 200);
  if (!isFirestoreConfigured) {
    return res.json({ users: [] });
  }
  try {
    const snap = await db
      .collection('follows')
      .where('targetType', '==', 'user')
      .where('targetId', '==', userId)
      .limit(limit)
      .get();
    const followerIds = snap.docs.map((d) => (d.data() as { userId?: string }).userId).filter(Boolean) as string[];
    const userMap = await fetchUsersByIds(followerIds);
    const users = followerIds
      .map((id) => {
        const data = userMap.get(id);
        return data ? userMini(id, data) : null;
      })
      .filter((u): u is ReturnType<typeof userMini> => u !== null);
    return res.json({ users });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/followers');
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

/** POST /api/social/contact-save — record that you saved another member’s contact (they can see “added you”) */
socialRouter.post('/social/contact-save', requireAuth, async (req, res) => {
  const schema = z.object({ targetUserId: z.string().min(1) });
  const userId = req.user!.id;
  try {
    const { targetUserId } = parseBody(schema, req.body);
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Invalid target' });
    }
    if (isFirestoreConfigured) {
      const id = `${userId}_${targetUserId}`;
      await db.collection('contactSaves').doc(id).set(
        {
          fromUserId: userId,
          toUserId: targetUserId,
          createdAt: nowIso(),
        },
        { merge: true },
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'POST /api/social/contact-save');
    return res.status(err instanceof Error && err.message.includes('Invalid') ? 400 : 500).json({
      error: err instanceof Error ? err.message : 'Failed to save contact signal',
    });
  }
});

/** GET /api/social/contact-inbound — people who saved your contact */
socialRouter.get('/social/contact-inbound', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 40), 100);
  if (!isFirestoreConfigured) {
    return res.json({ items: [] });
  }
  try {
    const snap = await db
      .collection('contactSaves')
      .where('toUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const fromIds = snap.docs.map((d) => (d.data() as { fromUserId?: string }).fromUserId).filter(Boolean) as string[];
    const userMap = await fetchUsersByIds(fromIds);
    const items = snap.docs
      .map((d) => {
        const row = d.data() as { fromUserId?: string; createdAt?: string };
        const fromId = row.fromUserId;
        if (!fromId) return null;
        const data = userMap.get(fromId);
        if (!data) return null;
        return { user: userMini(fromId, data), createdAt: row.createdAt ?? nowIso() };
      })
      .filter((x): x is { user: ReturnType<typeof userMini>; createdAt: string } => x !== null);
    return res.json({ items });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/contact-inbound');
    return res.status(500).json({ error: 'Failed to fetch inbound contacts' });
  }
});

/** GET /api/social/suggestions — members in your city you don’t follow yet */
socialRouter.get('/social/suggestions', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 16), 40);
  if (!isFirestoreConfigured) {
    return res.json({ users: [] });
  }
  try {
    const me = await db.collection('users').doc(userId).get();
    const city = (me.data()?.city as string | undefined)?.trim();
    const country = (me.data()?.country as string | undefined)?.trim();
    if (!city) {
      return res.json({ users: [] });
    }
    const followSnap = await db.collection('follows').where('userId', '==', userId).limit(400).get();
    const followingIds = new Set(
      followSnap.docs
        .map((d) => d.data() as { targetType?: string; targetId?: string })
        .filter((r) => r.targetType === 'user' && r.targetId)
        .map((r) => r.targetId as string),
    );
    followingIds.add(userId);

    const cand = await db.collection('users').where('city', '==', city).limit(80).get();
    const out: ReturnType<typeof userMini>[] = [];
    for (const d of cand.docs) {
      if (out.length >= limit) break;
      if (followingIds.has(d.id)) continue;
      const data = d.data();
      if (country && (data.country as string | undefined)?.trim() && data.country !== country) continue;
      out.push(userMini(d.id, data));
    }
    return res.json({ users: out });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/suggestions');
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/** GET /api/social/following-communities — community profile IDs the user follows */
socialRouter.get('/social/following-communities', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) {
    return res.json({ communityIds: [] });
  }
  try {
    const snap = await db.collection('follows').where('userId', '==', userId).get();
    const communityIds = snap.docs
      .map((d) => d.data() as { targetType?: string; targetId?: string })
      .filter((row) => row.targetType === 'community' && typeof row.targetId === 'string')
      .map((row) => row.targetId as string);
    return res.json({ communityIds });
  } catch (err) {
    captureRouteError(err, 'GET /api/social/following-communities');
    return res.status(500).json({ error: 'Failed to fetch followed communities' });
  }
});

// ---------------------------------------------------------------------------
// Community Posts
// ---------------------------------------------------------------------------

const VALID_COLLECTIONS = ['events', 'communityPosts'] as const;
type PostCollection = typeof VALID_COLLECTIONS[number];

function isValidCollection(c: string): c is PostCollection {
  return (VALID_COLLECTIONS as readonly string[]).includes(c);
}

/** POST /api/posts — create a community post */
socialRouter.post('/posts', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  const schema = z.object({
    communityId:   z.string().min(1),
    communityName: z.string().min(1),
    body:          z.string().min(1).max(500),
    imageUrl:      z.string().url().optional().nullable(),
  });
  try {
    const { communityId, communityName, body, imageUrl } = parseBody(schema, req.body);
    const authorId   = req.user!.id;
    const authorName = req.user!.username || req.user!.email || 'User';
    const postId     = randomUUID();
    const doc = {
      authorId,
      authorName,
      communityId,
      communityName,
      body,
      imageUrl: imageUrl ?? null,
      likeCount:    0,
      commentCount: 0,
      createdAt: nowIso(),
    };
    if (isFirestoreConfigured) {
      await db.collection('communityPosts').doc(postId).set(doc);
    }
    return res.status(201).json({ id: postId, ...doc });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts');
    return res.status(err instanceof Error && err.message.includes('Invalid') ? 400 : 500)
      .json({ error: err instanceof Error ? err.message : 'Failed to create post' });
  }
});

/**
 * GET /api/posts/:collection/:postId/reactions
 * Public — returns likeCount, commentCount, and (if authenticated) whether the user liked.
 */
socialRouter.get('/posts/:collection/:postId/reactions', async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const userId = req.user?.id ?? null;
  try {
    if (!isFirestoreConfigured) {
      return res.json({ likeCount: 0, liked: false, commentCount: 0 });
    }
    const [reactionsSnap, commentsSnap] = await Promise.all([
      db.collection(collection).doc(postId).collection('reactions').get(),
      db.collection(collection).doc(postId).collection('comments').get(),
    ]);
    return res.json({
      likeCount:    reactionsSnap.size,
      liked:        userId ? reactionsSnap.docs.some((d) => d.id === userId) : false,
      commentCount: commentsSnap.size,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/posts/:collection/:postId/reactions');
    return res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

/** POST /api/posts/:collection/:postId/like — toggle like */
socialRouter.post('/posts/:collection/:postId/like', requireAuth, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const userId = req.user!.id;
  try {
    let liked = false;
    if (isFirestoreConfigured) {
      const ref      = db.collection(collection).doc(postId).collection('reactions').doc(userId);
      const existing = await ref.get();
      if (existing.exists) {
        await ref.delete();
        liked = false;
      } else {
        await ref.set({ userId, createdAt: nowIso() });
        liked = true;
      }
    }
    return res.json({ liked });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/like');
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

/** GET /api/posts/:collection/:postId/comments */
socialRouter.get('/posts/:collection/:postId/comments', async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  try {
    if (!isFirestoreConfigured) {
      return res.json([]);
    }
    const snap = await db
      .collection(collection).doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get();
    return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    captureRouteError(err, 'GET /api/posts/:collection/:postId/comments');
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/** POST /api/posts/:collection/:postId/comments */
socialRouter.post('/posts/:collection/:postId/comments', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const schema = z.object({ body: z.string().min(1).max(300) });
  try {
    const { body } = parseBody(schema, req.body);
    const authorId   = req.user!.id;
    const authorName = req.user!.username || req.user!.email || 'User';
    const commentId  = randomUUID();
    const doc = { authorId, authorName, body, createdAt: nowIso() };
    if (isFirestoreConfigured) {
      await db.collection(collection).doc(postId).collection('comments').doc(commentId).set(doc);
    }
    return res.status(201).json({ id: commentId, ...doc });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/comments');
    return res.status(err instanceof Error && err.message.includes('Invalid') ? 400 : 500)
      .json({ error: err instanceof Error ? err.message : 'Failed to add comment' });
  }
});

/** POST /api/posts/:collection/:postId/report */
socialRouter.post('/posts/:collection/:postId/report', requireAuth, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const schema = z.object({ reason: z.string().min(1) });
  try {
    const { reason } = parseBody(schema, req.body);
    const reporterId = req.user!.id;
    if (isFirestoreConfigured) {
      await db.collection('reports').add({
        reporterId,
        postId,
        collection,
        reason,
        createdAt: nowIso(),
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/report');
    return res.status(500).json({ error: 'Failed to report post' });
  }
});
