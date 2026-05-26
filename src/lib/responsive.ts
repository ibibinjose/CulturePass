/**
 * Responsive utilities for managing spacing and layout across different screen sizes
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if current screen matches a breakpoint
 */
export const isBreakpoint = (breakpoint: Breakpoint): boolean => {
  const breakpointValue = BREAKPOINTS[breakpoint];
  return SCREEN_WIDTH >= breakpointValue;
};

/**
 * Get the current device type based on screen width
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (SCREEN_WIDTH >= BREAKPOINTS.desktop) {
    return 'desktop';
  } else if (SCREEN_WIDTH >= BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'mobile';
};

/**
 * Get responsive spacing values based on device type
 */
export const getResponsiveSpacing = (baseSpacing: number): { mobile: number; tablet: number; desktop: number } => {
  return {
    mobile: baseSpacing,
    tablet: baseSpacing * 1.2,
    desktop: baseSpacing * 1.5,
  };
};

/**
 * Get responsive padding/margin based on device type
 */
export const getResponsivePadding = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): number => {
  const baseSizes = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  const baseSize = baseSizes[size];
  const deviceType = getDeviceType();

  switch (deviceType) {
    case 'desktop':
      return baseSize * 1.5;
    case 'tablet':
      return baseSize * 1.2;
    case 'mobile':
    default:
      return baseSize;
  }
};

/**
 * Get responsive font size based on device type
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'desktop':
      return baseSize * 1.1;
    case 'tablet':
      return baseSize * 1.05;
    case 'mobile':
    default:
      return baseSize;
  }
};

/**
 * Get responsive component width based on device type
 */
export const getResponsiveWidth = (maxWidth: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'desktop':
      return Math.min(maxWidth * 1.2, SCREEN_WIDTH * 0.8);
    case 'tablet':
      return Math.min(maxWidth * 1.1, SCREEN_WIDTH * 0.9);
    case 'mobile':
    default:
      return Math.min(maxWidth, SCREEN_WIDTH - 32);
  }
};