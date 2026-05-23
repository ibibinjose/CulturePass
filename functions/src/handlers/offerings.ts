/**
 * GET /api/offerings — aggregated unified offerings across restaurants, shops, activities, movies.
 */

import { Router } from 'express';
import {
  buildUnifiedOfferings,
  filterUnifiedOfferings,
  OFFERING_DOMAINS,
  OFFERING_KINDS,
  type OfferingDomain,
  type OfferingKind,
  type UnifiedOffering,
} from '../../../shared/schema/offering';
import { restaurantsService } from '../services/restaurants';
import { shoppingService } from '../services/shopping';
import { activitiesService } from '../services/activities';
import { moviesService } from '../services/movies';
import type { ActivityData } from '../../../shared/schema';
import { wrap, captureRouteError } from './utils';

export const offeringsRouter = Router();

function norm(v: unknown): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === undefined || s === null) return undefined;
  const t = String(s).trim();
  return t.length ? t : undefined;
}

function parseSet<T extends string>(raw: string | undefined, allowed: readonly T[]): Set<T> | undefined {
  if (!raw?.trim()) return undefined;
  const out = new Set<T>();
  for (const part of raw.split(',')) {
    const p = part.trim() as T;
    if (allowed.includes(p)) out.add(p);
  }
  return out.size ? out : undefined;
}

offeringsRouter.get('/offerings', wrap(async (req, res) => {
  try {
    const city = norm(req.query.city);
    const country = norm(req.query.country);
    const limitRaw = norm(req.query.limit);
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw ?? '80', 10) || 80));

    const kinds = parseSet<OfferingKind>(norm(req.query.kinds), OFFERING_KINDS);
    const domains = parseSet<OfferingDomain>(norm(req.query.domains), OFFERING_DOMAINS);

    const filters = { city, country, status: 'active' as const };

    const [rRes, sRes, aRes, mRes] = await Promise.allSettled([
      restaurantsService.list(filters),
      shoppingService.list(filters),
      activitiesService.list({ city }),
      moviesService.list({ city, country, status: 'active' }),
    ]);

    const restaurants = rRes.status === 'fulfilled' ? rRes.value : [];
    const shops = sRes.status === 'fulfilled' ? sRes.value : [];
    let activities = aRes.status === 'fulfilled' ? aRes.value : [];
    const movies = mRes.status === 'fulfilled' ? mRes.value : [];

    if (rRes.status === 'rejected') console.warn('[offerings] restaurants list failed:', (rRes.reason as Error)?.message);
    if (sRes.status === 'rejected') console.warn('[offerings] shopping list failed:', (sRes.reason as Error)?.message);
    if (aRes.status === 'rejected') console.warn('[offerings] activities list failed:', (aRes.reason as Error)?.message);
    if (mRes.status === 'rejected') console.warn('[offerings] movies list failed:', (mRes.reason as Error)?.message);

    if (country) {
      activities = activities.filter((a) => (a.country ?? '').toLowerCase() === country.toLowerCase());
    }

    let offerings: UnifiedOffering[] = buildUnifiedOfferings({
      restaurants,
      shops,
      activities: activities as ActivityData[],
      movies,
    });

    offerings = filterUnifiedOfferings(offerings, kinds, domains);
    offerings = offerings.slice(0, limit);

    return res.json({ offerings, total: offerings.length });
  } catch (err) {
    captureRouteError(err, 'GET /offerings');
    return res.status(500).json({ error: 'Failed to fetch offerings' });
  }
}));
