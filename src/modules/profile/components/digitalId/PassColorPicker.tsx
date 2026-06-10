import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import {
  PASS_COLOR_OPTIONS,
  type PassColorVariant,
} from '@/modules/profile/components/digitalId/passCardUtils';

export type PassColorPickerProps = {
  value: PassColorVariant;
  onChange: (variant: PassColorVariant) => void;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
};

export function PassColorPicker({
  value,
  onChange,
  accentColor,
  backgroundColor,
  borderColor,
  textColor,
  mutedColor,
}: PassColorPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="color-palette-outline" size={16} color={accentColor} />
        <Text style={[styles.title, { color: textColor }]}>Pass colour</Text>
      </View>
      <View style={[styles.row, { backgroundColor, borderColor }]} accessibilityRole="radiogroup" accessibilityLabel="Pass colour">
        {PASS_COLOR_OPTIONS.map((opt) => {
          const active = value === opt.key;
          const isWhite = opt.key === 'white';
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.option,
                active && { backgroundColor: withAlpha(accentColor, 0.1), borderColor: withAlpha(accentColor, 0.35) },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${opt.label} pass colour`}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: opt.swatch,
                    borderColor: isWhite ? opt.border : opt.border,
                  },
                ]}
              />
              <Text style={[styles.label, { color: active ? textColor : mutedColor }]}>{opt.label}</Text>
              {active ? <Ionicons name="checkmark-circle" size={14} color={accentColor} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontFamily: FontFamily.semibold },
  row: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  label: { fontSize: 11, fontFamily: FontFamily.semibold },
});