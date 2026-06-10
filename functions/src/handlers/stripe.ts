/**
 * Stripe routes — /api/stripe/*
 *
 * Uses a factory function so that Stripe client, dev-mode fallback Maps, and
 * `hasFirestoreProject` from app.ts can be injected without a circular import.
 */

import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { firestore } from 'firebase-admin';
import { requireAuth, requireRevocationCheck, isOwnerOrAdmin } from '../middleware/auth';
import {
  ticketsService,
  usersService,
  walletsService,
  notificationsService,
  eventsService,
  profilesService,
} from '../services/firestore';
import {
  computeApplicationFeeCents,
  getConnectPlatformFeeBps,
  handleStripeAccountUpdated,
} from '../services/stripeConnect';
import {
  buildChargeSnapshotFromSubscription,
  recordMembershipCharge,
} from '../services/pricing';
import { registerStripeConnectRoutes } from './stripeConnect';
import { db, authAdmin, stripeClient } from '../admin';
import {
  nowIso,
  generateSecureId,
  buildMembershipResponse,
  awardRewardsPoints,
  getFirebaseProjectId,
  parseBody,
} from './utils';
import {
  resolveTicketOrderPricingWithPromo,
  TicketPricingError,
  PromoCodeError,
} from '../services/ticketPricing';
import { awardOnTicketPaid as awardCultureExplorerOnTicketPaid } from '../services/cultureExplorer';
import { fulfillPaidPerkAfterStripeCheckout } from '../services/perks';

// ---------------------------------------------------------------------------
// Inline types (avoid circular dep with app.ts)
// ---------------------------------------------------------------------------

type TicketStatus = 'confirmed' | 'used' | 'cancelled' | 'expired';
type TicketPriority = 'low' | 'normal' | 'high' | 'vip';

type DevTicket = {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  tierName: string;
  quantity: number;
  totalPriceCents: number;
  currency: string;
  status: TicketStatus;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
  priority: TicketPriority;
  ticketCode: string;
  stripePaymentIntentId?: string;
  cashbackCents?: number;
  cashbackCreditedAt?: string;
  rewardPointsEarned?: number;
  rewardPointsAwardedAt?: string;
  imageColor?: string;
  createdAt: string;
  history: { at: string; status: TicketStatus; note: string }[];
  staffAuditTrail?: { at: string; by: string; action: string; note?: string }[];
};

type DevMembership = {
  id: string;
  userId: string;
  tier: string;
  isActive: boolean;
  validUntil?: string;
};

type DevTransaction = {
  id: string;
  type: 'charge' | 'refund' | 'debit' | 'cashback';
  amountCents: number;
  createdAt: string;
  description: string;
};

type DevWallet = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  points: number;
};



// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const stripeCheckoutSchema = z.object({
  ticketData: z.object({
    eventId:         z.string().min(1),
    eventTitle:      z.string().optional(),
    eventDate:       z.string().optional(),
    eventTime:       z.string().optional(),
    eventVenue:      z.string().optional(),
    tierName:        z.string().optional(),
    quantity:        z.coerce.number().int().positive().optional(),
    currency:        z.string().optional(),
    imageColor:      z.string().optional(),
    promoCode:       z.string().max(64).optional(),
    redeemPoints:    z.coerce.number().int().nonnegative().optional(),
  }),
});

const stripeRefundSchema = z.object({
  ticketId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createStripeRouter() {
  const router = Router();
  registerStripeConnectRoutes(router);

  // ── POST /api/stripe/create-checkout-session ──────────────────────────────
  router.post('/stripe/create-checkout-session', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    let payload: z.infer<typeof stripeCheckoutSchema>;
    try {
      payload = parseBody(stripeCheckoutSchema, req.body);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid checkout payload' });
    }

    const td = payload.ticketData;
    const event = await eventsService.getById(td.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    let pricing;
    try {
      // Security regression guard: pricing must be derived server-side (resolveTicketOrderPricing(event, ...)).
      pricing = await resolveTicketOrderPricingWithPromo(event, {
        quantity: td.quantity,
        tierName: td.tierName,
        promoCode: td.promoCode,
      });
    } catch (err) {
      if (err instanceof TicketPricingError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      if (err instanceof PromoCodeError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      throw err;
    }
    if (pricing.totalPriceCents <= 0) {
      return res.status(400).json({ error: 'Free events do not require Stripe checkout', code: 'FREE_EVENT' });
    }
    if (event.capacity != null && (event.attending ?? 0) + pricing.quantity > event.capacity) {
      return res.status(400).json({ error: 'Not enough tickets available for this quantity', code: 'NOT_ENOUGH_CAPACITY' });
    }

    let appliedPoints = 0;
    let pointsDiscountCents = 0;
    const requestedPoints = Number(td.redeemPoints ?? 0);
    if (requestedPoints > 0) {
      const wallet = await walletsService.getOrCreate(req.user!.id);
      const userPoints = wallet?.points ?? 0;
      if (requestedPoints > userPoints) {
        return res.status(400).json({ error: 'Insufficient rewards points balance', code: 'INSUFFICIENT_POINTS' });
      }
      appliedPoints = Math.min(requestedPoints, pricing.totalPriceCents);
      pointsDiscountCents = appliedPoints; // 100 points = $1 AUD (100 cents) => 1 point = 1 cent
    }

    const finalPriceCents = pricing.totalPriceCents - pointsDiscountCents;

    if (finalPriceCents <= 0) {
      const draftId = randomUUID();
      const createdAt = nowIso();
      const ticketCode = generateSecureId('CP-T-');
      const walletRef = db.collection('wallets').doc(req.user!.id);

      try {
        await db.runTransaction(async (transaction) => {
          const walletSnap = await transaction.get(walletRef);
          const currentPoints = walletSnap.data()?.points ?? 0;
          if (currentPoints < appliedPoints) {
            throw new Error('Insufficient points balance during transaction');
          }
          transaction.update(walletRef, {
            points: currentPoints - appliedPoints
          });

          const ticketDoc = {
            id:              draftId,
            userId:          req.user!.id,
            eventId:         event.id,
            eventTitle:      event.title,
            eventDate:       event.date,
            eventTime:       event.time,
            eventVenue:      event.venue,
            tierName:        pricing.tierName,
            quantity:        pricing.quantity,
            priceCents:      pricing.unitPriceCents,
            totalPriceCents: 0,
            pointsRedeemed:  appliedPoints,
            pointsDiscountCents,
            pointsRedeemedDeductedAt: createdAt,
            promoCode:       pricing.promoCode ?? null,
            discountCents:   pricing.discountCents ?? 0,
            currency:        'AUD',
            status:          'confirmed' as TicketStatus,
            paymentStatus:   'paid' as const,
            priority:        'normal' as TicketPriority,
            imageColor:      td.imageColor ?? undefined,
            createdAt,
            updatedAt:       createdAt,
            qrCode:          ticketCode,
            cpTicketId:      ticketCode,
            ticketCode,
            history:         [
              { at: createdAt, status: 'confirmed' as TicketStatus, note: 'Direct confirmation via points redemption' },
              { action: 'checkout_completed', timestamp: createdAt, actorId: req.user!.id }
            ]
          };

          transaction.set(db.collection('tickets').doc(draftId), ticketDoc);
        });

        // Increment event attendance
        await db.collection('events').doc(event.id).update({
          attending: firestore.FieldValue.increment(pricing.quantity || 1)
        }).catch(err => console.error(`[stripe] failed to increment attending:`, err));

        return res.json({
          ticketId: draftId,
          directConfirmation: true,
          message: 'Ticket confirmed successfully via rewards points deduction.'
        });
      } catch (err: any) {
        console.error('[stripe] direct checkout transaction error:', err);
        return res.status(500).json({ error: 'Failed to process points deduction checkout' });
      }
    }

    const draftId  = randomUUID();
    const createdAt = nowIso();
    const draft = {
      id:              draftId,
      userId:          req.user!.id,
      eventId:         event.id,
      eventTitle:      event.title,
      eventDate:       event.date,
      eventTime:       event.time,
      eventVenue:      event.venue,
      tierName:        pricing.tierName,
      quantity:        pricing.quantity,
      priceCents:      pricing.unitPriceCents,
      totalPriceCents: finalPriceCents,
      pointsRedeemed:  appliedPoints,
      pointsDiscountCents,
      promoCode:       pricing.promoCode ?? null,
      discountCents:   pricing.discountCents ?? 0,
      currency:        'AUD',
      status:          'confirmed' as TicketStatus,
      paymentStatus:   'pending' as const,
      priority:        'normal' as TicketPriority,
      imageColor:      td.imageColor ?? undefined,
      createdAt,
      ticketCode:      generateSecureId('CP-T-'),
      history:         [{ at: createdAt, status: 'confirmed' as TicketStatus, note: 'Draft created, awaiting payment' }],
    };

    await db.collection('tickets').doc(draftId).set({
      ...draft,
      qrCode:     draft.ticketCode,
      cpTicketId: draft.ticketCode,
      priceCents: draft.priceCents,
      updatedAt:  createdAt,
      history:    [{ action: 'checkout_started', timestamp: createdAt, actorId: req.user!.id }],
    });

    if (!stripeClient) {
      console.error('[stripe] STRIPE_API_KEY/STRIPE_SECRET_KEY not configured');
      return res.status(503).json({
        error: 'Payment service unavailable. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      });
    }

    try {
      const projectId = getFirebaseProjectId();
      const appUrl = process.env.APP_URL ?? (projectId ? `https://${projectId}.web.app` : 'https://localhost:5000');
      const sessionMetadata: Record<string, string> = {
        ticketId: draft.id,
        userId: draft.userId,
        eventId: draft.eventId,
      };
      if (pricing.promoCode) sessionMetadata.promoCode = pricing.promoCode;

      let paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined;

      if (draft.totalPriceCents > 0) {
        try {
          const eventDoc = await eventsService.getById(draft.eventId);
          const pubId = eventDoc?.publisherProfileId?.trim();
          if (pubId) {
            const sellerProfile = await profilesService.getById(pubId);
            const acct = sellerProfile?.stripeConnectAccountId?.trim();
            const payoutsOk = sellerProfile?.payoutsEnabled === true;
            if (acct && payoutsOk) {
              const acc = await stripeClient.accounts.retrieve(acct);
              if (acc.charges_enabled) {
                const bps = getConnectPlatformFeeBps();
                const fee = computeApplicationFeeCents(draft.totalPriceCents, bps);
                if (fee < draft.totalPriceCents) {
                  paymentIntentData = {
                    application_fee_amount: fee,
                    transfer_data: { destination: acct },
                    metadata: {
                      ...sessionMetadata,
                      publisherProfileId: pubId,
                      stripeConnectAccountId: acct,
                    },
                  };
                  sessionMetadata.publisherProfileId = pubId;
                  sessionMetadata.stripeConnectAccountId = acct;
                }
              }
            }
          }
        } catch (connectErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[stripe] Connect routing skipped:', (connectErr as Error).message);
          }
        }
      }

      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency:     draft.currency.toLowerCase(),
            product_data: { name: `${draft.eventTitle} — ${draft.tierName}`, description: `${draft.quantity} × ticket(s) · ${draft.eventDate ?? 'Date TBA'}` },
            unit_amount:  draft.totalPriceCents,
          },
          quantity: 1,
        }],
        allow_promotion_codes: true,
        metadata: sessionMetadata,
        ...(paymentIntentData ? { payment_intent_data: paymentIntentData } : {}),
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&ticketId=${draft.id}`,
        cancel_url:  `${appUrl}/payment/cancel?ticketId=${draft.id}`,
      });

      const stripePaymentIntentId = session.payment_intent ? String(session.payment_intent) : undefined;
      await ticketsService.update(draft.id, { stripePaymentIntentId });
      return res.json({ checkoutUrl: session.url, ticketId: draft.id, sessionId: session.id, paymentIntentId: stripePaymentIntentId });
    } catch (err: unknown) {
      console.error('[stripe] checkout session error:', (err as Error).message);
      await db.collection('tickets').doc(draft.id).delete();
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // ── POST /api/stripe/create-payment-intent ──────────────────────────────────
  router.post('/stripe/create-payment-intent', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    let payload: z.infer<typeof stripeCheckoutSchema>;
    try {
      payload = parseBody(stripeCheckoutSchema, req.body);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid checkout payload' });
    }

    const user = await usersService.getById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      if (!stripeClient) {
        return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
      }
      try {
        const customer = await stripeClient.customers.create({
          email: user.email,
          name: user.displayName ?? user.username ?? undefined,
          metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;
        await usersService.upsert(user.id, { stripeCustomerId });
      } catch (custErr) {
        console.error('[stripe] failed to create Stripe customer:', custErr);
        return res.status(500).json({ error: 'Failed to initialize payment customer' });
      }
    }

    const td = payload.ticketData;
    const event = await eventsService.getById(td.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let pricing;
    try {
      pricing = await resolveTicketOrderPricingWithPromo(event, {
        quantity: td.quantity,
        tierName: td.tierName,
        promoCode: td.promoCode,
      });
    } catch (err) {
      if (err instanceof TicketPricingError || err instanceof PromoCodeError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      throw err;
    }

    if (pricing.totalPriceCents <= 0) {
      return res.status(400).json({ error: 'Free events do not require Stripe checkout', code: 'FREE_EVENT' });
    }

    if (event.capacity != null && (event.attending ?? 0) + pricing.quantity > event.capacity) {
      return res.status(400).json({ error: 'Not enough tickets available for this quantity', code: 'NOT_ENOUGH_CAPACITY' });
    }

    let appliedPoints = 0;
    let pointsDiscountCents = 0;
    const requestedPoints = Number(td.redeemPoints ?? 0);
    if (requestedPoints > 0) {
      const wallet = await walletsService.getOrCreate(req.user!.id);
      const userPoints = wallet?.points ?? 0;
      if (requestedPoints > userPoints) {
        return res.status(400).json({ error: 'Insufficient rewards points balance', code: 'INSUFFICIENT_POINTS' });
      }
      appliedPoints = Math.min(requestedPoints, pricing.totalPriceCents);
      pointsDiscountCents = appliedPoints; // 100 points = $1 AUD (100 cents) => 1 point = 1 cent
    }

    const finalPriceCents = pricing.totalPriceCents - pointsDiscountCents;

    if (finalPriceCents <= 0) {
      const draftId = randomUUID();
      const createdAt = nowIso();
      const ticketCode = generateSecureId('CP-T-');
      const walletRef = db.collection('wallets').doc(req.user!.id);

      try {
        await db.runTransaction(async (transaction) => {
          const walletSnap = await transaction.get(walletRef);
          const currentPoints = walletSnap.data()?.points ?? 0;
          if (currentPoints < appliedPoints) {
            throw new Error('Insufficient points balance during transaction');
          }
          transaction.update(walletRef, {
            points: currentPoints - appliedPoints
          });

          const ticketDoc = {
            id:              draftId,
            userId:          req.user!.id,
            eventId:         event.id,
            eventTitle:      event.title,
            eventDate:       event.date,
            eventTime:       event.time,
            eventVenue:      event.venue,
            tierName:        pricing.tierName,
            quantity:        pricing.quantity,
            priceCents:      pricing.unitPriceCents,
            totalPriceCents: 0,
            pointsRedeemed:  appliedPoints,
            pointsDiscountCents,
            pointsRedeemedDeductedAt: createdAt,
            promoCode:       pricing.promoCode ?? null,
            discountCents:   pricing.discountCents ?? 0,
            currency:        'AUD',
            status:          'confirmed' as TicketStatus,
            paymentStatus:   'paid' as const,
            priority:        'normal' as TicketPriority,
            imageColor:      td.imageColor ?? undefined,
            createdAt,
            updatedAt:       createdAt,
            qrCode:          ticketCode,
            cpTicketId:      ticketCode,
            ticketCode,
            history:         [
              { at: createdAt, status: 'confirmed' as TicketStatus, note: 'Direct confirmation via points redemption' },
              { action: 'checkout_completed', timestamp: createdAt, actorId: req.user!.id }
            ]
          };

          transaction.set(db.collection('tickets').doc(draftId), ticketDoc);
        });

        // Increment event attendance
        await db.collection('events').doc(event.id).update({
          attending: firestore.FieldValue.increment(pricing.quantity || 1)
        }).catch(err => console.error(`[stripe] failed to increment attending:`, err));

        return res.json({
          ticketId: draftId,
          directConfirmation: true,
          message: 'Ticket confirmed successfully via rewards points deduction.'
        });
      } catch (err: any) {
        console.error('[stripe] direct checkout transaction error:', err);
        return res.status(500).json({ error: 'Failed to process points deduction checkout' });
      }
    }

    const draftId  = randomUUID();
    const createdAt = nowIso();
    const draft = {
      id:              draftId,
      userId:          req.user!.id,
      eventId:         event.id,
      eventTitle:      event.title,
      eventDate:       event.date,
      eventTime:       event.time,
      eventVenue:      event.venue,
      tierName:        pricing.tierName,
      quantity:        pricing.quantity,
      priceCents:      pricing.unitPriceCents,
      totalPriceCents: finalPriceCents,
      pointsRedeemed:  appliedPoints,
      pointsDiscountCents,
      promoCode:       pricing.promoCode ?? null,
      discountCents:   pricing.discountCents ?? 0,
      currency:        'AUD',
      status:          'confirmed' as TicketStatus,
      paymentStatus:   'pending' as const,
      priority:        'normal' as TicketPriority,
      imageColor:      td.imageColor ?? undefined,
      createdAt,
      ticketCode:      generateSecureId('CP-T-'),
      history:         [{ at: createdAt, status: 'confirmed' as TicketStatus, note: 'Draft created, awaiting payment' }],
    };

    await db.collection('tickets').doc(draftId).set({
      ...draft,
      qrCode:     draft.ticketCode,
      cpTicketId: draft.ticketCode,
      priceCents: draft.priceCents,
      updatedAt:  createdAt,
      history:    [{ action: 'checkout_started', timestamp: createdAt, actorId: req.user!.id }],
    });

    if (!stripeClient) {
      console.error('[stripe] STRIPE_API_KEY/STRIPE_SECRET_KEY not configured');
      return res.status(503).json({
        error: 'Payment service unavailable. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      });
    }

    try {
      const sessionMetadata: Record<string, string> = {
        ticketId: draft.id,
        userId: draft.userId,
        eventId: draft.eventId,
      };
      if (pricing.promoCode) sessionMetadata.promoCode = pricing.promoCode;

      let transferOptions: {
        application_fee_amount?: number;
        transfer_data?: { destination: string };
      } = {};

      try {
        const eventDoc = await eventsService.getById(draft.eventId);
        const pubId = eventDoc?.publisherProfileId?.trim();
        if (pubId) {
          const sellerProfile = await profilesService.getById(pubId);
          const acct = sellerProfile?.stripeConnectAccountId?.trim();
          const payoutsOk = sellerProfile?.payoutsEnabled === true;
          if (acct && payoutsOk) {
            const acc = await stripeClient.accounts.retrieve(acct);
            if (acc.charges_enabled) {
              const bps = getConnectPlatformFeeBps();
              const fee = computeApplicationFeeCents(draft.totalPriceCents, bps);
              if (fee < draft.totalPriceCents) {
                transferOptions = {
                  application_fee_amount: fee,
                  transfer_data: { destination: acct },
                };
                sessionMetadata.publisherProfileId = pubId;
                sessionMetadata.stripeConnectAccountId = acct;
              }
            }
          }
        }
      } catch (connectErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[stripe] Connect routing skipped for PaymentIntent:', (connectErr as Error).message);
        }
      }

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: draft.totalPriceCents,
        currency: draft.currency.toLowerCase(),
        customer: stripeCustomerId,
        metadata: sessionMetadata,
        ...transferOptions,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const ephemeralKey = await stripeClient.ephemeralKeys.create(
        { customer: stripeCustomerId },
        { apiVersion: '2022-11-15' }
      );

      await ticketsService.update(draft.id, { stripePaymentIntentId: paymentIntent.id });

      return res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: stripeCustomerId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
        ticketId: draft.id,
        paymentIntentId: paymentIntent.id,
      });
    } catch (err: unknown) {
      console.error('[stripe] payment intent error:', (err as Error).message);
      await db.collection('tickets').doc(draft.id).delete();
      return res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // ── POST /api/stripe/refund ────────────────────────────────────────────────
  router.post('/stripe/refund', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    let payload: z.infer<typeof stripeRefundSchema>;
    try {
      payload = parseBody(stripeRefundSchema, req.body);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid refund payload' });
    }
    const { ticketId } = payload;

    const ticket = await ticketsService.getById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) return res.status(403).json({ error: 'Forbidden' });
    if (ticket.status === 'used') return res.status(400).json({ error: 'Cannot refund used ticket' });
    if (ticket.paymentStatus === 'refunded') return res.status(400).json({ error: 'Already refunded' });

    const quantity        = Number((ticket as unknown as { quantity?: number }).quantity ?? 1);
    const totalPriceCents = Number((ticket as unknown as { totalPriceCents?: number }).totalPriceCents ?? ticket.priceCents * quantity);
    const eventTitle      = String((ticket as unknown as { eventTitle?: string }).eventTitle ?? 'Event');

    if (stripeClient && ticket.stripePaymentIntentId && !ticket.stripePaymentIntentId.startsWith('pi_mock_')) {
      try {
        const refund = await stripeClient.refunds.create({ payment_intent: ticket.stripePaymentIntentId });
        await ticketsService.update(ticketId, { status: 'cancelled', paymentStatus: 'refunded' });
        await walletsService.addTransaction(ticket.userId, { type: 'refund', amountCents: totalPriceCents, description: `Refund: ${eventTitle}` });
        return res.json({ ok: true, ticketId, refundId: refund.id });
      } catch (err: unknown) {
        console.error('[stripe] refund error:', (err as Error).message);
        return res.status(500).json({ error: 'Stripe refund failed' });
      }
    }

    // Fallback for mock/test tickets if still allowed but mostly this will be a real update
    await ticketsService.update(ticketId, { status: 'cancelled', paymentStatus: 'refunded' });
    await walletsService.addTransaction(ticket.userId, { type: 'refund', amountCents: totalPriceCents, description: `Refund: ${eventTitle}` });
    return res.json({ ok: true, ticketId, refundId: `re_mock_${randomUUID().slice(0, 8)}` });
  });

  // ── POST /api/stripe/webhook ───────────────────────────────────────────────
  router.post('/stripe/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (stripeClient && process.env.STRIPE_WEBHOOK_SECRET && req.rawBody && sig) {
      let event: Stripe.Event;
      try {
        event = stripeClient.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err: unknown) {
        const msg = (err as Error).message;
        console.error('[stripe] webhook signature verification failed:', msg);
        // Security: do not return verifier internals to clients (can reveal signing expectations/config).
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      // Idempotency: only process each event once
      const idempotencyRef = db.collection('stripeEvents').doc(event.id);
      try {
        await idempotencyRef.create({ receivedAt: nowIso(), type: event.type });
      } catch (error: unknown) {
        if ((error as Record<string, unknown>)?.code === 6) {
          return res.json({ received: true, message: 'Already processed' });
        }
        console.error(`[stripe] idempotency check failed for event ${event.id}`, error);
        return res.status(500).json({ error: 'Idempotency check failed' });
      }

      const eventType  = event.type;
      const obj        = event.data.object as unknown as Record<string, unknown>;
      const meta       = (obj?.metadata ?? {}) as Record<string, string>;
      const ticketId   = String(meta?.ticketId ?? '');
      const userIdMeta = String(meta?.userId ?? obj?.client_reference_id ?? '');

      try {
        // ── Subscription events ──────────────────────────────────────────
        if (eventType === 'checkout.session.completed' && obj.mode === 'subscription' && userIdMeta) {
          const subscriptionId = String(obj.subscription ?? '');
          let expiresAt: string | undefined;
          let tier: 'free' | 'plus' | 'premium' = 'plus';
          const billingCountryMeta = String(meta?.billingCountry ?? '');
          if (subscriptionId) {
            const sub = await stripeClient!.subscriptions.retrieve(subscriptionId).catch(() => null);
            if (sub) {
              expiresAt = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString();
              const priceId = (sub as unknown as { items: { data: { price: { id: string } }[] } }).items?.data?.[0]?.price?.id;
              if (priceId && priceId === process.env.STRIPE_PRICE_YEARLY_ID) tier = 'premium';

              const subscriber = await usersService.getById(userIdMeta).catch(() => null);
              const chargeSnapshot = await buildChargeSnapshotFromSubscription(
                sub,
                billingCountryMeta || subscriber?.country || undefined,
                String(obj.id ?? ''),
              );
              if (chargeSnapshot) {
                await recordMembershipCharge(userIdMeta, chargeSnapshot);
              }
            }
          }
          await usersService.upsert(userIdMeta, {
            stripeSubscriptionId: subscriptionId || undefined,
            membership: { tier, isActive: true, expiresAt },
            premiumIntroDiscountUsedAt: nowIso(),
          });
          await authAdmin.setCustomUserClaims(userIdMeta, {
            ...(await authAdmin.getUser(userIdMeta)).customClaims,
            tier,
          });

        } else if (eventType === 'customer.subscription.updated') {
          const custId = String(obj.customer ?? '');
          if (custId) {
            const snap = await db.collection('users').where('stripeCustomerId', '==', custId).limit(1).get();
            if (!snap.empty) {
              const uid = snap.docs[0].id;
              const isActive = obj.status === 'active' || obj.status === 'trialing';
              const periodEnd = obj.current_period_end as number | undefined;
              const expiresAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined;
              await usersService.upsert(uid, {
                stripeSubscriptionId: String(obj.id),
                membership: { tier: isActive ? 'plus' : 'free', isActive, expiresAt },
              });
              await authAdmin.setCustomUserClaims(uid, {
                ...(await authAdmin.getUser(uid)).customClaims,
                tier: isActive ? 'plus' : 'free',
              });
            }
          }

        } else if (eventType === 'customer.subscription.deleted') {
          const custId = String(obj.customer ?? '');
          if (custId) {
            const snap = await db.collection('users').where('stripeCustomerId', '==', custId).limit(1).get();
            if (!snap.empty) {
              const uid = snap.docs[0].id;
              await usersService.upsert(uid, { stripeSubscriptionId: undefined, membership: { tier: 'free', isActive: false } });
              await authAdmin.setCustomUserClaims(uid, { ...(await authAdmin.getUser(uid)).customClaims, tier: 'free' });
            }
          }

        } else if (eventType === 'invoice.payment_failed') {
          const custId = String(obj.customer ?? '');
          if (custId) {
            const snap = await db.collection('users').where('stripeCustomerId', '==', custId).limit(1).get();
            if (!snap.empty) {
              await usersService.upsert(snap.docs[0].id, { membership: { tier: 'plus', isActive: false } });
            }
          }

        } else if (eventType === 'account.updated') {
          await handleStripeAccountUpdated(event.data.object as Stripe.Account);

        // ── Paid perk (callable Checkout — metadata.perkId, no ticket) ─────────────
        } else if (
          eventType === 'checkout.session.completed' &&
          obj.mode === 'payment' &&
          String(meta?.perkId ?? '').trim().length > 0 &&
          !ticketId
        ) {
          const perkId = String(meta.perkId ?? '').trim();
          const uid = userIdMeta.trim();
          const stripeSessionId = String(obj.id ?? '');
          const piRaw = obj.payment_intent;
          const paymentIntentId =
            typeof piRaw === 'string'
              ? piRaw
              : piRaw &&
                  typeof piRaw === 'object' &&
                  piRaw !== null &&
                  'id' in piRaw &&
                  typeof (piRaw as { id: unknown }).id === 'string'
                ? (piRaw as { id: string }).id
                : undefined;

          if (!uid || !stripeSessionId) {
            console.error('[stripe] Paid perk webhook missing userId or session id', { perkId, eventId: event.id });
          } else {
            const perkResult = await fulfillPaidPerkAfterStripeCheckout({
              perkId,
              userId: uid,
              stripeSessionId,
              stripePaymentIntentId: paymentIntentId,
            });
            if (!perkResult.ok) {
              console.error('[stripe] Paid perk fulfillment failed:', perkResult.reason, { perkId, uid, stripeSessionId });
            }
          }

        // ── Ticket (one-time payment) events ─────────────────────────────
        } else if (ticketId) {
          if (
            (eventType === 'checkout.session.completed' && obj.mode === 'payment') ||
            eventType === 'payment_intent.succeeded'
          ) {
            const ticketDoc = await db.collection('tickets').doc(ticketId).get();
            const ticketData = ticketDoc.data();
            const pointsRedeemed = Number(ticketData?.pointsRedeemed ?? 0);

            const updatedTicket = await ticketsService.update(ticketId, {
              status: 'confirmed',
              paymentStatus: 'paid',
              stripePaymentIntentId: String(obj.payment_intent ?? obj.id ?? ''),
            });

            if (pointsRedeemed > 0 && !ticketData?.pointsRedeemedDeductedAt) {
              const walletRef = db.collection('wallets').doc(ticketData!.userId);
              try {
                await db.runTransaction(async (transaction) => {
                  const walletSnap = await transaction.get(walletRef);
                  const currentPoints = walletSnap.data()?.points ?? 0;
                  const newPoints = Math.max(0, currentPoints - pointsRedeemed);
                  transaction.update(walletRef, { points: newPoints });
                });
                await ticketsService.update(ticketId, {
                  pointsRedeemedDeductedAt: nowIso()
                });
              } catch (deductErr) {
                console.error(`[stripe] failed to deduct points for ticket ${ticketId}:`, deductErr);
              }
            }

            // Increment event attendance
            if (updatedTicket?.eventId && updatedTicket?.quantity) {
              await db.collection('events').doc(updatedTicket.eventId).update({
                attending: firestore.FieldValue.increment(updatedTicket.quantity || 1)
              }).catch(err => console.error(`[stripe] failed to increment attending for event ${updatedTicket.eventId}:`, err));
            }

            const ticketUserId = userIdMeta || updatedTicket?.userId;
            if (updatedTicket && ticketUserId) {
              const paidAmountCents = Number(obj.amount_total ?? updatedTicket.totalPriceCents ?? updatedTicket.priceCents ?? 0);

              if (!updatedTicket.rewardPointsAwardedAt) {
                const rewardPoints = await awardRewardsPoints(ticketUserId, paidAmountCents, { ticketId, source: 'ticket payment' });
                if (rewardPoints > 0) {
                  await ticketsService.update(ticketId, { rewardPointsEarned: rewardPoints, rewardPointsAwardedAt: nowIso() });
                }

                // Culture Explorer: bonus points + quest progress for events
                // from cultures the user wants to explore (idempotent on eventId).
                try {
                  await awardCultureExplorerOnTicketPaid({
                    uid: ticketUserId,
                    ticketId,
                    eventId: updatedTicket.eventId,
                    paidAmountCents,
                  });
                } catch (err) {
                  console.error('[stripe] cultureExplorer.awardOnTicketPaid failed:', err);
                }

                // Increment ticket promo redemption count (for discount promos)
                if (updatedTicket?.promoCode) {
                  await db.collection('promoCodes').doc(updatedTicket.promoCode).update({
                    redeemedCount: firestore.FieldValue.increment(1),
                  }).catch(err => console.error(`[stripe] failed to increment redeemedCount for promo ${updatedTicket.promoCode}:`, err));
                }
              }

              if (!updatedTicket.cashbackCreditedAt) {
                const memberUser = await usersService.getById(ticketUserId);
                const membership = memberUser?.membership;
                const membershipSummary = buildMembershipResponse({
                  tier:      membership?.tier ?? 'free',
                  isActive:  membership?.isActive ?? false,
                  expiresAt: membership?.expiresAt ?? null,
                });
                if (membershipSummary.cashbackRate > 0) {
                  const cashbackCents = Math.max(0, Math.round(paidAmountCents * membershipSummary.cashbackRate));
                  if (cashbackCents > 0) {
                    await walletsService.addTransaction(ticketUserId, {
                      type: 'cashback',
                      amountCents: cashbackCents,
                      description: `CulturePass+ cashback (${Math.round(membershipSummary.cashbackRate * 100)}%)`,
                    });
                    await ticketsService.update(ticketId, { cashbackCents, cashbackCreditedAt: nowIso() });
                    await notificationsService.create({
                      userId:    ticketUserId,
                      title:     'Cashback credited',
                      message:   `$${(cashbackCents / 100).toFixed(2)} was added to your wallet from CulturePass+ cashback.`,
                      type:      'cashback',
                      metadata:  { ticketId, cashbackCents },
                    });
                  }
                }
              }
            }

          } else if (eventType === 'charge.refunded') {
            await db.runTransaction(async (transaction) => {
              const ticketRef = db.collection('tickets').doc(ticketId);
              const ticketDoc = await transaction.get(ticketRef);
              if (!ticketDoc.exists) {
                console.warn(`[stripe] Refund webhook for non-existent ticket: ${ticketId}`);
                return;
              }
              const ticketData = ticketDoc.data() as { eventId?: string; quantity?: number };
              const qty = ticketData.quantity ?? 1;
              transaction.update(ticketRef, { status: 'cancelled', paymentStatus: 'refunded' });
              if (ticketData.eventId) {
                transaction.update(db.collection('events').doc(ticketData.eventId), {
                  attending: firestore.FieldValue.increment(-qty),
                });
              }
            });
          }
        }

        return res.json({ received: true });
      } catch (err) {
        console.error(`[stripe] webhook processing failed for event ${event.id}:`, err);
        return res.status(500).json({ error: 'Webhook processing failed' });
      }
    }

    if (!sig) {
      console.error('[stripe] Webhook received without valid Stripe signature');
      return res.status(400).json({ error: 'Webhook signature required' });
    }
    // Signed request but we did not enter the verified branch — misconfiguration (no secret key,
    // missing STRIPE_WEBHOOK_SECRET, or raw body not captured). Fail loudly so Stripe retries.
    console.error(
      '[stripe] Webhook signature present but verification skipped — check STRIPE_API_KEY/STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and express.json verify (rawBody)',
    );
    return res.status(503).json({ error: 'Webhook verification unavailable' });
  });

  return router;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
