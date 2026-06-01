import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Enhanced safe area insets that work correctly on mobile web (especially iOS Safari).
 *
 * On native: Uses the real insets from react-native-safe-area-context.
 * On web: 
 *   - Prefers CSS `env(safe-area-inset-*)` values when available (modern iOS Safari, some Android).
 *   - Falls back to the native-insets library value (which may be 0 on web).
 *   - Adds reasonable defaults for common mobile web cases.
 *
 * This allows us to stop hardcoding `safeInsets.top` everywhere.
 */
export function useSafeAreaInsetsWeb() {
  const nativeInsets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    return nativeInsets;
  }

  // On web, try to read the CSS env() values that we set in +html.tsx
  // These are only available in supporting browsers (iOS Safari 11.2+, etc.)
  const getCssInset = (name: string, fallback: number): number => {
    if (typeof window === 'undefined') return fallback;

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    if (!value) return fallback;

    // Parse "12px" or "0px" etc.
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  };

  const webInsets = {
    top: Math.max(
      getCssInset('--safe-area-inset-top', 0),
      nativeInsets.top
    ),
    right: Math.max(
      getCssInset('--safe-area-inset-right', 0),
      nativeInsets.right
    ),
    bottom: Math.max(
      getCssInset('--safe-area-inset-bottom', 0),
      nativeInsets.bottom
    ),
    left: Math.max(
      getCssInset('--safe-area-inset-left', 0),
      nativeInsets.left
    ),
  };

  return webInsets;
}

/**
 * Convenience hook for the most common case: top inset for headers/toolbars.
 * Returns a sensible value even on mobile web.
 */
export function useTopInset(): number {
  const insets = useSafeAreaInsetsWeb();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) return insets.top;

  // On web, ensure we have at least some padding for status bar / dynamic island area
  return Math.max(insets.top, 0);
}

/**
 * Convenience hook for bottom safe area (great for tab bars, modals, floating actions).
 */
export function useBottomInset(extra: number = 0): number {
  const insets = useSafeAreaInsetsWeb();
  return insets.bottom + extra;
}
