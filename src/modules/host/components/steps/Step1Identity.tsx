/**
 * Step1Identity Component
 * 
 * First step of the HostSpace Enterprise-Grade Form System wizard.
 * Collects basic identity information for all entity types:
 * - Official Name (required, 2-120 characters)
 * - Handle (required, unique, URL-safe)
 * - Founding Date (required, no future dates)
 * - Trading Name (optional, 2-120 characters)
 * 
 * Features:
 * - Real-time validation with immediate feedback
 * - Auto-suggested handle based on official name
 * - Character count displays
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * - Integrates with WizardContainer state management
 * 
 * Requirements: 6 (Common Identity Fields)
 * 
 * @example
 * ```tsx
 * <Step1Identity
 *   entityType="community"
 *   formData={formData}
 *   updateFormData={updateFormData}
 *   getFieldError={getFieldError}
 *   isValidating={false}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { HandleField } from '../fields/HandleField';
import { NameField } from '../fields/NameField';
import { DateField } from '../fields/DateField';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
  TextStyles,
} from '@/design-system/tokens/theme';
import type { EntityType } from '../../hooks/useFormWizard';
import type { PartialFormData } from '../../services/formStateSerializer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Step1IdentityProps {
  /**
   * Entity type
   */
  entityType: EntityType;
  /**
   * Form data
   */
  formData: PartialFormData;
  /**
   * Update form data callback
   */
  updateFormData: (data: Partial<PartialFormData>) => void;
  /**
   * Validation errors
   */
  validationErrors?: Record<string, string[]>;
  /**
   * Get field error helper
   */
  getFieldError: (field: string) => string | undefined;
  /**
   * Whether validation is in progress
   */
  isValidating?: boolean;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Generate a suggested handle from official name
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Limit to 30 characters
 */
function generateSuggestedHandle(officialName: string): string {
  if (!officialName) return '';

  return officialName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 30); // Limit to 30 characters
}

/**
 * Get entity type display name
 */
function getEntityTypeDisplayName(entityType: EntityType): string {
  const displayNames: Record<EntityType, string> = {
    community: 'Community',
    organiser: 'Event Organiser',
    venue: 'Venue',
    business: 'Business',
    artist: 'Artist',
    professional: 'Professional',
  };
  return displayNames[entityType] || entityType;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step1Identity({
  entityType,
  formData,
  updateFormData,
  validationErrors,
  getFieldError,
  isValidating = false,
}: Step1IdentityProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  // Local state for suggested handle
  const [suggestedHandle, setSuggestedHandle] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Field Values
  // ---------------------------------------------------------------------------

  const officialName = formData.officialName || '';
  const handle = formData.handle || '';
  const foundingDate = formData.foundingDate || '';
  const tradingName = formData.tradingName || '';

  // ---------------------------------------------------------------------------
  // Handle Changes
  // ---------------------------------------------------------------------------

  const handleOfficialNameChange = (value: string) => {
    updateFormData({ officialName: value });

    // Generate suggested handle if handle is empty
    if (!handle) {
      const suggested = generateSuggestedHandle(value);
      setSuggestedHandle(suggested);
    }
  };

  const handleHandleChange = (value: string) => {
    updateFormData({ handle: value });
  };

  const handleFoundingDateChange = (value: string) => {
    updateFormData({ foundingDate: value });
  };

  const handleTradingNameChange = (value: string) => {
    updateFormData({ tradingName: value });
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Clear suggested handle when handle is manually entered
   */
  useEffect(() => {
    if (handle) {
      setSuggestedHandle('');
    }
  }, [handle]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons
            name="person-outline"
            size={28}
            color={CultureTokens.indigo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Basic Identity
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Let&apos;s start with the essential information about your{' '}
          {getEntityTypeDisplayName(entityType).toLowerCase()}. This will help
          people find and recognize you on CulturePass.
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Official Name */}
        <View style={styles.fieldGroup}>
          <NameField
            value={officialName}
            onChange={handleOfficialNameChange}
            label="Official Name"
            placeholder="Enter your official name"
            hint="The legal or registered name of your entity"
            required
            error={getFieldError('officialName')}
          />
        </View>

        {/* Handle */}
        <View style={styles.fieldGroup}>
          <HandleField
            value={handle}
            onChange={handleHandleChange}
            suggestedHandle={suggestedHandle}
            error={getFieldError('handle')}
          />
          
          {/* Handle Preview */}
          {handle && (
            <View style={[styles.previewBanner, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons
                name="link-outline"
                size={16}
                color={CultureTokens.indigo}
                style={styles.previewIcon}
              />
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                Your profile URL:
              </Text>
              <Text style={[styles.previewUrl, { color: CultureTokens.indigo }]}>
                culturepass.com/@{handle}
              </Text>
            </View>
          )}
        </View>

        {/* Founding Date */}
        <View style={styles.fieldGroup}>
          <DateField
            value={foundingDate}
            onChange={handleFoundingDateChange}
            label="Founding Date"
            hint="When was your entity established?"
            required
            error={getFieldError('foundingDate')}
          />
        </View>

        {/* Trading Name (Optional) */}
        <View style={styles.fieldGroup}>
          <NameField
            value={tradingName}
            onChange={handleTradingNameChange}
            label="Trading Name"
            placeholder="Enter trading name (optional)"
            hint="Optional: A different name you operate under"
            required={false}
            error={getFieldError('tradingName')}
          />
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={CultureTokens.indigo}
          style={styles.infoIcon}
        />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Why do we need this?
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your official name and handle are used to create your unique profile
            on CulturePass. The handle becomes your permanent URL and cannot be
            changed later, so choose carefully!
          </Text>
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.xl,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  previewIcon: {
    marginRight: Spacing.xs,
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  previewUrl: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  infoText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});

export default Step1Identity;
