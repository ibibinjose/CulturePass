import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { acquireDeviceLocation } from '@/lib/location/acquireDeviceLocation';
import { toAuStateCode } from '@/lib/location/auState';
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

const devLog = (...args: unknown[]) => {
  if (__DEV__) console.log('[useNearestCouncil]', ...args);
};

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
    if (!isMounted.current) return null;

    devLog('detect() started', options);
    setStatus('requesting');

    try {
      const device = await acquireDeviceLocation();
      if (!isMounted.current) return null;

      if (!device.ok) {
        setStatus(device.reason === 'denied' ? 'denied' : device.reason);
        devLog('Location unavailable:', device.reason);
        return { ok: false, status: device.reason };
      }

      const { latitude, longitude, city: geoCity, state: geoState, country: geoCountry } = device;
      const stateForApi = toAuStateCode(options?.state) ?? geoState;
      const cityForApi = options?.city?.trim() || geoCity || undefined;
      const countryForApi = options?.country?.trim() || geoCountry || 'Australia';

      devLog('Calling api.council.nearest...', {
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

      if (!isMounted.current) return null;

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

        devLog('Success:', result.council.name, 'distance:', result.distanceKm);

        return { ok: true, result: resolved };
      }

      setStatus('error');
      devLog('No council found');
      return { ok: false, status: 'error' };
    } catch (err) {
      if (isMounted.current) {
        if (__DEV__) console.error('[useNearestCouncil] error:', err);
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