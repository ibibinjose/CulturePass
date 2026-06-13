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
import { db } from '../admin';
import { nowIso } from './utils';

function canManageProfile(user: any, profile: any): boolean {
  if (isOwnerOrAdmin(user, profile.ownerId)) return true;

  // Support multiple organizers with roles
  const organizers = profile.organizers || [];
  return organizers.some((o: any) => 
    o.userId === user.id && 
    ['lead_organizer', 'co_organizer', 'manager', 'admin'].includes(o.role)
  );
}
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
import {
  getPublicCommunityByIdOrHandle,
  listPublicCommunities,
} from '../services/communityDirectory';
import { communityMembershipService } from '../services/communityMembership';
import { isFirestoreConfigured } from '../admin';
import { allowInlineDemoFallback, resolveDemoProfileById } from '../dev/demoFixtures';
import {
  qparam,
  qstr,
  captureRouteError,
  parseBody,
  respondIfValidationError,
} from './utils';
import {
  HostProfileSchema,
} from '../../../shared/schema/hostProfile';
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
  entityType: z.enum(['community', 'organiser', 'organizer', 'venue', 'business', 'artist', 'professional']),
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

/** Local Zod v3 — shared/schema draft schemas use Zod v4 and break parseBody in functions. */
const profileDraftDeviceInfoSchema = z
  .object({
    platform: z.string(),
    userAgent: z.string(),
  })
  .optional();

const saveProfileDraftBodySchema = z.object({
  entityType: z
    .enum(['community', 'organiser', 'organizer', 'venue', 'business', 'artist', 'professional'])
    .optional(),
  formData: z.record(z.unknown()).optional(),
  currentStep: z.number().int().min(1).max(10).optional(),
  completedSteps: z.array(z.number().int().min(1).max(10)).optional(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  deviceInfo: profileDraftDeviceInfoSchema,
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

      if (result.usedFallback) {
        res.setHeader('X-Query-Mode', 'fallback');
      }

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
  const id = qparam(req.params.id);

  if (!isFirestoreConfigured) {
    const demo = resolveDemoProfileById(id);
    if (demo) return res.json(demo);
    return res.status(404).json({ error: 'Profile not found' });
  }

  try {
    const profile = await profileService.getById(id);
    if (!profile) {
      if (allowInlineDemoFallback()) {
        const demo = resolveDemoProfileById(id);
        if (demo) return res.json(demo);
      }
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

// ── GET /api/profiles/my ──────────────────────────────────────────────────
// Get current user's profiles
profilesRouter.get(
  '/profiles/my',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await profileService.list({ ownerId: req.user!.id });
      return res.json({ profiles: result.items });
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/my');
      return res.status(500).json({ error: 'Failed to fetch your profiles' });
    }
  }
);

// ── POST /api/profiles/create ──────────────────────────────────────────────
// Create a new profile
// Alias: POST /api/profiles (RESTful)
const createProfileHandler = async (req: Request, res: Response) => {
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

    // Create profile with initial organizer (the creator as lead)
    const now = new Date().toISOString();
    const initialOrganizers = [
      {
        userId: req.user!.id,
        role: 'lead_organizer',
        title: 'Lead Organizer',
        addedAt: now,
        addedBy: req.user!.id,
      },
      ...(body.organizers || []),
    ];

    const profile = await profileService.create({
      ...body,
      ownerId: req.user!.id,
      organizers: initialOrganizers,
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
};

profilesRouter.post('/profiles/create', requireAuth, moderationCheck, createProfileHandler);
profilesRouter.post('/profiles', requireAuth, moderationCheck, createProfileHandler);

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
      if (!canManageProfile(req.user!, existing)) {
        return res.status(403).json({ error: 'Forbidden: you do not own or manage this profile' });
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

// ── DELETE /api/profiles/:id ───────────────────────────────────────────────
// Delete a profile
profilesRouter.delete(
  '/profiles/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const profileId = qparam(req.params.id);
      const existing = await profileService.getById(profileId);
      if (!existing) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (!canManageProfile(req.user!, existing)) {
        return res.status(403).json({ error: 'Forbidden: you do not own or manage this profile' });
      }

      await profileService.delete(profileId);
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'DELETE /api/profiles/:id');
      return res.status(500).json({ error: 'Failed to delete profile' });
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
      const body = parseBody(saveProfileDraftBodySchema, req.body ?? {});

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
      if (!canManageProfile(req.user!, existing)) {
        return res.status(403).json({ error: 'Forbidden: you do not own or manage this profile' });
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

// ── GET /api/profiles/handles/available ────────────────────────────────────
// Check handle availability (normalized across profiles + users.username)
profilesRouter.get(
  '/profiles/handles/available',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      const handle = qstr(req.query.handle).trim().replace(/^@/, '').toLowerCase();
      if (!handle || handle.length < 3) {
        return res.status(400).json({ available: false, reason: 'Handle too short' });
      }

      const result = await validationService.checkHandleAvailability(handle);
      return res.json(result);
    } catch (err) {
      captureRouteError(err, 'GET /api/profiles/handles/available');
      return res.status(500).json({ error: 'Failed to check handle availability' });
    }
  }
);

// ── POST /api/profiles/validate-abn ────────────────────────────────────────
// Validate ABN format and lookup business details
// Alias: /api/profiles/abn-lookup (preferred by client)
const validateAbnHandler = async (req: Request, res: Response) => {
  try {
    const body = parseBody(validateAbnSchema, req.body ?? {});
    const result = await validationService.validateABN(body.abn);

    // Map service result to client expectation (ABNLookupResponse)
    return res.json({
      ok: result.valid,
      validated: result.valid,
      entityName: result.businessName,
      abn: body.abn,
      error: result.error,
      raw: result,
    });
  } catch (err) {
    if (respondIfValidationError(res, err)) return;
    captureRouteError(err, 'POST /api/profiles/validate-abn');
    return res.status(500).json({ error: 'Failed to validate ABN' });
  }
};

profilesRouter.post('/profiles/validate-abn', requireAuth, slidingWindowRateLimit(60000, 30), validateAbnHandler);
profilesRouter.post('/profiles/abn-lookup', requireAuth, slidingWindowRateLimit(60000, 30), validateAbnHandler);

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

// ────────────────────────────────────────────────────────────────────────────
// TEAM & ORGANIZERS MANAGEMENT ENDPOINTS (Communities, Businesses, etc.)
// Supports multiple organizers with roles + full audit logging
// ────────────────────────────────────────────────────────────────────────────

/** POST /api/profiles/:id/team — Add or update team member */
profilesRouter.post('/profiles/:id/team', requireAuth, async (req: Request, res: Response) => {
  const profileId = qparam(req.params.id);
  const { userId, role, title } = req.body || {};

  if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });

  const profile = await profileService.getById(profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  if (!canManageProfile(req.user!, profile)) return res.status(403).json({ error: 'Forbidden' });

  const organizers = [...((profile as any).organizers || [])];
  const idx = organizers.findIndex((o: any) => o.userId === userId);

  const entry = {
    userId,
    role,
    title: title || role.replace(/_/g, ' '),
    addedAt: nowIso(),
    addedBy: req.user!.id,
  };

  if (idx >= 0) organizers[idx] = { ...organizers[idx], ...entry };
  else organizers.push(entry);

  await profileService.update(profileId, { organizers } as any);

  await db.collection('auditLogs').add({
    action: 'team_member_added_or_updated',
    userId: req.user!.id,
    userName: req.user!.username || req.user!.id,
    targetId: profileId,
    targetType: 'profile',
    metadata: { addedUserId: userId, role },
    createdAt: nowIso(),
  });

  return res.json({ ok: true, organizers });
});

/** DELETE /api/profiles/:id/team/:userId — Remove team member */
profilesRouter.delete('/profiles/:id/team/:userId', requireAuth, async (req: Request, res: Response) => {
  const profileId = qparam(req.params.id);
  const targetUserId = qparam(req.params.userId);

  const profile = await profileService.getById(profileId);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  if (!canManageProfile(req.user!, profile)) return res.status(403).json({ error: 'Forbidden' });

  const remaining = ((profile as any).organizers || []).filter((o: any) => o.userId !== targetUserId);
  const hasLead = remaining.some((o: any) => o.role === 'lead_organizer');
  if (!hasLead) return res.status(400).json({ error: 'Cannot remove last lead organizer' });

  await profileService.update(profileId, { organizers: remaining } as any);

  await db.collection('auditLogs').add({
    action: 'team_member_removed',
    userId: req.user!.id,
    userName: req.user!.username || req.user!.id,
    targetId: profileId,
    targetType: 'profile',
    metadata: { removedUserId: targetUserId },
    createdAt: nowIso(),
  });

  return res.json({ ok: true, organizers: remaining });
});

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

const COMMUNITY_ROUTE_RESERVED = new Set([
  'joined',
  'join',
  'leave',
  'members',
  'businesses',
  'publish',
  'recommended-events',
]);

// ── GET /api/communities/joined ─────────────────────────────────────────────
profilesRouter.get(
  '/communities/joined',
  requireAuth,
  slidingWindowRateLimit(60000, 60),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) return res.json({ communityIds: [] });
      const communityIds = await communityMembershipService.listJoinedCommunityIds(req.user!.id);
      return res.json({ communityIds });
    } catch (err) {
      captureRouteError(err, 'GET /api/communities/joined');
      return res.status(500).json({ error: 'Failed to fetch joined communities' });
    }
  },
);

// ── POST /api/communities/:id/join ──────────────────────────────────────────
profilesRouter.post(
  '/communities/:id/join',
  requireAuth,
  slidingWindowRateLimit(60000, 40),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.json({ success: true, communityId: qparam(req.params.id) });
      }
      const communityId = qparam(req.params.id);
      if (COMMUNITY_ROUTE_RESERVED.has(communityId)) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const community = await getPublicCommunityByIdOrHandle(communityId);
      if (!community) return res.status(404).json({ error: 'Community not found' });
      const resolvedId = typeof community.id === 'string' ? community.id : communityId;
      await communityMembershipService.join(req.user!.id, resolvedId);
      return res.json({ success: true, communityId: resolvedId });
    } catch (err) {
      captureRouteError(err, 'POST /api/communities/:id/join');
      return res.status(500).json({ error: 'Failed to join community' });
    }
  },
);

// ── DELETE /api/communities/:id/leave ───────────────────────────────────────
profilesRouter.delete(
  '/communities/:id/leave',
  requireAuth,
  slidingWindowRateLimit(60000, 40),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.json({ success: true, communityId: qparam(req.params.id) });
      }
      const communityId = qparam(req.params.id);
      if (COMMUNITY_ROUTE_RESERVED.has(communityId)) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const community = await getPublicCommunityByIdOrHandle(communityId);
      const resolvedId =
        typeof community?.id === 'string' ? community.id : communityId;
      await communityMembershipService.leave(req.user!.id, resolvedId);
      return res.json({ success: true, communityId: resolvedId });
    } catch (err) {
      captureRouteError(err, 'DELETE /api/communities/:id/leave');
      return res.status(500).json({ error: 'Failed to leave community' });
    }
  },
);

// ── GET /api/communities ────────────────────────────────────────────────────
// List public community hubs (directory profiles + synced community host pages)
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
      const communities = await listPublicCommunities({ city, country });
      return res.json({ communities });
    } catch (err) {
      captureRouteError(err, 'GET /api/communities');
      return res.status(500).json({ error: 'Failed to fetch communities' });
    }
  }
);

// ── GET /api/communities/:id ────────────────────────────────────────────────
profilesRouter.get(
  '/communities/:id',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const id = qparam(req.params.id);
      if (COMMUNITY_ROUTE_RESERVED.has(id)) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const community = await getPublicCommunityByIdOrHandle(id);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      return res.json(community);
    } catch (err) {
      captureRouteError(err, 'GET /api/communities/:id');
      return res.status(500).json({ error: 'Failed to fetch community' });
    }
  }
);

const SPARSE_COMMUNITY_EVENTS_MIN = 3;

function dedupeCommunityEvents<T extends { id?: string }>(primary: T[], extra: T[]): T[] {
  const seen = new Set(primary.map((e) => e.id).filter(Boolean));
  const out = [...primary];
  for (const e of extra) {
    if (!e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
    if (out.length >= 20) break;
  }
  return out;
}

// ── GET /api/communities/:id/recommended-events ─────────────────────────────
// Return published events associated with a community (by communityId, with
// cultureTag and location fallbacks so the list stays useful while inventory is sparse).
profilesRouter.get(
  '/communities/:id/recommended-events',
  slidingWindowRateLimit(60000, 100),
  async (req: Request, res: Response) => {
    try {
      if (!isFirestoreConfigured) {
        return res.json([]);
      }
      const communityId = qparam(req.params.id);
      const dateFrom = new Date().toISOString().split('T')[0]!;
      const pagination = { page: 1, pageSize: 20 };
      const community = await getPublicCommunityByIdOrHandle(communityId);
      const resolvedId = typeof community?.id === 'string' ? community.id : communityId;
      const result = await eventsService.list({ communityId: resolvedId, dateFrom }, pagination);
      let events = result.items;

      if (events.length < SPARSE_COMMUNITY_EVENTS_MIN) {
        const profile = community
          ? (community as Record<string, unknown>)
          : await directoryProfilesService.getById(communityId);
        const tags = (profile as { cultureTags?: string[] })?.cultureTags;
        if (Array.isArray(tags)) {
          for (const tag of tags.slice(0, 3)) {
            if (events.length >= SPARSE_COMMUNITY_EVENTS_MIN) break;
            const fallback = await eventsService.list({ tag, dateFrom }, pagination);
            events = dedupeCommunityEvents(events, fallback.items);
          }
        }
      }

      if (events.length < SPARSE_COMMUNITY_EVENTS_MIN && community) {
        const country = String((community as { country?: string }).country ?? 'Australia');
        const city = String((community as { city?: string }).city ?? '').trim();
        if (city) {
          const cityResult = await eventsService.list({ city, country, dateFrom }, pagination);
          events = dedupeCommunityEvents(events, cityResult.items);
        }
        if (events.length < SPARSE_COMMUNITY_EVENTS_MIN) {
          const countryResult = await eventsService.list({ country, dateFrom }, pagination);
          events = dedupeCommunityEvents(events, countryResult.items);
        }
      }

      return res.json(events);
    } catch (err) {
      captureRouteError(err, 'GET /api/communities/:id/recommended-events');
      return res.status(500).json({ error: 'Failed to fetch recommended events' });
    }
  }
);
