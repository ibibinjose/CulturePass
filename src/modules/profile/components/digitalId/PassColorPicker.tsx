import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import {
  PASS_COLOR_OPTIONS,
  getPassColorTheme,
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

const GRADIENT_PREVIEWS: Record<PassColorVariant, [string, string]> = {
  cyan: ['#00ADEF', '#0072B1'],
  white: ['#F3F4F6', '#E5E7EB'],
  black: ['#1F2937', '#0B0F19'],
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
          const gradColors = GRADIENT_PREVIEWS[opt.key];
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.option,
                active && {
                  backgroundColor: withAlpha(accentColor, 0.1),
                  borderColor: withAlpha(accentColor, 0.38),
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${opt.label} pass colour`}
            >
              {/* Gradient preview bar */}
              <LinearGradient
                colors={gradColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.gradientBar,
                  { borderColor: isWhite ? opt.border : 'transparent', borderWidth: isWhite ? 1 : 0 },
                ]}
              />
              {/* Swatch circle */}
              <View style={styles.swatchRow}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: opt.swatch, borderColor: isWhite ? opt.border : opt.border },
                  ]}
                >
                  {active ? (
                    <Ionicons name="checkmark" size={11} color={isWhite ? '#374151' : '#fff'} />
                  ) : null}
                </View>
                <Text style={[styles.label, { color: active ? textColor : mutedColor }]}>{opt.label}</Text>
              </View>
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
    borderRadius: 16,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 72,
    justifyContent: 'center',
  },
  gradientBar: {
    width: '90%',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontFamily: FontFamily.semibold },
});