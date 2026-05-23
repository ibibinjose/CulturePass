import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormData, COMMUNITY_CATEGORIES } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
  haptic: () => void;
}

export function StepBasics({ form, setField, colors, s, haptic }: Props) {
  return (
    <View style={s.fields}>
      <Field label="Community Name" colors={colors}>
        <TextInput
          style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          placeholder="e.g. Sydney Malayali Association"
          placeholderTextColor={colors.textTertiary}
          value={form.name}
          onChangeText={(v) => setField('name', v)}
        />
      </Field>

      <Field label="Category" colors={colors}>
        <View style={s.categoryGrid}>
          {COMMUNITY_CATEGORIES.map((cat) => {
            const active = form.category === cat.value;
            return (
              <Pressable
                key={cat.value}
                onPress={() => { haptic(); setField('category', cat.value); }}
                style={[
                  s.categoryCard,
                  { 
                    backgroundColor: active ? CultureTokens.indigo + '15' : colors.surfaceElevated,
                    borderColor: active ? CultureTokens.indigo : colors.border
                  }
                ]}
              >
                <View style={[s.categoryIconWrap, { backgroundColor: active ? CultureTokens.indigo : colors.borderLight }]}>
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={20} color={active ? '#fff' : colors.textSecondary} />
                </View>
                <Text style={[s.categoryLabel, { color: active ? colors.text : colors.textSecondary }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="About the Community" colors={colors}>
        <TextInput
          style={[s.descriptionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          placeholder="What is this community about? Its goals, values, and soul..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>
    </View>
  );
}
