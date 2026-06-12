import { useState, useCallback, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import type { CouncilData } from '@/shared/schema';

export type CouncilDetectStatus = 'idle' | 'requesting' | 'success' | 'error' | 'denied' | 'unavailable';

export type CouncilMatchMethod = 'coordinate' | 'city-state' | 'none';
export type CouncilConfidence = 'strong' | 'medium' | 'weak';

export interface NearestCouncilResult {
  council: CouncilData;
  distanceKm?: number;
  matchMethod: CouncilMatchMethod;
  confidence: CouncilConfidence;
}

export type CouncilDetectOptions = {
  /** User-selected marketplace city (improves city-state fallback). */
  city?: string;
  /** AU state code or full name (NSW / New South Wales). */
  state?: string;
  country?: string;
};

export type CouncilDetectOutcome =
  | { ok: true; result: NearestCouncilResult }
  | { ok: false; status: Exclude<CouncilDetectStatus, 'idle' | 'requesting' | 'success'> };

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

function toAuStateCode(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (/^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test(upper)) return upper;
  return REGION_TO_AU_CODE[trimmed.toLowerCase()];
}

export function useNearestCouncil() {
  const [status, setStatus] = useState<CouncilDetectStatus>('idle');
  const [council, setCouncil] = useState<CouncilData | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [matchMethod, setMatchMethod] = useState<CouncilMatchMethod>('none');
  const [confidence, setConfidence] = useState<CouncilConfidence>('weak');

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const detect = useCallback(async (options?: CouncilDetectOptions): Promise<CouncilDetectOutcome | null> => {
    if (!isMounted.current) {
      console.log('[useNearestCouncil] detect() called but component unmounted — aborting');
      return null;
    }

    console.log('[useNearestCouncil] detect() started', options);
    setStatus('requesting');

    try {
      const hasServices = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!hasServices) {
        if (isMounted.current) setStatus('unavailable');
        console.log('[useNearestCouncil] Location services unavailable');
        return { ok: false, status: 'unavailable' };
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        if (isMounted.current) setStatus('denied');
        console.log('[useNearestCouncil] Location permission denied');
        return { ok: false, status: 'denied' };
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;

      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const geo = addresses[0];

      const geoState = toAuStateCode(geo?.region ?? undefined);
      const stateForApi = toAuStateCode(options?.state) ?? geoState;
      const cityForApi = options?.city?.trim() || geo?.city || geo?.subregion || undefined;
      const countryForApi =
        options?.country?.trim() ||
        (geo?.isoCountryCode === 'AU' ? 'Australia' : geo?.isoCountryCode || 'Australia');

      console.log('[useNearestCouncil] Calling api.council.nearest...', {
        latitude,
        longitude,
        city: cityForApi,
        state: stateForApi,
        country: countryForApi,
      });

      const result = await api.council.nearest({
        latitude,
        longitude,
        city: cityForApi,
        state: stateForApi,
        country: countryForApi,
      });

      if (!isMounted.current) {
        console.log('[useNearestCouncil] Promise resolved but component unmounted — ignoring result');
        return null;
      }

      if (result?.council) {
        const resolved: NearestCouncilResult = {
          council: result.council,
          distanceKm: result.distanceKm,
          matchMethod: result.matchMethod ?? 'coordinate',
          confidence: result.confidence ?? 'medium',
        };
        setCouncil(result.council);
        setDistanceKm(result.distanceKm ?? null);
        setMatchMethod(resolved.matchMethod);
        setConfidence(resolved.confidence);
        setStatus('success');

        console.log('[useNearestCouncil] Success:', result.council.name, 'distance:', result.distanceKm);

        return { ok: true, result: resolved };
      }

      setStatus('error');
      console.log('[useNearestCouncil] No council found');
      return { ok: false, status: 'error' };
    } catch (err) {
      if (isMounted.current) {
        console.error('[useNearestCouncil] error:', err);
        setStatus('error');
      }
      return { ok: false, status: 'error' };
    }
  }, []);

  const reset = useCallback(() => {
    if (!isMounted.current) return;
    setStatus('idle');
    setCouncil(null);
    setDistanceKm(null);
    setMatchMethod('none');
    setConfidence('weak');
  }, []);

  return {
    detect,
    reset,
    council,
    distanceKm,
    matchMethod,
    confidence,
    status,
  };
}