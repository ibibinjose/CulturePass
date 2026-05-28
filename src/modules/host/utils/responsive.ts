/**
 * Responsive Utilities for HostSpace Form System
 *
 * Shared helpers for mobile-responsive design across wizard and field components.
 * Works with the CulturePass design system (useLayout, CultureTokens).
 *
 * Key breakpoints (from useLayout):
 *   Mobile:  < 768px
 *   Tablet:  768–1023px
 *   Desktop: ≥ 1024px
 *
 * Requirements: 22 (Mobile Responsive Design)
 */

import { type ViewStyle, type TextStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum touch target size per Apple HIG / WCAG 2.5.5.
 * All interactive elements on mobile must be at least 44×44 points.
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Breakpoint below which fields stack vertically.
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Minimum supported screen width.
 */
export const MIN_SCREEN_WIDTH = 320;

// ---------------------------------------------------------------------------
// Touch Target Helpers
// ---------------------------------------------------------------------------

/**
 * Returns styles that ensure a minimum 44×44pt touch target on mobile.
 * On desktop, returns the original dimensions unchanged.
 */
export function touchTargetStyle(isMobile: boolean): ViewStyle {
  if (!isMobile) return {};
  return {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
  };
}

/**
 * Returns button height appropriate for the current layout.
 * Mobile buttons use 48pt (above 44pt minimum), desktop uses standard.
 */
export function responsiveButtonHeight(isMobile: boolean): number {
  return isMobile ? 48 : 48;
}

// ---------------------------------------------------------------------------
// Field Layout Helpers
// ---------------------------------------------------------------------------

/**
 * Returns flex direction for field rows.
 * Mobile: column (stacked vertically)
 * Desktop: row (side by side)
 */
export function fieldRowDirection(isMobile: boolean): ViewStyle {
  return {
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 16 : 12,
  };
}

/**
 * Returns styles for a field within a row.
 * On desktop, fields share the row equally.
 * On mobile, each field takes full width.
 */
export function fieldInRow(isMobile: boolean): ViewStyle {
  return isMobile ? { width: '100%' } : { flex: 1 };
}

// ---------------------------------------------------------------------------
// Visibility Helpers
// ---------------------------------------------------------------------------

/**
 * Returns display style to hide non-essential UI on mobile.
 */
export function hideOnMobile(isMobile: boolean): ViewStyle {
  return isMobile ? { display: 'none' } : {};
}

/**
 * Returns display style to show elements only on mobile.
 */
export function showOnlyOnMobile(isMobile: boolean): ViewStyle {
  return isMobile ? {} : { display: 'none' };
}

// ---------------------------------------------------------------------------
// Input Type Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate keyboard type for mobile-optimized input.
 * Maps semantic field types to React Native keyboardType values.
 */
export function mobileKeyboardType(
  fieldType: 'phone' | 'email' | 'number' | 'url' | 'default'
): 'phone-pad' | 'email-address' | 'numeric' | 'url' | 'default' {
  switch (fieldType) {
    case 'phone':
      return 'phone-pad';
    case 'email':
      return 'email-address';
    case 'number':
      return 'numeric';
    case 'url':
      return 'url';
    default:
      return 'default';
  }
}

/**
 * Returns the appropriate autoComplete value for mobile-optimized input.
 */
export function mobileAutoComplete(
  fieldType: 'phone' | 'email' | 'name' | 'address' | 'default'
): string {
  switch (fieldType) {
    case 'phone':
      return 'tel';
    case 'email':
      return 'email';
    case 'name':
      return 'name';
    case 'address':
      return 'street-address';
    default:
      return 'off';
  }
}

// ---------------------------------------------------------------------------
// Spacing Helpers
// ---------------------------------------------------------------------------

/**
 * Returns responsive horizontal padding based on screen width.
 */
export function responsiveHPad(width: number): number {
  if (width < 360) return 12; // Very small screens (320-359px)
  if (width < MOBILE_BREAKPOINT) return 16; // Mobile
  if (width < 1024) return 24; // Tablet
  return 32; // Desktop
}

/**
 * Returns responsive section spacing.
 */
export function responsiveSectionGap(isMobile: boolean): number {
  return isMobile ? 20 : 28;
}

/**
 * Returns responsive content max width for readability.
 */
export function responsiveMaxWidth(isDesktop: boolean): ViewStyle {
  return isDesktop
    ? { maxWidth: 720, width: '100%', alignSelf: 'center' as const }
    : {};
}

// ---------------------------------------------------------------------------
// Typography Helpers
// ---------------------------------------------------------------------------

/**
 * Returns responsive font size for section headers.
 */
export function responsiveHeaderSize(isMobile: boolean): TextStyle {
  return {
    fontSize: isMobile ? 20 : 24,
    lineHeight: isMobile ? 26 : 32,
  };
}

/**
 * Returns responsive font size for field labels.
 */
export function responsiveLabelSize(isMobile: boolean): TextStyle {
  return {
    fontSize: isMobile ? 14 : 15,
  };
}
