/**
 * Shared heritage fields — nationality flags, culture tags, indigenous tags, languages.
 * Used by Event, Listing, and Page create wizards.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, Radius, Spacing } from '@/design-system/tokens/theme';
import { Checkbox } from '@/design-system/ui/Checkbox';
import {
  ALL_NATIONALITIES,
  CULTURES,
  getCulturesForNationality,
  searchNationalities,
  type Nationality,
} from '@/constants/cultures';
import { COMMON_LANGUAGES, searchLanguages } from '@/constants/languages';
import {
  INDIGENOUS_OWNED_LABEL,
  INDIGENOUS_TAG_PRESETS,
  searchIndigenousTags,
} from '@/constants/indigenousTags';
import { isAustralianNationality } from '@/constants/australianCultureTags';
import { CultureTagPicker } from '@/components/culture/CultureTagPicker';

export interface CultureIndigenousValue {
  nationalityId?: string;
  cultureIds: string[];
  indigenousTags: string[];
  languageIds: string[];
  isIndigenousOwned?: boolean;
}

export interface CultureIndigenousFieldsProps {
  value: CultureIndigenousValue;
  onChange: (patch: Partial<CultureIndigenousValue>) => void;
  colors: {
    text: string;
    textSecondary: string;
    textTertiary?: string;
    border: string;
    background: string;
    surface?: string;
  };
  showLanguages?: boolean;
  showIndigenous?: boolean;
  showIndigenousOwnedToggle?: boolean;
  initialNationalityId?: string | null;
  onHaptic?: () => void;
  testID?: string;
}

const GLOBAL_NATIONALITY = { id: 'global', label: 'Global / International', emoji: '🌍' };

export function CultureIndigenousFields({
  value,
  onChange,
  colors,
  showLanguages = true,
  showIndigenous = true,
  showIndigenousOwnedToggle = true,
  initialNationalityId,
  onHaptic,
  testID = 'culture-indigenous-fields',
}: CultureIndigenousFieldsProps) {
  const [cultureNationalityId, setCultureNationalityId] = useState<string | null>(
    value.nationalityId ?? initialNationalityId ?? null,
  );
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [cultureSearch, setCultureSearch] = useState('');
  const [indigenousSearch, setIndigenousSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');

  const filteredNationalities = useMemo((): Nationality[] => {
    const q = nationalitySearch.trim().toLowerCase();
    if (!q) return ALL_NATIONALITIES.slice(0, 24);
    return searchNationalities(q).slice(0, 24);
  }, [nationalitySearch]);

  const filteredCultures = useMemo(() => {
    if (cultureNationalityId && cultureNationalityId !== 'global') {
      return getCulturesForNationality(cultureNationalityId);
    }
    if (cultureNationalityId === 'global') {
      return Object.values(CULTURES).slice(0, 24);
    }
    return ALL_NATIONALITIES.slice(0, 6).flatMap((n) => getCulturesForNationality(n.id)).slice(0, 24);
  }, [cultureNationalityId]);

  const indigenousOptions = useMemo(
    () => searchIndigenousTags(indigenousSearch).slice(0, 16),
    [indigenousSearch],
  );

  const languageOptions = useMemo(
    () => (languageSearch.trim() ? searchLanguages(languageSearch).slice(0, 16) : COMMON_LANGUAGES.slice(0, 16)),
    [languageSearch],
  );

  const suggestedLanguageIds = useMemo(() => {
    const ids = new Set<string>(['eng']);
    value.cultureIds.forEach((cid) => {
      const culture = CULTURES[cid];
      if (culture?.primaryLanguageId) ids.add(culture.primaryLanguageId);
    });
    return ids;
  }, [value.cultureIds]);

  const haptic = () => onHaptic?.();

  const selectNationality = (id: string) => {
    haptic();
    const next = cultureNationalityId === id ? null : id;
    setCultureNationalityId(next);
    setCultureSearch('');
    onChange({ nationalityId: next ?? undefined });
  };

  const toggleCulture = (id: string) => {
    haptic();
    const next = value.cultureIds.includes(id)
      ? value.cultureIds.filter((c) => c !== id)
      : [...value.cultureIds, id];
    onChange({ cultureIds: next });
    if (!value.nationalityId && CULTURES[id]) {
      onChange({ nationalityId: CULTURES[id].nationalityId, cultureIds: next });
      setCultureNationalityId(CULTURES[id].nationalityId);
    }
  };

  const toggleIndigenous = (id: string) => {
    haptic();
    const label = INDIGENOUS_TAG_PRESETS.find((t) => t.id === id)?.label ?? id;
    const stored = value.indigenousTags.includes(id)
      ? value.indigenousTags.filter((t) => t !== id && t !== label)
      : [...value.indigenousTags, id];
    onChange({ indigenousTags: stored, isIndigenousOwned: stored.length > 0 ? true : value.isIndigenousOwned });
  };

  const toggleLanguage = (id: string) => {
    haptic();
    onChange({
      languageIds: value.languageIds.includes(id)
        ? value.languageIds.filter((l) => l !== id)
        : [...value.languageIds, id],
    });
  };

  const surface = colors.surface ?? colors.background;

  return (
    <View style={styles.root} testID={testID}>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Help people discover your listing with origin flags, culture tags, and First Nations identifiers.
      </Text>

      {/* Nationality / flags */}
      <Text style={[styles.label, { color: colors.text }]}>Origin / background</Text>
      <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: surface }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={nationalitySearch}
          onChangeText={setNationalitySearch}
          placeholder="e.g. Indian, Chinese, Māori…"
          placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable
          onPress={() => selectNationality(GLOBAL_NATIONALITY.id)}
          style={[
            styles.natChip,
            {
              borderColor: cultureNationalityId === GLOBAL_NATIONALITY.id ? CultureTokens.violet : colors.border,
              backgroundColor: cultureNationalityId === GLOBAL_NATIONALITY.id ? CultureTokens.violet + '18' : surface,
            },
          ]}
        >
          <Text style={styles.chipEmoji}>{GLOBAL_NATIONALITY.emoji}</Text>
          <Text style={[styles.chipText, { color: colors.text }]}>{GLOBAL_NATIONALITY.label}</Text>
        </Pressable>
        {filteredNationalities.map((n) => {
          const active = cultureNationalityId === n.id;
          return (
            <Pressable
              key={n.id}
              onPress={() => selectNationality(n.id)}
              style={[
                styles.natChip,
                {
                  borderColor: active ? CultureTokens.indigo : colors.border,
                  backgroundColor: active ? CultureTokens.indigo + '18' : surface,
                },
              ]}
              accessibilityLabel={n.label}
            >
              <Text style={styles.chipEmoji}>{n.emoji}</Text>
              <Text style={[styles.chipText, { color: active ? CultureTokens.indigo : colors.text }]}>{n.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Culture tags */}
      <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Culture tags</Text>
      {isAustralianNationality(cultureNationalityId) ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Australian culture tags are grouped by values, lifestyle, heritage, and expression.
        </Text>
      ) : null}
      <CultureTagPicker
        cultures={filteredCultures}
        nationalityId={cultureNationalityId}
        selectedIds={value.cultureIds}
        onToggle={toggleCulture}
        colors={{
          text: colors.text,
          textSecondary: colors.textSecondary,
          textTertiary: colors.textTertiary,
          border: colors.border,
          surface,
        }}
        searchQuery={cultureSearch}
        onSearchQueryChange={setCultureSearch}
        showSearch={isAustralianNationality(cultureNationalityId) || filteredCultures.length > 16}
        testID={`${testID}-culture-tags`}
      />

      {/* Indigenous tags */}
      {showIndigenous ? (
        <>
          <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Indigenous tags</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            First Nations nations, NAIDOC, Māori groups, and Indigenous-owned identifiers.
          </Text>
          <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: surface, marginTop: 8 }]}>
            <Ionicons name="leaf-outline" size={16} color={CultureTokens.teal} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={indigenousSearch}
              onChangeText={setIndigenousSearch}
              placeholder="Search Gadigal, Māori, NAIDOC…"
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
            />
          </View>
          <View style={styles.tagGrid}>
            {indigenousOptions.map((t) => {
              const active = value.indigenousTags.includes(t.id) || value.indigenousTags.includes(t.label);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => toggleIndigenous(t.id)}
                  style={[
                    styles.tagChip,
                    {
                      borderColor: active ? CultureTokens.teal : colors.border,
                      backgroundColor: active ? CultureTokens.teal + '22' : surface,
                    },
                  ]}
                >
                  <Text style={styles.chipEmoji}>{t.emoji}</Text>
                  <Text style={[styles.chipText, { color: active ? CultureTokens.teal : colors.text }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {showIndigenousOwnedToggle ? (
            <View style={{ marginTop: Spacing.sm }}>
              <Checkbox
                checked={!!value.isIndigenousOwned}
                onToggle={() => onChange({ isIndigenousOwned: !value.isIndigenousOwned })}
                color={CultureTokens.teal}
                label={
                  <Text style={[styles.chipText, { color: colors.text, flex: 1 }]}>{INDIGENOUS_OWNED_LABEL}</Text>
                }
              />
            </View>
          ) : null}
        </>
      ) : null}

      {/* Languages */}
      {showLanguages ? (
        <>
          <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Languages</Text>
          <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: surface, marginBottom: 8 }]}>
            <Ionicons name="language-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={languageSearch}
              onChangeText={setLanguageSearch}
              placeholder="Search languages…"
              placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
            />
          </View>
          <View style={styles.tagGrid}>
            {languageOptions.map((l) => {
              const active = value.languageIds.includes(l.id);
              const suggested = suggestedLanguageIds.has(l.id) && !active;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => toggleLanguage(l.id)}
                  style={[
                    styles.tagChip,
                    {
                      borderColor: active ? CultureTokens.teal : suggested ? CultureTokens.indigo + '80' : colors.border,
                      backgroundColor: active ? CultureTokens.teal + '22' : suggested ? CultureTokens.indigo + '10' : surface,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? CultureTokens.teal : colors.text }]}>{l.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  note: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  chipRow: { gap: 8, paddingVertical: 8 },
  natChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
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
});