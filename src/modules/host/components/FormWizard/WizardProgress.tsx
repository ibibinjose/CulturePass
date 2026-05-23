/**
 * WizardProgress Component
 * 
 * Displays the current step and allows navigation to completed steps.
 * Responsive design: horizontal indicators on desktop, compact stepper on mobile.
 * 
 * Features:
 * - Visual step indicators with checkmarks for completed steps
 * - Click to navigate to completed steps
 * - Responsive layout (horizontal on desktop, compact stepper on mobile)
 * - Tappable step dots on mobile for quick navigation
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <WizardProgress
 *   currentStep={3}
 *   totalSteps={6}
 *   completedSteps={new Set([1, 2])}
 *   stepLabels={['Step 1', 'Step 2', ...]}
 *   onStepClick={(step) => goToStep(step)}
 * />
 * ```
 */

import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/colors';
import { Spacing, Radius, TextStyles } from '@/design-system/tokens/theme';
import { MIN_TOUCH_TARGET } from '../../utils/responsive';
import { stepIndicatorLabel, createKeyboardHandler } from '../../utils/accessibility';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardProgressProps {
  /**
   * Current active step (1-indexed)
   */
  currentStep: number;
  /**
   * Total number of steps
   */
  totalSteps: number;
  /**
   * Set of completed step numbers
   */
  completedSteps: Set<number>;
  /**
   * Labels for each step
   */
  stepLabels: string[];
  /**
   * Callback when a step is clicked
   */
  onStepClick: (step: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WizardProgress = memo(function WizardProgress({
  currentStep,
  totalSteps,
  completedSteps,
  stepLabels,
  onStepClick,
}: WizardProgressProps) {
  const colors = useColors();
  const layout = useLayout();
  const [showStepList, setShowStepList] = useState(false);

  // ---------------------------------------------------------------------------
  // Render Step Indicator
  // ---------------------------------------------------------------------------

  const renderStepIndicator = (step: number) => {
    const isActive = step === currentStep;
    const isCompleted = completedSteps.has(step);
    const isClickable = isCompleted || step < currentStep;

    const handlePress = () => {
      if (isClickable) {
        if (Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onStepClick(step);
      }
    };

    return (
      <Pressable
        key={step}
        onPress={handlePress}
        disabled={!isClickable}
        style={({ pressed }) => [
          styles.stepIndicator,
          {
            opacity: pressed && isClickable ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={stepIndicatorLabel(step, stepLabels[step - 1], {
          isCurrent: isActive,
          isCompleted,
          isNavigable: isClickable,
        })}
        accessibilityState={{
          selected: isActive,
          disabled: !isClickable,
        }}
      >
        {/* Step Circle */}
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor: isActive
                ? CultureTokens.violet
                : isCompleted
                ? CultureTokens.teal
                : colors.border,
              borderColor: isActive
                ? CultureTokens.violet
                : isCompleted
                ? CultureTokens.teal
                : colors.border,
            },
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.stepNumber,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {step}
            </Text>
          )}
        </View>

        {/* Step Label (Desktop only) */}
        {layout.isDesktop && (
          <Text
            style={[
              styles.stepLabel,
              {
                color: isActive
                  ? colors.text
                  : isCompleted
                  ? colors.textSecondary
                  : colors.textTertiary,
                fontWeight: isActive ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {stepLabels[step - 1]}
          </Text>
        )}

        {/* Connector Line (not for last step) */}
        {step < totalSteps && layout.isDesktop && (
          <View
            style={[
              styles.connector,
              {
                backgroundColor: isCompleted
                  ? CultureTokens.teal
                  : colors.border,
              },
            ]}
          />
        )}
      </Pressable>
    );
  };

  // ---------------------------------------------------------------------------
  // Mobile: Compact Stepper with Tappable Dots (Requirement 22.8)
  // ---------------------------------------------------------------------------

  if (!layout.isDesktop) {
    const progress = (currentStep / totalSteps) * 100;

    return (
      <View style={styles.mobileContainer}>
        {/* Current Step Label — tappable to show step list */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowStepList(!showStepList);
          }}
          style={styles.mobileHeader}
          accessibilityRole="button"
          accessibilityLabel={`Step ${currentStep} of ${totalSteps}: ${stepLabels[currentStep - 1]}. Tap to see all steps.`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.mobileHeaderRow}>
            <Text style={[styles.mobileStepLabel, { color: colors.textSecondary }]}>
              Step {currentStep} of {totalSteps}
            </Text>
            <Ionicons
              name={showStepList ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.mobileStepTitle, { color: colors.text }]}>
            {stepLabels[currentStep - 1]}
          </Text>
        </Pressable>

        {/* Step Dots — compact navigation */}
        <View style={styles.mobileDotsRow}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
            const isActive = step === currentStep;
            const isCompleted = completedSteps.has(step);
            const isClickable = isCompleted || step < currentStep;

            return (
              <Pressable
                key={step}
                onPress={() => {
                  if (isClickable) {
                    if (Platform.OS !== 'web') {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    onStepClick(step);
                  }
                }}
                disabled={!isClickable}
                style={[
                  styles.mobileDot,
                  {
                    backgroundColor: isActive
                      ? CultureTokens.violet
                      : isCompleted
                      ? CultureTokens.teal
                      : colors.border,
                  },
                  isActive && styles.mobileDotActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Step ${step}: ${stepLabels[step - 1]}${isCompleted ? ' (completed)' : ''}${isActive ? ' (current)' : ''}`}
                accessibilityState={{ selected: isActive, disabled: !isClickable }}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              />
            );
          })}
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: CultureTokens.violet,
              },
            ]}
          />
        </View>

        {/* Expandable Step List (dropdown) */}
        {showStepList && (
          <View style={[styles.mobileStepList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const isActive = step === currentStep;
              const isCompleted = completedSteps.has(step);
              const isClickable = isCompleted || step < currentStep;

              return (
                <Pressable
                  key={step}
                  onPress={() => {
                    if (isClickable) {
                      if (Platform.OS !== 'web') {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      onStepClick(step);
                      setShowStepList(false);
                    }
                  }}
                  disabled={!isClickable && !isActive}
                  style={[
                    styles.mobileStepListItem,
                    { minHeight: MIN_TOUCH_TARGET },
                    isActive && { backgroundColor: CultureTokens.violet + '10' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to step ${step}: ${stepLabels[step - 1]}`}
                  accessibilityState={{ selected: isActive, disabled: !isClickable }}
                >
                  <View
                    style={[
                      styles.stepListDot,
                      {
                        backgroundColor: isActive
                          ? CultureTokens.violet
                          : isCompleted
                          ? CultureTokens.teal
                          : colors.border,
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepListLabel,
                      {
                        color: isActive
                          ? colors.text
                          : isClickable
                          ? colors.textSecondary
                          : colors.textTertiary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {stepLabels[step - 1]}
                  </Text>
                  {isActive && (
                    <View style={[styles.currentBadge, { backgroundColor: CultureTokens.violet }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop: Horizontal Step Indicators
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.desktopContainer}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) =>
        renderStepIndicator(step)
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Mobile Styles
  mobileContainer: {
    gap: Spacing.sm,
  },
  mobileHeader: {
    gap: 4,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mobileStepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileStepTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mobileDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  mobileDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  mobileDotActive: {
    width: 12,
    height: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  mobileStepList: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  mobileStepListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  stepListDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepListLabel: {
    fontSize: 14,
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  // Desktop Styles
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 120,
  },
  connector: {
    position: 'absolute',
    left: 32,
    width: 60,
    height: 2,
    top: 15,
  },
});
