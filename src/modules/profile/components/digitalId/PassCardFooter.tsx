import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { brandDomainLabel } from '@/modules/profile/components/digitalId/digitalIdBrand';

type PassCardFooterProps = {
  textColor: string;
  borderColor: string;
  showActiveDot?: boolean;
  isActive?: boolean;
};

/** Shared pass footer — CulturePass.App domain + NFC indicator. */
export function PassCardFooter({
  textColor,
  borderColor,
  showActiveDot = false,
  isActive = true,
}: PassCardFooterProps) {
  return (
    <View style={[styles.footer, { borderTopColor: borderColor }]}>
      <View style={styles.left}>
        {showActiveDot ? (
          <View style={[styles.dot, { backgroundColor: isActive ? '#10b981' : 'rgba(255,255,255,0.25)' }]} />
        ) : null}
        <Text style={[styles.domain, { color: textColor }]} accessibilityLabel={`${brandDomainLabel()} website`}>
          {brandDomainLabel()}
        </Text>
      </View>
      <Ionicons name="radio-outline" size={13} color={textColor} accessibilityLabel="NFC ready" />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  domain: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.6,
    opacity: 0.82,
  },
});