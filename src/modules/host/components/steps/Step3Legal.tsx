/**
 * Step3Legal Component
 * 
 * Third step of the HostSpace Enterprise-Grade Form System wizard.
 * Collects legal and compliance information based on entity type:
 * - ABN/ACN (for business, organiser with paid events, venue)
 * - Tax Status (GST registered / not registered)
 * - GST/VAT ID (if registered)
 * - Licences & Permits (upload multiple documents)
 * - Verification status tracking
 * 
 * Features:
 * - Conditional field display based on entity type
 * - Real-time ABN validation with government API lookup
 * - GST ID format validation
 * - Multi-file licence upload with expiry tracking
 * - Verification status badges
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * 
 * Requirements: 8 (Legal and Compliance Fields)
 * 
 * @example
 * ```tsx
 * <Step3Legal
 *   entityType="business"
 *   formData={formData}
 *   updateFormData={updateFormData}
 *   getFieldError={getFieldError}
 *   isValidating={false}
 * />
 * ```
 */

import React from 'react';
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
import { ABNField } from '../fields/ABNField';
import { TaxStatusField } from '../fields/TaxStatusField';
import { LicenceUploadField } from '../fields/LicenceUploadField';
import type { Licence } from '../fields/LicenceUploadField';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';
import type { EntityType } from '../../hooks/useFormWizard';
import type { PartialFormData } from '../../services/formStateSerializer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Step3LegalProps {
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
 * Determine if ABN is required for the entity type
 */
function isABNRequired(entityType: EntityType): boolean {
  // ABN required for: business, venue
  // ABN conditionally required for: organiser (if creating paid events)
  return entityType === 'business' || entityType === 'venue';
}

/**
 * Determine if ABN is shown for the entity type
 */
function shouldShowABN(entityType: EntityType): boolean {
  // Show ABN for: business, organiser, venue
  return (
    entityType === 'business' ||
    entityType === 'organiser' ||
    entityType === 'venue'
  );
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

/**
 * Get step description based on entity type
 */
function getStepDescription(entityType: EntityType): string {
  switch (entityType) {
    case 'business':
      return 'Provide your business registration details and tax information to operate legally on CulturePass.';
    case 'venue':
      return 'Provide your venue registration and compliance documents to host events on CulturePass.';
    case 'organiser':
      return 'Provide your registration details. ABN is required if you plan to create paid events.';
    case 'professional':
      return 'Upload your professional credentials and licences to verify your expertise.';
    case 'artist':
      return 'Upload any relevant licences or permits for your artistic practice.';
    case 'community':
      return 'Upload any relevant documents or permits for your community organization.';
    default:
      return 'Provide legal and compliance information for your entity.';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step3Legal({
  entityType,
  formData,
  updateFormData,
  validationErrors,
  getFieldError,
  isValidating = false,
}: Step3LegalProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  // ---------------------------------------------------------------------------
  // Field Values
  // ---------------------------------------------------------------------------

  const abn = formData.abn || '';
  const gstRegistered = formData.gstRegistered || false;
  const gstId = formData.gstId || '';
  
  // Convert schema licences to UI licences (add missing fields)
  const licences: Licence[] = (formData.licences || []).map((licence, index) => ({
    id: `licence_${index}`,
    type: licence.type,
    number: licence.number,
    documentUrl: licence.documentUrl,
    fileName: licence.documentUrl.split('/').pop() || 'document',
    expiryDate: licence.expiryDate,
    verified: licence.verified,
    uploadedAt: new Date().toISOString(), // Placeholder
  }));

  // ---------------------------------------------------------------------------
  // Conditional Display Logic
  // ---------------------------------------------------------------------------

  const showABN = shouldShowABN(entityType);
  const abnRequired = isABNRequired(entityType);

  // Show tax status for business entities and organisers
  const showTaxStatus = entityType === 'business' || entityType === 'organiser';

  // Show licences for all entity types
  const showLicences = true;

  // ---------------------------------------------------------------------------
  // Handle Changes
  // ---------------------------------------------------------------------------

  const handleABNChange = (value: string) => {
    updateFormData({ abn: value });
  };

  const handleGstRegisteredChange = (registered: boolean) => {
    updateFormData({ gstRegistered: registered });
    // Clear GST ID if not registered
    if (!registered) {
      updateFormData({ gstId: '' });
    }
  };

  const handleGstIdChange = (value: string) => {
    updateFormData({ gstId: value });
  };

  const handleLicencesChange = (value: Licence[]) => {
    // Convert the UI Licence type to the schema Licence type
    const schemaLicences = value.map((licence) => ({
      type: licence.type,
      number: licence.number,
      documentUrl: licence.documentUrl,
      expiryDate: licence.expiryDate,
      verified: licence.verified,
    }));
    updateFormData({ licences: schemaLicences });
  };

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
            name="shield-checkmark-outline"
            size={28}
            color={CultureTokens.indigo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Legal & Compliance
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getStepDescription(entityType)}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* ABN Field (conditional) */}
        {showABN && (
          <View style={styles.fieldGroup}>
            <ABNField
              value={abn}
              onChange={handleABNChange}
              required={abnRequired}
              error={getFieldError('abn')}
              label="Australian Business Number (ABN)"
              hint={
                entityType === 'organiser'
                  ? 'Required if you plan to create paid events'
                  : 'Enter your 11-digit ABN'
              }
            />
          </View>
        )}

        {/* Tax Status (conditional) */}
        {showTaxStatus && (
          <View style={styles.fieldGroup}>
            <TaxStatusField
              taxStatus={gstRegistered ? 'registered' : 'not-registered'}
              gstId={gstId}
              onTaxStatusChange={(status) => handleGstRegisteredChange(status === 'registered')}
              onGstIdChange={handleGstIdChange}
              error={getFieldError('gstId')}
            />
          </View>
        )}

        {/* Licences & Permits */}
        {showLicences && (
          <View style={styles.fieldGroup}>
            <LicenceUploadField
              value={licences}
              onChange={handleLicencesChange}
              label="Licences & Permits"
              hint={getLicenceHint(entityType)}
              error={getFieldError('licences')}
              maxFiles={5}
            />
          </View>
        )}
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
            Verification Process
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {getVerificationInfo(entityType)}
          </Text>
        </View>
      </View>

      {/* Verification Status (if applicable) */}
      {formData.verificationStatus && (
        <View style={styles.verificationCard}>
          <View
            style={[
              styles.verificationBadge,
              {
                backgroundColor: getVerificationColor(formData.verificationStatus),
              },
            ]}
          >
            <Ionicons
              name={getVerificationIcon(formData.verificationStatus)}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.verificationText}>
              {getVerificationLabel(formData.verificationStatus)}
            </Text>
          </View>
          {formData.verificationNotes && (
            <Text style={[styles.verificationNotes, { color: colors.textSecondary }]}>
              {formData.verificationNotes}
            </Text>
          )}
        </View>
      )}

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Helper Functions (continued)
// ---------------------------------------------------------------------------

/**
 * Get licence upload hint based on entity type
 */
function getLicenceHint(entityType: EntityType): string {
  switch (entityType) {
    case 'business':
      return 'Upload business registration, food/liquor licences, or permits';
    case 'venue':
      return 'Upload venue permits, fire safety certificates, or entertainment licences';
    case 'organiser':
      return 'Upload insurance certificates, producer credentials, or event permits';
    case 'professional':
      return 'Upload professional credentials, degrees, or certifications';
    case 'artist':
      return 'Upload performance licences, union memberships, or credentials';
    case 'community':
      return 'Upload incorporation documents, permits, or insurance certificates';
    default:
      return 'Upload relevant licences, permits, or certificates';
  }
}

/**
 * Get verification info text based on entity type
 */
function getVerificationInfo(entityType: EntityType): string {
  const requiresVerification =
    entityType === 'business' ||
    entityType === 'venue' ||
    entityType === 'organiser';

  if (requiresVerification) {
    return 'Your documents will be reviewed by our team within 48 hours. You can save your profile as a draft and continue editing while verification is in progress.';
  }

  return 'Your documents will be reviewed for authenticity. This helps build trust with the CulturePass community. You can publish your profile immediately and verification will happen in the background.';
}

/**
 * Get verification status color
 */
function getVerificationColor(status: string): string {
  switch (status) {
    case 'verified':
      return CultureTokens.teal;
    case 'pending':
      return CultureTokens.indigo;
    case 'rejected':
      return CultureTokens.coral;
    default:
      return CultureTokens.indigo;
  }
}

/**
 * Get verification status icon
 */
function getVerificationIcon(status: string): any {
  switch (status) {
    case 'verified':
      return 'checkmark-circle';
    case 'pending':
      return 'time';
    case 'rejected':
      return 'close-circle';
    default:
      return 'time';
  }
}

/**
 * Get verification status label
 */
function getVerificationLabel(status: string): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'pending':
      return 'Pending Verification';
    case 'rejected':
      return 'Verification Rejected';
    default:
      return 'Pending';
  }
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
  verificationCard: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  verificationNotes: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});

export default Step3Legal;
