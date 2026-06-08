/**
 * Events routes — /api/events/*
 *
 * Uses a factory function so that in-memory dev fallbacks (events, councils,
 * feedback store) defined in app.ts can be injected without creating a
 * circular import.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, isOwnerOrAdmin, requireRevocationCheck } from '../middleware/auth';
import { sendToUsers } from '../services/fcmService';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import { moderationCheck } from '../middleware/moderation';
import {
  eventFeedbackService,
} from '../services/firestore';
import {
  nowIso,
  qparam,
  qstr,
  generateSecureId,
  resolveAustralianLocation,
  type ResolvedLocation,
  captureRouteError,
  parseBody,
  respondIfValidationError,
} from './utils';
import { optionalEmailField, optionalIntField, optionalStringField } from '../schemas/common';
import { FieldValue } from 'firebase-admin/firestore';
import { db, isFirestoreConfigured } from '../admin';
import { validatePublisherProfileLink, validateVenueProfileLink } from '../services/eventProfileLinks';
import {
  resolveTicketOrderPricing,
  resolveTicketOrderPricingWithPromo,
  TicketPricingError,
  PromoCodeError,
} from '../services/ticketPricing';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eventsService } from '../services/events';

import { eventAnalyticsService } from '../services/eventAnalyticsService';

// ---------------------------------------------------------------------------
// Shared types (inlined to avoid circular import with app.ts)
// ---------------------------------------------------------------------------

type DevAppEvent = {
  id: string;
  title: string;
  description: string;
  communityId: string;
  venue: string;
  date: string;
  time: string;
  city: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  imageColor?: string;
  imageUrl?: string;
  category?: string;
  priceCents?: number;
  organizerId?: string;
  organizer?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  cultureTag?: string[];
  tags?: string[];
  indigenousTags?: string[];
  nationalityId?: string;
  isIndigenousOwned?: boolean;
  languageTags?: string[];
  eventType?: string;
  capacity?: number;
  attending?: number;
  deletedAt?: string | null;
  tiers?: { name: string; priceCents: number; available: number }[];
  createdAt?: string;
  updatedAt?: string;
};

type DevCouncil = {
  id: string;
  name: string;
  state: string;
  servicePostcodes: number[];
  serviceSuburbs: string[];
  serviceCities: string[];
};

type DevFeedbackEntry = {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};



// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const eventFeedbackSchema = z.object({
  rating:  z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const eventTierSchema = z.object({
  name:       z.string().min(1),
  priceCents: z.coerce.number().int().min(0),
  available:  z.coerce.number().int().min(0),
});

const createEventSchema = z.object({
  title:       z.string().min(1, 'title is required').max(200),
  description: optionalStringField(5000),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time:        optionalStringField(20),
  venue:       optionalStringField(200),
  address:     optionalStringField(500),
  city:        optionalStringField(100),
  state:       optionalStringField(10),
  postcode:    optionalIntField(200, 9999),
  country:     optionalStringField(100),
  latitude:    z.coerce.number().optional(),
  longitude:   z.coerce.number().optional(),
  communityId: optionalStringField(100),
  imageUrl:    z.string().url('imageUrl must be a valid URL').optional().or(z.literal('')),
  imageColor:  optionalStringField(20),
  priceCents:  z.coerce.number().int().min(0).optional(),
  priceLabel:  optionalStringField(50),
  category:    optionalStringField(100),
  eventType:   z.enum([
    'festival',
    'concert',
    'workshop',
    'puja',
    'sports',
    'food',
    'cultural',
    'community',
    'exhibition',
    'conference',
    'networking',
    'nightlife',
    'family',
    'film',
    'theatre',
    'comedy',
    'dance',
    'wellness',
    'market',
    'tour',
    'charity',
    'religious',
    'other',
  ]).optional(),
  visibility: z.enum(['public', 'private', 'approval_required']).optional(),
  vibe: optionalStringField(100),
  audience: optionalStringField(100),
  ageSuitability: optionalStringField(20),
  priceTier:   optionalStringField(20),
  capacity:    optionalIntField(1),
  isFree:      z.coerce.boolean().optional(),
  isFeatured:  z.coerce.boolean().optional(),
  /** Listing form — stored for moderator / organiser contact */
  contactEmail: optionalEmailField,
  tiers:       z.array(eventTierSchema).max(10).optional(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
  cultureTag:  z.array(z.string().max(50)).max(20).optional(),
  indigenousTags: z.array(z.string().max(50)).max(10).optional(),
  nationalityId: z.string().max(40).optional(),
  isIndigenousOwned: z.coerce.boolean().optional(),
  languageTags:   z.array(z.string().max(50)).max(10).optional(),
  organizer:   optionalStringField(200),
  externalTicketUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  geoHash:     z.string().max(20).optional(),
  organizerReputationScore: z.coerce.number().int().min(0).max(100).optional(),
  hostName:    z.string().max(200).optional().or(z.null()),
  hostEmail:   z.string().email().optional().or(z.literal('')).or(z.null()),
  hostPhone:   z.string().max(30).optional().or(z.null()),
  sponsors:    z.string().max(500).optional().or(z.null()),
  // Enhanced creation fields
  entryType:   z.enum(['ticketed', 'free_open']).optional(),
  locationType: z.enum(['physical', 'virtual', 'hybrid']).optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  timezone: optionalStringField(64),
  waitlistEnabled: z.coerce.boolean().optional(),
  requireApproval: z.coerce.boolean().optional(),
  guestListVisibility: z.enum(['public', 'attendees_only', 'host_only']).optional(),
  sendReminders: z.coerce.boolean().optional(),
  reminderAutomationEnabled: z.coerce.boolean().optional(),
  reminderOffsetsMinutes: z.array(z.coerce.number().int().min(1).max(10080)).max(10).optional(),
  maxTicketsPerOrder: optionalIntField(1, 100),
  customQuestions: z.array(z.string().max(200)).max(20).optional(),
  registrationFields: z.object({
    name: z.coerce.boolean(),
    email: z.coerce.boolean(),
    phone: z.coerce.boolean(),
    company: z.coerce.boolean(),
  }).optional(),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endTime:     optionalStringField(20),
  heroImageUrl: z.string().url().optional().or(z.literal('')),
  artists: z.array(z.object({
    profileId: z.string().optional(),
    name:      z.string().min(1).max(200),
    role:      z.string().max(50).optional(),
    imageUrl:  z.string().url().optional().or(z.literal('')),
  })).max(20).optional(),
  eventSponsors: z.array(z.object({
    profileId:  z.string().optional(),
    name:       z.string().min(1).max(200),
    tier:       z.enum(['title', 'gold', 'silver', 'bronze']),
    logoUrl:    z.string().url().optional().or(z.literal('')),
    websiteUrl: z.string().url().optional().or(z.literal('')),
  })).max(20).optional(),
  hostInfo: z.object({
    profileId:    z.string().optional(),
    name:         z.string().min(1).max(200),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().max(30).optional(),
    websiteUrl:   z.string().url().optional().or(z.literal('')),
  }).nullable().optional(),
  /** Directory profile that owns this listing (see docs/PROFILE_PUBLISHING_AND_MARKETPLACE_GAPS.md) */
  publisherProfileId: z.string().min(1).max(128).optional(),
  /** Linked venue-style profile (entityType venue | business | restaurant) */
  venueProfileId: z.string().min(1).max(128).optional(),
  /** Australian LGA code */
  lgaCode: z.string().max(20).optional(),
  /** councils/{id} */
  councilId: z.string().max(128).optional(),
});

const updateEventSchema = createEventSchema.partial().extend({
  publisherProfileId: z.union([z.string().min(1).max(128), z.literal('')]).optional(),
  venueProfileId: z.union([z.string().min(1).max(128), z.literal('')]).optional(),
});

async function enqueueReminderHook(eventId: string, payload: {
  enabled: boolean;
  sendReminders: boolean;
  offsets: number[];
  timezone?: string;
  startDate?: string;
  startTime?: string;
}) {
  if (!payload.enabled || !payload.sendReminders || payload.offsets.length === 0) return;
  await db.collection('eventReminderHooks').add({
    eventId,
    kind: 'schedule_reminders',
    status: 'pending',
    payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEventsRouter() {

  const router = Router();

  // ── GET /api/events ────────────────────────────────────────────────────────
  router.get('/events', slidingWindowRateLimit(60000, 100), async (req: Request, res: Response) => {
    try {
      const city        = qstr(req.query.city).trim()        || undefined;
      const country     = qstr(req.query.country).trim()     || undefined;
      const category    = qstr(req.query.category).trim()    || undefined;
      const eventType   = qstr(req.query.eventType).trim()   || undefined;
      const dateFrom    = qstr(req.query.dateFrom).trim()    || undefined;
      const dateTo      = qstr(req.query.dateTo).trim()      || undefined;
      const organizerId = qstr(req.query.organizerId).trim() || undefined;
      const communityId = qstr(req.query.communityId).trim() || undefined;
      const isFeatured  = qstr(req.query.isFeatured) === 'true' ? true : undefined;
      const isFreeStr   = qstr(req.query.isFree).trim();
      const isFree      = isFreeStr === 'true' ? true : isFreeStr === 'false' ? false : undefined;
      const venue       = qstr(req.query.venue).trim() || undefined;
      const time        = qstr(req.query.time).trim() || undefined;
      const publisherProfileId = qstr(req.query.publisherProfileId).trim() || undefined;
      const venueProfileId = qstr(req.query.venueProfileId).trim() || undefined;
      const tag = qstr(req.query.tag).trim() || undefined;
      const lgaCode = qstr(req.query.lgaCode).trim() || undefined;
      const councilId = qstr(req.query.councilId).trim() || undefined;
      const q = qstr(req.query.q).trim() || undefined;

      const centerLatStr  = qstr(req.query.centerLat).trim();
      const centerLngStr  = qstr(req.query.centerLng).trim();
      const radiusInKmStr = qstr(req.query.radiusInKm).trim();
      const centerLat   = centerLatStr  ? parseFloat(centerLatStr)  : undefined;
      const centerLng   = centerLngStr  ? parseFloat(centerLngStr)  : undefined;
      const radiusInKm  = radiusInKmStr ? parseFloat(radiusInKmStr) : undefined;

      const page     = Math.max(1, parseInt(qstr(req.query.page)     || '1',  10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(qstr(req.query.pageSize) || '20', 10) || 20));

      if (!isFirestoreConfigured) {
        return res.json({
          events: [],
          total: 0,
          page,
          pageSize,
          hasNextPage: false,
        });
      }

      const result = await eventsService.list(
        {
          city,
          country,
          category,
          eventType,
          dateFrom,
          dateTo,
          isFeatured,
          organizerId,
          communityId,
          centerLat,
          centerLng,
          radiusInKm,
          isFree,
          venue,
          time,
          publisherProfileId,
          venueProfileId,
          tag,
          lgaCode,
          councilId,
          q,
        },
        { page, pageSize },
      );

      return res.json({
        events:      result.items,
        total:       result.total,
        page:        result.page,
        pageSize:    result.pageSize,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/events');
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // ── GET /api/events/cross-community ───────────────────────────────────────
  router.get('/events/cross-community', async (_req: Request, res: Response) => {
    try {
      const result = await eventsService.list({ status: 'published' }, { page: 1, pageSize: 50 });
      const cross = result.items.filter((e) => (e.cultureTag?.length ?? 0) >= 2);
      return res.json(cross);
    } catch (err) {
      captureRouteError(err, 'GET /api/events/cross-community');
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // ── GET /api/events/popular ────────────────────────────────────────────────
  // Returns city/country-scoped events sorted by `popularityScore` desc.
  // Falls back to `attending` then `ticketsSold` when popularityScore is missing.
  router.get('/events/popular', slidingWindowRateLimit(60000, 100), async (req: Request, res: Response) => {
    try {
      const city = qstr(req.query.city).trim() || undefined;
      const country = qstr(req.query.country).trim() || undefined;
      const pageSize = Math.min(50, Math.max(1, parseInt(qstr(req.query.pageSize) || '12', 10) || 12));
      const today = new Date().toISOString().split('T')[0];

      // Pull a generous slice scoped to city/country with a date floor so we
      // surface upcoming events; sort in memory by popularityScore desc.
      const result = await eventsService.list(
        { city, country, dateFrom: today },
        { page: 1, pageSize: Math.max(pageSize * 4, 60) },
      );

      const sorted = [...result.items].sort((a, b) => {
        const ascore = a.popularityScore ?? a.attending ?? a.ticketsSold ?? 0;
        const bscore = b.popularityScore ?? b.attending ?? b.ticketsSold ?? 0;
        if (bscore !== ascore) return bscore - ascore;
        // Tiebreak by date ascending so soonest popular events float up.
        return (a.date || '').localeCompare(b.date || '');
      });

      return res.json({
        events: sorted.slice(0, pageSize),
        total: result.total,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/popular');
      return res.status(500).json({ error: 'Failed to fetch popular events' });
    }
  });

  // ── GET /api/events/nearby ─────────────────────────────────────────────────
  // Required: lat, lng. Optional: radius (km, default 10), pageSize (default 20)
  router.get('/events/nearby', slidingWindowRateLimit(60000, 100), async (req: Request, res: Response) => {
    const lat = parseFloat(qstr(req.query.lat));
    const lng = parseFloat(qstr(req.query.lng));
    const radius = parseFloat(qstr(req.query.radius) || '10');
    const pageSize = Math.min(50, Math.max(1, parseInt(qstr(req.query.pageSize) || '20', 10) || 20));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'lat/lng out of range' });
    }

    try {
      const result = await eventsService.list(
        { centerLat: lat, centerLng: lng, radiusInKm: radius },
        { page: 1, pageSize },
      );
      return res.json({
        events: result.items,
        total: result.total,
        radiusKm: radius,
      });
    } catch (err: any) {
      captureRouteError(err, 'GET /api/events/nearby');
      // Geo queries are best-effort. Return empty results instead of hard 500 so the UI
      // (rails, discover tabs, city view) degrades gracefully. The real error is in logs.
      console.error('[nearby] geo query failed, returning empty results', {
        lat,
        lng,
        radius,
        message: err?.message,
        code: err?.code,
      });
      return res.json({
        events: [],
        total: 0,
        radiusKm: radius,
        warning: 'nearby query degraded',
      });
    }
  });

  // ── GET /api/events/:id/ticket-quote ───────────────────────────────────────
  /** Server-authoritative ticket row totals (optional promo). Register before `/events/:id`. */
  router.get('/events/:id/ticket-quote', slidingWindowRateLimit(60000, 120), async (req: Request, res: Response) => {
    try {
      const eventId = qparam(req.params.id);
      const event = await eventsService.getById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const quantityRaw = parseInt(qstr(req.query.quantity) || '1', 10);
      const quantity = Number.isInteger(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
      const tierName = qstr(req.query.tierName) || undefined;
      const promoCode = qstr(req.query.promoCode) || undefined;

      let pricing;
      try {
        if (promoCode) {
          pricing = await resolveTicketOrderPricingWithPromo(event, {
            quantity,
            tierName,
            promoCode,
          });
        } else {
          pricing = resolveTicketOrderPricing(event, { quantity, tierName });
        }
      } catch (err) {
        if (err instanceof TicketPricingError) {
          return res.status(400).json({ error: err.message, code: err.code });
        }
        if (err instanceof PromoCodeError) {
          return res.status(400).json({ error: err.message, code: err.code });
        }
        throw err;
      }

      return res.json({
        tierName: pricing.tierName,
        quantity: pricing.quantity,
        unitPriceCents: pricing.unitPriceCents,
        totalPriceCents: pricing.totalPriceCents,
        discountCents: pricing.discountCents ?? 0,
        promoCode: pricing.promoCode ?? null,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/ticket-quote');
      return res.status(500).json({ error: 'Failed to quote ticket price' });
    }
  });

  // ── GET /api/events/:id ────────────────────────────────────────────────────
  router.get('/events/:id', async (req: Request, res: Response) => {
    try {
      const id = qparam(req.params.id);
      if (!isFirestoreConfigured && id.startsWith('mock-')) {
        return res.json({
          id,
          title: id.replace('mock-', 'Integration Test Event '),
          description: 'Mock description',
          date: new Date().toISOString().split('T')[0],
          city: 'Sydney',
          country: 'Australia',
          status: 'published',
        });
      }
      const event = await eventsService.getById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.json(event);
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id');
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  // ── POST /api/events ───────────────────────────────────────────────────────
  router.post(
    '/events',
    requireAuth,
    requireRole('organizer', 'admin'),
    moderationCheck,
    async (req: Request, res: Response) => {
      let b: z.infer<typeof createEventSchema>;
      try {
        b = parseBody(createEventSchema, req.body ?? {});
      } catch (err) {
        if (respondIfValidationError(res, err)) return;
        captureRouteError(err, 'POST /api/events validation');
        return res.status(500).json({ error: 'Failed to parse event payload' });
      }

      let loc: ResolvedLocation;
      if (b.locationType === 'virtual') {
        loc = {
          city: String(b.city ?? 'Online'),
          state: String(b.state ?? ''),
          postcode: b.postcode != null ? Number(b.postcode) : 0,
          country: String(b.country ?? 'Online'),
          latitude: b.latitude != null ? Number(b.latitude) : 0,
          longitude: b.longitude != null ? Number(b.longitude) : 0,
        };
      } else {
        const resolvedResult = resolveAustralianLocation(b as Record<string, unknown>, true);
        if (resolvedResult.error || !resolvedResult.location) {
          return res.status(400).json({ error: resolvedResult.error ?? 'invalid location payload' });
        }
        loc = resolvedResult.location;
      }

      if (b.endDate && b.endDate < b.date) {
        return res.status(400).json({ error: 'endDate cannot be before start date' });
      }

      if (b.publisherProfileId) {
        const pv = await validatePublisherProfileLink(req.user!, b.publisherProfileId);
        if (!pv.ok) return res.status(pv.status).json({ error: pv.error });
      }
      if (b.venueProfileId) {
        const vv = await validateVenueProfileLink(req.user!, b.venueProfileId);
        if (!vv.ok) return res.status(vv.status).json({ error: vv.error });
      }

      // Resolve council LGA from location (best-effort, non-blocking)
      let lgaCode: string | null = b.lgaCode || null;
      let councilId: string | null = b.councilId || null;
      if (!lgaCode || !councilId) {
        try {
          const q = db.collection('councils').where('state', '==', loc.state).limit(100);
          const councilSnap = await q.get();
          if (!councilSnap.empty) {
            type CouncilDoc = { lgaCode?: string; suburb?: string; name?: string };
            const lowerCity = loc.city.toLowerCase();
            const match = councilSnap.docs.find((d) => {
              const data = d.data() as CouncilDoc;
              return (data.suburb ?? '').toLowerCase() === lowerCity ||
                    (data.name ?? '').toLowerCase().includes(lowerCity);
            });
            if (match) {
              if (!lgaCode) lgaCode = (match.data() as CouncilDoc).lgaCode ?? null;
              if (!councilId) councilId = match.id;
            }
          }
        } catch {
          // Non-critical: event creation proceeds without LGA
        }
      }

      if (!isFirestoreConfigured) {
        return res.status(201).json({
          id: `mock-${Date.now()}`,
          title: String(b.title),
          description: String(b.description ?? ''),
          date: String(b.date),
          city: loc.city,
          country: loc.country,
          status: 'draft',
        });
      }

      try {
        const event = await eventsService.create({
          title:       String(b.title),
          description: String(b.description ?? ''),
          communityId: String(b.communityId ?? (Array.isArray(b.cultureTag) ? b.cultureTag[0] : '') ?? ''),
          venue:    String(b.venue ?? ''),
          address:  b.address  ? String(b.address)  : undefined,
          date:     String(b.date),
          time:     String(b.time ?? ''),
          city:     loc.city,
          state:    loc.state,
          postcode: loc.postcode,
          suburb:   loc.city,
          latitude: loc.latitude,
          longitude: loc.longitude,
          country:  loc.country,
          imageUrl:  b.imageUrl  ? String(b.imageUrl)  : undefined,
          imageColor: b.imageColor ? String(b.imageColor) : undefined,
          organizer:   b.organizer   ? String(b.organizer)   : undefined,
          organizerId: req.user!.id,
          priceCents:  b.priceCents  != null ? Number(b.priceCents)  : undefined,
          priceLabel:  b.priceLabel  ? String(b.priceLabel)  : undefined,
          category:    b.category    ? String(b.category)    : undefined,
          capacity:    b.capacity    != null ? Number(b.capacity)    : undefined,
          attending:   0,
          isFree:    b.isFree    != null ? Boolean(b.isFree)    : true,
          isFeatured: b.isFeatured != null ? Boolean(b.isFeatured) : false,
          contactEmail: b.contactEmail ? String(b.contactEmail) : undefined,
          tiers:     Array.isArray(b.tiers)        ? b.tiers        : undefined,
          tags:      Array.isArray(b.tags)         ? b.tags         : undefined,
          indigenousTags: Array.isArray(b.indigenousTags) ? b.indigenousTags : undefined,
          nationalityId: b.nationalityId ? String(b.nationalityId) : undefined,
          isIndigenousOwned: b.isIndigenousOwned != null ? Boolean(b.isIndigenousOwned) : undefined,
          languageTags:   Array.isArray(b.languageTags)   ? b.languageTags   : undefined,
          cultureTag: Array.isArray(b.cultureTag)  ? b.cultureTag  : undefined,
          geoHash:   b.geoHash   ? String(b.geoHash)   : undefined,
          eventType: b.eventType ? String(b.eventType) : undefined,
          visibility: b.visibility ?? 'public',
          vibe: b.vibe ? String(b.vibe) : undefined,
          audience: b.audience ? String(b.audience) : undefined,
          ageSuitability: b.ageSuitability ? String(b.ageSuitability) : undefined,
          priceTier: b.priceTier ? String(b.priceTier) : undefined,
          organizerReputationScore: b.organizerReputationScore != null ? Number(b.organizerReputationScore) : 50,
          externalTicketUrl: b.externalTicketUrl ? String(b.externalTicketUrl) : null,
          hostName:  b.hostName  ? String(b.hostName)  : null,
          hostEmail: b.hostEmail ? String(b.hostEmail) : null,
          hostPhone: b.hostPhone ? String(b.hostPhone) : null,
          sponsors:  b.sponsors  ? String(b.sponsors)  : null,
          // Enhanced fields
          entryType:    b.entryType ?? (b.isFree ? 'free_open' : 'ticketed'),
          locationType: b.locationType ?? 'physical',
          meetingLink:  b.meetingLink ? String(b.meetingLink) : null,
          timezone:     b.timezone ? String(b.timezone) : undefined,
          waitlistEnabled: b.waitlistEnabled ?? false,
          requireApproval: b.requireApproval ?? false,
          guestListVisibility: b.guestListVisibility ?? 'host_only',
          sendReminders: b.sendReminders ?? true,
          reminderAutomationEnabled: b.reminderAutomationEnabled ?? true,
          reminderOffsetsMinutes: Array.isArray(b.reminderOffsetsMinutes) ? b.reminderOffsetsMinutes : [1440, 120],
          maxTicketsPerOrder: b.maxTicketsPerOrder != null ? Number(b.maxTicketsPerOrder) : undefined,
          customQuestions: Array.isArray(b.customQuestions) ? b.customQuestions : undefined,
          registrationFields: b.registrationFields ?? { name: true, email: true, phone: false, company: false },
          endDate:      b.endDate  ? String(b.endDate)  : undefined,
          endTime:      b.endTime  ? String(b.endTime)  : undefined,
          heroImageUrl: b.heroImageUrl ? String(b.heroImageUrl) : undefined,
          artists:       Array.isArray(b.artists)       ? b.artists       : undefined,
          eventSponsors: Array.isArray(b.eventSponsors) ? b.eventSponsors : undefined,
          hostInfo:      b.hostInfo ?? null,
          cpid: generateSecureId('CP-E-'),
          lgaCode,
          councilId,
          status: 'draft',
          ...(b.publisherProfileId ? { publisherProfileId: String(b.publisherProfileId) } : {}),
          ...(b.venueProfileId ? { venueProfileId: String(b.venueProfileId) } : {}),
        });
        await enqueueReminderHook(event.id, {
          enabled: event.reminderAutomationEnabled ?? true,
          sendReminders: event.sendReminders ?? true,
          offsets: event.reminderOffsetsMinutes ?? [1440, 120],
          timezone: event.timezone,
          startDate: event.date,
          startTime: event.time,
        });
        return res.status(201).json(event);
      } catch (err) {
        captureRouteError(err, 'POST /api/events');
        return res.status(500).json({ error: 'Failed to create event' });
      }
    },
  );

  // ── PUT /api/events/:id ────────────────────────────────────────────────────
  router.put('/events/:id', requireAuth, moderationCheck, async (req: Request, res: Response) => {
    let b: z.infer<typeof updateEventSchema>;
    try {
      b = parseBody(updateEventSchema, req.body ?? {});
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'PUT /api/events/:id validation');
      return res.status(500).json({ error: 'Failed to parse event payload' });
    }
    try {
      const existing = await eventsService.getById(qparam(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Event not found' });
      if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this event' });
      }

      if (b.publisherProfileId !== undefined && b.publisherProfileId !== '') {
        const pv = await validatePublisherProfileLink(req.user!, b.publisherProfileId);
        if (!pv.ok) return res.status(pv.status).json({ error: pv.error });
      }
      if (b.venueProfileId !== undefined && b.venueProfileId !== '') {
        const vv = await validateVenueProfileLink(req.user!, b.venueProfileId);
        if (!vv.ok) return res.status(vv.status).json({ error: vv.error });
      }
      const hasLocationFields =
        b.city != null || b.state != null || b.postcode != null ||
        b.country != null || b.latitude != null || b.longitude != null;

      let loc: ResolvedLocation | undefined;
      if (hasLocationFields) {
        const resolvedResult = resolveAustralianLocation(
          {
            city:      b.city      ?? existing.city,
            state:     b.state     ?? existing.state,
            postcode:  b.postcode  ?? existing.postcode,
            country:   b.country   ?? existing.country,
            latitude:  b.latitude  ?? existing.latitude,
            longitude: b.longitude ?? existing.longitude,
          },
          false,
        );
        if (resolvedResult.error || !resolvedResult.location) {
          return res.status(400).json({ error: resolvedResult.error ?? 'invalid location payload' });
        }
        loc = resolvedResult.location;
      }

      const updated = await eventsService.update(qparam(req.params.id), {
        ...(b.title        != null && { title:       String(b.title) }),
        ...(b.description  != null && { description: String(b.description) }),
        ...(b.date         != null && { date:        String(b.date) }),
        ...(b.time         != null && { time:        String(b.time) }),
        ...(b.venue        != null && { venue:       String(b.venue) }),
        ...(b.address      != null && { address:     String(b.address) }),
        ...(b.endDate      != null && { endDate:     b.endDate ? String(b.endDate) : null }),
        ...(b.endTime      != null && { endTime:     b.endTime ? String(b.endTime) : null }),
        ...(loc && { city:      loc.city }),
        ...(loc && { state:     loc.state }),
        ...(loc && { postcode:  loc.postcode }),
        ...(loc && { suburb:    loc.city }),
        ...(loc && { latitude:  loc.latitude }),
        ...(loc && { longitude: loc.longitude }),
        ...(loc && { country:   loc.country }),
        ...(b.imageUrl     != null && { imageUrl:    String(b.imageUrl) }),
        ...(b.heroImageUrl != null && { heroImageUrl: b.heroImageUrl ? String(b.heroImageUrl) : null }),
        ...(b.priceCents   != null && { priceCents:  Number(b.priceCents) }),
        ...(b.priceLabel   != null && { priceLabel:  String(b.priceLabel) }),
        ...(b.capacity     != null && { capacity:    Number(b.capacity) }),
        ...(b.isFree       != null && { isFree:      Boolean(b.isFree) }),
        ...(b.isFeatured   != null && { isFeatured:  Boolean(b.isFeatured) }),
        ...(b.entryType    != null && { entryType:   b.entryType }),
        ...(Array.isArray(b.tiers)      && { tiers:      b.tiers }),
        ...(Array.isArray(b.tags)       && { tags:       b.tags }),
        ...(Array.isArray(b.cultureTag) && { cultureTag: b.cultureTag }),
        ...(Array.isArray(b.indigenousTags) && { indigenousTags: b.indigenousTags }),
        ...(b.nationalityId != null && { nationalityId: b.nationalityId ? String(b.nationalityId) : null }),
        ...(b.isIndigenousOwned != null && { isIndigenousOwned: Boolean(b.isIndigenousOwned) }),
        ...(Array.isArray(b.languageTags)   && { languageTags: b.languageTags }),
        ...(Array.isArray(b.artists)        && { artists: b.artists }),
        ...(Array.isArray(b.eventSponsors)  && { eventSponsors: b.eventSponsors }),
        ...(b.hostInfo !== undefined && { hostInfo: b.hostInfo }),
        ...(b.hostName !== undefined && { hostName: b.hostName ? String(b.hostName) : null }),
        ...(b.hostEmail !== undefined && { hostEmail: b.hostEmail ? String(b.hostEmail) : null }),
        ...(b.hostPhone !== undefined && { hostPhone: b.hostPhone ? String(b.hostPhone) : null }),
        ...(b.sponsors !== undefined && { sponsors: b.sponsors ? String(b.sponsors) : null }),
        ...(b.category  != null && { category:  String(b.category) }),
        ...(b.eventType != null && { eventType: String(b.eventType) }),
        ...(b.visibility != null && { visibility: b.visibility }),
        ...(b.vibe != null && { vibe: String(b.vibe) }),
        ...(b.audience != null && { audience: String(b.audience) }),
        ...(b.locationType != null && { locationType: b.locationType }),
        ...(b.meetingLink != null && { meetingLink: b.meetingLink ? String(b.meetingLink) : null }),
        ...(b.timezone != null && { timezone: String(b.timezone) }),
        ...(b.waitlistEnabled != null && { waitlistEnabled: Boolean(b.waitlistEnabled) }),
        ...(b.requireApproval != null && { requireApproval: Boolean(b.requireApproval) }),
        ...(b.lgaCode !== undefined && { lgaCode: b.lgaCode || null }),
        ...(b.councilId !== undefined && { councilId: b.councilId || null }),
        ...(b.guestListVisibility != null && { guestListVisibility: b.guestListVisibility }),
        ...(b.sendReminders != null && { sendReminders: Boolean(b.sendReminders) }),
        ...(b.reminderAutomationEnabled != null && { reminderAutomationEnabled: Boolean(b.reminderAutomationEnabled) }),
        ...(Array.isArray(b.reminderOffsetsMinutes) && { reminderOffsetsMinutes: b.reminderOffsetsMinutes }),
        ...(b.maxTicketsPerOrder != null && { maxTicketsPerOrder: Number(b.maxTicketsPerOrder) }),
        ...(Array.isArray(b.customQuestions) && { customQuestions: b.customQuestions }),
        ...(b.registrationFields != null && { registrationFields: b.registrationFields }),
        ...(b.publisherProfileId !== undefined && {
          publisherProfileId:
            b.publisherProfileId === '' ? FieldValue.delete() : String(b.publisherProfileId),
        }),
        ...(b.venueProfileId !== undefined && {
          venueProfileId: b.venueProfileId === '' ? FieldValue.delete() : String(b.venueProfileId),
        }),
      });
      if (updated) {
        await enqueueReminderHook(updated.id, {
          enabled: updated.reminderAutomationEnabled ?? true,
          sendReminders: updated.sendReminders ?? true,
          offsets: updated.reminderOffsetsMinutes ?? [1440, 120],
          timezone: updated.timezone,
          startDate: updated.date,
          startTime: updated.time,
        });
      }
      return res.json(updated);
    } catch (err) {
      captureRouteError(err, 'PUT /api/events/:id');
      return res.status(500).json({ error: 'Failed to update event' });
    }
  });

  // ── DELETE /api/events/:id ─────────────────────────────────────────────────
  router.delete('/events/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const existing = await eventsService.getById(qparam(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Event not found' });
      if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this event' });
      }
      await eventsService.softDelete(qparam(req.params.id));
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'DELETE /api/events/:id');
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  // ── POST /api/events/:id/publish ───────────────────────────────────────────
  router.post(
    '/events/:id/publish',
    requireAuth,
    requireRole('organizer', 'admin', 'platformAdmin', 'superAdmin'),
    async (req: Request, res: Response) => {
      try {
        const existing = await eventsService.getById(qparam(req.params.id));
        if (!existing) return res.status(404).json({ error: 'Event not found' });
        if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
          return res.status(403).json({ error: 'Forbidden: you do not own this event' });
        }
        const published = await eventsService.publish(qparam(req.params.id));
        return res.json(published);
      } catch (err) {
        captureRouteError(err, 'POST /api/events/:id/publish');
        return res.status(500).json({ error: 'Failed to publish event' });
      }
    },
  );

  // ── GET /api/events/:id/analytics ──────────────────────────────────────────
  router.get('/events/:id/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
      const eventId = qparam(req.params.id);
      const event = await eventsService.getById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      // Only owner or admin can see full analytics
      if (!isOwnerOrAdmin(req.user!, event.organizerId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const analytics = await eventAnalyticsService.getAnalytics(eventId);
      return res.json(analytics);
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/analytics');
      return res.status(500).json({ error: 'Failed to fetch event analytics' });
    }
  });

  // ── GET /api/events/feedback ───────────────────────────────────────────
  router.get('/events/:id/feedback', async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    try {
      const feedback = await eventFeedbackService.listForEvent(eventId);
      const avg = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : null;
      return res.json({ feedback, averageRating: avg ? Math.round(avg * 10) / 10 : null, count: feedback.length });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/feedback');
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // ── POST /api/events/:id/ticket-click ──────────────────────────────────────
  // No auth required — tracking only, fire-and-forget
  router.post('/events/:id/ticket-click', async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    try {
      await db.collection('events').doc(eventId).update({
        ticketClickCount: FieldValue.increment(1),
      });
      return res.json({ ok: true });
    } catch {
      // best-effort — don't fail the client
      return res.json({ ok: false });
    }
  });

  // ── POST /api/events/:id/favorite ─────────────────────────────────────────
  router.post('/events/:id/favorite', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const userId = req.user!.id;
    const favorite = Boolean(req.body?.favorite);

    try {
      const eventRef = db.collection('events').doc(eventId);
      const favoriteRef = db.collection('eventFavorites').doc(`${userId}_${eventId}`);
      const userRef = db.collection('users').doc(userId);
      const now = nowIso();

      await db.runTransaction(async (txn) => {
        const [eventSnap, favoriteSnap] = await Promise.all([
          txn.get(eventRef),
          txn.get(favoriteRef),
        ]);

        if (!eventSnap.exists) {
          throw new Error('Event not found');
        }

        if (favorite && !favoriteSnap.exists) {
          txn.set(favoriteRef, { eventId, userId, createdAt: now });
          txn.set(userRef, { savedEventIds: FieldValue.arrayUnion(eventId), updatedAt: now }, { merge: true });
          txn.update(eventRef, { favoriteCount: FieldValue.increment(1), updatedAt: now });
        } else if (!favorite && favoriteSnap.exists) {
          txn.delete(favoriteRef);
          txn.set(userRef, { savedEventIds: FieldValue.arrayRemove(eventId), updatedAt: now }, { merge: true });
          txn.update(eventRef, { favoriteCount: FieldValue.increment(-1), updatedAt: now });
        }
      });

      return res.json({ success: true, favorite });
    } catch (err) {
      if (err instanceof Error && err.message === 'Event not found') {
        return res.status(404).json({ error: 'Event not found' });
      }
      captureRouteError(err, 'POST /api/events/:id/favorite');
      return res.status(500).json({ error: 'Failed to save event' });
    }
  });

  // ── GET /api/events/:id/rsvp/me ────────────────────────────────────────────
  router.get('/events/:id/rsvp/me', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const userId = req.user!.id;
    try {
      const snap = await db.collection('rsvps').doc(`${eventId}_${userId}`).get();
      if (!snap.exists) return res.json({ status: null });
      return res.json({ status: (snap.data() as any).status ?? null });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/rsvp/me');
      return res.status(500).json({ error: 'Failed to get RSVP' });
    }
  });

  // ── GET /api/events/:id/attendees ──────────────────────────────────────────
  // Public attendee preview for feed cards (limited sample of "going" users).
  router.get('/events/:id/attendees', async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const limitRaw = parseInt(qstr(req.query.limit) || '5', 10);
    const limit = Math.min(12, Math.max(1, Number.isNaN(limitRaw) ? 5 : limitRaw));
    try {
      const snap = await db
        .collection('rsvps')
        .where('eventId', '==', eventId)
        .where('status', '==', 'going')
        .limit(limit)
        .get();

      const userIds = snap.docs
        .map((d) => (d.data() as { userId?: string }).userId)
        .filter((v): v is string => typeof v === 'string' && v.length > 0);

      if (userIds.length === 0) return res.json({ attendees: [] });

      const userDocs = await Promise.all(
        userIds.map((uid) => db.collection('users').doc(uid).get()),
      );
      const attendees = userDocs
        .filter((u) => u.exists)
        .map((u) => {
          const data = u.data() as {
            displayName?: string;
            username?: string;
            avatarUrl?: string;
          };
          return {
            id: u.id,
            name: data.displayName || data.username || 'CulturePass User',
            avatarUrl: data.avatarUrl || null,
          };
        });

      return res.json({ attendees });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/attendees');
      return res.status(500).json({ error: 'Failed to fetch attendees' });
    }
  });

  // ── POST /api/events/:id/message ──────────────────────────────────────────
  router.post('/events/:id/message', requireAuth, requireRevocationCheck, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
      const event = await eventsService.getById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if user is the organizer of the event, or an admin
      const isOrganizer = event.organizerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      
      if (!isOrganizer && !isAdmin) {
        return res.status(403).json({ error: 'You are not authorized to message attendees of this event' });
      }

      // Fetch all attendees of the event from tickets collection
      const ticketsSnap = await db.collection('tickets')
        .where('eventId', '==', eventId)
        .where('status', '==', 'confirmed')
        .get();

      const userIds = [...new Set(ticketsSnap.docs.map(doc => doc.data().userId))].filter(Boolean) as string[];

      if (userIds.length > 0) {
        // Send push notifications via FCM
        await sendToUsers(userIds, { title, body }, { eventId, type: 'event_announcement' });

        // Add to in-app notifications collection
        const batch = db.batch();
        const now = nowIso();
        userIds.forEach(uid => {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            id: notifRef.id,
            userId: uid,
            title,
            message: body,
            type: 'event_announcement',
            isRead: false,
            createdAt: now,
            metadata: { eventId },
          });
        });
        await batch.commit();
      }

      return res.json({ ok: true, recipientsCount: userIds.length });
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/message');
      return res.status(500).json({ error: 'Failed to send message to attendees' });
    }
  });

  // ── POST /api/events/:id/rsvp ──────────────────────────────────────────────
  router.post('/events/:id/rsvp', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const userId = req.user!.id;
    const status = req.body?.status as string | undefined;

    if (!['going', 'maybe', 'not_going'].includes(status ?? '')) {
      return res.status(400).json({ error: 'status must be going | maybe | not_going' });
    }

    try {

      const rsvpRef  = db.collection('rsvps').doc(`${eventId}_${userId}`);
      const eventRef = db.collection('events').doc(eventId);
      const now = nowIso();

      // Transaction prevents race conditions where concurrent requests both read
      // prevStatus = null and double-increment the same counter.
      await db.runTransaction(async (txn) => {
        const prevSnap = await txn.get(rsvpRef);
        const prevStatus = prevSnap.exists ? (prevSnap.data() as any).status as string : null;

        txn.set(rsvpRef, {
          eventId,
          userId,
          status,
          updatedAt: now,
          createdAt: prevSnap.exists ? (prevSnap.data() as any).createdAt : now,
        });

        let rsvpGoingDiff = 0;
        let rsvpMaybeDiff = 0;
        let rsvpNotGoingDiff = 0;

        if (prevStatus && prevStatus !== status) {
          if (prevStatus === 'going') rsvpGoingDiff--;
          else if (prevStatus === 'maybe') rsvpMaybeDiff--;
          else if (prevStatus === 'not_going') rsvpNotGoingDiff--;
        }
        if (!prevStatus || prevStatus !== status) {
          if (status === 'going') rsvpGoingDiff++;
          else if (status === 'maybe') rsvpMaybeDiff++;
          else if (status === 'not_going') rsvpNotGoingDiff++;
        }

        const counterUpdate: Record<string, unknown> = {};
        if (rsvpGoingDiff !== 0) {
          counterUpdate.rsvpGoing = FieldValue.increment(rsvpGoingDiff);
        }
        if (rsvpMaybeDiff !== 0) {
          counterUpdate.rsvpMaybe = FieldValue.increment(rsvpMaybeDiff);
        }
        if (rsvpNotGoingDiff !== 0) {
          counterUpdate.rsvpNotGoing = FieldValue.increment(rsvpNotGoingDiff);
        }

        if (Object.keys(counterUpdate).length > 0) {
          txn.update(eventRef, counterUpdate);
        }
      });

      return res.json({ status });
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/rsvp');
      return res.status(500).json({ error: 'Failed to save RSVP' });
    }
  });

  // ── POST /api/events/:id/feedback ──────────────────────────────────────────
  router.post('/events/:id/feedback', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    let payload: z.infer<typeof eventFeedbackSchema>;
    try {
      payload = parseBody(eventFeedbackSchema, req.body);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid feedback payload' });
    }

    const userId = req.user!.id;

    try {
      const existingEvent = await eventsService.getById(eventId);
      if (!existingEvent) return res.status(404).json({ error: 'Event not found' });
      const feedback = await eventFeedbackService.upsert({
        eventId,
        userId,
        rating:  payload.rating,
        comment: payload.comment,
      });
      return res.json(feedback);
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/feedback');
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  // ── Host-facing promo codes for events (ticket discounts) ───────────────────
  // Hosts can create/manage promos scoped to their events. Uses same promoCodes collection.
  router.get('/events/:id/promos', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    try {
      const event = await eventsService.getById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const isOrganizer = event.organizerId === req.user!.id;
      const isAdmin = ['admin', 'superAdmin'].includes(req.user!.role || '');
      if (!isOrganizer && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const snap = await db.collection('promoCodes')
        .where('eventId', '==', eventId)
        .orderBy('createdAt', 'desc')
        .get();
      const promos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ promos });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/promos');
      return res.status(500).json({ error: 'Failed to list promos' });
    }
  });

  router.post('/events/:id/promos', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const event = await eventsService.getById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const isOrganizer = event.organizerId === req.user!.id;
    const isAdmin = ['admin', 'superAdmin'].includes(req.user!.role || '');
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to create promos for this event' });
    }
    const { code, discountType, discountValue, maxRedemptions, expiresAt, note } = req.body || {};
    if (!code || !discountType || typeof discountValue !== 'number') {
      return res.status(400).json({ error: 'code, discountType, discountValue required for ticket promo' });
    }
    const rawCode = String(code).trim().toUpperCase();
    if (rawCode.length < 3) return res.status(400).json({ error: 'Code too short' });
    const promoRef = db.collection('promoCodes').doc(rawCode);
    const existing = await promoRef.get();
    if (existing.exists) return res.status(409).json({ error: 'Code already exists' });
    try {
      await promoRef.set({
        code: rawCode,
        type: 'ticket_discount',
        active: true,
        isActive: true,
        eventId,
        discountType,
        discountValue: Math.max(0, Number(discountValue)),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        redeemedCount: 0,
        expiresAt: expiresAt || null,
        note: note || '',
        createdBy: req.user!.id,
        createdAt: nowIso(),
      });
      return res.status(201).json({ id: rawCode, code: rawCode });
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/promos');
      return res.status(500).json({ error: 'Failed to create promo' });
    }
  });

  return router;
}

export async function getEvents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { limit, offset, councilId, category } = event.queryStringParameters || {};
    
    const filters = {
      councilId: councilId || undefined,
      category: category || undefined,
    };

    // Adjust the call to match the actual list method signature
    // The list method expects filters and pagination separately
    const pagination = {
      page: offset ? Math.floor(parseInt(offset || '0', 10) / (parseInt(limit || '20', 10) || 20)) + 1 : 1,
      pageSize: limit ? parseInt(limit || '20', 10) : 20
    };

    const events = await eventsService.list(filters, pagination);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(events),
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch events' }),
    };
  }
}

export async function getEventById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    const eventData = await eventsService.getById(id);
    if (!eventData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(eventData),
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch event' }),
    };
  }
}

export async function createEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const requestData = JSON.parse(event.body || '{}');
    
    // Create event data structure without using parse method
    const eventData = {
      ...requestData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newEvent = await eventsService.create(eventData);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(newEvent),
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create event' }),
    };
  }
}

export async function updateEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    const requestData = JSON.parse(event.body || '{}');
    
    // Update event data structure without using parse method
    const eventData = {
      ...requestData,
      updatedAt: new Date().toISOString()
    };

    const updatedEvent = await eventsService.update(eventId, eventData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedEvent),
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update event' }),
    };
  }
}

export async function deleteEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    // Check if event exists
    const existingEvent = await eventsService.getById(id);
    if (!existingEvent) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    await eventsService.softDelete(id);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete event' }),
    };
  }
}

export async function getEventsByCouncil(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const councilId = event.pathParameters?.councilId;
    if (!councilId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Council ID is required' }),
      };
    }

    const { limit, offset } = event.queryStringParameters || {};

    const events = await eventsService.getByCouncil(councilId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(events),
    };
  } catch (error) {
    console.error('Error fetching events by council:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch events by council' }),
    };
  }
}

export async function getEventsByHost(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const hostId = event.pathParameters?.hostId;
    if (!hostId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Host ID is required' }),
      };
    }

    const { limit, offset } = event.queryStringParameters || {};

    const events = await eventsService.getByHost(hostId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(events),
    };
  } catch (error) {
    console.error('Error fetching events by host:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch events by host' }),
    };
  }
}
