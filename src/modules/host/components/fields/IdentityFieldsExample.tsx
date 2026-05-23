/**
 * Identity Fields Usage Example
 * 
 * Demonstrates how to use HandleField, NameField, and DateField
 * in a form context.
 * 
 * This example shows:
 * - Basic usage of each field
 * - Form state management
 * - Validation handling
 * - Auto-suggestion for handle based on name
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { HandleField, NameField, DateField } from './index';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Spacing, Radius } from '@/design-system/tokens/theme';

/**
 * Generate a URL-safe handle from a name
 */
function generateHandleFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 30); // Limit to 30 characters
}

export function IdentityFieldsExample() {
  const colors = useColors();
  
  // Form state
  const [officialName, setOfficialName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [handle, setHandle] = useState('');
  const [foundingDate, setFoundingDate] = useState('');
  
  // Validation state
  const [isHandleValid, setIsHandleValid] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);
  const [isDateValid, setIsDateValid] = useState(false);

  /**
   * Auto-generate handle suggestion when official name changes
   */
  const suggestedHandle = officialName && !handle
    ? generateHandleFromName(officialName)
    : undefined;

  /**
   * Check if form is valid
   */
  const isFormValid = isHandleValid && isNameValid && isDateValid;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Identity Fields Example
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Basic identity information for host profiles
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Official Name
        </Text>
        <NameField
          value={officialName}
          onChange={setOfficialName}
          label="Official Name"
          hint="Legal name of your organization"
          placeholder="Enter official name"
          required
          onValidationComplete={setIsNameValid}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Trading Name (Optional)
        </Text>
        <NameField
          value={tradingName}
          onChange={setTradingName}
          label="Trading Name"
          hint="Different name you operate under (optional)"
          placeholder="Enter trading name"
          required={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Handle
        </Text>
        <HandleField
          value={handle}
          onChange={setHandle}
          suggestedHandle={suggestedHandle}
          required
          onValidationComplete={setIsHandleValid}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Founding Date
        </Text>
        <DateField
          value={foundingDate}
          onChange={setFoundingDate}
          label="Founding Date"
          hint="When was your organization founded?"
          required
          onValidationComplete={setIsDateValid}
        />
      </View>

      {/* Form Status */}
      <View style={[styles.status, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>
          Form Status
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Official Name:
          </Text>
          <Text style={[styles.statusValue, { color: isNameValid ? colors.success : colors.textTertiary }]}>
            {isNameValid ? '✓ Valid' : '○ Pending'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Handle:
          </Text>
          <Text style={[styles.statusValue, { color: isHandleValid ? colors.success : colors.textTertiary }]}>
            {isHandleValid ? '✓ Valid' : '○ Pending'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Founding Date:
          </Text>
          <Text style={[styles.statusValue, { color: isDateValid ? colors.success : colors.textTertiary }]}>
            {isDateValid ? '✓ Valid' : '○ Pending'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Form Valid:
          </Text>
          <Text style={[styles.statusValue, { color: isFormValid ? colors.success : colors.textTertiary }]}>
            {isFormValid ? '✓ Ready to Submit' : '○ Incomplete'}
          </Text>
        </View>
      </View>

      {/* Form Data Preview */}
      <View style={[styles.preview, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>
          Form Data Preview
        </Text>
        <Text style={[styles.previewCode, { color: colors.textSecondary }]}>
          {JSON.stringify(
            {
              officialName,
              tradingName: tradingName || undefined,
              handle,
              foundingDate,
            },
            null,
            2
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  status: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  statusValue: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  preview: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: Spacing.xs,
  },
  previewCode: {
    fontSize: 11,
    fontFamily: 'Courier',
  },
});

export default IdentityFieldsExample;
