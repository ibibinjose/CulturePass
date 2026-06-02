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

import React, { useMemo, useState, useEffect } from 'react';
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
import { CultureTokens, gradients, TextStyles, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Skeleton, CulturePassWordmark, PageContainer } from '@/design-system/ui';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi } from '@/modules/api';
import { formatLocationLabel } from '@/lib/format';
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
  interpolate,
} from 'react-native-reanimated';

const CARD_WIDTH_FIXED = 330;
const CARD_HEIGHT = 460;
const QR_SIZE_FIXED = 150;
const AVATAR_SIZE = 60;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Dynamic Card Themes based on Membership Status
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

  const userProfileLoading = isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier = membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;

  // Retrieve active card theme configuration based on user membership
  const cardTheme = useMemo(() => {
    return DYNAMIC_CARD_THEMES[tier] ?? DYNAMIC_CARD_THEMES.free;
  }, [tier]);

  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 4);
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

  // Wallet pass credentials
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

        {/* Ambient living blurred blobs (Stripe/Apple visual aesthetic) */}
        <View style={s.ambientContainer} pointerEvents="none">
          <Animated.View
            style={[
              s.ambientBlob,
              animatedBlob1,
              {
                backgroundColor: cardTheme.accent + '15',
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
                backgroundColor: CultureTokens.indigo + '12',
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
          title="CulturePass"
          subtitle="Digital Member Pass"
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
          <PageContainer compact noTopPadding>
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

                {/* Front Side: Golden chip, EMV badge-like Passport */}
                <Animated.View style={[s.identityCardWrap, { width: cardWidth }, frontStyle]} pointerEvents={isFaceSide ? 'auto' : 'none'}>
                  <LinearGradient
                    colors={cardTheme.cardGradients}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.identityCard, { borderColor: cardTheme.border }]}
                  >
                    {/* Header Banner - Sleek Minimalist */}
                    <View style={s.passHeader}>
                      <View style={s.passHeaderContent}>
                        {/* Tactile Golden EMV Smartchip + Wave Contactless logo */}
                        <View style={s.chipBlock}>
                          <View style={[s.emvChip, { backgroundColor: cardTheme.chipColor, borderColor: cardTheme.chipBorder }]}>
                            <View style={[s.emvLineHorizontal, { backgroundColor: cardTheme.chipBorder }]} />
                            <View style={[s.emvLineVertical, { backgroundColor: cardTheme.chipBorder }]} />
                            <View style={[s.emvInnerChip, { borderColor: cardTheme.chipBorder }]} />
                          </View>
                          <Ionicons
                            name="wifi"
                            size={16}
                            color="rgba(255,255,255,0.3)"
                            style={{ transform: [{ rotate: '90deg' }], marginLeft: 2 }}
                          />
                        </View>
                        <View style={s.passHeaderRight}>
                          <Text style={[s.passType, { color: cardTheme.text }]}>MEMBER PASS</Text>
                          <Text style={[s.passTier, { color: cardTheme.accent }]}>{tierConf.label.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Holographic metallic-effect dividing strip */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.01)', cardTheme.border, 'rgba(255,255,255,0.01)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.hologramDivider}
                    />

                    {/* Body content */}
                    <View style={s.passBody}>
                      {/* Avatar + name display */}
                      <View style={s.passUserRow}>
                        <View style={s.passAvatarWrap}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={s.passAvatar} contentFit="cover" />
                          ) : (
                            <View style={[s.passAvatarFallback, { backgroundColor: cardTheme.accent + '25', borderColor: cardTheme.border }]}>
                              <Text style={[s.passAvatarInitials, { color: cardTheme.text }]}>{initials}</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.passUserInfo}>
                          <Text style={[s.passName, { color: cardTheme.text }]} numberOfLines={1}>{name}</Text>
                          <Text style={[s.passHandle, { color: 'rgba(255,255,255,0.6)' }]}>@{username}</Text>
                          <View style={s.passMetaRow}>
                            {location ? (
                              <View style={s.passMetaItem}>
                                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.5)" />
                                <Text style={[s.passMetaText, { color: 'rgba(255,255,255,0.5)' }]} numberOfLines={1}>{location}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {/* Monospaced embossed-style card identifier */}
                      <View style={[s.passIdStrip, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                        <Text style={[s.passIdLabel, { color: 'rgba(255,255,255,0.45)' }]}>CPID</Text>
                        <Pressable onPress={handleCopy} style={s.passIdValueWrap}>
                          <Text style={[s.passIdValue, { color: cardTheme.text }]} numberOfLines={1}>
                            {cpid.slice(0, 3)}-{cpid.slice(3)}
                          </Text>
                          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={copied ? '#34C759' : 'rgba(255,255,255,0.45)'} />
                        </Pressable>
                      </View>

                      {/* Recessed high-contrast QR Verification compartment */}
                      <View style={s.passQrSection}>
                        <View style={s.qrWhiteBackground}>
                          <QRCode
                            value={qrValue}
                            size={qrSize}
                            color="#090A0F"
                            backgroundColor="#FFFFFF"
                            ecl="H"
                          />
                        </View>
                        <Text style={[s.passQrFooter, { color: 'rgba(255,255,255,0.5)' }]}>
                          Scan to verify signature • Secure signature v2
                        </Text>
                      </View>
                    </View>

                    {/* Footer strip */}
                    <View style={s.passFooterStrip}>
                      <Text style={[s.passFooterText, { color: 'rgba(255,255,255,0.4)' }]}>
                        © CULTUREPASS PTY LTD • {memberSince} • MADE IN SYDNEY
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Back Side: Magnetic strip, signature block, terms */}
                <Animated.View style={[s.identityCardWrap, { width: cardWidth }, backStyle]} pointerEvents={!isFaceSide ? 'auto' : 'none'}>
                  <LinearGradient
                    colors={cardTheme.cardGradients}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.identityCard, { borderColor: cardTheme.border }]}
                  >
                    {/* Magnetic Stripe (realistic card simulation) */}
                    <View style={s.magneticStripe} />

                    <View style={s.backContent}>
                      <Text style={[s.backTitle, { color: cardTheme.text }]}>CULTUREPASS CARD PRIVILEGES</Text>
                      
                      {/* Realistic cursive signature block */}
                      <View style={s.signatureSection}>
                        <Text style={s.signatureLabel}>AUTHORIZED SIGNATURE</Text>
                        <View style={s.signaturePanel}>
                          <Text style={s.signatureText}>{name}</Text>
                        </View>
                      </View>

                      <View style={s.backDetails}>
                        <View style={s.backDetailRow}>
                          <Text style={[s.backDetailLabel, { color: 'rgba(255,255,255,0.45)' }]}>HOLDER</Text>
                          <Text style={[s.backDetailValue, { color: cardTheme.text }]} numberOfLines={1}>{name}</Text>
                        </View>
                        <View style={s.backDetailRow}>
                          <Text style={[s.backDetailLabel, { color: 'rgba(255,255,255,0.45)' }]}>MEMBER NO</Text>
                          <Text style={[s.backDetailValue, { color: cardTheme.text }]}>{cpid}</Text>
                        </View>
                        <View style={s.backDetailRow}>
                          <Text style={[s.backDetailLabel, { color: 'rgba(255,255,255,0.45)' }]}>SINCE</Text>
                          <Text style={[s.backDetailValue, { color: cardTheme.text }]}>{memberSince}</Text>
                        </View>
                      </View>

                      <View style={s.backFinePrint}>
                        <Text style={[s.backFineText, { color: colors.textTertiary }]}>
                          This card is the property of CulturePass. It is non-transferable and linked to your digital signature. Present it to event staff for validation.
                        </Text>
                        <Text style={[s.backFineText, { color: colors.textTertiary, marginTop: 8 }]}>
                          CulturePass.App — global community infrastructure
                        </Text>
                      </View>
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
                    backgroundColor: cardTheme.accent + '15',
                    borderColor: cardTheme.accent + '3C',
                    transform: [{ scale: pressed ? 0.96 : (hovered ? 1.04 : 1) }],
                    ...Platform.select({
                      web: {
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: hovered ? `0px 4px 20px ${cardTheme.accent}24` : 'none',
                        cursor: 'pointer',
                      },
                    }),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Flip passport card"
              >
                <Ionicons name="swap-horizontal" size={15} color={cardTheme.accent} />
                <Text style={[s.flipToggleBtnText, { color: cardTheme.accent }]}>
                  {isFaceSide ? 'Flip to Pass Back' : 'Flip to Pass Front'}
                </Text>
              </Pressable>

              {/* Usage hint text */}
              <Text style={[s.passHint, { color: colors.textTertiary, width: cardWidth }]}>
                Present this card at events and partner venues. Add to Apple or Google Wallet for secure, offline access.
              </Text>

              {/* Action Toolbar buttons */}
              <View style={[s.actionsRow, { width: cardWidth }]}>
                {([
                  { icon: 'share-outline', label: 'Share Link', color: CultureTokens.indigo, onPress: handleShare },
                  { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied' : 'Copy CPID', color: copied ? '#34C759' : CultureTokens.gold, onPress: handleCopy },
                  { icon: 'scan-outline', label: 'Scan ID', color: CultureTokens.coral, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
                ] as const).map((btn) => (
                  <Pressable
                    key={btn.label}
                    style={({ pressed, hovered }: any) => [
                      s.actionBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.95 : (hovered ? 1.05 : 1) }],
                        ...Platform.select({
                          web: {
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: hovered ? '0px 6px 20px rgba(0,0,0,0.15)' : 'none',
                            cursor: 'pointer',
                          },
                        }),
                      },
                    ]}
                    onPress={btn.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={btn.label}
                  >
                    <View style={[s.actionIcon, { backgroundColor: (btn.color as string) + '12' }]}>
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
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
                        colors={['#1F1F21', '#000000']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
                      <View style={s.walletBtnText}>
                        <Text style={s.walletBtnSub}>Add to</Text>
                        <Text style={s.walletBtnTitle}>Apple Wallet</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.4)" />
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
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
                      <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Interests tag list */}
              {interests.length > 0 && (
                <View style={[s.tagsSection, { width: cardWidth }]}>
                  <Text style={[s.tagsHeading, { color: colors.textTertiary }]}>CULTURAL INTERESTS</Text>
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

  flipCardContainer: {
    height: CARD_HEIGHT,
    position: 'relative',
    zIndex: 5,
  },

  identityCardWrap: {
    height: CARD_HEIGHT,
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0px 15px 35px rgba(0,0,0,0.35)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
    }),
  },

  identityCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0B0F19',
  },

  // Pass Header Banner
  passHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  passHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emvChip: {
    width: 38,
    height: 26,
    borderRadius: 5,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  emvLineHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
  },
  emvLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
  },
  emvInnerChip: {
    position: 'absolute',
    top: 5,
    left: 7,
    width: 22,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  passHeaderRight: {
    alignItems: 'flex-end',
  },
  passType: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },
  passTier: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  hologramDivider: {
    height: 1,
    width: '100%',
  },

  // Pass Body
  passBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  passUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passAvatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  passAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  passAvatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  passAvatarInitials: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  passUserInfo: {
    flex: 1,
    gap: 1,
  },
  passName: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
  },
  passHandle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  passMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  passMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  passMetaText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  // CPID Strip (Embossed card look)
  passIdStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  passIdLabel: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    letterSpacing: 1,
  },
  passIdValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passIdValue: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  // QR Section
  passQrSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  passQrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWhiteBackground: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  passQrFooter: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Pass Footer Strip
  passFooterStrip: {
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passFooterText: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
  },

  // Back of Card Styles
  backContent: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
    gap: 12,
  },
  magneticStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#111317',
  },
  backTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  signatureSection: {
    gap: 4,
    marginTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: FontFamily.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  signaturePanel: {
    height: 38,
    backgroundColor: '#FAF7F2', // Warm bone texture signature panel
    borderRadius: 4,
    justifyContent: 'center',
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  signatureText: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, serif' }),
    fontStyle: 'italic',
    fontSize: 16,
    color: '#292524',
    opacity: 0.85,
    transform: [{ rotate: '-1.5deg' }],
  },
  backDetails: {
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  backDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backDetailLabel: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
  },
  backDetailValue: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  backFinePrint: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  backFineText: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    lineHeight: 12,
    textAlign: 'center',
    opacity: 0.5,
  },

  // Flip Toggle
  flipToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
  },
  flipToggleBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  passHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
    opacity: 0.65,
  },

  // Action Buttons
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

  // Wallet Buttons
  walletSection: { gap: 8, marginTop: 8 },
  walletHeading: {
    fontSize: 9.5,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.25)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
    }),
  },
  walletBtnText: { flex: 1, gap: 0 },
  walletBtnSub: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  walletBtnTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Interests Tags
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
