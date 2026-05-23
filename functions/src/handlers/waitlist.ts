import { Router, type Request, type Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, isAdminUser } from '../middleware/auth';
import { captureRouteError, nowIso } from './utils';
import { sendToUsers } from '../services/fcmService';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Waitlist } from '../../shared/schema/waitlist';

export const waitlistRouter = Router();

/** POST /api/events/:id/waitlist — join the waitlist for a sold-out event */
waitlistRouter.post('/events/:id/waitlist', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Service unavailable' });
    const eventId = String(req.params.id ?? '');
    const userId = req.user!.id;
    const notificationPreference = (req.body?.notificationPreference as Waitlist['notificationPreference']) ?? 'push';

    // Validate event exists and has waitlist enabled
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
    const event = eventSnap.data()!;
    if (!event.waitlistEnabled) return res.status(400).json({ error: 'Waitlist not available for this event' });

    // Prevent duplicate entries
    const existing = await db
      .collection('waitlist')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (!existing.empty) {
      const entry = existing.docs[0].data() as Waitlist;
      return res.status(409).json({ error: 'Already on waitlist', position: entry.position });
    }

    // Determine queue position (count existing un-claimed entries + 1)
    const countSnap = await db
      .collection('waitlist')
      .where('eventId', '==', eventId)
      .where('claimedAt', '==', null)
      .count()
      .get();
    const position = (countSnap.data().count ?? 0) + 1;

    const id = randomUUID();
    const entry: Waitlist = {
      id,
      eventId,
      userId,
      position,
      notified: false,
      notificationPreference,
      createdAt: nowIso(),
    };

    await db.collection('waitlist').doc(id).set(entry);
    return res.status(201).json({ id, position });
  } catch (err) {
    captureRouteError(err, 'POST /api/events/:id/waitlist');
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

/** DELETE /api/events/:id/waitlist — leave the waitlist */
waitlistRouter.delete('/events/:id/waitlist', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Service unavailable' });
    const eventId = String(req.params.id ?? '');
    const userId = req.user!.id;

    const snap = await db
      .collection('waitlist')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (snap.empty) return res.status(404).json({ error: 'Not on waitlist' });

    await snap.docs[0].ref.delete();
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/events/:id/waitlist');
    return res.status(500).json({ error: 'Failed to leave waitlist' });
  }
});

/** GET /api/events/:id/waitlist/position — get current user's position */
waitlistRouter.get('/events/:id/waitlist/position', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json({ position: null, total: 0 });
    const eventId = String(req.params.id ?? '');
    const userId = req.user!.id;

    const [userSnap, totalSnap] = await Promise.all([
      db.collection('waitlist').where('eventId', '==', eventId).where('userId', '==', userId).limit(1).get(),
      db.collection('waitlist').where('eventId', '==', eventId).count().get(),
    ]);

    if (userSnap.empty) return res.json({ position: null, total: totalSnap.data().count });
    const entry = userSnap.docs[0].data() as Waitlist;
    return res.json({
      position: entry.position,
      total: totalSnap.data().count,
      expiresAt: entry.expiresAt ?? null,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/events/:id/waitlist/position');
    return res.status(500).json({ error: 'Failed to fetch waitlist position' });
  }
});

/** GET /api/events/:id/waitlist/count — admin only: total waitlist entries for an event */
waitlistRouter.get('/events/:id/waitlist/count', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAdminUser(req.user!)) return res.status(403).json({ error: 'Forbidden' });
    if (!isFirestoreConfigured) return res.json({ count: 0 });
    const eventId = String(req.params.id ?? '');
    const snap = await db.collection('waitlist').where('eventId', '==', eventId).count().get();
    return res.json({ count: snap.data().count });
  } catch (err) {
    captureRouteError(err, 'GET /api/events/:id/waitlist/count');
    return res.status(500).json({ error: 'Failed to fetch waitlist count' });
  }
});

/**
 * Processes the waitlist queue for an event after a ticket is cancelled.
 * Notifies the next un-notified person in the queue.
 */
export async function processWaitlistQueue(eventId: string): Promise<void> {
  const snap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('notified', '==', false)
    .orderBy('position', 'asc')
    .limit(1)
    .get();

  if (snap.empty) return;

  const doc = snap.docs[0];
  const entry = doc.data() as Waitlist;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await doc.ref.update({ notified: true, expiresAt });

  // Fetch event title for notification copy
  const eventSnap = await db.collection('events').doc(eventId).get();
  const eventTitle = (eventSnap.data()?.title as string | undefined) ?? 'an event';

  // FCM push notification
  if (entry.notificationPreference === 'push' || entry.notificationPreference === 'both') {
    await sendToUsers(
      [entry.userId],
      { title: "You're next on the waitlist!", body: `A spot opened up for ${eventTitle}. Claim it in 48 hours.` },
      { type: 'waitlist_available', eventId },
    );
  }

  // In-app notification doc
  const notifId = randomUUID();
  await db.collection('notifications').doc(notifId).set({
    id: notifId,
    userId: entry.userId,
    type: 'waitlist_available',
    title: "You're next on the waitlist!",
    body: `A spot opened up for ${eventTitle}. Claim it before ${new Date(expiresAt).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
    eventId,
    read: false,
    createdAt: nowIso(),
  });
}
