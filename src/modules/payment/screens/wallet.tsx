import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { modulesApi, type MembershipSummary, type RewardsSummary, type WalletTransaction } from '@/modules/api';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, TextStyles, FontFamily } from '@/design-system/tokens/theme';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { Skeleton } from '@/design-system/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOYALTY_CYCLE_DAYS = 365;

const LOYALTY_CYCLE_COLORS = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.gold,
  CultureTokens.coral,
  CultureTokens.gold,
] as const;

// ─── Tier config ──────────────────────────────────────────────────────────────

const tierConfigMap: Record<string, { label: string; glow: string }> = {
  free:    { label: 'Standard', glow: 'rgba(227, 106, 78, 0.18)' },
  plus:    { label: 'Plus',     glow: 'rgba(79, 70, 229, 0.28)' },
  premium: { label: 'Premium',  glow: 'rgba(255, 200, 87, 0.22)' },
  elite:   { label: 'Elite',    glow: 'rgba(20, 184, 166, 0.22)' },
  vip:     { label: 'VIP',      glow: 'rgba(255, 200, 87, 0.28)' },
  pro:     { label: 'Pro',      glow: 'rgba(0, 240, 255, 0.20)' },
};

// ─── Transaction helpers ──────────────────────────────────────────────────────

function getTypeIcon(type: WalletTransaction['type']): string {
  switch (type) {
    case 'topup':    return 'arrow-down-circle';
    case 'cashback': return 'sparkles';
    case 'refund':   return 'return-up-back';
    case 'payment':  return 'arrow-up-circle';
    default:         return 'swap-horizontal';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── StatBox component ────────────────────────────────────────────────────────

interface StatBoxProps {
  value: string | number;
  label: string;
  icon: string;
  styles: ReturnType<typeof getStyles>;
}

function StatBox({ value, label, icon, styles: s }: StatBoxProps) {
  return (
    <View style={s.statBox}>
      <View style={s.statIconWrap}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={CultureTokens.indigo} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsetsWeb();
  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const { userId, user } = useAuth();

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

  const { data: transactions = [], isLoading: txLoading } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/transactions', userId],
    queryFn: () => modulesApi.wallet.transactions(userId!),
    enabled: !!userId,
  });

  // Derived wallet balance from transactions
  const walletBalance = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const recentTransactions = useMemo(
    () => [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).slice(0, 3),
    [transactions],
  );

  // Loyalty cycle calculation
  const memberSinceDate = useMemo(() => {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) return createdAt;
    if (membership?.expiresAt) {
      const expiresAt = new Date(membership.expiresAt);
      if (!Number.isNaN(expiresAt.getTime())) {
        const estimated = new Date(expiresAt);
        estimated.setDate(estimated.getDate() - LOYALTY_CYCLE_DAYS);
        return estimated;
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
    return { completedCycles, dayInCycle, cyclePercent, cycleColor };
  }, [memberSinceDate]);

  const tier = membership?.tier ?? 'free';
  const tierConf = tierConfigMap[tier] ?? tierConfigMap.free;
  const cashbackRate = membership?.cashbackRate ?? 0;
  const cashbackDisplay = `${(cashbackRate * 100).toFixed(cashbackRate > 0 ? 1 : 0)}%`;

  // Balance card gradient colours derived from tier glow
  const balanceGradientStart = tierConf.glow;

  return (
    <AuthGuard
      icon="wallet-outline"
      title="Wallet & Rewards"
      message="Sign in to access your wallet and rewards."
    >
      <View style={styles.container}>
        <AppHeaderBar
          title="Wallet & Rewards"
          backFallback="/(tabs)/my-space"
          topInset={topInset}
          rightAction={{
            icon: 'receipt-outline',
            onPress: () => router.push('/payment/transactions'),
            label: 'Transactions',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomInset + 32 },
            isDesktop && { alignItems: 'center' },
          ]}
        >
          <View style={[styles.contentWrap, isDesktop && styles.contentWrapDesktop]}>

            {/* ── Balance Card ──────────────────────────────────────────── */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={[balanceGradientStart, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.balanceTop}>
                <View>
                  <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
                  <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceMeta}>
                  <Text style={styles.balanceTierLabel}>{tierConf.label.toUpperCase()}</Text>
                  <Text style={styles.balanceCashback}>{cashbackDisplay} cashback</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.topUpBtn, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/payment/methods');
                }}
                accessibilityRole="button"
                accessibilityLabel="Top up wallet"
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.topUpBtnText}>Top Up</Text>
              </Pressable>
            </View>

            {/* ── Rewards Strip ─────────────────────────────────────────── */}
            <View style={styles.rewardsStrip}>
              <View style={styles.rewardsLeft}>
                <View style={styles.rewardsIconWrap}>
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
                <Text style={styles.rewardsPoints}>{rewards?.points ?? 0}</Text>
                <Text style={styles.rewardsPointsLabel}>PTS</Text>
              </View>
            </View>

            {/* ── Membership Progress ───────────────────────────────────── */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeaderRow}>
                <View>
                  <Text style={styles.progressLabel}>MEMBERSHIP PROGRESS</Text>
                  <Text style={styles.progressSubText}>
                    Member since{' '}
                    {memberSinceDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
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
                      width: `${loyaltyProgress.cyclePercent}%` as `${number}%`,
                      backgroundColor: loyaltyProgress.cycleColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressStatsRow}>
                <View style={styles.progressStatItem}>
                  <Text style={styles.progressStatLabel}>EVENTS ATTENDED</Text>
                  <Text style={styles.progressStatValue}>{membership?.eventsAttended ?? 0}</Text>
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
                      <Text style={styles.progressStatValue}>
                        {((membership.cashbackMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* ── Upgrade Prompt (free tier only) ──────────────────────── */}
            {(!membership || membership.tier === 'free') && (
              <Pressable
                style={({ pressed }) => [styles.upgradePrompt, pressed && { opacity: 0.8 }]}
                onPress={() => router.push({ pathname: '/membership/upgrade' })}
                accessibilityRole="button"
                accessibilityLabel="Upgrade membership"
              >
                <Ionicons name="star" size={18} color={CultureTokens.gold} />
                <Text style={styles.upgradePromptText}>
                  Upgrade to Plus for 2% cashback on all tickets
                </Text>
                <Ionicons name="chevron-forward" size={16} color={CultureTokens.gold} />
              </Pressable>
            )}

            {/* ── Quick Stats Row ───────────────────────────────────────── */}
            <View style={styles.statsRow}>
              <StatBox
                value={`$${walletBalance.toFixed(2)}`}
                label="Balance"
                icon="wallet-outline"
                styles={styles}
              />
              <View style={styles.statsDivider} />
              <StatBox
                value={cashbackDisplay}
                label="Cashback"
                icon="sparkles"
                styles={styles}
              />
              <View style={styles.statsDivider} />
              <StatBox
                value={membership?.eventsAttended ?? 0}
                label="Attended"
                icon="checkmark-circle"
                styles={styles}
              />
            </View>

            {/* ── Quick Navigation 2×2 Grid ─────────────────────────────── */}
            <View style={styles.quickNavGrid}>
              {([
                { icon: 'ticket-outline',  label: 'My Tickets',    route: '/tickets/index' },
                { icon: 'id-card-outline', label: 'Digital ID',    route: '/profile/qr' },
                { icon: 'card-outline',    label: 'Transactions',  route: '/payment/transactions' },
                { icon: 'star-outline',    label: 'Membership',    route: '/membership/upgrade' },
              ] as const).map(({ icon, label, route }) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => [styles.quickNavCard, pressed && { opacity: 0.75 }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(route as Parameters<typeof router.push>[0]);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <View style={styles.quickNavIconWrap}>
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={CultureTokens.indigo} />
                  </View>
                  <Text style={styles.quickNavLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Recent Transactions ───────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <Pressable
                onPress={() => router.push('/payment/transactions')}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="View all transactions"
              >
                <Text style={styles.viewAllLink}>View All</Text>
              </Pressable>
            </View>

            {txLoading ? (
              <View style={styles.txList}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={styles.txCardSkeleton}>
                    <Skeleton width={46} height={46} borderRadius={12} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width="70%" height={14} borderRadius={6} />
                      <Skeleton width="45%" height={12} borderRadius={6} />
                    </View>
                    <Skeleton width={60} height={18} borderRadius={6} />
                  </View>
                ))}
              </View>
            ) : recentTransactions.length === 0 ? (
              <View style={styles.txEmptyState}>
                <View style={styles.txEmptyIcon}>
                  <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
                </View>
                <Text style={styles.txEmptyTitle}>No Transactions Yet</Text>
                <Text style={styles.txEmptySubtitle}>
                  Top up your wallet or book an event to get started.
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {recentTransactions.map((item) => {
                  const isCredit =
                    item.type === 'topup' ||
                    item.type === 'refund' ||
                    item.type === 'cashback';
                  const amountColor = isCredit ? colors.success : colors.error;
                  return (
                    <View key={item.id} style={styles.txCard}>
                      <View style={[styles.txIcon, { backgroundColor: amountColor + '18' }]}>
                        <Ionicons
                          name={getTypeIcon(item.type) as keyof typeof Ionicons.glyphMap}
                          size={22}
                          color={amountColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txDescription} numberOfLines={1}>
                          {item.description || (isCredit ? 'Wallet Credit' : 'Payment')}
                        </Text>
                        <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: amountColor }]}>
                        {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container:           { flex: 1, backgroundColor: colors.background },
    scrollContent:       { flexGrow: 1 },
    contentWrap:         { width: '100%' },
    contentWrapDesktop:  { maxWidth: 640 },

    // Balance Card
    balanceCard: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 16,
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      gap: 20,
      ...Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        default: { elevation: 3 },
      }),
    },
    balanceTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    balanceLabel: {
      ...TextStyles.badge,
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 6,
    },
    balanceAmount: {
      fontSize: 36,
      fontFamily: FontFamily.bold,
      color: colors.text,
      lineHeight: 42,
    },
    balanceMeta: {
      alignItems: 'flex-end',
      gap: 4,
    },
    balanceTierLabel: {
      ...TextStyles.badge,
      color: CultureTokens.indigo,
      letterSpacing: 1,
    },
    balanceCashback: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    topUpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: CultureTokens.indigo,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignSelf: 'flex-start',
    },
    topUpBtnText: {
      ...TextStyles.callout,
      color: '#fff',
    },

    // Rewards Strip
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
    rewardsLeft:       { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    rewardsIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.gold + '18' },
    rewardsTitle:      { ...TextStyles.cardTitle, color: colors.text, marginBottom: 2 },
    rewardsSub:        { ...TextStyles.caption, color: colors.textSecondary },
    rewardsPointsWrap: { alignItems: 'flex-end' },
    rewardsPoints:     { ...TextStyles.title, color: CultureTokens.gold, lineHeight: 26 },
    rewardsPointsLabel:{ ...TextStyles.badge, color: CultureTokens.gold, opacity: 0.8, marginTop: 2 },

    // Membership Progress
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
    progressLabel:   { ...TextStyles.captionSemibold, color: colors.textSecondary, letterSpacing: 1 },
    progressSubText: { ...TextStyles.caption, color: colors.textSecondary, marginTop: 2 },
    progressBadge:   { backgroundColor: colors.borderLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    progressBadgeText: { ...TextStyles.badge, color: colors.text },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.borderLight,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: { height: '100%', borderRadius: 999 },
    progressStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    progressStatItem:    { flex: 1, alignItems: 'flex-start' },
    progressStatLabel:   { ...TextStyles.badge, color: colors.textTertiary, letterSpacing: 0.5 },
    progressStatValue:   { ...TextStyles.title3, color: colors.text, marginTop: 2 },
    progressStatDivider: { width: 1, height: 28, backgroundColor: colors.borderLight, marginHorizontal: 12 },

    // Upgrade Prompt
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

    // Stats Row
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
    statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: CultureTokens.indigo + '15' },
    statValue:    { ...TextStyles.title2, color: CultureTokens.indigo },
    statLabel:    { ...TextStyles.caption, marginTop: 4, color: colors.textSecondary },
    statsDivider: { width: 1, marginVertical: 14, backgroundColor: colors.borderLight },

    // Quick Nav Grid
    quickNavGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    quickNavCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
        default: { elevation: 2 },
      }),
    },
    quickNavIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CultureTokens.indigo + '12',
    },
    quickNavLabel: { ...TextStyles.cardTitle, color: colors.text, flex: 1 },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginBottom: 12,
    },
    sectionTitle: { ...TextStyles.title3, color: colors.text },
    viewAllLink:  { ...TextStyles.callout, color: CultureTokens.indigo },

    // Transactions
    txList: { marginHorizontal: 20, gap: 10 },
    txCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.borderLight,
      ...Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
        default: { elevation: 2 },
      }),
    },
    txCardSkeleton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 16,
      padding: 16,
      marginBottom: 0,
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.borderLight,
    },
    txIcon:        { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txDescription: { ...TextStyles.callout, color: colors.text, marginBottom: 2 },
    txDate:        { ...TextStyles.caption, color: colors.textSecondary },
    txAmount:      { ...TextStyles.headline },

    // Empty state
    txEmptyState:    { alignItems: 'center', paddingVertical: 40, marginHorizontal: 20 },
    txEmptyIcon:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
    txEmptyTitle:    { ...TextStyles.title3, color: colors.text, marginBottom: 6 },
    txEmptySubtitle: { ...TextStyles.cardBody, textAlign: 'center', color: colors.textSecondary, lineHeight: 22 },
  });
