import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { CultureImage } from '@/design-system/ui';
import { useColors } from '@/hooks/useColors';
import { FormData } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  imageUploading: boolean;
  imageUploadError: string | null;
  pickImage: () => void;
}

export function StepImage({ form, setField, colors, s, imageUploading, imageUploadError, pickImage }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        A great hero image helps your event stand out. Square ratio (1:1) works best and is easiest for social sharing.
      </Text>

      {form.heroImageUrl ? (
        <View style={s.imagePreviewWrap}>
          <CultureImage
            uri={form.heroImageUrl}
            style={s.imagePreview}
            contentFit="cover"
            accessibilityLabel="Event hero image preview"
          />
          <View style={s.imagePreviewActions}>
            <Pressable
              onPress={pickImage}
              style={[s.imageActionBtn, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Change image"
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={[s.imageActionText, { color: colors.text }]}>Change</Text>
            </Pressable>
            <Pressable
              onPress={() => setField('heroImageUrl', '')}
              style={[s.imageActionBtn, { backgroundColor: CultureTokens.coral + '20' }]}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
            >
              <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
              <Text style={[s.imageActionText, { color: CultureTokens.coral }]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          disabled={imageUploading}
          style={({ pressed }) => [
            s.imagePicker,
            { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select event image"
        >
          {imageUploading ? (
            <>
              <ActivityIndicator size="large" color={CultureTokens.gold} />
              <Text style={[s.imagePickerText, { color: colors.textSecondary }]}>Uploading…</Text>
            </>
          ) : (
            <>
              <Ionicons name="images-outline" size={48} color={CultureTokens.indigo} />
              <Text style={[s.imagePickerText, { color: colors.text }]}>Tap to choose image</Text>
              <Text style={[s.imagePickerSub, { color: colors.textSecondary }]}>Upload your own or pick a style</Text>
            </>
          )}
        </Pressable>
      )}

      {imageUploadError ? (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50', marginTop: 8 }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>{imageUploadError}</Text>
        </View>
      ) : null}

      <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20' }]}>
        <Ionicons name="information-circle-outline" size={18} color={CultureTokens.gold} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          You can skip this step and add an image later by editing the event.
        </Text>
      </View>
    </View>
  );
}
