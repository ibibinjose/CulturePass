// @tag:restaurant
import { Router } from 'express';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { restaurantsService } from '../services/restaurants';
import { wrap, captureRouteError } from './utils';

export const restaurantsRouter = Router();

// Public: List restaurants
restaurantsRouter.get('/restaurants', wrap(async (req, res) => {
  try {
    const { city, country, cuisine, status } = req.query;
    const items = await restaurantsService.list({
      city: city as string,
      country: country as string,
      cuisine: cuisine as string,
      status: status as string,
    });
    res.json(items);
  } catch (err) {
    captureRouteError(err, 'GET /restaurants');
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
}));

// Public: Get restaurant by ID
restaurantsRouter.get('/restaurants/:id', wrap(async (req, res) => {
  try {
    const item = await restaurantsService.getById(String(req.params.id));
    if (!item) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'GET /restaurants/:id');
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
}));

// Private: Create restaurant (organizer or admin only)
restaurantsRouter.post('/restaurants', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const item = await restaurantsService.create({ ...req.body, ownerId: req.user!.id });
    res.status(201).json(item);
  } catch (err) {
    captureRouteError(err, 'POST /restaurants');
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
}));

// Private: Update restaurant (organizer or admin only)
restaurantsRouter.put('/restaurants/:id', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const existing = await restaurantsService.getById(String(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Restaurant not found' });
    if (!isOwnerOrAdmin(req.user!, existing.ownerId ?? null)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const item = await restaurantsService.update(String(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'PUT /restaurants/:id');
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
}));

// Private: Delete restaurant (admin only)
restaurantsRouter.delete('/restaurants/:id', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    await restaurantsService.delete(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /restaurants/:id');
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
}));

// Private: Set restaurant promoted status (admin only)
restaurantsRouter.post('/restaurants/:id/promote', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    let isPromoted = req.body?.isPromoted;
    if (typeof isPromoted === 'string') {
      if (isPromoted === 'true') isPromoted = true;
      else if (isPromoted === 'false') isPromoted = false;
    }
    if (typeof isPromoted !== 'boolean') {
      return res.status(400).json({ error: 'isPromoted required and must be a boolean' });
    }
    const item = await restaurantsService.setPromoted(String(req.params.id), isPromoted);
    if (!item) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'POST /restaurants/:id/promote');
    res.status(500).json({ error: 'Failed to update restaurant promotion' });
  }
}));
