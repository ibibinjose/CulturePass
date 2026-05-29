/**
 * Step6Review Component
 * 
 * Final wizard step for reviewing all entered information and publishing the profile.
 * 
 * Features:
 * - Display all entered information organized by section
 * - Edit buttons for each section to navigate back to specific steps
 * - Preview button to see live profile appearance
 * - Validation summary showing incomplete sections
 * - Save as Draft button
 * - Publish button (enabled only when all required fields are complete)
 * - Confirmation modal before publishing
 * - Success screen with profile URL and share options
 * 
 * Requirements: 19
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { ProfilePreviewModal } from '../ProfilePreviewModal';
import type { WizardStepProps } from '../FormWizard/WizardStep';
import type { HostEntityType } from '@/shared/schema/hostTypes';

// Creator Trust: Final verification impact banner before publish decision
import { VerificationStatusBanner, type VerificationStatus } from '../VerificationStatusBanner';
import { trackVerificationStatusViewed } from '../../services/formAnalyticsService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewSection {
  title: string;
  step: number;
  icon: keyof typeof Ionicons.glyphMap;
  fields: ReviewField[];
  isComplete: boolean;
}

interface ReviewField {
  label: string;
  value: string | string[] | undefined;
  type?: 'text' | 'list' | 'image' | 'date' | 'boolean';
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Format date string for display
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Not provided';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format boolean for display
 */
function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return 'Not specified';
  return value ? 'Yes' : 'No';
}

/**
 * Get entity type display name
 */
function getEntityTypeDisplayName(entityType: HostEntityType): string {
  const displayNames: Record<HostEntityType, string> = {
    community: 'Community',
    organiser: 'Event Organiser',
    venue: 'Venue',
    business: 'Business',
    artist: 'Artist',
    professional: 'Professional',
  };
  return displayNames[entityType];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step6Review({
  entityType,
  formData,
  onGoToStep,
  onSaveDraft,
  onPublish,
  isPublishing = false,
  isSavingDraft = false,
}: WizardStepProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [showPreview, setShowPreview] = useState(false);

  // ---------------------------------------------------------------------------
  // Build Review Sections
  // ---------------------------------------------------------------------------

  const reviewSections = useMemo((): ReviewSection[] => {
    const sections: ReviewSection[] = [];

    // Section 1: Basic Identity
    sections.push({
      title: 'Basic Identity',
      step: 1,
      icon: 'person-outline',
      isComplete: !!(formData.officialName && formData.handle && formData.foundingDate),
      fields: [
        {
          label: 'Entity Type',
          value: getEntityTypeDisplayName(entityType),
          type: 'text',
        },
        {
          label: 'Official Name',
          value: formData.officialName || 'Not provided',
          type: 'text',
        },
        {
          label: 'Handle',
          value: formData.handle ? `@${formData.handle}` : 'Not provided',
          type: 'text',
        },
        {
          label: 'Founding Date',
          value: formatDate(formData.foundingDate),
          type: 'date',
        },
        {
          label: 'Trading Name',
          value: formData.tradingName || 'Not provided',
          type: 'text',
        },
      ],
    });

    // Team & Organizers (only for community/business)
    const isTeamEntity = entityType === 'community' || entityType === 'business';
    if (isTeamEntity) {
      const organizers = (formData as any).organizers || [];
      sections.push({
        title: 'Team & Organizers',
        step: 5,
        icon: 'people-outline',
        isComplete: true,
        fields: [
          {
            label: 'Team Size',
            value: `${organizers.length + 1} member(s)`,
            type: 'text',
          },
          {
            label: 'Additional Organizers',
            value: organizers.length > 0 
              ? organizers.map((o: any) => `${o.role} (${o.userId})`).join(', ') 
              : 'Only you (Lead Organizer)',
            type: 'text',
          },
        ],
      });
    }

    // Section 2: Media & Branding
    sections.push({
      title: 'Media & Branding',
      step: 2,
      icon: 'images-outline',
      isComplete: !!(formData.logoUrl && formData.heroImageUrl),
      fields: [
        {
          label: 'Logo',
          value: formData.logoUrl ? 'Uploaded' : 'Not uploaded',
          type: 'image',
        },
        {
          label: 'Hero Image',
          value: formData.heroImageUrl ? 'Uploaded' : 'Not uploaded',
          type: 'image',
        },
        {
          label: 'Gallery Images',
          value: formData.galleryImages?.length
            ? `${formData.galleryImages.length} image(s)`
            : 'None',
          type: 'text',
        },
        {
          label: 'Video',
          value: formData.videoUrl ? 'Uploaded' : 'Not uploaded',
          type: 'text',
        },
      ],
    });

    // Section 3: Legal & Compliance
    const hasLegalInfo = !!(
      formData.abn ||
      formData.acn ||
      formData.gstRegistered !== undefined ||
      (formData.licences && formData.licences.length > 0)
    );
    sections.push({
      title: 'Legal & Compliance',
      step: 3,
      icon: 'shield-checkmark-outline',
      isComplete: hasLegalInfo,
      fields: [
        {
          label: 'ABN',
          value: formData.abn || 'Not provided',
          type: 'text',
        },
        {
          label: 'ACN',
          value: formData.acn || 'Not provided',
          type: 'text',
        },
        {
          label: 'GST Registered',
          value: formatBoolean(formData.gstRegistered),
          type: 'boolean',
        },
        {
          label: 'GST ID',
          value: formData.gstId || 'Not provided',
          type: 'text',
        },
        {
          label: 'Licences',
          value: formData.licences?.length
            ? `${formData.licences.length} licence(s)`
            : 'None',
          type: 'text',
        },
      ],
    });

    // Section 4: Location & Operations
    sections.push({
      title: 'Location & Operations',
      step: 4,
      icon: 'location-outline',
      isComplete: !!(formData.primaryAddress || formData.isOnlineOnly),
      fields: [
        {
          label: 'Online Only',
          value: formatBoolean(formData.isOnlineOnly),
          type: 'boolean',
        },
        {
          label: 'Primary Address',
          value: formData.primaryAddress
            ? `${formData.primaryAddress.street}, ${formData.primaryAddress.city}, ${formData.primaryAddress.state} ${formData.primaryAddress.postcode}`
            : 'Not provided',
          type: 'text',
        },
        {
          label: 'Additional Locations',
          value: formData.additionalLocations?.length
            ? `${formData.additionalLocations.length} location(s)`
            : 'None',
          type: 'text',
        },
      ],
    });

    // Section 5: Rich Description
    sections.push({
      title: 'Rich Description',
      step: 5,
      icon: 'document-text-outline',
      isComplete: !!(
        formData.tagline &&
        formData.description &&
        formData.categoryTags &&
        formData.categoryTags.length >= 3
      ),
      fields: [
        {
          label: 'Tagline',
          value: formData.tagline || 'Not provided',
          type: 'text',
        },
        {
          label: 'Description',
          value: formData.description
            ? `${formData.description.substring(0, 100)}${formData.description.length > 100 ? '...' : ''}`
            : 'Not provided',
          type: 'text',
        },
        {
          label: 'Category Tags',
          value: formData.categoryTags?.length
            ? formData.categoryTags
            : 'Not provided',
          type: 'list',
        },
      ],
    });

    // Section 6: Contact Information
    const hasContactInfo = !!(
      formData.publicEmail ||
      formData.phoneNumber ||
      (formData.socialLinks && formData.socialLinks.length > 0)
    );
    sections.push({
      title: 'Contact Information',
      step: 4, // Contact info is in step 4
      icon: 'mail-outline',
      isComplete: hasContactInfo,
      fields: [
        {
          label: 'Email',
          value: formData.publicEmail || 'Not provided',
          type: 'text',
        },
        {
          label: 'Phone',
          value: formData.phoneNumber || 'Not provided',
          type: 'text',
        },
        {
          label: 'WhatsApp',
          value: formData.whatsappNumber || 'Not provided',
          type: 'text',
        },
        {
          label: 'Social Links',
          value: formData.socialLinks?.length
            ? `${formData.socialLinks.length} link(s)`
            : 'None',
          type: 'text',
        },
      ],
    });

    return sections;
  }, [entityType, formData]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const incompleteSections = useMemo(() => {
    return reviewSections.filter((section) => !section.isComplete);
  }, [reviewSections]);

  const isReadyToPublish = incompleteSections.length === 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleEditSection = useCallback(
    (step: number) => {
      onGoToStep?.(step);
    },
    [onGoToStep],
  );

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!onSaveDraft) {
      Alert.alert('Unavailable', 'Draft save is not available right now.');
      return;
    }
    try {
      await onSaveDraft();
    } catch (error) {
      console.error('[Step6Review] Failed to save draft:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    }
  }, [onSaveDraft]);

  const handlePublish = useCallback(async () => {
    if (!isReadyToPublish) {
      Alert.alert(
        'Incomplete Profile',
        'Please complete all required sections before publishing.',
        [{ text: 'OK' }],
      );
      return;
    }

    if (!onPublish) {
      Alert.alert('Unavailable', 'Publish is not available right now.');
      return;
    }

    Alert.alert(
      'Publish Profile',
      'Are you sure you want to publish your profile? It will be visible to all CulturePass users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: async () => {
            try {
              await onPublish();
            } catch (error) {
              console.error('[Step6Review] Failed to publish:', error);
              Alert.alert('Error', 'Failed to publish profile. Please try again.');
            }
          },
        },
      ],
    );
  }, [isReadyToPublish, onPublish]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const renderField = (field: ReviewField) => {
    if (field.type === 'list' && Array.isArray(field.value)) {
      return (
        <View style={styles.fieldListContainer}>
          {field.value.map((item, index) => (
            <View
              key={index}
              style={[styles.fieldListItem, { backgroundColor: colors.surfaceElevated }]}
            >
              <Text style={[styles.fieldListItemText, { color: colors.text }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <Text style={[styles.fieldValue, { color: colors.text }]}>
        {field.value || 'Not provided'}
      </Text>
    );
  };

  const renderSection = (section: ReviewSection) => {
    return (
      <LuxeCard key={section.title} variant="glass" size="md" style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View
              style={[
                styles.sectionIconContainer,
                {
                  backgroundColor: section.isComplete
                    ? Luxe.colors.dark.emerald + '20'
                    : colors.surfaceElevated,
                },
              ]}
            >
              <Ionicons
                name={section.icon}
                size={20}
                color={section.isComplete ? Luxe.colors.dark.emerald : colors.textSecondary}
              />
            </View>
            <View style={styles.sectionTitleContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              {section.isComplete ? (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Luxe.colors.dark.emerald} />
                  <Text style={[styles.completeBadgeText, { color: Luxe.colors.dark.emerald }]}>
                    Complete
                  </Text>
                </View>
              ) : (
                <View style={styles.incompleteBadge}>
                  <Ionicons name="alert-circle" size={14} color={Luxe.colors.dark.primary} />
                  <Text style={[styles.incompleteBadgeText, { color: Luxe.colors.dark.primary }]}>
                    Incomplete
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Pressable
            onPress={() => handleEditSection(section.step)}
            style={[styles.editButton, { borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${section.title}`}
          >
            <Ionicons name="pencil" size={16} color={Luxe.colors.dark.accent} />
            <Text style={[styles.editButtonText, { color: Luxe.colors.dark.accent }]}>
              Edit
            </Text>
          </Pressable>
        </View>

        {/* Section Fields */}
        <View style={styles.sectionFields}>
          {section.fields.map((field, index) => (
            <View key={index} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {field.label}
              </Text>
              {renderField(field)}
            </View>
          ))}
        </View>
      </LuxeCard>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        entityType={entityType}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Review & Publish
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Review all your information before publishing your profile. You can edit any section by clicking the Edit button.
        </Text>
      </View>

      {/* Validation Summary */}
      {!isReadyToPublish && (
        <View style={[styles.validationBanner, { backgroundColor: Luxe.colors.dark.primary + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={Luxe.colors.dark.primary} />
          <View style={styles.validationContent}>
            <Text style={[styles.validationTitle, { color: Luxe.colors.dark.primary }]}>
              Incomplete Sections
            </Text>
            <Text style={[styles.validationText, { color: colors.text }]}>
              Please complete the following sections before publishing:
            </Text>
            {incompleteSections.map((section) => (
              <Pressable
                key={section.title}
                onPress={() => handleEditSection(section.step)}
                style={styles.validationItem}
              >
                <Text style={[styles.validationItemText, { color: Luxe.colors.dark.primary }]}>
                  • {section.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Review Sections */}
      <View style={styles.sections}>
        {reviewSections.map(renderSection)}
      </View>

      {/* Creator Trust: Final verification impact banner before the publish decision */}
      {(() => {
        const rawStatus = (formData as any).verificationStatus as string | undefined;
        const derivedStatus: VerificationStatus =
          rawStatus === 'approved' || rawStatus === 'verified' ? 'approved' :
          rawStatus === 'in_review' || rawStatus === 'pending' ? 'in_review' :
          rawStatus === 'needs_more_info' ? 'needs_more_info' :
          (entityType === 'business' || entityType === 'venue' || entityType === 'organiser') ? 'not_started' : 'approved';

        const unlocksToday = getUnlocksTodayForReview(entityType, derivedStatus);
        const unlocksAfter = getUnlocksAfterForReview(entityType);

        try {
          trackVerificationStatusViewed(
            {
              sessionId: `review-step-${Date.now()}`,
              userId: 'current',
              entityType: entityType as any,
              device: { platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web' },
            } as any,
            derivedStatus,
            6,
            'wizard'
          );
        } catch {}

        return (
          <VerificationStatusBanner
            status={derivedStatus}
            entityType={entityType}
            unlocksToday={unlocksToday}
            unlocksAfter={unlocksAfter}
            onAction={() => {
              console.log('[Trust] Pre-publish verification action tapped for', entityType);
            }}
            location="wizard"
          />
        );
      })()}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={handlePreview}
          style={styles.actionButton}
          accessibilityLabel="Preview profile"
        >
          <Ionicons name="eye-outline" size={20} color={Luxe.colors.dark.accent} />
          <Text style={[styles.actionButtonText, { color: Luxe.colors.dark.accent }]}>
            Preview
          </Text>
        </Button>

        <Button
          variant="outline"
          onPress={handleSaveDraft}
          loading={isSavingDraft}
          disabled={isSavingDraft || isPublishing}
          style={styles.actionButton}
          accessibilityLabel="Save as draft"
        >
          <Ionicons name="save-outline" size={20} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Save Draft
          </Text>
        </Button>

        <Button
          variant="primary"
          onPress={handlePublish}
          disabled={!isReadyToPublish || isPublishing}
          loading={isPublishing}
          style={[styles.publishButton, isDesktop && styles.publishButtonDesktop]}
          accessibilityLabel="Publish profile"
        >
          <Text style={styles.publishButtonText}>
            {isPublishing ? 'Publishing...' : 'Publish Profile'}
          </Text>
        </Button>
      </View>

      {/* Info Banner */}
      {isReadyToPublish && (
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="information-circle-outline" size={20} color={Luxe.colors.dark.accent} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Ready to Publish
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your profile is complete and ready to be published. Once published, it will be visible to all CulturePass users. You can edit your profile anytime after publishing.
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
    </>
  );
}

/**
 * Creator Trust helpers for the Review step (consistent with Step3Legal).
 */
function getUnlocksTodayForReview(entityType: any, status: VerificationStatus): string[] {
  if (status === 'approved') return ['Accept payments', 'Directory listing', 'Host ticketed events'];
  const base = ['Directory visibility', 'Free events & gatherings'];
  if (['business', 'venue'].includes(entityType)) return [...base, 'Verified badge for customer trust'];
  if (entityType === 'organiser') return [...base, 'Community event publishing'];
  return base;
}

function getUnlocksAfterForReview(entityType: any): string[] {
  if (['business', 'venue'].includes(entityType)) {
    return ['Paid ticketing & sales', 'CultureMarket listings', 'Search featuring'];
  }
  if (entityType === 'organiser') return ['Paid events', 'Full analytics', 'Large-event tools'];
  if (['artist', 'professional'].includes(entityType)) return ['Paid bookings', 'Creator directory feature', 'Direct inquiries'];
  return ['Paid memberships', 'Ticketing', 'Advanced community features'];
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
    gap: Spacing.xl,
  },
  contentDesktop: {
    maxWidth: 920,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  validationBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  validationContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  validationTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  validationText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  validationItem: {
    marginTop: Spacing.xs,
  },
  validationItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  sections: {
    gap: Spacing.lg,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  completeBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  incompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  incompleteBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  sectionFields: {
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  fieldListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  fieldListItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  fieldListItemText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  publishButton: {
    flex: 1,
    minWidth: 200,
  },
  publishButtonDesktop: {
    flex: 0,
    minWidth: 240,
  },
  publishButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
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
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default Step6Review;
