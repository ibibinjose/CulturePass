/**
 * Responsive utilities for CulturePass application
 * Provides consistent responsive behavior across different screen sizes
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device breakpoints
export const BREAKPOINTS = {
  xs: 320,      // Extra small devices (phones, 320px and up)
  sm: 576,      // Small devices (landscape phones, 576px and up)
  md: 768,      // Medium devices (tablets, 768px and up)
  lg: 992,      // Large devices (desktops, 992px and up)
  xl: 1200,     // Extra large devices (large desktops, 1200px and up)
  xxl: 1400,    // Extra extra large devices (very wide screens, 1400px and up)
} as const;

// Screen size categories
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * Gets the current screen size category
 */
export function getScreenSize(): ScreenSize {
  if (SCREEN_WIDTH < BREAKPOINTS.sm) return 'xs';
  if (SCREEN_WIDTH < BREAKPOINTS.md) return 'sm';
  if (SCREEN_WIDTH < BREAKPOINTS.lg) return 'md';
  if (SCREEN_WIDTH < BREAKPOINTS.xl) return 'lg';
  if (SCREEN_WIDTH < BREAKPOINTS.xxl) return 'xl';
  return 'xxl';
}

/**
 * Checks if the current screen is mobile-sized
 */
export function isMobile(): boolean {
  return SCREEN_WIDTH < BREAKPOINTS.md;
}

/**
 * Checks if the current screen is tablet-sized
 */
export function isTablet(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.md && SCREEN_WIDTH < BREAKPOINTS.lg;
}

/**
 * Checks if the current screen is desktop-sized
 */
export function isDesktop(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.lg;
}

/**
 * Gets responsive value based on screen size
 */
export function getResponsiveValue<T>(
  xs: T, sm: T, md: T, lg: T, xl: T, xxl: T
): T {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case 'xs': return xs;
    case 'sm': return sm;
    case 'md': return md;
    case 'lg': return lg;
    case 'xl': return xl;
    case 'xxl': return xxl;
    default: return md;
  }
}

/**
 * Gets responsive value with fewer breakpoints
 */
export function getResponsiveValueSimple<T>(
  mobile: T, 
  tablet: T, 
  desktop: T
): T {
  if (isMobile()) return mobile;
  if (isTablet()) return tablet;
  return desktop;
}

/**
 * Gets responsive font size
 */
export function getResponsiveFontSize(
  baseSize: number = 16
): number {
  return getResponsiveValueSimple(
    baseSize * 0.9,      // Mobile: slightly smaller
    baseSize,            // Tablet: base size
    baseSize * 1.1       // Desktop: slightly larger
  );
}

/**
 * Gets responsive spacing
 */
export function getResponsiveSpacing(
  baseSpacing: number = 16
): number {
  return getResponsiveValueSimple(
    baseSpacing * 0.8,   // Mobile: more compact
    baseSpacing,         // Tablet: base spacing
    baseSpacing * 1.2    // Desktop: more generous spacing
  );
}

/**
 * Gets responsive container width
 */
export function getResponsiveContainerWidth(): number {
  return getResponsiveValueSimple(
    SCREEN_WIDTH - 32,   // Mobile: full width with padding
    SCREEN_WIDTH * 0.9,  // Tablet: 90% of screen width
    1200                 // Desktop: max width of 1200px
  );
}

/**
 * Gets responsive card dimensions
 */
export function getResponsiveCardDimensions(): { width: number; height: number } {
  const screenWidth = SCREEN_WIDTH;
  
  if (isMobile()) {
    return {
      width: screenWidth - 32,
      height: 200
    };
  } else if (isTablet()) {
    return {
      width: (screenWidth / 2) - 24,
      height: 220
    };
  } else {
    return {
      width: (screenWidth / 3) - 24,
      height: 240
    };
  }
}

/**
 * Detects if device is high pixel density
 */
export function isHighDensity(): boolean {
  return PixelRatio.get() > 2;
}

/**
 * Gets scaled size for high density displays
 */
export function scaleForDensity(size: number): number {
  const scale = PixelRatio.get();
  return size * scale;
}

/**
 * Gets responsive button size
 */
export function getResponsiveButtonSize(): { height: number; paddingHorizontal: number } {
  return getResponsiveValueSimple(
    { height: 44, paddingHorizontal: 16 },   // Mobile
    { height: 48, paddingHorizontal: 20 },   // Tablet
    { height: 52, paddingHorizontal: 24 }    // Desktop
  );
}

/**
 * Gets responsive input size
 */
export function getResponsiveInputSize(): { height: number; fontSize: number } {
  return getResponsiveValueSimple(
    { height: 40, fontSize: 14 },   // Mobile
    { height: 44, fontSize: 15 },   // Tablet
    { height: 48, fontSize: 16 }    // Desktop
  );
}

/**
 * Gets responsive icon size
 */
export function getResponsiveIconSize(): number {
  return getResponsiveValueSimple(
    20,   // Mobile
    22,   // Tablet
    24    // Desktop
  );
}

/**
 * Gets responsive navigation height
 */
export function getResponsiveNavigationHeight(): number {
  return Platform.select({
    ios: getResponsiveValueSimple(44, 48, 56),
    android: getResponsiveValueSimple(44, 48, 56),
    web: getResponsiveValueSimple(48, 52, 60),
    default: getResponsiveValueSimple(44, 48, 56),
  });
}

/**
 * Gets responsive header height
 */
export function getResponsiveHeaderHeight(): number {
  return Platform.select({
    ios: getResponsiveValueSimple(88, 92, 100),    // Includes status bar on iOS
    android: getResponsiveValueSimple(64, 72, 80),
    web: getResponsiveValueSimple(64, 72, 80),
    default: getResponsiveValueSimple(64, 72, 80),
  });
}

/**
 * Gets responsive safe area insets
 */
export function getResponsiveSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  return {
    top: Platform.OS === 'ios' ? (SCREEN_WIDTH <= 375 ? 44 : 47) : 0,
    bottom: Platform.OS === 'ios' ? (SCREEN_WIDTH <= 375 ? 34 : 34) : 0,
    left: 0,
    right: 0,
  };
}

/**
 * Gets responsive modal dimensions
 */
export function getResponsiveModalDimensions(): { width: number; height: number; maxHeight: number } {
  const screenWidth = SCREEN_WIDTH;
  const screenHeight = SCREEN_HEIGHT;
  
  if (isMobile()) {
    return {
      width: screenWidth,
      height: screenHeight * 0.8,
      maxHeight: screenHeight * 0.9
    };
  } else if (isTablet()) {
    return {
      width: Math.min(screenWidth * 0.9, 600),
      height: Math.min(screenHeight * 0.7, 600),
      maxHeight: screenHeight * 0.8
    };
  } else {
    return {
      width: Math.min(screenWidth * 0.6, 800),
      height: Math.min(screenHeight * 0.6, 600),
      maxHeight: screenHeight * 0.7
    };
  }
}

/**
 * Gets responsive grid columns count
 */
export function getResponsiveGridColumns(): number {
  if (isMobile()) return 1;
  if (isTablet()) return 2;
  return 3;
}

/**
 * Gets responsive list item height
 */
export function getResponsiveListItemHeight(): number {
  return getResponsiveValueSimple(
    60,   // Mobile
    68,   // Tablet
    76    // Desktop
  );
}

// Export constants for convenience
export const ResponsiveConstants = {
  BREAKPOINTS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  IS_MOBILE: isMobile(),
  IS_TABLET: isTablet(),
  IS_DESKTOP: isDesktop(),
  IS_HIGH_DENSITY: isHighDensity(),
};