import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { citiesService } from '../services/cities';
import { authenticate, requireRole } from '../middleware/auth';

export const citiesRouter = Router();

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/** GET /api/cities/featured — public, returns featured cities ordered by `order` */
citiesRouter.get('/cities/featured', async (_req: Request, res: Response) => {
  try {
    const cities = await citiesService.getFeatured();
    if (cities.length === 0) {
      // Auto-seed on first call so the rail is never empty
      await citiesService.seed();
      const seeded = await citiesService.getFeatured();
      return res.json({ cities: seeded });
    }
    return res.json({ cities });
  } catch (err) {
    captureRouteError(err, 'GET /api/cities/featured');
    return res.status(500).json({ error: 'Failed to load featured cities' });
  }
});

// ---------------------------------------------------------------------------
// Admin — all require 'admin' role
// ---------------------------------------------------------------------------

/** GET /api/cities — admin: all cities */
citiesRouter.get('/cities', [authenticate, requireRole('admin')], async (_req: Request, res: Response) => {
  try {
    const cities = await citiesService.getAll();
    return res.json({ cities });
  } catch (err) {
    captureRouteError(err, 'GET /api/cities');
    return res.status(500).json({ error: 'Failed to load cities' });
  }
});

/** POST /api/cities — admin: create a new featured city */
citiesRouter.post('/cities', [authenticate, requireRole('admin')], async (req: Request, res: Response) => {
  try {
    const { name, countryCode, countryName, countryEmoji, stateCode, imageUrl, featured, order, lat, lng } = req.body;
    if (!name || !countryCode || !countryName || !countryEmoji) {
      return res.status(400).json({ error: 'name, countryCode, countryName, and countryEmoji are required' });
    }
    const city = await citiesService.create({ name, countryCode, countryName, countryEmoji, stateCode, imageUrl, featured, order, lat, lng });
    return res.status(201).json({ city });
  } catch (err) {
    captureRouteError(err, 'POST /api/cities');
    return res.status(500).json({ error: 'Failed to create city' });
  }
});

/** PATCH /api/cities/:id — admin: update a city */
citiesRouter.patch('/cities/:id', [authenticate, requireRole('admin')], async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    await citiesService.update(id, req.body);
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PATCH /api/cities/:id');
    return res.status(500).json({ error: 'Failed to update city' });
  }
});

/** DELETE /api/cities/:id — admin: delete a city */
citiesRouter.delete('/cities/:id', [authenticate, requireRole('admin')], async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    await citiesService.delete(id);
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/cities/:id');
    return res.status(500).json({ error: 'Failed to delete city' });
  }
});

/** POST /api/cities/seed — admin: (re)seed default featured cities */
citiesRouter.post('/cities/seed', [authenticate, requireRole('admin')], async (_req: Request, res: Response) => {
  try {
    await citiesService.seed();
    return res.json({ ok: true, message: 'Default featured cities seeded' });
  } catch (err) {
    captureRouteError(err, 'POST /api/cities/seed');
    return res.status(500).json({ error: 'Failed to seed cities' });
  }
});
