import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { HOSTSPACE_MUJI_FORM } from '@/design-system/tokens/hostspaceEventCreateTokens';

export type CreateFormTheme = {
  bg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  inputBg: string;
  required: string;
};

/** Muji-inspired palette for HostSpace creation flows; adapts for dark mode. */
export function useCreateFormTheme(): CreateFormTheme {
  const colors = useColors();
  const isDark = useIsDark();

  if (isDark) {
    return {
      bg: colors.background,
      card: colors.surface,
      border: colors.borderLight,
      text: colors.text,
      textMuted: colors.textSecondary,
      accent: CultureTokens.teal,
      accentLight: `${CultureTokens.teal}22`,
      inputBg: colors.surfaceElevated,
      required: colors.error,
    };
  }

  return {
    bg: HOSTSPACE_MUJI_FORM.bg,
    card: HOSTSPACE_MUJI_FORM.card,
    border: HOSTSPACE_MUJI_FORM.border,
    text: HOSTSPACE_MUJI_FORM.text,
    textMuted: HOSTSPACE_MUJI_FORM.textMuted,
    accent: HOSTSPACE_MUJI_FORM.accent,
    accentLight: HOSTSPACE_MUJI_FORM.accentLight,
    inputBg: HOSTSPACE_MUJI_FORM.white,
    required: HOSTSPACE_MUJI_FORM.requiredAccent,
  };
}