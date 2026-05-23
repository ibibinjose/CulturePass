import { db } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notificationsService } from './notifications';

export interface FirestorePerk {
  id: string;
  title: string;
  description: string;
  perkType: string;
  discountPercent: number | null;
  discountFixedCents: number | null;
  providerType: string;
  providerId: string;
  providerName: string;
  category: string;
  isMembershipRequired: boolean;
  requiredMembershipTier: string;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface FirestoreRedemption {
  id: string;
  perkId: string;
  userId: string;
  redeemedAt: string;
  /** Populated when Checkout completes for paid perks (webhook fulfillment). */
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  source?: string;
  status?: string;
}

const perksCol = () => db.collection('perks');
const redemptionsCol = () => db.collection('redemptions');

/** Same rules as manual redeem — stock, window, status (supports featured perks). */
export function isPerkRedeemable(perk: Record<string, unknown>): boolean {
  const status = String(perk.status ?? 'active').toLowerCase();
  if (status !== 'active' && status !== 'featured') return false;
  const expiresAt = typeof perk.expiresAt === 'string' ? Date.parse(perk.expiresAt) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return false;
  const usageLimit = Number(perk.usageLimit ?? 0);
  const usedCount = Number(perk.usedCount ?? 0);
  if (usageLimit > 0 && usedCount >= usageLimit) return false;
  return true;
}

/**
 * Record redemption after Stripe Checkout for a paid perk (callable `createCheckoutSession`).
 * Idempotent on `stripeCheckoutSessionId`. Does not enforce geo/LGA (payment already collected).
 */
export async function fulfillPaidPerkAfterStripeCheckout(params: {
  perkId: string;
  userId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
}): Promise<{ ok: true; redemptionId: string } | { ok: false; reason: string }> {
  const { perkId, userId, stripeSessionId, stripePaymentIntentId } = params;
  if (!perkId.trim() || !userId.trim() || !stripeSessionId.trim()) {
    return { ok: false, reason: 'missing_fields' };
  }

  const dup = await redemptionsCol().where('stripeCheckoutSessionId', '==', stripeSessionId).limit(1).get();
  if (!dup.empty) {
    return { ok: true, redemptionId: dup.docs[0]!.id };
  }

  const perkRef = perksCol().doc(perkId);
  const perkSnap = await perkRef.get();
  if (!perkSnap.exists) {
    return { ok: false, reason: 'perk_not_found' };
  }

  const perk = perkSnap.data() as Record<string, unknown>;
  const tier = String(perk.priceTier ?? 'free').toLowerCase();
  if (tier === 'free') {
    return { ok: false, reason: 'perk_not_paid_tier' };
  }

  if (!isPerkRedeemable(perk)) {
    return { ok: false, reason: 'perk_not_redeemable' };
  }

  const perUserLimit = Number(perk.perUserLimit ?? 0);
  if (perUserLimit > 0) {
    const count = await redemptionsService.countForUserAndPerk(userId, perkId);
    if (count >= perUserLimit) {
      return { ok: false, reason: 'per_user_limit' };
    }
  }

  const redemptionRef = redemptionsCol().doc();
  const redeemedAt = new Date().toISOString();
  const perkTitle = typeof perk.title === 'string' ? perk.title : 'your perk';

  try {
    await db.runTransaction(async (trx) => {
      const freshSnap = await trx.get(perkRef);
      if (!freshSnap.exists) throw new Error('perk_missing');
      const p = freshSnap.data() as Record<string, unknown>;
      if (!isPerkRedeemable(p)) throw new Error('perk_not_redeemable');

      trx.set(redemptionRef, {
        perkId,
        userId,
        redeemedAt,
        status: 'redeemed',
        source: 'stripe_checkout',
        stripeCheckoutSessionId: stripeSessionId,
        ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
      });

      trx.update(perkRef, {
        usedCount: FieldValue.increment(1),
        updatedAt: redeemedAt,
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'perk_not_redeemable' || msg === 'perk_missing') {
      return { ok: false, reason: msg };
    }
    throw err;
  }

  try {
    await notificationsService.create({
      userId,
      title: 'Perk unlocked',
      message: `Your purchase went through — ${perkTitle} is ready to use.`,
      type: 'perk',
      metadata: { perkId, redemptionId: redemptionRef.id, stripeCheckoutSessionId: stripeSessionId },
    });
  } catch (notifyErr) {
    console.warn('[perks] fulfillPaidPerk notification failed:', notifyErr);
  }

  return { ok: true, redemptionId: redemptionRef.id };
}

export const perksService = {
  async list(filters: { status?: FirestorePerk['status']; category?: string } = {}): Promise<FirestorePerk[]> {
    let query: FirebaseFirestore.Query = perksCol();
    if (filters.status) query = query.where('status', '==', filters.status);
    else query = query.where('status', '==', 'active');
    
    if (filters.category) query = query.where('category', '==', filters.category);
    
    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestorePerk[];
  },

  async getById(id: string): Promise<FirestorePerk | null> {
    const snap = await perksCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestorePerk;
  },

  async create(data: Omit<FirestorePerk, 'id' | 'createdAt' | 'usedCount'>): Promise<FirestorePerk> {
    const now = new Date().toISOString();
    const ref = perksCol().doc();
    const perk: FirestorePerk = { ...data, id: ref.id, createdAt: now, usedCount: 0 };
    await ref.set(perk);
    return perk;
  },

  async incrementUsed(id: string): Promise<void> {
    await perksCol().doc(id).update({ usedCount: FieldValue.increment(1) });
  },
};

export const redemptionsService = {
  async listForUser(userId: string): Promise<FirestoreRedemption[]> {
    const snap = await redemptionsCol()
      .where('userId', '==', userId)
      .orderBy('redeemedAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreRedemption[];
  },

  async countForUserAndPerk(userId: string, perkId: string): Promise<number> {
    const snap = await redemptionsCol()
      .where('userId', '==', userId)
      .where('perkId', '==', perkId)
      .count()
      .get();
    return snap.data().count;
  },

  async create(data: Omit<FirestoreRedemption, 'id' | 'redeemedAt'>): Promise<FirestoreRedemption> {
    const now = new Date().toISOString();
    const ref = redemptionsCol().doc();
    const redemption: FirestoreRedemption = { ...data, id: ref.id, redeemedAt: now };
    await ref.set(redemption);
    return redemption;
  },
};
