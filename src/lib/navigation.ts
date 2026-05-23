import { type Href, router, useLocalSearchParams, usePathname } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * CulturePass Navigation Utilities v2.1
 *
 * All route helpers are plain functions (no hooks inside).
 * Hooks (useSafeBack, useEventNavigation, etc.) are kept for component use.
 */

/** When there is no stack history (deep link, refresh), back buttons replace here instead of no-op. */
export const DEFAULT_APP_BACK_FALLBACK = '/(tabs)' as const;

// ---------------------------------------------------------------------------
// Plain navigation helpers
// ---------------------------------------------------------------------------

/**
 * Type-safe wrapper for router.push with dynamic routes.
 * Avoids `as any` casts on string routes that Expo Router's strict typing rejects.
 */
export function navigateTo(route: string | Href) {
  router.push(route as Href);
}

export function goHome() {
  router.replace('/(tabs)');
}

export function navigateToEvent(eventId: string) {
  router.push({ pathname: '/e/[id]', params: { id: eventId } });
}

export function navigateToProfile(identifier: string) {
  if (identifier.startsWith('CP-USER-') || identifier.startsWith('CP-U')) {
    router.push({ pathname: '/contacts/[cpid]', params: { cpid: identifier } });
  } else if (identifier.startsWith('@')) {
    router.push({ pathname: '/user/[id]', params: { id: identifier.slice(1) } });
  } else {
    router.push({ pathname: '/user/[id]', params: { id: identifier } });
  }
}

export function goBackOrReplace(fallback: string) {
  let can = false;
  try {
    can = router.canGoBack();
  } catch {
    // Expo Router's imperative `canGoBack` throws in DOM component runtimes (expo/dom).
    can = false;
  }
  if (can) {
    router.back();
  } else {
    router.replace(fallback as Href);
  }
}

/** Short alias used across the app — back if possible, else replace with fallback. */
export const n = goBackOrReplace;

export function shareEventLink(event: { id: string; title: string }) {
  const url = `culturepass://event/${event.id}`;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    navigator.clipboard?.writeText(url);
  }
  // Native: use expo-sharing when needed
}

// ---------------------------------------------------------------------------
// React hooks (safe to use inside components)
// ---------------------------------------------------------------------------

/**
 * Back if the navigation stack allows it, else `router.replace(fallback)`.
 * Delegates to goBackOrReplace which uses router.canGoBack() with a try-catch,
 * avoiding the web cold-start false-positive where navigation.canGoBack() returns
 * true (Expo Router init state) causing router.back() → window.history.back() → no-op.
 */
export function useSafeBack(fallback: string = DEFAULT_APP_BACK_FALLBACK) {
  return useCallback(() => {
    goBackOrReplace(fallback);
  }, [fallback]);
}

export function useEventNavigation() {
  return {
    goToEvent: (eventId: string) => navigateToEvent(eventId),
    goToEventCpid: (cpid: string) => navigateToEvent(cpid.replace('CP-EVT-', '')),
  };
}

export function useProfileNavigation() {
  return {
    goToProfile: (identifier: string) => navigateToProfile(identifier),
  };
}

export function useDeepLinkSafe(href: Href) {
  const pathname = usePathname();
  useLocalSearchParams(); // keep the hook call so it re-renders on param changes

  return useCallback(() => {
    const target = typeof href === 'string' ? href : href.pathname;
    if (pathname === target) return;
    router.push(href);
  }, [href, pathname]);
}
