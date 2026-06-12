import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type TabKey, STORAGE_KEYS } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-tab navigation state snapshot. */
export interface TabState {
  scrollPosition: number;
  navigationDepth: number;
  /** Route history stack — capped at MAX_STACK_DEPTH entries. */
  stackHistory: string[];
  filters: Record<string, unknown>;
  expandedSections: string[];
  lastActiveTimestamp: number;
}

export interface NavigationStateContextValue {
  getTabState(tab: TabKey): TabState;
  saveScrollPosition(tab: TabKey, position: number): void;
  pushRoute(tab: TabKey, route: string): void;
  popRoute(tab: TabKey): string | null;
  popToRoot(tab: TabKey): void;
  isInMultiStepFlow(): boolean;
  setMultiStepFlow(active: boolean): void;
  resetAllStates(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_STACK_DEPTH = 10;
/** Background TTL in milliseconds (5 minutes). */
const BACKGROUND_TTL_MS = 5 * 60 * 1000;

const ALL_TABS: TabKey[] = ['discover', 'calendar', 'community', 'city', 'myspace'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultTabState(): TabState {
  return {
    scrollPosition: 0,
    navigationDepth: 0,
    stackHistory: [],
    filters: {},
    expandedSections: [],
    lastActiveTimestamp: Date.now(),
  };
}

function createDefaultAllTabStates(): Record<TabKey, TabState> {
  return {
    discover: createDefaultTabState(),
    calendar: createDefaultTabState(),
    community: createDefaultTabState(),
    city: createDefaultTabState(),
    myspace: createDefaultTabState(),
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NavigationStateContext = createContext<NavigationStateContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const [tabStates, setTabStates] = useState<Record<TabKey, TabState>>(createDefaultAllTabStates);
  const [multiStepFlow, setMultiStepFlowState] = useState(false);

  // Track when the app was last backgrounded
  const backgroundedAtRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // -------------------------------------------------------------------------
  // Persistence: load from AsyncStorage on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.NAV_STATE)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const restored = createDefaultAllTabStates();
          for (const tab of ALL_TABS) {
            const saved = parsed[tab];
            if (saved && typeof saved === 'object') {
              restored[tab] = {
                scrollPosition:
                  typeof (saved as TabState).scrollPosition === 'number'
                    ? (saved as TabState).scrollPosition
                    : 0,
                navigationDepth:
                  typeof (saved as TabState).navigationDepth === 'number'
                    ? (saved as TabState).navigationDepth
                    : 0,
                stackHistory: Array.isArray((saved as TabState).stackHistory)
                  ? (saved as TabState).stackHistory.slice(0, MAX_STACK_DEPTH)
                  : [],
                filters:
                  typeof (saved as TabState).filters === 'object' &&
                  (saved as TabState).filters !== null
                    ? (saved as TabState).filters
                    : {},
                expandedSections: Array.isArray((saved as TabState).expandedSections)
                  ? (saved as TabState).expandedSections
                  : [],
                lastActiveTimestamp:
                  typeof (saved as TabState).lastActiveTimestamp === 'number'
                    ? (saved as TabState).lastActiveTimestamp
                    : Date.now(),
              };
            }
          }
          setTabStates(restored);
        } catch {
          // Corrupt data — start fresh
        }
      })
      .catch(() => {
        // Storage read failure — use defaults
      });
  }, []);

  // -------------------------------------------------------------------------
  // Persist state changes to AsyncStorage (debounced via microtask)
  // -------------------------------------------------------------------------
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistState = useCallback((states: Record<TabKey, TabState>) => {
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    persistTimeoutRef.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEYS.NAV_STATE, JSON.stringify(states)).catch(() => {
        // Persist failure — non-critical, state lives in memory
      });
    }, 300);
  }, []);

  // -------------------------------------------------------------------------
  // AppState listener: 5-minute background TTL reset
  // -------------------------------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App going to background — record timestamp
        backgroundedAtRef.current = Date.now();
      }

      if (
        (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
        nextAppState === 'active'
      ) {
        // App returning to foreground — check TTL
        if (backgroundedAtRef.current !== null) {
          const elapsed = Date.now() - backgroundedAtRef.current;
          if (elapsed >= BACKGROUND_TTL_MS) {
            // Reset all tab states
            const fresh = createDefaultAllTabStates();
            setTabStates(fresh);
            setMultiStepFlowState(false);
            persistState(fresh);
          }
          backgroundedAtRef.current = null;
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [persistState]);

  // -------------------------------------------------------------------------
  // Context methods
  // -------------------------------------------------------------------------

  const getTabState = useCallback(
    (tab: TabKey): TabState => {
      return tabStates[tab];
    },
    [tabStates],
  );

  const saveScrollPosition = useCallback(
    (tab: TabKey, position: number) => {
      setTabStates((prev) => {
        const updated = {
          ...prev,
          [tab]: {
            ...prev[tab],
            scrollPosition: position,
            lastActiveTimestamp: Date.now(),
          },
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState],
  );

  const pushRoute = useCallback(
    (tab: TabKey, route: string) => {
      setTabStates((prev) => {
        const current = prev[tab];
        // Cap stack at MAX_STACK_DEPTH — drop oldest if at limit
        const newStack =
          current.stackHistory.length >= MAX_STACK_DEPTH
            ? [...current.stackHistory.slice(1), route]
            : [...current.stackHistory, route];

        const updated = {
          ...prev,
          [tab]: {
            ...current,
            stackHistory: newStack,
            navigationDepth: newStack.length,
            lastActiveTimestamp: Date.now(),
          },
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState],
  );

  const popRoute = useCallback(
    (tab: TabKey): string | null => {
      let poppedRoute: string | null = null;

      setTabStates((prev) => {
        const current = prev[tab];
        if (current.stackHistory.length === 0) {
          return prev;
        }

        const newStack = current.stackHistory.slice(0, -1);
        poppedRoute = current.stackHistory[current.stackHistory.length - 1] ?? null;

        const updated = {
          ...prev,
          [tab]: {
            ...current,
            stackHistory: newStack,
            navigationDepth: newStack.length,
            lastActiveTimestamp: Date.now(),
          },
        };
        persistState(updated);
        return updated;
      });

      return poppedRoute;
    },
    [persistState],
  );

  const popToRoot = useCallback(
    (tab: TabKey) => {
      setTabStates((prev) => {
        const updated = {
          ...prev,
          [tab]: {
            ...prev[tab],
            stackHistory: [],
            navigationDepth: 0,
            scrollPosition: 0,
            lastActiveTimestamp: Date.now(),
          },
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState],
  );

  const isInMultiStepFlow = useCallback(() => multiStepFlow, [multiStepFlow]);

  const setMultiStepFlow = useCallback((active: boolean) => {
    setMultiStepFlowState(active);
  }, []);

  const resetAllStates = useCallback(() => {
    const fresh = createDefaultAllTabStates();
    setTabStates(fresh);
    setMultiStepFlowState(false);
    persistState(fresh);
  }, [persistState]);

  // -------------------------------------------------------------------------
  // Memoised context value
  // -------------------------------------------------------------------------
  const value: NavigationStateContextValue = useMemo(
    () => ({
      getTabState,
      saveScrollPosition,
      pushRoute,
      popRoute,
      popToRoot,
      isInMultiStepFlow,
      setMultiStepFlow,
      resetAllStates,
    }),
    [
      getTabState,
      saveScrollPosition,
      pushRoute,
      popRoute,
      popToRoot,
      isInMultiStepFlow,
      setMultiStepFlow,
      resetAllStates,
    ],
  );

  return (
    <NavigationStateContext.Provider value={value}>
      {children}
    </NavigationStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the navigation state manager.
 * Must be used within a `<NavigationStateProvider>`.
 */
export function useNavigationState(): NavigationStateContextValue {
  const context = useContext(NavigationStateContext);
  if (!context) {
    throw new Error('useNavigationState must be used within a NavigationStateProvider');
  }
  return context;
}
