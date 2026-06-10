/**
 * CulturePass Digital ID — clean member pass screen with white business and lanyard cards.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
// eslint-disable-next-line no-restricted-imports
import { Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { User, Membership, Profile } from '@shared/schema';

import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { resolveQrCardTheme } from '@/design-system/tokens/qrCardThemes';

import { Skeleton, PageContainer, GlassView, M3SectionHeader } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import {
  BusinessPassCard,
  LanyardPassCard,
  EventTicketPassPreview,
  PassMemberHero,
  PassViewSwitcher,
  WalletAddSection,
  PassColorPicker,
  PassCardLabel,
  WALLET_PASS_THEME,
  PASS_TYPE_LABELS,
  getPassColorTheme,
  type PassViewKey,
  type PassColorVariant,
} from '@/modules/profile/components/digitalId';
import {
  downloadPassCardPng,
  printPassCardPdf,
  capturePassCardAssetsFromDom,
  PASS_EXPORT_WIDTH,
  PASS_EXPORT_BUSINESS_HEIGHT,
  PASS_EXPORT_LANYARD_HEIGHT,
  type PassExportInput,
} from '@/modules/profile/components/digitalId/passCardExport';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi } from '@/modules/api';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { formatWalletError } from '@/lib/walletErrors';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';
import Animated, { FadeIn } from 'react-native-reanimated';

/** Fetch a remote image URL and convert it to a base64 data URI.
 *  Returns null on any failure (CORS, network, etc.) — caller falls back to initials.
 */
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const CARD_WIDTH_FIXED = PASS_EXPORT_WIDTH;
const CARD_HEIGHT_LANDSCAPE = PASS_EXPORT_BUSINESS_HEIGHT;
const CARD_HEIGHT_VERTICAL = PASS_EXPORT_LANYARD_HEIGHT;

const QR_SIZE_LANDSCAPE = 88;
const QR_SIZE_VERTICAL = 132;

const AVATAR_SIZE_LANDSCAPE = 44;
const AVATAR_SIZE_VERTICAL = 64;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const resolveCardTheme = resolveQrCardTheme;


export default function QRScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const { isDesktop, hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const [copied, setCopied] = useState(false);
  const [passView, setPassView] = useState<PassViewKey>('lanyard');
  const [passColor, setPassColor] = useState<PassColorVariant>('cyan');
  const [resolvingAvatar, setResolvingAvatar] = useState(false);
  const passColorTheme = useMemo(() => getPassColorTheme(passColor), [passColor]);

  // Responsive card sizing — side-by-side on desktop, stacked on mobile
  const sideBySide = isDesktop && screenWidth >= 720;
  const contentMaxWidth = sideBySide ? 920 : CARD_WIDTH_FIXED;
  const horizontalGutter = hPad * 2 + (sideBySide ? 40 : 0);
  /** Fixed pass dimensions — must match PNG/PDF export (WYSIWYG). */
  const passCardWidth = CARD_WIDTH_FIXED;
  const cardWidth = sideBySide
    ? Math.min(Math.floor((Math.min(screenWidth, contentMaxWidth) - horizontalGutter) / 2), passCardWidth)
    : passCardWidth;
  const qrSizeLandscape = QR_SIZE_LANDSCAPE;
  const qrSizeVertical = QR_SIZE_VERTICAL;
  const containerWidth = Math.min(sideBySide ? cardWidth * 2 + 20 : passCardWidth, contentMaxWidth);

  const { userId: authUserId, isRestoring, updateUserProfile } = useAuth();
  const { data: user, isPending: userPending } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-qr', authUserId],
    queryFn: () => modulesApi.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });
  const userId = user?.id ?? authUserId;

  const { data: myProfilesData } = useQuery({
    queryKey: ['/api/profiles/my'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!userId,
  });
  const myProfiles = myProfilesData ?? [];

  const { data: membership, isLoading: membershipLoading } = useQuery<Membership>({
    queryKey: ['membership', userId],
    queryFn: () => modulesApi.membership.get(userId!) as unknown as Promise<Membership>,
    enabled: !!userId,
  });

  const userProfileLoading = isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier = membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;
  const cardTheme = useMemo(() => resolveCardTheme(tier), [tier]);
  const panelBg = isDark ? withAlpha(colors.surface, 0.92) : colors.surface;
  const panelBorder = isDark ? withAlpha(cardTheme.accent, 0.22) : colors.borderLight;
  const mutedOnPanel = colors.textSecondary;

  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 4);

  const { data: userTickets } = useQuery({
    queryKey: ['tickets', userId, 'profile-qr'],
    queryFn: () => modulesApi.tickets.forUser(userId!),
    enabled: !!userId,
  });

  const upcomingTicket = useMemo(() => {
    const list = userTickets ?? [];
    const now = Date.now();
    return list.find((t) => {
      const raw = t.eventDate ?? t.date;
      if (!raw) return true;
      const parsed = new Date(raw).getTime();
      return Number.isNaN(parsed) || parsed >= now;
    }) ?? list[0] ?? null;
  }, [userTickets]);

  const eventQrValue = useMemo(() => {
    if (!upcomingTicket) {
      return JSON.stringify({ type: 'culturepass_id', cpid, name, username });
    }
    return JSON.stringify({
      type: 'culturepass_ticket',
      ticketId: upcomingTicket.id,
      cpid,
      name,
      username,
    });
  }, [upcomingTicket, cpid, name, username]);

  const profileUrl = siteUrl(`/cpu/${cpid}`);

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

  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const flashTimerRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isApplePending, setIsApplePending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  const showFlash = (type: 'success' | 'error', text: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage({ type, text });
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2600);
  };

  const handleAddAppleWalletCard = async () => {
    if (!userId) return;
    setIsApplePending(true);
    try {
      const result = await modulesApi.wallet.businessCardApple();
      const passUrl = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
      const safeCpid = cpid.replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `CulturePass-ID-${safeCpid || 'member'}.pkpass`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const response = await fetch(passUrl, { cache: 'no-store', mode: 'cors' });
        if (!response.ok) throw new Error('Could not download wallet pass.');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.rel = 'noopener noreferrer';
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } else {
        const opened = await openExternalUrl(passUrl, { failureTitle: 'Could not open Apple Wallet' });
        if (!opened) throw new Error('Unable to open Apple Wallet pass.');
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash(
        'success',
        Platform.OS === 'web'
          ? `Downloaded ${filename} — open it to add to Wallet. Delete any older CulturePass.pkpass files first.`
          : 'Apple Wallet pass opened',
      );
    } catch (err: unknown) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', formatWalletError(err, 'apple'));
    } finally {
      setIsApplePending(false);
    }
  };

  const handleAddGoogleWalletCard = async () => {
    if (!userId) return;
    setIsGooglePending(true);
    try {
      const result = await modulesApi.wallet.businessCardGoogle();
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Google Wallet' });
      if (!opened) throw new Error('Unable to open Google Wallet pass.');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet save page opened');
    } catch (err: unknown) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', formatWalletError(err, 'google'));
    } finally {
      setIsGooglePending(false);
    }
  };

  const showAppleWallet = Platform.OS === 'ios' || Platform.OS === 'web';
  const showGoogleWallet = Platform.OS === 'android' || Platform.OS === 'web';

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${name} — CulturePass`,
        message: `${name} (@${username})\nCPID: ${cpid}\n\n🪪 Digital Business Pass\n${siteUrl(`/cpu/${cpid}`)}`,
      });
    } catch { }
  };

  const handleCopy = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const buildPassExportPayload = async (cardType: 'business' | 'lanyard'): Promise<PassExportInput> => {
    const qrPixels = cardType === 'lanyard' ? 390 : 280;
    let base64Avatar: string | null = null;
    let base64Logo: string | null = null;
    let base64Qr: string | null = null;

    if (Platform.OS === 'web') {
      const captured = await capturePassCardAssetsFromDom(cardType);
      base64Avatar = captured.avatarDataUrl ?? base64Avatar;
      base64Qr = captured.qrDataUrl ?? base64Qr;
      base64Logo = captured.logoDataUrl ?? base64Logo;
    }

    try {
      if (!base64Avatar && avatarUrl) base64Avatar = await fetchImageAsDataUri(avatarUrl);
      if (!base64Logo) {
        const logoAsset = require('@/assets/images/culturepass-logo.png');
        const logoUri = RNImage.resolveAssetSource(logoAsset).uri;
        base64Logo = await fetchImageAsDataUri(logoUri);
      }
      if (!base64Qr) {
        const qrFetchUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrPixels}x${qrPixels}&ecc=H&data=${encodeURIComponent(qrValue)}`;
        base64Qr = await fetchImageAsDataUri(qrFetchUrl);
      }
    } catch (e) {
      console.warn('Failed to prefetch pass export assets:', e);
    }

    if (!base64Qr) {
      throw new Error('Could not prepare pass QR for export');
    }
    const qrDataUrl = base64Qr;

    return {
      cardType,
      colorVariant: passColor,
      name,
      username,
      cpid,
      tier: tierConf.label,
      memberSince,
      avatarUrl: base64Avatar,
      qrDataUrl,
      logoDataUrl: base64Logo,
      initials,
      isVerified: (user as { isVerified?: boolean })?.isVerified,
      affiliation: user?.affiliation ? { name: user.affiliation.name, avatarUrl: user.affiliation.avatarUrl } : null,
    };
  };

  const handleSaveImage = async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My CulturePass ${cardType === 'lanyard' ? 'Lanyard' : 'Business'} Pass\n${name} (${cpid})\n${siteUrl(`/cpu/${cpid}`)}`,
      }).catch(() => { });
      return;
    }
    setResolvingAvatar(true);
    try {
      const payload = await buildPassExportPayload(cardType);
      await downloadPassCardPng(payload);
      showFlash('success', 'Pass image downloaded — matches your on-screen card');
    } catch (e) {
      console.warn('Pass PNG export failed:', e);
      showFlash('error', 'Could not save pass image. Try again or allow popups.');
    } finally {
      setResolvingAvatar(false);
    }
  };

  const handleDownloadPDF = async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My CulturePass ${cardType === 'lanyard' ? 'Lanyard' : 'Business'} Pass\n${name} (${cpid})\n${siteUrl(`/cpu/${cpid}`)}`,
      }).catch(() => { });
      return;
    }
    setResolvingAvatar(true);
    try {
      const payload = await buildPassExportPayload(cardType);
      await printPassCardPdf(payload);
    } catch (e) {
      console.warn('Pass PDF export failed:', e);
      showFlash('error', 'Could not open PDF export. Allow popups and try again.');
    } finally {
      setResolvingAvatar(false);
    }
  };


  const handleSelectAffiliation = async (profile: Profile | null) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (!profile) {
        await updateUserProfile({ affiliation: null });
        showFlash('success', 'Affiliation removed');
      } else {
        const affiliation = {
          id: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          entityType: profile.entityType ?? null,
        };
        await updateUserProfile({ affiliation });
        showFlash('success', `Affiliated with ${profile.name}`);
      }
    } catch (err: any) {
      showFlash('error', err?.message ?? 'Failed to update affiliation');
    }
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <AppHeaderBar
          title="Digital ID"
          subtitle="Member passes · Wallet · Event check-in"
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
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40, paddingHorizontal: hPad }]}
        >
          <PageContainer compact noTopPadding noHorizontalPadding>
            {isLoading ? (
              <View style={{ gap: 14, alignItems: 'center', paddingTop: 12, width: containerWidth }}>
                <Skeleton width="100%" height={148} borderRadius={20} />
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                </View>
                <Skeleton width="100%" height={44} borderRadius={14} />
                <Skeleton width="100%" height={CARD_HEIGHT_LANDSCAPE} borderRadius={20} />
              </View>
            ) : (
              <>
                {flashMessage ? (
                  <View style={[s.flashBanner, {
                    backgroundColor: flashMessage.type === 'success' ? CultureTokens.teal + '25' : CultureTokens.coral + '25',
                    borderColor: flashMessage.type === 'success' ? CultureTokens.teal + '55' : CultureTokens.coral + '55',
                  }]}>
                    <Ionicons
                      name={flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={flashMessage.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
                    />
                    <Text style={[s.flashBannerText, { color: colors.text }]}>{flashMessage.text}</Text>
                  </View>
                ) : null}

                <View style={{ width: containerWidth }}>
                  <PassMemberHero
                    name={name}
                    username={username}
                    cpid={cpid}
                    memberSince={memberSince}
                    tierLabel={tierConf.label}
                    tierColor={tierConf.color}
                    avatarUrl={avatarUrl}
                    initials={initials}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                    accentColor={cardTheme.accent}
                    isDark={isDark}
                    copied={copied}
                    onCopyCpid={handleCopy}
                    quickActions={[
                      { icon: 'share-outline', label: 'Share', color: colors.primary, onPress: handleShare },
                      { icon: copied ? 'checkmark-circle' : 'copy-outline', label: copied ? 'Copied' : 'Copy ID', color: CultureTokens.gold, onPress: handleCopy },
                      { icon: 'scan-outline', label: 'Scan', color: CultureTokens.teal, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
                      { icon: 'person-outline', label: 'Profile', color: CultureTokens.indigo, onPress: () => router.push(`/cpu/${cpid}` as any) },
                    ]}
                  />
                </View>

                <View style={{ width: containerWidth, alignSelf: 'stretch', gap: 10 }}>
                  <M3SectionHeader title="Your passes" />
                  <PassColorPicker
                    value={passColor}
                    onChange={(variant) => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setPassColor(variant);
                    }}
                    accentColor={WALLET_PASS_THEME.cyanHex}
                    backgroundColor={isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant}
                    borderColor={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                  />
                </View>

                {!sideBySide ? (
                  <View style={{ width: containerWidth }}>
                    <PassViewSwitcher
                      value={passView}
                      onChange={(key) => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setPassView(key);
                      }}
                      accentColor={WALLET_PASS_THEME.cyanHex}
                      backgroundColor={isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant}
                      borderColor={panelBorder}
                      textColor={colors.text}
                      mutedColor={colors.textSecondary}
                    />
                  </View>
                ) : null}

                <Animated.View
                  key={sideBySide ? 'both' : passView}
                  entering={sideBySide ? undefined : FadeIn.duration(280).springify().damping(20)}
                  id="print-badge-area"
                  nativeID="print-badge-area"
                  style={[
                    s.printBadgeArea,
                    { width: containerWidth, flexDirection: sideBySide ? 'row' : 'column', gap: sideBySide ? 20 : 12 },
                  ]}
                >
                  {(sideBySide || passView === 'business') ? (
                    <View style={[s.cardWrapper, { width: passCardWidth, alignSelf: 'center' }]}>
                      <PassCardLabel
                        width={passCardWidth}
                        title={PASS_TYPE_LABELS.business.title}
                        subtitle={PASS_TYPE_LABELS.business.subtitle}
                        icon={PASS_TYPE_LABELS.business.icon}
                        textColor={colors.text}
                        mutedColor={colors.textSecondary}
                        accentColor={WALLET_PASS_THEME.cyanHex}
                      />
                      <BusinessPassCard
                        width={passCardWidth}
                        height={CARD_HEIGHT_LANDSCAPE}
                        colorVariant={passColor}
                        tierLabel={tierConf.label}
                        name={name}
                        username={username}
                        cpid={cpid}
                        qrValue={qrValue}
                        qrSize={qrSizeLandscape}
                        avatarUrl={avatarUrl}
                        initials={initials}
                        isVerified={(user as { isVerified?: boolean })?.isVerified}
                        affiliation={user?.affiliation ? { name: user.affiliation.name, avatarUrl: user.affiliation.avatarUrl } : null}
                        onCopyCpid={handleCopy}
                      />
                      {Platform.OS === 'web' ? (
                        <View style={s.cardActionsRow}>
                          <Pressable style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: cardTheme.accent + '50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]} onPress={() => handleSaveImage('business')} disabled={resolvingAvatar} accessibilityRole="button" accessibilityLabel="Save business pass as PNG">
                            {resolvingAvatar ? <ActivityIndicator size="small" color={cardTheme.accent} /> : <Ionicons name="image-outline" size={14} color={cardTheme.accent} />}
                            <Text style={[s.cardActionSplitBtnText, { color: cardTheme.accent }]}>Save Image</Text>
                          </Pressable>
                          <Pressable style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: cardTheme.accent + '50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]} onPress={() => handleDownloadPDF('business')} disabled={resolvingAvatar} accessibilityRole="button" accessibilityLabel="Save business pass as PDF">
                            {resolvingAvatar ? <ActivityIndicator size="small" color={cardTheme.accent} /> : <Ionicons name="document-text-outline" size={14} color={cardTheme.accent} />}
                            <Text style={[s.cardActionSplitBtnText, { color: cardTheme.accent }]}>Save PDF</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable style={({ pressed }) => [s.downloadBtn, { borderColor: cardTheme.accent + '50', opacity: pressed ? 0.8 : 1 }]} onPress={() => handleSaveImage('business')} accessibilityRole="button" accessibilityLabel="Share business pass">
                          <View style={[s.downloadIconWrap, { backgroundColor: cardTheme.accent + '18' }]}><Ionicons name="share-outline" size={16} color={cardTheme.accent} /></View>
                          <Text style={[s.downloadBtnText, { color: cardTheme.accent }]}>Share Pass</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : null}

                  {(sideBySide || passView === 'lanyard') ? (
                    <View style={[s.cardWrapper, { width: passCardWidth, alignSelf: 'center' }]}>
                      <PassCardLabel
                        width={passCardWidth}
                        title={PASS_TYPE_LABELS.lanyard.title}
                        subtitle={PASS_TYPE_LABELS.lanyard.subtitle}
                        icon={PASS_TYPE_LABELS.lanyard.icon}
                        textColor={colors.text}
                        mutedColor={colors.textSecondary}
                        accentColor={WALLET_PASS_THEME.cyanHex}
                      />
                      <LanyardPassCard
                        width={passCardWidth}
                        height={CARD_HEIGHT_VERTICAL}
                        colorVariant={passColor}
                        tierLabel={tierConf.label}
                        name={name}
                        username={username}
                        cpid={cpid}
                        memberSince={memberSince}
                        qrValue={qrValue}
                        qrSize={qrSizeVertical}
                        avatarUrl={avatarUrl}
                        initials={initials}
                        isVerified={(user as { isVerified?: boolean })?.isVerified}
                        affiliation={user?.affiliation ? { name: user.affiliation.name, avatarUrl: user.affiliation.avatarUrl } : null}
                        onCopyCpid={handleCopy}
                        copied={copied}
                      />
                      {Platform.OS === 'web' ? (
                        <View style={s.cardActionsRow}>
                          <Pressable style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: passColorTheme.bodyBorder + '80', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]} onPress={() => handleSaveImage('lanyard')} disabled={resolvingAvatar} accessibilityRole="button" accessibilityLabel="Save lanyard pass as PNG">
                            {resolvingAvatar ? <ActivityIndicator size="small" color={WALLET_PASS_THEME.cyanHex} /> : <Ionicons name="image-outline" size={14} color={WALLET_PASS_THEME.cyanHex} />}
                            <Text style={[s.cardActionSplitBtnText, { color: WALLET_PASS_THEME.cyanHex }]}>Save Image</Text>
                          </Pressable>
                          <Pressable style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: passColorTheme.bodyBorder + '80', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]} onPress={() => handleDownloadPDF('lanyard')} disabled={resolvingAvatar} accessibilityRole="button" accessibilityLabel="Save lanyard pass as PDF">
                            {resolvingAvatar ? <ActivityIndicator size="small" color={WALLET_PASS_THEME.cyanHex} /> : <Ionicons name="document-text-outline" size={14} color={WALLET_PASS_THEME.cyanHex} />}
                            <Text style={[s.cardActionSplitBtnText, { color: WALLET_PASS_THEME.cyanHex }]}>Save PDF</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable style={({ pressed }) => [s.downloadBtn, { borderColor: WALLET_PASS_THEME.cyanHex + '50', opacity: pressed ? 0.8 : 1 }]} onPress={() => handleSaveImage('lanyard')} accessibilityRole="button" accessibilityLabel="Share lanyard pass">
                          <View style={[s.downloadIconWrap, { backgroundColor: WALLET_PASS_THEME.cyanHex + '18' }]}><Ionicons name="share-outline" size={16} color={WALLET_PASS_THEME.cyanHex} /></View>
                          <Text style={[s.downloadBtnText, { color: WALLET_PASS_THEME.cyanHex }]}>Share Pass</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : null}

                  {(sideBySide || passView === 'event') ? (
                    <View style={[s.cardWrapper, { width: sideBySide ? containerWidth : cardWidth }]}>
                      <PassCardLabel
                        width={sideBySide ? containerWidth : passCardWidth}
                        title={PASS_TYPE_LABELS.event.title}
                        subtitle={PASS_TYPE_LABELS.event.subtitle}
                        icon={PASS_TYPE_LABELS.event.icon}
                        textColor={colors.text}
                        mutedColor={colors.textSecondary}
                        accentColor={cardTheme.accent}
                      />
                      <EventTicketPassPreview
                        width={sideBySide ? Math.min(containerWidth, 680) : cardWidth}
                        attendeeName={name}
                        eventTitle={upcomingTicket?.eventTitle ?? upcomingTicket?.eventName ?? 'Your next cultural event'}
                        eventDate={upcomingTicket?.eventDate ?? upcomingTicket?.date ?? 'Date TBA'}
                        venue={upcomingTicket?.eventVenue ?? undefined}
                        ticketCode={upcomingTicket?.ticketCode ?? upcomingTicket?.qrCode ?? 'VIEW-TICKETS'}
                        qrValue={eventQrValue}
                        accentColor={cardTheme.accent}
                        onPress={() => router.push(upcomingTicket ? `/tickets/${upcomingTicket.id}` as any : '/tickets' as any)}
                      />
                      <Text style={[s.passHint, { color: colors.textTertiary, textAlign: 'center', marginTop: 8 }]}>
                        {upcomingTicket ? 'Tap to open ticket · Add to Wallet from ticket screen' : 'Book an event to generate your ticket pass'}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>

                <Text style={[s.passHint, { color: colors.textTertiary, width: containerWidth, marginBottom: 8 }]}>
                  {Platform.OS === 'web'
                    ? 'Lanyard pass matches Apple & Google Wallet · Save PNG/PDF or add to Wallet'
                    : 'Lanyard pass is the same layout in Apple & Google Wallet'}
                </Text>

                {/* ── Affiliation Settings Selector ── */}
                {myProfiles.length > 0 && (
                  <GlassView
                    intensity={isDark ? 22 : 10}
                    style={[s.affiliationSelectorContainer, { width: containerWidth, borderColor: panelBorder, backgroundColor: panelBg }]}
                    contentStyle={{ gap: 12, padding: 16 }}
                  >
                    <View style={s.affiliationHeader}>
                      <Ionicons name="business-outline" size={18} color={cardTheme.accent} />
                      <Text style={[s.affiliationTitle, { color: colors.text }]}>Pass affiliation</Text>
                    </View>
                    <Text style={[s.affiliationDesc, { color: mutedOnPanel }]}>
                      Show a business or community profile badge on your digital passes.
                    </Text>
                    <View style={s.affiliationOptionsList}>
                      {/* Option: None */}
                      <Pressable
                        onPress={() => handleSelectAffiliation(null)}
                        style={({ pressed }) => [
                          s.affiliationOptionRow,
                          !user?.affiliation && s.affiliationOptionRowActive,
                          pressed && { opacity: 0.8 }
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: !user?.affiliation }}
                      >
                        <View style={s.affiliationOptionLeft}>
                          <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: '#374151' }]}>
                            <Ionicons name="close-circle-outline" size={14} color="#9CA3AF" />
                          </View>
                          <Text style={[s.affiliationOptionName, { color: !user?.affiliation ? cardTheme.accent : colors.text }]}>
                            None
                          </Text>
                        </View>
                        {!user?.affiliation && (
                          <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} />
                        )}
                      </Pressable>

                      {/* Option: profiles */}
                      {myProfiles.map((p: Profile) => {
                        const isSelected = user?.affiliation?.id === p.id;
                        return (
                          <Pressable
                            key={p.id}
                            onPress={() => handleSelectAffiliation(p)}
                            style={({ pressed }) => [
                              s.affiliationOptionRow,
                              isSelected && s.affiliationOptionRowActive,
                              pressed && { opacity: 0.8 }
                            ]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                          >
                            <View style={s.affiliationOptionLeft}>
                              {p.avatarUrl ? (
                                <Image source={{ uri: p.avatarUrl }} style={s.affiliationOptionAvatar} contentFit="cover" />
                              ) : (
                                <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: cardTheme.accent + '20' }]}>
                                  <Text style={[s.affiliationOptionInitials, { color: cardTheme.accent }]}>
                                    {(p.name || 'P').charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <Text style={[s.affiliationOptionName, { color: isSelected ? cardTheme.accent : colors.text }]} numberOfLines={1}>
                                {p.name}
                              </Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </GlassView>
                )}

                <View style={{ width: containerWidth, marginTop: 20 }}>
                  <WalletAddSection
                    width={containerWidth}
                    name={name}
                    username={username}
                    cpid={cpid}
                    tierLabel={tierConf.label}
                    memberSince={memberSince}
                    qrValue={qrValue}
                    profileUrl={profileUrl}
                    avatarUrl={avatarUrl}
                    initials={initials}
                    isVerified={(user as { isVerified?: boolean })?.isVerified}
                    affiliation={user?.affiliation ? { name: user.affiliation.name, avatarUrl: user.affiliation.avatarUrl } : null}
                    location={[user?.city, user?.country].filter(Boolean).join(', ') || undefined}
                    isDark={isDark}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                    accentColor={cardTheme.accent}
                    showApple={showAppleWallet}
                    showGoogle={showGoogleWallet}
                    onAddApple={handleAddAppleWalletCard}
                    onAddGoogle={handleAddGoogleWalletCard}
                    isApplePending={isApplePending}
                    isGooglePending={isGooglePending}
                  />
                </View>

                {/* Interests */}
                {interests.length > 0 && (
                  <View style={[s.tagsSection, { width: containerWidth, marginTop: 16 }]}>
                    <Text style={[s.tagsHeading, { color: cardTheme.accent + '99' }]}>INTERESTS</Text>
                    <View style={s.tagsRow}>
                      {interests.map(interest => (
                        <View key={interest} style={[s.tag, { backgroundColor: cardTheme.accent + '10', borderColor: cardTheme.accent + '20' }]}>
                          <Text style={[s.tagText, { color: cardTheme.accent }]}>{capitalize(interest)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Export options */}
                <View style={{ width: containerWidth, marginTop: 20 }}>
                  <GlassView
                    intensity={isDark ? 28 : 12}
                    style={[s.heroPanel, { width: '100%', borderColor: panelBorder, backgroundColor: panelBg }]}
                    contentStyle={{ padding: 20 }}
                  >
                    <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Export Options</Text>
                    
                    <View style={s.exportOptions}>
                      <Pressable
                        style={({ pressed }) => [s.exportOption, pressed && { opacity: 0.8 }]}
                        onPress={() => handleDownloadPDF('business')}
                      >
                        <View style={[s.exportIcon, { backgroundColor: colors.surface }]}>
                          <Ionicons name="document-text" size={24} color={colors.primary} />
                        </View>
                        <Text style={[s.exportLabel, { color: colors.text }]}>PDF Business Card</Text>
                      </Pressable>
                      
                      <Pressable
                        style={({ pressed }) => [s.exportOption, pressed && { opacity: 0.8 }]}
                        onPress={() => handleDownloadPDF('lanyard')}
                      >
                        <View style={[s.exportIcon, { backgroundColor: colors.surface }]}>
                          <Ionicons name="document-text" size={24} color={colors.primary} />
                        </View>
                        <Text style={[s.exportLabel, { color: colors.text }]}>PDF Lanyard Pass</Text>
                      </Pressable>
                      
                      <Pressable
                        style={({ pressed }) => [s.exportOption, pressed && { opacity: 0.8 }]}
                        onPress={() => handleSaveImage('business')}
                      >
                        <View style={[s.exportIcon, { backgroundColor: colors.surface }]}>
                          <Ionicons name="image" size={24} color={colors.primary} />
                        </View>
                        <Text style={[s.exportLabel, { color: colors.text }]}>PNG Business Card</Text>
                      </Pressable>
                      
                      <Pressable
                        style={({ pressed }) => [s.exportOption, pressed && { opacity: 0.8 }]}
                        onPress={() => handleSaveImage('lanyard')}
                      >
                        <View style={[s.exportIcon, { backgroundColor: colors.surface }]}>
                          <Ionicons name="image" size={24} color={colors.primary} />
                        </View>
                        <Text style={[s.exportLabel, { color: colors.text }]}>PNG Lanyard Pass</Text>
                      </Pressable>
                    </View>
                  </GlassView>
                </View>
              </>
            )}
          </PageContainer>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 16,
  },
  flashBannerText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  heroPanel: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  printBadgeArea: { alignItems: 'flex-start' },

  cardWrapper: { gap: 10, alignItems: 'center' },

  // Download button
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  downloadBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  downloadIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    lineHeight: 15,
  },
  cardActionsRow: { flexDirection: 'row', gap: 8, width: '100%' },
  cardActionSplitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  cardActionSplitBtnText: { fontSize: 12, fontFamily: FontFamily.semibold },

  affiliationSelectorContainer: { borderRadius: 16, borderWidth: 1, marginTop: 12 },
  affiliationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  affiliationTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  affiliationDesc: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 17 },
  affiliationOptionsList: { gap: 8 },
  affiliationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  affiliationOptionRowActive: { borderColor: WALLET_PASS_THEME.cyanHex + '44', backgroundColor: WALLET_PASS_THEME.cyanHex + '08' },
  affiliationOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  affiliationOptionAvatar: { width: 32, height: 32, borderRadius: 8 },
  affiliationOptionAvatarFallback: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  affiliationOptionInitials: { fontSize: 13, fontFamily: FontFamily.bold },
  affiliationOptionName: { fontSize: 14, fontFamily: FontFamily.semibold, flex: 1 },

  tagsSection: { gap: 8 },
  tagsHeading: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: FontFamily.semibold },

  // Export options
  exportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exportOption: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  exportIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  exportLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
});
