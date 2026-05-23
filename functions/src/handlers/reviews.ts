import { Router, type Request, type Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, isAdminUser } from '../middleware/auth';
import { captureRouteError, nowIso } from './utils';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Review } from '../../shared/schema/review';

export const reviewsRouter = Router();

const PAGE_SIZE = 20;

/** POST /api/events/:id/reviews — submit a review (requires proof-of-attendance ticket) */
reviewsRouter.post('/events/:id/reviews', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Service unavailable' });
    const eventId = String(req.params.id ?? '');
    const userId = req.user!.id;
    const { rating, comment, ticketId } = req.body ?? {};

    // Validate inputs
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(400).json({ error: 'ticketId is required' });
    }
    if (comment !== undefined && typeof comment !== 'string') {
      return res.status(400).json({ error: 'comment must be a string' });
    }

    // Validate ticket ownership and status
    const ticketSnap = await db.collection('tickets').doc(ticketId).get();
    if (!ticketSnap.exists) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketSnap.data()!;
    if (ticket.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (!['confirmed', 'used'].includes(ticket.status)) {
      return res.status(400).json({ error: 'Ticket must be confirmed or used to leave a review' });
    }
    if (ticket.eventId !== eventId) {
      return res.status(400).json({ error: 'Ticket is not for this event' });
    }

    // Idempotency — one review per user per event
    const existing = await db
      .collection('reviews')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (!existing.empty) return res.status(409).json({ error: 'You have already reviewed this event' });

    // Resolve organiser profile ID from the event
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
    const event = eventSnap.data()!;
    const organizerId = (event.publisherProfileId ?? event.organizerId ?? '') as string;

    const id = randomUUID();
    const review: Review = {
      id,
      userId,
      entityType: 'event',
      entityId: eventId,
      organizerId,
      eventId,
      ticketId,
      rating: ratingNum,
      comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : undefined,
      status: 'pending',
      helpfulCount: 0,
      createdAt: nowIso(),
    };

    await db.collection('reviews').doc(id).set(review);
    return res.status(201).json({ id, status: 'pending' });
  } catch (err) {
    captureRouteError(err, 'POST /api/events/:id/reviews');
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

/** GET /api/events/:id/reviews — list approved reviews for an event */
reviewsRouter.get('/events/:id/reviews', async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json({ reviews: [], total: 0 });
    const eventId = String(req.params.id ?? '');
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));

    const [snap, totalSnap] = await Promise.all([
      db
        .collection('reviews')
        .where('eventId', '==', eventId)
        .where('status', '==', 'approved')
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get(),
      db.collection('reviews').where('eventId', '==', eventId).where('status', '==', 'approved').count().get(),
    ]);

    return res.json({
      reviews: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      total: totalSnap.data().count,
      page,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/events/:id/reviews');
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/** GET /api/profiles/:id/reviews — list approved reviews for a profile (organiser/venue) */
reviewsRouter.get('/profiles/:id/reviews', async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json({ reviews: [], total: 0 });
    const organizerId = String(req.params.id ?? '');
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));

    const [snap, totalSnap] = await Promise.all([
      db
        .collection('reviews')
        .where('organizerId', '==', organizerId)
        .where('status', '==', 'approved')
        .orderBy('createdAt', 'desc')
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get(),
      db.collection('reviews').where('organizerId', '==', organizerId).where('status', '==', 'approved').count().get(),
    ]);

    return res.json({
      reviews: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      total: totalSnap.data().count,
      page,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/profiles/:id/reviews');
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/** POST /api/reviews/:id/helpful — mark a review as helpful */
reviewsRouter.post('/reviews/:id/helpful', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Service unavailable' });
    const reviewId = String(req.params.id ?? '');
    const ref = db.collection('reviews').doc(reviewId);
    await ref.update({ helpfulCount: FieldValue.increment(1) });
    const updated = await ref.get();
    return res.json({ helpfulCount: (updated.data()?.helpfulCount as number) ?? 0 });
  } catch (err) {
    captureRouteError(err, 'POST /api/reviews/:id/helpful');
    return res.status(500).json({ error: 'Failed to mark review as helpful' });
  }
});

/** POST /api/admin/reviews/:id/moderate — approve or reject a review (admin only) */
reviewsRouter.post('/admin/reviews/:id/moderate', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAdminUser(req.user!)) return res.status(403).json({ error: 'Forbidden' });
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Service unavailable' });
    const reviewId = String(req.params.id ?? '');
    const action = req.body?.action as 'approved' | 'rejected' | undefined;
    if (action !== 'approved' && action !== 'rejected') {
      return res.status(400).json({ error: 'action must be "approved" or "rejected"' });
    }
    await db.collection('reviews').doc(reviewId).update({
      status: action,
      updatedAt: nowIso(),
    });
    return res.json({ ok: true, status: action });
  } catch (err) {
    captureRouteError(err, 'POST /api/admin/reviews/:id/moderate');
    return res.status(500).json({ error: 'Failed to moderate review' });
  }
});
