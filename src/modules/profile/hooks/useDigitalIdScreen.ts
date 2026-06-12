import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Platform, Share, Image as RNImage } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import type { Profile, User } from '@shared/schema';

import { useAuth } from '@/lib/auth';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { formatWalletError } from '@/lib/walletErrors';
import { modulesApi } from '@/modules/api';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';
import {
  PASS_EXPORT_WIDTH,
  PASS_EXPORT_BUSINESS_HEIGHT,
  PASS_EXPORT_LANYARD_HEIGHT,
  type PassViewKey,
  type PassColorVariant,
  type PassExportInput,
  downloadPassCardPng,
  printPassCardPdf,
  capturePassCardAssetsFromDom,
} from '@/modules/profile/components/digitalId';
import { DIGITAL_ID_BRAND } from '@/modules/profile/components/digitalId/digitalIdBrand';
import { avatarDisplayUri, avatarRecyclingKey } from '@/lib/avatarUri';

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

export function useDigitalIdScreen() {
  const [copied, setCopied] = useState(false);
  const [passView, setPassView] = useState<PassViewKey>('lanyard');
  const [passColor, setPassColor] = useState<PassColorVariant>('cyan');
  const [resolvingAvatar, setResolvingAvatar] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplePending, setIsApplePending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { userId: authUserId, isRestoring, updateUserProfile } = useAuth();

  const { data: digitalId, isPending: digitalIdPending } = useQuery({
    queryKey: ['/api/wallet/digital-id', authUserId],
    queryFn: () => modulesApi.wallet.digitalId(),
    enabled: Boolean(authUserId) && !isRestoring,
    staleTime: 0,
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-qr', authUserId],
    queryFn: () => modulesApi.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });

  const { data: myProfilesData } = useQuery({
    queryKey: ['/api/profiles/my'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: Boolean(authUserId),
  });

  const userId = digitalId?.userId ?? user?.id ?? authUserId;
  const isLoading = isRestoring || digitalIdPending || (Boolean(authUserId) && !digitalId && !user);

  const cpid = digitalId?.cpid ?? user?.culturePassId ?? 'CP-000000';
  const name = digitalId?.name ?? user?.displayName ?? 'CulturePass User';
  const username = digitalId?.username ?? user?.username ?? 'user';
  const avatarVersionSource = {
    avatarUpdatedAt: digitalId?.avatarUpdatedAt ?? (user as User & { avatarUpdatedAt?: string })?.avatarUpdatedAt,
    updatedAt: digitalId?.updatedAt ?? user?.updatedAt,
    id: userId,
  };
  const avatarRecyclingKeyValue = avatarRecyclingKey(avatarVersionSource);
  const rawAvatarUrl = digitalId?.avatarUrl ?? user?.avatarUrl;
  const avatarUrl = avatarDisplayUri(rawAvatarUrl, avatarRecyclingKeyValue);
  const memberSince = digitalId?.memberSince ?? '—';
  const tier = digitalId?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;
  const tierLabel = digitalId?.tierLabel ?? tierConf.label;
  const interests = digitalId?.interests ?? (user?.interests ?? []).slice(0, 4);
  const profileUrl = digitalId?.profileUrl ?? siteUrl(`/cpu/${cpid}`);
  const qrValue = digitalId?.qrPayload ?? JSON.stringify({ type: 'culturepass_id', cpid, name, username });
  const eventQrValue = digitalId?.eventQrPayload ?? qrValue;
  const upcomingTicket = digitalId?.upcomingTicket ?? null;
  const walletReadiness = digitalId?.wallet;

  const initials = useMemo(
    () => (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  const myProfiles = myProfilesData ?? [];
  const affiliation = user?.affiliation ?? digitalId?.affiliation ?? null;

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  const showFlash = useCallback((type: 'success' | 'error', text: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage({ type, text });
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2600);
  }, []);

  const handleCopy = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [cpid]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${name} — ${DIGITAL_ID_BRAND.name}`,
        message: `${name} (@${username})\nCPID: ${cpid}\n\n🪪 Digital Business Pass\n${profileUrl}`,
      });
    } catch {
      // user dismissed
    }
  }, [name, username, cpid, profileUrl]);

  const handleAddAppleWalletCard = useCallback(async () => {
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
          ? `Downloaded ${filename} — open it to add to Wallet.`
          : 'Apple Wallet pass opened',
      );
    } catch (err: unknown) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', formatWalletError(err, 'apple'));
    } finally {
      setIsApplePending(false);
    }
  }, [userId, cpid, showFlash]);

  const handleAddGoogleWalletCard = useCallback(async () => {
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
  }, [userId, showFlash]);

  const buildPassExportPayload = useCallback(async (cardType: 'business' | 'lanyard'): Promise<PassExportInput> => {
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

    if (!base64Qr) throw new Error('Could not prepare pass QR for export');

    return {
      cardType,
      colorVariant: passColor,
      name,
      username,
      cpid,
      tier: tierLabel,
      memberSince,
      avatarUrl: base64Avatar,
      qrDataUrl: base64Qr,
      logoDataUrl: base64Logo,
      initials,
      isVerified: (user as { isVerified?: boolean })?.isVerified ?? digitalId?.isVerified,
      affiliation: affiliation ? { name: affiliation.name, avatarUrl: affiliation.avatarUrl } : null,
    };
  }, [avatarUrl, passColor, name, username, cpid, tierLabel, memberSince, initials, user, digitalId?.isVerified, affiliation, qrValue]);

  const handleSaveImage = useCallback(async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My ${DIGITAL_ID_BRAND.name} ${cardType === 'lanyard' ? 'Lanyard' : 'Business'} Pass\n${name} (${cpid})\n${profileUrl}`,
      }).catch(() => {});
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
  }, [name, cpid, profileUrl, buildPassExportPayload, showFlash]);

  const handleDownloadPDF = useCallback(async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My ${DIGITAL_ID_BRAND.name} ${cardType === 'lanyard' ? 'Lanyard' : 'Business'} Pass\n${name} (${cpid})\n${profileUrl}`,
      }).catch(() => {});
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
  }, [name, cpid, profileUrl, buildPassExportPayload, showFlash]);

  const handleSelectAffiliation = useCallback(async (profile: Profile | null) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (!profile) {
        await updateUserProfile({ affiliation: null });
        showFlash('success', 'Affiliation removed');
      } else {
        await updateUserProfile({
          affiliation: {
            id: profile.id,
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
            entityType: profile.entityType ?? null,
          },
        });
        showFlash('success', `Affiliated with ${profile.name}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update affiliation';
      showFlash('error', message);
    }
  }, [updateUserProfile, showFlash]);

  const goScanner = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/scanner');
  }, []);

  const goPublicProfile = useCallback(() => {
    router.push(`/cpu/${cpid}` as never);
  }, [cpid]);

  const goTicket = useCallback(() => {
    router.push(upcomingTicket ? (`/tickets/${upcomingTicket.id}` as never) : ('/tickets' as never));
  }, [upcomingTicket]);

  const showAppleWallet = Platform.OS === 'ios' || Platform.OS === 'web';
  const showGoogleWallet = Platform.OS === 'android' || Platform.OS === 'web';
  const appleReady = walletReadiness?.apple ?? true;
  const googleReady = walletReadiness?.google ?? true;

  return {
    isLoading,
    copied,
    passView,
    setPassView,
    passColor,
    setPassColor,
    resolvingAvatar,
    flashMessage,
    isApplePending,
    isGooglePending,
    cpid,
    name,
    username,
    avatarUrl,
    avatarRecyclingKey: avatarRecyclingKeyValue,
    memberSince,
    tierConf,
    tierLabel,
    interests,
    profileUrl,
    qrValue,
    eventQrValue,
    upcomingTicket,
    initials,
    myProfiles,
    affiliation,
    user,
    digitalId,
    showAppleWallet,
    showGoogleWallet,
    appleReady,
    googleReady,
    handleCopy,
    handleShare,
    handleAddAppleWalletCard,
    handleAddGoogleWalletCard,
    handleSaveImage,
    handleDownloadPDF,
    handleSelectAffiliation,
    goScanner,
    goPublicProfile,
    goTicket,
    cardDimensions: {
      width: PASS_EXPORT_WIDTH,
      businessHeight: PASS_EXPORT_BUSINESS_HEIGHT,
      lanyardHeight: PASS_EXPORT_LANYARD_HEIGHT,
      qrLandscape: 88,
      qrVertical: 132,
    },
  };
}