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

export function useNearestCouncil() {
  const [status, setStatus] = useState<CouncilDetectStatus>('idle');
  const [council, setCouncil] = useState<CouncilData | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [matchMethod, setMatchMethod] = useState<CouncilMatchMethod>('none');
  const [confidence, setConfidence] = useState<CouncilConfidence>('weak');

  // Prevent state updates after unmount (critical to avoid JSI promise crashes)
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const detect = useCallback(async (): Promise<NearestCouncilResult | null> => {
    if (!isMounted.current) {
      console.log('[useNearestCouncil] detect() called but component unmounted — aborting');
      return null;
    }

    console.log('[useNearestCouncil] detect() started');
    setStatus('requesting');

    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        if (isMounted.current) setStatus('unavailable');
        console.log('[useNearestCouncil] Location services unavailable');
        return null;
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        if (isMounted.current) setStatus('denied');
        console.log('[useNearestCouncil] Location permission denied');
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;

      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const geo = addresses[0];

      console.log('[useNearestCouncil] Calling api.council.nearest...');
      const result = await api.council.nearest({
        latitude,
        longitude,
        city: geo?.city || undefined,
        state: geo?.region || undefined,
        country: geo?.isoCountryCode || undefined,
      });

      if (!isMounted.current) {
        console.log('[useNearestCouncil] Promise resolved but component unmounted — ignoring result (prevents JSI crash)');
        return null;
      }

      if (result?.council) {
        setCouncil(result.council);
        setDistanceKm(result.distanceKm ?? null);
        setMatchMethod(result.matchMethod ?? 'coordinate');
        setConfidence(result.confidence ?? 'medium');
        setStatus('success');

        console.log('[useNearestCouncil] Success:', result.council.name, 'distance:', result.distanceKm);

        return {
          council: result.council,
          distanceKm: result.distanceKm,
          matchMethod: result.matchMethod ?? 'coordinate',
          confidence: result.confidence ?? 'medium',
        };
      } else {
        setStatus('error');
        console.log('[useNearestCouncil] No council found');
        return null;
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('[useNearestCouncil] error:', err);
        setStatus('error');
      }
      return null;
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
