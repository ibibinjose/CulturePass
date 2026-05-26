import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { light as LightColors, dark as DarkColors, CultureTokens } from '@/design-system/tokens/colors';

interface CulturalTheme {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  heritageGold: string;
  richIndigo: string;
  emeraldHarmony: string;
  error: string;
  background: string;
  surface: string;
  onSurface: string;
  onPrimary: string;
  onSecondary: string;
  isDark: boolean;
}

interface CulturalThemeProviderProps {
  children: ReactNode;
}

// Safe fallback theme — prevents crashes if color tokens are ever undefined
const SAFE_DEFAULT_THEME: CulturalTheme = {
  primary: '#E36A4E',
  secondary: '#F5A623',
  accent1: '#4A5EBF',
  accent2: '#0A8C7F',
  accent3: '#D4A017',
  heritageGold: '#D4A017',
  richIndigo: '#4A5EBF',
  emeraldHarmony: '#0A8C7F',
  error: '#BA1A1A',
  background: '#0B0B14',
  surface: '#16141F',
  onSurface: '#F5F5F5',
  onPrimary: '#FFFFFF',
  onSecondary: '#1C1917',
  isDark: true,
};

function getSafeTheme(colorScheme: string | null | undefined): CulturalTheme {
  const isDark = colorScheme === 'dark';

  try {
    const themeColors = isDark ? DarkColors : LightColors;

    return {
      primary: CultureTokens.terracottaGlow,
      secondary: CultureTokens.deepSaffron,
      accent1: CultureTokens.richIndigo,
      accent2: CultureTokens.emeraldHarmony,
      accent3: CultureTokens.heritageGold,
      heritageGold: CultureTokens.heritageGold,
      richIndigo: CultureTokens.richIndigo,
      emeraldHarmony: CultureTokens.emeraldHarmony,
      error: themeColors?.error ?? SAFE_DEFAULT_THEME.error,
      background: isDark ? CultureTokens.backgroundDark : CultureTokens.backgroundLight,
      surface: themeColors?.surface ?? SAFE_DEFAULT_THEME.surface,
      onSurface: themeColors?.text ?? SAFE_DEFAULT_THEME.onSurface,
      onPrimary: '#FFFFFF', // Safe high-contrast value for brand actions
      onSecondary: themeColors?.textSecondary ?? SAFE_DEFAULT_THEME.onSecondary,
      isDark,
    };
  } catch (err) {
    console.warn('[CulturalThemeProvider] Failed to build theme, using safe fallback:', err);
    return { ...SAFE_DEFAULT_THEME, isDark };
  }
}

const CulturalThemeContext = createContext<CulturalTheme>(SAFE_DEFAULT_THEME);

export const CulturalThemeProvider: React.FC<CulturalThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();

  // Use useMemo for performance + immediate safe computation
  const theme = useMemo(() => {
    return getSafeTheme(colorScheme);
  }, [colorScheme]);

  return (
    <CulturalThemeContext.Provider value={theme}>
      {children}
    </CulturalThemeContext.Provider>
  );
};

export const useCulturalTheme = (): CulturalTheme => {
  const context = useContext(CulturalThemeContext);
  // Return safe default instead of throwing — much more defensive in production
  if (!context) {
    console.warn('[useCulturalTheme] Used outside provider — returning safe default');
    return SAFE_DEFAULT_THEME;
  }
  return context;
};