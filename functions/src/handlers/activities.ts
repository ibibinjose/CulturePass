import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { activitiesService } from '../services/firestore';
import { requireAuth, requireRole } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody,
  captureRouteError,
} from './utils';

export const activitiesRouter = Router();

const activitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

/** GET /api/activities — list activities */
activitiesRouter.get('/activities', async (req: Request, res: Response) => {
  const city = String(req.query.city ?? '').trim();
  try {
    const activities = await activitiesService.list({ city });
    return res.json({ activities });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

/** GET /api/activities/:id — activity detail */
activitiesRouter.get('/activities/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const activity = await activitiesService.getById(id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    return res.json(activity);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/** POST /api/activities — create activity */
activitiesRouter.post('/activities', requireAuth, requireRole('business', 'organizer', 'admin', 'platformAdmin', 'cityAdmin'), moderationCheck, async (req: Request, res: Response) => {
  try {
    const data = parseBody(activitySchema, req.body);
    const ownerId = req.user!.id;
    
    // activitiesService.create returns the FirestoreActivity object
    const fresh = await activitiesService.create({ 
      ...data, 
      ownerId,
      status: data.status || 'published'
    });
    return res.status(201).json(fresh);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create activity' });
  }
});

/** PUT /api/activities/:id — update activity */
activitiesRouter.put('/activities/:id', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const updates = parseBody(activitySchema.partial(), req.body);
    
    const existing = await activitiesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Activity not found' });
    if (existing.ownerId !== req.user!.id && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const updated = await activitiesService.update(id, updates);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update activity' });
  }
});

/** DELETE /api/activities/:id — delete activity */
activitiesRouter.delete('/activities/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const existing = await activitiesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Activity not found' });
    if (existing.ownerId !== req.user!.id && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    await activitiesService.delete(id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete activity' });
  }
});

/** POST /api/activities/:id/promote — promote activity */
activitiesRouter.post('/activities/:id/promote', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const existing = await activitiesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Activity not found' });
    if (existing.ownerId !== req.user!.id && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    await activitiesService.update(id, { isPromoted: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to promote activity' });
  }
});
