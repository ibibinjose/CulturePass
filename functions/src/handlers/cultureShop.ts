/**
 * CultureShop + CultureMarket API
 *
 * Two sub-systems:
 *  1. CultureShop Daily Deals — CulturePass-managed promotions, rewards,
 *     offers, and featured tiles (/api/culture-shop/*)
 *  2. CultureMarket Listings — host-created products, services, and website
 *     links (/api/culture-market/*, with legacy /api/culture-shop/* aliases)
 *
 * Publishers for daily deals: moderators+ OR organisers with
 *   users/{uid}.approvedMarketplacePublisher == true
 * Listing CRUD: any authenticated user can create; owner or admin can edit/delete.
 */

import { Router } from 'express';
import { z } from 'zod';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, ROLE_RANK, userRank, type RequestUser } from '../middleware/auth';
import { usersService } from '../services/firestore';
import { captureRouteError, nowIso, parseBody, qparam, qstr } from './utils';
import { logger } from 'firebase-functions';
import type { DailyDeal } from '../../../shared/schema/dailyDeal';
import type {
  ShopListing,
  ShopListingCategory,
  ShopListingType,
  ShopListingStatus,
  ShopListingsResponse,
} from '../../../shared/schema/cultureShopListing';
import { buildMarketplaceFeed, mockMarketplaceFeed } from '../services/cultureShopFeed';

export const cultureShopRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function canManageDailyDeals(user: RequestUser): Promise<boolean> {
  const rank = userRank(user);
  if (rank >= ROLE_RANK['moderator']) return true;
  if (rank >= ROLE_RANK['organizer']) {
    const doc = await usersService.getById(user.id);
    return doc?.approvedMarketplacePublisher === true;
  }
  return false;
}

function isOwner(listing: ShopListing, userId: string, userRole: string): boolean {
  return listing.sellerUserId === userId || userRole === 'admin' || userRole === 'moderator';
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const DealCreateSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional().nullable(),
  kind: z.enum(['reward', 'offer', 'featured']),
  href: z.string().min(1),
  perkId: z.string().optional().nullable(),
  linkPolicy: z.enum(['public', 'premium_required']),
  coverUrl: z.string().url().optional().nullable(),
  accentKey: z.enum(['indigo', 'violet', 'teal', 'coral']).optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.enum(['draft', 'active']).optional(),
  priority: z.number().int().optional(),
});
const DealUpdateSchema = DealCreateSchema.partial();

const ListingCreateSchema = z.object({
  type: z.enum(['product', 'service', 'link']),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  category: z.string().min(1).max(80),
  subcategory: z.string().max(80).optional().nullable(),
  priceCents: z.number().int().min(0).optional().nullable(),
  isFree: z.boolean(),
  currency: z.string().length(3).optional(),
  imageUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  accentKey: z.enum(['violet', 'coral', 'teal', 'gold']).optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(4).optional().nullable(),
  isOnline: z.boolean().optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  cultureTag: z.string().max(60).optional().nullable(),
  cultureTags: z.array(z.string().max(80)).max(10).optional(),
  cityTags: z.array(z.string().max(60)).max(10).optional(),
  sellerName: z.string().min(1).max(120).optional(),
});
const ListingUpdateSchema = ListingCreateSchema.partial().extend({
  status: z.enum(['draft', 'active', 'sold', 'paused']).optional(),
});

// ─── Mock daily deals ─────────────────────────────────────────────────────────

function mockDailyDeals(): DailyDeal[] {
  const today = new Date();
  const end = new Date(today); end.setHours(23, 59, 59, 999);
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const endsIso = end.toISOString();
  const startsIso = start.toISOString();
  return [
    {
      id: 'mock-reward',
      title: 'Rewards & points',
      subtitle: 'Earn on tickets and redeem partner perks',
      kind: 'reward',
      href: '/payment/wallet',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 30,
      createdAt: startsIso,
      createdBy: 'system',
    },
    {
      id: 'mock-offer-all',
      title: 'Member offers',
      subtitle: 'Browse cultural perks near you',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 20,
      createdAt: startsIso,
      createdBy: 'system',
    },
    {
      id: 'mock-offer-plus',
      title: 'CulturePass+ exclusives',
      subtitle: 'Extra savings for subscribers',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'premium_required',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 10,
      createdAt: startsIso,
      createdBy: 'system',
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Daily Deals routes
// ═══════════════════════════════════════════════════════════════════════════════

cultureShopRouter.get(['/culture-market/feed', '/culture-shop/feed'], async (req, res) => {
  try {
    const city = qstr(req.query.city).trim() || undefined;
    const country = qstr(req.query.country).trim() || undefined;
    const feed = await buildMarketplaceFeed({ city, country });
    return res.json(feed);
  } catch (err) {
    captureRouteError(err, 'GET /culture-shop/feed');
    return res.json(mockMarketplaceFeed());
  }
});

cultureShopRouter.get('/culture-shop/daily-deals', async (_req, res) => {
  try {
    if (!isFirestoreConfigured) return res.json({ deals: mockDailyDeals() });
    const snap = await db.collection('dailyDeals').where('status', '==', 'active').limit(120).get();
    const now = Date.now();
    const deals = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as DailyDeal)
      .filter((deal) => {
        const s = Date.parse(deal.startsAt), e = Date.parse(deal.endsAt);
        return !Number.isNaN(s) && !Number.isNaN(e) && s <= now && e >= now;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return res.json({ deals: deals.length ? deals : mockDailyDeals() });
  } catch (err) {
    captureRouteError(err, 'GET /culture-shop/daily-deals');
    return res.json({ deals: mockDailyDeals() });
  }
});

cultureShopRouter.post('/culture-shop/daily-deals', requireAuth, async (req, res) => {
  try {
    if (!(await canManageDailyDeals(req.user!))) return res.status(403).json({ error: 'Forbidden' });
    const payload = parseBody(DealCreateSchema, req.body);
    const ref = db.collection('dailyDeals').doc();
    const createdAt = nowIso();
    const deal: DailyDeal = {
      id: ref.id,
      title: payload.title,
      subtitle: payload.subtitle ?? null,
      kind: payload.kind,
      href: payload.href,
      perkId: payload.perkId ?? null,
      linkPolicy: payload.linkPolicy,
      coverUrl: payload.coverUrl ?? null,
      accentKey: payload.accentKey ?? null,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status ?? 'active',
      priority: payload.priority ?? 0,
      createdAt,
      createdBy: req.user!.id,
    };
    await ref.set(deal);
    return res.status(201).json(deal);
  } catch (err) {
    captureRouteError(err, 'POST /culture-shop/daily-deals');
    return res.status(400).json({ error: 'Failed to create daily deal' });
  }
});

cultureShopRouter.put('/culture-shop/daily-deals/:id', requireAuth, async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    if (!(await canManageDailyDeals(req.user!))) return res.status(403).json({ error: 'Forbidden' });
    const patch = parseBody(DealUpdateSchema, req.body);
    const ref = db.collection('dailyDeals').doc(id);
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Not found' });
    await ref.update({ ...patch, updatedAt: nowIso() });
    const next = await ref.get();
    return res.json({ id: next.id, ...(next.data() as object) });
  } catch (err) {
    captureRouteError(err, `PUT /culture-shop/daily-deals/${id}`);
    return res.status(400).json({ error: 'Failed to update daily deal' });
  }
});

cultureShopRouter.delete('/culture-shop/daily-deals/:id', requireAuth, async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    if (!(await canManageDailyDeals(req.user!))) return res.status(403).json({ error: 'Forbidden' });
    await db.collection('dailyDeals').doc(id).delete();
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, `DELETE /culture-shop/daily-deals/${id}`);
    return res.status(500).json({ error: 'Failed to delete daily deal' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Listings routes
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /culture-market/listings?category=&type=&city=&country=&page=&limit=&featured=&mine= */
cultureShopRouter.get(['/culture-market/listings', '/culture-shop/listings'], async (req, res) => {
  try {
    const category = qstr(req.query.category) as ShopListingCategory | '' || undefined;
    const type = qstr(req.query.type) as ShopListingType | '' || undefined;
    const city = qstr(req.query.city) || undefined;
    const country = qstr(req.query.country) || undefined;
    const status = (qstr(req.query.status) || 'active') as ShopListingStatus;
    const limit = Math.min(48, Math.max(1, parseInt(qstr(req.query.limit) || '24', 10)));
    const featured = qstr(req.query.featured) === 'true';
    const mine = qstr(req.query.mine) === 'true';

    if (mine) {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      if (!isFirestoreConfigured) {
        return res.json({ listings: [], total: 0, hasMore: false } as ShopListingsResponse);
      }
      const snap = await db.collection('cultureShopListings').where('sellerUserId', '==', req.user.id).limit(100).get();
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as ShopListing);
      all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      const slice = all.slice(0, limit);
      return res.json({ listings: slice, total: slice.length, hasMore: all.length > limit } as ShopListingsResponse);
    }

    if (!isFirestoreConfigured) {
      return res.json({ listings: [], total: 0, hasMore: false } as ShopListingsResponse);
    }

    let q: FirebaseFirestore.Query = db.collection('cultureShopListings').where('status', '==', status);
    if (category) q = q.where('category', '==', category);
    if (type) q = q.where('type', '==', type);
    if (city) q = q.where('city', '==', city);
    if (country) q = q.where('country', '==', country);
    if (featured) q = q.where('isFeatured', '==', true);
    q = q.orderBy('createdAt', 'desc').limit(limit + 1);

    let snap: FirebaseFirestore.QuerySnapshot;
    try {
      snap = await q.get();
    } catch (err: any) {
      const isIndexError = err?.code === 9 || /index/i.test(err?.message || '');
      if (!isIndexError) throw err;
      logger.warn('culture-shop listings: Missing index for filters + createdAt. Falling back to in-memory sort.');
      // Fallback without orderBy
      let fbQ: FirebaseFirestore.Query = db.collection('cultureShopListings').where('status', '==', status);
      if (category) fbQ = fbQ.where('category', '==', category);
      if (type) fbQ = fbQ.where('type', '==', type);
      if (city) fbQ = fbQ.where('city', '==', city);
      if (country) fbQ = fbQ.where('country', '==', country);
      if (featured) fbQ = fbQ.where('isFeatured', '==', true);
      const fbSnap = await fbQ.limit(limit * 2).get();
      let all = fbSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as ShopListing);
      all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      const hasMore = all.length > limit;
      return res.json({ listings: all.slice(0, limit), total: all.slice(0, limit).length, hasMore } as ShopListingsResponse);
    }

    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as ShopListing);
    const hasMore = all.length > limit;
    return res.json({ listings: all.slice(0, limit), total: all.slice(0, limit).length, hasMore } as ShopListingsResponse);
  } catch (err) {
    captureRouteError(err, 'GET /culture-shop/listings');
    return res.json({ listings: [], total: 0, hasMore: false } as ShopListingsResponse);
  }
});

/** GET /culture-market/listings/:id */
cultureShopRouter.get(['/culture-market/listings/:id', '/culture-shop/listings/:id'], async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    if (!isFirestoreConfigured) {
      return res.status(404).json({ error: 'Not found' });
    }
    const snap = await db.collection('cultureShopListings').doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    snap.ref.update({ viewCount: ((snap.data()?.viewCount as number) ?? 0) + 1 }).catch(() => {});
    return res.json({ id: snap.id, ...(snap.data() as object) });
  } catch (err) {
    captureRouteError(err, `GET /culture-shop/listings/${id}`);
    return res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

/** POST /culture-market/listings */
cultureShopRouter.post(['/culture-market/listings', '/culture-shop/listings'], requireAuth, async (req, res) => {
  try {
    const payload = parseBody(ListingCreateSchema, req.body);
    const user = req.user!;
    const sellerName = payload.sellerName ?? user.username ?? 'CulturePass Seller';
    const ref = db.collection('cultureShopListings').doc();
    const now = nowIso();
    const listing: ShopListing = {
      id: ref.id,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      subcategory: payload.subcategory ?? undefined,
      priceCents: payload.priceCents ?? null,
      isFree: payload.isFree,
      currency: payload.currency ?? 'AUD',
      imageUrl: payload.imageUrl ?? null,
      logoUrl: payload.logoUrl ?? null,
      accentKey: payload.accentKey ?? 'violet',
      sellerName,
      sellerUserId: user.id,
      sellerProfileId: null,
      sellerAvatarUrl: null,
      externalUrl: payload.externalUrl ?? null,
      contactEmail: payload.contactEmail ?? null,
      contactPhone: payload.contactPhone ?? null,
      city: payload.city ?? null,
      country: payload.country ?? null,
      isOnline: payload.isOnline ?? false,
      status: 'active',
      isFeatured: false,
      tags: payload.tags ?? [],
      cultureTag: payload.cultureTag ?? null,
      cultureTags: payload.cultureTags ?? [],
      cityTags: payload.cityTags ?? [],
      viewCount: 0,
      saveCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(listing);
    return res.status(201).json(listing);
  } catch (err) {
    captureRouteError(err, 'POST /culture-shop/listings');
    return res.status(400).json({ error: 'Failed to create listing' });
  }
});

/** PUT /culture-market/listings/:id */
cultureShopRouter.put(['/culture-market/listings/:id', '/culture-shop/listings/:id'], requireAuth, async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const ref = db.collection('cultureShopListings').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const existing = { id: snap.id, ...(snap.data() as object) } as ShopListing;
    if (!isOwner(existing, req.user!.id, req.user!.role)) return res.status(403).json({ error: 'Forbidden' });
    const patch = parseBody(ListingUpdateSchema, req.body);
    await ref.update({ ...patch, updatedAt: nowIso() });
    const next = await ref.get();
    return res.json({ id: next.id, ...(next.data() as object) });
  } catch (err) {
    captureRouteError(err, `PUT /culture-shop/listings/${id}`);
    return res.status(400).json({ error: 'Failed to update listing' });
  }
});

/** DELETE /culture-market/listings/:id */
cultureShopRouter.delete(['/culture-market/listings/:id', '/culture-shop/listings/:id'], requireAuth, async (req, res) => {
  const id = qparam(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const ref = db.collection('cultureShopListings').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const existing = { id: snap.id, ...(snap.data() as object) } as ShopListing;
    if (!isOwner(existing, req.user!.id, req.user!.role)) return res.status(403).json({ error: 'Forbidden' });
    await ref.delete();
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, `DELETE /culture-shop/listings/${id}`);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

/** GET /culture-market/categories */
cultureShopRouter.get(['/culture-market/categories', '/culture-shop/categories'], async (_req, res) => {
  try {
    if (!isFirestoreConfigured) {
      return res.json({ categories: [] });
    }
    const snap = await db.collection('cultureShopListings').where('status', '==', 'active').get();
    const counts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const cat = (d.data() as ShopListing).category;
      if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return res.json({ categories: Object.entries(counts).map(([id, count]) => ({ id, count })) });
  } catch (err) {
    captureRouteError(err, 'GET /culture-shop/categories');
    return res.json({ categories: [] });
  }
});
