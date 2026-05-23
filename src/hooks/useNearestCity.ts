/**
 * useNearestCity — GPS-based nearest city for **Australia** (legacy shape).
 *
 * For marketplace-wide detection (US, UK, etc.), use `useNearestMarketplaceLocation`.
 */

import { useState, useCallback } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { runMarketplaceLocationDetect } from '@/lib/location/detectMarketplaceLocation';

export type DetectStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface NearestCityResult {
  city: string;
  stateCode: string;
}

export function useNearestCity() {
  const { states } = useLocations();
  const [status, setStatus] = useState<DetectStatus>('idle');
  const [result, setResult] = useState<NearestCityResult | null>(null);

  const detect = useCallback(async (): Promise<NearestCityResult | null> => {
    setStatus('requesting');
    const out = await runMarketplaceLocationDetect(states);
    if (out.ok && out.country === 'Australia') {
      const r: NearestCityResult = { city: out.city, stateCode: out.stateCode };
      setResult(r);
      setStatus('success');
      return r;
    }
    setResult(null);
    if (!out.ok) {
      if (out.reason === 'denied') setStatus('denied');
      else if (out.reason === 'unavailable') setStatus('unavailable');
      else setStatus('error');
    } else {
      setStatus('error');
    }
    return null;
  }, [states]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { detect, result, status, reset };
}
