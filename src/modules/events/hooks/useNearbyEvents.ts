/**
 * useNearbyEvents — GPS-based proximity event discovery.
 *
 * Requests foreground location permission, gets the device's current
 * coordinates, then queries /api/events/nearby (backed by Firestore
 * geoHash bounds via geofire-common).
 *
 * Usage:
 *   const { events, isLoading, error, trigger } = useNearbyEvents();
 *
 * Call `trigger()` explicitly (e.g. on screen mount or a "Near Me" button).
 * The hook is idle until triggered to avoid unnecessary permission prompts.
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/modules/events/api';
import type { EventData } from '@/shared/schema';

export type NearbyStatus = 'idle' | 'locating' | 'fetching' | 'success' | 'denied' | 'unavailable' | 'error';

interface NearbyCoords {
  lat: number;
  lng: number;
}

interface UseNearbyEventsOptions {
  /** Search radius in km. Defaults to 10. */
  radiusKm?: number;
  /** Maximum events to return. Defaults to 20. */
  pageSize?: number;
}

interface UseNearbyEventsResult {
  events: EventData[];
  isLoading: boolean;
  status: NearbyStatus;
  error: string | null;
  coords: NearbyCoords | null;
  /** Call to request permission and fetch nearby events. */
  trigger: () => Promise<void>;
}

export function useNearbyEvents({
  radiusKm = 10,
  pageSize = 20,
}: UseNearbyEventsOptions = {}): UseNearbyEventsResult {
  const [status, setStatus] = useState<NearbyStatus>('idle');
  const [coords, setCoords] = useState<NearbyCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['/api/events/nearby', coords?.lat, coords?.lng, radiusKm, pageSize],
    queryFn: () =>
      eventsApi.events.nearby({
        lat: coords!.lat,
        lng: coords!.lng,
        radius: radiusKm,
        pageSize,
      }),
    enabled: coords !== null,
    staleTime: 5 * 60 * 1000,
  });

  const trigger = useCallback(async () => {
    setError(null);
    setStatus('locating');

    try {
      const hasServices = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!hasServices) {
        setStatus('unavailable');
        setError('Location services are disabled. Enable them in Settings to find nearby events.');
        return;
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        setError('Location permission denied. Allow location access to find events near you.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus('fetching');
    } catch {
      setStatus('error');
      setError('Could not determine your location. Please try again.');
    }
  }, []);

  // Transition to 'success' once the query completes with coords set
  const resolvedStatus: NearbyStatus =
    status === 'fetching' && !isFetching && data ? 'success' : status;

  const events: EventData[] = data?.events ?? [];

  return {
    events,
    isLoading: status === 'locating' || (status === 'fetching' && isFetching),
    status: resolvedStatus,
    error,
    coords,
    trigger,
  };
}
