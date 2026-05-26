/**
 * Host Application routes (/api/host-applications/*)
 *
 * Flow:
 *   User submits application → stored in `hostApplications` Firestore collection
 *   Admin reviews → PUT /:id/approve or /:id/reject
 *   On approve → user's role is set to 'organizer' via Firebase Auth custom claims
 */

import { Router } from 'express';
import { z } from 'zod';
import { db, isFirestoreConfigured, authAdmin } from '../admin';
import { requireAuth, ROLE_RANK, userRank } from '../middleware/auth';
import { captureRouteError, nowIso, parseBody, qparam, qstr } from './utils';
import type {
  HostApplication,
  HostApplicationStatus,
  HostType,
} from '../../../shared/schema/hostApplication';
import type { Request, Response } from 'express'; // Added for better type safety

export const hostApplicationRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const SubmitSchema = z.object({
  hostType: z.enum(['creator', 'business', 'organizer', 'venue', 'community']),
  fullName: z.string().min(2).max(120),
  businessName: z.string().max(120).optional().nullable(),
  description: z.string().min(20).max(1000),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(4).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  instagramHandle: z.string().max(60).optional().nullable(),
  motivation: z.string().max(500).optional().nullable(),
});

const ReviewSchema = z.object({
  reviewNote: z.string().max(500).optional().nullable(),
});

// ─── POST /host-applications — submit application ─────────────────────────────

hostApplicationRouter.post('/host-applications', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    // Log the incoming request for better debugging
    console.log(`Received host application submission request from user: ${userId}`);
    
    const payload = parseBody(SubmitSchema, req.body);

    if (isFirestoreConfigured) {
      // Check for existing pending/approved application
      const existing = await db
        .collection('hostApplications')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'approved'])
        .limit(1)
        .get();

      if (!existing.empty) {
        const doc = existing.docs[0];
        const app = { id: doc.id, ...(doc.data() as object) } as HostApplication;
        // If already approved, re-grant role in case it was lost and return success
        if (app.status === 'approved') {
          await authAdmin.setCustomUserClaims(userId, { role: 'organizer' });
          await db.collection('users').doc(userId).set(
            { role: 'organizer', updatedAt: nowIso() },
            { merge: true },
          );
        }
        return res.status(409).json({
          error: 'already_applied',
          message: 'You already have an active application.',
          applicationId: doc.id,
          status: app.status,
        });
      }
    }

    const now = nowIso();
    const ref = isFirestoreConfigured
      ? db.collection('hostApplications').doc()
      : { id: `mock-app-${Date.now()}` };

    const application: HostApplication = {
      id: ref.id,
      userId,
      hostType: payload.hostType as HostType,
      fullName: payload.fullName,
      businessName: payload.businessName ?? null,
      description: payload.description,
      city: payload.city ?? null,
      country: payload.country ?? null,
      websiteUrl: payload.websiteUrl ?? null,
      instagramHandle: payload.instagramHandle ?? null,
      motivation: payload.motivation ?? null,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirestoreConfigured) {
      await (ref as FirebaseFirestore.DocumentReference).set(application);
      // No role upgrade here — only on explicit admin approval via PUT /:id/approve
    }

    console.log(`Host application created (pending) id=${ref.id} user=${userId} type=${payload.hostType}`);
    return res.status(201).json(application);
  } catch (err) {
    captureRouteError(err, 'POST /host-applications');
    return res.status(400).json({ error: 'Failed to submit application' });
  }
});

// ─── GET /host-applications/me — check own status ────────────────────────────

hostApplicationRouter.get('/host-applications/me', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  try {
    if (!isFirestoreConfigured) {
      return res.json({ application: null });
    }
    const snap = await db
      .collection('hostApplications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return res.json({ application: null });
    const doc = snap.docs[0];
    return res.json({ application: { id: doc.id, ...(doc.data() as object) } });
  } catch (err) {
    captureRouteError(err, 'GET /host-applications/me');
    return res.json({ application: null });
  }
});

// ─── GET /host-applications — list all (admin only) ───────────────────────────

hostApplicationRouter.get('/host-applications', requireAuth, async (req, res) => {
  if (userRank(req.user!) < ROLE_RANK['moderator']) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    if (!isFirestoreConfigured) return res.json({ applications: [] });

    const status = qstr(req.query.status) || undefined;
    const limitRaw = parseInt(String(req.query.limit || ''), 10);
    const limit = Math.max(1, Math.min(200, isNaN(limitRaw) ? 100 : limitRaw));

    let q: FirebaseFirestore.Query = db.collection('hostApplications').orderBy('createdAt', 'desc').limit(limit);
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      q = q.where('status', '==', status);
    }

    const snap = await q.get();
    const applications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return res.json({ applications, count: applications.length, limit });
  } catch (err) {
    captureRouteError(err, 'GET /host-applications');
    return res.status(500).json({ error: 'Failed to list applications' });
  }
});

// ─── PUT /host-applications/:id/approve ──────────────────────────────────────

hostApplicationRouter.put('/host-applications/:id/approve', requireAuth, async (req: Request, res: Response) => {
  if (userRank(req.user!) < ROLE_RANK['moderator']) {
    return res.status(403).json({ error: 'Forbidden', message: 'User not authorized to approve applications' });
  }
  
  const id = qparam(req.params.id);
  if (!id) {
    return res.status(400).json({ 
      error: 'Invalid id', 
      message: 'Application ID is required in the URL parameters' 
    });
  }
  
  // Log the approval request
  console.log(`Approval request for application ID: ${id}, requested by user: ${req.user!.id}`);

  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore not configured' });

    const { reviewNote } = parseBody(ReviewSchema, req.body ?? {});
    const ref = db.collection('hostApplications').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });

    const app = { id: snap.id, ...(snap.data() as object) } as HostApplication;

    // Upgrade the user's Firebase Auth custom claims to role: organizer
    await authAdmin.setCustomUserClaims(app.userId, { role: 'organizer' });

    // Also update the users/{uid} Firestore document
    await db.collection('users').doc(app.userId).set(
      { role: 'organizer', updatedAt: nowIso() },
      { merge: true },
    );

    const now = nowIso();
    await ref.update({
      status: 'approved',
      reviewedBy: req.user!.id,
      reviewedAt: now,
      reviewNote: reviewNote ?? null,
      updatedAt: now,
    });

    // Audit log
    try {
      await db.collection('auditLogs').add({
        action: 'host_application_approved',
        userId: req.user!.id,
        userName: req.user!.username || req.user!.id,
        targetId: id,
        targetType: 'hostApplication',
        metadata: { applicantId: app.userId, reviewNote: reviewNote ?? null },
        createdAt: now,
      });
    } catch (auditErr) {
      console.warn('Failed to write audit log for host approve', auditErr);
    }

    const updated = await ref.get();
    console.log(`Host application approved id=${id} by=${req.user!.id}`);
    return res.json({ id: updated.id, ...(updated.data() as object) });
  } catch (err) {
    captureRouteError(err, `PUT /host-applications/${id}/approve`);
    return res.status(500).json({ error: 'Failed to approve application' });
  }
});

// ─── PUT /host-applications/:id/reject ───────────────────────────────────────

hostApplicationRouter.put('/host-applications/:id/reject', requireAuth, async (req: Request, res: Response) => {
  if (userRank(req.user!) < ROLE_RANK['moderator']) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'User not authorized to reject applications' 
    });
  }
  
  const id = qparam(req.params.id);
  if (!id) {
    return res.status(400).json({ 
      error: 'Invalid id', 
      message: 'Application ID is required in the URL parameters' 
    });
  }
  
  // Log the rejection request
  console.log(`Rejection request for application ID: ${id}, requested by user: ${req.user!.id}`);

  try {
    if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore not configured' });
    const { reviewNote } = parseBody(ReviewSchema, req.body ?? {});
    const ref = db.collection('hostApplications').doc(id);
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Not found' });

    const now = nowIso();
    await ref.update({
      status: 'rejected',
      reviewedBy: req.user!.id,
      reviewedAt: now,
      reviewNote: reviewNote ?? null,
      updatedAt: now,
    });

    // Audit log
    try {
      await db.collection('auditLogs').add({
        action: 'host_application_rejected',
        userId: req.user!.id,
        userName: req.user!.username || req.user!.id,
        targetId: id,
        targetType: 'hostApplication',
        metadata: { applicantId: (await ref.get()).data()?.userId ?? null, reviewNote: reviewNote ?? null },
        createdAt: now,
      });
    } catch (auditErr) {
      console.warn('Failed to write audit log for host reject', auditErr);
    }

    console.log(`Host application rejected id=${id} by=${req.user!.id}`);
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, `PUT /host-applications/${id}/reject`);
    return res.status(500).json({ error: 'Failed to reject application' });
  }
});
