import { Router } from 'express';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { moviesService } from '../services/movies';
import { wrap } from './utils';

export const moviesRouter = Router();

// Public: List movies
moviesRouter.get('/movies', wrap(async (req, res) => {
  const { city, country, genre, status } = req.query;
  const items = await moviesService.list({ 
    city: city as string, 
    country: country as string, 
    genre: genre as string,
    status: status as string
  });
  res.json(items);
}));

// Public: Get movie by ID
moviesRouter.get('/movies/:id', wrap(async (req, res) => {
  const item = await moviesService.getById(String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Movie not found' });
  res.json(item);
}));

// Private: Create movie (organizer or admin only)
moviesRouter.post('/movies', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  const item = await moviesService.create({ ...req.body, ownerId: req.user!.id });
  res.status(201).json(item);
}));

// Private: Update movie (organizer or admin only)
moviesRouter.put('/movies/:id', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  const existing = await moviesService.getById(String(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Movie not found' });
  if (!isOwnerOrAdmin(req.user!, existing.ownerId ?? null)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const item = await moviesService.update(String(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: 'Movie not found' });
  res.json(item);
}));

// Private: Delete movie (admin only)
moviesRouter.delete('/movies/:id', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  await moviesService.delete(String(req.params.id));
  res.json({ success: true });
}));
