import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import {
  DEFAULT_ACKNOWLEDGEMENT,
  DEFAULT_AU_STATES,
  locationsService,
} from '../services/locations';

export const locationsRouter = Router();

/**
 * GET /api/locations — Australian states + cities for onboarding pickers.
 * Response shape matches `LocationsResponse` in src/platform/api/endpoints/locations.ts.
 */
locationsRouter.get('/locations', async (req: Request, res: Response) => {
  try {
    const country = String(req.query.country ?? 'AU').trim().toUpperCase();

    await locationsService.seedIfEmpty();

    let doc = await locationsService.get(country);
    if (!doc && country === 'AU') {
      doc = {
        name: 'Australia',
        countryCode: 'AU',
        acknowledgement: DEFAULT_ACKNOWLEDGEMENT,
        states: DEFAULT_AU_STATES,
        updatedAt: new Date().toISOString(),
      };
    }

    if (!doc) {
      return res.status(404).json({ error: 'Location data not found' });
    }

    const cities = doc.states.flatMap((state) => state.cities);

    return res.json({
      locations: [
        {
          country: doc.name,
          countryCode: doc.countryCode,
          states: doc.states,
          cities,
        },
      ],
      acknowledgementOfCountry: doc.acknowledgement ?? DEFAULT_ACKNOWLEDGEMENT,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/locations');
    return res.status(500).json({ error: 'Failed to fetch locations' });
  }
});