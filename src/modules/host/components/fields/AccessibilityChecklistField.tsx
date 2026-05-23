/**
 * AccessibilityChecklistField Component
 *
 * Standardized accessibility features checklist for venue entity types.
 * Provides a checkbox list of accessibility features with score calculation.
 *
 * Features:
 * - Checkbox list for all accessibility features
 * - Calculate and display accessibility score (0-100%)
 * - Visual feedback for completion
 * - Descriptions for each feature
 * - Select All / Clear All quick actions
 *
 * Requirements: 10 (Location and Address Management - Acceptance Criteria 9, 10)
 *
 * Design System Usage:
 * - M3Card for container
 * - Checkbox component for selections
 * - CultureTokens.teal for positive indicators
 * - Radius.md for card corners
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { Checkbox } from '@/design-system/ui/Checkbox';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';
import type { AccessibilityFeatures } from '@shared/schema/hostProfile';

export interface AccessibilityChecklistFieldProps {
  /** Current accessibility features state */
  value: AccessibilityFeatures;
  /** Callback when features change */
  onChange: (value: AccessibilityFeatures) => void;
  /** Field label */
  label?: string;
  /** Whether to show the accessibility score */
  showScore?: boolean;
}

interface AccessibilityOption {
  key: keyof AccessibilityFeatures;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACCESSIBILITY_OPTIONS: AccessibilityOption[] = [
  {
    key: 'wheelchairAccess',
    label: 'Wheelchair Access',
    description: 'Ramps, elevators, or level entry available',
    icon: 'accessibility-outline',
  },
  {
    key: 'accessibleParking',
    label: 'Accessible Parking',
    description: 'Designated parking spaces for people with disabilities',
    icon: 'car-outline',
  },
  {
    key: 'accessibleToilets',
    label: 'Accessible Toilets',
    description: 'Wheelchair-accessible restroom facilities',
    icon: 'business-outline',
  },
  {
    key: 'hearingLoop',
    label: 'Hearing Loop',
    description: 'Assistive listening system for hearing aid users',
    icon: 'ear-outline',
  },
  {
    key: 'brailleSignage',
    label: 'Braille Signage',
    description: 'Tactile signage for visually impaired visitors',
    icon: 'hand-left-outline',
  },
  {
    key: 'serviceAnimalFriendly',
    label: 'Service Animal Friendly',
    description: 'Service animals welcome and accommodated',
    icon: 'paw-outline',
  },
];

export default function AccessibilityChecklistField({
  value,
  onChange,
  label = 'Accessibility Features',
  showScore = true,
}: AccessibilityChecklistFieldProps) {
  const colors = useColors();

  /**
   * Calculate accessibility score (0-100)
   */
  const accessibilityScore = useMemo(() => {
    const enabledCount = Object.values(value).filter(Boolean).length;
    const totalCount = ACCESSIBILITY_OPTIONS.length;
    return Math.round((enabledCount / totalCount) * 100);
  }, [value]);

  /**
   * Get score color based on value
   */
  const scoreColor = useMemo(() => {
    if (accessibilityScore >= 80) return CultureTokens.teal;
    if (accessibilityScore >= 50) return CultureTokens.gold;
    return CultureTokens.coral;
  }, [accessibilityScore]);

  /**
   * Handle checkbox toggle
   */
  const handleToggle = useCallback(
    (key: keyof AccessibilityFeatures) => {
      onChange({
        ...value,
        [key]: !value[key],
      });
    },
    [value, onChange]
  );

  /**
   * Select all features
   */
  const handleSelectAll = useCallback(() => {
    const allEnabled = ACCESSIBILITY_OPTIONS.reduce(
      (acc, option) => ({ ...acc, [option.key]: true }),
      {} as AccessibilityFeatures
    );
    onChange(allEnabled);
  }, [onChange]);

  /**
   * Clear all features
   */
  const handleClearAll = useCallback(() => {
    const allDisabled = ACCESSIBILITY_OPTIONS.reduce(
      (acc, option) => ({ ...acc, [option.key]: false }),
      {} as AccessibilityFeatures
    );
    onChange(allDisabled);
  }, [onChange]);

  const allSelected = useMemo(() => Object.values(value).every(Boolean), [value]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

        {showScore && (
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Ionicons name="star" size={14} color="#FFFFFF" />
            <Text style={styles.scoreText}>{accessibilityScore}%</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={({ pressed }) => [
            styles.quickActionButton,
            {
              backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
              borderColor: colors.borderLight,
            },
          ]}
          onPress={handleSelectAll}
          disabled={allSelected}
          accessibilityRole="button"
          accessibilityLabel="Select all accessibility features"
        >
          <Text
            style={[
              styles.quickActionText,
              { color: allSelected ? colors.textTertiary : CultureTokens.indigo },
            ]}
          >
            Select All
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.quickActionButton,
            {
              backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
              borderColor: colors.borderLight,
            },
          ]}
          onPress={handleClearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all accessibility features"
        >
          <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
            Clear All
          </Text>
        </Pressable>
      </View>

      {/* Checklist */}
      <M3Card
        style={[
          styles.checklistCard,
          { backgroundColor: colors.card, borderColor: colors.borderLight },
        ]}
      >
        {ACCESSIBILITY_OPTIONS.map((option, index) => (
          <View key={option.key}>
            <Pressable
              style={({ pressed }) => [
                styles.checklistItem,
                { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
              ]}
              onPress={() => handleToggle(option.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: value[option.key] }}
              accessibilityLabel={`${option.label}: ${option.description}`}
            >
              <View style={styles.checklistItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: value[option.key]
                        ? `${CultureTokens.teal}15`
                        : colors.surfaceElevated,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={value[option.key] ? CultureTokens.teal : colors.textSecondary}
                  />
                </View>

                <View style={styles.checklistItemText}>
                  <Text style={[styles.checklistItemLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[styles.checklistItemDescription, { color: colors.textSecondary }]}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>

              <Checkbox
                checked={value[option.key]}
                onToggle={() => handleToggle(option.key)}
              />
            </Pressable>

            {index < ACCESSIBILITY_OPTIONS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            )}
          </View>
        ))}
      </M3Card>

      {/* Score Explanation */}
      {showScore && (
        <View
          style={[
            styles.scoreExplanation,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="information-circle" size={16} color={CultureTokens.indigo} />
          <Text style={[styles.scoreExplanationText, { color: colors.textSecondary }]}>
            Accessibility score is calculated based on the percentage of features enabled.
            Higher scores improve visibility in accessibility-focused searches.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  scoreText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  checklistCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  checklistItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistItemText: {
    flex: 1,
    gap: 2,
  },
  checklistItemLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  checklistItemDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  scoreExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  scoreExplanationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
});
