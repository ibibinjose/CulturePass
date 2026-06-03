import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { M3Button, Skeleton } from '@/design-system/ui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { modulesApi,  type MembershipSummary, type RewardsSummary } from '@/modules/api';
import type { Ticket as ApiTicket } from '@/shared/schema';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, TextStyles, gradients, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { openExternalUrl } from '@/lib/openExternalUrl';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';


// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletTicket {
  id: string;
  eventTitle: string;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  tierName: string | null;
  quantity: number | null;
  status: ApiTicket['status'];
  imageColor: string | null;
  price?: number | null;
}

function toWalletTicket(ticket: any): WalletTicket {
  return {
    id: ticket.id,
    eventTitle: ticket.eventTitle ?? ticket.eventName ?? ticket.title ?? 'Untitled Event',
    eventDate: ticket.eventDate ?? ticket.date ?? null,
    eventTime: ticket.eventTime ?? null,
    eventVenue: ticket.eventVenue ?? ticket.venue ?? null,
    tierName: ticket.tierName ?? null,
    quantity: ticket.quantity ?? null,
    status: ticket.status ?? null,
    imageColor: ticket.imageColor ?? null,
    price: ticket.totalPriceCents != null ? ticket.totalPriceCents / 100 : null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return true;
  return new Date(dateStr) >= new Date();
}

const isWeb = Platform.OS === 'web';
const LOYALTY_CYCLE_DAYS = 365;
const LOYALTY_CYCLE_COLORS = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.gold,
  CultureTokens.coral,
  CultureTokens.gold,
] as const;

// ─── Ticket card ──────────────────────────────────────────────────────────────

interface TicketCardProps { ticket: WalletTicket; }

function TicketCard({
  ticket,
  styles: s,
  onAddAppleWallet,
  onAddGoogleWallet,
  pendingAction,
}: TicketCardProps & {
  styles: ReturnType<typeof getStyles>;
  onAddAppleWallet: (ticketId: string) => void;
  onAddGoogleWallet: (ticketId: string) => void;
  pendingAction: { ticketId: string; provider: 'apple' | 'google' } | null;
}) {
  const accentColor = ticket.imageColor || CultureTokens.indigo;
  const upcoming = isUpcoming(ticket.eventDate);
  const colors = useColors();

  const isApplePending = pendingAction?.ticketId === ticket.id && pendingAction.provider === 'apple';
  const isGooglePending = pendingAction?.ticketId === ticket.id && pendingAction.provider === 'google';

  return (
    <View style={s.ticketCardWrapper}>
      <Pressable
        style={({pressed}) => [s.ticketCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }, pressed && { opacity: 0.9 }]}
        onPress={() => {
          if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } });
        }}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`Ticket for ${ticket.eventTitle}`}
      >
        <View style={[s.ticketStatusDot, { backgroundColor: upcoming ? CultureTokens.teal : 'rgba(255,255,255,0.4)' }]} />

        <View style={{ flex: 1 }}>
          <Text style={s.ticketTitle} numberOfLines={1}>{ticket.eventTitle}</Text>
          <View style={s.ticketMeta}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={s.ticketMetaText}>{formatEventDate(ticket.eventDate)}</Text>
            {ticket.eventTime && (
              <>
                <Text style={s.ticketMetaDot}>·</Text>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={s.ticketMetaText}>{ticket.eventTime}</Text>
              </>
            )}
          </View>
          {ticket.eventVenue && (
            <View style={s.ticketMeta}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={s.ticketMetaText} numberOfLines={1}>{ticket.eventVenue}</Text>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4, paddingBottom: 24 }}>
          {ticket.tierName && (
            <View style={[s.tierPill, { backgroundColor: accentColor + '20' }]}>
              <Text style={[s.tierPillText, { color: accentColor }]}>{ticket.tierName}</Text>
            </View>
          )}
          {ticket.quantity != null && ticket.quantity > 1 && (
            <Text style={s.quantityText}>×{ticket.quantity}</Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </Pressable>

      <View style={s.ticketWalletActions}>
        {(Platform.OS === 'ios' || isWeb) && (
          <M3Button
            variant="outlined"
            onPress={() => onAddAppleWallet(ticket.id)}
            loading={isApplePending}
            disabled={isGooglePending}
            leftIcon="logo-apple"
            style={{ flex: 1, height: 32, borderRadius: 8, paddingHorizontal: 8 }}
          >
            Apple
          </M3Button>
        )}
        <M3Button
          variant="outlined"
          onPress={() => onAddGoogleWallet(ticket.id)}
          loading={isGooglePending}
          disabled={isApplePending}
          leftIcon="logo-google"
          style={{ flex: 1, height: 32, borderRadius: 8, paddingHorizontal: 8 }}
        >
          Google
        </M3Button>
      </View>
    </View>
  );
}

// ─── Stats box ────────────────────────────────────────────────────────────────

interface StatBoxProps { value: string | number; label: string; icon: string; }

function StatBox({ value, label, icon, styles: s }: StatBoxProps & { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={s.statBox}>
      <View style={[s.statIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={CultureTokens.indigo} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Card Constants, Themes & EMV Helper ──────────────────────────────────────

const CARD_WIDTH_FIXED = 330;
const CARD_HEIGHT_LANDSCAPE = 210;
const QR_SIZE_LANDSCAPE = 84;
const AVATAR_SIZE_LANDSCAPE = 44;

const emvStyles = StyleSheet.create({
  emvChip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  emvLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emvLineVerticalLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emvLineVerticalRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '30%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

const EMVChip = () => (
  <View style={emvStyles.emvChip}>
    <LinearGradient
      colors={['#FFE066', '#F5C000', '#D4A017']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={emvStyles.emvLineHorizontal} />
    <View style={emvStyles.emvLineVerticalLeft} />
    <View style={emvStyles.emvLineVerticalRight} />
  </View>
);

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
    cardGradients: ['#1C1917', '#292524', '#1C1917'] as [string, string, ...string[]],
    accent: (CultureTokens as any).terracottaGlow || '#E36A4E',
    border: 'rgba(227, 106, 78, 0.25)',
    text: '#F5F5F4',
    glow: 'rgba(227, 106, 78, 0.15)',
    chipColor: '#A8A29E',
    chipBorder: '#78716C',
    isDarkCard: true,
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
  },
};

function resolveCardTheme(tier: string) {
  const key = (tier || 'free').toLowerCase();
  if (key in DYNAMIC_CARD_THEMES) return DYNAMIC_CARD_THEMES[key];
  if (key === 'premium' || key === 'plus') return DYNAMIC_CARD_THEMES.plus;
  if (key === 'vip' || key === 'elite') return DYNAMIC_CARD_THEMES.elite;
  return DYNAMIC_CARD_THEMES.free;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type WalletTab = 'upcoming' | 'past';

export default function WalletScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { isDesktop } = useLayout();
  const insets      = useSafeAreaInsetsWeb();
  const topInset    = insets.top;
  const bottomInset = insets.bottom;
  const { userId, user }  = useAuth();
  const [tab, setTab] = useState<WalletTab>('upcoming');
  const [pendingTicketWalletAction, setPendingTicketWalletAction] = useState<{ ticketId: string; provider: 'apple' | 'google' } | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tierConfigMap = useMemo<Record<string, { label: string; colors: [string, string]; icon: string }>>(() => ({
    free:    { label: 'Standard', colors: ['#2A2A35', '#1B1B25'], icon: 'shield-outline' },
    plus:    { label: 'Plus',     colors: [CultureTokens.indigo, '#1E1C59'], icon: 'star' },
    premium: { label: 'Premium',  colors: [CultureTokens.gold, '#CC6F33'], icon: 'diamond' },
    elite:   { label: 'Elite',    colors: [CultureTokens.teal, '#1A8F84'], icon: 'trophy' },
    vip:     { label: 'VIP',      colors: [CultureTokens.coral, '#CC4745'], icon: 'ribbon' },
    pro:     { label: 'Pro',      colors: ['#3A86FF', '#285FCC'], icon: 'briefcase' },
  }), []);

  const { data: ticketsData = [], isLoading } = useQuery<WalletTicket[]>({
    queryKey: ['tickets', 'wallet', userId],
    queryFn: async () => {
      const tickets = await modulesApi.tickets.forUser(userId!);
      return Array.isArray(tickets) ? tickets.map(toWalletTicket) : [];
    },
    enabled: !!userId,
  });

  const { data: membership } = useQuery<MembershipSummary>({
    queryKey: ['membership', userId],
    queryFn: () => modulesApi.membership.get(userId!),
    enabled: !!userId,
  });

  const { data: rewards } = useQuery<RewardsSummary>({
    queryKey: ['rewards', userId],
    queryFn: () => modulesApi.rewards.get(userId!),
    enabled: !!userId,
  });

  const confirmed     = ticketsData.filter((t) => t.status === 'confirmed' || t.status === 'used');
  const upcoming      = confirmed.filter((t) =>  isUpcoming(t.eventDate));
  const past          = confirmed.filter((t) => !isUpcoming(t.eventDate));
  const tierConfig    = tierConfigMap[membership?.tier || 'free'] ?? tierConfigMap.free;
  const memberSinceDate = useMemo(() => {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) return createdAt;
    if (membership?.expiresAt) {
      const expiresAt = new Date(membership.expiresAt);
      if (!Number.isNaN(expiresAt.getTime())) {
        const estimatedJoin = new Date(expiresAt);
        estimatedJoin.setDate(estimatedJoin.getDate() - LOYALTY_CYCLE_DAYS);
        return estimatedJoin;
      }
    }
    return new Date();
  }, [membership?.expiresAt, user?.createdAt]);
  const loyaltyProgress = useMemo(() => {
    const now = new Date();
    const diffMs = Math.max(now.getTime() - memberSinceDate.getTime(), 0);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const completedCycles = Math.floor(diffDays / LOYALTY_CYCLE_DAYS);
    const dayInCycle = (diffDays % LOYALTY_CYCLE_DAYS) + 1;
    const cyclePercent = Math.min((dayInCycle / LOYALTY_CYCLE_DAYS) * 100, 100);
    const cycleColor = LOYALTY_CYCLE_COLORS[completedCycles % LOYALTY_CYCLE_COLORS.length];
    return {
      completedCycles,
      dayInCycle,
      cyclePercent,
      cycleColor,
    };
  }, [memberSinceDate]);
  const displayTickets = tab === 'upcoming' ? upcoming : past;

  const { width: screenWidth } = useWindowDimensions();

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

  // Holographic shimmer and spring scale animations
  const cardScale = useSharedValue(1);
  const shimmerX = useSharedValue(-150);
  const [cardFlipped, setCardFlipped] = useState(false);
  const cardFlipVal = useSharedValue(0);

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

  const toggleCardFlip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const nextVal = !cardFlipped;
    setCardFlipped(nextVal);
    cardFlipVal.value = withSpring(nextVal ? 1 : 0, { damping: 15, stiffness: 80 });
    triggerShimmer();
  };

  const cardFrontStyle = useAnimatedStyle(() => {
    const rotateValue = cardFlipVal.value * 180;
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: cardFlipVal.value > 0.5 ? 0 : 1,
      zIndex: cardFlipVal.value > 0.5 ? 0 : 1,
    };
  });

  const cardBackStyle = useAnimatedStyle(() => {
    const rotateValue = (cardFlipVal.value - 1) * 180;
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: cardFlipVal.value > 0.5 ? 1 : 0,
      zIndex: cardFlipVal.value > 0.5 ? 1 : 0,
    };
  });

  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? user?.username ?? 'CulturePass Member';
  const username = user?.username ?? 'member';
  const avatarUrl = user?.avatarUrl;

  const initials = useMemo(
    () => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  const qrValue = useMemo(
    () => JSON.stringify({ type: 'culturepass_id', cpid, name, username }),
    [cpid, name, username],
  );

  const cardTheme = useMemo(() => resolveCardTheme(membership?.tier || 'free'), [membership?.tier]);

  const cardWidth = Math.min(
    screenWidth - 40,
    CARD_WIDTH_FIXED
  );
  const qrSizeLandscape = Math.min(cardWidth - 84, QR_SIZE_LANDSCAPE);

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const showFlash = (type: 'success' | 'error', text: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage({ type, text });
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2600);
  };

  const handleAddAppleWalletCard = async () => {
    if (!userId) return;
    try {
      const result = await modulesApi.wallet.businessCardApple();
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Apple Wallet' });
      if (!opened) throw new Error('Unable to open Apple Wallet pass.');
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Apple Wallet business card opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Apple Wallet pass.');
    }
  };

  const handleAddGoogleWalletCard = async () => {
    if (!userId) return;
    try {
      const result = await modulesApi.wallet.businessCardGoogle();
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Google Wallet' });
      if (!opened) throw new Error('Unable to open Google Wallet pass.');
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet business card opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Google Wallet pass.');
    }
  };

  const handleAddAppleTicketWallet = async (ticketId: string) => {
    try {
      setPendingTicketWalletAction({ ticketId, provider: 'apple' });
      const result = await modulesApi.tickets.walletApple(ticketId);
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Apple Wallet' });
      if (!opened) throw new Error('Unable to open Apple Wallet ticket pass.');
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Apple Wallet ticket pass opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Apple Wallet ticket pass.');
    } finally {
      setPendingTicketWalletAction(null);
    }
  };

  const handleAddGoogleTicketWallet = async (ticketId: string) => {
    try {
      setPendingTicketWalletAction({ ticketId, provider: 'google' });
      const result = await modulesApi.tickets.walletGoogle(ticketId);
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Google Wallet' });
      if (!opened) throw new Error('Unable to open Google Wallet ticket pass.');
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet ticket pass opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Google Wallet ticket pass.');
    } finally {
      setPendingTicketWalletAction(null);
    }
  };

  return (
    <AuthGuard icon="wallet-outline" title="My Wallet" message="Sign in to access your wallet, tickets, and rewards.">
      <View style={styles.container}>
        {/* Living ambient backdrop */}
        <LinearGradient
          colors={gradients.midnight}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient living blurred blobs (Luxe Heritage premium aesthetic) */}
        <View style={styles.ambientContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.ambientBlob,
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
              styles.ambientBlob,
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
          title="My Wallet"
          backFallback="/(tabs)/my-space"
          topInset={topInset}
          rightAction={{
            icon: 'ticket',
            onPress: () => router.push('/tickets/index'),
            label: 'My Tickets',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: bottomInset + 24 },
            isDesktop && { alignItems: 'center' },
          ]}
          style={styles.scrollContent}
        >
          <View style={[styles.contentWrap, isDesktop && styles.contentWrapDesktop]}>
          {flashMessage ? (
            <View
              style={[
                styles.flashBanner,
                {
                  backgroundColor:
                    flashMessage.type === 'success'
                      ? CultureTokens.teal + '25'
                      : CultureTokens.coral + '25',
                  borderColor:
                    flashMessage.type === 'success'
                      ? CultureTokens.teal + '55'
                      : CultureTokens.coral + '55',
                },
              ]}
            >
              <Ionicons
                name={flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={flashMessage.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
              />
              <Text style={styles.flashBannerText}>{flashMessage.text}</Text>
            </View>
          ) : null}

          {/* Interactive 3D Flippable Membership Card */}
          <View style={{ alignItems: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={toggleCardFlip}
              style={{ width: cardWidth, height: CARD_HEIGHT_LANDSCAPE }}
              accessibilityRole="button"
              accessibilityLabel="Digital membership card. Tap to flip."
            >
              <Animated.View style={[{ width: cardWidth, height: CARD_HEIGHT_LANDSCAPE }, cardAnimatedStyle]}>
                
                {/* Front View */}
                <Animated.View style={[StyleSheet.absoluteFill, cardFrontStyle]}>
                  <View style={[styles.identityCard, { width: cardWidth, height: CARD_HEIGHT_LANDSCAPE, borderColor: cardTheme.border }]}>
                    <LinearGradient colors={cardTheme.cardGradients} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    {/* Specular highlights & Shimmer */}
                    <LinearGradient colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                    <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { width: '50%' }]} pointerEvents="none"><LinearGradient colors={['transparent', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.06)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View>
                    
                    <View style={styles.cardInner}>
                      <View style={styles.passHeaderContent}>
                        <Text style={[styles.passType, { color: cardTheme.text }]}>
                          <Text style={{ fontWeight: 'bold' }}>CULTURE</Text>
                          <Text style={{ color: cardTheme.accent }}>PASS</Text>
                          <Text> ID</Text>
                        </Text>
                        <Text style={[styles.passTier, { color: cardTheme.accent }]}>{tierConfig.label.toUpperCase()}</Text>
                      </View>
                      
                      <View style={styles.passMiddle}>
                        <View style={styles.leftCol}>
                          <View style={styles.passUserRow}>
                            <View style={[styles.passAvatarWrap, { borderColor: cardTheme.border }]}>
                              {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.passAvatar} contentFit="cover" />
                              ) : (
                                <View style={[styles.passAvatarFallback, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                  <Text style={[styles.passAvatarInitials, { color: cardTheme.text }]}>{initials}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.passUserInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[styles.passName, { color: cardTheme.text }]} numberOfLines={1}>{name}</Text>
                                {(user as any)?.isVerified && <Ionicons name="checkmark-circle" size={12} color={cardTheme.accent} />}
                              </View>
                              <Text style={[styles.passHandle, { color: cardTheme.text, opacity: 0.7 }]}>@{username}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.nfcLeftCol}>
                            <Ionicons name="wifi" size={14} color={cardTheme.text} style={{ transform: [{ rotate: '90deg' }] }} />
                            <Text style={[styles.nfcTextCol, { color: cardTheme.text, opacity: 0.7 }]}>NFC PASS ACTIVE</Text>
                          </View>
                        </View>
                        
                        <View style={[styles.rightCol, { gap: 8 }]}>
                          <EMVChip />
                          <Ionicons name="wifi-outline" size={24} color={cardTheme.text} style={{ opacity: 0.4, transform: [{ rotate: '90deg' }] }} />
                        </View>
                      </View>
                      
                      <View style={styles.cardFooterBanner}>
                        <Ionicons name="lock-closed-outline" size={10} color={cardTheme.text} style={{ opacity: 0.5 }} />
                        <Text style={[styles.cardFooterBannerText, { color: cardTheme.text, opacity: 0.6 }]}>WALLET READY • iOS / ANDROID COMPATIBLE</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
                
                {/* Back View */}
                <Animated.View style={[StyleSheet.absoluteFill, cardBackStyle]}>
                  <View style={[styles.identityCard, { width: cardWidth, height: CARD_HEIGHT_LANDSCAPE, borderColor: cardTheme.border }]}>
                    <LinearGradient colors={cardTheme.cardGradients} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <View style={styles.magneticStrip} />
                    
                    <View style={[styles.cardInner, { paddingTop: 60 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1 }}>
                        <View style={styles.signatureStrip}>
                          <Text style={styles.signatureLabel}>AUTHORIZED SIGNATURE</Text>
                          <Text style={styles.signatureText}>{name}</Text>
                        </View>
                        
                        <View style={[styles.rightCol, { alignItems: 'center' }]}>
                          <View style={styles.qrWhiteBackground}>
                            <QRCode value={qrValue} size={qrSizeLandscape} color="#000000" backgroundColor="#FFFFFF" ecl="H" />
                          </View>
                          <Pressable onPress={handleCopy} style={styles.cpidMonospaceContainer} hitSlop={8}>
                            <Text style={[styles.cpidMonospaceText, { color: cardTheme.text }]}>{cpid.slice(0, 3)}-{cpid.slice(3)}</Text>
                            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={11} color={copied ? '#30D158' : '#9CA3AF'} />
                          </Pressable>
                        </View>
                      </View>
                      
                      <View style={[styles.cardFooterBanner, { marginTop: 6 }]}>
                        <Text style={[styles.cardFooterBannerText, { color: cardTheme.text, opacity: 0.4, fontSize: 7 }]}>
                          NOT TRANSFERABLE • SECURE QR CODE FOR ENTRY & CHECK-IN
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

              </Animated.View>
            </Pressable>
          </View>

          {/* Membership Cycle & Progress Details */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <View>
                <Text style={styles.progressLabel}>MEMBERSHIP PROGRESS</Text>
                <Text style={styles.progressSubText}>
                  Member since {memberSinceDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>
                  Day {loyaltyProgress.dayInCycle} of {LOYALTY_CYCLE_DAYS}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${loyaltyProgress.cyclePercent}%`,
                    backgroundColor: CultureTokens.indigo,
                  },
                ]}
              />
            </View>

            <View style={styles.progressStatsRow}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatLabel}>EVENTS ATTENDED</Text>
                <Text style={styles.progressStatValue}>{membership?.eventsAttended ?? confirmed.length}</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatLabel}>CURRENT CYCLE</Text>
                <Text style={styles.progressStatValue}>Year {loyaltyProgress.completedCycles + 1}</Text>
              </View>
              {membership?.cashbackMultiplier != null && membership.cashbackMultiplier > 1 && (
                <>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatLabel}>CASHBACK REBATE</Text>
                    <Text style={styles.progressStatValue}>{((membership.cashbackMultiplier - 1) * 100).toFixed(0)}%</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Rewards strip */}
          <View style={[styles.rewardsStrip, { borderColor: colors.borderLight }]}>
            <View style={styles.rewardsLeft}>
              <View style={[styles.rewardsIconWrap, { backgroundColor: CultureTokens.gold + '15' }]}>
                <Ionicons name="gift" size={18} color={CultureTokens.gold} />
              </View>
              <View>
                <Text style={styles.rewardsTitle}>
                  {rewards?.tierLabel ?? 'Silver'} Rewards
                </Text>
                <Text style={styles.rewardsSub}>
                  {rewards?.nextTierLabel
                    ? `${rewards.pointsToNextTier} pts to ${rewards.nextTierLabel}`
                    : 'Top tier unlocked'}
                </Text>
              </View>
            </View>
            <View style={styles.rewardsPointsWrap}>
              <Text style={styles.rewardsPoints}>
                {rewards?.points ?? 0}
              </Text>
              <Text style={styles.rewardsPointsLabel}>PTS</Text>
            </View>
          </View>

          {/* Upgrade prompt for free tier */}
          {(!membership || membership.tier === 'free') && (
            <Pressable
              style={({pressed}) => [styles.upgradePrompt, pressed && { opacity: 0.8 }]}
              onPress={() => router.push({ pathname: '/membership/upgrade' })}
            >
              <Ionicons name="star" size={18} color={CultureTokens.gold} />
              <Text style={styles.upgradePromptText}>
                Upgrade to Plus for 2% cashback on all tickets
              </Text>
              <Ionicons name="chevron-forward" size={16} color={CultureTokens.gold} />
            </Pressable>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBox value={upcoming.length}  label="Upcoming" icon="calendar" styles={styles} />
            <View style={styles.statsDivider} />
            <StatBox value={past.length}      label="Attended" icon="checkmark-circle" styles={styles} />
            <View style={styles.statsDivider} />
            <StatBox value={confirmed.length} label="Total"    icon="ticket" styles={styles} />
          </View>

          {/* Apple/Google Wallet promo */}
          <View style={styles.digitalWalletRow}>
            {(Platform.OS === 'ios' || isWeb) && (
            <Pressable
              style={({ pressed }) => [
                styles.walletPassBtn,
                { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleAddAppleWalletCard}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <View>
                <Text style={styles.walletPassTextLight}>Apple Wallet</Text>
                <Text style={styles.walletPassSoonLight}>Add business card</Text>
              </View>
            </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.walletPassBtn,
                { backgroundColor: '#4285F4', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleAddGoogleWalletCard}
            >
              <Ionicons name="logo-google" size={18} color="#fff" />
              <View>
                <Text style={styles.walletPassTextLight}>Google Wallet</Text>
                <Text style={styles.walletPassSoonLight}>Add business card</Text>
              </View>
            </Pressable>
          </View>



          {/* Tabs */}
          <View style={styles.tabsRow}>
            {(['upcoming', 'past'] as WalletTab[]).map((t) => {
              const isActive = tab === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.tab,
                    isActive
                      ? { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '50' }
                      : { backgroundColor: colors.surface },
                  ]}
                  onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
                >
                  <Text style={[styles.tabText, isActive ? { color: CultureTokens.indigo, fontFamily: 'Poppins_700Bold' } : { color: colors.textSecondary }]}> 
                    {t === 'upcoming'
                      ? `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`
                      : `Past${past.length > 0 ? ` (${past.length})` : ''}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Ticket list */}
          <View style={styles.ticketList}>
            {isLoading ? (
              <>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[styles.ticketCard, { borderLeftWidth: 4, borderLeftColor: CultureTokens.indigo + '40' }]}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width="75%" height={16} borderRadius={8} />
                      <Skeleton width="55%" height={12} borderRadius={6} />
                      <Skeleton width="45%" height={12} borderRadius={6} />
                    </View>
                    <Skeleton width={60} height={24} borderRadius={8} />
                  </View>
                ))}
              </>
            ) : displayTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={tab === 'upcoming' ? 'ticket-outline' : 'time-outline'}
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyTitle}>
                  {tab === 'upcoming' ? 'No upcoming tickets' : 'No past events'}
                </Text>
                <Text style={styles.emptySubtitle}> 
                  {tab === 'upcoming'
                    ? 'Browse events and grab your first ticket!'
                    : 'Your attended events will appear here.'}
                </Text>
                {tab === 'upcoming' && (
                  <Pressable
                    style={({pressed}) => [styles.browseBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.browseBtnText}>Discover Events</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              displayTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  styles={styles}
                  onAddAppleWallet={handleAddAppleTicketWallet}
                  onAddGoogleWallet={handleAddGoogleTicketWallet}
                  pendingAction={pendingTicketWalletAction}
                />
              ))
            )}
          </View>

          {/* View all link */}
          {displayTickets.length > 0 && (
            <Pressable style={({pressed}) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/tickets/index')}>
              <Text style={styles.viewAllBtnText}>View All Tickets</Text>
              <Ionicons name="chevron-forward" size={14} color={CultureTokens.indigo} />
            </Pressable>
          )}
          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  contentWrap: { width: '100%' },
  contentWrapDesktop: { maxWidth: 640 },

  flashBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashBannerText: {
    flex: 1,
    ...TextStyles.caption,
    color: colors.text,
  },

  // Ambient Container and Blobs
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

  // 3D Flippable membership card
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
  magneticStrip: {
    height: 38,
    backgroundColor: '#0F172A',
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
  },
  signatureStrip: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    width: '58%',
    borderRadius: 4,
    position: 'absolute',
    bottom: 24,
    left: 14,
  },
  signatureLabel: {
    fontSize: 6,
    color: '#94A3B8',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 14,
    color: '#0F172A',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },

  // Progress Section styles
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressLabel: {
    ...TextStyles.captionSemibold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  progressSubText: {
    ...TextStyles.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: colors.borderLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressBadgeText: {
    ...TextStyles.badge,
    color: colors.text,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  progressStatItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  progressStatLabel: {
    ...TextStyles.badge,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  progressStatValue: {
    ...TextStyles.title3,
    color: colors.text,
    marginTop: 2,
  },
  progressStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
    marginHorizontal: 12,
  },

  // Rewards strip
  rewardsStrip: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  rewardsLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rewardsIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.gold + '18' },
  rewardsTitle:   { ...TextStyles.cardTitle, color: colors.text, marginBottom: 2 },
  rewardsSub:     { ...TextStyles.caption, color: colors.textSecondary },
  rewardsPointsWrap: { alignItems: 'flex-end', justifyContent: 'center' },
  rewardsPoints:  { ...TextStyles.title, color: CultureTokens.gold, lineHeight: 26 },
  rewardsPointsLabel: { ...TextStyles.badge, color: CultureTokens.gold, opacity: 0.8, marginTop: 2 },

  // Upgrade prompt
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    borderWidth: 1,
    backgroundColor: CultureTokens.gold + '15',
    borderColor: CultureTokens.gold + '40',
  },
  upgradePromptText: { flex: 1, ...TextStyles.cardTitle, color: CultureTokens.gold },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  statBox:      { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue:    { ...TextStyles.title2, color: CultureTokens.indigo },
  statLabel:    { ...TextStyles.caption, marginTop: 4, color: colors.textSecondary },
  statsDivider: { width: 1, marginVertical: 14, backgroundColor: colors.borderLight },

  // Digital wallet
  digitalWalletRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 12 },
  walletPassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      default: { elevation: 2 },
    }),
  },
  walletPassText: { ...TextStyles.callout, color: colors.text },
  walletPassSoon: { ...TextStyles.badge, marginTop: 2, color: colors.textSecondary },
  walletPassTextLight: { ...TextStyles.callout, color: '#fff' },
  walletPassSoonLight: { ...TextStyles.badge, marginTop: 2, color: 'rgba(255,255,255,0.85)' },
  walletPassDisabled: { opacity: 0.6 },

  // Tabs
  tabsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 20 },
  tab:     { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight },
  tabText: { ...TextStyles.cardTitle },

  // Ticket list
  ticketList: { paddingHorizontal: 20, gap: 14 },
  ticketCardWrapper: { position: 'relative', marginBottom: 14 },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },

  ticketStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
  ticketTitle:     { ...TextStyles.headline, marginBottom: 4, color: colors.text },
  ticketMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  ticketMetaText:  { ...TextStyles.chip, color: colors.textSecondary },
  ticketMetaDot:   { fontSize: 12, color: colors.textTertiary, marginHorizontal: 2 },
  tierPill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierPillText:    { ...TextStyles.tabLabel, textTransform: 'uppercase' },
  quantityText:    { ...TextStyles.chip, color: colors.textSecondary },
  ticketWalletActions: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  ticketWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ticketWalletBtnText: {
    ...TextStyles.badge,
    color: colors.text,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle: { ...TextStyles.title3, marginTop: 12, color: colors.text },
  emptySubtitle: { ...TextStyles.callout, textAlign: 'center', paddingHorizontal: 40, color: colors.textSecondary, lineHeight: 22 },
  browseBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, backgroundColor: CultureTokens.indigo },
  browseBtnText: { ...TextStyles.headline, color: '#fff' },

  // View all
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24, marginTop: 12 },
  viewAllBtnText: { ...TextStyles.callout, color: CultureTokens.indigo },
});
