/**
 * LuxeText — Tiny typography wrapper for the Luxe Heritage 2026 system.
 *
 * Uses LuxeTextStyles + premium Playfair display font for hero moments.
 * Falls back gracefully if the font is not yet loaded.
 *
 * Usage:
 *   <LuxeText variant="displayHero">Belong anywhere.</LuxeText>
 *   <LuxeText variant="title" style={{ color: Luxe.colors.dark.text }}>Title</LuxeText>
 */

import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';

import { LuxeTextStyles, LuxeFontFamily } from '@/design-system/tokens/luxeHeritage';

export type LuxeTextVariant = keyof typeof LuxeTextStyles;

interface LuxeTextProps extends TextProps {
  variant?: LuxeTextVariant;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function LuxeText({
  variant = 'body',
  style,
  children,
  ...rest
}: LuxeTextProps) {
  const baseStyle = LuxeTextStyles[variant] || LuxeTextStyles.body;

  // Ensure the correct font family is applied (Playfair for display variants)
  const mergedStyle = [baseStyle, style] as TextStyle[];

  return (
    <Text style={mergedStyle} {...rest}>
      {children}
    </Text>
  );
}

export default LuxeText;
