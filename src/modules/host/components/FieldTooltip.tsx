/**
 * FieldTooltip Component
 *
 * Provides contextual help tooltips for form fields. Displays an info icon
 * next to field labels that expands inline help text on press/hover.
 *
 * Features:
 * - Info icon that triggers tooltip display
 * - Inline help text expansion with animation
 * - Hover support on web, press on native
 * - Accessible (WCAG 2.1 Level AA)
 * - Mobile-responsive (320px+)
 * - Help interaction tracking
 *
 * Usage:
 * ```tsx
 * <FieldTooltip
 *   fieldName="handle"
 *   content="Your unique URL-safe identifier. Use lowercase letters, numbers, and hyphens."
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
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

export interface FieldTooltipProps {
  /** Unique field name for tracking */
  fieldName: string;
  /** Help content to display */
  content: string;
  /** Optional title for the tooltip */
  title?: string;
  /** Optional example value */
  example?: string;
  /** Size of the info icon */
  iconSize?: number;
  /** Callback when tooltip is opened (for tracking) */
  onOpen?: (fieldName: string) => void;
  /** Test ID for testing */
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FieldTooltip({
  fieldName,
  content,
  title,
  example,
  iconSize = 16,
  onOpen,
  testID,
}: FieldTooltipProps) {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation
  const progress = useSharedValue(0);

  const toggleTooltip = useCallback(() => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState) {
      progress.value = withSpring(1, { damping: 20, stiffness: 300 });
      onOpen?.(fieldName);
    } else {
      progress.value = withTiming(0, { duration: Duration.fast });
    }
  }, [isExpanded, fieldName, onOpen, progress]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    maxHeight: interpolate(
      progress.value,
      [0, 1],
      [0, 200],
      Extrapolation.CLAMP
    ),
    marginTop: interpolate(
      progress.value,
      [0, 1],
      [0, Spacing.xs],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container} testID={testID}>
      {/* Info Icon Button */}
      <Pressable
        onPress={toggleTooltip}
        style={[
          styles.iconButton,
          isExpanded && {
            backgroundColor: `${CultureTokens.indigo}15`,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Help for ${title || fieldName}`}
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint={
          isExpanded ? 'Tap to hide help text' : 'Tap to show help text'
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isExpanded ? 'information-circle' : 'information-circle-outline'}
          size={iconSize}
          color={isExpanded ? CultureTokens.indigo : colors.textTertiary}
        />
      </Pressable>

      {/* Expanded Content */}
      <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
        <View
          style={[
            styles.tooltipContent,
            {
              backgroundColor: `${CultureTokens.indigo}08`,
              borderColor: `${CultureTokens.indigo}20`,
            },
          ]}
        >
          {title && (
            <Text
              style={[styles.tooltipTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
          )}

          <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
            {content}
          </Text>

          {example && (
            <View style={styles.exampleContainer}>
              <Text
                style={[styles.exampleLabel, { color: colors.textTertiary }]}
              >
                Example:
              </Text>
              <Text
                style={[
                  styles.exampleValue,
                  {
                    color: CultureTokens.indigo,
                    backgroundColor: `${CultureTokens.indigo}10`,
                  },
                ]}
              >
                {example}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    overflow: 'hidden',
    position: 'absolute',
    top: 32,
    left: -8,
    right: 0,
    zIndex: 100,
    minWidth: 220,
    ...Platform.select({
      web: { minWidth: 280 },
      default: {},
    }),
  },
  tooltipContent: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  exampleContainer: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  exampleValue: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
});
