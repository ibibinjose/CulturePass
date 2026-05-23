import express, { Request, Response } from 'express';
import { db } from '../admin';
import { captureRouteError } from './utils';

export function createIndigenousRouter() {
  const router = express.Router();

  router.get('/indigenous/traditional-lands', async (req: Request, res: Response) => {
    try {
      const city = String(req.query.city ?? '').toLowerCase();
      let query: FirebaseFirestore.Query = db.collection('traditionalLands');
      if (city) query = query.where('city', '==', city.charAt(0).toUpperCase() + city.slice(1));
      const snap = await query.get();
      return res.json(snap.docs.map((d) => d.data()));
    } catch (err) {
      captureRouteError(err, 'GET /api/indigenous/traditional-lands');
      return res.status(500).json({ error: 'Failed to fetch traditional lands' });
    }
  });

  router.get('/indigenous/spotlights', async (req: Request, res: Response) => {
    const limitRaw = Number.parseInt(String(req.query.limit ?? '10'), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 10;

    try {
      const snap = await db.collection('indigenousSpotlights').orderBy('createdAt', 'desc').limit(limit).get();
      return res.json(snap.docs.map((d) => d.data()));
    } catch (err) {
      captureRouteError(err, 'GET /api/indigenous/spotlights');
      return res.status(500).json({ error: 'Failed to fetch spotlights' });
    }
  });

  router.get('/indigenous/organisations', async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const country = String(req.query.country ?? '').trim();
    const featuredOnly = String(req.query.featured ?? '').toLowerCase() === 'true';
    const limitRaw = Number.parseInt(String(req.query.limit ?? '20'), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 60) : 20;

    try {
      let queryRef: FirebaseFirestore.Query = db.collection('indigenousOrganisations');
      if (country) queryRef = queryRef.where('country', '==', country);
      if (featuredOnly) queryRef = queryRef.where('featured', '==', true);
      const snap = await queryRef.limit(limit).get();
      const records = snap.docs.map((doc) => doc.data() as Record<string, unknown>);
      const filtered = q
        ? records.filter((org) => {
            const name = String(org.name ?? '').toLowerCase();
            const city = String(org.city ?? '').toLowerCase();
            const areas = Array.isArray(org.focusAreas) ? org.focusAreas.join(' ').toLowerCase() : '';
            return name.includes(q) || city.includes(q) || areas.includes(q);
          })
        : records;
      return res.json(filtered.slice(0, limit));
    } catch (err) {
      captureRouteError(err, 'GET /api/indigenous/organisations');
      return res.status(500).json({ error: 'Failed to fetch indigenous organisations' });
    }
  });

  router.get('/indigenous/festivals', async (req: Request, res: Response) => {
    const region = String(req.query.region ?? '').trim().toLowerCase();
    const indigenousOnly = String(req.query.indigenousOnly ?? '').toLowerCase() === 'true';
    const limitRaw = Number.parseInt(String(req.query.limit ?? '40'), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 80) : 40;

    try {
      let queryRef: FirebaseFirestore.Query = db.collection('culturalFestivals');
      if (region) queryRef = queryRef.where('region', '==', region);
      if (indigenousOnly) queryRef = queryRef.where('indigenousLed', '==', true);
      const snap = await queryRef.limit(limit).get();
      return res.json(snap.docs.map((doc) => doc.data()));
    } catch (err) {
      captureRouteError(err, 'GET /api/indigenous/festivals');
      return res.status(500).json({ error: 'Failed to fetch indigenous festivals' });
    }
  });

  router.get('/indigenous/businesses', async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const country = String(req.query.country ?? '').trim();
    const featuredOnly = String(req.query.featured ?? '').toLowerCase() === 'true';
    const limitRaw = Number.parseInt(String(req.query.limit ?? '20'), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 60) : 20;

    try {
      let queryRef: FirebaseFirestore.Query = db.collection('indigenousBusinesses');
      if (country) queryRef = queryRef.where('country', '==', country);
      if (featuredOnly) queryRef = queryRef.where('featured', '==', true);
      const snap = await queryRef.limit(limit).get();
      const records = snap.docs.map((doc) => doc.data() as Record<string, unknown>);
      const filtered = q
        ? records.filter((business) => {
            const name = String(business.name ?? '').toLowerCase();
            const city = String(business.city ?? '').toLowerCase();
            const category = String(business.category ?? '').toLowerCase();
            return name.includes(q) || city.includes(q) || category.includes(q);
          })
        : records;
      return res.json(filtered.slice(0, limit));
    } catch (err) {
      captureRouteError(err, 'GET /api/indigenous/businesses');
      return res.status(500).json({ error: 'Failed to fetch indigenous businesses' });
    }
  });

  return router;
}
