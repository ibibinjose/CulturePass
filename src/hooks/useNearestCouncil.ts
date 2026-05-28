import { useState, useCallback } from 'react';
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

  const detect = useCallback(async (): Promise<NearestCouncilResult | null> => {
    setStatus('requesting');
    try {
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        setStatus('unavailable');
        return null;
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;

      // We also need city/state for fallback in the backend resolve
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const geo = addresses[0];

      const result = await api.council.nearest({
        latitude,
        longitude,
        city: geo?.city || undefined,
        state: geo?.region || undefined,
        country: geo?.isoCountryCode || undefined,
      });

      if (result?.council) {
        setCouncil(result.council);
        setDistanceKm(result.distanceKm ?? null);
        setMatchMethod(result.matchMethod ?? 'coordinate');
        setConfidence(result.confidence ?? 'medium');
        setStatus('success');

        return {
          council: result.council,
          distanceKm: result.distanceKm,
          matchMethod: result.matchMethod ?? 'coordinate',
          confidence: result.confidence ?? 'medium',
        };
      } else {
        setStatus('error');
        return null;
      }
    } catch (err) {
      console.error('[useNearestCouncil] error:', err);
      setStatus('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
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
