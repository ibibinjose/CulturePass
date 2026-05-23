/**
 * RichTextEditor Example
 * 
 * Example usage of the RichTextEditor component with AI assistance.
 * This file demonstrates how to integrate the rich text editor into a form.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { RichTextEditor } from './RichTextEditor';
import { M3Button } from '@/design-system/ui/M3Button';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/design-system/tokens/theme';

/**
 * Example form using RichTextEditor
 * 
 * This demonstrates:
 * - Basic usage with label and placeholder
 * - Character limit enforcement
 * - AI assistance integration
 * - Readability scoring
 * - Form validation
 */
export function RichTextEditorExample() {
  const colors = useColors();
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!tagline || tagline.trim().length === 0) {
      newErrors.tagline = 'Tagline is required';
    }

    if (!description || description.trim().length < 100) {
      newErrors.description = 'Description must be at least 100 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    console.log('Form submitted:', { tagline, description, guidelines });
    setErrors({});
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Short Tagline */}
      <RichTextEditor
        value={tagline}
        onChange={(value) => {
          setTagline(value);
          if (errors.tagline) {
            setErrors({ ...errors, tagline: '' });
          }
        }}
        label="Short Tagline"
        placeholder="Enter a catchy tagline..."
        maxLength={120}
        showAIAssist={true}
        showReadabilityScore={false}
        fieldType="tagline"
        hint="A brief, memorable description (max 120 characters)"
        error={errors.tagline}
        minHeight={80}
      />

      {/* Long Description */}
      <RichTextEditor
        value={description}
        onChange={(value) => {
          setDescription(value);
          if (errors.description) {
            setErrors({ ...errors, description: '' });
          }
        }}
        label="Long Description"
        placeholder="Enter a detailed description..."
        maxLength={5000}
        showAIAssist={true}
        showReadabilityScore={true}
        fieldType="description"
        hint="Provide a comprehensive description of your profile"
        error={errors.description}
        minHeight={200}
      />

      {/* Community Guidelines (Optional) */}
      <RichTextEditor
        value={guidelines}
        onChange={setGuidelines}
        label="Community Guidelines (Optional)"
        placeholder="Enter community guidelines..."
        maxLength={3000}
        showAIAssist={true}
        showReadabilityScore={true}
        fieldType="guidelines"
        hint="Set expectations for community members"
        minHeight={150}
      />

      {/* Submit Button */}
      <M3Button
        variant="filled"
        onPress={handleSubmit}
        fullWidth
      >
        Save Profile
      </M3Button>
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
});
