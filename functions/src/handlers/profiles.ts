/**
 * Profiles routes — /api/profiles/*
 *
 * HostSpace Enterprise-Grade Form System API endpoints for profile CRUD,
 * draft management, validation, version history, and analytics.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import { moderationCheck } from '../middleware/moderation';
import {
  profileService,
  draftService,
  validationService,
  verificationService,
} from '../services/profileService';
import { eventsService } from '../services/events';
/** Public directory profiles (`profiles` collection) — not HostSpace `hostProfiles`. */
import { profilesService as directoryProfilesService } from '../services/profiles';
import { isFirestoreConfigured } from '../admin';
import {
  qparam,
  qstr,
  captureRouteError,
  parseBody,
  respondIfValidationError,
} from './utils';
import {
  HostProfileSchema,
  HostProfileFormDataSchema,
} from '../../../shared/schema/hostProfile';
import {
  ProfileDraftSchema,
  CreateProfileDraftSchema,
  UpdateProfileDraftSchema,
} from '../../../shared/schema/hostProfileDraft';
import {
  CreateProfileVersionSchema,
} from '../../../shared/schema/hostProfileVersion';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

/**
 * Schema for profile creation — coerces empty strings to undefined for
 * optional numeric/string fields (postcode, latitude, longitude).
 * Exported for unit testing.
 */
export const createProfileSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(['community', 'organiser', 'venue', 'business', 'artist', 'professional']),
  postcode: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.number().optional()
  ),
  latitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.number().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.number().optional()
  ),
}).passthrough();

// For create, we'll validate the body directly without strict typing
// since the schema is complex and Zod's type inference is causing issues
const createProfileBodySchema = HostProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  viewCount: true,
  uniqueVisitorCount: true,
  contactClickCount: true,
  searchAppearances: true,
  engagementScore: true,
});

const updateProfileBodySchema = HostProfileSchema.partial().omit({
  id: true,
  ownerId: true,
  createdAt: true,
  publishedAt: true,
});

const validateHandleSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  excludeProfileId: z.string().optional(),
});

const validateAbnSchema = z.object({
  abn: z.string().regex(/^\d{11}$/),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const profilesRouter = Router();

// ── GET /api/profiles ──────────────────────────────────────────────────────
// List profiles with optional filters
profilesRouter.get(
  '/profiles',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      const entityType = qstr(req.query.entityType).trim() || undefined;
      const status = qstr(req.query.status).trim() || undefined;
      const ownerId = qstr(req.query.ownerId).trim() || undefined;
      const handle = qstr(req.query.handle).trim() || undefined;
      const city = qstr(req.query.city).trim() || undefined;
      const country = qstr(req.query.country).trim() || undefined;
      const verificationStatus = qstr(req.query.verificationStatus).trim() || undefined;
      const q = (qstr(req.query.q) || qstr(req.query.search)).trim() || undefined;

      const page = Math.max(1, parseInt(qstr(req.query.page) || '1', 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(qstr(req.query.pageSize) || '20', 10) || 20));

      if (!isFirestoreConfigured) {
        return res.json({
          profiles: [],
          total: 0,
          page,
          pageSize,
          hasNextPage: false,
        });
      }

      const result = await profileService.list(
        {
          entityType: entityType as any,
          status: status as any,
          ownerId,
          handle,
          city,
          country,
          verificationStatus: verificationStatus as any,
          q,
        },
        { page, pageSize }
      );

      return res.json({
        profiles: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles');
      return res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  }
);

// ── GET /api/profiles/:id ──────────────────────────────────────────────────
// Get a single profile by ID
profilesRouter.get('/profiles/:id', async (req: Request, res: Response) => {
  try {
    const profile = await profileService.getById(qparam(req.params.id));
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json(profile);
  } catch (err) {
    captureRouteError(err, 'GET /api/profiles/:id');
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── GET /api/profiles/handle/:handle ───────────────────────────────────────
// Get a profile by handle
profilesRouter.get('/profiles/handle/:handle', async (req: Request, res: Response) => {
  try {
    const profile = await profileService.getByHandle(qparam(req.params.handle));
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json(profile);
  } catch (err) {
    captureRouteError(err, 'GET /api/profiles/handle/:handle');
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── POST /api/profiles/create ──────────────────────────────────────────────
// Create a new profile
profilesRouter.post(
  '/profiles/create',
  requireAuth,
  moderationCheck,
  async (req: Request, res: Response) => {
    let body: any;
    try {
      body = createProfileBodySchema.parse(req.body ?? {});
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'POST /api/profiles/create validation');
      return res.status(500).json({ error: 'Failed to parse profile payload' });
    }

    try {
      // Check handle uniqueness
      const handleExists = await validationService.checkHandleExists(body.handle);
      if (handleExists) {
        return res.status(400).json({ error: 'Handle already taken' });
      }

      // Create profile
      const profile = await profileService.create({
        ...body,
        ownerId: req.user!.id,
        lastModifiedBy: req.user!.id,
        viewCount: 0,
        uniqueVisitorCount: 0,
        contactClickCount: 0,
        searchAppearances: 0,
        engagementScore: 0,
      } as any);

      return res.status(201).json(profile);
    } catch (err) {
      captureRouteError(err, 'POST /api/profiles/create');
      return res.status(500).json({ error: 'Failed to create profile' });
    }
  }
);

// ── PUT /api/profiles/:id ──────────────────────────────────────────────────
// Update an existing profile
profilesRouter.put(
  '/profiles/:id',
  requireAuth,
  moderationCheck,
  async (req: Request, res: Response) => {
    let body: any;
    try {
      body = updateProfileBodySchema.parse(req.body ?? {});
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'PUT /api/profiles/:id validation');
      return res.status(500).json({ error: 'Failed to parse profile payload' });
    }

    try {
      const profileId = qparam(req.params.id);
      const existing = await profileService.getById(profileId);
      if (!existing) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!isOwnerOrAdmin(req.user!, existing.ownerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this profile' });
      }

      // Check handle uniqueness if handle is being changed
      if (body.handle && body.handle !== existing.handle) {
        const handleExists = await validationService.checkHandleExists(body.handle, profileId);
        if (handleExists) {
          return res.status(400).json({ error: 'Handle already taken' });
        }
      }

      // Update profile
      const updated = await profileService.update(profileId, {
        ...body,
        lastModifiedBy: req.user!.id,
      });

      return res.json(updated);
    } catch (err) {
      captureRouteError(err, 'PUT /api/profiles/:id');
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// ── POST /api/profiles/:id/draft ───────────────────────────────────────────
// Save or update a draft for a profile
profilesRouter.post(
  '/profiles/:id/draft',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const body = UpdateProfileDraftSchema.omit({ id: true, userId: true }).parse(req.body ?? {});

      const draft = await draftService.saveDraft({
        ...body,
        userId: req.user!.id,
        profileId,
      } as any);

      return res.json(draft);
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'POST /api/profiles/:id/draft');
      return res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);

// ── GET /api/profiles/drafts ───────────────────────────────────────────────
// Get all drafts for the current user
profilesRouter.get(
  '/profiles/drafts',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const entityType = qstr(req.query.entityType).trim() || undefined;
      const drafts = await draftService.getUserDrafts(req.user!.id, entityType as any);
      return res.json({ drafts });
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/drafts');
      return res.status(500).json({ error: 'Failed to fetch drafts' });
    }
  }
);

// ── GET /api/profiles/drafts/:draftId ──────────────────────────────────────
// Get a specific draft
profilesRouter.get(
  '/profiles/drafts/:draftId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const draft = await draftService.getDraft(qparam(req.params.draftId));
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      // Check ownership
      if (draft.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: you do not own this draft' });
      }

      return res.json(draft);
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/drafts/:draftId');
      return res.status(500).json({ error: 'Failed to fetch draft' });
    }
  }
);

// ── DELETE /api/profiles/drafts/:draftId ───────────────────────────────────
// Delete a draft
profilesRouter.delete(
  '/profiles/drafts/:draftId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const draft = await draftService.getDraft(qparam(req.params.draftId));
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      // Check ownership
      if (draft.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: you do not own this draft' });
      }

      await draftService.deleteDraft(qparam(req.params.draftId));
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'DELETE /api/profiles/drafts/:draftId');
      return res.status(500).json({ error: 'Failed to delete draft' });
    }
  }
);

// ── POST /api/profiles/:id/publish ─────────────────────────────────────────
// Publish a profile (change status from draft to published or pending_verification)
profilesRouter.post(
  '/profiles/:id/publish',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const existing = await profileService.getById(profileId);
      if (!existing) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!isOwnerOrAdmin(req.user!, existing.ownerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this profile' });
      }

      // Determine if verification is required
      const requiresVerification = verificationService.requiresVerification(existing);
      const newStatus = requiresVerification ? 'pending_verification' : 'published';

      // Update profile status
      const updated = await profileService.update(profileId, {
        status: newStatus,
        publishedAt: new Date().toISOString(),
        lastModifiedBy: req.user!.id,
      });

      // Create verification task if needed
      if (requiresVerification) {
        await verificationService.createVerificationTask({
          profileId,
          entityType: existing.entityType,
          submittedBy: req.user!.id,
          documents: [
            ...(existing.licences?.map(l => l.documentUrl) || []),
            ...(existing.organiserData?.insuranceCertificate?.documentUrl ? [existing.organiserData.insuranceCertificate.documentUrl] : []),
            ...(existing.professionalData?.credentials || []),
          ],
          checklist: verificationService.getChecklistForEntityType(existing.entityType),
          adminNotes: '',
        });
      }

      return res.json({
        profile: updated,
        requiresVerification,
        estimatedReviewTime: requiresVerification ? '48 hours' : null,
      });
    } catch (err) {
      captureRouteError(err, 'POST /api/profiles/:id/publish');
      return res.status(500).json({ error: 'Failed to publish profile' });
    }
  }
);

// ── GET /api/profiles/:id/versions ─────────────────────────────────────────
// Get version history for a profile
profilesRouter.get(
  '/profiles/:id/versions',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const profile = await profileService.getById(profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!isOwnerOrAdmin(req.user!, profile.ownerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this profile' });
      }

      const versions = await profileService.getVersionHistory(profileId);
      return res.json({ versions });
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/:id/versions');
      return res.status(500).json({ error: 'Failed to fetch version history' });
    }
  }
);

// ── POST /api/profiles/:id/rollback ────────────────────────────────────────
// Rollback a profile to a previous version
profilesRouter.post(
  '/profiles/:id/rollback',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const { versionNumber } = req.body;

      if (!versionNumber || typeof versionNumber !== 'number') {
        return res.status(400).json({ error: 'versionNumber is required' });
      }

      const profile = await profileService.getById(profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!isOwnerOrAdmin(req.user!, profile.ownerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this profile' });
      }

      const updated = await profileService.rollbackToVersion(profileId, versionNumber, req.user!.id);
      return res.json(updated);
    } catch (err) {
      captureRouteError(err, 'POST /api/profiles/:id/rollback');
      return res.status(500).json({ error: 'Failed to rollback profile' });
    }
  }
);

// ── POST /api/profiles/validate-handle ─────────────────────────────────────
// Validate handle uniqueness
profilesRouter.post(
  '/profiles/validate-handle',
  slidingWindowRateLimit(60000, 60),
  async (req: Request, res: Response) => {
    try {
      const body = parseBody(validateHandleSchema, req.body ?? {});
      const exists = await validationService.checkHandleExists(body.handle, body.excludeProfileId);
      return res.json({
        handle: body.handle,
        available: !exists,
        exists,
      });
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'POST /api/profiles/validate-handle');
      return res.status(500).json({ error: 'Failed to validate handle' });
    }
  }
);

// ── POST /api/profiles/validate-abn ────────────────────────────────────────
// Validate ABN format and lookup business details
profilesRouter.post(
  '/profiles/validate-abn',
  requireAuth,
  slidingWindowRateLimit(60000, 30),
  async (req: Request, res: Response) => {
    try {
      const body = parseBody(validateAbnSchema, req.body ?? {});
      const result = await validationService.validateABN(body.abn);
      return res.json(result);
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'POST /api/profiles/validate-abn');
      return res.status(500).json({ error: 'Failed to validate ABN' });
    }
  }
);

// ── GET /api/profiles/:id/analytics ────────────────────────────────────────
// Get analytics for a profile
profilesRouter.get(
  '/profiles/:id/analytics',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const profile = await profileService.getById(profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!isOwnerOrAdmin(req.user!, profile.ownerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this profile' });
      }

      const period = qstr(req.query.period) || '30-day';
      const analytics = await profileService.getAnalytics(profileId, period as any);
      return res.json(analytics);
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/:id/analytics');
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

// ── POST /api/profiles/:id/track-view ──────────────────────────────────────
// Track a profile view (public endpoint, no auth required)
profilesRouter.post(
  '/profiles/:id/track-view',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const { visitorId, source } = req.body;

      await profileService.trackView(profileId, visitorId, source);
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'POST /api/profiles/:id/track-view');
      return res.status(500).json({ error: 'Failed to track view' });
    }
  }
);

// ── POST /api/profiles/:id/track-contact-click ─────────────────────────────
// Track a contact button click (public endpoint, no auth required)
profilesRouter.post(
  '/profiles/:id/track-contact-click',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const { contactMethod } = req.body;

      await profileService.trackContactClick(profileId, contactMethod);
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'POST /api/profiles/:id/track-contact-click');
      return res.status(500).json({ error: 'Failed to track contact click' });
    }
  }
);

// ── GET /api/communities ────────────────────────────────────────────────────
// List community profiles (entityType === 'community')
profilesRouter.get(
  '/communities',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.json({ communities: [] });
      }
      const city    = qstr(req.query.city).trim()    || undefined;
      const country = qstr(req.query.country).trim() || undefined;
      const communities = await directoryProfilesService.list({ entityType: 'community', city, country });
      return res.json({ communities });
    } catch (err) {
      captureRouteError(err, 'GET /api/communities');
      return res.status(500).json({ error: 'Failed to fetch communities' });
    }
  }
);

// ── GET /api/communities/:id/recommended-events ─────────────────────────────
// Return published events associated with a community (by communityId, with
// cultureTag fallback so the list is non-empty even for newer communities).
profilesRouter.get(
  '/communities/:id/recommended-events',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.json([]);
      }
      const communityId = qparam(req.params.id);
      const pagination = { page: 1, pageSize: 20 };
      const result = await eventsService.list({ communityId }, pagination);
      let events = result.items;
      if (events.length === 0) {
        const profile = await directoryProfilesService.getById(communityId);
        const tags = (profile as any)?.cultureTag;
        const tag = Array.isArray(tags) ? tags[0] : undefined;
        if (tag) {
          const fallback = await eventsService.list({ tag }, pagination);
          events = fallback.items;
        }
      }
      return res.json(events);
    } catch (err) {
      captureRouteError(err, 'GET /api/communities/:id/recommended-events');
      return res.status(500).json({ error: 'Failed to fetch recommended events' });
    }
  }
);
