import {
  BRAND_APP_BLUE,
  BRAND_CULTURE_RED,
  BRAND_PASS_GREEN,
} from '@/design-system/tokens/brandWordmarkPalette';
import { cyanAlpha } from '@/design-system/tokens/brandCyanPalette';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { luxeDark, luxeLight } from '@/design-system/tokens/luxeHeritage';

export type AuthScreenVariant = 'login' | 'signup' | 'host';

export type AuthScreenPalette = {
  orbPrimary: string;
  orbSecondary: string;
  panelBackground: string;
  panelBorder: string;
  accent: string;
  accentMuted: string;
  text: string;
  textSecondary: string;
  surfaceElevated: string;
  border: string;
};

export function getAuthScreenPalette(
  variant: AuthScreenVariant,
  isDark: boolean,
  colors: ColorTheme,
): AuthScreenPalette {
  const luxe = isDark ? luxeDark : luxeLight;

  if (variant === 'login') {
    return {
      orbPrimary: `${BRAND_APP_BLUE}33`,
      orbSecondary: `${BRAND_APP_BLUE}14`,
      panelBackground: isDark ? '#071A28' : '#E8F6FF',
      panelBorder: isDark ? `${BRAND_APP_BLUE}55` : `${BRAND_APP_BLUE}33`,
      accent: BRAND_APP_BLUE,
      accentMuted: isDark ? '#0A2A3D' : '#D6EEFC',
      text: luxe.text,
      textSecondary: luxe.textSecondary,
      surfaceElevated: luxe.surfaceElevated,
      border: luxe.border,
    };
  }

  if (variant === 'signup' || variant === 'host') {
    return {
      orbPrimary: `${BRAND_PASS_GREEN}30`,
      orbSecondary: `${BRAND_CULTURE_RED}18`,
      panelBackground: isDark ? '#071A14' : '#EAF8F1',
      panelBorder: isDark ? `${BRAND_PASS_GREEN}55` : `${BRAND_PASS_GREEN}33`,
      accent: variant === 'host' ? BRAND_CULTURE_RED : BRAND_PASS_GREEN,
      accentMuted: isDark ? '#0A2218' : '#D8F3E5',
      text: luxe.text,
      textSecondary: luxe.textSecondary,
      surfaceElevated: luxe.surfaceElevated,
      border: luxe.border,
    };
  }

  return {
    orbPrimary: cyanAlpha(0.2),
    orbSecondary: cyanAlpha(0.08),
    panelBackground: colors.surfaceElevated,
    panelBorder: colors.border,
    accent: colors.primary,
    accentMuted: colors.primarySoft,
    text: colors.text,
    textSecondary: colors.textSecondary,
    surfaceElevated: colors.surfaceElevated,
    border: colors.border,
  };
}