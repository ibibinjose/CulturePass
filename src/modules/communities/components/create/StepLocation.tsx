import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { CommunityFormData } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
}

export function StepLocation({ form, setField, colors, s }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Tell us where your community is based. This helps local members discover you.
      </Text>

      <Field label="City" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            placeholder="e.g. Sydney"
            placeholderTextColor={colors.textTertiary}
            value={form.city}
            onChangeText={(v) => setField('city', v)}
          />
        </View>
      </Field>

      <Field label="Country" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            placeholder="e.g. Australia"
            placeholderTextColor={colors.textTertiary}
            value={form.country}
            onChangeText={(v) => setField('country', v)}
          />
        </View>
      </Field>

      <View style={[s.infoBox, { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '30' }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          You can add more specific chapter cities later in your community settings.
        </Text>
      </View>
    </View>
  );
}
