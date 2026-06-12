import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { FontFamily, WORDMARK_COLORS } from '@/design-system/tokens/theme';

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

/**
 * CulturePassWordmark — official split-color treatment (WebSidebar header).
 *   Culture → cultureRed
 *   Pass    → passGreen
 *   .App    → appBlue
 */
export function CulturePassWordmark({
  size = 'sm',
  showSuffix = true,
  align = 'left',
  passColor = WORDMARK_COLORS.pass,
  cultureColor = WORDMARK_COLORS.culture,
  suffixColor = WORDMARK_COLORS.suffix,
}: CulturePassWordmarkProps) {
  const fontSize = SIZE_MAP[size];

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.base,
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.1),
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

export default CulturePassWordmark;