import React, { type ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useColors } from '@/hooks/useColors';

interface DestinationStickyBarProps {
  children: ReactNode;
  /** M3 surfaces for My City tab; legacy for hub routes */
  tone?: 'm3' | 'legacy';
}

/**
 * Sticky filter / explore bar shared by city tab, city hub, and culture hub.
 * Adds a subtle border and optional web backdrop for readability while scrolling.
 */
export function DestinationStickyBar({ children, tone = 'legacy' }: DestinationStickyBarProps) {
  const m3Colors = useM3Colors();
  const colors = useColors();
  const bg = tone === 'm3' ? m3Colors.surface : colors.background;
  const border = tone === 'm3' ? m3Colors.outlineVariant : colors.borderLight;

  return (
    <View
      style={[
        s.bar,
        {
          backgroundColor: bg,
          borderBottomColor: border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    zIndex: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
});