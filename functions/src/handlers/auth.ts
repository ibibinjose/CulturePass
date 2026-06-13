/**
 * Auth routes — /api/auth/*
 *
 * POST /register and /login are handled client-side via Firebase Auth SDK.
 * Only /me and /register (Firestore profile creation) are needed here.
 */

import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Firestore } from 'firebase-admin/firestore';
import { db, authAdmin } from '../admin';
import { requireAuth } from '../middleware/auth';
import {
  nowIso,
  generateSecureId,
  parseBody,
  respondIfValidationError,
  captureRouteError,
} from './utils';

export const authRouter = Router();

type RequestUser = NonNullable<Request['user']>;

const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,30}$/;

/** Build a valid username segment from a display name (letters, numbers, _ . -). */
function slugifyUsernameFromDisplayName(raw: string): string {
  const s = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '');
  const trimmed = s.replace(/^[^a-z0-9]+/g, '').replace(/[^a-z0-9]+$/g, '').slice(0, 30);
  return USERNAME_RE.test(trimmed) ? trimmed : '';
}

async function isUsernameTaken(firestore: Firestore, username: string, exceptUid?: string): Promise<boolean> {
  const q = await firestore.collection('users').where('username', '==', username).limit(5).get();
  if (q.empty) return false;
  if (exceptUid) {
    return q.docs.some((d) => d.id !== exceptUid);
  }
  return true;
}

/**
 * Picks a unique username: explicit body.username, else slug(displayName), else email local-part.
 */
async function allocateUsername(
  firestore: Firestore,
  explicit: string | undefined,
  displayName: string | undefined,
  emailLocalFallback: string,
): Promise<string> {
  const normalizedExplicit = explicit?.trim();
  if (normalizedExplicit && USERNAME_RE.test(normalizedExplicit)) {
    const taken = await isUsernameTaken(firestore, normalizedExplicit);
    if (!taken) return normalizedExplicit.toLowerCase();
  }

  const fromName = displayName ? slugifyUsernameFromDisplayName(displayName) : '';
  let base =
    fromName ||
    emailLocalFallback.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30) ||
    'member';
  if (base.length < 2) base = 'member';
  base = base.slice(0, 30).toLowerCase();

  for (let i = 0; i < 60; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 22)}_${i}`;
    const c = candidate.slice(0, 30);
    if (!USERNAME_RE.test(c)) continue;
    if (!(await isUsernameTaken(firestore, c))) return c;
  }
  return `${base.slice(0, 12)}_${randomBytes(4).toString('hex')}`.slice(0, 30);
}

// ---------------------------------------------------------------------------
// Shared: create Firestore users/{uid} + wallet + membership + welcome notif
// Idempotent when doc already exists (caller should check first).
// ---------------------------------------------------------------------------
async function materializeUserDocument(
  uid: string,
  reqUser: RequestUser,
  fields: {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: number | null;
    country?: string;
    role?: 'user' | 'organizer';
  },
): Promise<Record<string, unknown>> {
  const requestedRole = fields.role ?? 'user';
  const emailLocal = (reqUser.email?.split('@')[0] ?? 'user')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .slice(0, 30) || 'user';

  const username = await allocateUsername(db, fields.username, fields.displayName, emailLocal);
  const displayName =
    (fields.displayName && String(fields.displayName).trim()) || username;
  const handle = username.toLowerCase();

  const profile = {
    username,
    displayName,
    handle,
    email: reqUser.email ?? null,
    ...(fields.avatarUrl ? { avatarUrl: fields.avatarUrl } : {}),
    city: fields.city ?? null,
    state: fields.state ?? null,
    postcode: fields.postcode != null ? Number(fields.postcode) : null,
    country: fields.country ?? 'Australia',
    culturePassId: generateSecureId('CP-U'),
    role: requestedRole,
    createdAt: nowIso(),
  };
  await db.collection('users').doc(uid).set(profile);
  await Promise.all([
    db.collection('users').doc(uid).collection('wallet').doc('main').set({ balanceCents: 0, currency: 'AUD', points: 0 }),
    db.collection('users').doc(uid).collection('membership').doc('current').set({ tier: 'free', isActive: true }),
    db.collection('notifications').add({
      userId: uid,
      title: 'Welcome to CulturePass!',
      message: `Your ${requestedRole} account is ready.`,
      type: 'system',
      isRead: false,
      createdAt: nowIso(),
    }),
    authAdmin.setCustomUserClaims(uid, {
      role: requestedRole,
      tier: 'free',
      ...(profile.city && { city: String(profile.city) }),
      country: String(profile.country ?? 'Australia'),
      username: profile.username,
    }),
  ]);
  return { id: uid, ...profile };
}

// ---------------------------------------------------------------------------
// GET /api/auth/me  +  GET /auth/me (legacy alias)
// Materializes Firestore profile on first hit so clients do not depend on
// POST /auth/register (avoids 404 when that route is missing on stale deploys).
// ---------------------------------------------------------------------------
const authMeHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  try {
    let snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      try {
        let firebaseDisplayName: string | undefined;
        let firebasePhotoUrl: string | undefined;
        try {
          const rec = await authAdmin.getUser(uid);
          firebaseDisplayName = rec.displayName ?? undefined;
          firebasePhotoUrl = rec.photoURL ?? undefined;
        } catch {
          // ignore — bootstrap without display name
        }
        await materializeUserDocument(uid, req.user!, {
          country: req.user!.country ?? 'Australia',
          city: req.user!.city ?? null,
          role: 'user',
          displayName: firebaseDisplayName,
          avatarUrl: firebasePhotoUrl ?? null,
        });
        snap = await db.collection('users').doc(uid).get();
      } catch (bootstrapErr) {
        captureRouteError(bootstrapErr, 'auth/me-bootstrap');
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
    }

    const data = snap.data() ?? {};
    if (!data.avatarUrl) {
      try {
        const rec = await authAdmin.getUser(uid);
        if (rec.photoURL) {
          const now = nowIso();
          await db.collection('users').doc(uid).set(
            { avatarUrl: rec.photoURL, avatarUpdatedAt: now, updatedAt: now },
            { merge: true },
          );
          snap = await db.collection('users').doc(uid).get();
        }
      } catch {
        // optional OAuth photo backfill
      }
    }

    return res.json({ id: uid, role: req.user!.role, ...snap.data() });
  } catch (err) {
    captureRouteError(err, 'auth/me');
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

authRouter.get('/auth/me', requireAuth, authMeHandler);

// ---------------------------------------------------------------------------
// POST /api/auth/register — create Firestore profile after Firebase Auth
// account creation. Idempotent: returns existing profile if already created.
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  username:    z.string().min(2).max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, underscores, dots, and hyphens').optional(),
  displayName: z.string().min(1).max(80).optional(),
  city:        z.string().min(1).max(100).optional(),
  state:       z.string().min(1).max(100).optional(),
  postcode:    z.union([z.string().max(10), z.number()]).optional().nullable(),
  country:     z.string().min(2).max(100).optional(),
  role:        z.enum(['user', 'organizer']).optional(),
});

const authRegisterHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  let body: z.infer<typeof registerSchema>;
  try {
    body = parseBody(registerSchema, req.body ?? {});
  } catch (err) {
    if (respondIfValidationError(res, err)) return;
    return res.status(400).json({ error: 'Invalid registration payload' });
  }
  const { displayName, city, state, postcode, country, username } = body;
  const requestedRole = body.role ?? 'user';
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      const created = await materializeUserDocument(uid, req.user!, {
        username,
        displayName,
        city: city ?? null,
        state: state ?? null,
        postcode: postcode != null ? Number(postcode) : null,
        country: country ?? 'Australia',
        role: requestedRole,
      });
      return res.status(201).json(created);
    }
    return res.json({ id: uid, ...snap.data() });
  } catch (err) {
    captureRouteError(err, 'auth/register');
    return res.status(500).json({ error: 'Profile creation failed' });
  }
};

authRouter.post('/auth/register', requireAuth, authRegisterHandler);
