import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassAvatar } from '@/modules/profile/components/digitalId/PassAvatar';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

const AVATAR_SIZE = 80;
const DEFAULT_HEIGHT = 460;
const AVATAR_OVERLAP = 16;
const PUNCH_SIZE = 28;

export type LanyardPassCardProps = {
  width: number;
  height?: number;
  colorVariant?: PassColorVariant;
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
  isActive?: boolean;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  onCopyCpid?: () => void;
  copied?: boolean;
};

export function LanyardPassCard({
  width,
  height = DEFAULT_HEIGHT,
  colorVariant = 'cyan',
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
  isActive = true,
  affiliation,
  onCopyCpid,
  copied = false,
}: LanyardPassCardProps) {
  const theme = getPassColorTheme(colorVariant);
  const resolvedQrSize = qrSize ?? Math.min(width - 72, 130);

  return (
    <PassCardShell width={width} height={height} colorVariant={colorVariant} nativeID="pass-card-lanyard">

      {/* ── Strip ── */}
      <View style={styles.stripWrap}>
        <PassCardStrip tierLabel={tierLabel} lanyard colorVariant={colorVariant} />
        {/* Lanyard punch hole */}
        <View style={[styles.punch, { borderColor: theme.punchBorder ?? 'rgba(0,0,0,0.25)' }]} />
      </View>

      {/* ── Avatar (overlaps strip) ── */}
      <View style={[styles.avatarWrap, { marginTop: -AVATAR_OVERLAP }]}>
        <View>
          <PassAvatar
            size={AVATAR_SIZE}
            avatarUrl={avatarUrl}
            initials={initials}
            ringWidth={4}
            accessibilityLabel={`${name} profile photo`}
          />
          {isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.verifiedBg ?? '#3b82f6', borderColor: theme.cardBg }]}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* ── Identity ── */}
      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.primary }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.handle, { color: theme.secondary }]}>@{username}</Text>

        {affiliation ? (
          <View style={[styles.affiliationChip, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
            <Ionicons name="business-outline" size={10} color={theme.secondary} />
            <Text style={[styles.affiliationText, { color: theme.secondary }]} numberOfLines={1}>
              {affiliation.name}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.memberSince, { color: theme.tertiary }]}>Member since {memberSince}</Text>
      </View>

      {/* ── CPID row ── */}
      <View style={styles.cpidRow}>
        <View style={[styles.cpidPill, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
          <Text style={[styles.cpidText, { color: theme.secondary }]}>{cpid}</Text>
        </View>
        {onCopyCpid ? (
          <Pressable
            onPress={onCopyCpid}
            hitSlop={8}
            style={[styles.copyButton, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}
            accessibilityLabel="Copy CPID"
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? theme.tierLabel : theme.secondary} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: theme.divider ?? 'rgba(255,255,255,0.08)' }]} />

      {/* ── QR ── */}
      <View style={styles.qrSection}>
        <PassQrCode
          value={qrValue}
          size={resolvedQrSize}
          borderColor={theme.qrBorder}
          accessibilityLabel={`CulturePass QR code for ${cpid}`}
        />
        <Text style={[styles.qrHint, { color: theme.tertiary }]}>Scan to verify identity</Text>
      </View>

      {/* ── Footer status bar ── */}
      <View style={[styles.footer, { borderTopColor: theme.divider ?? 'rgba(255,255,255,0.06)' }]}>
        <Text style={[styles.footerLabel, { color: theme.tertiary }]}>Status</Text>
        <View style={[styles.statusPill, { backgroundColor: theme.statusPillBg, borderColor: theme.statusPillBorder }]}>
          <Text style={[styles.statusText, { color: theme.tierLabel }]}>
            {isActive ? `${tierLabel} · Active` : 'Inactive'}
          </Text>
        </View>
      </View>

    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  stripWrap: {
    width: '100%',
    zIndex: 4,
    elevation: 4,
    position: 'relative',
    alignItems: 'center',
  },
  punch: {
    position: 'absolute',
    bottom: -(PUNCH_SIZE / 2),
    width: PUNCH_SIZE,
    height: PUNCH_SIZE,
    borderRadius: PUNCH_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5,
    zIndex: 5,
  },
  avatarWrap: {
    alignItems: 'center',
    zIndex: 3,
    elevation: 3,
    marginBottom: 8,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 19,
    fontFamily: FontFamily.bold,
    lineHeight: 23,
  },
  handle: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  affiliationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
    marginVertical: 4,
  },
  affiliationText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    maxWidth: 180,
  },
  memberSince: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 18,
  },
  cpidPill: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cpidText: {
    fontSize: 11,
    fontFamily: FontFamily.mono ?? FontFamily.medium,
    letterSpacing: 0.8,
  },
  copyButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 0.5,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 0,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  qrHint: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    marginTop: 'auto',
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  statusText: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});