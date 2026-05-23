import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/typography';
import { calculateRedemptionPreview } from '@/lib/perks-utils';

interface PerkCouponModalProps {
  showCoupon: boolean;
  couponCode: string;
  setShowCoupon: (show: boolean) => void;
  /** Points deducted for this redemption. 0 = free perk. */
  pointsCost?: number;
  /** User's points balance before redemption. */
  userPoints?: number;
  /** ISO date string when the coupon expires. */
  expiresAt?: string;
}

export function PerkCouponModal({
  showCoupon,
  couponCode,
  setShowCoupon,
  pointsCost = 0,
  userPoints,
  expiresAt,
}: PerkCouponModalProps) {
  const colors = useColors();

  const preview = userPoints !== undefined && pointsCost > 0
    ? calculateRedemptionPreview(userPoints, pointsCost)
    : null;

  if (!showCoupon) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={48} color={CultureTokens.teal} />
        </View>
        <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 4 }]}>Perk Redeemed!</Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 16 }]}>
          Here&apos;s your coupon code
        </Text>

        {/* Redemption preview — points cost + remaining balance (Req 13.4) */}
        {preview !== null && (
          <View style={[styles.previewRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
              -{pointsCost} pts
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>·</Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
              {preview.remainingBalance} pts remaining
            </Text>
          </View>
        )}

        {expiresAt && (
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginBottom: 8 }]}>
            Expires {new Date(expiresAt).toLocaleDateString()}
          </Text>
        )}
        <View style={[styles.codeWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.text }]}>{couponCode}</Text>
        </View>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }]}>
          Show this code at checkout or enter it online
        </Text>
        <Pressable
          style={[styles.copyBtn, { backgroundColor: CultureTokens.teal }]}
          onPress={async () => {
            if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
              await navigator.clipboard.writeText(couponCode);
              Alert.alert('Copied!', 'Coupon code copied to clipboard.');
            } else {
              Alert.alert('Coupon Code', couponCode);
            }
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          accessibilityRole="button"
          accessibilityLabel="Copy coupon code"
        >
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          <Text style={[TextStyles.callout, { color: '#FFFFFF' }]}>Copy Code</Text>
        </Pressable>
        <Pressable
          style={styles.doneBtn}
          onPress={() => setShowCoupon(false)}
          accessibilityRole="button"
          accessibilityLabel="Close coupon modal"
        >
          <Text style={[TextStyles.body, { color: colors.textSecondary }]}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 30,
  },
  modal: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconWrap: {
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  codeWrap: {
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    width: '100%',
  },
  codeText: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    marginBottom: 10,
  },
  doneBtn: {
    paddingVertical: 10,
  },
});
