/**
 * useColors — runtime color hook for CulturePass.
 *
 * Platform behaviour:
 *   • iOS / Android / Web all resolve from the same appearance source:
 *     `useAppAppearance()` (`system` | `dark` | `light`).
 *   • Web follows the in-app appearance preference, not a separate fixed mode.
 *
 * Usage:
 *   const colors = useColors();
 *   <View style={{ backgroundColor: colors.background }} />
 *   <Text style={{ color: colors.text }} />
 *
 * For static use (e.g. in StyleSheet.create at module level where hooks
 * cannot be called), import Colors directly:
 *   import Colors from '@/design-system/tokens/colors';
 *   // Colors.primary, Colors.background, etc. (maps to light theme by default)
 *
 * Note:
 *   Use this hook for all runtime colors instead of hardcoding values in
 *   components. This remains the single switch point for any future theme changes.
 */

import type { ColorTheme } from '@/design-system/tokens/colors';
import { light, dark } from '@/design-system/tokens/colors';
import { useAppAppearance } from '@/hooks/useAppAppearance';

export function useColors(): ColorTheme {
  const { resolvedScheme } = useAppAppearance();
  return resolvedScheme === 'light' ? light : dark;
}

// ---------------------------------------------------------------------------
// Selector variant — access a single token without re-rendering on
// unrelated color changes (useful for components that only use one color).
//
// Usage:
//   const primary = useColor('primary');
// ---------------------------------------------------------------------------
export function useColor<K extends keyof ColorTheme>(key: K): ColorTheme[K] {
  const colors = useColors();
  return colors[key];
}

// ---------------------------------------------------------------------------
// Utilities for inline platform-aware color decisions
// ---------------------------------------------------------------------------

/** Returns darkValue when a dark theme is active, lightValue otherwise. */
export function useSchemeValue<T>(darkValue: T, lightValue: T): T {
  const isDark = useIsDark();
  return isDark ? darkValue : lightValue;
}

/** Returns true when the dark theme is active. */
export function useIsDark(): boolean {
  const { resolvedScheme } = useAppAppearance();
  return resolvedScheme === 'dark';
}
