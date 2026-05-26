/**
 * Spacing tokens for the CulturePass design system
 * Provides consistent spacing values across the application
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Responsive spacing multipliers
 */
export const ResponsiveSpacing = {
  mobile: 1,
  tablet: 1.2,
  desktop: 1.5,
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

/**
 * Section spacing presets
 */
export const SectionSpacing = {
  compact: {
    vertical: Spacing.md,
    horizontal: Spacing.md,
  },
  regular: {
    vertical: Spacing.xl,
    horizontal: Spacing.lg,
  },
  spacious: {
    vertical: Spacing.xxl,
    horizontal: Spacing.xl,
  },
  generous: {
    vertical: Spacing.xxxl,
    horizontal: Spacing.xxl,
  },
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

/**
 * Card spacing presets
 */
export const CardSpacing = {
  tight: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  regular: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  comfortable: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  spacious: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
} as const;

/**
 * Button spacing presets
 */
export const ButtonSpacing = {
  compact: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  regular: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  spacious: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
} as const;
