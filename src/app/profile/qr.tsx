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
 * - Cards shown side-by-side on desktop, stacked on mobile
 * - Download button for each card (web: PNG download, native: Share)
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, Membership } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
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
  bgGradient: [string, string, string];
}> = {
  free: {
    cardGradients: ['#1C1917', '#292524', '#1C1917'] as [string, string, ...string[]],
    accent: CultureTokens.terracottaGlow,
    border: 'rgba(227, 106, 78, 0.25)',
    text: '#F5F5F4',
    glow: 'rgba(227, 106, 78, 0.15)',
    chipColor: '#A8A29E',
    chipBorder: '#78716C',
    isDarkCard: true,
    bgGradient: ['#0E0C0A', '#1A1714', '#0B0A09'],
  },
  plus: {
    cardGradients: ['#1E1B4B', '#311042', '#1E1B4B'] as [string, string, ...string[]],
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.4)',
    text: '#FFF0F0',
    glow: 'rgba(79, 70, 229, 0.35)',
    chipColor: '#E29578',
    chipBorder: '#B06D53',
    isDarkCard: true,
    bgGradient: ['#0D0B1E', '#1A1035', '#08060F'],
  },
  elite: {
    cardGradients: ['#09090B', '#18181B', '#09090B'] as [string, string, ...string[]],
    accent: CultureTokens.gold,
    border: 'rgba(255, 200, 87, 0.45)',
    text: '#FFFBEB',
    glow: 'rgba(255, 200, 87, 0.25)',
    chipColor: '#D4A017',
    chipBorder: '#9E740C',
    isDarkCard: true,
    bgGradient: ['#070705', '#120F08', '#050504'],
  },
  pro: {
    cardGradients: ['#061F2E', '#0B3C5D', '#061F2E'] as [string, string, ...string[]],
    accent: '#00F0FF',
    border: 'rgba(0, 240, 255, 0.45)',
    text: '#E0FAFF',
    glow: 'rgba(0, 240, 255, 0.25)',
    chipColor: '#00F0FF',
    chipBorder: '#00B4D8',
    isDarkCard: true,
    bgGradient: ['#020C12', '#051C2B', '#010608'],
  },
  premium: {
    cardGradients: ['#1A0F0A', '#2C1810', '#1A0F0A'] as [string, string, ...string[]],
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.5)',
    text: '#FFF1EB',
    glow: 'rgba(255, 94, 91, 0.22)',
    chipColor: '#F2C078',
    chipBorder: '#C17E3F',
    isDarkCard: true,
    bgGradient: ['#0F0806', '#1E1109', '#080503'],
  },
  vip: {
    cardGradients: ['#0F0A02', '#1F1608', '#0F0A02'] as [string, string, ...string[]],
    accent: CultureTokens.gold,
    border: 'rgba(255, 200, 87, 0.55)',
    text: '#FFFBEB',
    glow: 'rgba(255, 200, 87, 0.3)',
    chipColor: '#E8C36B',
    chipBorder: '#B38A2E',
    isDarkCard: true,
    bgGradient: ['#0A0700', '#1A1200', '#060400'],
  },
};

function resolveCardTheme(tier: string) {
  const key = (tier || 'free').toLowerCase();
  if (key in DYNAMIC_CARD_THEMES) return DYNAMIC_CARD_THEMES[key];
  if (key === 'premium' || key === 'plus') return DYNAMIC_CARD_THEMES.plus;
  if (key === 'vip' || key === 'elite') return DYNAMIC_CARD_THEMES.elite;
  return DYNAMIC_CARD_THEMES.free;
}

/** Build a self-contained print window for a card — web only.
 *  Opens a new tab with only the card HTML/CSS, sets document.title to the
 *  suggested PDF filename (culturepass-@username-business-pass.pdf), then
 *  auto-triggers the browser print dialog so the user can Save as PDF.
 */
function openPrintWindow(opts: {
  cardType: 'business' | 'lanyard';
  name: string;
  username: string;
  cpid: string;
  tier: string;
  memberSince: string;
  avatarUrl?: string | null;
  qrDataUrl: string;       // pre-rendered QR as data: URI (SVG)
  initials: string;
}) {
  if (Platform.OS !== 'web') return;

  const { cardType, name, username, cpid, tier, memberSince, avatarUrl, qrDataUrl, initials } = opts;
  const isLanyard = cardType === 'lanyard';
  const safeUsername = (username || 'user').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const cardLabel   = isLanyard ? 'Event Lanyard & Wallet Pass' : 'Digital Business Pass';
  const filename    = `culturepass-${safeUsername}-${isLanyard ? 'lanyard-pass' : 'business-pass'}`;
  const tierText    = (tier || 'Standard').toUpperCase();

  // Avatar: either use the remote URL or a monogram circle
  const avatarHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;" crossorigin="anonymous" />`
    : `<div style="width:44px;height:44px;border-radius:50%;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#4F46E5;">${initials}</div>`;

  const avatarHtmlLg = avatarUrl
    ? `<img src="${avatarUrl}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:1.5px solid #E5E7EB;" crossorigin="anonymous" />`
    : `<div style="width:64px;height:64px;border-radius:50%;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#4F46E5;">${initials}</div>`;

  const businessCard = `
    <div style="width:330px;height:210px;border-radius:20px;border:1px solid #E5E7EB;background:#FFFFFF;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:14px;box-sizing:border-box;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
      <!-- header -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:10px;font-weight:800;letter-spacing:1.2px;">
          <span style="color:#FF3B30;">CULTURE</span><span style="color:#34C759;">PASS</span><span style="color:#009CDE;"> ID</span>
        </span>
        <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:#009CDE;">${tierText}</span>
      </div>
      <!-- middle -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex:1;margin:8px 0;">
        <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;height:100%;padding-right:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${avatarHtml}
            <div>
              <div style="font-size:14px;font-weight:700;color:#0B0F19;line-height:18px;">${name}</div>
              <div style="font-size:11px;color:#4B5563;">@${username}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:12px;">
            <span style="font-size:8.5px;font-weight:700;letter-spacing:0.5px;color:#6B7280;">NFC PASS ACTIVE</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="padding:5px;background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;">
            <img src="${qrDataUrl}" width="84" height="84" style="display:block;" />
          </div>
          <span style="font-size:10px;font-family:monospace;font-weight:700;letter-spacing:1px;color:#0B0F19;">${cpid}</span>
        </div>
      </div>
      <!-- footer -->
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
        <span style="font-size:8px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">WALLET READY • iOS / ANDROID COMPATIBLE</span>
      </div>
    </div>`;

  const lanyardCard = `
    <div style="width:330px;height:440px;border-radius:20px;border:1px solid #E5E7EB;background:#FFFFFF;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:18px;box-sizing:border-box;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
      <!-- header -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:10px;font-weight:800;letter-spacing:1.2px;">
          <span style="color:#FF3B30;">CULTURE</span><span style="color:#34C759;">PASS</span><span style="color:#009CDE;"> ID</span>
        </span>
        <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:#009CDE;">${tierText}</span>
      </div>
      <!-- profile -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:8px;">
        ${avatarHtmlLg}
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;color:#0B0F19;line-height:22px;">${name}</div>
          <div style="font-size:12px;color:#4B5563;margin-top:2px;">@${username}</div>
          <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">Member Since ${memberSince}</div>
        </div>
      </div>
      <!-- qr -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin:12px 0;">
        <div style="padding:5px;background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;">
          <img src="${qrDataUrl}" width="120" height="120" style="display:block;" />
        </div>
        <span style="font-size:12px;font-family:monospace;font-weight:700;letter-spacing:1.5px;color:#0B0F19;">${cpid}</span>
      </div>
      <!-- nfc -->
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border:1px solid #F3F4F6;background:#FAFAFA;border-radius:10px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:#6B7280;">TAP TO SCAN • EVENT LANYARD PASS</span>
      </div>
      <!-- footer -->
      <div style="display:flex;align-items:center;justify-content:center;padding-top:6px;">
        <span style="font-size:8px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">WALLET SECURE • iOS / ANDROID COMPATIBLE</span>
      </div>
    </div>`;

  const cardHtml = isLanyard ? lanyardCard : businessCard;
  const pageW    = isLanyard ? '330px' : '330px';
  const pageH    = isLanyard ? '440px' : '210px';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${filename}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      width:${pageW}; height:${pageH};
      background:#ffffff;
      display:flex; align-items:center; justify-content:center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: ${isLanyard ? '330px 440px' : '330px 210px'};
      margin: 0;
    }
    @media print {
      html, body { width:${pageW}; height:${pageH}; }
    }
    .no-print {
      position:fixed; bottom:16px; left:50%; transform:translateX(-50%);
      display:flex; gap:10px;
    }
    .no-print button {
      padding:10px 22px; border-radius:10px; font-size:13px; font-weight:600;
      cursor:pointer; border:none;
    }
    .btn-primary { background:#4F46E5; color:#fff; }
    .btn-secondary { background:#F3F4F6; color:#374151; border:1px solid #E5E7EB; }
    @media print { .no-print { display:none !important; } }
  </style>
</head>
<body>
  ${cardHtml}
  <div class="no-print">
    <button class="btn-primary" onclick="window.print()">💾 Save as PDF</button>
    <button class="btn-secondary" onclick="window.close()">Close</button>
  </div>
  <script>
    // Set suggested filename via document.title (browsers use this for PDF filename)
    document.title = '${filename}';
    // Auto-open print dialog after a short delay for images to load
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 600);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=${isLanyard ? 380 : 400},height=${isLanyard ? 560 : 340},toolbar=0,menubar=0,scrollbars=0`);
  if (!win) {
    // Popup blocked — fall back to print of current page with targeted CSS
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
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

  // Responsive card sizing — side-by-side on desktop, stacked on mobile
  const sideBySide = isDesktop && screenWidth >= 720;
  const cardWidth = sideBySide
    ? Math.min(Math.floor((screenWidth - 120) / 2), CARD_WIDTH_FIXED)
    : Math.min(screenWidth - 32, CARD_WIDTH_FIXED);
  const qrSizeLandscape = Math.min(cardWidth - 84, isDesktop ? 96 : QR_SIZE_LANDSCAPE);
  const qrSizeVertical = Math.min(cardWidth - 84, isDesktop ? 140 : QR_SIZE_VERTICAL);
  const containerWidth = sideBySide ? cardWidth * 2 + 20 : cardWidth;

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

  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const flashTimerRef = useRef<any>(null);
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
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Apple Wallet' });
      if (!opened) throw new Error('Unable to open Apple Wallet pass.');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Apple Wallet business card opened');
    } catch (err: any) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Apple Wallet pass.');
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
      showFlash('success', 'Google Wallet business card opened');
    } catch (err: any) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Google Wallet pass.');
    } finally {
      setIsGooglePending(false);
    }
  };

  // ── Ambient background blob animations ───────────────────────────────────
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(withSequence(withTiming(50, { duration: 7000 }), withTiming(-50, { duration: 7000 })), -1, true);
    blob1Y.value = withRepeat(withSequence(withTiming(35, { duration: 8000 }), withTiming(-35, { duration: 8000 })), -1, true);
    blob2X.value = withRepeat(withSequence(withTiming(-40, { duration: 9000 }), withTiming(40, { duration: 9000 })), -1, true);
    blob2Y.value = withRepeat(withSequence(withTiming(55, { duration: 10000 }), withTiming(-55, { duration: 10000 })), -1, true);
    blob3X.value = withRepeat(withSequence(withTiming(30, { duration: 11000 }), withTiming(-30, { duration: 11000 })), -1, true);
    blob3Y.value = withRepeat(withSequence(withTiming(-40, { duration: 12000 }), withTiming(40, { duration: 12000 })), -1, true);
  }, [blob1X, blob1Y, blob2X, blob2Y, blob3X, blob3Y]);

  const animatedBlob1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));
  const animatedBlob2 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));
  const animatedBlob3 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob3X.value }, { translateY: blob3Y.value }],
  }));

  // ── Card press + shimmer animations ──────────────────────────────────────
  const cardScale = useSharedValue(1);
  const shimmerX = useSharedValue(-150);

  const triggerShimmer = useCallback(() => {
    shimmerX.value = -150;
    shimmerX.value = withTiming(350, { duration: 1000 });
  }, [shimmerX]);

  useEffect(() => { triggerShimmer(); }, [triggerShimmer]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const handlePressIn = () => { cardScale.value = withSpring(0.97, { damping: 12, stiffness: 100 }); };
  const handlePressOut = () => { cardScale.value = withSpring(1, { damping: 12, stiffness: 100 }); };
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        message: `${name} (@${username})\nCPID: ${cpid}\n\n🪪 Digital Business Pass\n${siteUrl(`/cpu/${cpid}`)}`,
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
        message: `CulturePass ID: ${name} (${cpid}). Profile: ${siteUrl(`/cpu/${cpid}`)}`,
        title: 'Print CulturePass ID',
      });
      return;
    }
    // Web: open the business pass in a print-ready isolated window
    // User can choose which to print; both cards accessible from download buttons
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&ecc=H&data=${encodeURIComponent(qrValue)}`;
    openPrintWindow({
      cardType: 'business',
      name,
      username,
      cpid,
      tier: tierConf.label,
      memberSince,
      avatarUrl: avatarUrl ?? null,
      qrDataUrl: qrImgUrl,
      initials,
    });
  };

  const handleDownload = (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My CulturePass ${cardType === 'lanyard' ? 'Event Lanyard & Wallet Pass' : 'Digital Business Pass'}\n${name} (${cpid})\n${siteUrl(`/cpu/${cpid}`)}`,
      }).catch(() => {});
      return;
    }
    // Web: build an isolated print window with just the card
    // Use QR server API to render QR as an img tag in the popup
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&ecc=H&data=${encodeURIComponent(qrValue)}`;
    openPrintWindow({
      cardType,
      name,
      username,
      cpid,
      tier: tierConf.label,
      memberSince,
      avatarUrl: avatarUrl ?? null,
      qrDataUrl: qrImgUrl,
      initials,
    });
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
      <View style={s.root}>
        {/* Print styles */}
        {Platform.OS === 'web' && React.createElement('style', null, `
          @media print {
            body { background-color: #ffffff !important; }
            body * { visibility: hidden !important; }
            #print-badge-area, #print-badge-area * { visibility: visible !important; }
            #print-badge-area {
              position: absolute !important; left: 50% !important; top: 5% !important;
              transform: translateX(-50%) scale(1.0) !important; width: 330px !important;
              margin: 0 !important; box-shadow: none !important; background: transparent !important;
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            #card-1, #card-2 { border: 1px solid #888 !important; background-color: #ffffff !important; border-radius: 20px !important; box-shadow: none !important; }
            #heading-1, #heading-2 { display: none !important; }
            #print-spacer { height: 30px !important; display: block !important; }
          }
        `)}

        {/* ── Rich tier-aware background ────────────────────────────────── */}
        <LinearGradient
          colors={cardTheme.bgGradient}
          locations={[0, 0.5, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle noise/grain overlay for premium depth */}
        <LinearGradient
          colors={['rgba(255,255,255,0.015)', 'transparent', 'rgba(255,255,255,0.008)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Ambient living blobs — 3 blobs for richer depth */}
        <View style={s.ambientContainer} pointerEvents="none">
          <Animated.View style={[s.ambientBlob, animatedBlob1, {
            backgroundColor: cardTheme.glow,
            top: -100, left: -80, width: 380, height: 380, borderRadius: 190,
          }]} />
          <Animated.View style={[s.ambientBlob, animatedBlob2, {
            backgroundColor: cardTheme.accent + '18',
            bottom: -60, right: -80, width: 400, height: 400, borderRadius: 200,
          }]} />
          <Animated.View style={[s.ambientBlob, animatedBlob3, {
            backgroundColor: (Luxe.colors?.indigo || '#4A5EBF') + '12',
            top: '40%', left: '30%', width: 260, height: 260, borderRadius: 130,
          }]} />
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
                  <Text style={s.flashBannerText}>{flashMessage.text}</Text>
                </View>
              ) : null}

              {/* Hero label */}
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={[s.walletHeroLabel, { color: cardTheme.accent + 'AA' }]}>
                  YOUR CULTUREPASS DIGITAL PASSES
                </Text>
                <Text style={[s.walletHeroSub, { color: cardTheme.accent }]}>
                  {tierConf.label.toUpperCase()} MEMBER PASSES
                </Text>
              </View>

              {/* ── Dual-card area: side-by-side on desktop, stacked on mobile ── */}
              <View
                id="print-badge-area"
                nativeID="print-badge-area"
                style={[
                  s.printBadgeArea,
                  { width: containerWidth, flexDirection: sideBySide ? 'row' : 'column', gap: sideBySide ? 20 : 0 },
                ]}
              >
                {/* ── CARD 1: Digital Business Pass ── */}
                <View style={[s.cardWrapper, { width: cardWidth }]}>
                  {/* Label badge */}
                  <View style={s.cardBadgeRow}>
                    <View style={[s.cardBadge, { backgroundColor: '#009CDE20', borderColor: '#009CDE40' }]}>
                      <Ionicons name="id-card-outline" size={11} color="#009CDE" />
                      <Text style={[s.cardBadgeText, { color: '#009CDE' }]}>1. DIGITAL BUSINESS PASS</Text>
                    </View>
                    <Text style={[s.cardBadgeSubtitle, { color: cardTheme.accent + '99' }]}>CULTUREPASS ID</Text>
                  </View>

                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={{ width: cardWidth }}
                    accessibilityRole="button"
                    accessibilityLabel="Digital landscape business card. Tap for shimmer effect."
                  >
                    <Animated.View style={[{ width: cardWidth }, cardAnimatedStyle]}>
                      <View style={[s.identityCard, { width: cardWidth, height: CARD_HEIGHT_LANDSCAPE, backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                        <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { width: '50%' }]} pointerEvents="none">
                          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                        </Animated.View>
                        <View style={s.cardInner}>
                          <View style={s.passHeaderContent}>
                            <Text style={s.passType}>
                              <Text style={{ color: '#FF3B30' }}>CULTURE</Text>
                              <Text style={{ color: '#34C759' }}>PASS</Text>
                              <Text style={{ color: '#009CDE' }}> ID</Text>
                            </Text>
                            <Text style={[s.passTier, { color: '#009CDE' }]}>{tierConf.label.toUpperCase()}</Text>
                          </View>
                          <View style={s.passMiddle}>
                            <View style={s.leftCol}>
                              <View style={s.passUserRow}>
                                <View style={[s.passAvatarWrap, { borderColor: '#E5E7EB' }]}>
                                  {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={s.passAvatar} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                                  ) : (
                                    <View style={[s.passAvatarFallback, { backgroundColor: '#F3F4F6' }]}>
                                      <Text style={[s.passAvatarInitials, { color: cardTextColor }]}>{initials}</Text>
                                    </View>
                                  )}
                                </View>
                                <View style={s.passUserInfo}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={[s.passName, { color: cardTextColor }]} numberOfLines={1}>{name}</Text>
                                    {(user as any)?.isVerified && <Ionicons name="checkmark-circle" size={12} color="#009CDE" />}
                                  </View>
                                  <Text style={[s.passHandle, { color: cardSecondaryTextColor }]}>@{username}</Text>
                                </View>
                              </View>
                            </View>
                            <View style={s.rightCol}>
                              <View style={s.qrWhiteBackground}>
                                <QRCode value={qrValue} size={qrSizeLandscape} color="#000000" backgroundColor="#FFFFFF" ecl="H" />
                              </View>
                              <Pressable onPress={handleCopy} style={s.cpidMonospaceContainer} hitSlop={8}>
                                <Ionicons name="wifi" size={12} color={cardSecondaryTextColor} style={{ transform: [{ rotate: '90deg' }] }} />
                                <Text style={[s.cpidMonospaceText, { color: cardTextColor }]}>{cpid.slice(0, 3)}-{cpid.slice(3)}</Text>
                                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={11} color={copied ? '#30D158' : '#9CA3AF'} />
                              </Pressable>
                            </View>
                          </View>
                          <View style={s.cardFooterBanner}>
                            <Ionicons name="lock-closed-outline" size={10} color={cardTertiaryTextColor} />
                            <Text style={[s.cardFooterBannerText, { color: cardTertiaryTextColor }]}>WALLET READY • iOS / ANDROID COMPATIBLE</Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </Pressable>

                  {/* Download button — Card 1 */}
                  <Pressable
                    style={({ pressed }) => [s.downloadBtn, { borderColor: cardTheme.accent + '50', opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => handleDownload('business')}
                    accessibilityRole="button"
                    accessibilityLabel="Download Digital Business Pass"
                  >
                    <View style={[s.downloadIconWrap, { backgroundColor: cardTheme.accent + '18' }]}>
                      <Ionicons name="download-outline" size={16} color={cardTheme.accent} />
                    </View>
                    <Text style={[s.downloadBtnText, { color: cardTheme.accent }]}>
                      {Platform.OS === 'web' ? 'Save / Print Pass' : 'Share Pass'}
                    </Text>
                  </Pressable>
                </View>

                {/* ── CARD 2: Event Lanyard & Wallet Pass ── */}
                <View style={[s.cardWrapper, { width: cardWidth, marginTop: sideBySide ? 0 : 8 }]}>
                  {/* Label badge */}
                  <View style={s.cardBadgeRow}>
                    <View style={[s.cardBadge, { backgroundColor: cardTheme.accent + '20', borderColor: cardTheme.accent + '40' }]}>
                      <Ionicons name="ribbon-outline" size={11} color={cardTheme.accent} />
                      <Text style={[s.cardBadgeText, { color: cardTheme.accent }]}>2. EVENT LANYARD & WALLET PASS</Text>
                    </View>
                    <Text style={[s.cardBadgeSubtitle, { color: '#009CDE99' }]}>CULTUREPASS ID</Text>
                  </View>

                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={{ width: cardWidth }}
                    accessibilityRole="button"
                    accessibilityLabel="Digital vertical lanyard event pass. Tap for shimmer effect."
                  >
                    <Animated.View style={[{ width: cardWidth }, cardAnimatedStyle]}>
                      <View style={[s.identityCard, { width: cardWidth, height: CARD_HEIGHT_VERTICAL, backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                        <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { width: '50%' }]} pointerEvents="none">
                          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                        </Animated.View>
                        <View style={s.cardInnerVertical}>
                          <View style={s.passHeaderContent}>
                            <Text style={s.passType}>
                              <Text style={{ color: '#FF3B30' }}>CULTURE</Text>
                              <Text style={{ color: '#34C759' }}>PASS</Text>
                              <Text style={{ color: '#009CDE' }}> ID</Text>
                            </Text>
                            <Text style={[s.passTier, { color: '#009CDE' }]}>{tierConf.label.toUpperCase()}</Text>
                          </View>
                          <View style={s.passProfileVertical}>
                            <View style={[s.passAvatarWrapVertical, { borderColor: '#E5E7EB' }]}>
                              {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={s.passAvatarVertical} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                              ) : (
                                <View style={[s.passAvatarFallbackVertical, { backgroundColor: '#F3F4F6' }]}>
                                  <Text style={[s.passAvatarInitialsVertical, { color: cardTextColor }]}>{initials}</Text>
                                </View>
                              )}
                            </View>
                            <View style={s.passUserInfoVertical}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[s.passNameVertical, { color: cardTextColor }]} numberOfLines={1}>{name}</Text>
                                {(user as any)?.isVerified && <Ionicons name="checkmark-circle" size={15} color="#009CDE" />}
                              </View>
                              <Text style={[s.passHandleVertical, { color: cardSecondaryTextColor }]}>@{username}</Text>
                              <Text style={[s.passMemberSinceVertical, { color: cardTertiaryTextColor }]}>Member Since {memberSince}</Text>
                            </View>
                          </View>
                          <View style={s.passMiddleVertical}>
                            <View style={s.qrWhiteBackground}>
                              <QRCode value={qrValue} size={qrSizeVertical} color="#000000" backgroundColor="#FFFFFF" ecl="H" />
                            </View>
                            <Pressable onPress={handleCopy} style={s.cpidMonospaceContainer} hitSlop={8}>
                              <Ionicons name="wifi" size={13} color={cardSecondaryTextColor} style={{ transform: [{ rotate: '90deg' }] }} />
                              <Text style={[s.cpidMonospaceTextVertical, { color: cardTextColor }]}>{cpid.slice(0, 3)}-{cpid.slice(3)}</Text>
                              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? '#30D158' : '#9CA3AF'} />
                            </Pressable>
                          </View>
                          <View style={s.cardFooterBannerVertical}>
                            <Ionicons name="lock-closed-outline" size={10} color={cardTertiaryTextColor} style={{ marginRight: 4 }} />
                            <Text style={[s.cardFooterBannerTextVertical, { color: cardTertiaryTextColor }]}>WALLET SECURE • iOS / ANDROID COMPATIBLE</Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </Pressable>

                  {/* Download button — Card 2 */}
                  <Pressable
                    style={({ pressed }) => [s.downloadBtn, { borderColor: '#009CDE50', opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => handleDownload('lanyard')}
                    accessibilityRole="button"
                    accessibilityLabel="Download Event Lanyard Pass"
                  >
                    <View style={[s.downloadIconWrap, { backgroundColor: '#009CDE18' }]}>
                      <Ionicons name="download-outline" size={16} color="#009CDE" />
                    </View>
                    <Text style={[s.downloadBtnText, { color: '#009CDE' }]}>
                      {Platform.OS === 'web' ? 'Save / Print Pass' : 'Share Pass'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={[s.passHint, { color: cardTheme.accent + '88', width: containerWidth, marginBottom: 16 }]}>
                Tap cards to trigger shimmer · Swipe to share · Integrated QR & NFC passes
              </Text>

              {/* ── Wallet save CTAs ── */}
              <View style={[s.walletHero, { width: containerWidth, borderColor: cardTheme.accent + '18' }]}>
                <Text style={[s.walletHeroTitle, { color: '#FFFFFF' }]}>Save to Wallet</Text>
                <Text style={s.walletHeroDesc}>
                  Add your verified CulturePass Digital ID to Apple Wallet or Google Wallet for instant, offline access at events, venues, and check-ins.
                </Text>
                {(Platform.OS === 'ios' || Platform.OS === 'web') && (
                  <Pressable
                    onPress={handleAddAppleWalletCard}
                    style={({ pressed }) => [s.walletPrimaryBtn, { backgroundColor: '#000000', borderColor: '#333' }, (pressed || isApplePending) && { opacity: 0.85 }]}
                    disabled={isApplePending}
                    accessibilityRole="button"
                    accessibilityLabel="Add your CulturePass ID to Apple Wallet"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.walletPrimaryTitle}>Add to Apple Wallet</Text>
                        <Text style={s.walletPrimarySub}>{isApplePending ? 'Opening Wallet...' : 'Official .pkpass — works offline'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                )}
                {(Platform.OS === 'android' || Platform.OS === 'web') && (
                  <Pressable
                    onPress={handleAddGoogleWalletCard}
                    style={({ pressed }) => [s.walletPrimaryBtn, { backgroundColor: '#1A73E8', borderColor: '#1557B0' }, (pressed || isGooglePending) && { opacity: 0.9 }]}
                    disabled={isGooglePending}
                    accessibilityRole="button"
                    accessibilityLabel="Save your CulturePass ID to Google Wallet"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.walletPrimaryTitle}>Save to Google Wallet</Text>
                        <Text style={s.walletPrimarySub}>{isGooglePending ? 'Saving to Wallet...' : 'Secure pass • Instant access'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                )}
                <Text style={s.walletLegal}>
                  By adding this pass you allow Wallet to display your CulturePass ID (name, CPID, tier, location, verification signature). Apple and Google manage the pass securely according to their privacy policies.
                </Text>
              </View>

              {/* ── Action tools ── */}
              <View style={{ marginTop: 12, width: containerWidth }}>
                <Text style={[s.sectionLabel, { color: cardTheme.accent + '99' }]}>VERIFICATION & SHARING</Text>
                <View style={[s.actionsRow, { width: containerWidth }]}>
                  {([
                    { icon: 'share-outline', label: 'Share ID', color: colors.primary, onPress: handleShare },
                    { icon: copied ? 'checkmark-circle' : 'copy-outline', label: copied ? 'Copied' : 'Copy CPID', color: colors.gold, onPress: handleCopy },
                    { icon: 'print-outline', label: 'Print Pass', color: CultureTokens.coral, onPress: handlePrint },
                  ] as const).map((btn) => (
                    <Pressable
                      key={btn.label}
                      onPress={btn.onPress}
                      style={({ pressed }) => [s.actionBtn, { borderColor: colors.borderLight, backgroundColor: colors.surfaceVariant, opacity: pressed ? 0.75 : 1 }]}
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
                <Pressable
                  onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/cpu/${cpid}` as any); }}
                  style={{ marginTop: 12, alignSelf: 'center' }}
                >
                  <Text style={{ color: cardTheme.accent, fontSize: 13, textDecorationLine: 'underline' }}>
                    View public profile
                  </Text>
                </Pressable>
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden', zIndex: 0,
  },
  ambientBlob: {
    position: 'absolute',
    ...Platform.select({
      web: { filter: 'blur(100px)' },
      default: {},
    }),
    opacity: 0.55,
  },

  scroll: { alignItems: 'center', paddingTop: 36, gap: 16 },

  // Card area layout
  printBadgeArea: { alignItems: 'flex-start' },

  cardWrapper: { gap: 10, alignItems: 'center' },

  // Card badge label row (sits above each card)
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
  },
  cardBadgeSubtitle: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },

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
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.2)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  downloadIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  printSpacer: {
    height: 0,
    ...Platform.select({ web: { display: 'none' } }),
  },

  identityCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 12px 30px rgba(0,0,0,0.35)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
    }),
  },

  cardInner: { flex: 1, padding: 14, justifyContent: 'space-between' },
  cardInnerVertical: { flex: 1, padding: 18, justifyContent: 'space-between' },

  passHeaderContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passType: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  passTier: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },

  passMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1, marginVertical: 4 },
  passMiddleVertical: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },

  leftCol: { flex: 1, justifyContent: 'space-between', height: '100%', paddingRight: 10 },
  rightCol: { alignItems: 'center', justifyContent: 'center' },

  passUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passAvatarWrap: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE, borderRadius: AVATAR_SIZE_LANDSCAPE / 2, overflow: 'hidden', borderWidth: 1 },
  passAvatar: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE },
  passAvatarFallback: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE, borderRadius: AVATAR_SIZE_LANDSCAPE / 2, alignItems: 'center', justifyContent: 'center' },
  passAvatarInitials: { fontSize: 15, fontFamily: FontFamily.bold },
  passUserInfo: { flex: 1, gap: 1 },
  passName: { fontSize: 14, fontFamily: FontFamily.bold, lineHeight: 18 },
  passHandle: { fontSize: 11, fontFamily: FontFamily.medium },

  passProfileVertical: { alignItems: 'center', gap: 10, marginTop: 8 },
  passAvatarWrapVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL, borderRadius: AVATAR_SIZE_VERTICAL / 2, overflow: 'hidden', borderWidth: 1.5 },
  passAvatarVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL },
  passAvatarFallbackVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL, borderRadius: AVATAR_SIZE_VERTICAL / 2, alignItems: 'center', justifyContent: 'center' },
  passAvatarInitialsVertical: { fontSize: 22, fontFamily: FontFamily.bold },
  passUserInfoVertical: { alignItems: 'center', gap: 2 },
  passNameVertical: { fontSize: 18, fontFamily: FontFamily.bold, lineHeight: 22 },
  passHandleVertical: { fontSize: 12, fontFamily: FontFamily.medium },
  passMemberSinceVertical: { fontSize: 10, fontFamily: FontFamily.medium, marginTop: 2 },

  nfcLeftCol: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  nfcTextCol: { fontSize: 8.5, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  nfcBottomVertical: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', borderRadius: 10, width: '100%' },
  nfcTextVertical: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },

  qrWhiteBackground: { padding: 5, backgroundColor: '#FFFFFF', borderRadius: 8 },
  cpidMonospaceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cpidMonospaceText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, fontWeight: 'bold' },
  cpidMonospaceTextVertical: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1.5, fontWeight: 'bold' },

  cardFooterBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 },
  cardFooterBannerText: { fontSize: 8, fontFamily: FontFamily.bold, letterSpacing: 0.6 },
  cardFooterBannerVertical: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  cardFooterBannerTextVertical: { fontSize: 8, fontFamily: FontFamily.bold, letterSpacing: 0.6 },

  passHint: { fontSize: 11, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 15, marginTop: 4, opacity: 0.75 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontFamily: FontFamily.semibold },

  walletHero: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  walletHeroLabel: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 1.5, textAlign: 'center' },
  walletHeroSub: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.8, textAlign: 'center', marginBottom: 4 },
  walletHeroTitle: { fontSize: 18, fontFamily: FontFamily.bold, textAlign: 'center' },
  walletHeroDesc: { fontSize: 12, fontFamily: FontFamily.medium, textAlign: 'center', color: 'rgba(255,255,255,0.65)', lineHeight: 17 },
  walletPrimaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1 },
  walletPrimaryTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF', letterSpacing: -0.2 },
  walletPrimarySub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  walletLegal: { fontSize: 9, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 13, marginTop: 6 },

  flashBanner: { width: '100%', maxWidth: CARD_WIDTH_FIXED, alignSelf: 'center', marginVertical: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashBannerText: { flex: 1, fontSize: 12, fontFamily: FontFamily.medium, color: '#FFFFFF' },

  sectionLabel: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 1.4, marginBottom: 8, marginLeft: 2 },
  tagsSection: { gap: 8, marginTop: 8 },
  tagsHeading: { fontSize: 9.5, fontFamily: FontFamily.semibold, letterSpacing: 1.2, marginLeft: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: FontFamily.semibold },
});
