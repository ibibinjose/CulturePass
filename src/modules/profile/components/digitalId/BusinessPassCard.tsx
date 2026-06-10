import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassAvatar } from '@/modules/profile/components/digitalId/PassAvatar';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

/**
 * Apple Wallet–style Business (landscape) Pass.
 * 
 * Anatomy:
 *   Full-bleed header strip (CulturePass · TIER)
 *   ┌─────────────────────────────────────────────────────┐
 *   │  [avatar]  Name                    ┌─────────────┐  │
 *   │            @handle                 │  [QR code]  │  │
 *   │            [CPID]                  └─────────────┘  │
 *   └─────────────────────────────────────────────────────┘
 *   culturepass.io                              [NFC]
 * 
 * Removed: watermark lines, affiliation row (only shown if present),
 *          "Business Pass" label, redundant borders.
 */

const DEFAULT_HEIGHT = 200;
const AVATAR_SIZE = 52;

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
  const resolvedQrSize = qrSize ?? Math.min(Math.round(height * 0.5), 88);
  const isWhite = colorVariant === 'white';
  const dividerColor = isWhite ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)';
  const qrBg = colorVariant === 'black' ? 'rgba(255,255,255,0.9)' : isWhite ? '#FFFFFF' : 'rgba(255,255,255,0.14)';

  return (
    <PassCardShell width={width} height={height} colorVariant={colorVariant} nativeID="pass-card-business">

      {/* Full-bleed header strip */}
      <PassCardStrip tierLabel={tierLabel} compact colorVariant={colorVariant} />

      {/* Body — avatar + identity on left · QR on right */}
      <View style={styles.body}>
        {/* Left: avatar + text */}
        <View style={styles.left}>
          <PassAvatar
            size={AVATAR_SIZE}
            avatarUrl={avatarUrl}
            initials={initials}
            ringWidth={2}
            accessibilityLabel={`${name} profile photo`}
          />
          <View style={styles.textStack}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.primary }]} numberOfLines={1} accessibilityRole="header">
                {name}
              </Text>
              {isVerified ? (
                <Ionicons name="checkmark-circle" size={14} color={theme.tierLabel} accessibilityLabel="Verified" />
              ) : null}
            </View>
            <Text style={[styles.handle, { color: theme.secondary }]} numberOfLines={1}>
              @{username}
            </Text>
            {affiliation ? (
              <Text style={[styles.affil, { color: theme.tertiary }]} numberOfLines={1}>
                {affiliation.name}
              </Text>
            ) : null}
            {onCopyCpid ? (
              <Pressable
                onPress={onCopyCpid}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Copy ID ${cpid}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={[styles.cpid, { color: theme.tertiary }]}>{cpid}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.cpid, { color: theme.tertiary }]}>{cpid}</Text>
            )}
          </View>
        </View>

        {/* Right: QR code */}
        <View style={[styles.qrBox, { backgroundColor: qrBg, borderColor: dividerColor }]}>
          <PassQrCode
            value={qrValue}
            size={resolvedQrSize}
            borderColor="transparent"
            accessibilityLabel={`CulturePass QR for ${cpid}`}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: dividerColor }]}>
        <Text style={[styles.footerDomain, { color: theme.tertiary }]}>culturepass.io</Text>
        <Ionicons name="radio-outline" size={13} color={theme.tertiary} accessibilityLabel="NFC" />
      </View>
    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
    lineHeight: 20,
  },
  handle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  affil: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    opacity: 0.75,
    flexShrink: 1,
  },
  cpid: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
    marginTop: 3,
    opacity: 0.8,
    ...Platform.select({ web: { cursor: 'pointer' } } as object),
  },
  qrBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderTopWidth: 0.5,
  },
  footerDomain: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});