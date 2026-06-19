/**
 * Council / LGA routes — location attribute only (proximity & filtering).
 * No claims, waste, grants, or civic “dashboard” APIs.
 */

import { Router, Request, Response } from 'express';
import {
  calculateDistance,
  findNearestPostcodes,
  getPostcodeData,
  getPostcodesByPlace,
} from '../../../shared/location/australian-postcodes';
import { db } from '../admin';
import { requireAuth } from '../middleware/auth';
import { nowIso, captureRouteError } from './utils';
import { usersService } from '../services/firestore';
import { councilsService } from '../services/councils';

export const councilRouter = Router();

type CouncilDoc = Record<string, unknown>;

const AU_STATE_NAME_TO_CODE: Record<string, string> = {
  'new south wales': 'NSW',
  victoria: 'VIC',
  queensland: 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  tasmania: 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
};

const AU_STATE_CODES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']);

function normCity(city?: string): string {
  return String(city ?? '').trim().toLowerCase();
}

/** Map full state names or codes to canonical AU state codes (NSW, VIC, …). */
function normState(state?: string): string {
  const raw = String(state ?? '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (AU_STATE_CODES.has(upper)) return upper;
  const fromName = AU_STATE_NAME_TO_CODE[raw.toLowerCase()];
  return fromName ?? upper;
}

function docMatchesCityState(data: CouncilDoc, cityNorm: string, stateNorm: string): boolean {
  const dataState = String(data.state ?? '').toUpperCase();
  if (stateNorm && dataState && dataState !== stateNorm) return false;
  if (!cityNorm) return Boolean(stateNorm && dataState === stateNorm);
  const buckets: string[] = [];
  const push = (v: unknown) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      for (const x of v) buckets.push(String(x).toLowerCase());
    } else {
      buckets.push(String(v).toLowerCase());
    }
  };
  push(data.city);
  push(data.suburb);
  push(data.serviceCities);
  push(data.serviceSuburbs);
  if (buckets.some((b) => b && (b === cityNorm || b.includes(cityNorm) || cityNorm.includes(b)))) {
    return true;
  }
  const councilName = String(data.name ?? '').toLowerCase();
  return Boolean(cityNorm && councilName.includes(cityNorm));
}

function resolveCouncilCoordinates(data: CouncilDoc): { lat: number; lng: number } | null {
  const lat =
    toNumber(data.latitude) ??
    toNumber(data.lat) ??
    toNumber(data.centreLat) ??
    toNumber(data.centerLat);
  const lng =
    toNumber(data.longitude) ??
    toNumber(data.lng) ??
    toNumber(data.centreLng) ??
    toNumber(data.centerLng);
  if (lat != null && lng != null) return { lat, lng };

  const postcode = toNumber(data.postcode);
  if (postcode != null) {
    const pc = getPostcodeData(postcode);
    if (pc) return { lat: pc.latitude, lng: pc.longitude };
  }

  const placeCandidates = [
    data.suburb,
    data.city,
    ...(Array.isArray(data.serviceCities) ? data.serviceCities : []),
    ...(Array.isArray(data.serviceSuburbs) ? data.serviceSuburbs : []),
  ];
  for (const place of placeCandidates) {
    const name = String(place ?? '').trim();
    if (!name) continue;
    const matches = getPostcodesByPlace(name);
    if (matches[0]) return { lat: matches[0].latitude, lng: matches[0].longitude };
  }

  return null;
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function findCouncilByCityState(city?: string, state?: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const cityNorm = normCity(city);
  const stateNorm = normState(state);
  if (!cityNorm && !stateNorm) return null;

  let q: FirebaseFirestore.Query = db.collection('councils');
  if (stateNorm) q = q.where('state', '==', stateNorm);
  const snap = await q.limit(300).get();
  const hit = snap.docs.find((doc) => docMatchesCityState(doc.data() as CouncilDoc, cityNorm, stateNorm));
  return hit ?? null;
}

async function findNearestCouncilByCoordinates(
  latitude: number,
  longitude: number,
  state?: string,
): Promise<{ doc: FirebaseFirestore.QueryDocumentSnapshot; distanceKm: number } | null> {
  const stateNorm = normState(state);
  let q: FirebaseFirestore.Query = db.collection('councils');
  if (stateNorm) q = q.where('state', '==', stateNorm);
  const snap = await q.limit(1000).get();
  let best: { doc: FirebaseFirestore.QueryDocumentSnapshot; distanceKm: number } | null = null;

  for (const doc of snap.docs) {
    const data = doc.data() as CouncilDoc;
    const coords = resolveCouncilCoordinates(data);
    if (!coords) continue;
    const distanceKm = calculateDistance(latitude, longitude, coords.lat, coords.lng);
    if (!best || distanceKm < best.distanceKm) {
      best = { doc, distanceKm };
    }
  }

  if (!best && stateNorm) {
    return findNearestCouncilByCoordinates(latitude, longitude);
  }

  return best ?? null;
}

async function getCouncilDocById(id: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const doc = await db.collection('councils').doc(id).get();
  return doc.exists ? doc : null;
}

/**
 * Resolve LGA for the signed-in user: users/{uid}.councilId / lgaCode, legacy userCouncilLinks, then city fallback.
 */
async function resolveCouncilForUser(
  userId: string,
  city?: string,
  state?: string,
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const user = await usersService.getById(userId);
  if (user?.councilId) {
    const doc = await getCouncilDocById(user.councilId);
    if (doc) return doc;
  }
  if (user?.lgaCode) {
    const q = await db.collection('councils').where('lgaCode', '==', user.lgaCode).limit(1).get();
    if (!q.empty) return q.docs[0]!;
  }

  const link = await db
    .collection('userCouncilLinks')
    .where('userId', '==', userId)
    .where('isPrimary', '==', true)
    .limit(1)
    .get();
  if (!link.empty) {
    const cid = link.docs[0]!.data().councilId as string | undefined;
    if (cid) {
      const doc = await getCouncilDocById(cid);
      if (doc) return doc;
    }
  }

  return findCouncilByCityState(city ?? user?.city, state ?? user?.state);
}

function filterCouncilRows(
  rows: { id: string; data: CouncilDoc }[],
  q: string,
  state: string,
): { id: string; data: CouncilDoc }[] {
  let out = rows;
  if (state) {
    out = out.filter((r) => String(r.data.state ?? '').toUpperCase() === state);
  }
  if (q) {
    out = out.filter((r) => {
      const name = String(r.data.name ?? '').toLowerCase();
      const suburb = String(r.data.suburb ?? '').toLowerCase();
      const lga = String(r.data.lgaCode ?? '').toLowerCase();
      return name.includes(q) || suburb.includes(q) || lga.includes(q);
    });
  }
  return out;
}

/** GET /api/council/list — browse LGAs (location picker, directory) */
councilRouter.get('/council/list', async (req: Request, res: Response) => {
  try {
    const snap = await db.collection('councils').get();
    const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as CouncilDoc }));
    const q = normCity(String(req.query.q ?? ''));
    const state = normState(String(req.query.state ?? ''));
    const filtered = filterCouncilRows(rows, q, state);
    const councils = filtered.map((r) => ({ id: r.id, ...r.data }));
    return res.json({
      councils,
      totalCount: councils.length,
      hasNextPage: false,
      source: 'firestore',
    });
  } catch (err) {
    captureRouteError(err, 'GET /council/list');
    return res.status(500).json({ error: 'Failed to fetch councils' });
  }
});

/** GET /api/council/resolve — best LGA for a place (no auth; business / guest UI) */
councilRouter.get('/council/resolve', async (req: Request, res: Response) => {
  const city = String(req.query.city ?? '').trim();
  const state = String(req.query.state ?? '').trim();
  const country = String(req.query.country ?? '').trim().toLowerCase();
  if (country && country !== 'australia' && country !== 'au') {
    return res.json({ council: null });
  }
  try {
    const hit = await findCouncilByCityState(city || undefined, state || undefined);
    if (!hit) return res.json({ council: null });
    return res.json({ council: { id: hit.id, ...hit.data() } });
  } catch (err) {
    captureRouteError(err, 'GET /council/resolve');
    return res.status(500).json({ error: 'Failed to resolve council' });
  }
});

/** GET /api/council/nearest — best LGA from lat/lng, with city/state fallback */
councilRouter.get('/council/nearest', async (req: Request, res: Response) => {
  const city = String(req.query.city ?? '').trim();
  const stateRaw = String(req.query.state ?? '').trim();
  const state = normState(stateRaw);
  const country = String(req.query.country ?? '').trim().toLowerCase();
  const latitude = toNumber(req.query.latitude);
  const longitude = toNumber(req.query.longitude);

  const requestInfo = { latitude, longitude, city, state, stateRaw, country };

  if (country && country !== 'australia' && country !== 'au') {
    console.log('[council/nearest] non-AU request ignored', requestInfo);
    return res.json({ council: null, matchMethod: 'none' });
  }

  try {
    await councilsService.seedIfEmpty();

    let result: { doc: FirebaseFirestore.QueryDocumentSnapshot; distanceKm: number } | null = null;
    let matchMethod: 'coordinate' | 'city-state' | 'none' = 'none';

    if (latitude != null && longitude != null) {
      result = await findNearestCouncilByCoordinates(latitude, longitude, state || undefined);
      if (result) matchMethod = 'coordinate';
    }

    if (!result) {
      const hit = await findCouncilByCityState(city || undefined, state || undefined);
      if (hit) {
        result = { doc: hit, distanceKm: 0 };
        matchMethod = 'city-state';
      }
    }

    if (!result && latitude != null && longitude != null) {
      const nearestPlace = findNearestPostcodes(latitude, longitude, 1)[0];
      if (nearestPlace) {
        const hit = await findCouncilByCityState(nearestPlace.place_name, nearestPlace.state_code);
        if (hit) {
          result = {
            doc: hit,
            distanceKm: calculateDistance(
              latitude,
              longitude,
              nearestPlace.latitude,
              nearestPlace.longitude,
            ),
          };
          matchMethod = 'city-state';
        }
      }
    }

    if (!result) {
      console.log('[council/nearest] no match found', requestInfo);
      return res.json({ council: null, matchMethod: 'none' });
    }

    const councilData = { id: result.doc.id, ...result.doc.data() };

    // Refined confidence scoring
    let confidence: 'strong' | 'medium' | 'weak' = 'weak';
    if (matchMethod === 'coordinate') {
      if (result.distanceKm <= 25) confidence = 'strong';
      else if (result.distanceKm <= 75) confidence = 'medium';
      else confidence = 'weak';
    } else if (matchMethod === 'city-state') {
      confidence = 'medium';
    }

    console.log('[council/nearest] resolved', {
      ...requestInfo,
      councilId: result.doc.id,
      matchMethod,
      distanceKm: result.distanceKm,
      confidence,
    });

    return res.json({
      council: councilData,
      // Only include distanceKm when we actually used coordinates
      ...(matchMethod === 'coordinate' ? { distanceKm: result.distanceKm } : {}),
      matchMethod,
      confidence,
    });
  } catch (err) {
    captureRouteError(err, 'GET /council/nearest');
    return res.status(500).json({ error: 'Failed to resolve nearest council' });
  }
});

/** GET /api/council/selected — signed-in user’s LGA (same payload as /council/my) */
councilRouter.get('/council/selected', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const city = String(req.query.city ?? '').trim();
  const state = String(req.query.state ?? '').trim();
  try {
    const hit = await resolveCouncilForUser(userId, city || undefined, state || undefined);
    if (!hit) return res.json({ council: null });
    return res.json({ council: { id: hit.id, ...hit.data() } });
  } catch (err) {
    captureRouteError(err, 'GET /council/selected');
    return res.status(500).json({ error: 'Failed to fetch selected council' });
  }
});

/** GET /api/council/my — signed-in user’s LGA for discovery / calendar */
councilRouter.get('/council/my', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const city = String(req.query.city ?? '').trim();
  const state = String(req.query.state ?? '').trim();
  try {
    const hit = await resolveCouncilForUser(userId, city || undefined, state || undefined);
    if (!hit) return res.json({ council: null });
    return res.json({ council: { id: hit.id, ...hit.data() } });
  } catch (err) {
    captureRouteError(err, 'GET /council/my');
    return res.status(500).json({ error: 'Failed to resolve council' });
  }
});

/** POST /api/council/select — persist chosen LGA on users/{uid} (+ clear legacy links) */
councilRouter.post('/council/select', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const councilId = String((req.body as { councilId?: string })?.councilId ?? '').trim();
  if (!councilId) return res.status(400).json({ error: 'councilId is required' });

  try {
    const councilDoc = await db.collection('councils').doc(councilId).get();
    if (!councilDoc.exists) return res.status(404).json({ error: 'Council not found' });
    const raw = councilDoc.data() as { lgaCode?: string };

    await db
      .collection('users')
      .doc(userId)
      .set(
        {
          councilId,
          lgaCode: raw.lgaCode ?? undefined,
          updatedAt: nowIso(),
        },
        { merge: true },
      );

    const links = await db.collection('userCouncilLinks').where('userId', '==', userId).get();
    if (!links.empty) {
      const batch = db.batch();
      links.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    return res.json({ success: true, councilId, lgaCode: raw.lgaCode ?? null });
  } catch (err) {
    captureRouteError(err, 'POST /council/select');
    return res.status(500).json({ error: 'Failed to select council' });
  }
});

/** GET /api/council/:id — single LGA record */
councilRouter.get('/council/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  if (id === 'list' || id === 'resolve' || id === 'selected' || id === 'my') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const doc = await db.collection('councils').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Council not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    captureRouteError(err, 'GET /council/:id');
    return res.status(500).json({ error: 'Failed to fetch council' });
  }
});
