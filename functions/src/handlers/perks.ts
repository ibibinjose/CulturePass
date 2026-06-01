import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { parseBody, nowIso, captureRouteError, qparam, qstr } from './utils';
import type { Perk } from '../../../shared/schema/perk';
import { isPerkRedeemable } from '../services/perks';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RedeemSchema = z.object({
  userLat: z.number().optional(),
  userLng: z.number().optional(),
  userLgaCode: z.string().optional(),
});

export const perksRouter = Router();

type OwnedPerkData = {
  createdBy?: string | null;
  partnerId?: string | null;
};

const PerkCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  thumbhash: z.string().optional().nullable(),
  cultureTags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  priceTier: z.enum(['free', 'low', 'medium', 'high']).optional(),
  perkType: z.string().optional(),
  discountPercent: z.number().optional().nullable(),
  discountFixedCents: z.number().optional().nullable(),
  partnerId: z.string().optional().nullable(),
  partnerName: z.string().optional().nullable(),
  status: z.string().optional(),
  pointsCost: z.number().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().nullable(),
  isMembershipRequired: z.boolean().optional(),
  requiredMembershipTier: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lgaCode: z.string().optional().nullable(),
  councilId: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  radiusKm: z.number().positive().optional().nullable(),
});

const PerkUpdateSchema = PerkCreateSchema.partial();

/** GET /api/perks — list perks */
perksRouter.get('/perks', async (req, res) => {
  try {
    if (!isFirestoreConfigured) {
      return res.json([
        { id: 'p1', title: '20% Off Partner Cafes', description: 'Save on selected Sydney partner cafes.', perkType: 'discount_percent', discountPercent: 20, status: 'active' },
      ]);
    }

    const city = qstr(req.query.city).trim();
    const country = qstr(req.query.country).trim();
    const category = qstr(req.query.category).trim();
    const q = qstr(req.query.q).trim().toLowerCase();
    const status = qstr(req.query.status).trim() || 'active';
    const pageSize = Math.max(1, Math.min(150, Number(qstr(req.query.pageSize) || 120)));

    const snap = await db.collection('perks').where('status', '==', status).limit(pageSize).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter((perkDoc) => {
        const p = perkDoc as Record<string, unknown>;
        if (city && typeof p.city === 'string' && p.city !== city) return false;
        if (country && typeof p.country === 'string' && p.country !== country) return false;
        if (category) {
          const singleCategory = typeof p.category === 'string' ? p.category : '';
          const categories = Array.isArray(p.categories) ? p.categories : [];
          if (singleCategory !== category && !categories.includes(category)) return false;
        }
        if (q) {
          const haystack = `${String(p.title ?? '')} ${String(p.description ?? '')} ${String(p.partnerName ?? '')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

    return res.json({ perks: items });
  } catch (err) {
    captureRouteError(err, 'GET /api/perks');
    return res.status(500).json({ error: 'Failed to list perks' });
  }
});

/** GET /api/perks/:id — perk detail */
perksRouter.get('/perks/:id', async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid perk id' });

  if (!isFirestoreConfigured) {
    return res.json({ id, title: 'Mock Perk', description: 'Mock perk detail', status: 'active' });
  }

  try {
    const doc = await db.collection('perks').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Perk not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    captureRouteError(err, `GET /api/perks/${id}`);
    return res.status(500).json({ error: 'Failed to load perk' });
  }
});

/** POST /api/perks — create new perk */
perksRouter.post('/perks', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), async (req, res) => {
  try {
    const payload = parseBody(PerkCreateSchema, req.body);
    const ref = db.collection('perks').doc();
    const createdAt = nowIso();
    const perk = {
      id: ref.id,
      ...payload,
      status: payload.status ?? 'active',
      usedCount: 0,
      createdAt,
      createdBy: req.user!.id,
    };
    await ref.set(perk);
    return res.status(201).json(perk);
  } catch (err) {
    captureRouteError(err, 'POST /api/perks');
    return res.status(400).json({ error: 'Failed to create perk' });
  }
});

/** PUT /api/perks/:id — update perk */
perksRouter.put('/perks/:id', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid perk id' });
  try {
    const patch = parseBody(PerkUpdateSchema, req.body);
    const ref = db.collection('perks').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Perk not found' });
    const existing = snap.data() as OwnedPerkData;
    let ownerId = existing.createdBy ?? null;
    if (!ownerId && existing.partnerId) {
      const profile = await db.collection('profiles').doc(existing.partnerId).get();
      ownerId = (profile.data() as { ownerId?: string } | undefined)?.ownerId ?? null;
    }
    if (!isOwnerOrAdmin(req.user!, ownerId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await ref.update({ ...patch, updatedAt: nowIso() });
    const next = await ref.get();
    return res.json({ id: next.id, ...next.data() });
  } catch (err) {
    captureRouteError(err, `PUT /api/perks/${id}`);
    return res.status(400).json({ error: 'Failed to update perk' });
  }
});

/** DELETE /api/perks/:id — delete perk */
perksRouter.delete('/perks/:id', requireAuth, requireRole('admin', 'platformAdmin'), async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid perk id' });
  try {
    await db.collection('perks').doc(id).delete();
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, `DELETE /api/perks/${id}`);
    return res.status(500).json({ error: 'Failed to delete perk' });
  }
});

/** POST /api/perks/:id/redeem — redeem a perk */
perksRouter.post('/perks/:id/redeem', requireAuth, async (req, res) => {
  const id = qparam(req.params.id);
  const userId = req.user!.id;

  if (isFirestoreConfigured) {
    try {
      const { userLat, userLng, userLgaCode } = parseBody(RedeemSchema, req.body);
      const perkDoc = await db.collection('perks').doc(id).get();
      if (!perkDoc.exists) return res.status(404).json({ error: 'Perk not found' });
      
      const perk = perkDoc.data() as Perk;
      if (!isPerkRedeemable(perk as unknown as Record<string, unknown>)) {
        return res.status(403).json({ error: 'This offer is not currently redeemable.' });
      }

      // Optional tier gate: require a minimum membership tier when configured on perk.
      const requiredTier = String((perk as unknown as { requiredTier?: string }).requiredTier ?? perk.requiredMembershipTier ?? '').trim().toLowerCase();
      if (requiredTier && requiredTier !== 'free') {
        const userSnap = await db.collection('users').doc(userId).get();
        const userTier = String((userSnap.data() as { membership?: { tier?: string } } | undefined)?.membership?.tier ?? 'free')
          .trim()
          .toLowerCase();
        const rank: Record<string, number> = {
          free: 0,
          basic: 1,
          plus: 2,
          elite: 3,
          pro: 4,
          premium: 5,
          vip: 6
        };
        if ((rank[userTier] ?? 0) < (rank[requiredTier] ?? Number.MAX_SAFE_INTEGER)) {
          return res.status(403).json({ error: `This perk requires ${requiredTier} membership or higher.` });
        }
      }

      const perUserLimit = Number((perk as unknown as Record<string, unknown>).perUserLimit ?? 0);
      if (perUserLimit > 0) {
        const myUsesSnap = await db.collection('redemptions')
          .where('perkId', '==', id)
          .where('userId', '==', userId)
          .count()
          .get();
        if (myUsesSnap.data().count >= perUserLimit) {
          return res.status(403).json({ error: 'You have reached the redemption limit for this offer.' });
        }
      }

      // 1. Council validation
      if (perk.lgaCode && perk.lgaCode !== userLgaCode) {
        return res.status(403).json({ error: `This perk is exclusively available in ${perk.lgaCode}.` });
      }

      // 2. Geofence Distance validation
      if (perk.lat && perk.lng && perk.radiusKm) {
        if (!userLat || !userLng) {
          return res.status(400).json({ error: 'Location coordinates must be provided to unlock this local perk.' });
        }
        const distKm = getDistanceKm(perk.lat, perk.lng, userLat, userLng);
        if (distKm > perk.radiusKm) {
          return res.status(403).json({ error: `You are too far! Must be within ${perk.radiusKm}km to redeem.` });
        }
      }

      const ref = db.collection('redemptions').doc();
      await db.runTransaction(async (trx) => {
        trx.set(ref, {
          perkId: id,
          userId,
          redeemedAt: nowIso(),
          status: 'redeemed',
        });
        trx.update(db.collection('perks').doc(id), {
          usedCount: FieldValue.increment(1),
          updatedAt: nowIso(),
        });
      });

      return res.json({
        success: true,
        redemption: {
          id: ref.id,
          perkId: id,
          userId,
          redeemedAt: nowIso(),
          code: `CP-${id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    } catch (err) {
      captureRouteError(err, `POST /api/perks/${id}/redeem`);
      return res.status(500).json({ error: 'Failed to redeem perk' });
    }
  }
  return res.json({
    success: true,
    redemption: {
      id: randomUUID(),
      perkId: id,
      userId,
      redeemedAt: nowIso(),
      code: `CP-${id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    },
  });
});

/** GET /api/redemptions — current user redemptions */
perksRouter.get('/redemptions', requireAuth, async (req, res) => {
  try {
    if (!isFirestoreConfigured) return res.json({ redemptions: [] });
    const snap = await db
      .collection('redemptions')
      .where('userId', '==', req.user!.id)
      .orderBy('redeemedAt', 'desc')
      .limit(200)
      .get();
    return res.json({ redemptions: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    captureRouteError(err, 'GET /api/redemptions');
    return res.status(500).json({ error: 'Failed to load redemptions' });
  }
});
