/**
 * CulturePass Digital ID (Reimagined)
 *
 * A premium digital member pass screen designed with a hybrid of Muji-like organic minimalism
 * and Apple's luxury skeuomorphic fidelity:
 * - Dynamic card themes based on the user's membership tier (Obsidian Gold for Elite, Indigo Plum for Plus, Charcoal Stone for Free)
 * - Tactile golden EMV smartchip and NFC contactless wave indicators
 * - Realistic signature strip on the back with handwritten italic typography
 * - Living ambient background with floating animated glowing orbs (using Reanimated)
 * - Interactive 3D flippable card transition with spring physics
 * - Clean, standard size fields and premium action buttons
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Skeleton, PageContainer } from '@/design-system/ui';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi, ApiError } from '@/modules/api';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const CARD_WIDTH_FIXED = 330;
const CARD_HEIGHT_LANDSCAPE = 210;
const CARD_HEIGHT_VERTICAL = 440;

const QR_SIZE_LANDSCAPE = 84;
const QR_SIZE_VERTICAL = 120;

const AVATAR_SIZE_LANDSCAPE = 44;
const AVATAR_SIZE_VERTICAL = 64;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Dynamic Card Themes based on Membership Status — Luxe Heritage aligned, reduced raw hex where possible
const DYNAMIC_CARD_THEMES: Record<string, {
  cardGradients: [string, string, ...string[]];
  accent: string;
  border: string;
  text: string;
  glow: string;
  chipColor: string;
  chipBorder: string;
  isDarkCard: boolean;
}> = {
  free: {
    cardGradients: ['#1C1917', '#292524', '#1C1917'] as [string, string, ...string[]], // Muji Dark Charcoal / Stone
    accent: CultureTokens.terracottaGlow,
    border: 'rgba(227, 106, 78, 0.25)',
    text: '#F5F5F4',
    glow: 'rgba(227, 106, 78, 0.15)',
    chipColor: '#A8A29E', // Stone silver chip
    chipBorder: '#78716C',
    isDarkCard: true,
  },
  plus: {
    cardGradients: ['#1E1B4B', '#311042', '#1E1B4B'] as [string, string, ...string[]], // Deep Brand Purple / Indigo
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.4)',
    text: '#FFF0F0',
    glow: 'rgba(79, 70, 229, 0.35)',
    chipColor: '#E29578', // Warm rose gold chip
    chipBorder: '#B06D53',
    isDarkCard: true,
  },
  elite: {
    cardGradients: ['#09090B', '#18181B', '#09090B'] as [string, string, ...string[]], // Obsidian Matte Black
    accent: CultureTokens.gold,
    border: 'rgba(255, 200, 87, 0.45)',
    text: '#FFFBEB',
    glow: 'rgba(255, 200, 87, 0.25)',
    chipColor: '#D4A017', // Gold chip
    chipBorder: '#9E740C',
    isDarkCard: true,
  },
  pro: {
    cardGradients: ['#061F2E', '#0B3C5D', '#061F2E'] as [string, string, ...string[]], // Teal / Blue Pro
    accent: '#00F0FF',
    border: 'rgba(0, 240, 255, 0.45)',
    text: '#E0FAFF',
    glow: 'rgba(0, 240, 255, 0.25)',
    chipColor: '#00F0FF',
    chipBorder: '#00B4D8',
    isDarkCard: true,
  },
  // Extended for full TIER_CFG coverage (premium/vip fallbacks map elegantly)
  premium: {
    cardGradients: ['#1A0F0A', '#2C1810', '#1A0F0A'] as [string, string, ...string[]], // Warm terracotta heritage dark
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.5)',
    text: '#FFF1EB',
    glow: 'rgba(255, 94, 91, 0.22)',
    chipColor: '#F2C078',
    chipBorder: '#C17E3F',
    isDarkCard: true,
  },
  vip: {
    cardGradients: ['#0F0A02', '#1F1608', '#0F0A02'] as [string, string, ...string[]], // Deep heritage gold obsidian
    accent: CultureTokens.gold,
    border: 'rgba(255, 200, 87, 0.55)',
    text: '#FFFBEB',
    glow: 'rgba(255, 200, 87, 0.3)',
    chipColor: '#E8C36B',
    chipBorder: '#B38A2E',
    isDarkCard: true,
  },
};

function resolveCardTheme(tier: string) {
  const key = (tier || 'free').toLowerCase();
  if (key in DYNAMIC_CARD_THEMES) return DYNAMIC_CARD_THEMES[key];
  if (key === 'premium' || key === 'plus') return DYNAMIC_CARD_THEMES.plus;
  if (key === 'vip' || key === 'elite') return DYNAMIC_CARD_THEMES.elite;
  return DYNAMIC_CARD_THEMES.free;
}

export default function QRScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const { isDesktop } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const [copied, setCopied] = useState(false);
  
  const cardTextColor = '#0B0F19';
  const cardSecondaryTextColor = '#4B5563';
  const cardTertiaryTextColor = '#9CA3AF';

  // Better responsive card: elegant fixed on mobile, slightly larger premium on desktop (consistent with web sidebar layouts)
  const cardWidth = Math.min(
    screenWidth - (isDesktop ? 80 : 32),
    isDesktop ? 360 : CARD_WIDTH_FIXED
  );
  const qrSizeLandscape = Math.min(cardWidth - 84, isDesktop ? 96 : QR_SIZE_LANDSCAPE);
  const qrSizeVertical = Math.min(cardWidth - 84, isDesktop ? 140 : QR_SIZE_VERTICAL);

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

  const userProfileLoading = isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier = membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;

  // Retrieve active card theme configuration based on user membership (now covers all tiers)
  const cardTheme = useMemo(() => resolveCardTheme(tier), [tier]);

  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 4);

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

  // Safe wrappers: treat "Wallet not configured on server" (503 + code) as successful null data
  // so we avoid ERROR logs / Sentry noise when the feature is intentionally disabled in a deploy.
  const safeBusinessCardQuery = (kind: 'apple' | 'google') => async () => {
    try {
      return kind === 'apple'
        ? ((await modulesApi.wallet.businessCardApple()) as { url: string })
        : ((await modulesApi.wallet.businessCardGoogle()) as { url: string });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 503) {
        const m = err.message || '';
        if (m.includes('WALLET_APPLE_NOT_CONFIGURED') || m.includes('WALLET_GOOGLE_NOT_CONFIGURED')) {
          return null;
        }
      }
      throw err;
    }
  };

  // Wallet pass credentials
  const { data: appleWallet } = useQuery<{ url: string } | null>({
    queryKey: ['/api/wallet/business-card/apple', userId],
    queryFn: safeBusinessCardQuery('apple'),
    enabled: !!userId && (Platform.OS === 'ios' || Platform.OS === 'web'),
    staleTime: 8 * 60 * 1000,
    retry: false,
  });

  const { data: googleWallet } = useQuery<{ url: string } | null>({
    queryKey: ['/api/wallet/business-card/google', userId],
    queryFn: safeBusinessCardQuery('google'),
    enabled: !!userId && (Platform.OS === 'android' || Platform.OS === 'web'),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  // Reanimated Ambient Background Blobs Y/X Float
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(withSequence(withTiming(40, { duration: 7000 }), withTiming(-40, { duration: 7000 })), -1, true);
    blob1Y.value = withRepeat(withSequence(withTiming(30, { duration: 8000 }), withTiming(-30, { duration: 8000 })), -1, true);
    blob2X.value = withRepeat(withSequence(withTiming(-30, { duration: 9000 }), withTiming(30, { duration: 9000 })), -1, true);
    blob2Y.value = withRepeat(withSequence(withTiming(45, { duration: 10000 }), withTiming(-45, { duration: 10000 })), -1, true);
  }, [blob1X, blob1Y, blob2X, blob2Y]);

  const animatedBlob1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const animatedBlob2 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  // Holographic shimmer and spring scale animations (Tactile Apple/Jony Ive feel)
  const cardScale = useSharedValue(1);
  const shimmerX = useSharedValue(-150);

  const triggerShimmer = useCallback(() => {
    shimmerX.value = -150;
    shimmerX.value = withTiming(350, { duration: 1000 });
  }, [shimmerX]);

  useEffect(() => {
    triggerShimmer();
  }, [triggerShimmer]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.97, { damping: 12, stiffness: 100 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    triggerShimmer();
  };

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

  const handlePrint = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `CulturePass ID: ${name} (${cpid}). Profile: ${siteUrl(`/u/${username}`)}`,
        title: 'Print CulturePass ID',
      });
    } else {
      window.print();
    }
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
      <View style={s.root}>
        {/* Dynamic media print-friendly style injection (React Native Web compliant) */}
        {Platform.OS === 'web' && React.createElement('style', null, `
          @media print {
            body {
              background-color: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #print-badge-area, #print-badge-area * {
              visibility: visible !important;
            }
            #print-badge-area {
              position: absolute !important;
              left: 50% !important;
              top: 5% !important;
              transform: translateX(-50%) scale(1.0) !important;
              width: 330px !important;
              margin: 0 !important;
              box-shadow: none !important;
              background: transparent !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #card-1, #card-2 {
              border: 1px solid #888 !important;
              background-color: #ffffff !important;
              border-radius: 20px !important;
              box-shadow: none !important;
            }
            #heading-1, #heading-2 {
              display: none !important;
            }
            #print-spacer {
              height: 30px !important;
              display: block !important;
            }
          }
        `)}

        <LinearGradient
          colors={gradients.midnight}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient living blurred blobs (Luxe Heritage premium aesthetic) */}
        <View style={s.ambientContainer} pointerEvents="none">
          <Animated.View
            style={[
              s.ambientBlob,
              animatedBlob1,
              {
                backgroundColor: cardTheme.glow,
                top: -80,
                left: -60,
                width: 320,
                height: 320,
                borderRadius: 160,
              },
            ]}
          />
          <Animated.View
            style={[
              s.ambientBlob,
              animatedBlob2,
              {
                backgroundColor: (Luxe.colors?.indigo || '#4A5EBF') + '18',
                bottom: -50,
                right: -70,
                width: 350,
                height: 350,
                borderRadius: 175,
              },
            ]}
          />
        </View>

        <AppHeaderBar
          title={
            <Text style={{ fontSize: 19, fontFamily: FontFamily.bold }}>
              <Text style={{ color: '#FF3B30' }}>Culture</Text>
              <Text style={{ color: '#34C759' }}>Pass</Text>
            </Text>
          }
          subtitle="Add to Wallet • Digital Member ID"
          backFallback="/(tabs)/my-space"
          topInset={topInset}
          rightAction={{
            icon: 'scan-outline',
            onPress: () => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/scanner');
            },
            label: 'Scan ID',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40 }]}
        >
          <PageContainer compact noTopPadding>
          {isLoading ? (
            <View style={{ gap: 14, alignItems: 'center', paddingTop: 20 }}>
              <Skeleton width={cardWidth} height={CARD_HEIGHT_LANDSCAPE} borderRadius={24} />
              <Skeleton width={cardWidth} height={CARD_HEIGHT_VERTICAL} borderRadius={24} />
              <View style={{ height: 26 }} />
              <View style={{ flexDirection: 'row', gap: 10, width: cardWidth }}>
                <Skeleton width="32%" height={66} borderRadius={14} />
                <Skeleton width="32%" height={66} borderRadius={14} />
                <Skeleton width="32%" height={66} borderRadius={14} />
              </View>
            </View>
          ) : (
            <>
              {/* ========== WALLET-FIRST REDESIGN: Dual-Card Previews & Wallet Actions ========== */}
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={[s.walletHeroLabel, { color: colors.textTertiary }]}>YOUR CULTUREPASS DIGITAL PASSES</Text>
                <Text style={[s.walletHeroSub, { color: '#009CDE' }]}>
                  {tierConf.label.toUpperCase()} MEMBER PASSES
                </Text>
              </View>

              {/* Both printable/wallet cards grouped in the print container */}
              <View
                id="print-badge-area"
                nativeID="print-badge-area"
                style={[s.printBadgeArea, { width: cardWidth }]}
              >
                {/* CARD 1: Landscape Business Pass */}
                <Text style={s.cardHeadingLabel}>1. DIGITAL BUSINESS PASS</Text>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  style={{ width: cardWidth, marginBottom: 20 }}
                  accessibilityRole="button"
                  accessibilityLabel="Digital landscape business card. Tap for shimmer effect."
                >
                  <Animated.View style={[{ width: cardWidth }, cardAnimatedStyle]}>
                    <View
                      style={[
                        s.identityCard,
                        {
                          width: cardWidth,
                          height: CARD_HEIGHT_LANDSCAPE,
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                        },
                      ]}
                    >
                      {/* Diagonal light specular reflection overlay */}
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />

                      {/* Interactive holographic light reflection shimmer effect */}
                      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { width: '50%' }]} pointerEvents="none">
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      </Animated.View>

                      {/* Card Content Wrapper */}
                      <View style={s.cardInner}>
                        {/* Top Bar: Title & Tier */}
                        <View style={s.passHeaderContent}>
                          <Text style={s.passType}>
                            <Text style={{ color: '#FF3B30' }}>CULTURE</Text>
                            <Text style={{ color: '#34C759' }}>PASS</Text>
                            <Text style={{ color: '#009CDE' }}> ID</Text>
                          </Text>
                          <Text style={[s.passTier, { color: '#009CDE' }]}>
                            {tierConf.label.toUpperCase()}
                          </Text>
                        </View>

                        {/* Middle Section (Horizontal Layout) */}
                        <View style={s.passMiddle}>
                          {/* Left Column: User details + NFC indicator */}
                          <View style={s.leftCol}>
                            <View style={s.passUserRow}>
                              <View style={[s.passAvatarWrap, { borderColor: '#E5E7EB' }]}>
                                {avatarUrl ? (
                                  <Image source={{ uri: avatarUrl }} style={s.passAvatar} contentFit="cover" />
                                ) : (
                                  <View style={[s.passAvatarFallback, { backgroundColor: '#F3F4F6', borderColor: 'transparent' }]}>
                                    <Text style={[s.passAvatarInitials, { color: cardTextColor }]}>{initials}</Text>
                                  </View>
                                )}
                              </View>
                              <View style={s.passUserInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={[s.passName, { color: cardTextColor }]} numberOfLines={1}>
                                    {name}
                                  </Text>
                                  {(user as any)?.isVerified && <Ionicons name="checkmark-circle" size={12} color="#009CDE" />}
                                </View>
                                <Text style={[s.passHandle, { color: cardSecondaryTextColor }]}>
                                  @{username}
                                </Text>
                              </View>
                            </View>

                            {/* NFC Wave indicator at bottom-left */}
                            <View style={s.nfcLeftCol}>
                              <Ionicons name="wifi" size={14} color={cardSecondaryTextColor} style={{ transform: [{ rotate: '90deg' }] }} />
                              <Text style={[s.nfcTextCol, { color: cardSecondaryTextColor }]}>
                                NFC PASS ACTIVE
                              </Text>
                            </View>
                          </View>

                          {/* Right Column: QR Code + Monospace CPID */}
                          <View style={s.rightCol}>
                            <View style={s.qrWhiteBackground}>
                              <QRCode value={qrValue} size={qrSizeLandscape} color="#000000" backgroundColor="#FFFFFF" ecl="H" />
                            </View>
                            <Pressable onPress={handleCopy} style={s.cpidMonospaceContainer} hitSlop={8}>
                              <Text style={[s.cpidMonospaceText, { color: cardTextColor }]}>
                                {cpid.slice(0, 3)}-{cpid.slice(3)}
                              </Text>
                              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={11} color={copied ? '#30D158' : '#9CA3AF'} />
                            </Pressable>
                          </View>
                        </View>

                        {/* Bottom Secure Banner */}
                        <View style={s.cardFooterBanner}>
                          <Ionicons name="lock-closed-outline" size={10} color={cardTertiaryTextColor} />
                          <Text style={[s.cardFooterBannerText, { color: cardTertiaryTextColor }]}>
                            WALLET READY • iOS / ANDROID COMPATIBLE
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>

                {/* Print layout spacer (only active during print overrides) */}
                <View style={s.printSpacer} />

                {/* CARD 2: Vertical Event Pass / Apple Pass Style */}
                <Text style={s.cardHeadingLabel}>2. EVENT LANYARD & WALLET PASS</Text>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  style={{ width: cardWidth, marginBottom: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Digital vertical lanyard event pass. Tap for shimmer effect."
                >
                  <Animated.View style={[{ width: cardWidth }, cardAnimatedStyle]}>
                    <View
                      style={[
                        s.identityCard,
                        {
                          width: cardWidth,
                          height: CARD_HEIGHT_VERTICAL,
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                        },
                      ]}
                    >
                      {/* Diagonal light specular reflection overlay */}
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />

                      {/* Interactive holographic light reflection shimmer effect */}
                      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { width: '50%' }]} pointerEvents="none">
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      </Animated.View>

                      {/* Vertical Card Content Wrapper */}
                      <View style={s.cardInnerVertical}>
                        {/* Header Bar */}
                        <View style={s.passHeaderContent}>
                          <Text style={s.passType}>
                            <Text style={{ color: '#FF3B30' }}>CULTURE</Text>
                            <Text style={{ color: '#34C759' }}>PASS</Text>
                            <Text style={{ color: '#009CDE' }}> ID</Text>
                          </Text>
                          <Text style={[s.passTier, { color: '#009CDE' }]}>
                            {tierConf.label.toUpperCase()}
                          </Text>
                        </View>

                        {/* Top Profile Area (Centered vertical stack) */}
                        <View style={s.passProfileVertical}>
                          <View style={[s.passAvatarWrapVertical, { borderColor: '#E5E7EB' }]}>
                            {avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={s.passAvatarVertical} contentFit="cover" />
                            ) : (
                              <View style={[s.passAvatarFallbackVertical, { backgroundColor: '#F3F4F6' }]}>
                                <Text style={[s.passAvatarInitialsVertical, { color: cardTextColor }]}>{initials}</Text>
                              </View>
                            )}
                          </View>
                          <View style={s.passUserInfoVertical}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                              <Text style={[s.passNameVertical, { color: cardTextColor }]} numberOfLines={1}>
                                {name}
                              </Text>
                              {(user as any)?.isVerified && <Ionicons name="checkmark-circle" size={15} color="#009CDE" />}
                            </View>
                            <Text style={[s.passHandleVertical, { color: cardSecondaryTextColor }]}>
                              @{username}
                            </Text>
                            <Text style={[s.passMemberSinceVertical, { color: cardTertiaryTextColor }]}>
                              Member Since {memberSince}
                            </Text>
                          </View>
                        </View>

                        {/* Middle QR Code and Monospace CPID */}
                        <View style={s.passMiddleVertical}>
                          <View style={s.qrWhiteBackground}>
                            <QRCode value={qrValue} size={qrSizeVertical} color="#000000" backgroundColor="#FFFFFF" ecl="H" />
                          </View>
                          <Pressable onPress={handleCopy} style={s.cpidMonospaceContainer} hitSlop={8}>
                            <Text style={[s.cpidMonospaceTextVertical, { color: cardTextColor }]}>
                              {cpid.slice(0, 3)}-{cpid.slice(3)}
                            </Text>
                            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? '#30D158' : '#9CA3AF'} />
                          </Pressable>
                        </View>

                        {/* Bottom Contactless pass / waves panel */}
                        <View style={s.nfcBottomVertical}>
                          <Ionicons name="wifi" size={18} color={cardSecondaryTextColor} style={{ transform: [{ rotate: '90deg' }] }} />
                          <Text style={[s.nfcTextVertical, { color: cardSecondaryTextColor }]}>
                            TAP TO SCAN • EVENT LANYARD PASS
                          </Text>
                        </View>

                        {/* Bottom Secure Banner */}
                        <View style={s.cardFooterBannerVertical}>
                          <Ionicons name="lock-closed-outline" size={10} color={cardTertiaryTextColor} style={{ marginRight: 4 }} />
                          <Text style={[s.cardFooterBannerTextVertical, { color: cardTertiaryTextColor }]}>
                            WALLET SECURE • iOS / ANDROID COMPATIBLE
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>
              </View>

              <Text style={[s.passHint, { color: colors.textTertiary, width: cardWidth, marginBottom: 16 }]}>
                Tap cards to trigger light reflection shimmer · Integrated QR & NFC passes
              </Text>

              {/* ========== PRIMARY WALLET SAVE CTAs ========== */}
              <View style={[s.walletHero, { width: cardWidth }]}>
                <Text style={s.walletHeroTitle}>Save to Wallet</Text>
                <Text style={s.walletHeroDesc}>
                  Add your verified CulturePass Digital ID to Apple Wallet or Google Wallet for instant, offline access at events, venues, and check-ins.
                </Text>

                {/* Apple Wallet */}
                {appleWallet?.url && showAppleWallet && (
                  <Pressable
                    onPress={async () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await openExternalUrl(appleWallet.url, { failureTitle: 'Could not open Apple Wallet' });
                    }}
                    style={({ pressed }) => [
                      s.walletPrimaryBtn,
                      { backgroundColor: '#000000', borderColor: '#333' },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Add your CulturePass ID to Apple Wallet"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                      <View>
                        <Text style={s.walletPrimaryTitle}>Add to Apple Wallet</Text>
                        <Text style={s.walletPrimarySub}>Official .pkpass — works offline</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                )}

                {/* Google Wallet */}
                {googleWallet?.url && showGoogleWallet && (
                  <Pressable
                    onPress={async () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await openExternalUrl(googleWallet.url, { failureTitle: 'Could not open Google Wallet' });
                    }}
                    style={({ pressed }) => [
                      s.walletPrimaryBtn,
                      { backgroundColor: '#1A73E8', borderColor: '#1557B0' },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Save your CulturePass ID to Google Wallet"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                      <View>
                        <Text style={s.walletPrimaryTitle}>Save to Google Wallet</Text>
                        <Text style={s.walletPrimarySub}>Secure pass • Instant access</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                )}

                {/* Fallback Wallet Message */}
                {(!appleWallet?.url && !googleWallet?.url) && (
                  <View style={s.walletNotReady}>
                    <Ionicons name="wallet-outline" size={18} color={colors.textTertiary} />
                    <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      Wallet passes are being prepared for your account.{'\n'}Check back shortly or contact support if this persists.
                    </Text>
                  </View>
                )}

                <Text style={s.walletLegal}>
                  By adding this pass you allow Wallet to display your CulturePass ID (name, CPID, tier, location, verification signature). 
                  Apple and Google manage the pass securely according to their privacy policies.
                </Text>
              </View>

              {/* Action Tools Row */}
              <View style={{ marginTop: 12, width: cardWidth }}>
                <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>VERIFICATION & SHARING</Text>

                {/* The redesigned stylish 3-button actions row */}
                <View style={[s.actionsRow, { width: cardWidth }]}>
                  {([
                    { icon: 'share-outline', label: 'Share ID', color: colors.primary, onPress: handleShare },
                    { icon: copied ? 'checkmark-circle' : 'copy-outline', label: copied ? 'Copied' : 'Copy CPID', color: colors.gold, onPress: handleCopy },
                    { icon: 'print-outline', label: 'Print Pass', color: CultureTokens.coral, onPress: handlePrint },
                  ] as const).map((btn) => (
                    <Pressable
                      key={btn.label}
                      onPress={btn.onPress}
                      style={({ pressed }) => [
                        s.actionBtn,
                        {
                          borderColor: colors.borderLight,
                          backgroundColor: colors.surfaceVariant,
                          opacity: pressed ? 0.75 : 1
                        }
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={btn.label}
                    >
                      <View style={[s.actionIcon, { backgroundColor: btn.color + '12' }]}>
                        <Ionicons name={btn.icon as any} size={18} color={btn.color} />
                      </View>
                      <Text style={[s.actionLabel, { color: colors.textSecondary }]}>{btn.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Public profile link */}
                <Pressable
                  onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/u/${username}` as any); }}
                  style={{ marginTop: 12, alignSelf: 'center' }}
                >
                  <Text style={{ color: cardTheme.accent, fontSize: 13, textDecorationLine: 'underline' }}>
                    View public profile
                  </Text>
                </Pressable>
              </View>

              {/* Interests Tags */}
              {interests.length > 0 && (
                <View style={[s.tagsSection, { width: cardWidth, marginTop: 16 }]}>
                  <Text style={[s.tagsHeading, { color: colors.textTertiary }]}>INTERESTS</Text>
                  <View style={s.tagsRow}>
                    {interests.map(interest => (
                      <View key={interest} style={[s.tag, { backgroundColor: cardTheme.accent + '10', borderColor: cardTheme.accent + '20' }]}>
                        <Text style={[s.tagText, { color: cardTheme.accent }]}>{capitalize(interest)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
          </PageContainer>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

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
      web: { filter: 'blur(90px)' },
      default: {},
    }),
    opacity: 0.45,
  },

  scroll: { alignItems: 'center', paddingTop: 20, gap: 16 },

  printBadgeArea: {
    gap: 20,
    alignItems: 'center',
  },

  printSpacer: {
    height: 0,
    ...Platform.select({
      web: {
        display: 'none',
      },
    }),
  },

  cardHeadingLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginLeft: 4,
    marginBottom: -8,
    opacity: 0.8,
  },

  identityCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.25)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    }),
  },

  cardInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },

  cardInnerVertical: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },

  passHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  passType: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },

  passTier: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
  },

  passMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    marginVertical: 4,
  },

  passMiddleVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },

  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 10,
  },

  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  passUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  passAvatarWrap: {
    width: AVATAR_SIZE_LANDSCAPE,
    height: AVATAR_SIZE_LANDSCAPE,
    borderRadius: AVATAR_SIZE_LANDSCAPE / 2,
    overflow: 'hidden',
    borderWidth: 1,
  },

  passAvatar: {
    width: AVATAR_SIZE_LANDSCAPE,
    height: AVATAR_SIZE_LANDSCAPE,
  },

  passAvatarFallback: {
    width: AVATAR_SIZE_LANDSCAPE,
    height: AVATAR_SIZE_LANDSCAPE,
    borderRadius: AVATAR_SIZE_LANDSCAPE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passAvatarInitials: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },

  passUserInfo: {
    flex: 1,
    gap: 1,
  },

  passName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    lineHeight: 18,
  },

  passHandle: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  passProfileVertical: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },

  passAvatarWrapVertical: {
    width: AVATAR_SIZE_VERTICAL,
    height: AVATAR_SIZE_VERTICAL,
    borderRadius: AVATAR_SIZE_VERTICAL / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
  },

  passAvatarVertical: {
    width: AVATAR_SIZE_VERTICAL,
    height: AVATAR_SIZE_VERTICAL,
  },

  passAvatarFallbackVertical: {
    width: AVATAR_SIZE_VERTICAL,
    height: AVATAR_SIZE_VERTICAL,
    borderRadius: AVATAR_SIZE_VERTICAL / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passAvatarInitialsVertical: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },

  passUserInfoVertical: {
    alignItems: 'center',
    gap: 2,
  },

  passNameVertical: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    lineHeight: 22,
  },

  passHandleVertical: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  passMemberSinceVertical: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },

  nfcLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  nfcTextCol: {
    fontSize: 8.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },

  nfcBottomVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    width: '100%',
  },

  nfcTextVertical: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
  },

  qrWhiteBackground: {
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },

  cpidMonospaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },

  cpidMonospaceText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    fontWeight: 'bold',
  },

  cpidMonospaceTextVertical: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },

  cardFooterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },

  cardFooterBannerText: {
    fontSize: 8,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
  },

  cardFooterBannerVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },

  cardFooterBannerTextVertical: {
    fontSize: 8,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
  },

  passHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
    opacity: 0.65,
  },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },

  walletHero: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  walletHeroLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  walletHeroSub: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  walletHeroTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    color: '#fff',
  },
  walletHeroDesc: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 17,
  },
  walletPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  walletPrimaryTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  walletPrimarySub: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  walletLegal: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 6,
  },
  walletNotReady: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.4,
    marginBottom: 8,
    marginLeft: 2,
  },
  tagsSection: { gap: 8, marginTop: 8 },
  tagsHeading: {
    fontSize: 9.5,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});

