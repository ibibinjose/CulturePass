/**
 * Page Pro Wizard — heritage, indigenous tags, and quick category presets
 */

import React, { useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3FilterChip } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing, Radius } from '@/design-system/tokens/theme';
import type { HostPageFormData } from '@/shared/schema';
import { CULTURES } from '@/constants/cultures';
import { LANGUAGES } from '@/constants/languages';
import { CultureIndigenousFields } from '@/components/culture/CultureIndigenousFields';
import {
  PAGE_CATEGORY_PRESETS,
  PAGE_CULTURAL_TAG_PRESETS,
  PAGE_LANGUAGE_TAG_PRESETS,
} from '../../constants/pageTagPresets';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { indigenousTagLabel } from '@/constants/indigenousTags';

export interface PageWizardTagsStepProps {
  entityType: HostEntityType;
  formData: HostPageFormData;
  updateFormData: (patch: Partial<HostPageFormData>) => void;
  tagSearch: string;
  onTagSearchChange: (q: string) => void;
  filteredCulturalTags: readonly string[];
  toggleCategory: (tag: string) => void;
}

export function PageWizardTagsStep({
  entityType,
  formData,
  updateFormData,
  tagSearch,
  onTagSearchChange,
  filteredCulturalTags,
  toggleCategory,
}: PageWizardTagsStepProps) {
  const colors = useM3Colors();

  const togglePresetTag = useCallback(
    (field: 'culturalTags' | 'languageTags', tag: string) => {
      const current = formData[field] ?? [];
      if (current.includes(tag)) {
        updateFormData({ [field]: current.filter((t: string) => t !== tag) });
      } else {
        updateFormData({ [field]: [...current, tag] });
      }
    },
    [formData, updateFormData],
  );

  const categoryPresets = PAGE_CATEGORY_PRESETS[entityType] ?? PAGE_CATEGORY_PRESETS.community;

  return (
    <View style={styles.step} testID="page-wizard-tags-step">
      <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Heritage & tags</Text>
      <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
        Flags, culture, Indigenous identifiers, and discovery tags for your Page.
      </Text>

      <CultureIndigenousFields
        value={{
          nationalityId: formData.nationalityId,
          cultureIds: formData.cultureIds ?? [],
          indigenousTags: formData.indigenousTags ?? [],
          languageIds: (formData.languageTags ?? []).map(
            (name) => Object.entries(LANGUAGES).find(([, l]) => l.name === name)?.[0] ?? name,
          ),
          isIndigenousOwned: formData.isIndigenousOwned,
        }}
        onChange={(patch) => {
          const next: Partial<HostPageFormData> = {};
          if (patch.nationalityId !== undefined) next.nationalityId = patch.nationalityId;
          if (patch.cultureIds !== undefined) {
            next.cultureIds = patch.cultureIds;
            const labels = patch.cultureIds.map((id) => CULTURES[id]?.label ?? id);
            next.culturalTags = Array.from(new Set([...(formData.culturalTags ?? []), ...labels])).slice(0, 12);
          }
          if (patch.indigenousTags !== undefined) {
            next.indigenousTags = patch.indigenousTags;
            const indLabels = patch.indigenousTags.map(indigenousTagLabel);
            next.culturalTags = Array.from(
              new Set([...(formData.culturalTags ?? []), ...indLabels.filter((l) => l !== 'Indigenous'), 'Indigenous'].filter(Boolean)),
            ).slice(0, 12);
          }
          if (patch.isIndigenousOwned !== undefined) next.isIndigenousOwned = patch.isIndigenousOwned;
          if (patch.languageIds !== undefined) {
            next.languageTags = patch.languageIds.map((id) => LANGUAGES[id]?.name ?? id);
          }
          updateFormData(next);
        }}
        colors={{
          text: colors.onSurface,
          textSecondary: colors.onSurfaceVariant,
          border: colors.outline,
          background: colors.background,
          surface: colors.surface,
        }}
        testID="page-culture-indigenous-fields"
      />

      <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.lg }]}>
        Quick categories (max 3)
      </Text>
      <View style={styles.chipRow}>
        {categoryPresets.map((cat) => (
          <M3FilterChip
            key={cat}
            label={cat}
            selected={(formData.categoryTags ?? []).includes(cat)}
            onPress={() => toggleCategory(cat)}
          />
        ))}
      </View>

      <TextInput
        value={tagSearch}
        onChangeText={onTagSearchChange}
        placeholder="Search extra cultural tags…"
        placeholderTextColor={colors.onSurfaceVariant}
        style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface, marginTop: Spacing.md }]}
        accessibilityLabel="Search cultural tags"
      />
      <Text style={[M3Typography.labelMedium, { color: colors.onSurfaceVariant }]}>More cultural tags</Text>
      <View style={styles.chipRow}>
        {filteredCulturalTags.map((tag) => (
          <M3FilterChip
            key={tag}
            label={tag}
            selected={(formData.culturalTags ?? []).includes(tag)}
            onPress={() => togglePresetTag('culturalTags', tag)}
          />
        ))}
      </View>
      <Text style={[M3Typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: Spacing.md }]}>Languages</Text>
      <View style={styles.chipRow}>
        {PAGE_LANGUAGE_TAG_PRESETS.map((tag) => (
          <M3FilterChip
            key={tag}
            label={tag}
            selected={(formData.languageTags ?? []).includes(tag)}
            onPress={() => togglePresetTag('languageTags', tag)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: Spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
});