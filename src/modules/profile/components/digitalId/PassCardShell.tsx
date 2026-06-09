import React, { type ReactNode } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

type PassCardShellProps = {
  width: number;
  height: number;
  variant?: 'cyan' | 'white';
  children: ReactNode;
};

export function PassCardShell({ width, height, variant = 'cyan', children }: PassCardShellProps) {
  const isCyan = variant === 'cyan';
  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: isCyan ? WALLET_PASS_THEME.cyanHex : WALLET_PASS_THEME.whiteHex,
          borderColor: isCyan ? WALLET_PASS_THEME.cyanDarkHex : WALLET_PASS_THEME.borderOnWhite,
          ...Platform.select({
            web: {
              boxShadow: isCyan
                ? '0 10px 28px rgba(0, 173, 239, 0.38)'
                : '0 4px 16px rgba(15, 23, 42, 0.08)',
            } as object,
            default: {
              shadowColor: isCyan ? WALLET_PASS_THEME.cyanHex : '#0F172A',
              shadowOffset: { width: 0, height: isCyan ? 6 : 4 },
              shadowOpacity: isCyan ? 0.35 : 0.08,
              shadowRadius: isCyan ? 12 : 10,
              elevation: isCyan ? 6 : 4,
            },
          }),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});