import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { GlassView } from '@/design-system/ui';
import { FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import { modulesApi } from '@/modules/api';
import { LanyardPassCard } from '@/modules/profile/components/digitalId/LanyardPassCard';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassIdRow } from '@/modules/profile/components/digitalId/PassIdRow';
import { WALLET_PASS_THEME, formatWalletDisplayName } from '@/modules/profile/components/digitalId/walletPassTheme';

type WalletSide = 'front' | 'back';

export type WalletAddSectionProps = {
  width: number;
  name: string;
  username: string;
  cpid: string;
  tierLabel: string;
  memberSince: string;
  qrValue: string;
  profileUrl: string;
  avatarUrl?: string | null;
  initials: string;
  isVerified?: boolean;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  location?: string;
  isDark: boolean;
  panelBg: string;
  panelBorder: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  showApple: boolean;
  showGoogle: boolean;
  onAddApple: () => void;
  onAddGoogle: () => void;
  isApplePending: boolean;
  isGooglePending: boolean;
};

function WalletBackCard({
  name,
  username,
  tierLabel,
  cpid,
  profileUrl,
  memberSince,
  location,
  affiliationName,
}: {
  name: string;
  username: string;
  tierLabel: string;
  cpid: string;
  profileUrl: string;
  memberSince: string;
  location?: string;
  affiliationName?: string;
}) {
  const rows = [
    { label: 'Name', value: name },
    { label: 'Username', value: `@${username}` },
    { label: 'Member since', value: memberSince },
    { label: 'ID', value: cpid, inline: true as const },
    { label: 'Tier', value: tierLabel },
    ...(affiliationName ? [{ label: 'Affiliation', value: affiliationName }] : []),
    ...(location ? [{ label: 'Location', value: location }] : []),
    { label: 'Profile', value: profileUrl.replace(/^https?:\/\//, '') },
  ];

  return (
    <View style={s.previewCard}>
      <PassCardStrip tierLabel={tierLabel} compact />
      <View style={s.previewBackBody}>
        <View style={s.previewBackList}>
          {rows.map((row) => (
            <View key={row.label} style={s.previewBackRow}>
              {'inline' in row && row.inline ? (
                <PassIdRow cpid={row.value} variant="onWhite" size="sm" />
              ) : (
                <>
                  <Text style={s.previewBackLabel}>{row.label}</Text>
                  <Text style={s.previewBackValue} numberOfLines={2}>{row.value}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function WalletAddSection({
  width,
  name,
  username,
  cpid,
  tierLabel,
  memberSince,
  qrValue,
  profileUrl,
  avatarUrl,
  initials,
  isVerified,
  affiliation,
  location,
  isDark,
  panelBg,
  panelBorder,
  textColor,
  mutedColor,
  accentColor,
  showApple,
  showGoogle,
  onAddApple,
  onAddGoogle,
  isApplePending,
  isGooglePending,
}: WalletAddSectionProps) {
  const [side, setSide] = useState<WalletSide>('front');

  const { data: readiness } = useQuery({
    queryKey: ['wallet-business-card-readiness'],
    queryFn: () => modulesApi.wallet.businessCardReadiness(),
    staleTime: 60_000,
  });

  const activePlatform = useMemo(() => {
    if (showApple) return 'apple';
    if (showGoogle) return 'google';
    return 'apple';
  }, [showApple, showGoogle]);

  const appleReady = readiness?.apple ?? true;
  const googleReady = readiness?.google ?? true;
  const platformReady = activePlatform === 'apple' ? appleReady : googleReady;

  const previewHeight = Math.round(Math.min(width, 360) * (WALLET_PASS_THEME.lanyardHeight / 330));
  const previewWidth = Math.min(width, 360);
  const qrSize = Math.min(previewWidth - 96, 108);

  const steps =
    activePlatform === 'apple'
      ? ['Tap Add to Apple Wallet', 'Confirm in Wallet app', 'Show QR at venue entry']
      : ['Tap Save to Google Wallet', 'Confirm in Google Wallet', 'Present pass at check-in'];

  return (
    <GlassView
      intensity={isDark ? 24 : 12}
      style={[s.container, { width, borderColor: panelBorder, backgroundColor: panelBg }]}
      contentStyle={s.content}
    >
      <Text style={[s.title, { color: textColor }]}>Add to Wallet</Text>
      <Text style={[s.desc, { color: mutedColor }]}>
        Same lanyard pass as above — avatar, name, ID, and QR for Apple or Google Wallet.
      </Text>

      <View style={[s.sideSwitcher, { borderColor: panelBorder }]}>
        {(['front', 'back'] as const).map((opt) => {
          const active = side === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setSide(opt)}
              style={[s.sideBtn, active && { backgroundColor: withAlpha(WALLET_PASS_THEME.cyanHex, 0.12) }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.sideBtnLabel, { color: active ? WALLET_PASS_THEME.cyanHex : mutedColor }]}>
                {opt === 'front' ? 'Front' : 'Back'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.previewWrap}>
        {side === 'front' ? (
          <LanyardPassCard
            width={previewWidth}
            height={previewHeight}
            tierLabel={tierLabel}
            name={name}
            username={username}
            cpid={cpid}
            memberSince={memberSince}
            qrValue={qrValue}
            qrSize={qrSize}
            avatarUrl={avatarUrl}
            initials={initials}
            isVerified={isVerified}
            affiliation={affiliation}
          />
        ) : (
          <WalletBackCard
            name={name}
            username={username}
            tierLabel={tierLabel}
            cpid={cpid}
            profileUrl={profileUrl}
            memberSince={memberSince}
            location={location}
            affiliationName={affiliation?.name}
          />
        )}
      </View>

      <View style={s.stepsRow}>
        {steps.map((step, index) => (
          <View key={step} style={s.stepItem}>
            <View style={[s.stepBadge, { backgroundColor: withAlpha(WALLET_PASS_THEME.cyanHex, 0.14) }]}>
              <Text style={[s.stepBadgeText, { color: WALLET_PASS_THEME.cyanHex }]}>{index + 1}</Text>
            </View>
            <Text style={[s.stepText, { color: mutedColor }]}>{step}</Text>
          </View>
        ))}
      </View>

      {showApple ? (
        <Pressable
          onPress={onAddApple}
          disabled={isApplePending || !appleReady}
          style={({ pressed }) => [
            s.appleBtn,
            (!appleReady || isApplePending) && s.btnDisabled,
            pressed && appleReady && !isApplePending && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add to Apple Wallet"
        >
          {isApplePending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
              <View style={s.btnTextCol}>
                <Text style={s.appleBtnTitle}>Add to Apple Wallet</Text>
                <Text style={s.appleBtnSub}>
                  {appleReady ? 'Lanyard layout · QR check-in' : 'Apple Wallet not available on server'}
                </Text>
              </View>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      ) : null}

      {showGoogle ? (
        <Pressable
          onPress={onAddGoogle}
          disabled={isGooglePending || !googleReady}
          style={({ pressed }) => [
            s.googleBtn,
            (!googleReady || isGooglePending) && s.btnDisabled,
            pressed && googleReady && !isGooglePending && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save to Google Wallet"
        >
          {isGooglePending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
              <View style={s.btnTextCol}>
                <Text style={s.googleBtnTitle}>Save to Google Wallet</Text>
                <Text style={s.googleBtnSub}>
                  {googleReady ? 'Lanyard layout · tap for details' : 'Google Wallet not available on server'}
                </Text>
              </View>
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      ) : null}

      {!platformReady ? (
        <Text style={[s.unavailable, { color: mutedColor }]}>
          Wallet passes are not configured yet. Your digital ID cards above still work for sharing and check-in.
        </Text>
      ) : (
        <Text style={[s.legal, { color: mutedColor }]}>
          {formatWalletDisplayName(name, username)} · {cpid} · {tierLabel}
        </Text>
      )}
    </GlassView>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  content: { gap: 14, padding: 16 },
  title: { fontSize: 18, fontFamily: FontFamily.bold, textAlign: 'center' },
  desc: { fontSize: 12, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 17 },

  sideSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sideBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  sideBtnLabel: { fontSize: 12, fontFamily: FontFamily.semibold },

  previewWrap: { alignItems: 'center' },

  previewCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WALLET_PASS_THEME.cyanDarkHex,
    backgroundColor: WALLET_PASS_THEME.cyanHex,
    ...Platform.select({
      web: { boxShadow: '0 10px 28px rgba(0, 173, 239, 0.38)' } as object,
      default: {
        shadowColor: WALLET_PASS_THEME.cyanHex,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  previewBackBody: {
    backgroundColor: WALLET_PASS_THEME.whiteHex,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  previewBackList: { gap: 12 },
  previewBackRow: { gap: 2 },
  previewBackLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: WALLET_PASS_THEME.cyanHex,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  previewBackValue: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: WALLET_PASS_THEME.darkText,
    lineHeight: 17,
  },

  stepsRow: { gap: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  stepText: { flex: 1, fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 16 },

  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    borderWidth: 1,
    borderColor: '#1557B0',
  },
  btnDisabled: { opacity: 0.55 },
  btnTextCol: { flex: 1, gap: 2 },
  appleBtnTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  appleBtnSub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.7)' },
  googleBtnTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  googleBtnSub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.82)' },

  unavailable: { fontSize: 11, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 15 },
  legal: { fontSize: 9, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 13 },
});