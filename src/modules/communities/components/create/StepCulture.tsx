import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { ALL_NATIONALITIES, getCulturesForNationality } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';
import { CommunityFormData } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
  haptic: () => void;
}

export function StepCulture({ form, setField, colors, s, haptic }: Props) {
  const [nationalitySearch, setNationalitySearch] = useState('');

  const filteredNationalities = useMemo(() => {
    const q = nationalitySearch.trim().toLowerCase();
    if (!q) return ALL_NATIONALITIES.slice(0, 20);
    return ALL_NATIONALITIES.filter(
      (n) => n.label.toLowerCase().includes(q) || n.id.includes(q),
    );
  }, [nationalitySearch]);

  const filteredCultures = useMemo(() => {
    if (form.nationalityId) return getCulturesForNationality(form.nationalityId);
    return ALL_NATIONALITIES.slice(0, 5)
      .flatMap((n) => getCulturesForNationality(n.id))
      .slice(0, 20);
  }, [form.nationalityId]);

  const toggleCultureTag = (id: string) => {
    haptic();
    const current = form.cultureIds;
    setField('cultureIds', current.includes(id) 
      ? current.filter(c => c !== id) 
      : [...current, id]
    );
  };

  const toggleLanguageTag = (id: string) => {
    haptic();
    const current = form.languageIds;
    setField('languageIds', current.includes(id) 
      ? current.filter(l => l !== id) 
      : [...current, id]
    );
  };

  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Communities on CulturePass are built on cultural souls. Select your community{"'"}s heritage and language.
      </Text>

      {/* ── 1. Origin ───────────────────────────────────────────────────── */}
      <Field label="1. Primary Background / Origin" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            value={nationalitySearch}
            onChangeText={setNationalitySearch}
            placeholder="Search e.g. Indian, Italian, Ethiopian…"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {filteredNationalities.map((n) => {
            const active = form.nationalityId === n.id;
            return (
              <Pressable
                key={n.id}
                onPress={() => { haptic(); setField('nationalityId', active ? '' : n.id); }}
                style={[
                  s.natChip,
                  { borderColor: active ? CultureTokens.indigo : colors.border, backgroundColor: active ? CultureTokens.indigo + '15' : colors.background }
                ]}
              >
                <Text style={s.natEmoji}>{n.emoji}</Text>
                <Text style={[s.natLabel, { color: active ? CultureTokens.indigo : colors.text }]}>{n.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>

      {/* ── 2. Cultures ──────────────────────────────────────────────────── */}
      <Field label="2. Heritage & Culture" colors={colors}>
        <View style={s.tagGrid}>
          {filteredCultures.map((c) => {
            const active = form.cultureIds.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCultureTag(c.id)}
                style={[
                  s.tagChip,
                  { borderColor: active ? CultureTokens.gold : colors.border, backgroundColor: active ? CultureTokens.gold + '15' : colors.background }
                ]}
              >
                <Text style={s.tagEmoji}>{c.emoji}</Text>
                <Text style={[s.tagLabel, { color: active ? CultureTokens.gold : colors.text }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {/* ── 3. Languages ─────────────────────────────────────────────────── */}
      <Field label="3. Primary Languages" colors={colors}>
        <View style={s.tagGrid}>
          {COMMON_LANGUAGES.map((l) => {
            const active = form.languageIds.includes(l.id);
            return (
              <Pressable
                key={l.id}
                onPress={() => toggleLanguageTag(l.id)}
                style={[
                  s.tagChip,
                  { borderColor: active ? CultureTokens.teal : colors.border, backgroundColor: active ? CultureTokens.teal + '15' : colors.background }
                ]}
              >
                <Text style={[s.tagLabel, { color: active ? CultureTokens.teal : colors.text }]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
    </View>
  );
}
