/**
 * Membership routes — /api/membership/*
 *
 * CulturePass+ subscription management via Stripe.
 * Endpoints: member-count, get by userId, subscribe, billing-portal, cancel-subscription.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type Stripe from 'stripe';
import { requireAuth, requireRevocationCheck, isOwnerOrAdmin, isAdminUser } from '../middleware/auth';
import { usersService } from '../services/firestore';
import { db, stripeClient } from '../admin';
import { buildMembershipResponse, nowIso, qparam,
  captureRouteError,
} from './utils';
import { resolveMembershipStripePriceId } from '../services/pricing';

export const membershipRouter = Router();

// ── GET /api/membership/member-count ─────────────────────────────────────────
// Public — used on the upgrade screen to show social proof ("X members")
membershipRouter.get('/membership/member-count', async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('users')
      .where('membership.isActive', '==', true)
      .select() // fetch only document IDs to minimise read cost
      .get();
    return res.json({ count: snap.size });
  } catch (err) {
    captureRouteError(err, 'membership/member-count');
    return res.status(500).json({ error: 'Failed to count members' });
  }
});

// ── GET /api/membership/intro-eligibility ────────────────────────────────────
// Authenticated — whether first-time subscriber Stripe coupon can apply
membershipRouter.get('/membership/intro-eligibility', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const couponConfigured = Boolean(process.env.STRIPE_COUPON_FIRST_PREMIUM_HALF_OFF?.trim());
    const alreadyPlus =
      user.membership?.isActive === true &&
      (user.membership?.tier ?? 'free') !== 'free';
    const introConsumed = Boolean(user.premiumIntroDiscountUsedAt);

    const eligible = couponConfigured && !alreadyPlus && !introConsumed;

    return res.json({
      eligible,
      percentOff: 50,
      headline: 'First-time CulturePass+ subscribers save 50%',
      detail: eligible
        ? 'Your first subscription checkout includes this discount when configured on the server.'
        : 'Intro pricing is only available once per account.',
    });
  } catch (err) {
    captureRouteError(err, 'membership/intro-eligibility');
    return res.status(500).json({ error: 'Failed to check intro offer' });
  }
});

// ── GET /api/membership/:userId ───────────────────────────────────────────────
// Owner or admin only
membershipRouter.get('/membership/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = qparam(req.params['userId']);
  if (!isOwnerOrAdmin(req.user!, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const m = user.membership;
  return res.json(buildMembershipResponse({
    tier:     m?.tier ?? 'free',
    isActive: m?.isActive ?? false,
    expiresAt: m?.expiresAt ?? null,
  }));
});

// ── POST /api/membership/subscribe ───────────────────────────────────────────
const subscribeSchema = z.object({
  billingPeriod: z.enum(['monthly', 'yearly']),
  promoCode: z.string().optional(),
  /** Optional override; defaults to users/{uid}.country */
  country: z.string().optional(),
});

membershipRouter.post('/membership/subscribe', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
  let parsed: z.infer<typeof subscribeSchema>;
  try {
    parsed = subscribeSchema.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'billingPeriod must be "monthly" or "yearly"' });
  }

  const userId = req.user!.id;
  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const m = user.membership;
  const alreadyActive = m?.isActive === true && (m?.tier ?? 'free') !== 'free';
  if (alreadyActive) {
    return res.json({
      checkoutUrl: null,
      alreadyActive: true,
      membership: buildMembershipResponse({ tier: m?.tier, isActive: m?.isActive, expiresAt: m?.expiresAt }),
    });
  }

  if (!stripeClient) {
    return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
  }

  // Handle promo code directly if passed
  let stripePromoCodeId: string | undefined;
  let redeemedDirectly = false;
  let directExpiry: string | null = null;

  if (parsed.promoCode) {
    const code = parsed.promoCode.trim().toUpperCase();
    const snap = await db.collection('promoCodes')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!snap.empty) {
      const promo = snap.docs[0].data();
      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'This promo code has expired' });
      }
      if (promo.maxUses !== null && (promo.usedCount ?? 0) >= promo.maxUses) {
        return res.status(400).json({ error: 'This promo code has reached its usage limit' });
      }
      if ((promo.usedBy ?? []).includes(userId)) {
        return res.status(400).json({ error: 'You have already used this promo code' });
      }

      if (promo.type === 'free_plus') {
        const durationDays: number = promo.durationDays ?? 30;
        const base =
          user.membership?.isActive && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date()
            ? new Date(user.membership.expiresAt)
            : new Date();
        base.setDate(base.getDate() + durationDays);
        directExpiry = base.toISOString();

        await usersService.upsert(userId, {
          membership: {
            tier: 'plus',
            isActive: true,
            expiresAt: directExpiry,
          },
        });

        await snap.docs[0].ref.update({
          usedCount: (promo.usedCount ?? 0) + 1,
          usedBy: [...(promo.usedBy ?? []), userId],
        });

        redeemedDirectly = true;
      } else if (promo.type === 'stripe_coupon' && promo.stripeCouponId) {
        stripePromoCodeId = promo.stripeCouponId;
      } else if (promo.type === 'ticket_discount') {
        return res.status(400).json({ error: 'This code is only valid for event tickets.' });
      } else {
        return res.status(400).json({ error: 'Unsupported promo code type' });
      }
    } else {
      // Check Stripe directly
      try {
        const stripePromos = await stripeClient.promotionCodes.list({
          code: code,
          active: true,
          limit: 1,
        });
        if (stripePromos.data.length > 0) {
          stripePromoCodeId = stripePromos.data[0].id;
        } else {
          return res.status(400).json({ error: 'Invalid or expired promotional code' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid promotional code' });
      }
    }
  }

  if (redeemedDirectly && directExpiry) {
    return res.json({
      checkoutUrl: null,
      alreadyActive: false,
      devMode: false,
      redeemedDirectly: true,
      membership: buildMembershipResponse({ tier: 'plus', isActive: true, expiresAt: directExpiry }),
    });
  }

  const billingCountry = parsed.country?.trim() || user.country || undefined;
  let priceId: string;
  let pricingPlanMeta: { market: string; currency: string; amountCents: number; stripePriceId: string } | undefined;
  try {
    const resolved = await resolveMembershipStripePriceId(parsed.billingPeriod, billingCountry);
    priceId = resolved.priceId;
    pricingPlanMeta = {
      market: resolved.market.code,
      currency: resolved.plan.currency,
      amountCents: resolved.plan.amountCents,
      stripePriceId: resolved.plan.stripePriceId!,
    };
  } catch {
    return res.status(503).json({ error: 'Subscription price not configured', code: 'PRICE_NOT_CONFIGURED' });
  }

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: user.displayName ?? user.username ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    await usersService.upsert(userId, { stripeCustomerId });
  }

  const appUrl = process.env.APP_URL ?? 'https://culturepass.app';

  const introCoupon = process.env.STRIPE_COUPON_FIRST_PREMIUM_HALF_OFF?.trim();
  const introEligible =
    Boolean(introCoupon) &&
    !user.premiumIntroDiscountUsedAt &&
    !stripePromoCodeId;

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: {
        userId,
        billingMarket: pricingPlanMeta?.market ?? '',
        billingCountry: billingCountry ?? '',
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          billingMarket: pricingPlanMeta?.market ?? '',
          billingCountry: billingCountry ?? '',
        },
      },
      success_url: `${appUrl}/membership/upgrade?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${appUrl}/membership/upgrade?status=cancelled`,
    };

    if (stripePromoCodeId) {
      if (stripePromoCodeId.startsWith('promo_')) {
        sessionParams.discounts = [{ promotion_code: stripePromoCodeId }];
      } else {
        sessionParams.discounts = [{ coupon: stripePromoCodeId }];
      }
    } else if (introEligible) {
      sessionParams.discounts = [{ coupon: introCoupon! }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      introDiscountApplied: introEligible && !stripePromoCodeId,
      pricing: pricingPlanMeta,
    });
  } catch (err) {
    captureRouteError(err, 'membership/subscribe');
    return res.status(500).json({ error: 'Failed to create subscription checkout' });
  }
});

// ── POST /api/membership/billing-portal ─────────────────────────────────────
membershipRouter.post('/membership/billing-portal', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!stripeClient) {
    return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
  }

  const stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    return res.status(400).json({ error: 'No Stripe customer found', code: 'CUSTOMER_NOT_FOUND' });
  }

  const appUrl = process.env.APP_URL ?? 'https://culturepass.app';

  try {
    const session = await stripeClient.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/membership/upgrade`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    captureRouteError(err, 'membership/billing-portal');
    return res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// ── POST /api/membership/cancel-subscription ─────────────────────────────────
membershipRouter.post('/membership/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  if (!stripeClient) {
    return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
  }

  try {
    // Cancel at period end — user retains access until their paid period expires
    await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const m = user.membership;
    return res.json({
      success: true,
      membership: buildMembershipResponse({ tier: m?.tier, isActive: m?.isActive, expiresAt: m?.expiresAt }),
    });
  } catch (err) {
    captureRouteError(err, 'membership/cancel-subscription');
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ── POST /api/membership/admin-grant ─────────────────────────────────────────
// Admin only — directly grants CulturePass+ to a user for N days.
const adminGrantSchema = z.object({
  userId:      z.string().min(1),
  durationDays: z.number().int().min(1).max(3650).default(30),
  note:        z.string().max(200).optional(),
});

membershipRouter.post('/membership/admin-grant', requireAuth, async (req: Request, res: Response) => {
  if (!isAdminUser(req.user!)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  let parsed: z.infer<typeof adminGrantSchema>;
  try { parsed = adminGrantSchema.parse(req.body); }
  catch { return res.status(400).json({ error: 'Invalid request body' }); }

  try {
    const user = await usersService.getById(parsed.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Extend from today (or existing expiry if still active)
    const base =
      user.membership?.isActive && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date()
        ? new Date(user.membership.expiresAt)
        : new Date();
    base.setDate(base.getDate() + parsed.durationDays);
    const expiresIso = base.toISOString();

    await usersService.upsert(parsed.userId, {
      membership: {
        tier: 'plus',
        isActive: true,
        expiresAt: expiresIso,
      },
    });

    // Lightweight audit record
    await db.collection('auditLogs').add({
      action: 'admin_grant_plus',
      actorId: req.user!.id,
      targetUserId: parsed.userId,
      durationDays: parsed.durationDays,
      expiresAt: expiresIso,
      note: parsed.note ?? null,
      createdAt: nowIso(),
    });

    return res.json({
      success: true,
      expiresAt: expiresIso,
      membership: buildMembershipResponse({ tier: 'plus', isActive: true, expiresAt: expiresIso }),
    });
  } catch (err) {
    captureRouteError(err, 'membership/admin-grant');
    return res.status(500).json({ error: 'Failed to grant membership' });
  }
});

// ── POST /api/membership/redeem-code ─────────────────────────────────────────
// Authenticated user redeems a promo code for free Plus access or validates Stripe discount.
membershipRouter.post('/membership/redeem-code', requireAuth, async (req: Request, res: Response) => {
  const rawCode = req.body?.code;
  if (!rawCode || typeof rawCode !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }
  const code = rawCode.trim().toUpperCase();
  const userId = req.user!.id;

  try {
    const snap = await db.collection('promoCodes')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) {
      // Check Stripe directly
      if (stripeClient) {
        try {
          const stripePromos = await stripeClient.promotionCodes.list({
            code: code,
            active: true,
            limit: 1,
          });
          if (stripePromos.data.length > 0) {
            const promoObj = stripePromos.data[0];
            const coupon = (promoObj as any).coupon;
            let discountDetail = 'Discount applied';
            if (coupon.percent_off) {
              discountDetail = `${coupon.percent_off}% off`;
            } else if (coupon.amount_off) {
              const formattedAmount = (coupon.amount_off / 100).toLocaleString('en-US', { style: 'currency', currency: coupon.currency || 'USD' });
              discountDetail = `${formattedAmount} off`;
            }
            return res.json({
              success: true,
              type: 'stripe_discount',
              durationDays: 0,
              expiresAt: '',
              message: `Coupon "${code}" (${discountDetail}) validated! Click Unlock to checkout.`,
              membership: buildMembershipResponse({ tier: 'free', isActive: false, expiresAt: null }),
            });
          }
        } catch (err) {
          // Fall through
        }
      }
      return res.status(404).json({ error: 'Code not found or no longer active' });
    }

    const promoRef = snap.docs[0].ref;
    const promo = snap.docs[0].data();

    if (promo['expiresAt'] && new Date(promo['expiresAt']) < new Date()) {
      return res.status(400).json({ error: 'This code has expired' });
    }
    if (promo['maxUses'] !== null && (promo['usedCount'] ?? 0) >= promo['maxUses']) {
      return res.status(400).json({ error: 'This code has reached its usage limit' });
    }
    if ((promo['usedBy'] ?? []).includes(userId)) {
      return res.status(400).json({ error: 'You have already used this code' });
    }

    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (promo['type'] === 'free_plus') {
      const durationDays: number = promo['durationDays'] ?? 30;

      const base =
        user.membership?.isActive && user.membership?.expiresAt && new Date(user.membership.expiresAt) > new Date()
          ? new Date(user.membership.expiresAt)
          : new Date();
      base.setDate(base.getDate() + durationDays);
      const expiresIso = base.toISOString();

      await usersService.upsert(userId, {
        membership: {
          tier: 'plus',
          isActive: true,
          expiresAt: expiresIso,
        },
      });

      await promoRef.update({
        usedCount: (promo['usedCount'] ?? 0) + 1,
        usedBy: [...(promo['usedBy'] ?? []), userId],
      });

      return res.json({
        success: true,
        type: 'free_plus',
        durationDays,
        expiresAt: expiresIso,
        membership: buildMembershipResponse({ tier: 'plus', isActive: true, expiresAt: expiresIso }),
      });
    } else if (promo['type'] === 'stripe_coupon') {
      return res.json({
        success: true,
        type: 'stripe_discount',
        durationDays: 0,
        expiresAt: '',
        message: `Stripe discount "${code}" validated! Click Unlock to checkout.`,
        membership: buildMembershipResponse({ tier: 'free', isActive: false, expiresAt: null }),
      });
    }

    return res.status(400).json({ error: 'Unsupported promo code type' });
  } catch (err) {
    captureRouteError(err, 'membership/redeem-code');
    return res.status(500).json({ error: 'Failed to redeem code' });
  }
});
