import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { GlassView } from '@/design-system/ui';
import { FontFamily, CultureTokens } from '@/design-system/tokens/theme';
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
    <View style={ws.previewCard}>
      <PassCardStrip tierLabel={tierLabel} compact />
      <View style={ws.previewBackBody}>
        <View style={ws.previewBackList}>
          {rows.map((row) => (
            <View key={row.label} style={ws.previewBackRow}>
              {'inline' in row && row.inline ? (
                <PassIdRow cpid={row.value} variant="onWhite" size="sm" />
              ) : (
                <>
                  <Text style={ws.previewBackLabel}>{row.label}</Text>
                  <Text style={ws.previewBackValue} numberOfLines={2}>{row.value}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const STEPS_APPLE = ['Tap Add to Apple Wallet', 'Confirm in Wallet app', 'Show QR at venue entry'];
const STEPS_GOOGLE = ['Tap Save to Google Wallet', 'Confirm in Google Wallet', 'Present pass at check-in'];

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

  const previewWidth = Math.min(width - 32, 360);
  const previewHeight = Math.round(Math.min(previewWidth, 360) * (WALLET_PASS_THEME.lanyardHeight / 330));
  const qrSize = Math.min(previewWidth - 96, 108);

  const steps = activePlatform === 'apple' ? STEPS_APPLE : STEPS_GOOGLE;

  return (
    <GlassView
      intensity={isDark ? 24 : 12}
      style={[ws.container, { width, borderColor: panelBorder, backgroundColor: panelBg }]}
      contentStyle={ws.content}
    >
      {/* Header */}
      <View style={ws.headerRow}>
        <LinearGradient
          colors={['#06b6d4', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ws.headerIconWrap}
        >
          <Ionicons name="wallet-outline" size={20} color="#fff" />
        </LinearGradient>
        <View style={ws.headerText}>
          <Text style={[ws.title, { color: textColor }]} accessibilityRole="header">Add to Wallet</Text>
          <Text style={[ws.desc, { color: mutedColor }]}>
            Same lanyard pass as above — avatar, name, ID, and branded QR.
          </Text>
        </View>
      </View>

      {/* Platform badges */}
      <View style={ws.platformRow}>
        {showApple && (
          <View style={[ws.platformBadge, { borderColor: withAlpha('#000', isDark ? 0.4 : 0.12), backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name="logo-apple" size={14} color={textColor} />
            <Text style={[ws.platformBadgeText, { color: textColor }]}>Apple Wallet</Text>
          </View>
        )}
        {showGoogle && (
          <View style={[ws.platformBadge, { borderColor: withAlpha('#1A73E8', 0.25), backgroundColor: withAlpha('#1A73E8', 0.06) }]}>
            <Ionicons name="logo-google" size={14} color="#1A73E8" />
            <Text style={[ws.platformBadgeText, { color: '#1A73E8' }]}>Google Wallet</Text>
          </View>
        )}
      </View>

      {/* Front / Back switcher */}
      <View style={[ws.sideSwitcher, { borderColor: panelBorder }]}>
        {(['front', 'back'] as const).map((opt) => {
          const active = side === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setSide(opt)}
              style={[ws.sideBtn, active && { backgroundColor: withAlpha(WALLET_PASS_THEME.cyanHex, 0.12), borderBottomWidth: 2, borderBottomColor: WALLET_PASS_THEME.cyanHex }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={opt === 'front' ? 'id-card-outline' : 'list-outline'} size={14} color={active ? WALLET_PASS_THEME.cyanHex : mutedColor} />
              <Text style={[ws.sideBtnLabel, { color: active ? WALLET_PASS_THEME.cyanHex : mutedColor }]}>
                {opt === 'front' ? 'Front' : 'Back'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={ws.previewWrap}>
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

      {/* Steps with connecting line */}
      <View style={ws.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step} style={ws.stepItem}>
            <View style={ws.stepLeft}>
              <LinearGradient
                colors={['#06b6d4', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={ws.stepBadge}
              >
                <Text style={ws.stepBadgeText}>{index + 1}</Text>
              </LinearGradient>
              {index < steps.length - 1 && (
                <View style={[ws.stepConnector, { backgroundColor: withAlpha(WALLET_PASS_THEME.cyanHex, 0.2) }]} />
              )}
            </View>
            <Text style={[ws.stepText, { color: mutedColor }]}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Wallet buttons */}
      {showApple ? (
        <Pressable
          onPress={onAddApple}
          disabled={isApplePending || !appleReady}
          style={({ pressed }) => [
            ws.appleBtn,
            (!appleReady || isApplePending) && ws.btnDisabled,
            pressed && appleReady && !isApplePending && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add to Apple Wallet"
        >
          {isApplePending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={ws.walletBtnIconWrap}>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              </View>
              <View style={ws.btnTextCol}>
                <Text style={ws.appleBtnTitle}>Add to Apple Wallet</Text>
                <Text style={ws.appleBtnSub}>
                  {appleReady ? 'Lanyard layout · QR check-in' : 'Apple Wallet not available on server'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </>
          )}
        </Pressable>
      ) : null}

      {showGoogle ? (
        <Pressable
          onPress={onAddGoogle}
          disabled={isGooglePending || !googleReady}
          style={({ pressed }) => [
            ws.googleBtn,
            (!googleReady || isGooglePending) && ws.btnDisabled,
            pressed && googleReady && !isGooglePending && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save to Google Wallet"
        >
          {isGooglePending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={[ws.walletBtnIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              </View>
              <View style={ws.btnTextCol}>
                <Text style={ws.googleBtnTitle}>Save to Google Wallet</Text>
                <Text style={ws.googleBtnSub}>
                  {googleReady ? 'Lanyard layout · tap for details' : 'Google Wallet not available on server'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
            </>
          )}
        </Pressable>
      ) : null}

      {!platformReady ? (
        <Text style={[ws.unavailable, { color: mutedColor }]}>
          Wallet passes are not configured yet. Your digital ID cards above still work for sharing and check-in.
        </Text>
      ) : (
        <Text style={[ws.legal, { color: mutedColor }]}>
          {formatWalletDisplayName(name, username)} · {cpid} · {tierLabel}
        </Text>
      )}

      {/* Benefits */}
      <View style={[ws.benefits, { borderTopColor: withAlpha(WALLET_PASS_THEME.cyanHex, 0.15), borderTopWidth: 1, paddingTop: 12 }]}>
        <Text style={[ws.benefitsTitle, { color: textColor }]}>Benefits</Text>
        {[
          { text: 'Always accessible offline', icon: 'cloud-offline-outline' as const },
          { text: 'Quick check-in at events', icon: 'flash-outline' as const },
          { text: 'Syncs with your CulturePass profile', icon: 'sync-outline' as const },
        ].map((item) => (
          <View key={item.text} style={ws.benefitRow}>
            <View style={[ws.benefitIconWrap, { backgroundColor: withAlpha(CultureTokens.emerald, 0.12) }]}>
              <Ionicons name={item.icon} size={14} color={CultureTokens.emerald} />
            </View>
            <Text style={[ws.benefitText, { color: textColor }]}>{item.text}</Text>
          </View>
        ))}
      </View>
    </GlassView>
  );
}

const ws = StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  content: { gap: 14, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontFamily: FontFamily.bold },
  desc: { fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 17 },
  platformRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformBadgeText: { fontSize: 12, fontFamily: FontFamily.semibold },
  sideSwitcher: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sideBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, minHeight: 44, borderBottomWidth: 2, borderBottomColor: 'transparent' },
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
  },
  previewBackBody: { backgroundColor: WALLET_PASS_THEME.whiteHex, paddingHorizontal: 14, paddingVertical: 14 },
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
  stepsContainer: { gap: 0 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 36 },
  stepLeft: { alignItems: 'center', width: 24 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#fff' },
  stepConnector: { width: 2, flex: 1, marginVertical: 2 },
  stepText: { flex: 1, fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 24 },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 56,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
    borderWidth: 1,
    borderColor: '#1557B0',
    minHeight: 56,
  },
  walletBtnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  btnDisabled: { opacity: 0.5 },
  btnTextCol: { flex: 1, gap: 2 },
  appleBtnTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  appleBtnSub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.65)' },
  googleBtnTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  googleBtnSub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.75)' },
  unavailable: { fontSize: 11, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 15 },
  legal: { fontSize: 9, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 13 },
  benefits: { gap: 10 },
  benefitsTitle: { fontSize: 12, fontFamily: FontFamily.bold, marginBottom: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  benefitText: { fontSize: 12, fontFamily: FontFamily.regular, flex: 1 },
});