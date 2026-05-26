import React from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { APP_AKA, TAGLINE_PRIMARY } from '@/lib/app-meta';

const FONT_SIZES: Record<string, { name: number; tagline: number }> = {
  sm: { name: 15, tagline: 10 },
  md: { name: 18, tagline: 10.5 },
  lg: { name: 24, tagline: 12 },
  xl: { name: 28, tagline: 13 },
};

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  centered = false,
  color,
  tagline = TAGLINE_PRIMARY,
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
          fontFamily: 'Poppins_700Bold',
          color: nameColor,
          letterSpacing: -0.6,
          lineHeight: sz.name + 4,
          includeFontPadding: false,
        }}
      >
        {APP_AKA}
      </Text>
      {withTagline ? (
        <Text
          style={{
            fontSize: sz.tagline,
            fontFamily: 'Poppins_500Medium',
            color: taglineColor,
            marginTop: 1,
            letterSpacing: -0.1,
          }}
          numberOfLines={1}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

export default BrandWordmark;
