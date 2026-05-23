import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  effectiveYearForMoment,
  getActiveCultureTodayMoment,
  type CultureTodayMoment,
} from '@/features/cultureToday';

const STORAGE_KEY = 'culture_today_dismissed_v1';

async function readDismissed(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

async function writeDismissed(keys: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

type CultureTodayContextValue = {
  active: CultureTodayMoment | null;
  dismiss: () => void;
};

const CultureTodayContext = createContext<CultureTodayContextValue | null>(null);

export function CultureTodayProvider({ children }: { children: React.ReactNode }) {
  const [now] = useState(() => new Date());
  const activeMoment = useMemo(() => getActiveCultureTodayMoment(now), [now]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readDismissed().then((s) => {
      if (!cancelled) setDismissedKeys(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissKey = useMemo(() => {
    if (!activeMoment) return null;
    const y = effectiveYearForMoment(now, activeMoment);
    return `${activeMoment.id}:${y}`;
  }, [activeMoment, now]);

  const visible = Boolean(
    dismissedKeys !== null && activeMoment && dismissKey && !dismissedKeys.has(dismissKey),
  );

  const dismiss = useCallback(() => {
    if (!dismissKey) return;
    setDismissedKeys((prev) => {
      const base = prev ?? new Set<string>();
      const next = new Set(base);
      next.add(dismissKey);
      void writeDismissed(next);
      return next;
    });
  }, [dismissKey]);

  const value = useMemo<CultureTodayContextValue>(
    () => ({
      active: visible ? activeMoment : null,
      dismiss,
    }),
    [activeMoment, visible, dismiss],
  );

  return <CultureTodayContext.Provider value={value}>{children}</CultureTodayContext.Provider>;
}

export function useCultureToday(): CultureTodayContextValue {
  const ctx = useContext(CultureTodayContext);
  if (!ctx) {
    return {
      active: null,
      dismiss: () => {},
    };
  }
  return ctx;
}
