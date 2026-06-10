import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassIdRow } from '@/modules/profile/components/digitalId/PassIdRow';
import { PassAvatar } from '@/modules/profile/components/digitalId/PassAvatar';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

export type BusinessPassCardProps = {
  width: number;
  height?: number;
  colorVariant?: PassColorVariant;
  tierLabel: string;
  name: string;
  username: string;
  cpid: string;
  qrValue: string;
  qrSize?: number;
  avatarUrl?: string | null;
  initials: string;
  isVerified?: boolean;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  onCopyCpid?: () => void;
};

const DEFAULT_HEIGHT = 210;
const AVATAR_SIZE = 48;

export function BusinessPassCard({
  width,
  height = DEFAULT_HEIGHT,
  colorVariant = 'cyan',
  tierLabel,
  name,
  username,
  cpid,
  qrValue,
  qrSize,
  avatarUrl,
  initials,
  isVerified = false,
  affiliation,
  onCopyCpid,
}: BusinessPassCardProps) {
  const theme = getPassColorTheme(colorVariant);
  const resolvedQrSize = qrSize ?? Math.min(width - 160, 88);

  return (
    <PassCardShell width={width} height={height} colorVariant={colorVariant} nativeID="pass-card-business">
      <PassCardStrip tierLabel={tierLabel} compact colorVariant={colorVariant} />
      <View style={styles.body}>
        <View style={styles.identityCol}>
          <PassAvatar
            size={AVATAR_SIZE}
            avatarUrl={avatarUrl}
            initials={initials}
            affiliation={affiliation}
            ringWidth={3}
            accessibilityLabel={`${name} profile photo`}
          />
          <View style={styles.textCol}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.primary }]} numberOfLines={1} accessibilityRole="header">
                {name}
              </Text>
              {isVerified ? (
                <Ionicons name="checkmark-circle" size={14} color={theme.tierLabel} accessibilityLabel="Verified member" />
              ) : null}
            </View>
            <Text style={[styles.handle, { color: theme.secondary }]}>@{username}</Text>
            {affiliation ? (
              <View style={styles.affiliationRow}>
                <Ionicons name="business-outline" size={10} color={theme.secondary} />
                <Text style={[styles.affiliationName, { color: theme.secondary }]} numberOfLines={1}>
                  {affiliation.name}
                </Text>
              </View>
            ) : null}
            {onCopyCpid ? (
              <Pressable onPress={onCopyCpid} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Copy ID ${cpid}`}>
                <PassIdRow cpid={cpid} variant={theme.idRowVariant} size="sm" />
              </Pressable>
            ) : (
              <PassIdRow cpid={cpid} variant={theme.idRowVariant} size="sm" />
            )}
          </View>
        </View>
        <PassQrCode
          value={qrValue}
          size={resolvedQrSize}
          borderColor={theme.qrBorder}
          accessibilityLabel={`CulturePass ID QR code for ${cpid}`}
        />
      </View>
    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  identityCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 16, fontFamily: FontFamily.bold, lineHeight: 20, flexShrink: 1 },
  handle: { fontSize: 12, fontFamily: FontFamily.semibold },
  affiliationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  affiliationName: { fontSize: 10, fontFamily: FontFamily.semibold, flexShrink: 1 },
});