/**
 * ProfilePreviewModal Component
 * 
 * Modal that displays a live preview of how the profile will appear to users.
 * Shows the profile exactly as it will be rendered on the platform.
 * 
 * Features:
 * - Full-screen modal with close button
 * - Renders profile using actual profile components
 * - Mobile and desktop responsive
 * - Scrollable content
 * 
 * Requirements: 19 (Review and Publish Step - Preview functionality)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3Card } from '@/design-system/ui/M3Card';
import { CultureTokens, Spacing, Radius, FontFamily } from '@/design-system/tokens/theme';
import type { HostProfileFormData } from '@/shared/schema/hostProfile';
import type { HostEntityType } from '@/shared/schema/hostTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfilePreviewModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Form data to preview
   */
  formData: HostProfileFormData;
  /**
   * Entity type
   */
  entityType: HostEntityType;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

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

/**
 * Format date string for display
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return dateString;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfilePreviewModal({
  visible,
  onClose,
  formData,
  entityType,
}: ProfilePreviewModalProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              paddingTop: topInset + Spacing.md,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Profile Preview
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Preview Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            isDesktop && styles.contentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          {formData.heroImageUrl && (
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: formData.heroImageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {/* Logo Overlay */}
              {formData.logoUrl && (
                <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                  <Image
                    source={{ uri: formData.logoUrl }}
                    style={styles.logo}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          )}

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileTitleRow}>
              <View style={styles.profileTitleContent}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {formData.officialName || 'Profile Name'}
                </Text>
                <Text style={[styles.profileHandle, { color: colors.textSecondary }]}>
                  @{formData.handle || 'handle'}
                </Text>
              </View>
              <View style={[styles.entityTypeBadge, { backgroundColor: CultureTokens.indigo + '20' }]}>
                <Text style={[styles.entityTypeBadgeText, { color: CultureTokens.indigo }]}>
                  {getEntityTypeDisplayName(entityType)}
                </Text>
              </View>
            </View>

            {/* Tagline */}
            {formData.tagline && (
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                {formData.tagline}
              </Text>
            )}

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              {formData.foundingDate && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Since {formatDate(formData.foundingDate)}
                  </Text>
                </View>
              )}
              {formData.primaryAddress && !formData.isOnlineOnly && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {formData.primaryAddress.city}, {formData.primaryAddress.state}
                  </Text>
                </View>
              )}
              {formData.isOnlineOnly && (
                <View style={styles.metaItem}>
                  <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Online Only
                  </Text>
                </View>
              )}
            </View>

            {/* Category Tags */}
            {formData.categoryTags && formData.categoryTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.categoryTags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.surfaceElevated }]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description Section */}
          {formData.description && (
            <M3Card style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                About
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {formData.description}
              </Text>
            </M3Card>
          )}

          {/* Contact Section */}
          {(formData.publicEmail || formData.phoneNumber || formData.socialLinks?.length) && (
            <M3Card style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Contact
              </Text>
              <View style={styles.contactList}>
                {formData.publicEmail && (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={20} color={CultureTokens.indigo} />
                    <Text style={[styles.contactText, { color: colors.text }]}>
                      {formData.publicEmail}
                    </Text>
                  </View>
                )}
                {formData.phoneNumber && (
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={20} color={CultureTokens.indigo} />
                    <Text style={[styles.contactText, { color: colors.text }]}>
                      {formData.phoneNumber}
                    </Text>
                  </View>
                )}
                {formData.socialLinks && formData.socialLinks.length > 0 && (
                  <View style={styles.socialLinks}>
                    {formData.socialLinks.map((link, index) => (
                      <View
                        key={index}
                        style={[styles.socialLink, { backgroundColor: colors.surfaceElevated }]}
                      >
                        <Ionicons name="link-outline" size={16} color={CultureTokens.indigo} />
                        <Text style={[styles.socialLinkText, { color: colors.text }]}>
                          {link.platform}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </M3Card>
          )}

          {/* Gallery Section */}
          {formData.galleryImages && formData.galleryImages.length > 0 && (
            <M3Card style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Gallery
              </Text>
              <View style={styles.gallery}>
                {formData.galleryImages.map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </M3Card>
          )}

          {/* Preview Notice */}
          <View style={[styles.previewNotice, { backgroundColor: CultureTokens.indigo + '15' }]}>
            <Ionicons name="information-circle-outline" size={20} color={CultureTokens.indigo} />
            <Text style={[styles.previewNoticeText, { color: colors.text }]}>
              This is a preview of how your profile will appear to users. Some interactive features are not available in preview mode.
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.semibold,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    maxWidth: 920,
    alignSelf: 'center',
    width: '100%',
  },
  heroContainer: {
    position: 'relative',
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: Spacing.lg,
    width: 100,
    height: 100,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  profileHeader: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: 40,
  },
  profileTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  profileTitleContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  profileName: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    lineHeight: 32,
  },
  profileHandle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  entityTypeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  entityTypeBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  tagline: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    lineHeight: 24,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
  },
  description: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  contactList: {
    gap: Spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  socialLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    textTransform: 'capitalize',
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
  },
  previewNotice: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
