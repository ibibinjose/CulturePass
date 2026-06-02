import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { FontFamily } from '@/design-system/tokens/theme';

interface CulturePassWordmarkProps {
  /** Size of the wordmark */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show .App suffix */
  showSuffix?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Optional custom green color for "Pass" */
  passColor?: string;
  /** Optional custom red color for "Culture" */
  cultureColor?: string;
  /** Optional custom blue color for ".App" */
  suffixColor?: string;
}

const SIZE_MAP = {
  xs: 16,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 42,
} as const;

const UN_BLUE = '#009EDB';

/**
 * CulturePassWordmark
 *
 * Official split-color wordmark treatment:
 *   - "Culture" in red
 *   - "Pass" in green
 *   - ".App" in UN Blue
 */
export function CulturePassWordmark({
  size = 'sm',
  showSuffix = true,
  align = 'left',
  passColor = '#00A651',
  cultureColor = '#f80020',
  suffixColor = UN_BLUE,
}: CulturePassWordmarkProps) {
  const fontSize = SIZE_MAP[size];

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.base,
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.1), // Slightly improved spacing
          textAlign: align,
        },
      ]}
    >
      <Text style={{ color: cultureColor }}>Culture</Text>
      <Text style={{ color: passColor }}>Pass</Text>
      {showSuffix ? <Text style={{ color: suffixColor }}>.App</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    includeFontPadding: false,
  },
});

// Optional: also export as default
export default CulturePassWordmark;
