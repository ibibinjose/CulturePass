/**
 * CulturePass Digital ID
 *
 * Reorganized, native-first layout:
 * - Interactive 3D flippable Passport Card (Front: Identity, Back: QR Verification)
 * - Premium glassmorphism matching the user's membership tier
 * - Golden EMV smartchip & magnetic stripe details for authentic realism
 * - Floating background blobs & modern hover actions
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
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { User, Membership } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, TextStyles, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Skeleton } from '@/design-system/ui';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi } from '@/modules/api';
import { formatLocationLabel } from '@/lib/format';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';

const CARD_WIDTH_FIXED = 340;
const CARD_HEIGHT = 330;
const QR_SIZE_FIXED = 136;
const AVATAR_SIZE = 80;
const SURFACE_WHITE = '#FFFFFF';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Custom theme mapping for each membership tier
const getTierTheme = (tierKey: string) => {
  const t = tierKey.toLowerCase();
  switch (t) {
    case 'plus':
      return {
        cardGradients: ['#0A2F2B', '#021F1C', '#0D3E3A'],
        accent: CultureTokens.teal,
        border: 'rgba(45, 212, 191, 0.3)',
        text: '#E6F4F1',
        glow: 'rgba(45, 212, 191, 0.45)',
      };
    case 'elite':
      return {
        cardGradients: ['#2D1F05', '#170F00', '#36260B'],
        accent: CultureTokens.gold,
        border: 'rgba(212, 175, 55, 0.38)',
        text: '#FAF3E0',
        glow: 'rgba(212, 175, 55, 0.45)',
      };
    case 'pro':
      return {
        cardGradients: ['#210B3B', '#110321', '#2C124D'],
        accent: '#8B5CF6',
        border: 'rgba(139, 92, 246, 0.3)',
        text: '#F5F3FF',
        glow: 'rgba(139, 92, 246, 0.45)',
      };
    case 'premium':
      return {
        cardGradients: ['#3A0D18', '#20030B', '#4C1322'],
        accent: CultureTokens.coral,
        border: 'rgba(244, 63, 94, 0.35)',
        text: '#FFF1F2',
        glow: 'rgba(244, 63, 94, 0.45)',
      };
    case 'vip':
      return {
        cardGradients: ['#141414', '#080808', '#222222'],
        accent: '#D4AF37',
        border: 'rgba(212, 175, 55, 0.45)',
        text: '#FFFFFF',
        glow: 'rgba(212, 175, 55, 0.55)',
      };
    case 'free':
    default:
      return {
        cardGradients: ['#1E293B', '#0F172A', '#25354C'],
        accent: '#64748B',
        border: 'rgba(148, 163, 184, 0.22)',
        text: '#F1F5F9',
        glow: 'rgba(148, 163, 184, 0.25)',
      };
  }
};

export default function QRScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const [copied, setCopied] = useState(false);

  const cardWidth = Math.min(screenWidth - 32, CARD_WIDTH_FIXED);
  const qrSize = Math.min(cardWidth - 84, QR_SIZE_FIXED);

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
  const tierTheme = getTierTheme(tier);

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

  // Lazy loaded apple/google wallet passes
  const { data: appleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/apple', userId],
    queryFn: () => modulesApi.wallet.businessCardApple() as Promise<{ url: string }>,
    enabled: !!userId && (Platform.OS === 'ios' || Platform.OS === 'web'),
    staleTime: 8 * 60 * 1000,
  });

  const { data: googleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/google', userId],
    queryFn: () => modulesApi.wallet.businessCardGoogle() as Promise<{ url: string }>,
    enabled: !!userId && (Platform.OS === 'android' || Platform.OS === 'web'),
    staleTime: 30 * 60 * 1000,
  });

  // Reanimated Card Flipping State
  const [isFaceSide, setIsFaceSide] = useState(true);
  const isFlipped = useSharedValue(0);

  const toggleFlip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const target = isFlipped.value === 0 ? 1 : 0;
    isFlipped.value = withSpring(target, {
      damping: 14,
      stiffness: 80,
    });
    setIsFaceSide(target === 0);
  };

  const frontStyle = useAnimatedStyle(() => {
    const spin = isFlipped.value * 180;
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${spin}deg` },
      ],
      opacity: isFlipped.value > 0.5 ? 0 : 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const spin = (isFlipped.value * 180) + 180;
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${spin}deg` },
      ],
      opacity: isFlipped.value > 0.5 ? 1 : 0,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  // Wallet Display Rules
  const showAppleWallet = useMemo(() => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return /iPhone|iPad|iPod|Macintosh|Mac OS X/.test(navigator.userAgent);
    }
    return false;
  }, []);

  const showGoogleWallet = useMemo(() => {
    if (Platform.OS === 'android') return true;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return /Android|Windows|Linux/.test(navigator.userAgent);
    }
    return false;
  }, []);

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

        {/* Ambient glowing blobs */}
        <View style={s.ambientContainer} pointerEvents="none">
          <View
            style={[
              s.ambientBlob,
              {
                backgroundColor: tierTheme.accent + '12',
                top: -85,
                left: -85,
                width: 320,
                height: 320,
                borderRadius: 160,
              },
            ]}
          />
          <View
            style={[
              s.ambientBlob,
              {
                backgroundColor: CultureTokens.indigo + '10',
                bottom: -60,
                right: -60,
                width: 360,
                height: 360,
                borderRadius: 180,
              },
            ]}
          />
        </View>

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
              <Skeleton width={cardWidth} height={CARD_HEIGHT} borderRadius={24} />
              <View style={{ height: 46 }} />
              <View style={{ flexDirection: 'row', gap: 10, width: cardWidth }}>
                <Skeleton width="32%" height={66} borderRadius={14} />
                <Skeleton width="32%" height={66} borderRadius={14} />
                <Skeleton width="32%" height={66} borderRadius={14} />
              </View>
            </View>
          ) : (
            <>
              {/* 3D Flippable Passport Card Container */}
              <View style={[s.flipCardContainer, { width: cardWidth }]}>
                
                {/* Front Side: Identity Badge */}
                <Animated.View style={[s.identityCardWrap, { width: cardWidth }, frontStyle]} pointerEvents={isFaceSide ? 'auto' : 'none'}>
                  <LinearGradient
                    colors={tierTheme.cardGradients as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.identityCard, { borderColor: tierTheme.border }]}
                  >
                    {/* Reflective gloss diagonal overlay */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.06)', 'transparent', 'rgba(0,0,0,0.06)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />

                    {/* Logo & smartchip row */}
                    <View style={s.identityHeader}>
                      <View style={s.identityBrand}>
                        <Image
                          source={require('@/assets/images/culturepass-logo.png')}
                          style={s.identityBrandLogo}
                          contentFit="contain"
                          accessibilityLabel="CulturePass"
                        />
                        <Text style={[s.identityBrandTitle, { color: colors.text }]}>CulturePass ID</Text>
                      </View>

                      {/* Golden Smartchip */}
                      <View style={s.smartChip}>
                        <View style={s.smartChipInner}>
                          <View style={s.smartChipLineH1} />
                          <View style={s.smartChipLineH2} />
                          <View style={s.smartChipLineV} />
                        </View>
                      </View>
                    </View>

                    {/* Avatar and Info section */}
                    <View style={s.identityMainRow}>
                      <View style={s.avatarContainer}>
                        {avatarUrl ? (
                          <Image source={{ uri: avatarUrl }} style={[s.avatar, { borderColor: tierTheme.accent }]} contentFit="cover" />
                        ) : (
                          <View style={[s.avatarFallback, { backgroundColor: tierTheme.accent + '20', borderColor: tierTheme.accent }]}>
                            <Text style={[s.avatarInitials, { color: colors.text }]}>{initials}</Text>
                          </View>
                        )}
                        {/* Tier Emblem Indicator */}
                        <View style={[s.tierBadgeContainer, { backgroundColor: tierTheme.accent }]}>
                          <Ionicons name={tierConf.icon as any} size={10} color="#0B0F19" />
                        </View>
                      </View>

                      <View style={s.identityMeta}>
                        <View style={s.tierTagContainer}>
                          <Text style={[s.tierTagText, { color: tierTheme.accent }]}>{tierConf.label.toUpperCase()}</Text>
                        </View>
                        <Text style={[s.nameText, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                        <Text style={[s.handleText, { color: colors.textSecondary }]} numberOfLines={1}>@{username}</Text>
                        {location ? (
                          <View style={[s.locationPill, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                            <Text style={[s.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{location}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Bottom Metadata row */}
                    <View style={[s.identityInfoRow, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                      <View style={s.infoBlock}>
                        <Text style={[s.infoLabel, { color: colors.textTertiary }]}>MEMBER SINCE</Text>
                        <Text style={[s.infoValue, { color: colors.text }]}>{memberSince}</Text>
                      </View>
                      <Pressable
                        style={[s.cpidBtn, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }]}
                        onPress={handleCopy}
                        accessibilityRole="button"
                        accessibilityLabel={copied ? 'ID copied' : 'Copy CulturePass ID'}
                      >
                        <Text style={[s.cpidBtnLabel, { color: colors.textTertiary }]}>ID</Text>
                        <Text style={[s.cpidBtnValue, { color: colors.text }]} numberOfLines={1}>{cpid}</Text>
                        <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={15} color={copied ? '#34C759' : colors.textSecondary} />
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Back Side: QR Verification */}
                <Animated.View style={[s.identityCardWrap, { width: cardWidth }, backStyle]} pointerEvents={!isFaceSide ? 'auto' : 'none'}>
                  <LinearGradient
                    colors={tierTheme.cardGradients as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.identityCard, { borderColor: tierTheme.border, paddingTop: 56 }]}
                  >
                    {/* Magnetic Stripe */}
                    <View style={s.magneticStripe} />

                    <View style={s.qrBackHeader}>
                      <Text style={[s.qrBackTitle, { color: colors.text }]}>SECURE PASS VERIFICATION</Text>
                      <Text style={[s.qrBackSubtitle, { color: colors.textSecondary }]}>Scan to verify membership status</Text>
                    </View>

                    {/* QR Code container */}
                    <View style={s.qrContainerBack}>
                      <View style={s.qrWhiteBackground}>
                        <QRCode
                          value={qrValue}
                          size={qrSize}
                          color="#0B0F19"
                          backgroundColor="#FFFFFF"
                          ecl="H"
                        />
                      </View>
                    </View>

                    {/* QR Footer details */}
                    <View style={s.qrBackFooter}>
                      <Text style={[s.qrBackFooterText, { color: colors.textSecondary }]}>
                        CPID: <Text style={{ color: colors.text, fontFamily: FontFamily.bold }}>{cpid}</Text>
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>

              </View>

              {/* Flip Action Button */}
              <Pressable
                onPress={toggleFlip}
                style={({ pressed, hovered }: any) => [
                  s.flipToggleBtn,
                  {
                    backgroundColor: tierTheme.accent + '15',
                    borderColor: tierTheme.accent + '4A',
                    transform: [{ scale: pressed ? 0.96 : (hovered ? 1.04 : 1) }],
                    ...Platform.select({
                      web: {
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: hovered ? `0px 4px 15px ${tierTheme.accent}24` : 'none',
                        cursor: 'pointer',
                      },
                    }),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Flip passport card"
              >
                <Ionicons name="swap-horizontal" size={16} color={tierTheme.accent} />
                <Text style={[s.flipToggleBtnText, { color: tierTheme.accent }]}>
                  {isFaceSide ? 'Flip to QR Verification' : 'Flip to Member ID'}
                </Text>
              </Pressable>

              {/* Action row buttons */}
              <View style={[s.actionsRow, { width: cardWidth }]}>
                {([
                  { icon: 'share-outline', label: 'Share', color: CultureTokens.indigo, onPress: handleShare },
                  { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied' : 'Copy ID', color: copied ? '#34C759' : CultureTokens.gold, onPress: handleCopy },
                  { icon: 'scan-outline', label: 'Scan', color: CultureTokens.coral, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
                ] as const).map((btn) => (
                  <Pressable
                    key={btn.label}
                    style={({ pressed, hovered }: any) => [
                      s.actionBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.07)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)',
                        opacity: pressed ? 0.78 : 1,
                        transform: [{ scale: pressed ? 0.96 : (hovered ? 1.04 : 1) }],
                        ...Platform.select({
                          web: {
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: hovered ? '0px 8px 24px rgba(0,0,0,0.25)' : 'none',
                            cursor: 'pointer',
                          },
                        }),
                      },
                    ]}
                    onPress={btn.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={btn.label}
                  >
                    <View style={[s.actionIcon, { backgroundColor: (btn.color as string) + '15' }]}>
                      <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={18} color={btn.color as string} />
                    </View>
                    <Text style={[s.actionLabel, { color: colors.textSecondary }]}>{btn.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Wallet Integration Section */}
              {(appleWallet?.url || googleWallet?.url) && (
                <View style={[s.walletSection, { width: cardWidth }]}>
                  <Text style={[s.walletHeading, { color: colors.textTertiary }]}>ADD TO WALLET</Text>

                  {/* Apple Wallet Button */}
                  {appleWallet?.url && showAppleWallet && (
                    <Pressable
                      style={({ pressed, hovered }: any) => [
                        s.walletBtn,
                        {
                          transform: [{ scale: pressed ? 0.97 : (hovered ? 1.03 : 1) }],
                          ...Platform.select({
                            web: {
                              transition: 'all 0.2s ease-in-out',
                              cursor: 'pointer',
                            },
                          }),
                        },
                      ]}
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

                  {/* Google Wallet Button */}
                  {googleWallet?.url && showGoogleWallet && (
                    <Pressable
                      style={({ pressed, hovered }: any) => [
                        s.walletBtn,
                        {
                          transform: [{ scale: pressed ? 0.97 : (hovered ? 1.03 : 1) }],
                          ...Platform.select({
                            web: {
                              transition: 'all 0.2s ease-in-out',
                              cursor: 'pointer',
                            },
                          }),
                        },
                      ]}
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

              {/* Interests tag list */}
              {interests.length > 0 && (
                <View style={[s.tagsSection, { width: cardWidth }]}>
                  <Text style={[s.tagsHeading, { color: colors.textTertiary }]}>INTERESTS</Text>
                  <View style={s.tagsRow}>
                    {interests.map(interest => (
                      <View key={interest} style={[s.tag, { backgroundColor: tierTheme.accent + '15', borderColor: tierTheme.accent + '25' }]}>
                        <Text style={[s.tagText, { color: tierTheme.accent }]}>{capitalize(interest)}</Text>
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

  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientBlob: {
    position: 'absolute',
    ...Platform.select({
      web: { filter: 'blur(80px)' },
      default: {},
    }),
    opacity: 0.55,
  },

  scroll: { alignItems: 'center', paddingTop: 24, gap: 20 },

  flipCardContainer: {
    height: CARD_HEIGHT,
    position: 'relative',
    zIndex: 5,
  },

  identityCardWrap: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0px 12px 34px rgba(0,0,0,0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
    }),
  },
  identityCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.2,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityBrandLogo: {
    width: 24,
    height: 24,
  },
  identityBrandTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  smartChip: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E5C158',
    padding: 3,
    borderWidth: 1,
    borderColor: '#C5A038',
    overflow: 'hidden',
  },
  smartChipInner: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: 'rgba(0,0,0,0.18)',
    borderRadius: 3.5,
  },
  smartChipLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  smartChipLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  smartChipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  identityMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 20,
    borderWidth: 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInitials: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  tierBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0B0F19',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  identityMeta: {
    flex: 1,
    gap: 3,
  },
  tierTagContainer: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    marginBottom: 2,
  },
  tierTagText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },
  nameText: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  handleText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  locationPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  locationText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
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
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.1,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  cpidBtn: {
    minWidth: 136,
    maxWidth: '56%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cpidBtnLabel: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
  },
  cpidBtnValue: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },

  // Back of Card Styles
  magneticStripe: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  qrBackHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  qrBackTitle: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  qrBackSubtitle: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  qrContainerBack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWhiteBackground: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  qrBackFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  qrBackFooterText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
  },

  // Flip Toggle Trigger Button
  flipToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  flipToggleBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },

  // Action Buttons
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },

  // Wallet Buttons
  walletSection: { gap: 10, marginTop: 10 },
  walletHeading: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      web: { boxShadow: '0px 10px 24px rgba(0,0,0,0.35)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10 },
    }),
  },
  walletBtnText: { flex: 1, gap: 1 },
  walletBtnSub: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
  walletBtnTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Interest Tags
  tagsSection: { gap: 10, marginTop: 10 },
  tagsHeading: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});
