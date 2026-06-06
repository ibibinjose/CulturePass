/**
 * WizardNavigation Component
 * 
 * Provides navigation controls for the wizard (Back, Next, Cancel, Publish).
 * Adapts button layout based on current step and screen size.
 * 
 * Features:
 * - Back/Next navigation with validation
 * - Cancel button with unsaved changes warning
 * - Publish button on final step
 * - Loading states
 * - Responsive layout
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <WizardNavigation
 *   currentStep={3}
 *   totalSteps={6}
 *   isFirstStep={false}
 *   isLastStep={false}
 *   onBack={() => {}}
 *   onNext={() => {}}
 *   onCancel={() => {}}
 *   onPublish={() => {}}
 * />
 * ```
 */

import React, { memo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';

import { useLayout } from '@/hooks/useLayout';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { LuxeButton } from '@/design-system/ui';
import { MIN_TOUCH_TARGET } from '../../utils/responsive';
import { navigationButtonLabel } from '../../utils/accessibility';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardNavigationProps {
  /**
   * Current step number
   */
  currentStep: number;
  /**
   * Total number of steps
   */
  totalSteps: number;
  /**
   * Whether this is the first step
   */
  isFirstStep: boolean;
  /**
   * Whether this is the last step
   */
  isLastStep: boolean;
  /**
   * Whether validation is in progress
   */
  isValidating?: boolean;
  /**
   * Whether publish is in progress
   */
  isPublishing?: boolean;
  /**
   * Back button handler
   */
  onBack: () => void;
  /**
   * Next button handler
   */
  onNext: () => void;
  /**
   * Cancel button handler
   */
  onCancel: () => void;
  /**
   * Publish button handler (final step)
   */
  onPublish: () => void;
  /**
   * Skip button handler
   */
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WizardNavigation = memo(function WizardNavigation({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  isValidating = false,
  isPublishing = false,
  onBack,
  onNext,
  onCancel,
  onPublish,
  onSkip,
}: WizardNavigationProps) {
  const layout = useLayout();

  // ---------------------------------------------------------------------------
  // Desktop Layout: Cancel | Back | Next/Publish
  // ---------------------------------------------------------------------------

  if (layout.isDesktop) {
    return (
      <View style={styles.desktopContainer} accessibilityRole="toolbar" accessibilityLabel="Wizard navigation">
        <View style={styles.leftSection}>
          <LuxeButton
            variant="outlined"
            size="md"
            onPress={onCancel}
            disabled={isValidating || isPublishing}
            accessibilityLabel={navigationButtonLabel('cancel')}
          >
            Cancel
          </LuxeButton>
        </View>
        <View style={styles.rightSection}>
          {!isFirstStep && (
            <LuxeButton
              variant="tonal"
              size="md"
              onPress={onBack}
              disabled={isValidating || isPublishing}
              leftIcon="arrow-back"
              accessibilityLabel={navigationButtonLabel('back')}
            >
              Back
            </LuxeButton>
          )}
          {!isLastStep && onSkip && (
            <LuxeButton
              variant="outlined"
              size="md"
              onPress={onSkip}
              disabled={isValidating || isPublishing}
              accessibilityLabel="Skip this step"
            >
              Skip
            </LuxeButton>
          )}
          {isLastStep ? (
            <LuxeButton
              variant="filled"
              size="md"
              onPress={onPublish}
              loading={isPublishing}
              disabled={isValidating}
              rightIcon="checkmark-circle"
              accessibilityLabel={navigationButtonLabel('publish')}
            >
              Publish Profile
            </LuxeButton>
          ) : (
            <LuxeButton
              variant="filled"
              size="md"
              onPress={onNext}
              loading={isValidating}
              rightIcon="arrow-forward"
              accessibilityLabel={navigationButtonLabel('next', { currentStep, totalSteps })}
            >
              Next
            </LuxeButton>
          )}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Mobile Layout: Stacked buttons with 44pt+ touch targets (Requirement 22.7)
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.mobileContainer} accessibilityRole="toolbar" accessibilityLabel="Wizard navigation">
      {isLastStep ? (
        <LuxeButton
          variant="filled"
          size="lg"
          fullWidth
          onPress={onPublish}
          loading={isPublishing}
          disabled={isValidating}
          rightIcon="checkmark-circle"
          style={{ minHeight: MIN_TOUCH_TARGET }}
          accessibilityLabel={navigationButtonLabel('publish')}
        >
          Publish Profile
        </LuxeButton>
      ) : (
        <View style={{ flexDirection: 'row', gap: Luxe.spacing.sm }}>
          {onSkip && (
            <LuxeButton
              variant="outlined"
              size="lg"
              onPress={onSkip}
              disabled={isValidating || isPublishing}
              style={{ flex: 1, minHeight: MIN_TOUCH_TARGET }}
              accessibilityLabel="Skip this step"
            >
              Skip
            </LuxeButton>
          )}
          <LuxeButton
            variant="filled"
            size="lg"
            onPress={onNext}
            loading={isValidating}
            rightIcon="arrow-forward"
            style={{ flex: 2, minHeight: MIN_TOUCH_TARGET }}
            accessibilityLabel={navigationButtonLabel('next', { currentStep, totalSteps })}
          >
            Next
          </LuxeButton>
        </View>
      )}
      <View style={styles.mobileSecondaryRow}>
        {!isFirstStep && (
          <LuxeButton
            variant="tonal"
            size="md"
            onPress={onBack}
            disabled={isValidating || isPublishing}
            leftIcon="arrow-back"
            style={[styles.mobileSecondaryButton, { minHeight: MIN_TOUCH_TARGET }]}
            accessibilityLabel={navigationButtonLabel('back')}
          >
            Back
          </LuxeButton>
        )}
        <LuxeButton
          variant="outlined"
          size="md"
          onPress={onCancel}
          disabled={isValidating || isPublishing}
          style={[styles.mobileSecondaryButton, { minHeight: MIN_TOUCH_TARGET }]}
          accessibilityLabel={navigationButtonLabel('cancel')}
        >
          Cancel
        </LuxeButton>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Desktop Styles
  desktopContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    gap: Luxe.spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    gap: Luxe.spacing.sm,
  },

  // Mobile Styles
  mobileContainer: {
    gap: Luxe.spacing.sm,
  },
  mobileSecondaryRow: {
    flexDirection: 'row',
    gap: Luxe.spacing.sm,
  },
  mobileSecondaryButton: {
    flex: 1,
  },
});
