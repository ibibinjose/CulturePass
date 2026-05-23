import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Input } from '@/design-system/ui/Input';
import { DatePickerInput } from '@/design-system/ui/DatePickerInput';
import { useColors } from '@/hooks/useColors';
import { formatDateForCountry } from '@/lib/dateUtils';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import { FormData } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
}

export function StepDatetime({ form, setField, colors, s }: Props) {
  const quickTimes = ['09:00', '12:00', '18:00', '20:00'];
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Date & Time" icon="calendar-outline" accent={CultureTokens.indigo} colors={colors} />
      <SubmitField label="Start date" required>
        <DatePickerInput
          label={undefined}
          value={form.date}
          onChangeDate={(v: any) => setField('date', v)}
          placeholder="Select start date"
          accessibilityLabel="Event start date"
          containerStyle={{ marginBottom: 0 }}
        />
      </SubmitField>
      <SubmitField label="End date" hint="Optional">
        <DatePickerInput
          label={undefined}
          value={form.endDate}
          onChangeDate={(v: any) => setField('endDate', v)}
          placeholder="Select end date"
          accessibilityLabel="Event end date"
          containerStyle={{ marginBottom: 0 }}
        />
      </SubmitField>
      <SubmitField label="Clock times">
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input
              label={undefined}
              value={form.time}
              onChangeText={(v: any) => setField('time', v)}
              placeholder="18:30 — start"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Event start time"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={undefined}
              value={form.endTime}
              onChangeText={(v: any) => setField('endTime', v)}
              placeholder="22:00 — end"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Event end time"
            />
          </View>
        </View>
      </SubmitField>

      <SubmitField label="Quick start times" hint="Tap to set the start time (24h HH:mm).">
        <View style={s.typeGrid}>
          {quickTimes.map((t) => {
            const selected = form.time === t;
            return (
              <Pressable
                key={t}
                onPress={() => setField('time', t)}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    borderColor: selected ? CultureTokens.gold : colors.border,
                    backgroundColor: selected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[s.tagLabel, { color: selected ? CultureTokens.gold : colors.text }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>

      <SubmitField label="Timezone">
        <Input
          label={undefined}
          value={form.timezone}
          onChangeText={(v: any) => setField('timezone', v)}
          placeholder="Australia/Sydney"
          autoCapitalize="none"
          accessibilityLabel="Event timezone"
          containerStyle={{ marginBottom: 0 }}
        />
      </SubmitField>

      {form.date ? (
        <View style={[s.infoBox, { backgroundColor: CultureTokens.teal + '10', borderColor: CultureTokens.teal + '20', marginTop: 12 }]}>
          <Ionicons name="calendar-outline" size={18} color={CultureTokens.teal} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            Displaying as: {formatDateForCountry(form.date, form.country)}
          </Text>
        </View>
      ) : null}

      <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20', marginTop: 8 }]}>
        <Ionicons name="information-circle-outline" size={18} color={CultureTokens.indigo} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          Use DD/MM/YYYY dates and 24-hour time (HH:mm). Example: 18:30.
        </Text>
      </View>

      <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20', marginTop: 8 }]}>
        <Ionicons name="information-circle-outline" size={18} color={CultureTokens.gold} />
        <Text style={[s.infoText, { color: CultureTokens.gold }]}>
          Need more time/date options? Use the event details to add complex schedules.
        </Text>
      </View>
    </SubmitCard>
  );
}
