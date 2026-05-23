import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormData } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
  imageUploading: boolean;
  logoUploading: boolean;
  imageUploadError: string | null;
  pickImage: (type: 'hero' | 'logo') => void;
}

export function StepImage({ 
  form, setField, colors, s, 
  imageUploading, logoUploading, 
  imageUploadError, pickImage 
}: Props) {
  return (
    <View style={s.fields}>
      <Field label="Hero Banner (16:9)" colors={colors}>
        {form.imageUrl ? (
          <View style={s.imagePreviewWrap}>
            <Image source={{ uri: form.imageUrl }} style={s.imagePreview} contentFit="cover" />
            <View style={s.imagePreviewActions}>
              <Pressable 
                onPress={() => pickImage('hero')}
                style={[s.imageActionBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="camera-outline" size={18} color={colors.text} />
                <Text style={[s.imageActionText, { color: colors.text }]}>Change</Text>
              </Pressable>
              <Pressable 
                onPress={() => setField('imageUrl', '')}
                style={[s.imageActionBtn, { backgroundColor: colors.error + '15' }]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[s.imageActionText, { color: colors.error }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable 
            onPress={() => pickImage('hero')}
            disabled={imageUploading}
            style={[s.imagePicker, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          >
            {imageUploading ? (
              <ActivityIndicator color={CultureTokens.indigo} />
            ) : (
              <>
                <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                <Text style={[s.imagePickerText, { color: colors.text }]}>Upload Hero Image</Text>
                <Text style={[s.imagePickerSub, { color: colors.textSecondary }]}>Landscape (16:9) works best</Text>
              </>
            )}
          </Pressable>
        )}
      </Field>

      <Field label="Identity Logo (1:1)" colors={colors}>
        <View style={s.imagePickerGroup}>
          <Pressable 
            onPress={() => pickImage('logo')}
            disabled={logoUploading}
            style={[s.smallImagePicker, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          >
            {form.logoUrl ? (
              <Image source={{ uri: form.logoUrl }} style={s.logoPreview} contentFit="cover" />
            ) : (
              <View style={s.logoPlaceholder}>
                <Ionicons name="business-outline" size={24} color={colors.textTertiary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.imageActionText, { color: colors.text }]}>
                {form.logoUrl ? 'Change Community Logo' : 'Upload Community Logo'}
              </Text>
              <Text style={[s.imagePickerSub, { color: colors.textSecondary }]}>Square (1:1) avatar shape</Text>
            </View>
            {logoUploading && <ActivityIndicator color={CultureTokens.indigo} />}
          </Pressable>
        </View>
      </Field>

      {imageUploadError && (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '50' }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>{imageUploadError}</Text>
        </View>
      )}
    </View>
  );
}
