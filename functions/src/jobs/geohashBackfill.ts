/**
 * GeoHash / Coordinates Backfill Job
 *
 * Goals:
 * - Ensure events missing `geoHash` get a correct one when `latitude/longitude` exist.
 * - Best-effort fill `latitude/longitude` for AU events using local postcode data
 *   (no external geocoding dependency), then compute `geoHash`.
 *
 * Exposed via an admin-only endpoint in handlers/admin.ts.
 */

import * as geofire from 'geofire-common';
import { db } from '../admin';
import { resolveAustralianLocation } from '../handlers/utils';

type GeoBackfillCounts = {
  scanned: number;
  updatedGeoHash: number;
  updatedCoordinates: number;
  skipped: number;
  failed: number;
  missingLocationData: number;
  nonAustralian: number;
};

export type GeoBackfillResult = GeoBackfillCounts & {
  durationMs: number;
  sampleFailures: { id: string; reason: string }[];
};

function normalizeCountry(raw: unknown): string {
  const c = String(raw ?? '').trim();
  return c || 'Australia';
}

function isAustralia(country: string): boolean {
  const c = country.toLowerCase();
  return c === 'australia' || c === 'au';
}

export async function runGeohashBackfill(params?: {
  /**
   * When true, recomputes geoHash even if already present.
   * (Coordinates are never overwritten unless overwriteCoordinates=true.)
   */
  forceGeoHash?: boolean;
  /**
   * When true, overwrites latitude/longitude using postcode lookup when the
   * event appears Australian and has city/state/postcode.
   */
  overwriteCoordinates?: boolean;
  /**
   * Optional max docs to process (safety valve).
   */
  limit?: number;
}): Promise<GeoBackfillResult> {
  const forceGeoHash = params?.forceGeoHash === true;
  const overwriteCoordinates = params?.overwriteCoordinates === true;
  const limit = params?.limit != null ? Math.max(1, Math.min(50_000, params.limit)) : 50_000;

  const start = Date.now();
  const counts: GeoBackfillCounts = {
    scanned: 0,
    updatedGeoHash: 0,
    updatedCoordinates: 0,
    skipped: 0,
    failed: 0,
    missingLocationData: 0,
    nonAustralian: 0,
  };
  const sampleFailures: { id: string; reason: string }[] = [];

  const PAGE_SIZE = 300;
  let lastDocId: string | null = null;

  while (counts.scanned < limit) {
    let query = db
      .collection('events')
      .where('status', '==', 'published')
      .orderBy('__name__')
      .limit(PAGE_SIZE);

    if (lastDocId) query = query.startAfter(lastDocId);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      if (counts.scanned >= limit) break;

      counts.scanned += 1;
      lastDocId = doc.id;

      try {
        const data = doc.data() as Record<string, unknown>;

        const country = normalizeCountry(data.country);
        const latitude = typeof data.latitude === 'number' ? data.latitude : null;
        const longitude = typeof data.longitude === 'number' ? data.longitude : null;
        const geoHash = typeof data.geoHash === 'string' ? data.geoHash : null;

        const updates: Record<string, unknown> = {};

        const shouldAttemptCoordinates =
          (latitude == null || longitude == null || overwriteCoordinates) &&
          isAustralia(country);

        if (shouldAttemptCoordinates) {
          const city = data.city;
          const state = data.state ?? data.stateCode;
          const postcode = data.postcode;

          const { location, error } = resolveAustralianLocation(
            { city, state, postcode, country: 'Australia' },
            false,
          );

          if (location) {
            // Only overwrite when explicitly allowed, otherwise fill missing.
            if (overwriteCoordinates || latitude == null) updates.latitude = location.latitude;
            if (overwriteCoordinates || longitude == null) updates.longitude = location.longitude;
            if (!data.state && location.state) updates.state = location.state;
            if (!data.postcode && location.postcode) updates.postcode = location.postcode;
            if (!data.city && location.city) updates.city = location.city;
          } else {
            // We only count as missing location data if this event looked AU
            // but we couldn't resolve.
            counts.missingLocationData += 1;
            if (sampleFailures.length < 25) sampleFailures.push({ id: doc.id, reason: error ?? 'No location match' });
          }
        } else if (!isAustralia(country)) {
          counts.nonAustralian += 1;
        }

        const nextLat = (updates.latitude as number | undefined) ?? latitude ?? null;
        const nextLng = (updates.longitude as number | undefined) ?? longitude ?? null;

        if (nextLat != null && nextLng != null) {
          const computed = geofire.geohashForLocation([nextLat, nextLng]);
          if (forceGeoHash || geoHash !== computed) {
            updates.geoHash = computed;
          }
        }

        if (Object.keys(updates).length === 0) {
          counts.skipped += 1;
          continue;
        }

        // Track counters.
        if ('latitude' in updates || 'longitude' in updates) counts.updatedCoordinates += 1;
        if ('geoHash' in updates) counts.updatedGeoHash += 1;

        await doc.ref.update(updates);
      } catch (err) {
        counts.failed += 1;
        if (sampleFailures.length < 25) sampleFailures.push({ id: doc.id, reason: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  }

  return {
    ...counts,
    durationMs: Date.now() - start,
    sampleFailures,
  };
}
