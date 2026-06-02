/**
 * Theme Provider for CulturePass Application
 * Ensures consistent theming across all components
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dark, light, CultureTokens } from '@/design-system/tokens/colors';
import { CulturalAccents } from '@/design-system/tokens/theme';
import { useAppAppearance } from '@/hooks/useAppAppearance';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: typeof light;
  culturalTokens: typeof CultureTokens;
  culturalAccents: typeof CulturalAccents;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { resolvedScheme, setPreference } = useAppAppearance();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark theme
  
  // Update theme based on app appearance
  useEffect(() => {
    setTheme(resolvedScheme);
  }, [resolvedScheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setPreference(newTheme);
  };

  const colors = theme === 'light' ? light : dark;
  const isDark = theme === 'dark';

  const value = {
    theme,
    colors,
    culturalTokens: CultureTokens,
    culturalAccents: CulturalAccents,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access cultural color tokens with theme awareness
 */
export const useCulturalColors = () => {
  const { colors, culturalTokens, culturalAccents, isDark } = useTheme();
  
  return {
    colors,
    culturalTokens,
    culturalAccents,
    isDark,
    // Convenience mappings for cultural colors
    primary: culturalTokens.terracottaGlow,        // Terracotta Glow (#E36A4E) - Primary action
    secondary: culturalTokens.deepSaffron,         // Deep Saffron (#F5A623) - Secondary action
    accent1: culturalTokens.richIndigo,            // Rich Indigo (#4A5EBF) - Accent 1
    accent2: culturalTokens.emeraldHarmony,        // Emerald Harmony (#0A8C7F) - Accent 2
    accent3: culturalTokens.heritageGold,          // Heritage Gold (#D4A017) - Accent 3
    background: isDark ? colors.background : colors.background,
    surface: isDark ? colors.surface : colors.surface,
    text: isDark ? colors.text : colors.text,
    textSecondary: isDark ? colors.textSecondary : colors.textSecondary,
  };
};