/**
 * useM3Colors — Material 3 runtime color hook for CulturePass.
 */

import { darkM3, lightM3, M3ColorScheme } from '@/design-system/tokens/material3';
import { useAppAppearance } from '@/hooks/useAppAppearance';

export function useM3Colors(): M3ColorScheme {
  const { resolvedScheme } = useAppAppearance();
  return resolvedScheme === 'light' ? lightM3 : darkM3;
}

export function useM3Color<K extends keyof M3ColorScheme>(key: K): M3ColorScheme[K] {
  const colors = useM3Colors();
  return colors[key];
}
