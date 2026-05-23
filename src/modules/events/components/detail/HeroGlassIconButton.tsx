/**
 * Compact hero control with consistent contrast on web/iOS/Android.
 */

import React from 'react';
import { Pressable, StyleSheet, Platform, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from '@/design-system/ui/GlassView';
import { shadows } from '@/design-system/tokens/theme';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroGlassIconButton({ children, style, ...pressableProps }: Props) {
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [
        styles.hit,
        { transform: [{ scale: pressed ? 0.94 : 1 }] },
        style,
      ]}
    >
      <GlassView
        intensity={40}
        colorScheme="dark"
        style={styles.glass}
        tintColor="rgba(15, 23, 42, 0.4)"
      >
        {children}
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: shadows.medium,
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } as object,
    }),
  },
  glass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
