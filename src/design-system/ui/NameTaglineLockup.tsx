import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { useLayout } from '@/hooks/useLayout';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily } from '@/design-system/tokens/theme';

export interface NameTaglineLockupProps {
  /** The prominent name (will be rendered uppercase, bold, display size) */
  name: string;
  /** The short elegant tagline / one-liner below the name */
  tagline?: string;
  /** Override color for the name (defaults to coral for editorial pop, or onSurface) */
  nameColor?: string;
  /** Override color for the tagline */
  taglineColor?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Visual size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Extra margin below the whole lockup */
  marginBottom?: number;
  /** Control wrapping on the big name (default 2). Set to 1 for strict one-line usage (e.g. sidebar brand). */
  nameNumberOfLines?: number;
  /** Optional extra style overrides for the name Text (use sparingly) */
  nameStyle?: any;
  /** Override the name font size completely (useful for compact areas like sidebars) */
  nameFontSize?: number;
  /** Override the tagline font size (useful for compact areas like sidebars) */
  taglineFontSize?: number;
}

/**
 * NameTaglineLockup
 *
 * Premium editorial treatment for prominent identities across the app:
 *   - Big, bold, uppercase NAME (inspired by iconic display typography like the Jony Ive example)
 *   - Delicate, smaller, sentence-case TAGLINE underneath
 *
 * Use for:
 *   - Host / Creator / Instructor public profiles (especially Classes & Fitness)
 *   - Artist, Business, Venue, Community detail headers
 *   - Any "Name + one-liner" hero moment
 *
 * This gives a consistent, high-end, human, name-first feel everywhere.
 */
export function NameTaglineLockup({
  name,
  tagline,
  nameColor,
  taglineColor,
  align = 'left',
  size = 'lg',
  marginBottom = 8,   // reduced default to feel less crowded
  nameNumberOfLines = 2,
  nameStyle,
  nameFontSize,
  taglineFontSize,
}: NameTaglineLockupProps) {
  const { isDesktop } = useLayout();
  const colors = useM3Colors();

  const resolvedNameColor = nameColor || colors.onSurface; // neutral default — red only applied explicitly for official brand
  const resolvedTaglineColor = taglineColor || colors.onSurfaceVariant;

  // Responsive sizing
  const baseNameSize = {
    sm: isDesktop ? 28 : 24,
    md: isDesktop ? 34 : 28,
    lg: isDesktop ? 44 : 34,
    xl: isDesktop ? 56 : 40,
  }[size];

  const resolvedNameSize = nameFontSize ?? baseNameSize;

  const taglineSize = {
    sm: 13,
    md: 14,
    lg: 15,
    xl: 16,
  }[size];

  const textAlign = align;

  return (
    <View style={[styles.container, { marginBottom, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <Text
        style={[{
          fontFamily: FontFamily.bold,
          fontWeight: '700' as any,
          fontSize: resolvedNameSize,
          lineHeight: Math.round(resolvedNameSize * 1.08),
          color: resolvedNameColor,
          textAlign,
          letterSpacing: isDesktop ? -2.4 : -1.8,
          textTransform: 'uppercase',
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
        }, nameStyle]}
        numberOfLines={nameNumberOfLines}
        accessibilityRole="header"
      >
        {name.toUpperCase()}
      </Text>

      {!!tagline && (
        <Text
          style={{
            fontFamily: FontFamily.regular,
            fontWeight: '400' as any,
            fontSize: taglineFontSize ?? taglineSize,
            lineHeight: Math.round((taglineFontSize ?? taglineSize) * 1.45),
            color: resolvedTaglineColor,
            textAlign,
            marginTop: size === 'xl' || size === 'lg' ? 6 : 4,  // tighter, less crowded
            maxWidth: '92%',
            letterSpacing: 0.1,
          }}
          numberOfLines={3}
        >
          {tagline}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default NameTaglineLockup;
