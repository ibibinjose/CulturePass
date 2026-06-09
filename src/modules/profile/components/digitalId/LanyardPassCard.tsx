import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassIdRow } from '@/modules/profile/components/digitalId/PassIdRow';
import { getPassSurfaceColors } from '@/modules/profile/components/digitalId/passCardUtils';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

const AVATAR_SIZE = 88;
const DEFAULT_HEIGHT = 448;
const AVATAR_RING = WALLET_PASS_THEME.whiteHex;
const AVATAR_INITIALS_COLOR = '#4F46E5';
const AVATAR_OVERLAP = 34;

export type LanyardPassCardProps = {
  width: number;
  height?: number;
  tierLabel: string;
  name: string;
  username: string;
  cpid: string;
  memberSince: string;
  qrValue: string;
  qrSize?: number;
  avatarUrl?: string | null;
  initials: string;
  isVerified?: boolean;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  onCopyCpid?: () => void;
  copied?: boolean;
};

export function LanyardPassCard({
  width,
  height = DEFAULT_HEIGHT,
  tierLabel,
  name,
  username,
  cpid,
  memberSince,
  qrValue,
  qrSize,
  avatarUrl,
  initials,
  isVerified = false,
  affiliation,
  onCopyCpid,
  copied = false,
}: LanyardPassCardProps) {
  const surface = getPassSurfaceColors();
  const resolvedQrSize = qrSize ?? Math.min(width - 72, 132);

  const idRow = (
    <PassIdRow cpid={cpid} variant="onCyan" />
  );

  return (
    <PassCardShell width={width} height={height} variant="cyan">
      <View style={styles.header}>
        <PassCardStrip tierLabel={tierLabel} />
        <View style={[styles.avatarWrap, { marginTop: -AVATAR_OVERLAP }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={avatarUrl}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
          </View>
            {affiliation ? (
              <View style={styles.affiliationBadge}>
                {affiliation.avatarUrl ? (
                  <Image source={{ uri: affiliation.avatarUrl }} style={styles.affiliationImage} contentFit="cover" />
                ) : (
                  <Ionicons name="business-outline" size={14} color="#78716C" />
                )}
              </View>
            ) : null}
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.profile}>
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: surface.primary }]} numberOfLines={1}>{name}</Text>
              {isVerified ? <Ionicons name="checkmark-circle" size={15} color={surface.tierLabel} /> : null}
            </View>
            <Text style={[styles.handle, { color: surface.secondary }]}>@{username}</Text>
            {affiliation ? (
              <View style={styles.affiliationRow}>
                <Ionicons name="business-outline" size={11} color={surface.secondary} />
                <Text style={[styles.affiliationName, { color: surface.secondary }]} numberOfLines={1}>
                  {affiliation.name}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.memberSince, { color: surface.tertiary }]}>Member Since {memberSince}</Text>
            {onCopyCpid ? (
              <Pressable onPress={onCopyCpid} hitSlop={8} style={styles.idPressable}>
                {idRow}
              </Pressable>
            ) : (
              <View style={styles.idPressable}>{idRow}</View>
            )}
            {copied ? (
              <Text style={styles.copiedHint}>Copied</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.qrSection}>
          <View style={[styles.qrPad, { borderColor: surface.border }]}>
            <QRCode
              value={qrValue}
              size={resolvedQrSize}
              color="#000000"
              backgroundColor={WALLET_PASS_THEME.qrPad}
              ecl="H"
              logo={require('@/assets/images/culturepass-logo.png')}
              logoSize={resolvedQrSize * 0.22}
              logoBorderRadius={6}
              logoBackgroundColor={WALLET_PASS_THEME.qrPad}
              logoMargin={2}
            />
          </View>
        </View>
      </View>
    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    zIndex: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  profile: {
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    zIndex: 3,
  },
  avatarRing: {
    padding: 5,
    borderRadius: (AVATAR_SIZE + 10) / 2,
    backgroundColor: AVATAR_RING,
    ...Platform.select({
      web: { boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AVATAR_RING,
  },
  avatarInitials: { fontSize: 30, fontFamily: FontFamily.bold, color: AVATAR_INITIALS_COLOR },
  affiliationBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  affiliationImage: { width: '100%', height: '100%', borderRadius: 4 },
  identity: { alignItems: 'center', gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 20, fontFamily: FontFamily.bold, lineHeight: 24 },
  handle: { fontSize: 13, fontFamily: FontFamily.semibold },
  affiliationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  affiliationName: { fontSize: 12, fontFamily: FontFamily.semibold, maxWidth: 220 },
  memberSince: { fontSize: 10, fontFamily: FontFamily.medium, marginTop: 2 },
  idPressable: { marginTop: 8 },
  copiedHint: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: WALLET_PASS_THEME.subtextOnCyan,
    marginTop: 2,
  },
  qrSection: { alignItems: 'center', marginTop: 12 },
  qrPad: {
    padding: 8,
    backgroundColor: WALLET_PASS_THEME.qrPad,
    borderRadius: 14,
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