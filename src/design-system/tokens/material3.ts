/**
 * Material 3 Expressive Color System for CulturePass
 *
 * This system follows the Material 3 spec for dynamic and expressive color,
 * while maintaining the "Night Festival" brand identity.
 */

export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  background: string;
  onBackground: string;

  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  outline: string;
  outlineVariant: string;

  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // M3 Expressive Surface Containers
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

/**
 * Dark Theme (Default — Night Festival base + CulturePass M3 roles)
 */
export const darkM3: M3ColorScheme = {
  primary: "#C8C1FF",
  onPrimary: "#23105E",
  primaryContainer: "#4F46E5",
  onPrimaryContainer: "#F1EFFF",

  secondary: "#E5B7FF",
  onSecondary: "#3B0A5D",
  secondaryContainer: "#5C1F8A",
  onSecondaryContainer: "#F7E7FF",

  tertiary: "#7FD8D0",
  onTertiary: "#003733",
  tertiaryContainer: "#0D9488",
  onTertiaryContainer: "#D8FFFA",

  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",

  background: "#000000",
  onBackground: "#FAF9F6",

  surface: "#121214",
  onSurface: "#FAF9F6",
  surfaceVariant: "#1E1E20",
  onSurfaceVariant: "#A1A1AA",

  outline: "#78716C",
  outlineVariant: "#44403C",

  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#FAF9F6",
  inverseOnSurface: "#1C1917",
  inversePrimary: "#4F46E5",

  surfaceDim: "#0C0A09",
  surfaceBright: "#292524",
  surfaceContainerLowest: "#0C0A09",
  surfaceContainerLow: "#1C1917",
  surfaceContainer: "#1C1917",
  surfaceContainerHigh: "#292524",
  surfaceContainerHighest: "#3C3836",
};

/**
 * Light Theme — clean M3 neutrals + CulturePass brand roles
 */
export const lightM3: M3ColorScheme = {
  primary: "#4F46E5",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E8DDFF",
  onPrimaryContainer: "#1B0B4B",

  secondary: "#9333EA",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#F1D9FF",
  onSecondaryContainer: "#30004E",

  tertiary: "#0D9488",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#B9FFF6",
  onTertiaryContainer: "#00201D",

  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",

  background: "#FFFBF7",
  onBackground: "#1C1917",

  surface: "#FFFDFA",
  onSurface: "#1C1917",
  surfaceVariant: "#F0ECEB",
  onSurfaceVariant: "#44403C",

  outline: "#78716C",
  outlineVariant: "#D6D3D1",

  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#2C2825",
  inverseOnSurface: "#FAF9F6",
  inversePrimary: "#C8C1FF",

  surfaceDim: "#EAE6E2",
  surfaceBright: "#FFFBF7",
  surfaceContainerLowest: "#FFFDFA",
  surfaceContainerLow: "#F5F1EE",
  surfaceContainer: "#EDE9E4",
  surfaceContainerHigh: "#E7E5E4",
  surfaceContainerHighest: "#E1DFDC",
};
