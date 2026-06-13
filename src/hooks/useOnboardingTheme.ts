import { useColors, useIsDark } from '@/hooks/useColors';
import {
  getLocationScreenPalette,
  type LocationScreenPalette,
} from '@/constants/locationScreenTheme';

/** Shared AU-themed palette for all post-signup onboarding steps. */
export function useOnboardingTheme(): {
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  au: LocationScreenPalette;
} {
  const colors = useColors();
  const isDark = useIsDark();
  const au = getLocationScreenPalette(isDark, {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  });
  return { colors, isDark, au };
}