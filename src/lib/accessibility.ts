/**
 * Accessibility utilities for CulturePass application
 * Provides consistent accessibility patterns across the app
 */

import { AccessibilityInfo, Platform } from 'react-native';

export type LiveRegionPoliteness = 'polite' | 'assertive';

export type ContentChangeType = 'toast' | 'error' | 'loading' | 'info';

export function getAnnouncementPoliteness(
  contentType: ContentChangeType,
): LiveRegionPoliteness {
  return contentType === 'error' ? 'assertive' : 'polite';
}

export function buildScreenAnnouncement(tabName: string, screenTitle: string): string {
  return `${tabName}, ${screenTitle}`;
}

/**
 * Accessibility roles for different UI elements
 */
export const AccessibilityRoles = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  IMAGE: 'image',
  TEXT: 'text',
  SEARCH: 'search',
  ADJUSTABLE: 'adjustable',
  ALERT: 'alert',
  CHECKBOX: 'checkbox',
  COMBO_BOX: 'combobox',
  MENU: 'menu',
  MENU_ITEM: 'menuitem',
  PROGRESS_BAR: 'progressbar',
  RADIO: 'radio',
  RADIO_GROUP: 'radiogroup',
  SCROLL_VIEW: 'scrollview',
  SPIN_BUTTON: 'spinbutton',
  SUMMARY: 'summary',
  SWITCH: 'switch',
  TAB: 'tab',
  TAB_LIST: 'tablist',
  TIMER: 'timer',
  LIST: 'list',
  LIST_ITEM: 'listitem',
} as const;

/**
 * Accessibility states for different UI elements
 */
export const AccessibilityStates = {
  SELECTED: 'selected',
  DISABLED: 'disabled',
  BUSY: 'busy',
  EXPANDED: 'expanded',
  CHECKED: 'checked',
  UNCHECKED: 'unchecked',
} as const;

/**
 * Accessibility traits for iOS
 */
export const AccessibilityTraits = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  IMAGE: 'image',
  SELECTED: 'selected',
  CONTAINS_HIDDEN_ACCESSIBILITY_ELEMENT: 'containsHiddenAccessibilityElements',
  STATIC_TEXT: 'staticText',
  SUMMARY_ELEMENT: 'summaryElement',
  NOT_ENABLED: 'notEnabled',
  UPDATES_FREQUENTLY: 'updatesFrequently',
  STARTS_WITH_CAPITAL_LETTER: 'startsWithCapitalLetter',
  AUTO_CORRECTED: 'autoCorrected',
} as const;

/**
 * Utility function to get accessibility props for buttons
 */
export function getButtonAccessibilityProps(label: string, disabled: boolean = false) {
  return {
    accessibilityRole: AccessibilityRoles.BUTTON,
    accessibilityLabel: label,
    accessibilityState: { disabled },
    accessibilityHint: `Tap to ${label.toLowerCase()}`,
    ...(Platform.OS === 'ios' && { accessibilityTraits: disabled ? [AccessibilityTraits.NOT_ENABLED] : [AccessibilityTraits.BUTTON] }),
  };
}

/**
 * Utility function to get accessibility props for links
 */
export function getLinkAccessibilityProps(label: string) {
  return {
    accessibilityRole: AccessibilityRoles.LINK,
    accessibilityLabel: label,
    accessibilityHint: `Navigate to ${label}`,
    ...(Platform.OS === 'ios' && { accessibilityTraits: [AccessibilityTraits.LINK] }),
  };
}

/**
 * Utility function to get accessibility props for headers
 */
export function getHeaderAccessibilityProps(level: 1 | 2 | 3 | 4 | 5 | 6, label: string) {
  return {
    accessibilityRole: AccessibilityRoles.HEADER,
    accessibilityLabel: `${label}. Heading level ${level}`,
    ...(Platform.OS === 'ios' && { accessibilityTraits: [AccessibilityTraits.HEADER] }),
  };
}

/**
 * Utility function to get accessibility props for images
 */
export function getImageAccessibilityProps(description: string, decorative: boolean = false) {
  if (decorative) {
    return {
      accessibilityIgnoresInvertColors: true,
      accessibilityElementsHidden: true,
    };
  }
  
  return {
    accessibilityRole: AccessibilityRoles.IMAGE,
    accessibilityLabel: description,
    accessibilityHint: 'Image',
    accessibilityIgnoresInvertColors: true,
  };
}

/**
 * Utility function to get accessibility props for switches
 */
export function getSwitchAccessibilityProps(label: string, checked: boolean) {
  return {
    accessibilityRole: AccessibilityRoles.SWITCH,
    accessibilityLabel: label,
    accessibilityState: { checked },
    accessibilityHint: `Toggle ${label.toLowerCase()}. Current state is ${checked ? 'on' : 'off'}`,
  };
}

/**
 * Utility function to get accessibility props for checkboxes
 */
export function getCheckboxAccessibilityProps(label: string, checked: boolean) {
  return {
    accessibilityRole: AccessibilityRoles.CHECKBOX,
    accessibilityLabel: label,
    accessibilityState: { checked },
    accessibilityHint: `Toggle ${label.toLowerCase()}. Current state is ${checked ? 'checked' : 'unchecked'}`,
  };
}

/**
 * Utility function to get accessibility props for progress bars
 */
export function getProgressbarAccessibilityProps(label: string, value: number, maxValue: number = 100) {
  return {
    accessibilityRole: AccessibilityRoles.PROGRESS_BAR,
    accessibilityLabel: label,
    accessibilityValue: { min: 0, max: maxValue, now: value },
    accessibilityHint: `${Math.round((value / maxValue) * 100)}% complete`,
  };
}

/**
 * Check if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch {
    return false;
  }
}

/**
 * Announce a message to the screen reader
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if reduced motion is enabled
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

/**
 * Check if bold text is enabled
 */
export async function isBoldTextEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isBoldTextEnabled();
  } catch {
    return false;
  }
}

/**
 * Check if grayscale is enabled
 */
export async function isGrayscaleEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isGrayscaleEnabled();
  } catch {
    return false;
  }
}

/**
 * Check if invert colors is enabled
 */
export async function isInvertColorsEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isInvertColorsEnabled();
  } catch {
    return false;
  }
}

/**
 * Check if prefer reduced transparency is enabled
 */
export async function isReduceTransparencyEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceTransparencyEnabled();
  } catch {
    return false;
  }
}

/**
 * Subscribe to screen reader state changes
 */
export function addScreenReaderEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('screenReaderChanged', callback);
}

/**
 * Subscribe to reduce motion state changes
 */
export function addReduceMotionEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('reduceMotionChanged', callback);
}

/**
 * Subscribe to bold text state changes
 */
export function addBoldTextEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('boldTextChanged', callback);
}

/**
 * Subscribe to grayscale state changes
 */
export function addGrayscaleEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('grayscaleChanged', callback);
}

/**
 * Subscribe to invert colors state changes
 */
export function addInvertColorsEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('invertColorsChanged', callback);
}

/**
 * Subscribe to reduce transparency state changes
 */
export function addReduceTransparencyEventListener(callback: (isEnabled: boolean) => void) {
  return AccessibilityInfo.addEventListener('reduceTransparencyChanged', callback);
}

/**
 * Accessibility utility class for common patterns
 */
export class AccessibilityUtils {
  /**
   * Wait for screen reader to finish announcing before proceeding
   */
  static async waitForScreenReader(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000); // Wait 1 second to allow screen reader to announce
    });
  }

  /**
   * Create accessible touchables with consistent patterns
   */
  static createAccessibleTouchableProps(
    label: string, 
    role: keyof typeof AccessibilityRoles = 'BUTTON', 
    hint?: string,
    state?: Record<string, any>
  ) {
    return {
      accessibilityRole: AccessibilityRoles[role],
      accessibilityLabel: label,
      accessibilityHint: hint || `Tap to ${label.toLowerCase()}`,
      accessibilityState: state,
    };
  }

  /**
   * Generate appropriate contrast color based on background
   */
  static getContrastColor(backgroundColor: string): string {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return contrasting color
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Validate accessibility compliance for a color combination
   */
  static checkColorContrast(foregroundColor: string, backgroundColor: string): { ratio: number; passesAA: boolean; passesAAA: boolean } {
    // Simplified contrast calculation
    // In a real implementation, you'd want a more robust algorithm
    
    // Convert hex to RGB
    const fgHex = foregroundColor.replace('#', '');
    const bgHex = backgroundColor.replace('#', '');
    
    const fgR = parseInt(fgHex.substring(0, 2), 16);
    const fgG = parseInt(fgHex.substring(2, 4), 16);
    const fgB = parseInt(fgHex.substring(4, 6), 16);
    
    const bgR = parseInt(bgHex.substring(0, 2), 16);
    const bgG = parseInt(bgHex.substring(2, 4), 16);
    const bgB = parseInt(bgHex.substring(4, 6), 16);
    
    // Calculate relative luminance
    const fgLum = (0.2126 * fgR + 0.7152 * fgG + 0.0722 * fgB) / 255;
    const bgLum = (0.2126 * bgR + 0.7152 * bgG + 0.0722 * bgB) / 255;
    
    // Calculate contrast ratio
    const ratio = fgLum > bgLum 
      ? (fgLum + 0.05) / (bgLum + 0.05) 
      : (bgLum + 0.05) / (fgLum + 0.05);
    
    // Check against WCAG standards
    const passesAA = ratio >= 4.5;
    const passesAAA = ratio >= 7.0;
    
    return { ratio: parseFloat(ratio.toFixed(2)), passesAA, passesAAA };
  }
}

/**
 * Hook-like utility for accessibility state
 */
export function useAccessibilityState() {
  return {
    isScreenReaderEnabled: () => isScreenReaderEnabled(),
    isReduceMotionEnabled: () => isReduceMotionEnabled(),
    isBoldTextEnabled: () => isBoldTextEnabled(),
    isGrayscaleEnabled: () => isGrayscaleEnabled(),
    isInvertColorsEnabled: () => isInvertColorsEnabled(),
    isReduceTransparencyEnabled: () => isReduceTransparencyEnabled(),
  };
}