/**
 * useDetectCountry — GPS-based country detection.
 *
 * Uses expo-location to get coordinates, then a bounding-box lookup to
 * resolve the CulturePass marketplace country (AU, NZ, GB, US, CA, AE, SG).
 *
 * Deliberately avoids reverseGeocodeAsync — it returns an empty array on
 * web (no API key) and adds unnecessary network latency.
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export type DetectCountryStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'       // permission denied by user
  | 'unavailable'  // location services disabled
  | 'unsupported'  // coords resolved but country not in marketplace
  | 'error';

export interface DetectCountryResult {
  country: string | null;
  status: DetectCountryStatus;
}

// ---------------------------------------------------------------------------
// Coordinate bounding-box → marketplace country
// Ordered from smallest/most specific to largest to avoid false matches.
// ---------------------------------------------------------------------------

function countryFromCoords(lat: number, lon: number): string | null {
  // Singapore — tiny city-state, check first
  if (lat >= 1.1 && lat <= 1.6 && lon >= 103.5 && lon <= 104.1) return 'Singapore';

  // United Arab Emirates
  if (lat >= 22.4 && lat <= 26.2 && lon >= 51.5 && lon <= 56.5) return 'United Arab Emirates';

  // New Zealand (main islands)
  if (lat >= -47.5 && lat <= -34.0 && lon >= 166.0 && lon <= 178.5) return 'New Zealand';

  // Australia
  if (lat >= -43.7 && lat <= -10.5 && lon >= 113.0 && lon <= 153.7) return 'Australia';

  // United Kingdom
  if (lat >= 49.8 && lat <= 60.9 && lon >= -8.2 && lon <= 1.8) return 'United Kingdom';

  // Canada — broadly above 48°N in North America
  if (lat >= 48.9 && lat <= 83.2 && lon >= -141.0 && lon <= -52.5) return 'Canada';

  // United States (contiguous + Alaska approximation)
  if (lat >= 24.4 && lat <= 71.5 && lon >= -172.0 && lon <= -66.8) return 'United States';

  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDetectCountry() {
  const [status, setStatus] = useState<DetectCountryStatus>('idle');
  const [country, setCountry] = useState<string | null>(null);

  const detect = useCallback(async (): Promise<DetectCountryResult> => {
    setStatus('requesting');

    try {
      const hasServices = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!hasServices) {
        setStatus('unavailable');
        return { country: null, status: 'unavailable' };
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return { country: null, status: 'denied' };
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const matched = countryFromCoords(pos.coords.latitude, pos.coords.longitude);

      if (matched) {
        setCountry(matched);
        setStatus('success');
        return { country: matched, status: 'success' };
      }

      setStatus('unsupported');
      return { country: null, status: 'unsupported' };
    } catch {
      setStatus('error');
      return { country: null, status: 'error' };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCountry(null);
  }, []);

  return { detect, country, status, reset };
}
