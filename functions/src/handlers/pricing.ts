/**
 * Pricing routes — /api/pricing/*
 * Public catalog for membership display + analytics reference.
 */

import { Router, type Request, type Response } from 'express';
import { qstr, captureRouteError } from './utils';
import { getMembershipPricingPlans } from '../services/pricing';

export const pricingRouter = Router();

/** GET /api/pricing/plans?country=Australia */
pricingRouter.get('/pricing/plans', async (req: Request, res: Response) => {
  try {
    const country = qstr(req.query.country) || undefined;
    const plans = await getMembershipPricingPlans(country);
    return res.json(plans);
  } catch (err) {
    captureRouteError(err, 'pricing/plans');
    return res.status(500).json({ error: 'Failed to load pricing plans' });
  }
});

/** GET /api/pricing/membership?country=Australia — alias focused on CulturePass+ */
pricingRouter.get('/pricing/membership', async (req: Request, res: Response) => {
  try {
    const country = qstr(req.query.country) || undefined;
    const plans = await getMembershipPricingPlans(country);
    return res.json({
      market: plans.market,
      country: plans.country,
      currency: plans.currency,
      plans: plans.membership,
      platform: plans.platform,
      organizer: plans.organizer,
      fetchedAt: plans.fetchedAt,
    });
  } catch (err) {
    captureRouteError(err, 'pricing/membership');
    return res.status(500).json({ error: 'Failed to load membership pricing' });
  }
});