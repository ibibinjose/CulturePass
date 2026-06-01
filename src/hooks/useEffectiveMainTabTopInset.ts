import { useSafeAreaInsetsWeb } from './useSafeAreaInsetsWeb';

/**
 * Top safe inset for main tab screens.
 * On mobile web (iPhone/iPad Safari), this now correctly returns the Dynamic Island / notch inset
 * instead of hardcoding 0.
 */
export function useEffectiveMainTabTopInset(): number {
  const insets = useSafeAreaInsetsWeb();
  return insets.top;
}
