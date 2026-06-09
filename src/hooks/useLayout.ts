/**
 * useLayout — responsive layout hook for CulturePass.
 *
 * Returns platform + breakpoint state and pre-computed responsive values
 * so every component gets consistent grid, padding, and column config
 * without ad-hoc `useWindowDimensions()` boilerplate.
 *
 * Usage:
 *   const { isDesktop, numColumns, hPad, tabBarHeight, sidebarWidth } = useLayout();
 *
 * Web layout model:
 *   Mobile  (<768px)   → bottom tab bar
 *   Tablet  (768-1099px) → bottom tab bar (preferred on iPad landscape too)
 *   Desktop (≥1100px)  → left sidebar (240px) + main content (large tablets + desktop)
 *
 * On desktop web, the sidebar occupies 240px on the left. Components that
 * need to compute absolute widths must subtract sidebarWidth.
 * columnWidth() does this automatically.
 */

import { Platform, useWindowDimensions } from 'react-native';
import { Breakpoints, TabBarTokens } from '@/design-system/tokens/theme';
import { useSafeAreaInsetsWeb } from './useSafeAreaInsetsWeb';

/** Width of the desktop web left-nav sidebar in pixels */
export const SIDEBAR_WIDTH = 240;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LayoutState {
  /** Raw window width from useWindowDimensions */
  width: number;
  /** Raw window height from useWindowDimensions */
  height: number;

  // Platform
  isWeb:     boolean;
  isNative:  boolean;
  isIOS:     boolean;
  isAndroid: boolean;

  // Breakpoints
  isMobile:  boolean;   // < 768px
  isTablet:  boolean;   // 768–1023px
  isDesktop: boolean;   // ≥ 1024px

  // Material 3 Window Size Classes
  windowSizeClass: 'compact' | 'medium' | 'expanded';
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;

  // Grid
  /** Recommended column count for event / content grids */
  numColumns: number;
  /** Recommended column count for wider featured/discover grids */
  numColumnsWide: number;

  // Spacing
  /** Horizontal page padding */
  hPad: number;
  /** Vertical section spacing */
  vPad: number;
  /** Gap between grid columns */
  columnGap: number;

  // Navigation
  tabBarHeight: number;

  /**
   * Width of the left sidebar on desktop web (240px), 0 on all other layouts.
   * Subtract this when computing content-area widths on desktop web.
   */
  sidebarWidth: number;

  /**
   * Safe area top inset. On mobile web this respects iOS Dynamic Island/notch
   * via CSS `env(safe-area-inset-top)`.
   */
  safeAreaTop: number;

  /**
   * Safe area bottom inset. On mobile web this respects the home indicator.
   */
  safeAreaBottom: number;

  // Helpers
  /**
   * Width of a single grid column.
   * Accounts for outer padding + column gaps + sidebar on desktop web.
   */
  columnWidth: (cols?: number) => number;

  /**
   * Total usable content width after subtracting sidebar and outer padding.
   */
  contentWidth: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLayout(): LayoutState {
  const { width, height } = useWindowDimensions();

  const isWeb     = Platform.OS === 'web';
  const isNative  = !isWeb;
  const isIOS     = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // Desktop web sidebar at ≥1100px (avoids 1024–1099px tablet/sidebar overlap)
  const isDesktop = isWeb && width >= 1100;
  const isTablet  = width >= Breakpoints.tablet && width < 1100;
  const isMobile  = !isDesktop && !isTablet;

  // Material 3 Window Size Classes (dp equivalent for React Native)
  const isExpanded = width >= 840;
  const isMedium = width >= 600 && width < 840;
  const isCompact = width < 600;
  const windowSizeClass = isExpanded ? 'expanded' : isMedium ? 'medium' : 'compact';

  // Sidebar (desktop web only)
  const sidebarWidth = isDesktop ? SIDEBAR_WIDTH : 0;

  // Safe areas (web-aware) — must come before tabBarHeight
  const webSafeInsets = useSafeAreaInsetsWeb();
  const safeAreaTop = webSafeInsets.top;
  const safeAreaBottom = webSafeInsets.bottom;

  // Grid columns
  const numColumns     = isDesktop ? 3 : 2;
  const numColumnsWide = isDesktop ? 4 : isTablet ? 3 : 2;

  // Spacing
  const hPad = isDesktop ? 28 : isTablet ? 20 : 14;
  const vPad = isDesktop ? 28 : 20;
  const columnGap = isDesktop ? 14 : 12;

  // Navigation
  const tabBarHeight = isDesktop
    ? 0  // no tab bar on desktop — sidebar handles navigation
    : TabBarTokens.heightMobile + safeAreaBottom;

  // Usable content width (subtract sidebar on desktop, cap at 1200 for web center)
  const baseAreaWidth = width - sidebarWidth;
  const contentWidth = isDesktop
    ? Math.min(baseAreaWidth, 1200) - hPad * 2
    : width - hPad * 2;

  // Column width helper
  const columnWidth = (cols = numColumns): number => {
    const totalGaps = (cols - 1) * columnGap;
    const usableWidth = isDesktop ? Math.min(baseAreaWidth, 1200) : width - sidebarWidth;
    return (usableWidth - hPad * 2 - totalGaps) / cols;
  };

  return {
    width,
    height,
    isWeb,
    isNative,
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    windowSizeClass,
    isCompact,
    isMedium,
    isExpanded,
    numColumns,
    numColumnsWide,
    hPad,
    vPad,
    columnGap,
    tabBarHeight,
    sidebarWidth,
    safeAreaTop,
    safeAreaBottom,
    columnWidth,
    contentWidth,
  };
}
