/**
 * Step1Identity Component
 * 
 * First step of the HostSpace Enterprise-Grade Form System wizard.
 * Create Page flow for CulturePass: collects profile info for communities, businesses, artists and organisations.
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { SITE_ORIGIN } from '@/lib/app-meta';
import { HandleField } from '../fields/HandleField';
import { NameField } from '../fields/NameField';
import { DateField } from '../fields/DateField';
import { Input } from '@/design-system/ui/Input';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
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
    organizer: 'Event Organiser',
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
  const bio = (formData as any).bio || (formData as any).shortBio || '';

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

  const handleBioChange = (value: string) => {
    updateFormData({ bio: value } as any);
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
      {/* Header with Create a Page intro and CulturePass benefits */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons
            name="person-outline"
            size={28}
            color={Luxe.colors.dark.accent}
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Create a Page</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your Page is your home on CulturePass — where people discover your culture, events, stories and community.
        </Text>
        <Text style={[styles.entityTypeNote, { color: colors.textTertiary }]}>
          Creating a {getEntityTypeDisplayName(entityType)} Page
        </Text>

        {/* Benefits list for CulturePass — cultural profiles, events, communities & creators */}
        <View style={[styles.benefitsContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>With your Page you can:</Text>
          {[
            { icon: 'people-outline', text: 'Connect with your cultural community and fans worldwide' },
            { icon: 'construct-outline', text: 'Use professional tools to promote events and heritage' },
            { icon: 'cash-outline', text: 'Earn money through ticketed events, shops and offers' },
            { icon: 'people-circle-outline', text: 'Invite collaborators and team members to help grow your profile' },
            { icon: 'analytics-outline', text: 'Get insights on your audience and cultural engagement' },
            { icon: 'trending-up-outline', text: 'Get discovered — people can follow you and see your updates in their feed' },
          ].map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <Ionicons name={benefit.icon as any} size={16} color={Luxe.colors.dark.accent} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.termsText, { color: colors.textTertiary }]}>
          By continuing you agree to the CulturePass Page Terms.
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <NameField
            value={officialName}
            onChange={handleOfficialNameChange}
            label="Page name (required)"
            placeholder="Enter your official / business / community name"
            hint="Use the name of your business, brand or organisation, or a name that helps explain your Page."
            required
            error={getFieldError('officialName')}
          />
        </View>
        <View style={styles.fieldGroup}>
          <HandleField
            value={handle}
            onChange={handleHandleChange}
            suggestedHandle={suggestedHandle}
            error={getFieldError('handle')}
          />
          {!!handle && (
            <View style={[styles.previewBanner, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons
                name="link-outline"
                size={16}
                color={Luxe.colors.dark.accent}
                style={styles.previewIcon}
              /><Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Your profile URL:</Text><Text style={[styles.previewUrl, { color: Luxe.colors.dark.accent }]}>{SITE_ORIGIN.replace(/^https?:\/\//, '')}/@{handle}</Text></View>
          )}</View>

        {/* Short bio - FB-style easy entry */}
        <View style={styles.fieldGroup}>
          <Input
            label="Bio (optional)"
            value={bio}
            onChangeText={handleBioChange}
            placeholder="Tell people a little about what you do."
            hint="A short introduction for your Page. You can expand this later."
            maxLength={160}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.fieldGroup}><DateField
            value={foundingDate}
            onChange={handleFoundingDateChange}
            label="Founding Date"
            hint="When was your entity established?"
            required
            error={getFieldError('foundingDate')}
          /></View><View style={styles.fieldGroup}><NameField
            value={tradingName}
            onChange={handleTradingNameChange}
            label="Trading Name"
            placeholder="Enter trading name (optional)"
            hint="Optional: A different name you operate under"
            required={false}
            error={getFieldError('tradingName')}
          /></View></View>

      <View style={[styles.infoBanner, { backgroundColor: colors.surfaceElevated }]}><Ionicons
          name="information-circle-outline"
          size={20}
          color={Luxe.colors.dark.accent}
          style={styles.infoIcon}
        /><View style={styles.infoContent}><Text style={[styles.infoTitle, { color: colors.text }]}>Why do we need this?</Text><Text style={[styles.infoText, { color: colors.textSecondary }]}>Your official name and handle are used to create your unique profile
            on CulturePass. The handle becomes your permanent Page URL and cannot be
            changed later, so choose carefully!</Text></View></View>

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
    marginBottom: Spacing.lg,
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
    gap: 10,
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
    marginTop: 16,
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
  // FB-style Page creation enhancements
  entityTypeNote: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
  benefitsContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  benefitsTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitIcon: {
    marginTop: 1,
  },
  benefitText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  termsText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default Step1Identity;
