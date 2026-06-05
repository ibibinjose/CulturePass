/**
 * Ticket routes — /api/tickets/*  +  /api/ticket/:id
 */

import { Router, type Request, type Response } from 'express';
import { firestore } from 'firebase-admin';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import {
  eventsService,
  ticketsService,
  scanEventsService,
  type FirestoreEvent,
} from '../services/firestore';
import { db, isFirestoreConfigured } from '../admin';
import {
  createAppleTicketPassSessionUrl,
  createGoogleEventTicketSaveUrl,
  generateAppleEventTicketPass,
  getWalletPassReadiness,
  verifyAppleTicketDownloadToken,
  type WalletEventSnapshot,
} from '../services/walletPasses';
import { nowIso, qparam, generateSecureId, awardRewardsPoints,
  captureRouteError,
} from './utils';
import {
  canIssueDirectTicket,
  PromoCodeError,
  resolveTicketOrderPricingWithPromo,
  TicketPricingError,
} from '../services/ticketPricing';
import { awardOnTicketPaid as awardCultureExplorerOnTicketPaid } from '../services/cultureExplorer';

export const ticketsRouter = Router();

async function loadEventSnapshotForTicket(ticket: { eventId: string }): Promise<WalletEventSnapshot | null> {
  if (!isFirestoreConfigured) return null;
  const snap = await db.collection('events').doc(ticket.eventId).get();
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return {
    title: d.title as string | undefined,
    date: d.date as string | undefined,
    time: d.time as string | undefined,
    venue: d.venue as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:userId — list tickets for a user
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:userId', requireAuth, async (req: Request, res: Response) => {
  if (!isOwnerOrAdmin(req.user!, qparam(req.params.userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const userTickets = await ticketsService.listForUser(qparam(req.params.userId));
    return res.json(userTickets);
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:userId');
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tickets/:userId/count — confirmed ticket count for a user
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:userId/count', requireAuth, async (req: Request, res: Response) => {
  if (!isOwnerOrAdmin(req.user!, qparam(req.params.userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const userTickets = await ticketsService.listForUser(qparam(req.params.userId));
    const count = userTickets.filter((t) => t.status === 'confirmed').length;
    return res.json({ count });
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:userId/count');
    return res.status(500).json({ error: 'Failed to count tickets' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ticket/:id (singular) — fetch a single ticket by ID
// ---------------------------------------------------------------------------
ticketsRouter.get('/ticket/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(ticket);
  } catch (err) {
    captureRouteError(err, 'GET /api/ticket/:id');
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/cancel
// ---------------------------------------------------------------------------
ticketsRouter.put('/tickets/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (ticket.status === 'used') {
      return res.status(400).json({ error: 'Used tickets cannot be cancelled' });
    }
    const updated = await ticketsService.updateStatus(qparam(req.params.id), 'cancelled', req.user!.id);
    return res.json(updated);
  } catch (err) {
    captureRouteError(err, 'PUT /api/tickets/:id/cancel');
    return res.status(500).json({ error: 'Failed to cancel ticket' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/scan — staff QR scan
// ---------------------------------------------------------------------------
ticketsRouter.post(
  '/tickets/scan',
  requireAuth,
  requireRole('organizer', 'moderator', 'admin'),
  async (req: Request, res: Response) => {
    const qrCode = String(req.body?.ticketCode ?? '').trim();
    if (!qrCode) return res.status(400).json({ valid: false, error: 'ticketCode is required' });

    // Local development/mock fallback when firestore is not configured OR code is a mock code
    if (!isFirestoreConfigured || qrCode.startsWith('mock-')) {
      if (qrCode.startsWith('mock-used')) {
        return res.json({
          valid: false,
          outcome: 'duplicate',
          message: 'Ticket has already been scanned',
          ticket: {
            id: 'mock-used-ticket',
            eventTitle: 'Symphony Under the Stars',
            eventDate: 'Friday, 12 Dec 2026',
            eventTime: '7:30 PM',
            eventVenue: 'Sydney Opera House',
            tierName: 'General Admission',
            ticketCode: qrCode,
            status: 'used',
          }
        });
      }
      if (qrCode.startsWith('mock-invalid')) {
        return res.json({
          valid: false,
          outcome: 'rejected',
          message: 'Invalid ticket code',
        });
      }
      if (qrCode.startsWith('mock-cancelled')) {
        return res.json({
          valid: false,
          outcome: 'rejected',
          message: 'Ticket has been cancelled',
          ticket: {
            id: 'mock-cancelled-ticket',
            eventTitle: 'Symphony Under the Stars',
            eventDate: 'Friday, 12 Dec 2026',
            eventTime: '7:30 PM',
            eventVenue: 'Sydney Opera House',
            tierName: 'VIP Lounge',
            ticketCode: qrCode,
            status: 'cancelled',
          }
        });
      }
      if (qrCode.startsWith('mock-')) {
        return res.json({
          valid: true,
          outcome: 'accepted',
          message: 'Mock ticket scanned successfully',
          ticket: {
            id: 'mock-ticket-id',
            eventTitle: 'Symphony Under the Stars',
            eventDate: 'Friday, 12 Dec 2026',
            eventTime: '7:30 PM',
            eventVenue: 'Sydney Opera House',
            tierName: 'VIP Lounge',
            ticketCode: qrCode,
            status: 'confirmed',
          }
        });
      }
      return res.json({
        valid: false,
        outcome: 'rejected',
        message: 'Invalid ticket code',
      });
    }

    try {
      const ticket = await ticketsService.getByQrCode(qrCode);
      if (!ticket) {
        return res.json({
          valid: false,
          outcome: 'rejected',
          message: 'Invalid ticket code',
        });
      }
      if (ticket.status !== 'confirmed') {
        const outcome = ticket.status === 'used' ? 'duplicate' : 'rejected';
        const message = ticket.status === 'used'
          ? 'Ticket has already been scanned'
          : `Ticket is ${ticket.status}`;
        return res.json({
          valid: false,
          outcome,
          message,
          ticket,
        });
      }
      const event = await eventsService.getById(ticket.eventId);
      if (!event) {
        return res.json({
          valid: false,
          outcome: 'rejected',
          message: 'Event not found for ticket',
        });
      }
      if (!isOwnerOrAdmin(req.user!, event.organizerId ?? event.createdBy ?? null)) {
        return res.status(403).json({ valid: false, error: 'Forbidden' });
      }
      const updated = await ticketsService.updateStatus(ticket.id, 'used', req.user!.id);
      await scanEventsService.record({
        ticketId: ticket.id,
        eventId: ticket.eventId,
        scannedBy: req.user!.id,
        outcome: 'accepted',
      });
      return res.json({
        valid: true,
        outcome: 'accepted',
        message: 'Ticket scanned successfully',
        ticket: updated
      });
    } catch (err) {
      captureRouteError(err, 'POST /api/tickets/scan');
      return res.status(500).json({ valid: false, error: 'Scan failed' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/history
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({ history: ticket.history });
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:id/history');
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tickets/admin/scan-events
// ---------------------------------------------------------------------------
ticketsRouter.get(
  '/tickets/admin/scan-events',
  requireAuth,
  requireRole('moderator', 'admin'),
  (_req: Request, res: Response) => {
    res.json([]); // Not yet implemented
  }
);

// ---------------------------------------------------------------------------
// Wallet pass URLs (real PKPass + Google “Save to Google Wallet”)
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:id/wallet/apple/pass', async (req: Request, res: Response) => {
  try {
    const ticketId = qparam(req.params.id);
    const token = String(req.query.token ?? '').trim();
    if (!token) return res.status(400).send('Missing token');

    const payload = verifyAppleTicketDownloadToken(token);
    if (payload.ticketId !== ticketId) {
      return res.status(403).send('Invalid ticket link');
    }

    const ticket = await ticketsService.getById(ticketId);
    if (!ticket) return res.status(404).send('Ticket not found');
    if (ticket.userId !== payload.sub) {
      return res.status(403).send('Forbidden');
    }
    if (ticket.status === 'cancelled' || ticket.status === 'expired') {
      return res.status(400).send('This ticket is not valid for Wallet');
    }
    if (ticket.paymentStatus === 'refunded') {
      return res.status(400).send('Refunded tickets cannot be added to Wallet');
    }

    const readiness = getWalletPassReadiness();
    if (!readiness.apple.ready) {
      return res.status(503).send('Apple Wallet is not configured');
    }

    const event = await loadEventSnapshotForTicket(ticket);
    const buffer = await generateAppleEventTicketPass(ticket, event);
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="CulturePass-Ticket-${ticketId}.pkpass"`);
    return res.send(buffer);
  } catch (err) {
    captureRouteError(err, 'GET /tickets/:id/wallet/apple/pass');
    return res.status(401).send('Invalid or expired link');
  }
});

ticketsRouter.get('/tickets/:id/wallet/apple', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (ticket.status === 'cancelled' || ticket.status === 'expired') {
      return res.status(400).json({ error: 'This ticket cannot be added to Wallet', code: 'TICKET_INVALID' });
    }
    if (ticket.paymentStatus === 'refunded') {
      return res.status(400).json({ error: 'Refunded ticket cannot be added to Wallet', code: 'TICKET_REFUNDED' });
    }

    const readiness = getWalletPassReadiness();
    if (!readiness.apple.ready) {
      return res.status(503).json({
        error: 'Apple Wallet is not configured on the server',
        code: 'WALLET_APPLE_NOT_CONFIGURED',
        missing: readiness.apple.missing,
      });
    }

    const url = createAppleTicketPassSessionUrl(req, req.user!.id, ticket.id);
    return res.json({ url, provider: 'apple' as const, ticketId: ticket.id, userId: req.user!.id });
  } catch (err) {
    captureRouteError(err, 'GET /tickets/:id/wallet/apple');
    return res.status(500).json({ error: 'Failed to create Apple Wallet link' });
  }
});

ticketsRouter.get('/tickets/:id/wallet/google', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (ticket.status === 'cancelled' || ticket.status === 'expired') {
      return res.status(400).json({ error: 'This ticket cannot be added to Wallet', code: 'TICKET_INVALID' });
    }
    if (ticket.paymentStatus === 'refunded') {
      return res.status(400).json({ error: 'Refunded ticket cannot be added to Wallet', code: 'TICKET_REFUNDED' });
    }

    const readiness = getWalletPassReadiness();
    if (!readiness.google.ready) {
      return res.status(503).json({
        error: 'Google Wallet is not configured on the server',
        code: 'WALLET_GOOGLE_NOT_CONFIGURED',
        missing: readiness.google.missing,
      });
    }

    const event = await loadEventSnapshotForTicket(ticket);
    const url = await createGoogleEventTicketSaveUrl(ticket, event);
    return res.json({ url, provider: 'google' as const, ticketId: ticket.id, userId: req.user!.id });
  } catch (err) {
    captureRouteError(err, 'GET /tickets/:id/wallet/google');
    return res.status(500).json({ error: 'Failed to create Google Wallet link' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets — purchase a ticket (Firestore atomic transaction)
// ---------------------------------------------------------------------------
ticketsRouter.post('/tickets', requireAuth, slidingWindowRateLimit(60000, 20), async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) {
    return res.status(503).json({ error: 'Ticket purchase requires a Firestore project — use the emulator or deploy to Firebase.' });
  }

  const userId  = req.user!.id;
  const eventId = String(req.body?.eventId ?? '');
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });

  try {
    const quantity = Number(req.body?.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Ticket quantity must be a positive integer' });
    }

    const eventRef  = db.collection('events').doc(eventId);
    const ticketRef = db.collection('tickets').doc();

    const ticket = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) throw new Error('EVENT_NOT_FOUND');

      const event = { id: eventDoc.id, ...(eventDoc.data() as Omit<FirestoreEvent, 'id'>) } as FirestoreEvent;
      const tierFromBody =
        typeof req.body?.tierName === 'string'
          ? req.body.tierName
          : typeof req.body?.tierId === 'string'
            ? req.body.tierId
            : undefined;
      const promoFromBody =
        typeof req.body?.promoCode === 'string' ? req.body.promoCode.trim() : undefined;
      const pricing = await resolveTicketOrderPricingWithPromo(event, {
        quantity,
        tierName: tierFromBody,
        ...(promoFromBody ? { promoCode: promoFromBody } : {}),
      });
      if (!canIssueDirectTicket(event, pricing)) {
        throw new Error('PAYMENT_REQUIRED');
      }
      if (event.capacity != null && (event.attending ?? 0) + pricing.quantity > event.capacity) {
        throw new Error('NOT_ENOUGH_CAPACITY');
      }

      const qrCode = generateSecureId('CP-T-');

      const newTicketPayload = {
        id:              ticketRef.id,
        eventId,
        userId,
        tierName:        pricing.tierName,
        quantity:        pricing.quantity,
        priceCents:      pricing.unitPriceCents,
        totalPriceCents: pricing.totalPriceCents,
        status:          'confirmed' as const,
        paymentStatus:   'paid'      as const,
        promoCode:       pricing.promoCode || null,
        qrCode,
        cpTicketId:      qrCode,
        history:         [{ action: 'ticket_created', timestamp: nowIso(), actorId: 'system' }],
        createdAt:       nowIso(),
        updatedAt:       nowIso(),
        familyMemberId:  req.body?.familyMemberId || null,
        // Denormalized for performance
        eventTitle: event.title,
        eventDate:  event.date,
        eventVenue: event.venue,
        imageColor: event.imageColor,
      };

      transaction.set(ticketRef, newTicketPayload);
      transaction.update(eventRef, { attending: firestore.FieldValue.increment(pricing.quantity) });

      return newTicketPayload;
    });

    if (ticket.promoCode) {
      await db.collection('promoCodes').doc(ticket.promoCode).update({
        redeemedCount: firestore.FieldValue.increment(1),
      }).catch(err => console.error(`[tickets] failed to increment redeemedCount for promo ${ticket.promoCode}:`, err));
    }

    const totalPriceCents = Number(ticket.totalPriceCents ?? ticket.priceCents ?? 0);
    const rewardPoints = await awardRewardsPoints(userId, totalPriceCents, {
      ticketId: ticket.id ?? ticketRef.id,
      source: 'ticket purchase',
    });
    if (rewardPoints > 0) {
      await ticketsService.update(ticketRef.id, {
        rewardPointsEarned:    rewardPoints,
        rewardPointsAwardedAt: nowIso(),
      });
    }

    // Culture Explorer bonus + quest progress for explored, non-root cultures.
    try {
      await awardCultureExplorerOnTicketPaid({
        uid: userId,
        ticketId: ticket.id ?? ticketRef.id,
        eventId: ticket.eventId,
        paidAmountCents: totalPriceCents,
      });
    } catch (err) {
      console.error('[tickets] cultureExplorer.awardOnTicketPaid failed:', err);
    }

    return res.status(201).json(ticket);
  } catch (err) {
    captureRouteError(err, 'POST /api/tickets');
    if (err instanceof Error) {
      if (err instanceof TicketPricingError) return res.status(400).json({ error: err.message, code: err.code });
      if (err instanceof PromoCodeError) return res.status(400).json({ error: err.message, code: err.code });
      if (err.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Event not found' });
      if (err.message === 'PAYMENT_REQUIRED') return res.status(409).json({ error: 'Paid tickets must be purchased through Stripe checkout', code: 'PAYMENT_REQUIRED' });
      if (err.message === 'NOT_ENOUGH_CAPACITY') return res.status(400).json({ error: 'Not enough tickets available for this quantity' });
    }
    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/assign — assign ticket to a family member or guest
// ---------------------------------------------------------------------------
ticketsRouter.put('/tickets/:id/assign', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticketId = qparam(req.params.id);
    const ticket = await ticketsService.getById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { familyMemberName, attendeeEmail } = req.body;
    let attendeeUserId = null;

    if (attendeeEmail && typeof attendeeEmail === 'string' && attendeeEmail.trim()) {
      const email = attendeeEmail.toLowerCase().trim();
      const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!userSnap.empty) {
        attendeeUserId = userSnap.docs[0].id;
      }
    }

    const updates = {
      familyMemberId: familyMemberName || null,
      attendeeUserId: attendeeUserId || null,
      updatedAt: nowIso(),
    };

    await ticketsService.update(ticketId, updates);

    // Save history
    const note = `Assigned to ${familyMemberName || attendeeEmail || 'Guest'}`;
    const historyEntry = { action: 'ticket_assigned', timestamp: nowIso(), actorId: req.user!.id, note };
    await db.collection('tickets').doc(ticketId).update({
      history: firestore.FieldValue.arrayUnion(historyEntry),
    });

    const updatedTicket = { ...ticket, ...updates };
    return res.json(updatedTicket);
  } catch (err) {
    captureRouteError(err, 'PUT /api/tickets/:id/assign');
    return res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/transfer — transfer ticket ownership to another user
// ---------------------------------------------------------------------------
ticketsRouter.post('/tickets/:id/transfer', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticketId = qparam(req.params.id);
    const ticket = await ticketsService.getById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (ticket.status === 'used' || ticket.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot transfer used or cancelled tickets' });
    }

    const email = String(req.body?.email ?? '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) {
      return res.status(404).json({ error: 'User with this email does not exist on CulturePass. Ask them to join first!' });
    }

    const recipientId = userSnap.docs[0].id;

    if (recipientId === ticket.userId) {
      return res.status(400).json({ error: 'Cannot transfer a ticket to yourself' });
    }

    const updates = {
      userId: recipientId,
      updatedAt: nowIso(),
    };

    await ticketsService.update(ticketId, updates);

    // Save history
    const note = `Transferred from ${req.user!.email} to ${email}`;
    const historyEntry = { action: 'ticket_transferred', timestamp: nowIso(), actorId: req.user!.id, note };
    await db.collection('tickets').doc(ticketId).update({
      history: firestore.FieldValue.arrayUnion(historyEntry),
    });

    const updatedTicket = { ...ticket, ...updates };
    return res.json(updatedTicket);
  } catch (err) {
    captureRouteError(err, 'POST /api/tickets/:id/transfer');
    return res.status(500).json({ error: 'Failed to transfer ticket' });
  }
});

