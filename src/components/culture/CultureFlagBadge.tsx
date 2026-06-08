/**
 * Compact flag / culture emoji badge for cards and list rows.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius } from '@/design-system/tokens/theme';

export interface CultureFlagBadgeProps {
  emoji: string;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
}

export function CultureFlagBadge({ emoji, size = 'sm', accessibilityLabel }: CultureFlagBadgeProps) {
  const dim = size === 'md' ? 28 : 22;
  const fontSize = size === 'md' ? 16 : 13;

  return (
    <View
      style={[styles.badge, { width: dim, height: dim, borderRadius: dim / 2 }]}
      accessibilityLabel={accessibilityLabel ?? `Culture flag ${emoji}`}
    >
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});