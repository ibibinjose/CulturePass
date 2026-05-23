import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { EntryType } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { FormData } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  haptic: () => void;
}

const ENTRY_OPTIONS = [
  { id: 'ticketed' as EntryType, label: 'Ticketed', sub: 'Paid or free tickets required', icon: 'ticket-outline' as const, color: CultureTokens.gold },
  { id: 'free_open' as EntryType, label: 'Free / Open Entry', sub: 'No ticket required to attend', icon: 'people-outline' as const, color: CultureTokens.teal },
] as const;

export function StepEntry({ form, setField, colors, s, haptic }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Choose whether this event requires tickets or is open to everyone.
      </Text>
      <View style={s.entryTypeGrid}>
        {ENTRY_OPTIONS.map(({ id, label, sub, icon, color }) => {
          const isSelected = form.entryType === id;
          return (
            <Pressable
              key={id}
              onPress={() => { haptic(); setField('entryType', id); setField('isFree', id === 'free_open'); }}
              style={({ pressed }) => [
                s.entryCard,
                { borderColor: isSelected ? color : colors.border, backgroundColor: isSelected ? color + '12' : colors.surfaceElevated },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[s.entryIconWrap, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
              </View>
              <Text style={[s.entryCardTitle, { color: isSelected ? color : colors.text }]}>{label}</Text>
              <Text style={[s.entryCardSub, { color: colors.textSecondary }]}>{sub}</Text>
              {isSelected && (
                <View style={[s.entryCheck, { backgroundColor: color }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
