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
import { Spacing } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
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
}: WizardNavigationProps) {
  const layout = useLayout();

  // ---------------------------------------------------------------------------
  // Desktop Layout: Cancel | Back | Next/Publish
  // ---------------------------------------------------------------------------

  if (layout.isDesktop) {
    return (
      <View style={styles.desktopContainer} accessibilityRole="toolbar" accessibilityLabel="Wizard navigation">
        {/* Left: Cancel */}
        <View style={styles.leftSection}>
          <Button
            variant="ghost"
            size="md"
            onPress={onCancel}
            disabled={isValidating || isPublishing}
            accessibilityLabel={navigationButtonLabel('cancel')}
          >
            Cancel
          </Button>
        </View>

        {/* Right: Back + Next/Publish */}
        <View style={styles.rightSection}>
          {!isFirstStep && (
            <Button
              variant="secondary"
              size="md"
              onPress={onBack}
              disabled={isValidating || isPublishing}
              leftIcon="arrow-back"
              accessibilityLabel={navigationButtonLabel('back')}
            >
              Back
            </Button>
          )}

          {isLastStep ? (
            <Button
              variant="primary"
              size="md"
              onPress={onPublish}
              loading={isPublishing}
              disabled={isValidating}
              rightIcon="checkmark-circle"
              accessibilityLabel={navigationButtonLabel('publish')}
            >
              Publish Profile
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onPress={onNext}
              loading={isValidating}
              rightIcon="arrow-forward"
              accessibilityLabel={navigationButtonLabel('next', { currentStep, totalSteps })}
            >
              Next
            </Button>
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
      {/* Primary Action: Next or Publish — lg size for 54pt height */}
      {isLastStep ? (
        <Button
          variant="primary"
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
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={onNext}
          loading={isValidating}
          rightIcon="arrow-forward"
          style={{ minHeight: MIN_TOUCH_TARGET }}
          accessibilityLabel={navigationButtonLabel('next', { currentStep, totalSteps })}
        >
          Next
        </Button>
      )}

      {/* Secondary Actions Row */}
      <View style={styles.mobileSecondaryRow}>
        {!isFirstStep && (
          <Button
            variant="secondary"
            size="md"
            onPress={onBack}
            disabled={isValidating || isPublishing}
            leftIcon="arrow-back"
            style={[styles.mobileSecondaryButton, { minHeight: MIN_TOUCH_TARGET }]}
            accessibilityLabel={navigationButtonLabel('back')}
          >
            Back
          </Button>
        )}

        <Button
          variant="ghost"
          size="md"
          onPress={onCancel}
          disabled={isValidating || isPublishing}
          style={[styles.mobileSecondaryButton, { minHeight: MIN_TOUCH_TARGET }]}
          accessibilityLabel={navigationButtonLabel('cancel')}
        >
          Cancel
        </Button>
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
    gap: Spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Mobile Styles
  mobileContainer: {
    gap: Spacing.sm,
  },
  mobileSecondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mobileSecondaryButton: {
    flex: 1,
  },
});
