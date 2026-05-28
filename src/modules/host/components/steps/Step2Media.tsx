/**
 * Step 2: Media & Branding
 * 
 * Second step of the profile creation wizard.
 * Handles media uploads for logo, hero image, gallery, and optional video.
 * 
 * Features:
 * - Logo upload (square, 400x400px minimum)
 * - Hero/cover image upload (16:9 or 21:9 aspect ratio)
 * - Gallery images (up to 12 images, drag-to-reorder)
 * - Optional video URL or upload
 * - Image preview and editing
 * - Validation feedback
 * - Mobile-responsive design
 * 
 * Requirements: 7 (Media Upload and Management)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { MediaUploadField } from '../fields/MediaUploadField';
import type { EntityType } from '../../hooks/useFormWizard';
import type { PartialFormData } from '../../services/formStateSerializer';

/**
 * Props for Step2Media (subset of WizardStepProps without 'step')
 */
interface Step2MediaProps {
  entityType: EntityType;
  formData: PartialFormData;
  updateFormData: (data: Partial<PartialFormData>) => void;
  validationErrors?: Record<string, string[]>;
  getFieldError: (field: string) => string | undefined;
  isValidating?: boolean;
}

/**
 * Step2Media Component
 * 
 * Renders the media and branding step of the profile creation wizard.
 * Allows users to upload logo, hero image, gallery images, and optional video.
 */
export function Step2Media({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: Step2MediaProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // Generate storage path for uploads
  const storagePath = formData.id
    ? `profiles/${formData.id}`
    : `profiles/temp-${Date.now()}`;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleLogoChange = (value: string | string[]) => {
    updateFormData({ logoUrl: typeof value === 'string' ? value : value[0] });
  };

  const handleHeroChange = (value: string | string[]) => {
    updateFormData({ heroImageUrl: typeof value === 'string' ? value : value[0] });
  };

  const handleGalleryChange = (value: string | string[]) => {
    updateFormData({ galleryImages: Array.isArray(value) ? value : [value] });
  };

  const handleVideoChange = (value: string | string[]) => {
    const videoUrl = typeof value === 'string' ? value : value[0];
    updateFormData({ videoUrl });
  };

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const renderSectionHeader = (title: string, subtitle?: string, required?: boolean) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {required && (
          <View style={[styles.requiredBadge, { backgroundColor: Luxe.colors.dark.primary }]}>
            <Text style={styles.requiredBadgeText}>Required</Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktop && styles.contentContainerDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Media & Branding
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upload professional images to make your profile stand out. High-quality visuals
          attract more attention and build trust with your audience.
        </Text>
      </View>

      {/* Logo Upload */}
      <View style={styles.section}>
        {renderSectionHeader(
          'Profile Logo',
          'Square logo that represents your brand. Minimum 400×400 pixels.',
          true
        )}
        <MediaUploadField
          type="logo"
          value={formData.logoUrl || ''}
          onChange={handleLogoChange}
          storagePath={storagePath}
          aspectRatio={1}
          minDimensions={{ width: 400, height: 400 }}
          maxSize={10 * 1024 * 1024} // 10MB
          showCropTool={true}
          error={getFieldError('logoUrl')}
          hint="Upload a square logo (1:1 aspect ratio). PNG or JPEG, max 10MB."
        />
      </View>

      {/* Hero/Cover Image Upload */}
      <View style={styles.section}>
        {renderSectionHeader(
          'Cover Image',
          'Wide banner image for your profile header. Recommended 16:9 or 21:9 aspect ratio.',
          true
        )}
        <MediaUploadField
          type="hero"
          value={formData.heroImageUrl || ''}
          onChange={handleHeroChange}
          storagePath={storagePath}
          aspectRatio={16 / 9}
          minDimensions={{ width: 1200, height: 675 }}
          maxSize={10 * 1024 * 1024} // 10MB
          showCropTool={true}
          error={getFieldError('heroImageUrl')}
          hint="Upload a wide banner image (16:9 aspect ratio). PNG or JPEG, max 10MB."
        />
      </View>

      {/* Gallery Images Upload */}
      <View style={styles.section}>
        {renderSectionHeader(
          'Gallery Images',
          'Showcase your space, products, or work with up to 12 images. Drag to reorder.',
          false
        )}
        <MediaUploadField
          type="gallery"
          value={formData.galleryImages || []}
          onChange={handleGalleryChange}
          storagePath={storagePath}
          maxItems={12}
          maxSize={10 * 1024 * 1024} // 10MB per image
          showCropTool={false}
          error={getFieldError('galleryImages')}
          hint="Add up to 12 images. First image will be featured. PNG or JPEG, max 10MB each."
        />
      </View>

      {/* Video Upload (Optional) */}
      <View style={styles.section}>
        {renderSectionHeader(
          'Introduction Video',
          'Optional video to introduce your profile. Maximum 3 minutes, MP4 or WebM format.',
          false
        )}
        <MediaUploadField
          type="video"
          value={formData.videoUrl || ''}
          onChange={handleVideoChange}
          storagePath={storagePath}
          maxSize={100 * 1024 * 1024} // 100MB
          showCropTool={false}
          error={getFieldError('videoUrl')}
          hint="Upload a video (MP4 or WebM, max 3 minutes, max 100MB) or paste a YouTube/Vimeo URL."
        />
      </View>

      {/* Tips Section */}
      <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.tipsTitle, { color: colors.text }]}>
          📸 Photography Tips
        </Text>
        <View style={styles.tipsList}>
          <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
            • Use high-resolution images with good lighting
          </Text>
          <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
            • Ensure your logo has a transparent or solid background
          </Text>
          <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
            • Choose a cover image that represents your brand identity
          </Text>
          <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
            • Gallery images should showcase your best work or space
          </Text>
          <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
            • Keep videos short and engaging (30-90 seconds ideal)
          </Text>
        </View>
      </View>

      {/* Bottom spacing for mobile navigation */}
      <View style={styles.bottomSpacer} />
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
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  contentContainerDesktop: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  requiredBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  tipsContainer: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  tipsList: {
    gap: Spacing.xs,
  },
  tipItem: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});

export default Step2Media;
