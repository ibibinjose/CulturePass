
import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { locationsService } from '../services/locations';
import { authenticate, requireRole } from '../middleware/auth';
import { isFirestoreConfigured } from '../admin';

export const locationsRouter = Router();

/** GET /api/locations — public, cache-first */
locationsRouter.get('/locations', async (_req: Request, res: Response) => {
  try {
    const doc = await locationsService.get('AU');
    if (!doc) await locationsService.seedIfEmpty();
    const fresh = doc ?? (await locationsService.get('AU'));
    if (fresh) {
      const allCities = fresh.states.flatMap((s) => s.cities);
      return res.json({
        locations: [{
          country: fresh.name,
          countryCode: fresh.countryCode,
          states: fresh.states,
          cities: allCities,
        }],
        acknowledgementOfCountry: fresh.acknowledgement,
      });
    }
    return res.status(404).json({ error: 'Location data not found' });
  } catch (err) {
    captureRouteError(err, 'GET /api/locations');
    return res.status(500).json({ error: 'Failed to load locations' });
  }
});

/** POST /api/locations/:countryCode/seed — admin: seed/reset location data */
locationsRouter.post('/locations/:countryCode/seed', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string }>, res: Response) => {
  try {
    const { countryCode } = req.params;
    if (countryCode !== 'AU') return res.status(400).json({ error: 'Only AU is supported' });
    await locationsService.forceSeed();
    return res.json({ ok: true, countryCode });
  } catch (err) {
    captureRouteError(err, 'POST /api/locations/:cc/seed');
    return res.status(500).json({ error: 'Force seed failed' });
  }
});

/** POST /api/locations/:countryCode/states — admin: add new state */
locationsRouter.post('/locations/:countryCode/states', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string }>, res: Response) => {
  try {
    const { countryCode } = req.params;
    const { name, code, emoji, cities } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
    await locationsService.addState(countryCode, { name, code, emoji: emoji ?? '📍', cities: cities ?? [] });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add state' });
  }
});

/** PATCH /api/locations/:countryCode/states/:stateCode — admin: update state */
locationsRouter.patch('/locations/:countryCode/states/:stateCode', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string; stateCode: string }>, res: Response) => {
  try {
    const { countryCode, stateCode } = req.params;
    await locationsService.updateState(countryCode, stateCode, req.body);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update state' });
  }
});

/** DELETE /api/locations/:countryCode/states/:stateCode — admin: remove state */
locationsRouter.delete('/locations/:countryCode/states/:stateCode', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string; stateCode: string }>, res: Response) => {
  try {
    const { countryCode, stateCode } = req.params;
    await locationsService.removeState(countryCode, stateCode);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove state' });
  }
});

/** POST /api/locations/:countryCode/states/:stateCode/cities — admin: add city */
locationsRouter.post('/locations/:countryCode/states/:stateCode/cities', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string; stateCode: string }>, res: Response) => {
  try {
    const { countryCode, stateCode } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'city name is required' });
    await locationsService.addCity(countryCode, stateCode, name);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add city' });
  }
});

/** DELETE /api/locations/:countryCode/states/:stateCode/cities/:city — admin: remove city */
locationsRouter.delete('/locations/:countryCode/states/:stateCode/cities/:city', [authenticate, requireRole('admin')], async (req: Request<{ countryCode: string; stateCode: string; city: string }>, res: Response) => {
  try {
    const { countryCode, stateCode, city } = req.params;
    await locationsService.removeCity(countryCode, stateCode, city);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove city' });
  }
});
