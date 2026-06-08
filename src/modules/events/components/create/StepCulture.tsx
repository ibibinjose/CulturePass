import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { CultureIndigenousFields } from '@/components/culture/CultureIndigenousFields';
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
  onCultureIdentityChange: (patch: Partial<Pick<FormData, 'nationalityId' | 'cultureTagIds' | 'indigenousTags' | 'languageTagIds' | 'isIndigenousOwned'>>) => void;
}

export function StepCulture({
  form,
  colors,
  s,
  toggleAccessibilityTag,
  haptic,
  initialNationalityId,
  onCultureTodayToggle,
  onCultureXInviteToggle,
  onCultureIdentityChange,
}: Props) {
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Culture & Discoverability" icon="earth-outline" accent={CultureTokens.indigo} colors={colors} />

      <CultureIndigenousFields
        value={{
          nationalityId: form.nationalityId || undefined,
          cultureIds: form.cultureTagIds,
          indigenousTags: form.indigenousTags,
          languageIds: form.languageTagIds,
          isIndigenousOwned: form.isIndigenousOwned,
        }}
        onChange={(patch) => {
          const next: Parameters<typeof onCultureIdentityChange>[0] = {};
          if (patch.nationalityId !== undefined) next.nationalityId = patch.nationalityId ?? '';
          if (patch.cultureIds !== undefined) next.cultureTagIds = patch.cultureIds;
          if (patch.indigenousTags !== undefined) next.indigenousTags = patch.indigenousTags;
          if (patch.languageIds !== undefined) next.languageTagIds = patch.languageIds;
          if (patch.isIndigenousOwned !== undefined) next.isIndigenousOwned = patch.isIndigenousOwned;
          onCultureIdentityChange(next);
        }}
        colors={{
          text: colors.text,
          textSecondary: colors.textSecondary,
          textTertiary: colors.textTertiary,
          border: colors.border,
          background: colors.background,
          surface: colors.surfaceElevated,
        }}
        initialNationalityId={initialNationalityId}
        onHaptic={haptic}
        testID="event-culture-indigenous-fields"
      />

      <SubmitField label="Accessibility needs">
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
                <Text style={[s.tagLabel, { color: isSelected ? CultureTokens.coral : colors.text }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      <SubmitField label="Culture Today calendar">
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

      <SubmitField label="CultureX — invite Culture Explores">
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