import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassCardFooter } from '@/modules/profile/components/digitalId/PassCardFooter';
import { PassAvatar } from '@/modules/profile/components/digitalId/PassAvatar';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

/** 
 * Apple Wallet–style Lanyard / Generic pass.
 * 
 * Anatomy (top → bottom):
 *   1. Full-bleed header strip  (CulturePass logo · TIER badge)
 *   2. Avatar                   (centered, gradient ring, NO strip overlap)
 *   3. Name  (large, primary)
 *   4. Handle (secondary, muted)
 *   5. CPID  (monospaced, tappable)
 *   6. QR code  (white pill, centered)
 *   7. Holographic accent strip (3px)
 * 
 * Removed: "SCAN TO VERIFY" label, "Member since", affiliation chip,
 *          separate "Active / Inactive" text, status pill, punch hole.
 */

const AVATAR_SIZE = 86;
const DEFAULT_HEIGHT = 440;

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
  qrValue,
  qrSize,
  avatarUrl,
  initials,
  isVerified = false,
  isActive = true,
  onCopyCpid,
  copied = false,
}: LanyardPassCardProps) {
  const theme = getPassColorTheme(colorVariant, tierLabel);
  const resolvedQrSize = qrSize ?? Math.min(width - 64, 136);
  const isWhite = colorVariant === 'white';
  const isBlack = colorVariant === 'black';

  // Subtle holographic bottom strip
  const holoColors: [string, string, string, string] = isWhite
    ? [CultureTokens.teal, CultureTokens.violet, CultureTokens.coral, CultureTokens.gold]
    : [`${CultureTokens.teal}8C`, `${CultureTokens.violet}8C`, `${CultureTokens.coral}8C`, `${CultureTokens.gold}8C`];

  const qrBg = isBlack ? 'rgba(255,255,255,0.92)' : isWhite ? '#FFFFFF' : 'rgba(255,255,255,0.15)';
  const dividerColor = isWhite ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)';

  return (
    <PassCardShell width={width} height={height} colorVariant={colorVariant} tierLabel={tierLabel} nativeID="pass-card-lanyard">

      {/* ── 1. Full-bleed header strip ── */}
      <PassCardStrip tierLabel={tierLabel} lanyard colorVariant={colorVariant} />

      {/* ── 2. Avatar — sits directly below strip, no overlap ── */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.violet, CultureTokens.coral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <View style={[styles.avatarGap, { backgroundColor: theme.bodyBg }]}>
            <PassAvatar
              size={AVATAR_SIZE}
              avatarUrl={avatarUrl}
              initials={initials}
              ringWidth={0}
              accessibilityLabel={`${name} profile photo`}
            />
          </View>
        </LinearGradient>
        {isVerified && (
          <View style={[styles.verifiedBadge, { borderColor: theme.bodyBg }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </View>

      {/* ── 3–5. Identity ── */}
      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.primary }]} numberOfLines={1} accessibilityRole="header">
          {name}
        </Text>
        <Text style={[styles.handle, { color: theme.secondary }]} numberOfLines={1}>
          @{username}
        </Text>

        {/* CPID — tappable, monospaced */}
        {onCopyCpid ? (
          <Pressable
            onPress={onCopyCpid}
            style={({ pressed }) => [
              styles.cpidBtn,
              { opacity: pressed ? 0.7 : 1, borderColor: dividerColor, backgroundColor: isWhite ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'ID copied' : `Copy ID ${cpid}`}
            hitSlop={8}
          >
            <Text style={[styles.cpid, { color: theme.secondary }]}>{cpid}</Text>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={theme.tertiary} />
          </Pressable>
        ) : (
          <Text style={[styles.cpidStatic, { color: theme.secondary }]}>{cpid}</Text>
        )}
      </View>

      {/* ── Spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── 6. QR code ── */}
      <View style={styles.qrSection}>
        <View style={[styles.qrPill, { backgroundColor: qrBg, borderColor: dividerColor }]}>
          <PassQrCode
            value={qrValue}
            size={resolvedQrSize}
            borderColor="transparent"
            accessibilityLabel={`CulturePass QR code for ${cpid}`}
          />
        </View>
      </View>

      <PassCardFooter
        textColor={theme.tertiary}
        borderColor={dividerColor}
        showActiveDot
        isActive={isActive}
      />

      {/* ── 7. Holographic accent strip ── */}
      <LinearGradient
        colors={holoColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.holoStrip}
      />
    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
    position: 'relative',
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGap: {
    width: AVATAR_SIZE + 2,
    height: AVATAR_SIZE + 2,
    borderRadius: (AVATAR_SIZE + 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 12,
    right: '50%',
    marginRight: -(AVATAR_SIZE / 2 + 2),
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  name: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.1,
    lineHeight: 27,
  },
  handle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
  cpidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    ...Platform.select({ web: { cursor: 'pointer' } } as object),
  },
  cpid: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
  },
  cpidStatic: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    marginTop: 6,
    opacity: 0.75,
  },
  qrSection: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  qrPill: {
    borderRadius: 18,
    borderWidth: 0.5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } as object,
    }),
  },
  holoStrip: {
    height: 3,
    width: '100%',
  },
});