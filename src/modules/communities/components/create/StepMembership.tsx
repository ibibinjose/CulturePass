import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormData, JOIN_MODES } from './types';
import { CommunityCreateStyles } from './styles';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
  haptic: () => void;
}

export function StepMembership({ form, setField, colors, s, haptic }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        How should new members be able to join your community?
      </Text>

      <View style={s.joinModeGroup}>
        {JOIN_MODES.map((mode) => {
          const active = form.joinMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => { haptic(); setField('joinMode', mode.value); }}
              style={[
                s.joinModeCard,
                { 
                  backgroundColor: active ? CultureTokens.indigo + '10' : colors.surfaceElevated,
                  borderColor: active ? CultureTokens.indigo : colors.border
                }
              ]}
            >
              <View style={[s.joinModeIcon, { backgroundColor: active ? CultureTokens.indigo : colors.borderLight }]}>
                <Ionicons name={mode.icon as keyof typeof Ionicons.glyphMap} size={22} color={active ? '#fff' : colors.textSecondary} />
              </View>
              <View style={s.joinModeContent}>
                <Text style={[s.joinModeTitle, { color: active ? colors.text : colors.textSecondary }]}>
                  {mode.label}
                </Text>
                <Text style={[s.joinModeSub, { color: colors.textTertiary }]}>
                  {mode.sub}
                </Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={24} color={CultureTokens.indigo} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[s.infoBox, { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '30', marginTop: 24 }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          Communities are {'"'}Public{'"'} by default in Discover, but you can control who enters via the join mode.
        </Text>
      </View>
    </View>
  );
}
