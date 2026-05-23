import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormData } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';
import { useColors } from '@/hooks/useColors';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
}

export function StepSocial({ form, setField, colors, s }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Connect your community{"'"}s online presence.
      </Text>

      <Field label="Website" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            placeholder="https://yourcommunity.com"
            placeholderTextColor={colors.textTertiary}
            value={form.website}
            onChangeText={(v) => setField('website', v)}
            keyboardType="url"
          />
        </View>
      </Field>

      <Field label="Instagram" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="logo-instagram" size={18} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            placeholder="@handle"
            placeholderTextColor={colors.textTertiary}
            value={form.instagram}
            onChangeText={(v) => setField('instagram', v)}
          />
        </View>
      </Field>

      <Field label="Facebook / Twitter" colors={colors}>
        <View style={s.row}>
          <View style={[s.natSearchWrap, { flex: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="logo-facebook" size={16} color={colors.textSecondary} />
            <TextInput
              style={[s.natSearchInput, { color: colors.text }]}
              placeholder="FB Page"
              placeholderTextColor={colors.textTertiary}
              value={form.facebook}
              onChangeText={(v) => setField('facebook', v)}
            />
          </View>
          <View style={[s.natSearchWrap, { flex: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="logo-twitter" size={16} color={colors.textSecondary} />
            <TextInput
              style={[s.natSearchInput, { color: colors.text }]}
              placeholder="Twitter"
              placeholderTextColor={colors.textTertiary}
              value={form.twitter}
              onChangeText={(v) => setField('twitter', v)}
            />
          </View>
        </View>
      </Field>
    </View>
  );
}
