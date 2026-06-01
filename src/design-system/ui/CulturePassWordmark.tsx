import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { FontFamily } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';

interface CulturePassWordmarkProps {
  /** Size of the wordmark */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show .App suffix */
  showSuffix?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Optional custom green color for "Pass" */
  passColor?: string;
  /** Optional custom red color for "Culture" */
  cultureColor?: string;
}

const SIZE_MAP = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 42,
};

/**
 * CulturePassWordmark
 * 
 * Official split-color wordmark treatment:
 *   - "Culture" in red (#f80020)
 *   - "Pass" in green
 *   - ".App" in neutral
 * 
 * Use this for the official app branding wherever the name appears prominently
 * (sidebar, headers, footers, loading screens, etc.).
 */
export function CulturePassWordmark({
  size = 'md',
  showSuffix = true,
  align = 'left',
  passColor = '#00A651',           // Nice vibrant green
  cultureColor = '#f80020',        // New red to try (user requested #f80020)
}: CulturePassWordmarkProps) {
  const colors = useM3Colors();
  const fontSize = SIZE_MAP[size];

  const textAlign = align;

  return (
    <View style={[styles.container, { alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <Text
        style={[
          styles.base,
          {
            fontSize,
            lineHeight: Math.round(fontSize * 1.05),
            textAlign,
          },
        ]}
      >
        <Text style={{ color: cultureColor, fontFamily: FontFamily.bold, fontWeight: '700' as any }}>
          Culture
        </Text>
        <Text style={{ color: passColor, fontFamily: FontFamily.bold, fontWeight: '700' as any }}>
          Pass
        </Text>
        {showSuffix && (
          <Text style={{ color: colors.onSurface, fontFamily: FontFamily.bold, fontWeight: '700' as any }}>
            .App
          </Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
  base: {
    fontFamily: FontFamily.bold,
    fontWeight: '700' as any,
    includeFontPadding: false,
  },
});

export default CulturePassWordmark;