import { useState, useCallback } from 'react';
import { useLocations } from '@/hooks/useLocations';
import {
  runMarketplaceLocationDetect,
  type MarketplaceDetectFailureReason,
} from '@/lib/location/detectMarketplaceLocation';

export type DetectStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'unsupported_country'
  | 'error';

export interface NearestMarketplaceLocationResult {
  country: string;
  city: string;
  stateCode: string;
}

function mapFailureReason(r: MarketplaceDetectFailureReason): Exclude<DetectStatus, 'idle' | 'requesting' | 'success'> {
  switch (r) {
    case 'denied':
      return 'denied';
    case 'unavailable':
      return 'unavailable';
    case 'unsupported_country':
      return 'unsupported_country';
    default:
      return 'error';
  }
}

export function useNearestMarketplaceLocation() {
  const { states } = useLocations();
  const [status, setStatus] = useState<DetectStatus>('idle');
  const [result, setResult] = useState<NearestMarketplaceLocationResult | null>(null);

  const detect = useCallback(async (): Promise<NearestMarketplaceLocationResult | null> => {
    setStatus('requesting');
    const out = await runMarketplaceLocationDetect(states);
    if (out.ok) {
      const r: NearestMarketplaceLocationResult = {
        country: out.country,
        city: out.city,
        stateCode: out.stateCode,
      };
      setResult(r);
      setStatus('success');
      return r;
    }
    setResult(null);
    setStatus(mapFailureReason(out.reason));
    return null;
  }, [states]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { detect, result, status, reset };
}
