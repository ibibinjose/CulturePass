import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';

export type PassCardLabelProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  width?: number;
};

export function PassCardLabel({
  title,
  subtitle,
  icon,
  textColor,
  mutedColor,
  accentColor,
  width,
}: PassCardLabelProps) {
  return (
    <View style={[styles.wrap, width ? { width } : null]} accessibilityRole="header">
      <View style={styles.titleRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
          <Ionicons name={icon} size={14} color={accentColor} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, alignSelf: 'stretch' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontFamily: FontFamily.bold, flex: 1 },
  subtitle: { fontSize: 11, fontFamily: FontFamily.medium, lineHeight: 15, paddingLeft: 36 },
});