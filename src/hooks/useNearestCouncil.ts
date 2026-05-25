import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import type { CouncilData } from '@/shared/schema';

export type CouncilDetectStatus = 'idle' | 'requesting' | 'success' | 'error' | 'denied' | 'unavailable';

export function useNearestCouncil() {
  const [status, setStatus] = useState<CouncilDetectStatus>('idle');
  const [council, setCouncil] = useState<CouncilData | null>(null);

  const detect = useCallback(async () => {
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

      if (result.council) {
        setCouncil(result.council);
        setStatus('success');
        return result.council;
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

  return { detect, council, status };
}
