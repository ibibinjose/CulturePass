/**
 * CulturePass Digital ID
 *
 * Reorganized, native-first layout:
 * - Identity summary card
 * - QR verification card
 * - Quick actions and wallet buttons
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { User, Membership } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi } from '@/modules/api';
import { formatLocationLabel } from '@/lib/format';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';

const CARD_WIDTH_FIXED = 340;
const QR_SIZE_FIXED = 176;
const AVATAR_SIZE = 68;
const SURFACE_WHITE = '#FFFFFF';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function QRScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [copied, setCopied] = useState(false);

  const cardWidth = Math.min(screenWidth - 32, CARD_WIDTH_FIXED);
  const qrSize = Math.min(cardWidth - 72, QR_SIZE_FIXED);

  const { userId: authUserId, isRestoring } = useAuth();
  const { data: user, isPending: userPending } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-qr', authUserId],
    queryFn: () => modulesApi.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });
  const userId = user?.id ?? authUserId;

  const { data: membership, isLoading: membershipLoading } = useQuery<Membership>({
    queryKey: [`/api/membership/${userId}`],
    enabled: !!userId,
  });

  const userProfileLoading =
    isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier = membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;
  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 5);
  const location = formatLocationLabel(user?.city, user?.country, '');

  const initials = useMemo(
    () => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  const qrValue = useMemo(
    () => JSON.stringify({ type: 'culturepass_id', cpid, name, username }),
    [cpid, name, username],
  );

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return '—';
    return new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [user?.createdAt]);

  // Wallet pass URLs — fetched lazily only when user is loaded
  const { data: appleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/apple', userId],
    queryFn: () => modulesApi.wallet.businessCardApple() as Promise<{ url: string }>,
    enabled: !!userId && Platform.OS === 'ios',
    staleTime: 8 * 60 * 1000, // 8 min (token expires in 10 min)
  });

  const { data: googleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/google', userId],
    queryFn: () => modulesApi.wallet.businessCardGoogle() as Promise<{ url: string }>,
    enabled: !!userId && Platform.OS === 'android',
    staleTime: 30 * 60 * 1000,
  });

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${name} — CulturePass`,
        message: `${name} (@${username})\nCPID: ${cpid}\n\n${siteUrl(`/u/${username}`)}`,
      });
    } catch {}
  };

  const handleCopy = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
    <View style={s.root}>
      <LinearGradient
        colors={gradients.midnight}
        style={StyleSheet.absoluteFill}
      />
      <AppHeaderBar
        title="Digital ID"
        subtitle="CulturePassport"
        backFallback="/(tabs)/my-space"
        topInset={topInset}
        rightAction={{
          icon: 'scan-outline',
          onPress: () => { 
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/scanner'); 
          },
          label: 'Scan a CulturePass',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40 }]}
      >
        {isLoading ? (
          <View style={{ gap: 14, alignItems: 'center', paddingTop: 20 }}>
            <Skeleton width={cardWidth} height={182} borderRadius={24} />
            <Skeleton width={cardWidth} height={320} borderRadius={24} />
            <View style={{ flexDirection: 'row', gap: 10, width: cardWidth }}>
              <Skeleton width="32%" height={66} borderRadius={14} />
              <Skeleton width="32%" height={66} borderRadius={14} />
              <Skeleton width="32%" height={66} borderRadius={14} />
            </View>
          </View>
        ) : (
          <>
            <View style={[s.identityCardWrap, { width: cardWidth }]}>
              <LinearGradient
                colors={[colors.surfaceElevated, colors.surface, colors.surfaceElevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.identityCard, { borderColor: colors.borderLight }]}
              >
                <View style={s.identityHeader}>
                  <View style={s.identityBrand}>
                    <Image
                      source={require('@/assets/images/culturepass-logo.png')}
                      style={s.identityBrandLogo}
                      contentFit="contain"
                      accessibilityLabel="CulturePass"
                    />
                    <View>
                      <Text style={[s.identityBrandTitle, { color: colors.text }]}>CulturePass ID</Text>
                    </View>
                  </View>
                </View>

                <View style={s.identityMainRow}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
                  ) : (
                    <View style={[s.avatarFallback, { backgroundColor: CultureTokens.indigo + '20', borderColor: CultureTokens.indigo + '40' }]}>
                      <Text style={[s.avatarInitials, { color: colors.text }]}>{initials}</Text>
                    </View>
                  )}
                  <View style={s.identityMeta}>
                    <Text style={[s.nameText, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[s.handleText, { color: colors.textSecondary }]} numberOfLines={1}>@{username}</Text>
                    {location ? (
                      <View style={[s.locationPill, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={[s.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={[s.identityInfoRow, { borderTopColor: colors.borderLight }]}>
                  <View style={s.infoBlock}>
                    <Text style={[s.infoLabel, { color: tierConf.color }]}>Member Since</Text>
                    <Text style={[s.infoValue, { color: colors.text }]}>{memberSince}</Text>
                  </View>
                  <Pressable
                    style={[s.cpidBtn, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                    onPress={handleCopy}
                    accessibilityRole="button"
                    accessibilityLabel={copied ? 'ID copied' : 'Copy CulturePass ID'}
                  >
                    <Text style={[s.cpidBtnLabel, { color: colors.textTertiary }]}>ID</Text>
                    <Text style={[s.cpidBtnValue, { color: colors.text }]} numberOfLines={1}>{cpid}</Text>
                    <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? '#34C759' : colors.textSecondary} />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>

            <View style={[s.qrCardWrap, { width: cardWidth }]}>
              <View style={s.qrCard}>
                <View style={s.qrTop}>
                  <Text style={s.qrTitle}>Scan to Verify</Text>
                  <Text style={s.qrSub}>Use this code to confirm this member identity.</Text>
                </View>
                <View style={s.qrPanel}>
                  <QRCode
                    value={qrValue}
                    size={qrSize}
                    color="#0F172A"
                    backgroundColor={SURFACE_WHITE}
                    ecl="H"
                  />
                </View>
                <Text style={s.qrFooter}>{cpid}</Text>
              </View>
            </View>

            <View style={[s.actionsRow, { width: cardWidth }]}>
              {([
                { icon: 'share-outline', label: 'Share', color: CultureTokens.indigo, onPress: handleShare },
                { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied' : 'Copy ID', color: copied ? '#34C759' : CultureTokens.gold, onPress: handleCopy },
                { icon: 'scan-outline', label: 'Scan', color: CultureTokens.coral, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
              ] as const).map((btn) => (
                <Pressable
                  key={btn.label}
                  style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.78 : 1 }]}
                  onPress={btn.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                >
                  <View style={[s.actionIcon, { backgroundColor: (btn.color as string) + '18' }]}>
                    <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={18} color={btn.color as string} />
                  </View>
                  <Text style={[s.actionLabel, { color: colors.textSecondary }]}>{btn.label}</Text>
                </Pressable>
              ))}
            </View>

            {(appleWallet?.url || googleWallet?.url) && (
              <View style={[s.walletSection, { width: cardWidth }]}>
                <Text style={[s.walletHeading, { color: colors.textTertiary }]}>ADD TO WALLET</Text>

                {/* Apple Wallet */}
                {appleWallet?.url && Platform.OS === 'ios' && (
                  <Pressable
                    style={({ pressed }) => [s.walletBtn, s.walletBtnApple, { opacity: pressed ? 0.82 : 1 }]}
                    onPress={async () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await openExternalUrl(appleWallet.url, { failureTitle: 'Could not open Apple Wallet' });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Apple Wallet"
                  >
                    <LinearGradient
                      colors={['#1C1C1E', '#000000']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
                    <View style={s.walletBtnText}>
                      <Text style={s.walletBtnSub}>Add to</Text>
                      <Text style={s.walletBtnTitle}>Apple Wallet</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
                  </Pressable>
                )}

                {/* Google Wallet */}
                {googleWallet?.url && Platform.OS === 'android' && (
                  <Pressable
                    style={({ pressed }) => [s.walletBtn, s.walletBtnGoogle, { opacity: pressed ? 0.82 : 1 }]}
                    onPress={async () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await openExternalUrl(googleWallet.url, { failureTitle: 'Could not open Google Wallet' });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Google Wallet"
                  >
                    <LinearGradient
                      colors={['#1A73E8', '#1557B0']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                    <View style={s.walletBtnText}>
                      <Text style={s.walletBtnSub}>Save to</Text>
                      <Text style={s.walletBtnTitle}>Google Wallet</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
                  </Pressable>
                )}
              </View>
            )}

            {interests.length > 0 && (
              <View style={[s.tagsSection, { width: cardWidth }]}>
                <Text style={[s.tagsHeading, { color: colors.textTertiary }]}>INTERESTS</Text>
                <View style={s.tagsRow}>
                  {interests.map(interest => (
                    <View key={interest} style={[s.tag, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '28' }]}>
                      <Text style={[s.tagText, { color: CultureTokens.indigo }]}>{capitalize(interest)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  scroll: { alignItems: 'center', paddingTop: 24, gap: 20 },

  identityCardWrap: {
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0px 12px 34px rgba(0,0,0,0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    }),
  },
  identityCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityBrandLogo: {
    width: 28,
    height: 28,
  },
  identityBrandTitle: {
    ...TextStyles.callout,
  },
  identityMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarInitials: {
    fontSize: 23,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  identityMeta: {
    flex: 1,
    gap: 3,
  },
  nameText: {
    fontSize: 23,
    lineHeight: 27,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  handleText: {
    ...TextStyles.chip,
  },
  locationPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  identityInfoRow: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...TextStyles.tabLabel,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  infoValue: {
    ...TextStyles.chip,
  },
  cpidBtn: {
    minWidth: 154,
    maxWidth: '56%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cpidBtnLabel: {
    ...TextStyles.tabLabel,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cpidBtnValue: {
    flex: 1,
    ...TextStyles.captionSemibold,
    letterSpacing: 0.2,
  },

  qrCardWrap: {
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0px 10px 26px rgba(0,0,0,0.24)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 6 },
    }),
  },
  qrCard: {
    borderRadius: 24,
    backgroundColor: SURFACE_WHITE,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  qrTop: {
    alignItems: 'center',
    marginBottom: 14,
  },
  qrTitle: {
    ...TextStyles.title3,
    color: '#0B1221',
  },
  qrSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#4B5563',
    textAlign: 'center',
  },
  qrPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: SURFACE_WHITE,
    marginVertical: 8,
  },
  qrFooter: {
    marginTop: 6,
    ...TextStyles.captionSemibold,
    letterSpacing: 1.4,
    color: '#111827',
  },

  actionsRow: { flexDirection: 'row', gap: 14 },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.2)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    }),
  },
  actionIcon:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...TextStyles.captionSemibold, color: '#fff' },

  walletSection:   { gap: 12, marginTop: 10 },
  walletHeading:   { ...TextStyles.badge, letterSpacing: 2, marginLeft: 4 },
  walletBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 18, paddingHorizontal: 22,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web:     { boxShadow: '0px 12px 32px rgba(0,0,0,0.4)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
    }),
  },
  walletBtnApple:  {},
  walletBtnGoogle: {},
  walletBtnText:   { flex: 1, gap: 2 },
  walletBtnSub:    { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  walletBtnTitle:  { ...TextStyles.title3, color: '#FFFFFF', letterSpacing: -0.3 },

  tagsSection: { gap: 12, marginTop: 10 },
  tagsHeading: { ...TextStyles.badge, letterSpacing: 2, marginLeft: 4 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag:         { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(0,102,204,0.1)', borderColor: 'rgba(0,102,204,0.3)' },
  tagText:     { ...TextStyles.chip, color: '#fff' },
});
