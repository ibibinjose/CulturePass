/**
 * Culture Explorer routes — /api/culture-explorer/*
 *
 *   GET /api/culture-explorer/summary           — Passport panel (auth required)
 *   GET /api/culture-explorer/quests?city=&country=  — Quest rail (auth optional)
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getSummary, listActiveQuests } from '../services/cultureExplorer';
import { captureRouteError, qstr } from './utils';

export const cultureExplorerRouter = Router();

cultureExplorerRouter.get(
  '/culture-explorer/summary',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const uid = req.user!.id;
      const summary = await getSummary(uid);
      return res.json(summary);
    } catch (err) {
      captureRouteError(err, 'GET /api/culture-explorer/summary');
      return res.status(500).json({ error: 'Failed to load passport summary' });
    }
  },
);

cultureExplorerRouter.get(
  '/culture-explorer/quests',
  async (req: Request, res: Response) => {
    try {
      const city = qstr(req.query.city).trim();
      const country = qstr(req.query.country).trim();
      const uid = req.user?.id;
      const data = await listActiveQuests({ uid, city, country });
      return res.json(data);
    } catch (err) {
      captureRouteError(err, 'GET /api/culture-explorer/quests');
      return res.status(500).json({ error: 'Failed to load quests' });
    }
  },
);
