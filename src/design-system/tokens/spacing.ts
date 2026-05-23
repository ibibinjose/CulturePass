/**
 * Consistent spacing scale and layout constants.
 * Use these tokens instead of raw numbers for maintainable layouts.
 */

/** App-wide compact density — tighter rhythm without breaking the 4px grid. */
export const Spacing = {
  /** 4px */
  xs: 4,
  /** 6px */
  sm: 6,
  /** 12px */
  md: 12,
  /** 20px */
  lg: 20,
  /** 28px */
  xl: 28,
  /** 36px */
  xxl: 36,
  /** 44px */
  xxxl: 44,
} as const;

export const Radius = {
  /** 6px — badges, micro-pills */
  xs: 6,
  /** 10px — chips, small buttons */
  sm: 10,
  /** 16px — buttons, inputs (default) */
  md: 16,
  /** 20px — event cards, list rows */
  lg: 20,
  /** 24px — modals, sheets, hero cards */
  xl: 24,
  /** 9999px — fully round (pills, avatars) */
  full: 9999,
} as const;

export const Breakpoints = {
  /** Mobile → tablet transition */
  tablet: 768,
  /** Tablet → desktop transition */
  desktop: 1024,
  /** Desktop → wide-screen transition */
  wide: 1280,
} as const;

export const Layout = {
  /** Maximum content width for narrow mobile web */
  maxContentWidth: 480,
  /** Phone-shell max width on mobile web */
  mobileWebShell: 480,
  /** Tablet container max width */
  tabletMaxWidth: 768,
  /** Desktop container max width */
  desktopMaxWidth: 1280,
  /** Wider breakpoint for tablet / desktop */
  wideBreakpoint: 768,
  /** Tab bar approximate height for bottom padding (legacy estimate; prefer `TabBarTokens` + insets in hooks) */
  tabBarHeight: 72,
} as const;
