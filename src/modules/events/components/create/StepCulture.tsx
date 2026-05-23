import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { ALL_NATIONALITIES, getCulturesForNationality, CULTURES, type Nationality } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';
import { FormData, ACCESSIBILITY_OPTIONS } from './types';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import type { CreateStyles } from './styles';
import { Checkbox } from '@/design-system/ui/Checkbox';
import { CULTURE_TODAY_EVENT_TAG, CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';

interface Props {
  form: FormData;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  toggleCultureTag: (id: string) => void;
  toggleLanguageTag: (id: string) => void;
  toggleAccessibilityTag: (id: string) => void;
  haptic: () => void;
  initialNationalityId?: string | null;
  onCultureTodayToggle: () => void;
  onCultureXInviteToggle: () => void;
}

export function StepCulture({
  form,
  colors,
  s,
  toggleCultureTag,
  toggleLanguageTag,
  toggleAccessibilityTag,
  haptic,
  initialNationalityId,
  onCultureTodayToggle,
  onCultureXInviteToggle,
}: Props) {
  const [cultureNationalityId, setCultureNationalityId] = useState<string | null>(initialNationalityId ?? null);
  const [nationalitySearch, setNationalitySearch] = useState('');

  const filteredNationalities = useMemo((): Nationality[] => {
    const q = nationalitySearch.trim().toLowerCase();
    if (!q) return ALL_NATIONALITIES.slice(0, 30);
    return ALL_NATIONALITIES.filter(
      (n) => n.label.toLowerCase().includes(q) || n.id.includes(q),
    );
  }, [nationalitySearch]);

  const filteredCultures = useMemo(() => {
    if (cultureNationalityId) return getCulturesForNationality(cultureNationalityId);
    return ALL_NATIONALITIES.slice(0, 8)
      .flatMap((n) => getCulturesForNationality(n.id))
      .slice(0, 24);
  }, [cultureNationalityId]);

  const suggestedLanguageIds = useMemo(() => {
    const ids = new Set<string>(['eng']);
    form.cultureTagIds.forEach((cid) => {
      const culture = CULTURES[cid];
      if (culture?.primaryLanguageId) ids.add(culture.primaryLanguageId);
    });
    return ids;
  }, [form.cultureTagIds]);

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Culture & Discoverability" icon="earth-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Tag this event so people from specific cultures can discover it. Search for your community (e.g. Indian, Chinese, Greek) to see relevant tags.
      </Text>

      {/* ── 1. Nationality search ─────────────────────────────────────────── */}
      <SubmitField label="1. Select Origin / Background">
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            value={nationalitySearch}
            onChangeText={setNationalitySearch}
            placeholder="e.g. Indian, Chinese, Greek…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
          />
          {nationalitySearch.length > 0 && (
            <Pressable onPress={() => setNationalitySearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
        >
          {filteredNationalities.map((n) => {
            const isSelected = cultureNationalityId === n.id;
            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  haptic();
                  setCultureNationalityId(isSelected ? null : n.id);
                }}
                style={({ pressed }) => [
                  s.natChip,
                  {
                    borderColor: isSelected ? CultureTokens.indigo : colors.border,
                    backgroundColor: isSelected ? CultureTokens.indigo + '18' : colors.background,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={n.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={s.natEmoji}>{n.emoji}</Text>
                <Text style={[s.natLabel, { color: isSelected ? CultureTokens.indigo : colors.text }]}>{n.label}</Text>
                {isSelected && <Ionicons name="checkmark-circle" size={14} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>
        {cultureNationalityId && (
          <Text style={[s.natHint, { color: colors.textSecondary }]}>
            Showing cultures for {ALL_NATIONALITIES.find((n) => n.id === cultureNationalityId)?.label ?? cultureNationalityId}
          </Text>
        )}
      </SubmitField>

      {/* ── 2. Culture tags ───────────────────────────────────────────────── */}
      <SubmitField label="2. Culture Tags">
        {filteredCultures.length === 0 ? (
          <Text style={[s.natHint, { color: colors.textSecondary }]}>No cultures found. Try a different origin.</Text>
        ) : (
          <View style={s.tagGrid}>
            {filteredCultures.map((c) => {
              const isSelected = form.cultureTagIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    s.tagChip,
                    { borderColor: isSelected ? CultureTokens.gold : colors.border, backgroundColor: isSelected ? CultureTokens.gold + '22' : colors.background },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleCultureTag(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={c.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text style={s.tagEmoji}>{c.emoji}</Text>
                  <Text style={[s.tagLabel, { color: isSelected ? CultureTokens.gold : colors.text }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </SubmitField>

      {/* ── 3. Language tags ──────────────────────────────────────────────── */}
      <SubmitField label="3. Language Tags">
        {form.cultureTagIds.length > 0 && suggestedLanguageIds.size > 1 && (
          <Text style={[s.natHint, { color: CultureTokens.indigo, marginBottom: 8 }]}>
            Suggested languages are highlighted based on your culture selections.
          </Text>
        )}
        <View style={s.tagGrid}>
          {COMMON_LANGUAGES.map((l) => {
            const isSelected = form.languageTagIds.includes(l.id);
            const isSuggested = suggestedLanguageIds.has(l.id) && !isSelected;
            return (
              <Pressable
                key={l.id}
                style={({ pressed }) => [
                  s.tagChip,
                  {
                    borderColor: isSelected
                      ? CultureTokens.teal
                      : isSuggested
                        ? CultureTokens.indigo + '80'
                        : colors.border,
                    backgroundColor: isSelected
                      ? CultureTokens.teal + '22'
                      : isSuggested
                        ? CultureTokens.indigo + '10'
                        : colors.background,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleLanguageTag(l.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={l.name}
                accessibilityState={{ checked: isSelected }}
              >
                {isSuggested && <Ionicons name="sparkles" size={12} color={CultureTokens.indigo} />}
                <Text style={[
                  s.tagLabel,
                  { color: isSelected ? CultureTokens.teal : isSuggested ? CultureTokens.indigo : colors.text },
                ]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      {/* ── 4. Accessibility tags ─────────────────────────────────────────── */}
      <SubmitField label="4. Accessibility Needs">
        <Text style={[s.natHint, { color: colors.textSecondary, marginBottom: 8 }]}>
          Help attendees find accessible events.
        </Text>
        <View style={s.tagGrid}>
          {ACCESSIBILITY_OPTIONS.map((opt) => {
            const isSelected = form.accessibilityIds.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  s.tagChip,
                  {
                    borderColor: isSelected ? CultureTokens.coral : colors.border,
                    backgroundColor: isSelected ? CultureTokens.coral + '22' : colors.background,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleAccessibilityTag(opt.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={opt.label}
                accessibilityState={{ checked: isSelected }}
              >
                <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={14} color={isSelected ? CultureTokens.coral : colors.text} style={{ marginRight: 4 }} />
                <Text style={[
                  s.tagLabel,
                  { color: isSelected ? CultureTokens.coral : colors.text },
                ]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      <SubmitField label="5. Culture Today calendar">
        <Text style={[s.natHint, { color: colors.textSecondary, marginBottom: 10 }]}>
          When enabled, this event is tagged “{CULTURE_TODAY_EVENT_TAG}” and can appear on the Culture Today day page when the event date matches that calendar day (month and day).
        </Text>
        <Checkbox
          checked={form.cultureTodayPromo}
          onToggle={() => onCultureTodayToggle()}
          color={CultureTokens.indigo}
          label={
            <Text style={[s.tagLabel, { color: colors.text, flex: 1 }]}>
              Promote on Culture Today (tagged event)
            </Text>
          }
        />
      </SubmitField>

      <SubmitField label="6. CultureX — invite Culture Explores">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: CultureTokens.teal + '55',
            backgroundColor: CultureTokens.teal + '12',
          }}
        >
          <Ionicons name="planet-outline" size={22} color={CultureTokens.teal} />
          <Text style={[s.tagLabel, { color: colors.text, flex: 1, lineHeight: 20 }]}>
            CultureX is where curious locals, students, and travellers pick cultures and festivals to explore. Turn this on to welcome that crowd.
          </Text>
        </View>
        <Text style={[s.natHint, { color: colors.textSecondary, marginBottom: 10 }]}>
          Adds a discovery tag (“{CULTUREX_EXPLORES_CULTURE_TAG}”) so your event shows up when people filter for hosts inviting Culture Explores.
          {form.entryType === 'ticketed'
            ? ' Ticketed events: they can discover you and buy tickets like anyone else.'
            : ' Free / open events: they can find you and attend without a ticket flow.'}
        </Text>
        <Checkbox
          checked={form.cultureXInvite}
          onToggle={() => onCultureXInviteToggle()}
          color={CultureTokens.teal}
          label={
            <Text style={[s.tagLabel, { color: colors.text, flex: 1 }]}>
              Yes — invite Culture Explores (CultureX) to this event
            </Text>
          }
        />
      </SubmitField>
    </SubmitCard>
  );
}
