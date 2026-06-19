/**
 * Culture tag chips — flat grid or Australian category sections.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, Radius, Spacing } from '@/design-system/tokens/theme';
import type { Culture } from '@/constants/cultures';

type CultureTagChipCulture = Pick<Culture, 'id' | 'label' | 'emoji'>;
import {
  buildAustralianCultureSections,
  isAustralianNationality,
} from '@/constants/australianCultureTags';

export interface CultureTagPickerColors {
  text: string;
  textSecondary: string;
  textTertiary?: string;
  border: string;
  surface: string;
}

export interface CultureTagPickerProps {
  cultures: Culture[];
  nationalityId: string | null;
  selectedIds: string[];
  onToggle: (id: string) => void;
  colors: CultureTagPickerColors;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  showSearch?: boolean;
  activeColor?: string;
  maxSelections?: number;
  testID?: string;
}

function CultureTagChip({
  culture,
  active,
  disabled,
  onPress,
  colors,
  activeColor,
}: {
  culture: CultureTagChipCulture;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  colors: CultureTagPickerColors;
  activeColor: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.tagChip,
        {
          borderColor: active ? activeColor : colors.border,
          backgroundColor: active ? `${activeColor}22` : colors.surface,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={culture.label}
    >
      <Text style={styles.chipEmoji}>{culture.emoji}</Text>
      <Text style={[styles.chipText, { color: active ? activeColor : colors.text }]}>{culture.label}</Text>
    </Pressable>
  );
}

export function CultureTagPicker({
  cultures,
  nationalityId,
  selectedIds,
  onToggle,
  colors,
  searchQuery = '',
  onSearchQueryChange,
  showSearch = false,
  activeColor = CultureTokens.gold,
  maxSelections,
  testID = 'culture-tag-picker',
}: CultureTagPickerProps) {
  const atMax = maxSelections != null && selectedIds.length >= maxSelections;
  const useAustralianSections = isAustralianNationality(nationalityId);

  const australianSections = useMemo(
    () => (useAustralianSections ? buildAustralianCultureSections(cultures, searchQuery) : []),
    [cultures, searchQuery, useAustralianSections],
  );

  const flatCultures = useMemo(() => {
    if (useAustralianSections) return [];
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return cultures;
    return cultures.filter((culture) => culture.label.toLowerCase().includes(needle));
  }, [cultures, searchQuery, useAustralianSections]);

  return (
    <View style={styles.root} testID={testID}>
      {showSearch && onSearchQueryChange ? (
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder={
              useAustralianSections
                ? 'Search mateship, ANZAC, beach culture…'
                : 'Search culture tags…'
            }
            placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => onSearchQueryChange('')} accessibilityLabel="Clear culture search">
              <Ionicons name="close-circle" size={16} color={colors.textTertiary ?? colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {useAustralianSections ? (
        australianSections.length > 0 ? (
          australianSections.map((section, index) => (
            <View
              key={section.id}
              style={[styles.section, index === 0 ? styles.sectionFirst : null]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.label}</Text>
              </View>
              <View style={styles.tagGrid}>
                {section.cultures.map((culture) => {
                  const active = selectedIds.includes(culture.id);
                  return (
                    <CultureTagChip
                      key={culture.id}
                      culture={culture}
                      active={active}
                      disabled={!active && atMax}
                      onPress={() => onToggle(culture.id)}
                      colors={colors}
                      activeColor={activeColor}
                    />
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No culture tags match your search.
          </Text>
        )
      ) : (
        <View style={styles.tagGrid}>
          {flatCultures.map((culture) => {
            const active = selectedIds.includes(culture.id);
            return (
              <CultureTagChip
                key={culture.id}
                culture={culture}
                active={active}
                disabled={!active && atMax}
                onPress={() => onToggle(culture.id)}
                colors={colors}
                activeColor={activeColor}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  section: { marginTop: Spacing.md },
  sectionFirst: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '500' },
  empty: { fontSize: 13, lineHeight: 18, paddingVertical: 4 },
});