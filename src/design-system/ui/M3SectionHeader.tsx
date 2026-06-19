import React from 'react';
import { Platform, Pressable, View, StyleSheet, Text } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { M3Typography } from '@/design-system/tokens/typography';
import { pressableA11yRole } from '@/lib/webPressable';

interface M3SectionHeaderProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function M3SectionHeader({
  title,
  subtitle,
  onAction,
  actionLabel = 'See all',
}: M3SectionHeaderProps) {
  const colors = useM3Colors();
  const titleText = title.trim();
  const subtitleText = subtitle?.trim() ?? '';
  const showAction = typeof onAction === 'function';
  const label = (actionLabel ?? 'See all').trim() || 'See all';

  if (!titleText && !subtitleText && !showAction) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        {titleText ? (
          <Text style={[M3Typography.titleLarge, { color: colors.onSurface }]}>
            {titleText}
          </Text>
        ) : null}
        {subtitleText ? (
          <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: titleText ? 2 : 0 }]}>
            {subtitleText}
          </Text>
        ) : null}
      </View>
      {showAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole={pressableA11yRole('link')}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, paddingVertical: 4, paddingLeft: 8 }]}
        >
          <Text style={[styles.actionText, M3Typography.labelLarge, { color: colors.primary }]}>
            {label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingRight: 4,
  },
  textSection: {
    flex: 1,
    paddingRight: 8,
  },
  actionText: {
    fontFamily: FontFamily.semibold,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as object) : null),
  },
});