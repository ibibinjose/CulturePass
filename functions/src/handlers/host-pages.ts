/**
 * Host Pages routes — /api/host-pages/*
 *
 * Unified "Create a Page" API: CRUD, drafts, publish, admin block/unblock.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { hostPageService } from '../services/host-page.service';
import type { HostPageFormData } from '../../../shared/schema/hostPage';
import type { HostEntityType } from '../../../shared/schema/hostTypes';
import {
  qparam,
  qstr,
  captureRouteError,
  parseBody,
  respondIfValidationError,
} from './utils';

/** Local Zod v3 schemas — shared/schema uses Zod v4 and is incompatible with parseBody. */
const hostEntityTypeSchema = z.enum([
  'community',
  'organiser',
  'organizer',
  'venue',
  'business',
  'artist',
  'professional',
]);

const hostPageAddressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    lgaCode: z.string().optional(),
    placeId: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })
  .optional();

const hostPageSocialLinkSchema = z.object({
  platform: z.enum([
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
    'tiktok',
    'youtube',
    'website',
    'other',
  ]),
  url: z.string().url(),
  verified: z.boolean().default(false),
});

const hostPageExecutiveMemberSchema = z.object({
  fullName: z.string().min(2).max(120),
  role: z
    .enum(['director', 'executive', 'secretary', 'treasurer', 'chair', 'other'])
    .default('director'),
  title: z.string().max(80).optional(),
  email: z.string().optional(),
});

const hostPageFormDataSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  bio: z.string().min(10).max(300).trim(),
  registeredBusinessName: z.string().max(120).optional(),
  tradingName: z.string().max(120).optional(),
  categoryTags: z.array(z.string().min(1).max(40)).max(3).default([]),
  culturalTags: z.array(z.string().min(1).max(50)).max(12).default([]),
  languageTags: z.array(z.string().min(1).max(50)).max(12).default([]),
  nationalityId: z.string().max(40).optional(),
  cultureIds: z.array(z.string().max(40)).max(12).optional(),
  indigenousTags: z.array(z.string().max(50)).max(12).optional(),
  isIndigenousOwned: z.boolean().optional(),
  abn: z.string().optional(),
  gstRegistered: z.boolean().optional(),
  gstId: z.string().max(20).optional(),
  publicEmail: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  primaryContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional(),
  primaryAddress: hostPageAddressSchema,
  isOnlineOnly: z.boolean().optional(),
  socialLinks: z.array(hostPageSocialLinkSchema).max(8).optional(),
  executiveMembers: z.array(hostPageExecutiveMemberSchema).max(12).optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  membershipModel: z.enum(['free', 'paid', 'invite-only']).default('free'),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
  templateId: z
    .enum([
      'diaspora-festival',
      'indie-venue',
      'cultural-creator',
      'community-hub',
      'professional-services',
      'custom',
    ])
    .optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaAction: z.enum(['follow', 'join', 'book', 'contact']).optional(),
});

const createPageSchema = z.object({
  entityType: hostEntityTypeSchema,
  formData: hostPageFormDataSchema,
  templateId: z.string().optional(),
});

const updatePageSchema = z.object({
  formData: hostPageFormDataSchema.partial().optional(),
  templateId: z.string().optional(),
});

const saveDraftSchema = z.object({
  pageId: z.string().optional(),
  entityType: hostEntityTypeSchema,
  formData: hostPageFormDataSchema,
  currentStep: z.number().int().min(1).max(10),
  completedSteps: z.array(z.number().int().min(1).max(10)).optional(),
  templateId: z.string().optional(),
  draftId: z.string().optional(),
  deviceInfo: z
    .object({
      platform: z.string(),
      userAgent: z.string(),
    })
    .optional(),
});

const blockPageSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const hostPagesRouter = Router();

function isOwnerOrAdmin(user: { id: string; role?: string }, ownerId: string): boolean {
  if (user.id === ownerId) return true;
  return ['admin', 'platformAdmin', 'moderator', 'superAdmin'].includes(user.role ?? '');
}

// ── GET /api/host-pages/my ─────────────────────────────────────────────────
hostPagesRouter.get('/host-pages/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const entityType = qstr(req.query.entityType).trim() || undefined;
    const pages = await hostPageService.listForOwner(
      req.user!.id,
      entityType as HostEntityType | undefined,
    );
    return res.json({ pages });
  } catch (err) {
    captureRouteError(err, 'GET /api/host-pages/my');
    return res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// ── GET /api/host-pages/drafts ─────────────────────────────────────────────
hostPagesRouter.get('/host-pages/drafts', requireAuth, async (req: Request, res: Response) => {
  try {
    const entityType = qstr(req.query.entityType).trim() || undefined;
    const drafts = await hostPageService.getUserDrafts(
      req.user!.id,
      entityType as HostEntityType | undefined,
    );
    return res.json({ drafts });
  } catch (err) {
    captureRouteError(err, 'GET /api/host-pages/drafts');
    return res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// ── GET /api/host-pages/drafts/:draftId ────────────────────────────────────
hostPagesRouter.get('/host-pages/drafts/:draftId', requireAuth, async (req: Request, res: Response) => {
  try {
    const draft = await hostPageService.getDraft(qparam(req.params.draftId));
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    if (draft.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(draft);
  } catch (err) {
    captureRouteError(err, 'GET /api/host-pages/drafts/:draftId');
    return res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// ── DELETE /api/host-pages/drafts/:draftId ─────────────────────────────────
hostPagesRouter.delete('/host-pages/drafts/:draftId', requireAuth, async (req: Request, res: Response) => {
  try {
    const draft = await hostPageService.getDraft(qparam(req.params.draftId));
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    if (draft.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await hostPageService.deleteDraft(qparam(req.params.draftId));
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/host-pages/drafts/:draftId');
    return res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// ── POST /api/host-pages/drafts ────────────────────────────────────────────
hostPagesRouter.post('/host-pages/drafts', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = parseBody(saveDraftSchema, req.body ?? {});
    const draft = await hostPageService.saveDraft({
      ...body,
      formData: body.formData as HostPageFormData,
      userId: req.user!.id,
    });
    return res.json({
      success: true,
      draftId: draft.id,
      savedAt: draft.updatedAt,
      draft,
    });
  } catch (err) {
    if (respondIfValidationError(res, err)) return;
    captureRouteError(err, 'POST /api/host-pages/drafts');
    return res.status(500).json({ error: 'Failed to save draft' });
  }
});

// ── GET /api/host-pages/:id ────────────────────────────────────────────────
hostPagesRouter.get('/host-pages/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = await hostPageService.getById(qparam(req.params.id));
    if (!page) return res.status(404).json({ error: 'Page not found' });
    if (!isOwnerOrAdmin(req.user!, page.ownerId) && page.status !== 'published') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(page);
  } catch (err) {
    captureRouteError(err, 'GET /api/host-pages/:id');
    return res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// ── POST /api/host-pages ─────────────────────────────────────────────────────
hostPagesRouter.post('/host-pages', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = parseBody(createPageSchema, req.body ?? {});
    const page = await hostPageService.create({
      ownerId: req.user!.id,
      entityType: body.entityType,
      formData: body.formData as HostPageFormData,
      templateId: body.templateId,
      lastModifiedBy: req.user!.id,
    });
    return res.status(201).json(page);
  } catch (err) {
    if (respondIfValidationError(res, err)) return;
    captureRouteError(err, 'POST /api/host-pages');
    return res.status(500).json({ error: 'Failed to create page' });
  }
});

// ── PUT /api/host-pages/:id ────────────────────────────────────────────────
hostPagesRouter.put('/host-pages/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const pageId = qparam(req.params.id);
    const existing = await hostPageService.getById(pageId);
    if (!existing) return res.status(404).json({ error: 'Page not found' });
    if (!isOwnerOrAdmin(req.user!, existing.ownerId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = parseBody(updatePageSchema, req.body ?? {});
    const updated = await hostPageService.update(pageId, {
      ...(body.formData && {
        formData: { ...existing.formData, ...body.formData } as HostPageFormData,
      }),
      templateId: body.templateId as typeof existing.templateId,
      lastModifiedBy: req.user!.id,
    });
    return res.json(updated);
  } catch (err) {
    if (respondIfValidationError(res, err)) return;
    captureRouteError(err, 'PUT /api/host-pages/:id');
    return res.status(500).json({ error: 'Failed to update page' });
  }
});

// ── POST /api/host-pages/:id/publish ───────────────────────────────────────
hostPagesRouter.post('/host-pages/:id/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await hostPageService.publish(qparam(req.params.id), req.user!.id);
    return res.json({
      success: true,
      pageId: result.page.id,
      status: result.page.status,
      verificationRequired: result.verificationRequired,
      estimatedReviewTime: result.estimatedReviewTime,
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string };
    if (errorObj.status === 404) return res.status(404).json({ error: 'Page not found' });
    if (errorObj.status === 403) return res.status(403).json({ error: 'Forbidden' });
    if (respondIfValidationError(res, err)) return;
    captureRouteError(err, 'POST /api/host-pages/:id/publish');
    return res.status(500).json({ error: 'Failed to publish page' });
  }
});

// ── POST /api/host-pages/:id/block (admin) ─────────────────────────────────
hostPagesRouter.post(
  '/host-pages/:id/block',
  requireAuth,
  requireRole('moderator'),
  async (req: Request, res: Response) => {
    try {
      const body = parseBody(blockPageSchema, req.body ?? {});
      const page = await hostPageService.blockPage(
        qparam(req.params.id),
        req.user!.id,
        body.reason,
      );
      if (!page) return res.status(404).json({ error: 'Page not found' });
      return res.json({ success: true, page });
    } catch (err) {
      if (respondIfValidationError(res, err)) return;
      captureRouteError(err, 'POST /api/host-pages/:id/block');
      return res.status(500).json({ error: 'Failed to block page' });
    }
  },
);

// ── POST /api/host-pages/:id/unblock (admin) ───────────────────────────────
hostPagesRouter.post(
  '/host-pages/:id/unblock',
  requireAuth,
  requireRole('moderator'),
  async (req: Request, res: Response) => {
    try {
      const page = await hostPageService.unblockPage(qparam(req.params.id), req.user!.id);
      if (!page) return res.status(404).json({ error: 'Page not found' });
      return res.json({ success: true, page });
    } catch (err) {
      captureRouteError(err, 'POST /api/host-pages/:id/unblock');
      return res.status(500).json({ error: 'Failed to unblock page' });
    }
  },
);