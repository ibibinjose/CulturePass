/**
 * GPS → nearest CulturePass marketplace city (AU uses postcode + state lists;
 * other markets match reverse-geocode strings to static city hubs).
 */

import * as Location from 'expo-location';
import { findNearestPostcodes } from '@shared/location/australian-postcodes';
import type { AustralianState } from '@/lib/api';
import {
  getRegionsForCountry,
  marketplaceCountryFromGeocodeCountryField,
  marketplaceCountryFromIso3166Alpha2,
} from '@/lib/marketplaceLocation';

const REGION_TO_AU_CODE: Record<string, string> = {
  'new south wales': 'NSW',
  victoria: 'VIC',
  queensland: 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  tasmania: 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
};

const AU_STATE_CAPITALS: Record<string, string> = {
  NSW: 'Sydney',
  VIC: 'Melbourne',
  QLD: 'Brisbane',
  WA: 'Perth',
  SA: 'Adelaide',
  TAS: 'Hobart',
  ACT: 'Canberra',
  NT: 'Darwin',
};

export type MarketplaceDetectFailureReason =
  | 'denied'
  | 'unavailable'
  | 'unsupported_country'
  | 'no_match'
  | 'error';

export type MarketplaceDetectResult =
  | { ok: true; country: string; city: string; stateCode: string }
  | { ok: false; reason: MarketplaceDetectFailureReason };

function buildCitiesByState(states: AustralianState[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const s of states) {
    map[s.code] = s.cities;
  }
  return map;
}

function geocodeCandidates(geo: Location.LocationGeocodedAddress): string[] {
  return [geo.city, geo.subregion, geo.name, geo.district, geo.street].filter(Boolean) as string[];
}

async function matchAustralia(
  geo: Location.LocationGeocodedAddress,
  latitude: number,
  longitude: number,
  citiesByState: Record<string, string[]>,
): Promise<{ city: string; stateCode: string } | null> {
  let stateCode = '';
  if (geo.region) {
    const regionLower = geo.region.toLowerCase();
    stateCode = REGION_TO_AU_CODE[regionLower] ?? '';
  }

  if (!stateCode) {
    const nearest = findNearestPostcodes(latitude, longitude, 1)[0];
    if (!nearest) return null;

    const stateCities = citiesByState[nearest.state_code] ?? [];
    const matchedFromPostcode = stateCities.find(
      (c) => c.toLowerCase() === nearest.place_name.toLowerCase(),
    );

    const fallbackCity =
      matchedFromPostcode ??
      AU_STATE_CAPITALS[nearest.state_code] ??
      stateCities[0] ??
      nearest.place_name;

    if (!fallbackCity) return null;
    return { city: fallbackCity, stateCode: nearest.state_code };
  }

  const stateCities = citiesByState[stateCode] ?? [];
  const candidates = geocodeCandidates(geo);

  let matchedCity: string | null = null;
  for (const candidate of candidates) {
    const found = stateCities.find((c) => c.toLowerCase() === candidate.toLowerCase());
    if (found) {
      matchedCity = found;
      break;
    }
  }

  const city = matchedCity ?? AU_STATE_CAPITALS[stateCode] ?? stateCities[0];
  if (!city) return null;
  return { city, stateCode };
}

function matchInternationalCountry(
  marketplaceCountry: string,
  geo: Location.LocationGeocodedAddress,
  auStates: AustralianState[],
): { city: string; stateCode: string } | null {
  const regions = getRegionsForCountry(marketplaceCountry, auStates);
  if (!regions.length) return null;

  const candidates = geocodeCandidates(geo).map((c) => c.trim()).filter(Boolean);
  if (!candidates.length) return null;

  const tryExact = (): { city: string; stateCode: string } | null => {
    for (const r of regions) {
      for (const city of r.cities) {
        for (const cand of candidates) {
          if (cand.toLowerCase() === city.toLowerCase()) {
            return { city, stateCode: r.code };
          }
        }
      }
    }
    return null;
  };

  const exact = tryExact();
  if (exact) return exact;

  for (const r of regions) {
    for (const city of r.cities) {
      const cl = city.toLowerCase();
      for (const cand of candidates) {
        const dl = cand.toLowerCase();
        if (dl.includes(cl) || cl.includes(dl)) {
          return { city, stateCode: r.code };
        }
      }
    }
  }

  return null;
}

/**
 * Request foreground location, reverse-geocode, and map to a marketplace city.
 */
export async function runMarketplaceLocationDetect(
  auStates: AustralianState[],
): Promise<MarketplaceDetectResult> {
  try {
    const hasServices = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!hasServices) {
      return { ok: false, reason: 'unavailable' };
    }

    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const geo = addresses[0];
    if (!geo) {
      return { ok: false, reason: 'no_match' };
    }

    const iso = geo.isoCountryCode ?? undefined;
    let marketplaceCountry =
      marketplaceCountryFromIso3166Alpha2(iso) ?? marketplaceCountryFromGeocodeCountryField(geo.country);

    if (!marketplaceCountry) {
      return { ok: false, reason: 'unsupported_country' };
    }

    const citiesByState = buildCitiesByState(auStates);

    if (marketplaceCountry === 'Australia') {
      const au = await matchAustralia(geo, latitude, longitude, citiesByState);
      if (!au) return { ok: false, reason: 'no_match' };
      return { ok: true, country: 'Australia', city: au.city, stateCode: au.stateCode };
    }

    const intl = matchInternationalCountry(marketplaceCountry, geo, auStates);
    if (!intl) return { ok: false, reason: 'no_match' };

    return {
      ok: true,
      country: marketplaceCountry,
      city: intl.city,
      stateCode: intl.stateCode,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
