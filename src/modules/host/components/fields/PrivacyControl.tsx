/**
 * PrivacyControl Component
 *
 * Field-level privacy control for the HostSpace Enterprise-Grade Form System.
 * Allows users to set visibility for individual profile fields with three levels:
 * - Public: Visible to all users
 * - Members Only: Visible to community members
 * - Private: Visible only to profile owner and admins
 *
 * Features:
 * - Three privacy levels with clear visual indicators (icons + labels)
 * - Compact inline mode for attaching to individual fields
 * - Expanded mode for standalone privacy settings
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant with proper ARIA labels
 * - Touch targets minimum 44×44pt
 *
 * Requirements: 24 (Privacy and Data Protection)
 *
 * @example
 * ```tsx
 * <PrivacyControl
 *   value="public"
 *   onChange={(level) => setPrivacy(level)}
 *   fieldLabel="Email Address"
 * />
 * ```
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Privacy visibility levels for profile fields
 */
export type PrivacyLevel = 'public' | 'members-only' | 'private';

export interface PrivacyControlProps {
  /**
   * Current privacy level
   */
  value: PrivacyLevel;

  /**
   * Callback when privacy level changes
   */
  onChange: (level: PrivacyLevel) => void;

  /**
   * Label of the field this control is attached to (for accessibility)
   */
  fieldLabel?: string;

  /**
   * Display mode:
   * - 'inline': Compact single-line for attaching next to fields
   * - 'expanded': Full-width with descriptions for standalone use
   */
  mode?: 'inline' | 'expanded';

  /**
   * Whether the control is disabled
   */
  disabled?: boolean;

  /**
   * Optional label override (default: "Visibility")
   */
  label?: string;

  /**
   * Whether to show the label text
   */
  showLabel?: boolean;

  /**
   * Optional hint text displayed below the control
   */
  hint?: string;
}

// ---------------------------------------------------------------------------
// Privacy Level Configuration
// ---------------------------------------------------------------------------

interface PrivacyOption {
  level: PrivacyLevel;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    level: 'public',
    label: 'Public',
    description: 'Visible to everyone',
    icon: 'globe-outline',
    color: CultureTokens.teal,
  },
  {
    level: 'members-only',
    label: 'Members Only',
    description: 'Visible to community members',
    icon: 'people-outline',
    color: CultureTokens.indigo,
  },
  {
    level: 'private',
    label: 'Private',
    description: 'Only you and admins',
    icon: 'lock-closed-outline',
    color: CultureTokens.coral,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrivacyControl({
  value,
  onChange,
  fieldLabel,
  mode = 'inline',
  disabled = false,
  label = 'Visibility',
  showLabel = true,
  hint,
}: PrivacyControlProps) {
  const colors = useColors();

  const handleSelect = useCallback(
    (level: PrivacyLevel) => {
      if (disabled) return;
      onChange(level);

      // Announce change to screen readers
      if (Platform.OS !== 'web') {
        const option = PRIVACY_OPTIONS.find((opt) => opt.level === level);
        if (option) {
          AccessibilityInfo.announceForAccessibility(
            `Privacy set to ${option.label}. ${option.description}`
          );
        }
      }
    },
    [disabled, onChange]
  );

  if (mode === 'expanded') {
    return (
      <View style={styles.expandedContainer}>
        {showLabel && (
          <Text
            style={[styles.label, { color: colors.text }]}
            accessibilityRole="header"
          >
            {label}
          </Text>
        )}

        <View style={styles.optionsContainer}>
          {PRIVACY_OPTIONS.map((option) => {
            const isSelected = option.level === value;
            return (
              <Pressable
                key={option.level}
                onPress={() => handleSelect(option.level)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.expandedOption,
                  {
                    backgroundColor: isSelected
                      ? `${option.color}15`
                      : colors.card,
                    borderColor: isSelected ? option.color : colors.borderLight,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  pressed && !disabled && styles.pressed,
                  disabled && styles.disabled,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled }}
                accessibilityLabel={`${option.label}: ${option.description}${fieldLabel ? ` for ${fieldLabel}` : ''}`}
                accessibilityHint={`Set visibility to ${option.label}`}
              >
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: `${option.color}20` },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? option.color : colors.textSecondary}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected ? option.color : colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>

                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={option.color}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {hint && (
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {hint}
          </Text>
        )}
      </View>
    );
  }

  // Inline mode — compact toggle
  return (
    <View style={styles.inlineContainer}>
      {showLabel && (
        <Text style={[styles.inlineLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={styles.inlineOptionsRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={`${label}${fieldLabel ? ` for ${fieldLabel}` : ''}`}
      >
        {PRIVACY_OPTIONS.map((option) => {
          const isSelected = option.level === value;
          return (
            <Pressable
              key={option.level}
              onPress={() => handleSelect(option.level)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.inlineOption,
                {
                  backgroundColor: isSelected
                    ? `${option.color}18`
                    : 'transparent',
                  borderColor: isSelected ? option.color : colors.borderLight,
                  borderWidth: isSelected ? 1.5 : 1,
                },
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`${option.label}: ${option.description}`}
              accessibilityHint={`Set visibility to ${option.label}`}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={isSelected ? option.color : colors.textTertiary}
              />
              <Text
                style={[
                  styles.inlineOptionLabel,
                  {
                    color: isSelected ? option.color : colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {hint && (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Privacy Indicator (companion badge for displaying current privacy on fields)
// ---------------------------------------------------------------------------

export interface PrivacyIndicatorProps {
  /**
   * Current privacy level to display
   */
  level: PrivacyLevel;

  /**
   * Size of the indicator
   */
  size?: 'sm' | 'md';
}

/**
 * Compact privacy indicator badge showing the current privacy level.
 * Use alongside form fields to show their visibility status.
 */
export function PrivacyIndicator({ level, size = 'sm' }: PrivacyIndicatorProps) {
  const colors = useColors();
  const option = PRIVACY_OPTIONS.find((opt) => opt.level === level) ?? PRIVACY_OPTIONS[0];
  const iconSize = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View
      style={[
        styles.indicator,
        size === 'md' && styles.indicatorMd,
        { backgroundColor: `${option.color}15`, borderColor: `${option.color}40` },
      ]}
      accessibilityLabel={`Visibility: ${option.label}`}
      accessibilityRole="text"
    >
      <Ionicons name={option.icon} size={iconSize} color={option.color} />
      <Text style={[styles.indicatorText, { color: option.color, fontSize }]}>
        {option.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Expanded mode
  expandedContainer: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  optionsContainer: {
    gap: 8,
  },
  expandedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    gap: 12,
    minHeight: 56,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  checkIcon: {
    marginLeft: 4,
  },

  // Inline mode
  inlineContainer: {
    gap: 6,
  },
  inlineLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  inlineOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  inlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    gap: 5,
    minHeight: 44, // Touch target (44×44pt)
    minWidth: 44, // Touch target
  },
  inlineOptionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  // Shared
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  hint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginLeft: 4,
    marginTop: 2,
  },

  // Indicator badge
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 3,
  },
  indicatorMd: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  indicatorText: {
    fontFamily: FontFamily.semibold,
  },
});

export default PrivacyControl;
