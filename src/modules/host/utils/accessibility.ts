/**
 * Accessibility Utilities for HostSpace Form System
 *
 * Shared helpers for WCAG 2.1 Level AA compliance across wizard and field components.
 * Provides consistent accessibility labels, focus management, screen reader
 * announcements, and keyboard navigation support.
 *
 * Requirements: 22 (WCAG 2.1 Level AA Compliance)
 */

import { AccessibilityInfo, Platform, findNodeHandle } from 'react-native';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum contrast ratio for normal text (WCAG 2.1 Level AA).
 * CultureTokens already meets this via the design system.
 */
export const MIN_CONTRAST_RATIO_NORMAL = 4.5;

/**
 * Minimum contrast ratio for large text (WCAG 2.1 Level AA).
 */
export const MIN_CONTRAST_RATIO_LARGE = 3;

/**
 * Delay before announcing step changes to screen readers (ms).
 * Allows the UI to settle before announcing.
 */
export const ANNOUNCEMENT_DELAY = 150;

/**
 * Delay before moving focus after step transition (ms).
 * Allows animations to complete before focus shift.
 */
export const FOCUS_DELAY = 300;

// ---------------------------------------------------------------------------
// Accessibility Label Generators
// ---------------------------------------------------------------------------

/**
 * Generates a consistent accessibility label for form fields.
 * Includes required indicator and error state for screen readers.
 */
export function fieldAccessibilityLabel(
  label: string,
  options?: {
    required?: boolean;
    error?: string | null;
    characterCount?: { current: number; max: number };
  }
): string {
  const parts: string[] = [label];

  if (options?.required) {
    parts.push('required');
  }

  if (options?.error) {
    parts.push(`Error: ${options.error}`);
  }

  if (options?.characterCount) {
    const { current, max } = options.characterCount;
    parts.push(`${current} of ${max} characters used`);
  }

  return parts.join(', ');
}

/**
 * Generates accessibility label for wizard step indicators.
 */
export function stepIndicatorLabel(
  stepNumber: number,
  stepTitle: string,
  state: {
    isCurrent: boolean;
    isCompleted: boolean;
    isNavigable: boolean;
  }
): string {
  const parts: string[] = [`Step ${stepNumber}: ${stepTitle}`];

  if (state.isCurrent) {
    parts.push('current step');
  } else if (state.isCompleted) {
    parts.push('completed');
  } else {
    parts.push('not yet reached');
  }

  if (state.isNavigable && !state.isCurrent) {
    parts.push('tap to navigate');
  }

  return parts.join(', ');
}

/**
 * Generates accessibility label for navigation buttons.
 */
export function navigationButtonLabel(
  action: 'next' | 'back' | 'cancel' | 'publish',
  context?: {
    currentStep?: number;
    totalSteps?: number;
    nextStepTitle?: string;
  }
): string {
  switch (action) {
    case 'next':
      if (context?.nextStepTitle) {
        return `Next: go to ${context.nextStepTitle}`;
      }
      return `Next step, ${context?.currentStep ?? ''} of ${context?.totalSteps ?? ''}`;
    case 'back':
      return 'Go back to previous step';
    case 'cancel':
      return 'Cancel and exit wizard';
    case 'publish':
      return 'Publish profile';
    default:
      return action;
  }
}

/**
 * Generates accessibility label for validation status indicators.
 */
export function validationStatusLabel(
  fieldName: string,
  status: 'valid' | 'invalid' | 'checking' | 'idle'
): string {
  switch (status) {
    case 'valid':
      return `${fieldName} is valid`;
    case 'invalid':
      return `${fieldName} has an error`;
    case 'checking':
      return `Checking ${fieldName}`;
    case 'idle':
      return fieldName;
  }
}

/**
 * Generates accessibility label for media upload fields.
 */
export function mediaUploadLabel(
  type: 'logo' | 'hero' | 'gallery' | 'video',
  state: { hasFile: boolean; fileName?: string; progress?: number }
): string {
  const typeLabels: Record<string, string> = {
    logo: 'Logo image',
    hero: 'Hero cover image',
    gallery: 'Gallery image',
    video: 'Video',
  };

  const label = typeLabels[type] || 'File';

  if (state.progress !== undefined && state.progress < 100) {
    return `${label} upload, ${state.progress}% complete`;
  }

  if (state.hasFile && state.fileName) {
    return `${label}: ${state.fileName} uploaded. Double tap to replace.`;
  }

  if (state.hasFile) {
    return `${label} uploaded. Double tap to replace.`;
  }

  return `Upload ${label.toLowerCase()}. Double tap to select file.`;
}

// ---------------------------------------------------------------------------
// Screen Reader Announcements
// ---------------------------------------------------------------------------

/**
 * Announces a message to screen readers.
 * Uses AccessibilityInfo.announceForAccessibility on native,
 * and aria-live regions on web.
 */
export function announceForScreenReader(message: string): void {
  if (Platform.OS === 'web') {
    announceForWeb(message);
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

/**
 * Announces a wizard step change to screen readers.
 */
export function announceStepChange(
  stepNumber: number,
  stepTitle: string,
  totalSteps: number
): void {
  const message = `Step ${stepNumber} of ${totalSteps}: ${stepTitle}`;
  setTimeout(() => {
    announceForScreenReader(message);
  }, ANNOUNCEMENT_DELAY);
}

/**
 * Announces a validation error to screen readers.
 */
export function announceValidationError(
  fieldName: string,
  error: string
): void {
  announceForScreenReader(`${fieldName}: ${error}`);
}

/**
 * Announces auto-save status to screen readers.
 */
export function announceAutoSaveStatus(
  status: 'saving' | 'saved' | 'error'
): void {
  const messages: Record<string, string> = {
    saving: 'Saving your progress',
    saved: 'Progress saved',
    error: 'Error saving progress. Will retry automatically.',
  };
  announceForScreenReader(messages[status]);
}

/**
 * Web-specific announcement using a live region.
 * Creates a visually hidden element with aria-live="polite".
 */
function announceForWeb(message: string): void {
  if (Platform.OS !== 'web') return;

  // Find or create the announcer element
  let announcer = document.getElementById('wizard-a11y-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'wizard-a11y-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    // Visually hidden but accessible to screen readers
    Object.assign(announcer.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(announcer);
  }

  // Clear and set new message (forces re-announcement)
  announcer.textContent = '';
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 50);
}

// ---------------------------------------------------------------------------
// Focus Management
// ---------------------------------------------------------------------------

/**
 * Moves focus to a specific React Native component ref.
 * Used for step transitions to focus the first input.
 */
export function focusElement(ref: RefObject<any>): void {
  if (!ref.current) return;

  setTimeout(() => {
    if (Platform.OS === 'web') {
      // On web, use native focus() directly if available
      if (typeof ref.current.focus === 'function') {
        ref.current.focus();
      }
    } else {
      // On native, use AccessibilityInfo to set focus
      const node = findNodeHandle(ref.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }, FOCUS_DELAY);
}

/**
 * Moves accessibility focus to the first focusable element within a container.
 * Useful after step transitions.
 */
export function focusFirstInput(containerRef: RefObject<any>): void {
  if (Platform.OS === 'web') {
    setTimeout(() => {
      if (!containerRef.current) return;
      // On web, find the first focusable input within the container
      const container = containerRef.current;
      const target = (container && typeof container.querySelector === 'function')
        ? (container as HTMLElement)
        : document.body;
      const focusable = target.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      if (focusable) {
        focusable.focus();
      }
    }, FOCUS_DELAY);
  } else {
    // On native, set accessibility focus to the container
    focusElement(containerRef);
  }
}

// ---------------------------------------------------------------------------
// Keyboard Navigation Helpers
// ---------------------------------------------------------------------------

/**
 * Key codes for keyboard navigation.
 */
export const KeyCodes = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
} as const;

/**
 * Handles Enter/Space key activation for custom interactive elements.
 * Returns true if the key event should trigger activation.
 */
export function isActivationKey(key: string): boolean {
  return key === KeyCodes.ENTER || key === KeyCodes.SPACE;
}

/**
 * Handles Escape key for cancel/dismiss actions.
 */
export function isEscapeKey(key: string): boolean {
  return key === KeyCodes.ESCAPE;
}

/**
 * Handles arrow key navigation (for step indicators, galleries, etc.).
 */
export function isNavigationKey(key: string): 'next' | 'prev' | null {
  if (key === KeyCodes.ARROW_RIGHT || key === KeyCodes.ARROW_DOWN) {
    return 'next';
  }
  if (key === KeyCodes.ARROW_LEFT || key === KeyCodes.ARROW_UP) {
    return 'prev';
  }
  return null;
}

/**
 * Creates a keyboard event handler for web that supports
 * Enter/Space activation and Escape dismissal.
 */
export function createKeyboardHandler(handlers: {
  onActivate?: () => void;
  onEscape?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}): ((event: any) => void) | undefined {
  if (Platform.OS !== 'web') return undefined;

  return (event: any) => {
    const key = event.key || event.nativeEvent?.key;
    if (!key) return;

    if (isActivationKey(key) && handlers.onActivate) {
      event.preventDefault?.();
      handlers.onActivate();
    } else if (isEscapeKey(key) && handlers.onEscape) {
      event.preventDefault?.();
      handlers.onEscape();
    } else {
      const direction = isNavigationKey(key);
      if (direction === 'next' && handlers.onNext) {
        event.preventDefault?.();
        handlers.onNext();
      } else if (direction === 'prev' && handlers.onPrev) {
        event.preventDefault?.();
        handlers.onPrev();
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Accessibility Props Helpers
// ---------------------------------------------------------------------------

/**
 * Returns platform-appropriate accessibility props for error states.
 * Uses accessibilityLiveRegion on native, aria-live on web.
 */
export function liveRegionProps(priority: 'polite' | 'assertive' = 'polite') {
  if (Platform.OS === 'web') {
    return {
      'aria-live': priority,
      'aria-atomic': true,
      role: 'alert' as const,
    };
  }
  return {
    accessibilityLiveRegion: priority as 'polite' | 'assertive',
    accessibilityRole: 'alert' as const,
  };
}

/**
 * Returns platform-appropriate accessibility props for form fields.
 */
export function formFieldProps(options: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}) {
  const baseProps: Record<string, any> = {
    accessibilityLabel: fieldAccessibilityLabel(options.label, {
      required: options.required,
      error: options.error,
    }),
    accessibilityRole: 'none' as const, // TextInput has implicit role
  };

  if (options.hint) {
    baseProps.accessibilityHint = options.hint;
  }

  if (options.error) {
    baseProps.accessibilityState = {
      ...(baseProps.accessibilityState || {}),
      invalid: true,
    };
  }

  if (options.disabled) {
    baseProps.accessibilityState = {
      ...(baseProps.accessibilityState || {}),
      disabled: true,
    };
  }

  // Web-specific ARIA attributes
  if (Platform.OS === 'web') {
    if (options.required) {
      baseProps['aria-required'] = true;
    }
    if (options.error) {
      baseProps['aria-invalid'] = true;
    }
    if (options.disabled) {
      baseProps['aria-disabled'] = true;
    }
  }

  return baseProps;
}

/**
 * Returns accessibility props for interactive buttons/pressables.
 */
export function buttonAccessibilityProps(options: {
  label: string;
  hint?: string;
  disabled?: boolean;
  expanded?: boolean;
  pressed?: boolean;
}) {
  const props: Record<string, any> = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: options.label,
    accessibilityState: {
      disabled: options.disabled ?? false,
    },
  };

  if (options.hint) {
    props.accessibilityHint = options.hint;
  }

  if (options.expanded !== undefined) {
    props.accessibilityState.expanded = options.expanded;
  }

  if (options.pressed !== undefined) {
    props.accessibilityState.selected = options.pressed;
  }

  // Web-specific
  if (Platform.OS === 'web') {
    if (options.expanded !== undefined) {
      props['aria-expanded'] = options.expanded;
    }
    if (options.disabled) {
      props['aria-disabled'] = true;
    }
  }

  return props;
}

/**
 * Returns accessibility props for progress indicators.
 */
export function progressAccessibilityProps(options: {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}) {
  return {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: `Progress: Step ${options.currentStep} of ${options.totalSteps}, ${options.stepLabel}`,
    accessibilityValue: {
      min: 1,
      max: options.totalSteps,
      now: options.currentStep,
      text: `Step ${options.currentStep} of ${options.totalSteps}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Screen Reader Detection
// ---------------------------------------------------------------------------

/**
 * Checks if a screen reader is currently active.
 * Useful for conditionally showing/hiding visual-only elements.
 */
export async function isScreenReaderActive(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // No reliable way to detect screen readers on web
    return false;
  }
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * Subscribes to screen reader state changes.
 * Returns an unsubscribe function.
 */
export function onScreenReaderChange(
  callback: (isActive: boolean) => void
): () => void {
  const subscription = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    callback
  );
  return () => subscription.remove();
}
