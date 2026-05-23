/**
 * Clips Liquid Glass to modal sheet radii (top-only on mobile sheet, full on desktop).
 */

import React from 'react';
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from '@/design-system/ui/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/design-system/tokens/colors';
import { Spacing } from '@/design-system/tokens/theme';

type Props = {
  isDesktop: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EventLiquidModalBody({ isDesktop, children, style }: Props) {
  return (
    <View
      style={[
        styles.outer,
        isDesktop
          ? { borderRadius: 32, margin: Spacing.xl, maxHeight: '85%', maxWidth: 720, alignSelf: 'center', width: '90%' }
          : {
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            },
        style,
      ]}
    >
      <GlassView
        borderRadius={0}
        bordered={false}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
      >
        <LinearGradient
          colors={[`${CultureTokens.indigo}12`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 -12px 40px rgba(0,0,0,0.2)',
      },
    }),
  },
});
