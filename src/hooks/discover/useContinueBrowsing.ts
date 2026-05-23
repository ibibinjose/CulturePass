/**
 * useContinueBrowsing — manages recent entity visits for the Continue Browsing rail.
 *
 * Tracks visits in AsyncStorage under `@cp_recent_visits`.
 * Resets the visit list on app launch and when the app returns from background.
 *
 * Usage:
 *   const { items, trackVisit } = useContinueBrowsing();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  getContinueBrowsingItems,
  type RecentVisit,
} from '@/lib/storage';

const MAX_STORED_VISITS = 10;

/**
 * Hook providing Continue Browsing rail data and a `trackVisit` function.
 *
 * Behavior:
 * - On mount (app launch), clears stored visits so the rail starts empty.
 * - On return from background, clears stored visits.
 * - `trackVisit` appends a visit and persists to AsyncStorage.
 * - `items` returns the top 3 most recent visits (via getContinueBrowsingItems).
 */
export function useContinueBrowsing() {
  const [visits, setVisits] = useState<RecentVisit[]>([]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const mountedRef = useRef(true);

  // Reset visits on mount (app launch) — clear persisted visits
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECENT_VISITS, JSON.stringify([])).catch(() => {
      // Non-critical — in-memory state is authoritative
    });
    setVisits([]);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset visits when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
        nextAppState === 'active'
      ) {
        // App returning to foreground — reset visits
        setVisits([]);
        AsyncStorage.setItem(STORAGE_KEYS.RECENT_VISITS, JSON.stringify([])).catch(() => {
          // Non-critical
        });
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Track a visit to an entity. Adds it to the list and persists.
   * Deduplicates by entityId (moves existing entry to most recent).
   */
  const trackVisit = useCallback(
    (visit: Omit<RecentVisit, 'visitedAt'>) => {
      setVisits((prev) => {
        const filtered = prev.filter((v) => v.entityId !== visit.entityId);
        const newVisit: RecentVisit = {
          ...visit,
          visitedAt: Date.now(),
        };
        const updated = [newVisit, ...filtered].slice(0, MAX_STORED_VISITS);

        // Persist asynchronously — fire and forget
        AsyncStorage.setItem(STORAGE_KEYS.RECENT_VISITS, JSON.stringify(updated)).catch(() => {
          // Non-critical
        });

        return updated;
      });
    },
    [],
  );

  const items = getContinueBrowsingItems(visits);

  return { items, trackVisit, hasItems: items.length > 0 };
}
