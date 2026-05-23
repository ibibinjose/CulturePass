import { Router } from 'express';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { shoppingService } from '../services/shopping';
import { wrap, captureRouteError } from './utils';
import { ShopInputSchema } from './validation';
import type { ShopInput } from '../../../shared/schema';
import { z } from 'zod';

export const shoppingRouter = Router();

// Public: List shops
shoppingRouter.get('/shopping', wrap(async (req, res) => {
  try {
    // Normalize query params to string | undefined
    const norm = (v: unknown) => Array.isArray(v) ? v[0] : v;
    const city = norm(req.query.city) as string | undefined;
    const country = norm(req.query.country) as string | undefined;
    const category = norm(req.query.category) as string | undefined;
    const status = norm(req.query.status) as string | undefined;
    const items = await shoppingService.list({ city, country, category, status });
    res.json(items);
  } catch (err) {
    captureRouteError(err, 'GET /shopping');
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
}));

// Public: Get shop by ID
shoppingRouter.get('/shopping/:id', wrap(async (req, res) => {
  try {
    const item = await shoppingService.getById(String(req.params.id));
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'GET /shopping/:id');
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
}));

// Private: Create shop (organizer or admin only)
shoppingRouter.post('/shopping', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const parse = ShopInputSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid request', details: parse.error.errors });
    }
    const item = await shoppingService.create({ ...(parse.data as ShopInput), ownerId: req.user!.id });
    res.status(201).json(item);
  } catch (err) {
    captureRouteError(err, 'POST /shopping');
    res.status(500).json({ error: 'Failed to create shop' });
  }
}));

// Private: Update shop (organizer or admin only)
shoppingRouter.put('/shopping/:id', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const parse = ShopInputSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid request', details: parse.error.errors });
    }
    const existing = await shoppingService.getById(String(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Shop not found' });
    if (!isOwnerOrAdmin(req.user!, existing.ownerId ?? null)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const item = await shoppingService.update(String(req.params.id), parse.data as Partial<ShopInput>);
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'PUT /shopping/:id');
    res.status(500).json({ error: 'Failed to update shop' });
  }
}));

// Private: Delete shop (admin only)
shoppingRouter.delete('/shopping/:id', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    await shoppingService.delete(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /shopping/:id');
    res.status(500).json({ error: 'Failed to delete shop' });
  }
}));

// Private: Set shop promoted status (admin only)
shoppingRouter.post('/shopping/:id/promote', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    let isPromoted = req.body?.isPromoted;
    if (typeof isPromoted === 'string') {
      if (isPromoted === 'true') isPromoted = true;
      else if (isPromoted === 'false') isPromoted = false;
    }
    if (typeof isPromoted !== 'boolean') {
      return res.status(400).json({ error: 'isPromoted required and must be a boolean' });
    }
    const item = await shoppingService.setPromoted(String(req.params.id), isPromoted);
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'POST /shopping/:id/promote');
    res.status(500).json({ error: 'Failed to update shop promotion' });
  }
}));
