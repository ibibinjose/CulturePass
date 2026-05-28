import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { usersService } from '../services/firestore';
import { requireAuth } from '../middleware/auth';
import { db, isFirestoreConfigured } from '../admin';
import { sanitizeUserResponse, parseBody,
  captureRouteError,
} from './utils';

import { moderationCheck } from '../middleware/moderation';

export const usersRouter = Router();



const userUpdateSchema = z.object({
  username: z.string().nullish(),
  handle: z.string().nullish(),
  displayName: z.string().nullish(),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  postcode: z.coerce.number().int().min(0).nullish(),
  country: z.string().nullish(),
  bio: z.string().max(500).nullish(),
  avatarUrl: z.string().nullish(),
  website: z.string().nullish(),
  location: z.string().nullish(),
  socialLinks: z.record(z.string()).nullish(),
  interests: z.array(z.string()).nullish(),
  communities: z.array(z.string()).nullish(),
  languages: z.array(z.string()).nullish(),
  ethnicityText: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  culturalIdentity: z.record(z.unknown()).nullish(),
  interestCategoryIds: z.array(z.string()).nullish(),
  lgaCode: z.string().nullish(),
  councilId: z.string().nullish(),
  privacySettings: z.record(z.boolean()).nullish(),
});

/** GET /api/users — list users (limited to 100) */
usersRouter.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await usersService.list(100);
    return res.json(users.map((u) => sanitizeUserResponse(u as any, req.user)));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/** GET /api/users/me — current authenticated user */
usersRouter.get('/users/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    captureRouteError(err, 'GET /api/users/me');
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

/** GET /api/users/:id — fetch any user by ID */
usersRouter.get('/users/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const user = await usersService.getById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let shareContacts = false;
    if (req.user) {
      if (req.user.id === id || req.user.role === 'admin' || req.user.role === 'platformAdmin') {
        shareContacts = true;
      } else if (isFirestoreConfigured) {
        // Disclose contacts if requester follows the user OR saved their contact
        const followId = `${req.user.id}_user_${id}`;
        const contactSaveId = `${req.user.id}_${id}`;
        const [followSnap, contactSaveSnap] = await Promise.all([
          db.collection('follows').doc(followId).get(),
          db.collection('contactSaves').doc(contactSaveId).get(),
        ]);
        if (followSnap.exists || contactSaveSnap.exists) {
          shareContacts = true;
        }
      }
    }

    let responseObj = sanitizeUserResponse(user as any, req.user);
    if (shareContacts) {
      responseObj = {
        ...responseObj,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
      };
    }

    return res.json(responseObj);
  } catch (err) {
    captureRouteError(err, 'GET /api/users/:id');
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/** PUT /api/users/:id — update user profile */
usersRouter.put('/users/:id', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id ?? '');
    if (req.user!.id !== userId && req.user!.role !== 'admin' && req.user!.role !== 'platformAdmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates = parseBody(userUpdateSchema, req.body);

    // Enforce username/handle uniqueness on updates (prevents collisions that registration already guards)
    if (updates.username) {
      const normalized = String(updates.username).toLowerCase().trim();
      const existing = await db
        .collection('users')
        .where('username', '==', normalized)
        .limit(2)
        .get();
      const conflict = existing.docs.some((d) => d.id !== userId);
      if (conflict) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
      // Also keep handle in sync if not explicitly provided
      if (!updates.handle) {
        updates.handle = normalized;
      }
    }

    await usersService.update(userId, updates as any);
    const fresh = await usersService.getById(userId);
    return res.json(fresh);
  } catch (err: any) {
    captureRouteError(err, 'PUT /api/users/:id');
    return res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});
