import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FontFamily } from '@/design-system/tokens/theme';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

type PassIdRowProps = {
  cpid: string;
  variant?: 'onCyan' | 'onWhite' | 'onBlack';
  size?: 'sm' | 'md';
};

export function PassIdRow({ cpid, variant = 'onCyan', size = 'md' }: PassIdRowProps) {
  const onLight = variant === 'onWhite';
  return (
    <View style={styles.row}>
      <Text style={[
        styles.label,
        size === 'sm' && styles.labelSm,
        onLight ? styles.labelOnWhite : styles.labelOnCyan,
      ]}>
        ID
      </Text>
      <Text
        style={[
          styles.value,
          size === 'sm' && styles.valueSm,
          onLight ? styles.valueOnWhite : styles.valueOnCyan,
        ]}
        numberOfLines={1}
      >
        {cpid}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelSm: { fontSize: 8 },
  labelOnCyan: { color: WALLET_PASS_THEME.labelOnCyan },
  labelOnWhite: { color: WALLET_PASS_THEME.cyanHex },
  value: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  valueSm: { fontSize: 11 },
  valueOnCyan: { color: WALLET_PASS_THEME.nameOnCyan },
  valueOnWhite: { color: WALLET_PASS_THEME.darkText },
});