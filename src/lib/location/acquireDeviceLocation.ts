/**
 * Single foreground GPS read + reverse geocode for Discover and council detection.
 */

import * as Location from 'expo-location';
import { findNearestPostcodes } from '@shared/location/australian-postcodes';
import { isAustraliaCountry, toAuStateCode } from '@/lib/location/auState';

export type DeviceLocationFailure = 'denied' | 'unavailable' | 'error';

export type DeviceLocationResult =
  | {
      ok: true;
      latitude: number;
      longitude: number;
      city?: string;
      suburb?: string;
      state?: string;
      country: string;
      isoCountryCode?: string;
    }
  | { ok: false; reason: DeviceLocationFailure };

function geocodePlaceName(geo: Location.LocationGeocodedAddress): string | undefined {
  return (
    geo.city?.trim() ||
    geo.subregion?.trim() ||
    geo.district?.trim() ||
    geo.name?.trim() ||
    undefined
  );
}

function resolveAustraliaPlace(
  geo: Location.LocationGeocodedAddress,
  latitude: number,
  longitude: number,
): { city?: string; suburb?: string; state?: string } {
  const state = toAuStateCode(geo.region ?? undefined);
  const suburb = geo.district?.trim() || geo.subregion?.trim() || undefined;
  const geoCity = geocodePlaceName(geo);

  const nearest = findNearestPostcodes(latitude, longitude, 1)[0];
  if (nearest) {
    const place = nearest.place_name?.trim();
    const nearestState = toAuStateCode(nearest.state_code) ?? state;
    const city =
      geoCity && geoCity.toLowerCase() !== place?.toLowerCase()
        ? geoCity
        : place ?? geoCity;
    return { city, suburb: suburb ?? place, state: nearestState ?? state };
  }

  return { city: geoCity, suburb, state };
}

/**
 * Request foreground permission, read GPS once, and reverse-geocode.
 */
export async function acquireDeviceLocation(): Promise<DeviceLocationResult> {
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

    const { latitude, longitude } = pos.coords;
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    const geo = addresses[0];

    if (!geo) {
      return {
        ok: true,
        latitude,
        longitude,
        country: 'Australia',
      };
    }

    const iso = geo.isoCountryCode ?? undefined;
    const country =
      geo.isoCountryCode === 'AU'
        ? 'Australia'
        : geo.country?.trim() || iso || 'Australia';

    if (isAustraliaCountry(country) || iso === 'AU') {
      const au = resolveAustraliaPlace(geo, latitude, longitude);
      return {
        ok: true,
        latitude,
        longitude,
        city: au.city,
        suburb: au.suburb,
        state: au.state,
        country: 'Australia',
        isoCountryCode: iso,
      };
    }

    return {
      ok: true,
      latitude,
      longitude,
      city: geocodePlaceName(geo),
      suburb: geo.district?.trim() || geo.subregion?.trim(),
      state: toAuStateCode(geo.region ?? undefined) ?? geo.region?.trim(),
      country,
      isoCountryCode: iso,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}