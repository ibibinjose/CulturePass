/**
 * Page Pro Wizard — heritage, discovery tags, and page categories.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3FilterChip } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/typography';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import type { HostPageFormData } from '@/shared/schema';
import { CULTURES } from '@/constants/cultures';
import { LANGUAGES } from '@/constants/languages';
import { CultureIndigenousFields } from '@/components/culture/CultureIndigenousFields';
import { SelectedTagsRail, type SelectedTagItem } from '@/components/culture/SelectedTagsRail';
import { TagSectionHeader } from '@/components/culture/TagSectionHeader';
import {
  PAGE_CATEGORY_PRESETS,
  PAGE_CULTURAL_TAG_PRESETS,
} from '../../constants/pageTagPresets';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { indigenousTagLabel } from '@/constants/indigenousTags';
import {
  HOST_PAGE_CATEGORY_TAG_MAX,
  HOST_PAGE_TAG_LIST_MAX,
} from '@/shared/schema/hostPage';
import {
  buildSyncedCulturalTags,
  canAddDiscoveryTag,
  discoveryCulturalTags,
} from './pageWizardTagSync';

export interface PageWizardTagsStepProps {
  entityType: HostEntityType;
  formData: HostPageFormData;
  updateFormData: (patch: Partial<HostPageFormData>) => void;
  toggleCategory: (tag: string) => void;
}

export function PageWizardTagsStep({
  entityType,
  formData,
  updateFormData,
  toggleCategory,
}: PageWizardTagsStepProps) {
  const colors = useM3Colors();
  const [discoverySearch, setDiscoverySearch] = useState('');

  const categoryPresets = PAGE_CATEGORY_PRESETS[entityType] ?? PAGE_CATEGORY_PRESETS.community;
  const categoryCount = formData.categoryTags?.length ?? 0;
  const discoveryTags = useMemo(
    () => discoveryCulturalTags(formData.culturalTags),
    [formData.culturalTags],
  );
  const discoveryCount = discoveryTags.length;
  const syncedTagCount = formData.culturalTags?.length ?? 0;
  const atSyncedMax = syncedTagCount >= HOST_PAGE_TAG_LIST_MAX;

  const filteredDiscoveryTags = useMemo(() => {
    const q = discoverySearch.trim().toLowerCase();
    if (!q) return PAGE_CULTURAL_TAG_PRESETS;
    return PAGE_CULTURAL_TAG_PRESETS.filter((tag) => tag.toLowerCase().includes(q));
  }, [discoverySearch]);

  const toggleDiscoveryTag = useCallback(
    (tag: string) => {
      const current = discoveryCulturalTags(formData.culturalTags);
      const nextDiscovery = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : canAddDiscoveryTag(formData, tag, current)
          ? [...current, tag]
          : current;

      updateFormData({
        culturalTags: buildSyncedCulturalTags(formData, { discoveryTags: nextDiscovery }),
      });
    },
    [formData, updateFormData],
  );

  const selectedSummary = useMemo((): SelectedTagItem[] => {
    const items: SelectedTagItem[] = [];

    for (const cat of formData.categoryTags ?? []) {
      items.push({
        id: `cat-${cat}`,
        label: cat,
        onRemove: () => toggleCategory(cat),
      });
    }

    for (const id of formData.cultureIds ?? []) {
      const culture = CULTURES[id];
      items.push({
        id: `culture-${id}`,
        label: culture?.label ?? id,
        emoji: culture?.emoji,
        onRemove: () => {
          const nextIds = (formData.cultureIds ?? []).filter((c) => c !== id);
          updateFormData({
            cultureIds: nextIds,
            culturalTags: buildSyncedCulturalTags(formData, { cultureIds: nextIds }),
          });
        },
      });
    }

    for (const raw of formData.indigenousTags ?? []) {
      const label = indigenousTagLabel(raw);
      items.push({
        id: `ind-${raw}`,
        label,
        onRemove: () => {
          const nextInd = (formData.indigenousTags ?? []).filter(
            (t) => t !== raw && t !== label,
          );
          updateFormData({
            indigenousTags: nextInd,
            culturalTags: buildSyncedCulturalTags(formData, { indigenousTags: nextInd }),
          });
        },
      });
    }

    for (const tag of discoveryTags) {
      items.push({
        id: `disc-${tag}`,
        label: tag,
        onRemove: () => toggleDiscoveryTag(tag),
      });
    }

    for (const lang of formData.languageTags ?? []) {
      items.push({
        id: `lang-${lang}`,
        label: lang,
        onRemove: () => {
          const nextLangs = (formData.languageTags ?? []).filter((l) => l !== lang);
          updateFormData({ languageTags: nextLangs });
        },
      });
    }

    return items;
  }, [discoveryTags, formData, toggleCategory, toggleDiscoveryTag, updateFormData]);

  return (
    <View style={styles.step} testID="page-wizard-tags-step">
      <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Heritage & tags</Text>
      <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
        Help CulturePass match your Page to the right communities, searches, and city feeds.
      </Text>

      <SelectedTagsRail
        title={
          selectedSummary.length > 0
            ? `Your selections (${selectedSummary.length})`
            : 'Your selections'
        }
        items={selectedSummary}
        emptyLabel="Pick categories, cultures, or audience tags below — they appear here."
        textColor={colors.onSurface}
        mutedColor={colors.onSurfaceVariant}
        borderColor={colors.outlineVariant}
        surfaceColor={colors.surfaceContainerLow}
        testID="page-wizard-selected-tags"
      />

      <View style={[styles.section, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
        <TagSectionHeader
          title="Page categories"
          subtitle="How your Page appears in directory browse — pick up to three."
          count={categoryCount}
          max={HOST_PAGE_CATEGORY_TAG_MAX}
          titleColor={colors.onSurface}
          subtitleColor={colors.onSurfaceVariant}
          accentColor={CultureTokens.indigo}
        />
        <View style={styles.chipRow}>
          {categoryPresets.map((cat) => (
            <M3FilterChip
              key={cat}
              label={cat}
              selected={(formData.categoryTags ?? []).includes(cat)}
              disabled={
                !(formData.categoryTags ?? []).includes(cat) &&
                categoryCount >= HOST_PAGE_CATEGORY_TAG_MAX
              }
              onPress={() => toggleCategory(cat)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.section, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
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
            if (patch.isIndigenousOwned !== undefined) next.isIndigenousOwned = patch.isIndigenousOwned;

            if (patch.cultureIds !== undefined) {
              next.cultureIds = patch.cultureIds;
              next.culturalTags = buildSyncedCulturalTags(formData, { cultureIds: patch.cultureIds });
            }
            if (patch.indigenousTags !== undefined) {
              next.indigenousTags = patch.indigenousTags;
              next.culturalTags = buildSyncedCulturalTags(formData, {
                indigenousTags: patch.indigenousTags,
                isIndigenousOwned: patch.isIndigenousOwned ?? formData.isIndigenousOwned,
              });
            }
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
            surface: colors.surfaceContainerHighest,
          }}
          testID="page-culture-indigenous-fields"
        />
      </View>

      <View style={[styles.section, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
        <TagSectionHeader
          title="Audience & discovery labels"
          subtitle="Optional extras like Family-Friendly, Newcomers, or Multicultural — for search filters."
          count={discoveryCount}
          titleColor={colors.onSurface}
          subtitleColor={colors.onSurfaceVariant}
          accentColor={CultureTokens.gold}
        />
        <View style={[styles.searchWrap, { borderColor: colors.outline, backgroundColor: colors.surfaceContainerHighest }]}>
          <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            value={discoverySearch}
            onChangeText={setDiscoverySearch}
            placeholder="Search audience tags…"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.onSurface }]}
            accessibilityLabel="Search audience and discovery tags"
          />
          {discoverySearch.length > 0 ? (
            <Pressable
              onPress={() => setDiscoverySearch('')}
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          {filteredDiscoveryTags.map((tag) => {
            const selected = discoveryTags.includes(tag);
            return (
              <M3FilterChip
                key={tag}
                label={tag}
                selected={selected}
                disabled={!selected && !canAddDiscoveryTag(formData, tag)}
                onPress={() => toggleDiscoveryTag(tag)}
              />
            );
          })}
        </View>
        {atSyncedMax && discoveryCount < HOST_PAGE_TAG_LIST_MAX ? (
          <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            Heritage tag limit reached ({syncedTagCount}/{HOST_PAGE_TAG_LIST_MAX}) — remove a culture or
            indigenous tag above to add audience labels.
          </Text>
        ) : null}
        {filteredDiscoveryTags.length === 0 ? (
          <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            No audience tags match your search.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: Spacing.md },
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginTop: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
});