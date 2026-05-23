import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useColors, useIsDark } from '@/hooks/useColors';

export interface CardProps extends ViewProps {
  padding?: number;
  glass?: boolean;
  radius?: number;
  shadow?: string;
  onPress?: () => void;
  style?: any;
  [key: string]: any;
}

export function Card({ padding = 14, glass, radius = 16, onPress, style, children, ...rest }: CardProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const baseStyle = [
    styles.base,
    {
      padding,
      borderRadius: radius,
      backgroundColor: glass
        ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)')
        : colors.surface,
      borderColor: colors.borderLight,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.92 : 1 }]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View {...rest} style={baseStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

export default Card;
