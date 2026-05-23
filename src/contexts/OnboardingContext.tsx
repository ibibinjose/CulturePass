import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isComplete: boolean;
  country: string;
  city: string;
  communities: string[];
  // Cultural Identity Layer
  nationalityId: string;
  cultureIds: string[];
  languageIds: string[];
  diasporaGroupIds: string[];
  /**
   * Cultures the user wants to EXPLORE (distinct from their roots).
   * Drives the Cultural Passport on the /explore tab.
   */
  exploringCultureIds: string[];
  // Legacy free-text fields (kept for backward compat with existing profiles)
  ethnicityText: string;
  languages: string[];
  // Interests
  interests: string[];
  subscriptionTier: 'free' | 'plus' | 'elite' | 'sydney-local';
  /** Steps skipped during onboarding — drives the incomplete-step banner (Req 2.3). */
  skippedSteps: Array<'cultures' | 'location' | 'communities'>;
}

interface OnboardingContextValue {
  state: OnboardingState;
  isLoading: boolean;
  setCountry: (country: string) => void;
  setCity: (city: string) => void;
  setCommunities: (communities: string[]) => void;
  // Cultural Identity
  setNationalityId: (nationalityId: string) => void;
  setCultureIds: (cultureIds: string[]) => void;
  setExploringCultureIds: (exploringCultureIds: string[]) => void;
  setLanguageIds: (languageIds: string[]) => void;
  setDiasporaGroupIds: (diasporaGroupIds: string[]) => void;
  // Legacy
  setEthnicityText: (ethnicityText: string) => void;
  setLanguages: (languages: string[]) => void;
  setInterests: (interests: string[]) => void;
  setSubscriptionTier: (tier: OnboardingState['subscriptionTier']) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  updateLocation: (country: string, city: string) => Promise<void>;
  /** Mark a step as skipped — drives the banner on Discover (Req 2.3). */
  skipStep: (step: 'cultures' | 'location' | 'communities') => Promise<void>;
  /** Mark a step as completed — removes it from skippedSteps (Req 2.4). */
  completeStep: (step: 'cultures' | 'location' | 'communities') => Promise<void>;
  /** Resolves after the initial AsyncStorage read used to hydrate onboarding (avoids post-login routing on stale defaults). */
  waitForHydration: () => Promise<void>;
  /** Latest onboarding snapshot (synced with persist + initial load); safe to read right after `waitForHydration()`. */
  getSnapshot: () => OnboardingState;
}

const STORAGE_KEY = '@culturepass_onboarding';

const defaultState: OnboardingState = {
  isComplete: false,
  country: '',
  city: '',
  communities: [],
  nationalityId: '',
  cultureIds: [],
  exploringCultureIds: [],
  languageIds: [],
  diasporaGroupIds: [],
  ethnicityText: '',
  languages: [],
  interests: [],
  subscriptionTier: 'free',
  skippedSteps: [],
};

export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  /** Mirrors the latest persisted onboarding (incl. immediately after AsyncStorage read, before React re-renders). */
  const stateSnapshotRef = useRef<OnboardingState>(defaultState);
  const hydrationDoneRef = useRef(false);
  const hydrationWaitersRef = useRef<(() => void)[]>([]);

  const flushHydrationWaiters = useCallback(() => {
    if (hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    const waiters = hydrationWaitersRef.current.splice(0);
    waiters.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const waitForHydration = useCallback((): Promise<void> => {
    if (hydrationDoneRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      hydrationWaitersRef.current.push(resolve);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (data) {
          const parsed = JSON.parse(data) as Partial<OnboardingState>;
          const merged = { ...defaultState, ...parsed };
          stateSnapshotRef.current = merged;
          setState(merged);
        }
      } catch {
        // AsyncStorage unavailable (e.g. private browsing on web) — use defaults
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          flushHydrationWaiters();
        }
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [flushHydrationWaiters]);

  const persistUpdate = (patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const newState = { ...prev, ...patch };
      stateSnapshotRef.current = newState;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch((err) => {
        if (__DEV__) {
          console.warn('[OnboardingContext] AsyncStorage.setItem failed — onboarding state will not persist across sessions.', err);
        }
      });
      return newState;
    });
  };

  const persistUpdateAsync = useCallback(async (patch: Partial<OnboardingState>) => {
    const newState = { ...stateSnapshotRef.current, ...patch };
    stateSnapshotRef.current = newState;
    setState(newState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch((err) => {
      if (__DEV__) {
        console.warn('[OnboardingContext] AsyncStorage.setItem failed — onboarding state will not persist across sessions.', err);
      }
    });
  }, []);

  const getSnapshot = useCallback(() => stateSnapshotRef.current, []);

  const setCountry = useCallback((country: string) => persistUpdate({ country }), []);
  const setCity = useCallback((city: string) => persistUpdate({ city }), []);
  const setCommunities = useCallback((communities: string[]) => persistUpdate({ communities }), []);
  const setNationalityId = useCallback((nationalityId: string) => persistUpdate({ nationalityId }), []);
  const setCultureIds = useCallback((cultureIds: string[]) => persistUpdate({ cultureIds }), []);
  const setExploringCultureIds = useCallback((exploringCultureIds: string[]) => persistUpdate({ exploringCultureIds }), []);
  const setLanguageIds = useCallback((languageIds: string[]) => persistUpdate({ languageIds }), []);
  const setDiasporaGroupIds = useCallback((diasporaGroupIds: string[]) => persistUpdate({ diasporaGroupIds }), []);
  const setEthnicityText = useCallback((ethnicityText: string) => persistUpdate({ ethnicityText }), []);
  const setLanguages = useCallback((languages: string[]) => persistUpdate({ languages }), []);
  const setInterests = useCallback((interests: string[]) => persistUpdate({ interests }), []);
  const setSubscriptionTier = useCallback((subscriptionTier: OnboardingState['subscriptionTier']) => persistUpdate({ subscriptionTier }), []);
  const completeOnboarding = useCallback(async () => { await persistUpdateAsync({ isComplete: true }); }, [persistUpdateAsync]);
  const restartOnboarding = useCallback(async () => { await persistUpdateAsync({ isComplete: false }); }, [persistUpdateAsync]);
  const resetOnboarding = useCallback(async () => {
    stateSnapshotRef.current = defaultState;
    setState(defaultState);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);
  const updateLocation = useCallback(async (country: string, city: string) => {
    persistUpdate({ country, city });
  }, []);

  const skipStep = useCallback(async (step: 'cultures' | 'location' | 'communities') => {
    const current = stateSnapshotRef.current.skippedSteps ?? [];
    if (current.includes(step)) return;
    await persistUpdateAsync({ skippedSteps: [...current, step] });
  }, [persistUpdateAsync]);

  const completeStep = useCallback(async (step: 'cultures' | 'location' | 'communities') => {
    const current = stateSnapshotRef.current.skippedSteps ?? [];
    await persistUpdateAsync({ skippedSteps: current.filter((s) => s !== step) });
  }, [persistUpdateAsync]);

  const value = useMemo(() => ({
    state,
    isLoading,
    setCountry,
    setCity,
    setCommunities,
    setNationalityId,
    setCultureIds,
    setExploringCultureIds,
    setLanguageIds,
    setDiasporaGroupIds,
    setEthnicityText,
    setLanguages,
    setInterests,
    setSubscriptionTier,
    completeOnboarding,
    restartOnboarding,
    resetOnboarding,
    updateLocation,
    skipStep,
    completeStep,
    waitForHydration,
    getSnapshot,
  }), [
    state, isLoading, setCountry, setCity, setCommunities, setNationalityId,
    setCultureIds, setExploringCultureIds, setLanguageIds, setDiasporaGroupIds, setEthnicityText,
    setLanguages, setInterests, setSubscriptionTier, completeOnboarding,
    restartOnboarding, resetOnboarding, updateLocation, skipStep, completeStep,
    waitForHydration, getSnapshot,
  ]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
