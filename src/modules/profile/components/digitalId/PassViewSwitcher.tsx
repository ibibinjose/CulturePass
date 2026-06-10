import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

export type PassViewKey = 'business' | 'lanyard' | 'event';

type PassViewOption = {
  key: PassViewKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: PassViewOption[] = [
  { key: 'business', label: 'Business', icon: 'id-card-outline' },
  { key: 'lanyard', label: 'Lanyard', icon: 'ribbon-outline' },
  { key: 'event', label: 'Event', icon: 'ticket-outline' },
];

export type PassViewSwitcherProps = {
  value: PassViewKey;
  onChange: (key: PassViewKey) => void;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
};

export function PassViewSwitcher({
  value,
  onChange,
  accentColor,
  backgroundColor,
  borderColor,
  textColor,
  mutedColor,
}: PassViewSwitcherProps) {
  return (
    <View style={[styles.wrap, { backgroundColor, borderColor }]} accessibilityRole="tablist">
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.btn,
              active && { backgroundColor: withAlpha(accentColor, 0.12), borderColor: withAlpha(accentColor, 0.35) },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} pass`}
          >
            <Ionicons name={opt.icon} size={14} color={active ? accentColor : mutedColor} />
            <Text style={[styles.label, { color: active ? textColor : mutedColor }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  label: { fontSize: 11, fontFamily: FontFamily.semibold },
});