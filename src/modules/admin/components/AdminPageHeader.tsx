import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FontFamily } from '@/design-system/tokens/theme';
import { CultureTokens } from '@/design-system/tokens/colors';

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  iconColor = CultureTokens.indigo,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <View style={styles.lead}>
        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: iconColor + '18' }]}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  lead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    maxWidth: 560,
  },
});