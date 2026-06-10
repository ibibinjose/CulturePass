import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

const CP_LOGO = require('@/assets/images/culturepass-logo.png');

export type PassQrCodeProps = {
  value: string;
  size: number;
  accessibilityLabel?: string;
  logoRatio?: number;
  borderColor?: string;
};

/** Branded CulturePass QR — high error correction, centred logo overlay, accessible contrast. */
export function PassQrCode({
  value,
  size,
  accessibilityLabel = 'CulturePass check-in QR code',
  logoRatio = 0.22,
  borderColor = WALLET_PASS_THEME.borderOnCyan,
}: PassQrCodeProps) {
  const logoSize = Math.round(size * logoRatio);

  return (
    <View
      style={[styles.wrap, { borderColor }]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="yes"
    >
      <QRCode
        value={value}
        size={size}
        color="#0B0F19"
        backgroundColor={WALLET_PASS_THEME.qrPad}
        ecl="H"
        logo={CP_LOGO}
        logoSize={logoSize}
        logoBorderRadius={Math.max(4, Math.round(logoSize * 0.28))}
        logoBackgroundColor={WALLET_PASS_THEME.qrPad}
        logoMargin={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: WALLET_PASS_THEME.qrPad,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
});