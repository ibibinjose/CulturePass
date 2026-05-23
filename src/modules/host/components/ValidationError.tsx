/**
 * ValidationError Component
 *
 * Reusable component for displaying field-level validation errors and
 * success states. Supports animated show/hide transitions, error count
 * summaries for step-level validation, and accessibility best practices.
 *
 * Features:
 * - Red error text below fields with animated entrance
 * - Green checkmark icon for valid fields
 * - Animated show/hide transitions (Reanimated)
 * - Error count summary for step-level validation
 * - Accessible (role="alert" for errors)
 * - CulturePass design system compliance
 *
 * Usage:
 * ```tsx
 * // Single error
 * <ValidationError error="Handle is already taken" />
 *
 * // Multiple errors
 * <ValidationError errors={['Too short', 'Invalid characters']} />
 *
 * // Valid state with checkmark
 * <ValidationError isValid />
 *
 * // Step-level error summary
 * <ValidationError
 *   errors={['Name is required', 'Handle is required']}
 *   showSummary
 * />
 * ```
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/colors';
import { Spacing, Radius, Duration } from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationErrorProps {
  /** Single error message */
  error?: string | null;
  /** Multiple error messages */
  errors?: string[];
  /** Whether the field is valid (shows green checkmark) */
  isValid?: boolean;
  /** Whether to show an error count summary (for step-level validation) */
  showSummary?: boolean;
  /** Optional label for the summary (e.g. "Step 1") */
  summaryLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ValidationError({
  error,
  errors,
  isValid = false,
  showSummary = false,
  summaryLabel,
  testID,
}: ValidationErrorProps) {
  const colors = useColors();

  // Normalize errors into a single array
  const allErrors: string[] = [];
  if (error) allErrors.push(error);
  if (errors) allErrors.push(...errors);

  const hasErrors = allErrors.length > 0;
  const showValid = isValid && !hasErrors;

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  const progress = useSharedValue(0);

  useEffect(() => {
    if (hasErrors || showValid) {
      progress.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      progress.value = withTiming(0, { duration: Duration.fast });
    }
  }, [hasErrors, showValid, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [-4, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
    maxHeight: interpolate(
      progress.value,
      [0, 1],
      [0, 200],
      Extrapolation.CLAMP
    ),
  }));

  // ---------------------------------------------------------------------------
  // Don't render if nothing to show
  // ---------------------------------------------------------------------------

  if (!hasErrors && !showValid) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Valid State
  // ---------------------------------------------------------------------------

  if (showValid) {
    return (
      <Animated.View
        style={[styles.container, animatedStyle]}
        testID={testID}
        accessibilityLabel="Field is valid"
      >
        <View style={styles.validRow}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={CultureTokens.teal}
          />
          <Text
            style={[styles.validText, { color: CultureTokens.teal }]}
          >
            Valid
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID={testID}
      {...(Platform.OS === 'web'
        ? { role: 'alert', 'aria-live': 'polite' }
        : { accessibilityRole: 'alert', accessibilityLiveRegion: 'polite' })}
    >
      {/* Error Summary (step-level) */}
      {showSummary && allErrors.length > 1 && (
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: `${CultureTokens.coral}12` },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={CultureTokens.coral}
          />
          <Text style={[styles.summaryText, { color: CultureTokens.coral }]}>
            {summaryLabel
              ? `${summaryLabel}: ${allErrors.length} ${allErrors.length === 1 ? 'error' : 'errors'} to fix`
              : `${allErrors.length} ${allErrors.length === 1 ? 'error' : 'errors'} to fix`}
          </Text>
        </View>
      )}

      {/* Individual Error Messages */}
      {allErrors.map((msg, index) => (
        <View key={`${msg}-${index}`} style={styles.errorRow}>
          <Ionicons
            name="close-circle"
            size={14}
            color={CultureTokens.coral}
            style={styles.errorIcon}
          />
          <Text
            style={[styles.errorText, { color: CultureTokens.coral }]}
            numberOfLines={2}
          >
            {msg}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  errorIcon: {
    marginTop: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
    lineHeight: 18,
  },
});
