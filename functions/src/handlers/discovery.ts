
import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import { searchService } from '../services/firestore';
import { resolveDiscoverCuration } from '../services/discoverCuration';
import { getDiscoverFeedWithContracts } from '../services/discoverDomain';

export const discoveryRouter = Router();

/** GET /api/discover/trending — trending events */
discoveryRouter.get('/discover/trending', async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json([]);
    const trending = await searchService.getTrending(10);
    return res.json(trending);
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/trending');
    return res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

/** GET /api/discover — personalized discovery feed for current user */
discoveryRouter.get('/discover', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json({ trendingEvents: [], rankedEvents: [], suggestedCommunities: [] });
    const dateFrom = String(req.query.dateFrom || new Date().toISOString().split('T')[0]);
    const result = await searchService.getTrending(20) as Array<{ date?: string; [k: string]: unknown }>;
    const filtered = result.filter(e => (e.date ?? '') >= dateFrom);
    return res.json({
      trendingEvents: filtered,
      rankedEvents: [],
      suggestedCommunities: []
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/discover');
    return res.status(500).json({ error: 'Failed to fetch discovery feed' });
  }
});

/** GET /api/discover/:userId — personalized discovery feed
 *  - userId === 'guest' → public, no auth required
 *  - any other userId  → requires auth + must be owner or admin
 */
discoveryRouter.get('/discover/curation', async (req: Request, res: Response) => {
  try {
    const cultureIds = String(req.query.cultureIds ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await resolveDiscoverCuration({
      city: req.query.city ? String(req.query.city) : undefined,
      country: req.query.country ? String(req.query.country) : undefined,
      cultureIds,
    });

    return res.json(response);
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/curation');
    return res.status(500).json({ error: 'Failed to fetch discover curation' });
  }
});

discoveryRouter.get('/discover/:userId', async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');

  if (userId !== 'guest') {
    // Non-guest: enforce authentication
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!isOwnerOrAdmin(req.user, userId)) return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    if (!isFirestoreConfigured) return res.json({ trendingEvents: [], rankedEvents: [], forYouEvents: [], suggestedCommunities: [] });

    // Fetch the user's cultural identity so ranking can weight culture-matched events
    let cultureIds: string[] = [];
    let exploringCultureIds: string[] = [];
    if (userId !== 'guest') {
      const userSnap = await db.collection('users').doc(userId).get();
      if (userSnap.exists) {
        const ci = (userSnap.data() as Record<string, any>)?.culturalIdentity ?? {};
        cultureIds = (ci.cultureIds ?? []) as string[];
        exploringCultureIds = (ci.exploringCultureIds ?? []) as string[];
      }
    }

    const feed = await getDiscoverFeedWithContracts(userId, {
      userId,
      city: req.query.city ? String(req.query.city) : undefined,
      country: req.query.country ? String(req.query.country) : undefined,
      cultureIds,
      exploringCultureIds,
    });

    return res.json({
      // Canonical contract used by mobile/web clients
      meta: feed.meta,
      trendingEvents: feed.trendingEvents,
      rankedEvents: feed.rankedEvents,
      forYouEvents: feed.forYouEvents,
      suggestedCommunities: feed.suggestedCommunities,
      // Backward-compat fields (safe to remove after all clients migrate)
      rankedEventList: feed.rankedEvents.map((item) => item.event),
      ranking: feed.rankedEvents,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/:userId');
    return res.status(500).json({ error: 'Failed to fetch discovery feed' });
  }
});

/** POST /api/discover/feedback — provide feedback on discovery items */
discoveryRouter.post('/discover/feedback', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.body?.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  return res.json({ ok: true });
});

/** GET /api/cultural-intelligence/:userId — get cultural intelligence data for user */
discoveryRouter.get('/cultural-intelligence/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  return res.json({
    userId,
    score: 85,
    badges: ['CultureSeeker', 'CommunityBuilder'],
    lastUpdated: new Date().toISOString()
  });
});
