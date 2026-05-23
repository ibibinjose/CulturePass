/**
 * MediaUploadField Integration Example
 * 
 * This file demonstrates how to use the MediaUploadField component
 * in a real form context (Step 2 of the HostSpace wizard).
 * 
 * DO NOT IMPORT THIS FILE IN PRODUCTION CODE.
 * This is for documentation and testing purposes only.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { MediaUploadField } from './MediaUploadField';
import { Button } from '@/design-system/ui/Button';
import { Spacing } from '@/design-system/tokens/theme';

interface MediaFormData {
  logoUrl: string;
  heroImageUrl: string;
  galleryImages: string[];
  videoUrl: string;
}

/**
 * Example: Step 2 - Media & Branding
 * 
 * This demonstrates the typical usage in the HostSpace wizard.
 */
export function MediaUploadExample() {
  const [formData, setFormData] = useState<MediaFormData>({
    logoUrl: '',
    heroImageUrl: '',
    galleryImages: [],
    videoUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MediaFormData, string>>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MediaFormData, string>> = {};

    if (!formData.logoUrl) {
      newErrors.logoUrl = 'Logo is required';
    }

    if (!formData.heroImageUrl) {
      newErrors.heroImageUrl = 'Cover image is required';
    }

    if (formData.galleryImages.length < 3) {
      newErrors.galleryImages = 'At least 3 gallery images are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Form is valid:', formData);
      // Proceed to next step
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Logo Upload */}
        <MediaUploadField
          label="Profile Logo *"
          hint="Square image, minimum 400×400 pixels. This will be your profile picture."
          type="logo"
          value={formData.logoUrl}
          onChange={(value) => setFormData({ ...formData, logoUrl: value as string })}
          storagePath="profiles/demo-123"
          aspectRatio={1}
          minDimensions={{ width: 400, height: 400 }}
          showCropTool={true}
          error={errors.logoUrl}
        />

        {/* Hero Image Upload */}
        <MediaUploadField
          label="Cover Image *"
          hint="Wide image (16:9 or 21:9). This appears at the top of your profile."
          type="hero"
          value={formData.heroImageUrl}
          onChange={(value) => setFormData({ ...formData, heroImageUrl: value as string })}
          storagePath="profiles/demo-123"
          aspectRatio={16 / 9}
          showCropTool={true}
          error={errors.heroImageUrl}
        />

        {/* Gallery Upload */}
        <MediaUploadField
          label="Gallery Images *"
          hint="Add 3-12 images showcasing your work, venue, or community"
          type="gallery"
          value={formData.galleryImages}
          onChange={(value) => setFormData({ ...formData, galleryImages: value as string[] })}
          storagePath="profiles/demo-123/gallery"
          maxItems={12}
          error={errors.galleryImages}
        />

        {/* Video Upload (Optional) */}
        <MediaUploadField
          label="Promotional Video (Optional)"
          hint="MP4 or WebM, maximum 3 minutes. Introduce yourself or showcase your space."
          type="video"
          value={formData.videoUrl}
          onChange={(value) => setFormData({ ...formData, videoUrl: value as string })}
          storagePath="profiles/demo-123"
          maxSize={100 * 1024 * 1024} // 100MB
        />

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Continue to Legal & Compliance
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});

/**
 * Example: Programmatic Upload
 * 
 * This demonstrates how to use the useMediaUpload hook directly
 * for custom upload flows.
 */
export function ProgrammaticUploadExample() {
  const [imageUrl, setImageUrl] = useState('');

  const handleCustomUpload = async () => {
    // This would be implemented using the useMediaUpload hook
    // See the hook documentation for details
    console.log('Custom upload logic here');
  };

  return (
    <View style={styles.container}>
      <Button onPress={handleCustomUpload}>
        Custom Upload Flow
      </Button>
    </View>
  );
}

/**
 * Example: Validation Scenarios
 * 
 * This demonstrates different validation scenarios.
 */
export const ValidationExamples = {
  // Logo must be square
  logoValidation: {
    type: 'logo' as const,
    aspectRatio: 1,
    minDimensions: { width: 400, height: 400 },
  },

  // Hero must be wide
  heroValidation: {
    type: 'hero' as const,
    aspectRatio: 16 / 9,
    minDimensions: { width: 1200, height: 630 },
  },

  // Gallery has no strict requirements
  galleryValidation: {
    type: 'gallery' as const,
    maxItems: 12,
  },

  // Video has size limit
  videoValidation: {
    type: 'video' as const,
    maxSize: 100 * 1024 * 1024, // 100MB
  },
};
