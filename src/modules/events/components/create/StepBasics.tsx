import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { EVENT_CATEGORIES, type EventCategory } from '@/constants/eventCategories';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import { FormData, EVENT_TYPES, EVENT_TYPE_GROUPS, VIBE_OPTIONS, AUDIENCE_OPTIONS } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  stepError: string | null;
  haptic: () => void;
}

const VISIBILITY_OPTIONS: {
  id: FormData['visibility'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'public', label: 'Public', icon: 'globe-outline' },
  { id: 'private', label: 'Private', icon: 'lock-closed-outline' },
  { id: 'approval_required', label: 'Approval Required', icon: 'shield-checkmark-outline' },
];

const VIBE_ICONS: Record<Exclude<FormData['vibe'], ''>, keyof typeof Ionicons.glyphMap> = {
  chill: 'cafe-outline',
  party: 'musical-notes-outline',
  formal: 'business-outline',
  family: 'people-outline',
  spiritual: 'flame-outline',
  networking: 'chatbubbles-outline',
};

const AUDIENCE_ICONS: Record<Exclude<FormData['audience'], ''>, keyof typeof Ionicons.glyphMap> = {
  students: 'school-outline',
  professionals: 'briefcase-outline',
  families: 'heart-outline',
  tourists: 'airplane-outline',
  mixed: 'people-circle-outline',
};

function eventTypeIcon(id: EventCategory | 'other'): keyof typeof Ionicons.glyphMap {
  if (id === 'other') return 'apps-outline';
  const c = EVENT_CATEGORIES.find((x) => x.id === id);
  return (c?.icon ?? 'ellipse-outline') as keyof typeof Ionicons.glyphMap;
}

export function StepBasics({ form, setField, colors, s, stepError, haptic }: Props) {
  const typeMap = new Map(EVENT_TYPES.map((type) => [type.id, type]));

  const chipShell = (isSelected: boolean) => ({
    borderColor: isSelected ? CultureTokens.indigo : colors.border,
    backgroundColor: isSelected ? `${CultureTokens.indigo}14` : colors.surfaceElevated,
  });

  const chipLabelColor = (isSelected: boolean) => (isSelected ? CultureTokens.indigo : colors.text);
  const chipIconColor = (isSelected: boolean) => (isSelected ? CultureTokens.indigo : colors.textSecondary);

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Basic Info" icon="information-circle-outline" accent={CultureTokens.indigo} colors={colors} />
      
      <SubmitField label="Visibility">
        <View style={s.typeGrid}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const isSelected = form.visibility === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  s.typeChip,
                  chipShell(isSelected),
                  pressed ? { opacity: 0.88 } : null,
                ]}
                onPress={() => {
                  haptic();
                  setField('visibility', opt.id);
                }}
                accessibilityRole="radio"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons name={opt.icon} size={18} color={chipIconColor(isSelected)} accessibilityElementsHidden />
                <Text style={[TextStyles.labelSemibold, { color: chipLabelColor(isSelected) }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      <SubmitField label="Event Title" required>
        <Input
          value={form.title}
          onChangeText={(v: string) => setField('title', v)}
          placeholder="e.g. Onam Festival Sydney 2026"
          autoCapitalize="words"
          maxLength={120}
          accessibilityLabel="Event title"
        />
      </SubmitField>

      <SubmitField label="Description" required error={stepError && !form.description.trim() ? stepError : undefined}>
        <TextInput
          value={form.description}
          onChangeText={(v: string) => setField('description', v)}
          placeholder="Tell people what this event is about…"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={1000}
          textAlignVertical="top"
          accessibilityLabel="Event description"
          style={[s.descriptionInput, {
            color: colors.text,
            backgroundColor: colors.surfaceElevated,
            borderColor: stepError && !form.description.trim() ? colors.error : colors.border,
          }]}
        />
      </SubmitField>

      <SubmitField label="Event Type">
        <View style={s.typeGroupStack}>
          {EVENT_TYPE_GROUPS.map((group) => (
            <View key={group.id} style={s.typeGroup}>
              <Text style={[s.typeGroupTitle, { color: colors.textSecondary }]}>{group.label}</Text>
              <View style={s.typeGrid}>
                {group.types.map((typeId) => {
                  const type = typeMap.get(typeId);
                  if (!type) return null;
                  const isSelected = form.eventType === type.id;

                  return (
                    <Pressable
                      key={type.id}
                      style={({ pressed }) => [
                        s.typeChip,
                        chipShell(isSelected),
                        pressed ? { opacity: 0.88 } : null,
                      ]}
                      onPress={() => {
                        haptic();
                        setField('eventType', type.id);
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel={type.label}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Ionicons
                        name={eventTypeIcon(type.id)}
                        size={18}
                        color={chipIconColor(isSelected)}
                        accessibilityElementsHidden
                      />
                      <Text
                        style={[
                          TextStyles.labelSemibold,
                          { color: chipLabelColor(isSelected) },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </SubmitField>

      <SubmitField label="Vibe" hint="Optional">
        <View style={s.typeGrid}>
          {VIBE_OPTIONS.map((opt) => {
            const isSelected = form.vibe === opt.id;
            const icon = VIBE_ICONS[opt.id as Exclude<FormData['vibe'], ''>];
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  s.typeChip,
                  chipShell(isSelected),
                  pressed ? { opacity: 0.88 } : null,
                ]}
                onPress={() => {
                  haptic();
                  setField('vibe', isSelected ? '' : opt.id);
                }}
                accessibilityRole="radio"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons name={icon} size={18} color={chipIconColor(isSelected)} accessibilityElementsHidden />
                <Text style={[TextStyles.labelSemibold, { color: chipLabelColor(isSelected) }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      <SubmitField label="Audience" hint="Optional">
        <View style={s.typeGrid}>
          {AUDIENCE_OPTIONS.map((opt) => {
            const isSelected = form.audience === opt.id;
            const icon = AUDIENCE_ICONS[opt.id as Exclude<FormData['audience'], ''>];
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  s.typeChip,
                  chipShell(isSelected),
                  pressed ? { opacity: 0.88 } : null,
                ]}
                onPress={() => {
                  haptic();
                  setField('audience', isSelected ? '' : opt.id);
                }}
                accessibilityRole="radio"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons name={icon} size={18} color={chipIconColor(isSelected)} accessibilityElementsHidden />
                <Text style={[TextStyles.labelSemibold, { color: chipLabelColor(isSelected) }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>
    </SubmitCard>
  );
}
