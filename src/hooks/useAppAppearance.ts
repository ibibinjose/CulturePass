import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const APPEARANCE_PREF_KEY = '@culturepass:appearance-preference';

export type AppearancePreference = 'system' | 'dark' | 'light';
export type ResolvedAppearance = 'dark' | 'light';

let cachedPreference: AppearancePreference = 'system';
let hasHydrated = false;
const subscribers = new Set<(value: AppearancePreference) => void>();

async function hydratePreference() {
  if (hasHydrated) return;
  hasHydrated = true;
  try {
    const stored = await AsyncStorage.getItem(APPEARANCE_PREF_KEY);
    if (stored === 'system' || stored === 'dark' || stored === 'light') {
      cachedPreference = stored;
      subscribers.forEach((cb) => cb(cachedPreference));
    }
  } catch {
    // Keep default silently.
  }
}

async function persistPreference(next: AppearancePreference) {
  cachedPreference = next;
  subscribers.forEach((cb) => cb(next));
  try {
    await AsyncStorage.setItem(APPEARANCE_PREF_KEY, next);
  } catch {
    // Ignore storage failures and keep runtime state.
  }
}

export function useAppAppearance() {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>(cachedPreference);

  useEffect(() => {
    const listener = (value: AppearancePreference) => setPreferenceState(value);
    subscribers.add(listener);
    void hydratePreference();
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const setPreference = useCallback(async (next: AppearancePreference) => {
    await persistPreference(next);
  }, []);

  const resolvedScheme = useMemo<ResolvedAppearance>(() => {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return systemScheme === 'light' ? 'light' : 'dark';
  }, [preference, systemScheme]);

  return {
    preference,
    resolvedScheme,
    setPreference,
  };
}
