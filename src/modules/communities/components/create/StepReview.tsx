import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormData, COMMUNITY_CATEGORIES, JOIN_MODES } from './types';
import { CommunityCreateStyles } from './styles';
import { ReviewRow } from './ReviewRow';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { ALL_NATIONALITIES, CULTURES } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';

interface Props {
  form: CommunityFormData;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
  publishError: string | null;
}

export function StepReview({ form, colors, s, publishError }: Props) {
  const categoryLabel = COMMUNITY_CATEGORIES.find(c => c.value === form.category)?.label || form.category;
  const joinModeLabel = JOIN_MODES.find(m => m.value === form.joinMode)?.label || form.joinMode;
  const nationalityLabel = ALL_NATIONALITIES.find(n => n.id === form.nationalityId)?.label || 'none';

  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Almost there! Please review your community details before publishing.
      </Text>

      {form.imageUrl ? (
        <Image source={{ uri: form.imageUrl }} style={s.reviewImage} contentFit="cover" />
      ) : null}

      <View style={s.reviewSection}>
        <Text style={[s.reviewSectionTitle, { color: CultureTokens.indigo }]}>General Info</Text>
        <ReviewRow label="Name" value={form.name} colors={colors} />
        <ReviewRow label="Category" value={categoryLabel} colors={colors} />
        <ReviewRow label="Location" value={`${form.city}, ${form.country}`} colors={colors} />
      </View>

      <View style={s.reviewSection}>
        <Text style={[s.reviewSectionTitle, { color: CultureTokens.gold }]}>Cultural Identity</Text>
        <ReviewRow label="Origin" value={nationalityLabel} colors={colors} />
        <ReviewRow 
          label="Cultures" 
          value={form.cultureIds.map(id => CULTURES[id]?.label || id).join(', ') || 'none'} 
          colors={colors} 
        />
        <ReviewRow 
          label="Languages" 
          value={form.languageIds.map(id => COMMON_LANGUAGES.find(l => l.id === id)?.name || id).join(', ') || 'none'} 
          colors={colors} 
        />
      </View>

      <View style={s.reviewSection}>
        <Text style={[s.reviewSectionTitle, { color: CultureTokens.teal }]}>Access & Links</Text>
        <ReviewRow label="Join Mode" value={joinModeLabel} colors={colors} />
        <ReviewRow label="Website" value={form.website} colors={colors} />
        <ReviewRow label="Instagram" value={form.instagram} colors={colors} />
      </View>

      {publishError && (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '50' }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>{publishError}</Text>
        </View>
      )}
    </View>
  );
}
