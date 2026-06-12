import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassAvatar } from '@/modules/profile/components/digitalId/PassAvatar';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { DIGITAL_ID_BRAND } from '@/modules/profile/components/digitalId/digitalIdBrand';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

/**
 * Official lanyard pass — matches Apple Wallet "Add to Wallet" preview.
 *
 * Layout (reference: membership card mock):
 *   Wordmark header (culture red → app blue) + gold rule
 *   Dark body · left identity column · right avatar + Active Member
 *   Framed QR · CPID bar · tagline footer
 */

const AVATAR_SIZE = 72;
const DEFAULT_HEIGHT = WALLET_PASS_THEME.lanyardHeight;

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
  isActive = true,
  onCopyCpid,
}: LanyardPassCardProps) {
  const theme = getPassColorTheme(colorVariant, tierLabel);
  const isOfficial = colorVariant === 'cyan';
  const bodyBg = isOfficial ? WALLET_PASS_THEME.lanyardBody : theme.bodyBg;
  const bodyBorder = isOfficial ? WALLET_PASS_THEME.lanyardBodyBorder : theme.bodyBorder;
  const textPrimary = isOfficial ? '#FFFFFF' : theme.primary;
  const textSecondary = isOfficial ? 'rgba(255,255,255,0.88)' : theme.secondary;
  const textMuted = isOfficial ? 'rgba(255,255,255,0.65)' : theme.tertiary;
  const resolvedQrSize = qrSize ?? Math.min(width - 88, 128);
  const gold = WALLET_PASS_THEME.lanyardAccentGold;

  return (
    <PassCardShell
      width={width}
      height={height}
      colorVariant={colorVariant}
      tierLabel={tierLabel}
      nativeID="pass-card-lanyard"
      shellBg={isOfficial ? bodyBg : undefined}
      shellBorder={isOfficial ? bodyBorder : undefined}
    >
      <View style={[styles.root, { backgroundColor: bodyBg, borderColor: bodyBorder }]}>
        <PassCardStrip tierLabel={tierLabel} lanyard official={isOfficial} colorVariant={colorVariant} />

        {isOfficial ? (
          <View style={[styles.goldRule, { backgroundColor: gold }]} />
        ) : null}

        {isOfficial ? (
          <View style={styles.patternOverlay} pointerEvents="none">
            <View style={[styles.patternOrb, styles.patternOrbA]} />
            <View style={[styles.patternOrb, styles.patternOrbB]} />
          </View>
        ) : null}

        <View style={styles.body}>
          <View style={styles.identityRow}>
            <View style={styles.identityLeft}>
              <Text style={[styles.name, { color: textPrimary }]} numberOfLines={2} accessibilityRole="header">
                {name}
              </Text>
              <Text style={[styles.handle, { color: textSecondary }]} numberOfLines={1}>
                @{username}
              </Text>
              <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
                Member Since: {memberSince}
              </Text>
              {onCopyCpid ? (
                <Pressable
                  onPress={onCopyCpid}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy ID ${cpid}`}
                  hitSlop={6}
                  style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                >
                  <Text style={[styles.meta, { color: textMuted }]}>ID: {cpid}</Text>
                </Pressable>
              ) : (
                <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
                  ID: {cpid}
                </Text>
              )}
            </View>

            <View style={styles.identityRight}>
              <LinearGradient
                colors={[gold, WALLET_PASS_THEME.lanyardAccentGoldSoft, gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={[styles.avatarGap, { backgroundColor: bodyBg }]}>
                  <PassAvatar
                    size={AVATAR_SIZE}
                    avatarUrl={avatarUrl}
                    initials={initials}
                    ringWidth={0}
                    accessibilityLabel={`${name} profile photo`}
                  />
                </View>
              </LinearGradient>
              {isActive ? (
                <View style={[styles.activePill, { backgroundColor: CultureTokens.passGreen }]}>
                  <Text style={styles.activePillText}>Active Member</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.qrBlock}>
            <View style={styles.qrStack}>
              <View style={[styles.qrFrameOuter, { borderColor: gold }]}>
                <View style={[styles.qrFrameInner, { borderColor: `${gold}88` }]}>
                  <View style={styles.qrPad}>
                    <PassQrCode
                      value={qrValue}
                      size={resolvedQrSize}
                      borderColor="transparent"
                      accessibilityLabel={`CulturePass QR code for ${cpid}`}
                    />
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[CultureTokens.cultureRed, CultureTokens.appBlue]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cpidBar}
              >
                <Text style={styles.cpidBarText}>{cpid}</Text>
              </LinearGradient>
            </View>
          </View>

          <Text style={[styles.tagline, { color: textMuted }]}>
            {DIGITAL_ID_BRAND.name} • {DIGITAL_ID_BRAND.tagline}
          </Text>
        </View>
      </View>
    </PassCardShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  goldRule: {
    height: 2,
    width: '100%',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFill,
    top: 58,
    opacity: 0.07,
  },
  patternOrb: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  patternOrbA: {
    width: 180,
    height: 180,
    top: 40,
    right: -40,
  },
  patternOrbB: {
    width: 120,
    height: 120,
    bottom: 80,
    left: -20,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
    justifyContent: 'space-between',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  identityLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 4,
  },
  identityRight: {
    alignItems: 'center',
    gap: 8,
    width: 96,
    flexShrink: 0,
  },
  name: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.1,
  },
  handle: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  meta: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    lineHeight: 15,
    marginTop: 2,
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
    overflow: 'hidden',
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 88,
    alignItems: 'center',
  },
  activePillText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  qrBlock: {
    alignItems: 'center',
    marginTop: 4,
  },
  qrStack: {
    alignSelf: 'center',
    minWidth: 200,
  },
  qrFrameOuter: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 3,
    backgroundColor: WALLET_PASS_THEME.qrPad,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.25)' } as object,
    }),
  },
  qrFrameInner: {
    borderWidth: 1,
    padding: 8,
    backgroundColor: WALLET_PASS_THEME.qrPad,
  },
  qrPad: {
    backgroundColor: WALLET_PASS_THEME.qrPad,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cpidBar: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -1,
  },
  cpidBarText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },
  tagline: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: 4,
  },
});