import React from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const FONT_SIZES: Record<string, { name: number; tagline: number }> = {
  sm: { name: 16, tagline: 10 },
  md: { name: 20, tagline: 11 },
  lg: { name: 26, tagline: 12 },
  xl: { name: 30, tagline: 13 },
};

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  centered = false,
  color,
  tagline = 'Belong anywhere.',
}: {
  size?: string;
  withTagline?: boolean;
  centered?: boolean;
  color?: string;
  tagline?: string;
}) {
  const colors = useColors();
  const sz = FONT_SIZES[size] ?? FONT_SIZES.md;
  const nameColor = color ?? colors.text;
  const taglineColor = color ? `${color}99` : colors.textSecondary;

  return (
    <View style={{ alignItems: centered ? 'center' : 'flex-start' }}>
      <Text
        style={{
          fontSize: sz.name,
          fontFamily: 'Poppins_800ExtraBold',
          color: nameColor,
          letterSpacing: -0.4,
          lineHeight: sz.name + 5,
          includeFontPadding: false,
        }}
      >
        CulturePass
      </Text>
      {withTagline ? (
        <Text
          style={{
            fontSize: sz.tagline,
            fontFamily: 'Poppins_600SemiBold',
            color: taglineColor,
            marginTop: 2,
            letterSpacing: 0.1,
          }}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

export default BrandWordmark;
