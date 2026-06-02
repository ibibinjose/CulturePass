/**
 * CulturePass+ — upgrade & member management
 *
 * Non-Plus: hero → intro offer → pricing toggle → promo code → CTA
 * Plus: rich member dashboard → plan card → benefits → quick actions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedScrollHandler, useAnimatedStyle,
  useSharedValue, interpolate, Extrapolate,
} from 'react-native-reanimated';

import { useMembershipUpgrade } from '@/hooks/useMembershipUpgrade';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, FontFamily } from '@/design-system/tokens/theme';
import { routeWithRedirect } from '@/lib/routes';
import { useSafeBack } from '@/lib/navigation';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { LuxeButton, LuxeCard, LuxeText } from '@/design-system/ui';
import { HapticManager } from '@/lib/haptics';
import {
  BENEFITS,
  DARK_BORDER,
  GOLD,
  GOLD_DIM,
  WHITE,
  WHITE_60,
  WHITE_40,
  WHITE_20,
  membershipHaptic,
} from '@/modules/membership/membershipShared';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function UpgradeSkeleton({ topInset }: { topInset: number }) {
  const colors = useColors();
  return (
    <View style={[sk.root, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
      <View style={sk.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={130} height={22} borderRadius={6} />
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 20 }}>
          <Skeleton width={96} height={96} borderRadius={48} />
          <Skeleton width={210} height={42} borderRadius={10} />
          <Skeleton width={170} height={20} borderRadius={6} />
          <Skeleton width="100%" height={70} borderRadius={20} />
        </View>
        <View style={{ gap: 14 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height={80} borderRadius={24} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const sk = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 56,
  },
});

// ─── Plan status card (Plus member view) ──────────────────────────────────────

function PlanStatusCard({
  expiresAt,
  eventsAttended,
  cashbackRate,
  earlyAccessHours,
}: {
  expiresAt: string | null;
  eventsAttended: number;
  cashbackRate: number;
  earlyAccessHours: number;
}) {
  const colors = useColors();
  const renewalLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No expiry set';
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;
  const cashbackPct = Math.round(cashbackRate * 100);

  return (
    <LuxeCard variant="glass" tone="auto" style={planCard.wrap}>
      {/* Plan name row */}
      <View style={planCard.topRow}>
        <View style={planCard.nameRow}>
          <View style={[planCard.iconBubble, { backgroundColor: colors.gold + '18' }]}>
            <Ionicons name="diamond" size={18} color={colors.gold} />
          </View>
          <LuxeText variant="title3" style={[planCard.planName, { color: colors.text }]}>CulturePass+</LuxeText>
        </View>
        <View style={[planCard.activeBadge, { borderColor: CultureTokens.teal + '40', backgroundColor: CultureTokens.teal + '20' }]}>
          <View style={planCard.activeDot} />
          <LuxeText variant="badge" style={planCard.activeText}>Active</LuxeText>
        </View>
      </View>

      <View style={[planCard.divider, { backgroundColor: colors.borderLight }]} />

      {/* Renewal */}
      <View style={planCard.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
        <LuxeText variant="caption" style={[planCard.metaText, { color: colors.textSecondary }]}>
          Renews {renewalLabel}
          {daysLeft !== null && daysLeft <= 14
            ? <LuxeText style={{ color: colors.gold }}> · {daysLeft}d left</LuxeText>
            : null}
        </LuxeText>
      </View>

      {/* Stats */}
      <View style={[planCard.statsRow, { backgroundColor: colors.surfaceVariant }]}>
        <View style={planCard.stat}>
          <LuxeText variant="title" style={[planCard.statValue, { color: colors.text }]}>{eventsAttended}</LuxeText>
          <LuxeText variant="caption" style={[planCard.statLabel, { color: colors.textTertiary }]}>Events attended</LuxeText>
        </View>
        <View style={[planCard.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={planCard.stat}>
          <LuxeText variant="title" style={[planCard.statValue, { color: colors.text }]}>{cashbackPct}%</LuxeText>
          <LuxeText variant="caption" style={[planCard.statLabel, { color: colors.textTertiary }]}>Cashback rate</LuxeText>
        </View>
        <View style={[planCard.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={planCard.stat}>
          <LuxeText variant="title" style={[planCard.statValue, { color: colors.text }]}>{earlyAccessHours}h</LuxeText>
          <LuxeText variant="caption" style={[planCard.statLabel, { color: colors.textTertiary }]}>Early access</LuxeText>
        </View>
      </View>
    </LuxeCard>
  );
}

const planCard = StyleSheet.create({
  wrap: {
    padding: 20, marginBottom: 28, gap: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBubble: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: GOLD + '20', alignItems: 'center', justifyContent: 'center',
  },
  planName: { color: WHITE, letterSpacing: -0.4 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CultureTokens.teal + '20', borderWidth: 1,
    borderColor: CultureTokens.teal + '40',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CultureTokens.teal },
  activeText: { color: CultureTokens.teal, letterSpacing: 0.2 },
  divider: { height: 1, backgroundColor: DARK_BORDER },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { color: WHITE_40 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE_20, borderRadius: 14, padding: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: WHITE, letterSpacing: -0.6 },
  statLabel: { color: WHITE_40, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: DARK_BORDER },
});

// ─── Promo code widget ─────────────────────────────────────────────────────────

function PromoCodeWidget({ userId, onFreeActivation }: { userId: string | null; onFreeActivation: () => void }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (c: string) => api.membership.redeemCode(c),
    onSuccess: (data) => {
      setError(null);
      setSuccessMsg(`CulturePass+ activated for ${data.durationDays} days! 🎉`);
      setCode('');
      setTimeout(onFreeActivation, 1600);
    },
    onError: (err: Error) => {
      const msg = err.message ?? 'Invalid or expired code';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no longer active')) {
        setError('Code not found or no longer active. Check for typos and try again.');
      } else if (msg.toLowerCase().includes('already used')) {
        setError('You have already used this code.');
      } else if (msg.toLowerCase().includes('expired')) {
        setError('This code has expired.');
      } else {
        setError(msg);
      }
    },
  });

  const handleRedeem = useCallback(() => {
    if (!code.trim() || !userId) return;
    setError(null);
    setSuccessMsg(null);
    membershipHaptic();
    mutation.mutate(code.trim().toUpperCase());
  }, [code, userId, mutation]);

  return (
    <LuxeCard variant="glass" tone="auto" size="sm" style={pc.outer}>
      <Pressable
        onPress={() => { membershipHaptic(); setExpanded(v => !v); }}
        style={pc.toggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse promo code' : 'Enter promo or gift code'}
      >
        <View style={pc.toggleLeft}>
          <View style={[pc.toggleIcon, { backgroundColor: colors.gold + '18' }]}>
            <Ionicons name="pricetag-outline" size={17} color={colors.gold} />
          </View>
          <LuxeText variant="bodyMedium" style={[pc.toggleLabel, { color: colors.textSecondary }]}>Have a promo or gift code?</LuxeText>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded && (
        <View style={[pc.body, { borderTopColor: colors.borderLight }]}>
          <View style={pc.inputRow}>
            <TextInput
              value={code}
              onChangeText={v => { setCode(v); setError(null); setSuccessMsg(null); }}
              placeholder="e.g. CULTURE30"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleRedeem}
              editable={!mutation.isPending}
              style={[pc.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: error ? '#EF4444' : colors.borderLight }]}
              accessibilityLabel="Promo or gift code"
            />
            <LuxeButton
              variant="filled"
              tone="auto"
              size="sm"
              onPress={handleRedeem}
              disabled={!code.trim() || mutation.isPending || !userId}
              loading={mutation.isPending}
            >
              Apply
            </LuxeButton>
          </View>

          {error ? (
            <View style={pc.msgRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <LuxeText variant="caption" style={[pc.msgText, pc.msgError]}>{error}</LuxeText>
            </View>
          ) : null}

          {successMsg ? (
            <View style={pc.msgRow}>
              <Ionicons name="checkmark-circle" size={14} color={CultureTokens.teal} />
              <LuxeText variant="caption" style={[pc.msgText, pc.msgSuccess]}>{successMsg}</LuxeText>
            </View>
          ) : null}

          <LuxeText variant="caption" style={[pc.hint, { color: colors.textTertiary }]}>
            Gift codes activate Plus instantly.{' '}
            Stripe discount codes can be entered after clicking &quot;Unlock CulturePass+&quot;.
          </LuxeText>
        </View>
      )}
    </LuxeCard>
  );
}

const pc = StyleSheet.create({
  outer: {
    marginBottom: 14, padding: 0,
  },
  toggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: GOLD + '18', alignItems: 'center', justifyContent: 'center',
  },
  toggleLabel: { color: WHITE_60 },
  body: { borderTopWidth: 1, borderTopColor: DARK_BORDER, padding: 16, gap: 10 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontFamily: FontFamily.bold, fontSize: 14,
    letterSpacing: 1.2,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  msgText: { fontSize: 12, fontFamily: FontFamily.medium, flex: 1, lineHeight: 17 },
  msgError: { color: '#EF4444' },
  msgSuccess: { color: CultureTokens.teal },
  hint: { fontSize: 11, fontFamily: FontFamily.regular, lineHeight: 16, marginTop: 4 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const pathname   = usePathname();
  const handleBack = useSafeBack('/(tabs)/my-space');
  const { hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const colors = useColors();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 120], [0, 1], Extrapolate.CLAMP),
    backgroundColor: `${colors.background}${interpolate(scrollY.value, [40, 120], [0, 0.94], Extrapolate.CLAMP) > 0.9 ? 'F0' : '00'}`,
  }));
  const headerTitleAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [80, 150], [0, 1], Extrapolate.CLAMP),
  }));

  const { userId } = useAuth();

  const {
    isAuthenticated, isMembershipLoading, membership,
    isPlus, memberCount, billingPeriod, setBillingPeriod,
    price, perMonth, loading,
    executeSubscribe, executeCancel,
  } = useMembershipUpgrade();

  const params = useLocalSearchParams<{ status?: 'success' | 'cancelled'; session_id?: string }>();

  useEffect(() => {
    // 1. Mobile browser deep link redirection:
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const ua = navigator.userAgent || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      if (isMobile && params.status) {
        const schemeUrl = `culturepass://membership/upgrade?status=${params.status}${params.session_id ? `&session_id=${params.session_id}` : ''}`;
        window.location.href = schemeUrl;
        return;
      }
    }

    // 2. Local redirection/cleanup and haptics/alerts
    if (params.status === 'success') {
      void HapticManager.success();
      queryClient.invalidateQueries({ queryKey: ['membership', userId] });
      queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });
      Alert.alert(
        'Welcome to CulturePass+!',
        'Your membership is now active. Enjoy early access, cashback rewards, and exclusive perks!'
      );
      router.replace('/membership/upgrade');
    } else if (params.status === 'cancelled') {
      void HapticManager.medium();
      Alert.alert('Checkout Cancelled', 'You have cancelled the subscription process.');
      router.replace('/membership/upgrade');
    }
  }, [params.status, params.session_id, userId]);

  const { data: introOffer } = useQuery({
    queryKey: ['membership-intro-eligibility'],
    queryFn: () => api.membership.introEligibility(),
    enabled: isAuthenticated && !isPlus,
  });

  const handleFreeActivation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['membership'] });
  }, []);

  if (isMembershipLoading && !membership && isAuthenticated) {
    return <UpgradeSkeleton topInset={topInset} />;
  }

  // ── Floating animated header ───────────────────────────────────────────────
  const floatingHeader = (
    <View style={[hdr.wrap, { paddingTop: topInset + 16 }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, hdr.blurBg, { borderBottomColor: colors.borderLight }, headerAnim]} pointerEvents="none" />
      <View style={hdr.row}>
        <Pressable
          onPress={() => { membershipHaptic(); handleBack(); }}
          style={({ pressed }) => [hdr.backBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Animated.Text style={[hdr.title, { color: colors.text }, headerTitleAnim]}>
          CulturePass+
        </Animated.Text>
        <View style={{ width: 44 }} />
      </View>
    </View>
  );

  const scrollContentStyle = [
    page.content,
    {
      paddingTop: topInset + 72,
      paddingBottom: safeInsets.bottom + 48,
      paddingHorizontal: hPad,
    },
  ];

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[page.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[`${colors.primary}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {floatingHeader}
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          <Animated.View entering={FadeInUp.springify().damping(18)} style={hero.wrap}>
            <View style={[hero.iconRing, { borderColor: colors.gold + '50' }]}>
              <LinearGradient colors={[colors.gold + '30', colors.gold + '08']} style={[StyleSheet.absoluteFill, { borderRadius: 56 }]} />
              <Ionicons name="star" size={52} color={colors.gold} />
            </View>
            <LuxeText variant="display" style={[hero.title, { color: colors.text }]}>CulturePass+</LuxeText>
            <View style={[hero.badge, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '40' }]}>
              <LuxeText variant="badge" style={[hero.badgeText, { color: colors.gold }]}>PREMIUM MEMBERSHIP</LuxeText>
            </View>
            <LuxeText variant="body" style={[hero.desc, { color: colors.textSecondary }]}>
              Unlock exclusive benefits, earn cashback, and get early access to the experiences that matter most.
            </LuxeText>
          </Animated.View>

          <View style={page.benefitsGrid}>
            {BENEFITS.slice(0, 4).map((b, i) => (
              <Animated.View key={b.title} entering={FadeInDown.delay(200 + i * 80)} style={{ flex: 1, minWidth: '46%' }}>
                <LuxeCard variant="glass" tone="auto" style={bCard.wrap}>
                  <View style={[bCard.icon, { backgroundColor: b.color + '20' }]}>
                    <Ionicons name={b.icon} size={22} color={b.color} />
                  </View>
                  <LuxeText variant="bodyMedium" style={[bCard.title, { color: colors.text }]}>{b.title}</LuxeText>
                  <LuxeText variant="caption" style={[bCard.desc, { color: colors.textSecondary }]}>{b.desc}</LuxeText>
                </LuxeCard>
              </Animated.View>
            ))}
          </View>

          <View style={page.ctaArea}>
            <LuxeButton
              variant="filled"
              tone="auto"
              leftIcon="star"
              fullWidth
              onPress={() => {
                membershipHaptic();
                router.push(routeWithRedirect('/(onboarding)/login', pathname));
              }}
            >
              Sign in to unlock
            </LuxeButton>
            <Pressable onPress={() => router.replace('/(tabs)')} style={cta.ghost}>
              <LuxeText variant="bodyMedium" style={[cta.ghostText, { color: colors.textSecondary }]}>Explore as guest</LuxeText>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }

  // ── Plus member — dedicated member dashboard ───────────────────────────────
  if (isPlus && membership) {
    return (
      <View style={[page.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.gold + '12', 'transparent']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
          style={[StyleSheet.absoluteFill, { top: 0, height: '50%' }]}
          pointerEvents="none"
        />
        {floatingHeader}

        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          {/* Member hero */}
          <Animated.View entering={FadeInUp.springify().damping(16)} style={hero.wrap}>
            <View style={[hero.iconRing, { borderColor: CultureTokens.teal + '60' }]}>
              <LinearGradient colors={[CultureTokens.teal + '30', CultureTokens.teal + '08']} style={[StyleSheet.absoluteFill, { borderRadius: 56 }]} />
              <Ionicons name="checkmark-circle" size={52} color={CultureTokens.teal} />
            </View>
            <LuxeText variant="display" style={[hero.title, { color: colors.text }]}>CulturePass+</LuxeText>
            <View style={[hero.badge, { backgroundColor: CultureTokens.teal + '20', borderColor: CultureTokens.teal + '50' }]}>
              <LuxeText variant="badge" style={[hero.badgeText, { color: CultureTokens.teal }]}>✓  ACTIVE MEMBER</LuxeText>
            </View>
            <LuxeText variant="body" style={[hero.desc, { color: colors.textSecondary }]}>
              You&apos;re enjoying all CulturePass+ benefits. Thank you for being part of the inner circle.
            </LuxeText>
          </Animated.View>

          {/* Plan status card */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <PlanStatusCard
              expiresAt={membership.expiresAt ?? null}
              eventsAttended={membership.eventsAttended ?? 0}
              cashbackRate={membership.cashbackRate ?? 0.02}
              earlyAccessHours={membership.earlyAccessHours ?? 48}
            />
          </Animated.View>

          {/* Benefits */}
          <Animated.View entering={FadeInDown.delay(200)} style={page.section}>
            <LuxeText variant="badge" style={[page.sectionTitle, { color: colors.textTertiary }]}>YOUR ACTIVE BENEFITS</LuxeText>
            <View style={{ gap: 10 }}>
              {BENEFITS.map((b, i) => (
                <Animated.View key={b.title} entering={FadeInDown.delay(250 + i * 55)}>
                  <LuxeCard variant="glass" tone="auto" size="sm" style={bRow.wrap}>
                    <View style={[bRow.icon, { backgroundColor: b.color + '20' }]}>
                      <Ionicons name={b.icon} size={24} color={b.color} />
                    </View>
                    <View style={bRow.text}>
                      <LuxeText variant="bodyMedium" style={[bRow.title, { color: colors.text }]}>{b.title}</LuxeText>
                      <LuxeText variant="caption" style={[bRow.desc, { color: colors.textSecondary }]}>{b.desc}</LuxeText>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={CultureTokens.teal} />
                  </LuxeCard>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(420)}>
            <LuxeCard variant="glass" tone="auto" size="sm" style={{ padding: 0, marginBottom: 28 }}>
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/perks'); }}
                style={({ pressed }) => [actions.row, { backgroundColor: pressed ? colors.primarySoft : 'transparent' }]}
                accessibilityRole="button"
              >
                <View style={[actions.icon, { backgroundColor: colors.gold + '18' }]}>
                  <Ionicons name="gift-outline" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={[actions.label, { color: colors.text }]}>Explore your perks</LuxeText>
                  <LuxeText variant="caption" style={{ color: colors.textSecondary }}>Members-only deals from top venues</LuxeText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>

              <View style={[actions.divider, { backgroundColor: colors.borderLight }]} />

              <Pressable
                onPress={() => { membershipHaptic(); router.push('/membership'); }}
                style={({ pressed }) => [actions.row, { backgroundColor: pressed ? colors.primarySoft : 'transparent' }]}
                accessibilityRole="button"
              >
                <View style={[actions.icon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="card-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={[actions.label, { color: colors.text }]}>Membership hub</LuxeText>
                  <LuxeText variant="caption" style={{ color: colors.textSecondary }}>View your full membership details</LuxeText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>

              <View style={[actions.divider, { backgroundColor: colors.borderLight }]} />

              <Pressable
                onPress={() => {
                  membershipHaptic();
                  Alert.alert(
                    'Cancel CulturePass+',
                    'Are you sure? You will keep access until the end of your billing period.',
                    [
                      { text: 'Keep Plus', style: 'cancel' },
                      { text: 'Cancel subscription', style: 'destructive', onPress: executeCancel },
                    ],
                  );
                }}
                style={({ pressed }) => [actions.row, { backgroundColor: pressed ? colors.primarySoft : 'transparent' }]}
                accessibilityRole="button"
              >
                <View style={[actions.icon, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={[actions.label, { color: '#EF4444' }]}>Cancel subscription</LuxeText>
                  <LuxeText variant="caption" style={{ color: colors.textSecondary }}>You keep access until your paid period ends</LuxeText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            </LuxeCard>
          </Animated.View>

          <LuxeText variant="caption" style={[page.fine, { color: colors.textTertiary }]}>
            Secured by Stripe · Cancel anytime · CulturePass+ is a marketplace membership, not a government service.
          </LuxeText>
        </Animated.ScrollView>
      </View>
    );
  }

  // ── Non-Plus authenticated — upgrade flow ──────────────────────────────────
  return (
    <View style={[page.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gold + '12', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { top: 0, height: '50%' }]}
        pointerEvents="none"
      />
      {floatingHeader}

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        {/* Hero */}
        <Animated.View entering={FadeInUp.springify().damping(16)} style={hero.wrap}>
          <View style={[hero.iconRing, { borderColor: colors.gold + '50' }]}>
            <LinearGradient colors={[colors.gold + '35', colors.gold + '10']} style={[StyleSheet.absoluteFill, { borderRadius: 56 }]} />
            <Ionicons name="diamond" size={52} color={colors.gold} />
          </View>
          <LuxeText variant="display" style={[hero.title, { color: colors.text }]}>CulturePass+</LuxeText>
          <View style={[hero.badge, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '40' }]}>
            <LuxeText variant="badge" style={[hero.badgeText, { color: colors.gold }]}>PREMIUM MEMBERSHIP</LuxeText>
          </View>
          <LuxeText variant="body" style={[hero.desc, { color: colors.textSecondary }]}>
            {memberCount > 0
              ? `Join ${memberCount.toLocaleString()} cultural explorers already on Plus.`
              : 'Unlock exclusive benefits, earn cashback, and get early access to the best cultural experiences.'}
          </LuxeText>
        </Animated.View>

        {/* Intro offer banner */}
        {introOffer?.eligible ? (
          <Animated.View entering={FadeInDown.delay(60)}>
            <LuxeCard variant="glass" tone="auto" size="sm" style={introOfferBanner.wrap}>
              <View style={introOfferBanner.row}>
                <Ionicons name="pricetag" size={24} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={[introOfferBanner.title, { color: colors.text }]}>{introOffer.headline}</LuxeText>
                  <LuxeText variant="caption" style={[introOfferBanner.desc, { color: colors.textSecondary }]}>{introOffer.detail}</LuxeText>
                </View>
              </View>
            </LuxeCard>
          </Animated.View>
        ) : null}

        {/* Pricing toggle */}
        <Animated.View entering={FadeInDown.delay(150)} style={pricing.wrap}>
          <View style={[pricing.toggle, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
            {(['monthly', 'yearly'] as const).map(period => (
              <Pressable
                key={period}
                style={[pricing.tab, billingPeriod === period && { backgroundColor: colors.text }]}
                onPress={() => { membershipHaptic(); setBillingPeriod(period); }}
              >
                {period === 'yearly' && (
                  <View style={pricing.savePill}>
                    <Text style={pricing.savePillText}>SAVE 28%</Text>
                  </View>
                )}
                <Text style={[pricing.tabText, { color: colors.textSecondary }, billingPeriod === period && { color: colors.background }]}>
                  {period === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </Pressable>
            ))}
          </View>

          <LuxeCard variant="glass" tone="auto" style={pricing.card}>
            <LuxeText variant="display" style={[pricing.amount, { color: colors.gold }]}>{price}</LuxeText>
            <LuxeText variant="badge" style={[pricing.period, { color: colors.textTertiary }]}>
              {billingPeriod === 'yearly' ? 'PER YEAR' : 'PER MONTH'}
            </LuxeText>
            {billingPeriod === 'yearly' ? (
              <LuxeText variant="body" style={[pricing.equiv, { color: colors.textSecondary }]}>{"That's"} just {perMonth} per month</LuxeText>
            ) : null}
          </LuxeCard>
        </Animated.View>

        {/* Benefits list */}
        <Animated.View entering={FadeInDown.delay(250)} style={page.section}>
          <LuxeText variant="badge" style={[page.sectionTitle, { color: colors.textTertiary }]}>WHAT YOU GET</LuxeText>
          <View style={{ gap: 10 }}>
            {BENEFITS.map((b, i) => (
              <Animated.View key={b.title} entering={FadeInDown.delay(300 + i * 60)}>
                <LuxeCard variant="glass" tone="auto" size="sm" style={bRow.wrap}>
                  <View style={[bRow.icon, { backgroundColor: b.color + '20' }]}>
                    <Ionicons name={b.icon} size={24} color={b.color} />
                  </View>
                  <View style={bRow.text}>
                    <LuxeText variant="bodyMedium" style={[bRow.title, { color: colors.text }]}>{b.title}</LuxeText>
                    <LuxeText variant="caption" style={[bRow.desc, { color: colors.textSecondary }]}>{b.desc}</LuxeText>
                  </View>
                  <Ionicons name="lock-closed" size={15} color={colors.textTertiary} />
                </LuxeCard>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Promo / gift code */}
        <Animated.View entering={FadeInDown.delay(460)}>
          <PromoCodeWidget userId={userId} onFreeActivation={handleFreeActivation} />
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(520)} style={page.ctaArea}>
          <LuxeButton
            variant="filled"
            tone="auto"
            leftIcon="diamond"
            fullWidth
            loading={loading}
            disabled={loading}
            onPress={() => {
              membershipHaptic();
              executeSubscribe();
            }}
          >
            Unlock CulturePass+
          </LuxeButton>
          <LuxeText variant="caption" style={[cta.finePrint, { color: colors.textTertiary }]}>
            Secured by Stripe · Cancel anytime · No hidden fees
          </LuxeText>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11, fontFamily: FontFamily.bold,
    letterSpacing: 2,
    marginBottom: 14, textAlign: 'center',
  },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  ctaArea: { marginBottom: 16, gap: 10 },
  fine: {
    fontSize: 11, fontFamily: FontFamily.regular,
    textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, marginTop: 8,
  },
});

const hdr = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  blurBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 56,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
});

const hero = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 36, paddingTop: 12 },
  iconRing: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 28, overflow: 'hidden',
  },
  title: { fontSize: 40, fontFamily: FontFamily.bold, letterSpacing: -1.5, textAlign: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999, marginTop: 12,
  },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  desc: {
    fontSize: 15, fontFamily: FontFamily.regular,
    textAlign: 'center', lineHeight: 23, marginTop: 18, paddingHorizontal: 8,
  },
});

const pricing = StyleSheet.create({
  wrap: { marginBottom: 36 },
  toggle: {
    flexDirection: 'row',
    borderRadius: 32, padding: 5, marginBottom: 20,
    borderWidth: 1,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 28, justifyContent: 'center' },
  tabText: { fontSize: 15, fontFamily: FontFamily.bold },
  savePill: {
    position: 'absolute', top: -10, right: 8,
    backgroundColor: CultureTokens.teal,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  savePillText: { fontSize: 9, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: 0.5 },
  card: {
    alignItems: 'center', padding: 36,
  },
  amount: { fontSize: 68, fontFamily: FontFamily.bold, letterSpacing: -3, lineHeight: 72 },
  period: { fontSize: 13, fontFamily: FontFamily.bold, letterSpacing: 2, marginTop: -4 },
  equiv: { fontSize: 14, fontFamily: FontFamily.medium, marginTop: 14 },
});

// Benefit card (2-column grid — unauthenticated view)
const bCard = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  desc: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 17 },
});

// Benefit row (full-width list)
const bRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16,
  },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1 },
  title: { fontSize: 16, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  desc: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 19, marginTop: 3 },
});

// Action rows (Plus member view)
const actions = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontFamily: FontFamily.medium },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 1 },
  divider: { height: 1, marginHorizontal: 16 },
});

const cta = StyleSheet.create({
  ghost: { alignItems: 'center', paddingVertical: 16 },
  ghostText: { fontSize: 14, fontFamily: FontFamily.medium },
  finePrint: { fontSize: 12, fontFamily: FontFamily.regular, textAlign: 'center' },
});

const introOfferBanner = StyleSheet.create({
  wrap: {
    marginHorizontal: 4,
    marginBottom: 18,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: WHITE },
  desc: { fontSize: 13, fontFamily: FontFamily.regular, color: WHITE_60, marginTop: 6, lineHeight: 18 },
});
