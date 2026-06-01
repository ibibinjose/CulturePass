/**
 * CulturePass+ — upgrade & member management
 *
 * Non-Plus: hero → intro offer → pricing toggle → promo code → CTA
 * Plus: rich member dashboard → plan card → benefits → quick actions
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router, usePathname } from 'expo-router';
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
import {
  BENEFITS,
  DARK_BG,
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
  return (
    <View style={[sk.root, { paddingTop: topInset + 16 }]}>
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
  root: { flex: 1, backgroundColor: DARK_BG },
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
  const renewalLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No expiry set';
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;
  const cashbackPct = Math.round(cashbackRate * 100);

  return (
    <View style={planCard.wrap}>
      <LinearGradient
        colors={[GOLD + '16', GOLD + '05', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />

      {/* Plan name row */}
      <View style={planCard.topRow}>
        <View style={planCard.nameRow}>
          <View style={planCard.iconBubble}>
            <Ionicons name="diamond" size={18} color={GOLD} />
          </View>
          <Text style={planCard.planName}>CulturePass+</Text>
        </View>
        <View style={planCard.activeBadge}>
          <View style={planCard.activeDot} />
          <Text style={planCard.activeText}>Active</Text>
        </View>
      </View>

      <View style={planCard.divider} />

      {/* Renewal */}
      <View style={planCard.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={WHITE_40} />
        <Text style={planCard.metaText}>
          Renews {renewalLabel}
          {daysLeft !== null && daysLeft <= 14
            ? <Text style={{ color: GOLD }}> · {daysLeft}d left</Text>
            : null}
        </Text>
      </View>

      {/* Stats */}
      <View style={planCard.statsRow}>
        <View style={planCard.stat}>
          <Text style={planCard.statValue}>{eventsAttended}</Text>
          <Text style={planCard.statLabel}>Events attended</Text>
        </View>
        <View style={planCard.statDivider} />
        <View style={planCard.stat}>
          <Text style={planCard.statValue}>{cashbackPct}%</Text>
          <Text style={planCard.statLabel}>Cashback rate</Text>
        </View>
        <View style={planCard.statDivider} />
        <View style={planCard.stat}>
          <Text style={planCard.statValue}>{earlyAccessHours}h</Text>
          <Text style={planCard.statLabel}>Early access</Text>
        </View>
      </View>
    </View>
  );
}

const planCard = StyleSheet.create({
  wrap: {
    borderRadius: 24, borderWidth: 1, borderColor: GOLD + '28',
    padding: 20, marginBottom: 28, overflow: 'hidden', gap: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBubble: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: GOLD + '20', alignItems: 'center', justifyContent: 'center',
  },
  planName: { fontSize: 18, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.4 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CultureTokens.teal + '20', borderWidth: 1,
    borderColor: CultureTokens.teal + '40',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CultureTokens.teal },
  activeText: { fontSize: 12, fontFamily: FontFamily.bold, color: CultureTokens.teal, letterSpacing: 0.2 },
  divider: { height: 1, backgroundColor: DARK_BORDER },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { fontSize: 13, fontFamily: FontFamily.regular, color: WHITE_40 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE_20, borderRadius: 14, padding: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 20, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.6 },
  statLabel: { fontSize: 11, fontFamily: FontFamily.regular, color: WHITE_40, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: DARK_BORDER },
});

// ─── Promo code widget ─────────────────────────────────────────────────────────

function PromoCodeWidget({ userId, onFreeActivation }: { userId: string | null; onFreeActivation: () => void }) {
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
    <View style={pc.outer}>
      <Pressable
        onPress={() => { membershipHaptic(); setExpanded(v => !v); }}
        style={pc.toggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse promo code' : 'Enter promo or gift code'}
      >
        <View style={pc.toggleLeft}>
          <View style={pc.toggleIcon}>
            <Ionicons name="pricetag-outline" size={17} color={GOLD} />
          </View>
          <Text style={pc.toggleLabel}>Have a promo or gift code?</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={WHITE_40}
        />
      </Pressable>

      {expanded && (
        <View style={pc.body}>
          <View style={pc.inputRow}>
            <TextInput
              value={code}
              onChangeText={v => { setCode(v); setError(null); setSuccessMsg(null); }}
              placeholder="e.g. CULTURE30"
              placeholderTextColor={WHITE_40}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleRedeem}
              editable={!mutation.isPending}
              style={[pc.input, error ? pc.inputError : null]}
              accessibilityLabel="Promo or gift code"
            />
            <Pressable
              onPress={handleRedeem}
              disabled={!code.trim() || mutation.isPending || !userId}
              style={({ pressed }) => [
                pc.redeemBtn,
                { opacity: !code.trim() || mutation.isPending || !userId ? 0.5 : pressed ? 0.82 : 1 },
              ]}
              accessibilityRole="button"
            >
              {mutation.isPending
                ? <ActivityIndicator size="small" color={WHITE} />
                : <Text style={pc.redeemText}>Apply</Text>}
            </Pressable>
          </View>

          {error ? (
            <View style={pc.msgRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={[pc.msgText, pc.msgError]}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={pc.msgRow}>
              <Ionicons name="checkmark-circle" size={14} color={CultureTokens.teal} />
              <Text style={[pc.msgText, pc.msgSuccess]}>{successMsg}</Text>
            </View>
          ) : null}

          <Text style={pc.hint}>
            Gift codes activate Plus instantly.{' '}
            Stripe discount codes can be entered after clicking &quot;Unlock CulturePass+&quot;.
          </Text>
        </View>
      )}
    </View>
  );
}

const pc = StyleSheet.create({
  outer: {
    borderRadius: 16, borderWidth: 1, borderColor: DARK_BORDER,
    overflow: 'hidden', marginBottom: 14,
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
  toggleLabel: { fontSize: 14, fontFamily: FontFamily.medium, color: WHITE_60 },
  body: { borderTopWidth: 1, borderTopColor: DARK_BORDER, padding: 16, gap: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    borderColor: DARK_BORDER, paddingHorizontal: 14,
    fontFamily: FontFamily.bold, fontSize: 14, color: WHITE,
    backgroundColor: WHITE_20, letterSpacing: 1.2,
  },
  inputError: { borderColor: '#EF4444' },
  redeemBtn: {
    height: 46, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  redeemText: { fontFamily: FontFamily.bold, fontSize: 14, color: WHITE },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  msgText: { fontSize: 12, fontFamily: FontFamily.medium, flex: 1, lineHeight: 17 },
  msgError: { color: '#EF4444' },
  msgSuccess: { color: CultureTokens.teal },
  hint: { fontSize: 11, fontFamily: FontFamily.regular, color: WHITE_40, lineHeight: 16 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const pathname   = usePathname();
  const handleBack = useSafeBack('/(tabs)/my-space');
  const { hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [40, 120], [0, 1], Extrapolate.CLAMP),
    backgroundColor: `rgba(8,11,20,${interpolate(scrollY.value, [40, 120], [0, 0.94], Extrapolate.CLAMP)})`,
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
      <Animated.View style={[StyleSheet.absoluteFill, hdr.blurBg, headerAnim]} pointerEvents="none" />
      <View style={hdr.row}>
        <Pressable
          onPress={() => { membershipHaptic(); handleBack(); }}
          style={({ pressed }) => [hdr.backBtn, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={WHITE} />
        </Pressable>
        <Animated.Text style={[hdr.title, headerTitleAnim]}>
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
      <View style={page.root}>
        <LinearGradient colors={['#0D0F1E', '#141828', '#0A0C14']} style={StyleSheet.absoluteFill} />
        {floatingHeader}
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          <Animated.View entering={FadeInUp.springify().damping(18)} style={hero.wrap}>
            <View style={hero.iconRing}>
              <LinearGradient colors={[GOLD + '30', GOLD + '08']} style={[StyleSheet.absoluteFill, { borderRadius: 56 }]} />
              <Ionicons name="star" size={52} color={GOLD} />
            </View>
            <Text style={hero.title}>CulturePass+</Text>
            <View style={hero.badge}>
              <Text style={hero.badgeText}>PREMIUM MEMBERSHIP</Text>
            </View>
            <Text style={hero.desc}>
              Unlock exclusive benefits, earn cashback, and get early access to the experiences that matter most.
            </Text>
          </Animated.View>

          <View style={page.benefitsGrid}>
            {BENEFITS.slice(0, 4).map((b, i) => (
              <Animated.View key={b.title} entering={FadeInDown.delay(200 + i * 80)} style={bCard.wrap}>
                <LinearGradient colors={[b.color + '18', b.color + '06']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                <View style={[bCard.icon, { backgroundColor: b.color + '20' }]}>
                  <Ionicons name={b.icon} size={22} color={b.color} />
                </View>
                <Text style={bCard.title}>{b.title}</Text>
                <Text style={bCard.desc}>{b.desc}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={page.ctaArea}>
            <Pressable
              onPress={() => { membershipHaptic(); router.push(routeWithRedirect('/(onboarding)/login', pathname)); }}
              style={({ pressed }) => [cta.btn, { opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
            >
              <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
              <Ionicons name="star" size={20} color={WHITE} />
              <Text style={cta.text}>Sign in to unlock</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} style={cta.ghost}>
              <Text style={cta.ghostText}>Explore as guest</Text>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }

  // ── Plus member — dedicated member dashboard ───────────────────────────────
  if (isPlus && membership) {
    return (
      <View style={page.root}>
        <LinearGradient colors={['#0D0F1E', '#12162A', '#0A0C14']} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[GOLD + '12', 'transparent']}
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
            <Text style={hero.title}>CulturePass+</Text>
            <View style={[hero.badge, { backgroundColor: CultureTokens.teal + '20', borderColor: CultureTokens.teal + '50' }]}>
              <Text style={[hero.badgeText, { color: CultureTokens.teal }]}>✓  ACTIVE MEMBER</Text>
            </View>
            <Text style={hero.desc}>
              You&apos;re enjoying all CulturePass+ benefits. Thank you for being part of the inner circle.
            </Text>
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
            <Text style={page.sectionTitle}>YOUR ACTIVE BENEFITS</Text>
            <View style={{ gap: 10 }}>
              {BENEFITS.map((b, i) => (
                <Animated.View key={b.title} entering={FadeInDown.delay(250 + i * 55)}>
                  <View style={bRow.wrap}>
                    <LinearGradient colors={[b.color + '10', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                    <View style={[bRow.icon, { backgroundColor: b.color + '20' }]}>
                      <Ionicons name={b.icon} size={24} color={b.color} />
                    </View>
                    <View style={bRow.text}>
                      <Text style={bRow.title}>{b.title}</Text>
                      <Text style={bRow.desc}>{b.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={CultureTokens.teal} />
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(420)} style={actions.group}>
            <Pressable
              onPress={() => { membershipHaptic(); router.push('/perks'); }}
              style={({ pressed }) => [actions.row, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityRole="button"
            >
              <View style={[actions.icon, { backgroundColor: GOLD + '18' }]}>
                <Ionicons name="gift-outline" size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={actions.label}>Explore your perks</Text>
                <Text style={actions.sub}>Members-only deals from top venues</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={WHITE_40} />
            </Pressable>

            <View style={actions.divider} />

            <Pressable
              onPress={() => { membershipHaptic(); router.push('/membership'); }}
              style={({ pressed }) => [actions.row, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityRole="button"
            >
              <View style={[actions.icon, { backgroundColor: WHITE_20 }]}>
                <Ionicons name="card-outline" size={18} color={WHITE_60} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={actions.label}>Membership hub</Text>
                <Text style={actions.sub}>View your full membership details</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={WHITE_40} />
            </Pressable>

            <View style={actions.divider} />

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
              style={({ pressed }) => [actions.row, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityRole="button"
            >
              <View style={[actions.icon, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[actions.label, { color: '#EF4444' }]}>Cancel subscription</Text>
                <Text style={actions.sub}>You keep access until your paid period ends</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={WHITE_40} />
            </Pressable>
          </Animated.View>

          <Text style={page.fine}>
            Secured by Stripe · Cancel anytime · CulturePass+ is a marketplace membership, not a government service.
          </Text>
        </Animated.ScrollView>
      </View>
    );
  }

  // ── Non-Plus authenticated — upgrade flow ──────────────────────────────────
  return (
    <View style={page.root}>
      <LinearGradient colors={['#0D0F1E', '#12162A', '#0A0C14']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[GOLD + '12', 'transparent']}
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
          <View style={hero.iconRing}>
            <LinearGradient colors={[GOLD + '35', GOLD + '10']} style={[StyleSheet.absoluteFill, { borderRadius: 56 }]} />
            <Ionicons name="diamond" size={52} color={GOLD} />
          </View>
          <Text style={hero.title}>CulturePass+</Text>
          <View style={hero.badge}>
            <Text style={hero.badgeText}>PREMIUM MEMBERSHIP</Text>
          </View>
          <Text style={hero.desc}>
            {memberCount > 0
              ? `Join ${memberCount.toLocaleString()} cultural explorers already on Plus.`
              : 'Unlock exclusive benefits, earn cashback, and get early access to the best cultural experiences.'}
          </Text>
        </Animated.View>

        {/* Intro offer banner */}
        {introOffer?.eligible ? (
          <Animated.View entering={FadeInDown.delay(60)} style={introOfferBanner.wrap}>
            <LinearGradient colors={[GOLD + '18', GOLD + '05']} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
            <View style={introOfferBanner.row}>
              <Ionicons name="pricetag" size={24} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={introOfferBanner.title}>{introOffer.headline}</Text>
                <Text style={introOfferBanner.desc}>{introOffer.detail}</Text>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Pricing toggle */}
        <Animated.View entering={FadeInDown.delay(150)} style={pricing.wrap}>
          <View style={pricing.toggle}>
            {(['monthly', 'yearly'] as const).map(period => (
              <Pressable
                key={period}
                style={[pricing.tab, billingPeriod === period && pricing.tabActive]}
                onPress={() => { membershipHaptic(); setBillingPeriod(period); }}
              >
                {period === 'yearly' && (
                  <View style={pricing.savePill}>
                    <Text style={pricing.savePillText}>SAVE 28%</Text>
                  </View>
                )}
                <Text style={[pricing.tabText, billingPeriod === period && pricing.tabTextActive]}>
                  {period === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={pricing.card}>
            <LinearGradient colors={[GOLD + '14', GOLD + '04']} style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
            <Text style={pricing.amount}>{price}</Text>
            <Text style={pricing.period}>
              {billingPeriod === 'yearly' ? 'PER YEAR' : 'PER MONTH'}
            </Text>
            {billingPeriod === 'yearly' ? (
              <Text style={pricing.equiv}>{"That's"} just {perMonth} per month</Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Benefits list */}
        <Animated.View entering={FadeInDown.delay(250)} style={page.section}>
          <Text style={page.sectionTitle}>WHAT YOU GET</Text>
          <View style={{ gap: 10 }}>
            {BENEFITS.map((b, i) => (
              <Animated.View key={b.title} entering={FadeInDown.delay(300 + i * 60)}>
                <View style={bRow.wrap}>
                  <LinearGradient colors={[b.color + '10', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                  <View style={[bRow.icon, { backgroundColor: b.color + '20' }]}>
                    <Ionicons name={b.icon} size={24} color={b.color} />
                  </View>
                  <View style={bRow.text}>
                    <Text style={bRow.title}>{b.title}</Text>
                    <Text style={bRow.desc}>{b.desc}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={15} color={WHITE_40} />
                </View>
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
          <Pressable
            onPress={() => { membershipHaptic(); executeSubscribe(); }}
            disabled={loading}
            style={({ pressed }) => [cta.btn, { opacity: loading || pressed ? 0.82 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Unlock CulturePass+ now"
          >
            <LinearGradient
              colors={gradients.culturepassBrand}
              start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
            />
            {loading ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Ionicons name="diamond" size={20} color={WHITE} />
                <Text style={cta.text}>Unlock CulturePass+</Text>
              </>
            )}
          </Pressable>
          <Text style={cta.finePrint}>
            Secured by Stripe · Cancel anytime · No hidden fees
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11, fontFamily: FontFamily.bold,
    color: WHITE_40, letterSpacing: 2,
    marginBottom: 14, textAlign: 'center',
  },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  ctaArea: { marginBottom: 16, gap: 10 },
  fine: {
    fontSize: 11, fontFamily: FontFamily.regular,
    color: WHITE_40, textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, marginTop: 8,
  },
});

const hdr = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  blurBg: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DARK_BORDER },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 56,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: WHITE_20, borderWidth: 1, borderColor: DARK_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
});

const hero = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 36, paddingTop: 12 },
  iconRing: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GOLD_DIM,
    marginBottom: 28, overflow: 'hidden',
  },
  title: { fontSize: 40, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -1.5, textAlign: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GOLD_DIM, borderWidth: 1, borderColor: GOLD + '50',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999, marginTop: 12,
  },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: GOLD, letterSpacing: 1.2 },
  desc: {
    fontSize: 15, fontFamily: FontFamily.regular, color: WHITE_60,
    textAlign: 'center', lineHeight: 23, marginTop: 18, paddingHorizontal: 8,
  },
});

const pricing = StyleSheet.create({
  wrap: { marginBottom: 36 },
  toggle: {
    flexDirection: 'row', backgroundColor: WHITE_20,
    borderRadius: 32, padding: 5, marginBottom: 20,
    borderWidth: 1, borderColor: DARK_BORDER,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 28, justifyContent: 'center' },
  tabActive: { backgroundColor: WHITE },
  tabText: { fontSize: 15, fontFamily: FontFamily.bold, color: WHITE_60 },
  tabTextActive: { color: DARK_BG },
  savePill: {
    position: 'absolute', top: -10, right: 8,
    backgroundColor: CultureTokens.teal,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  savePillText: { fontSize: 9, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: 0.5 },
  card: {
    alignItems: 'center', padding: 36,
    borderRadius: 28, borderWidth: 1, borderColor: GOLD + '25', overflow: 'hidden',
  },
  amount: { fontSize: 68, fontFamily: FontFamily.bold, color: GOLD, letterSpacing: -3, lineHeight: 72 },
  period: { fontSize: 13, fontFamily: FontFamily.bold, color: WHITE_40, letterSpacing: 2, marginTop: -4 },
  equiv: { fontSize: 14, fontFamily: FontFamily.medium, color: WHITE_60, marginTop: 14 },
});

// Benefit card (2-column grid — unauthenticated view)
const bCard = StyleSheet.create({
  wrap: {
    flex: 1, minWidth: '46%', padding: 18,
    borderRadius: 20, borderWidth: 1, borderColor: DARK_BORDER,
    overflow: 'hidden', gap: 8,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  desc: { fontSize: 12, fontFamily: FontFamily.regular, color: WHITE_60, lineHeight: 17 },
});

// Benefit row (full-width list)
const bRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, gap: 16, borderRadius: 20,
    borderWidth: 1, borderColor: DARK_BORDER, overflow: 'hidden',
  },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1 },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  desc: { fontSize: 13, fontFamily: FontFamily.regular, color: WHITE_60, lineHeight: 19, marginTop: 3 },
});

// Action rows (Plus member view)
const actions = StyleSheet.create({
  group: {
    borderRadius: 20, borderWidth: 1, borderColor: DARK_BORDER,
    overflow: 'hidden', marginBottom: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontFamily: FontFamily.medium, color: WHITE },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, color: WHITE_40, marginTop: 1 },
  divider: { height: 1, backgroundColor: DARK_BORDER, marginHorizontal: 16 },
});

const cta = StyleSheet.create({
  btn: {
    height: 60, borderRadius: 32, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden',
  },
  text: { fontSize: 18, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  ghost: { alignItems: 'center', paddingVertical: 16 },
  ghostText: { fontSize: 14, fontFamily: FontFamily.medium, color: WHITE_40 },
  finePrint: { fontSize: 12, fontFamily: FontFamily.regular, color: WHITE_40, textAlign: 'center' },
});

const introOfferBanner = StyleSheet.create({
  wrap: {
    marginHorizontal: 4, marginBottom: 18,
    padding: 16, borderRadius: 18, borderWidth: 1,
    borderColor: GOLD + '35', overflow: 'hidden',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: WHITE },
  desc: { fontSize: 13, fontFamily: FontFamily.regular, color: WHITE_60, marginTop: 6, lineHeight: 18 },
});
