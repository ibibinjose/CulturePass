/**
 * CulturePass+ — membership hub (/membership)
 *
 * Three views:
 *  • Guest (not signed in): marketing pitch + sign-in CTA
 *  • Free member (signed in, no Plus): upgrade prompt + promo-code redemption
 *  • Plus member: status dashboard — plan card, benefits, quick actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useSafeBack } from '@/lib/navigation';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, gradients } from '@/design-system/tokens/theme';
import { membershipRepository } from '@/repositories/MembershipRepository';
import type { MembershipSummary } from '@/lib/api';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRenewalDate(iso: string | null): string {
  if (!iso) return 'No expiry set';
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysUntilRenewal(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

// ─── Plan status card (Plus member) ───────────────────────────────────────────

function PlanStatusCard({ membership }: { membership: MembershipSummary }) {
  const renewalDate = formatRenewalDate(membership.expiresAt ?? null);
  const daysLeft = daysUntilRenewal(membership.expiresAt ?? null);
  const cashbackPct = Math.round((membership.cashbackRate ?? 0) * 100);

  return (
    <View style={card.wrap}>
      <LinearGradient
        colors={[GOLD + '14', GOLD + '04', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <View style={card.topRow}>
        <View style={card.planNameRow}>
          <View style={card.iconBubble}>
            <Ionicons name="diamond" size={18} color={GOLD} />
          </View>
          <Text style={card.planName}>CulturePass+</Text>
        </View>
        <View style={card.activeBadge}>
          <View style={card.activeDot} />
          <Text style={card.activeText}>Active</Text>
        </View>
      </View>

      <View style={card.divider} />

      <View style={card.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={WHITE_40} />
        <Text style={card.metaText}>
          Renews {renewalDate}
          {daysLeft !== null && daysLeft <= 14
            ? <Text style={{ color: GOLD }}> · {daysLeft}d left</Text>
            : null}
        </Text>
      </View>

      <View style={card.statsRow}>
        <View style={card.stat}>
          <Text style={card.statValue}>{membership.eventsAttended ?? 0}</Text>
          <Text style={card.statLabel}>Events attended</Text>
        </View>
        <View style={card.statDivider} />
        <View style={card.stat}>
          <Text style={card.statValue}>{cashbackPct}%</Text>
          <Text style={card.statLabel}>Cashback rate</Text>
        </View>
        <View style={card.statDivider} />
        <View style={card.stat}>
          <Text style={card.statValue}>{membership.earlyAccessHours ?? 48}h</Text>
          <Text style={card.statLabel}>Early access</Text>
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 24, borderWidth: 1, borderColor: GOLD + '28',
    padding: 20, marginBottom: 28, overflow: 'hidden', gap: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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

// ─── Benefits list ─────────────────────────────────────────────────────────────

function BenefitsList({ isActive }: { isActive: boolean }) {
  return (
    <View style={bl.wrap}>
      <View style={bl.headingRow}>
        <View style={bl.headingDot} />
        <Text style={bl.heading}>{isActive ? 'YOUR ACTIVE BENEFITS' : 'WHAT YOU GET'}</Text>
      </View>
      <View style={bl.list}>
        {BENEFITS.map((b, i) => (
          <Animated.View key={b.title} entering={FadeInDown.delay(60 + i * 50).springify().damping(18)}>
            <View style={bl.row}>
              <LinearGradient
                colors={[b.color + '12', 'transparent']}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
              />
              <View style={[bl.icon, { backgroundColor: b.color + '22' }]}>
                <Ionicons name={b.icon} size={20} color={b.color} />
              </View>
              <View style={bl.text}>
                <Text style={bl.title}>{b.title}</Text>
                <Text style={bl.desc}>{b.desc}</Text>
              </View>
              {isActive
                ? <Ionicons name="checkmark-circle" size={18} color={CultureTokens.teal} />
                : <Ionicons name="lock-closed" size={13} color={WHITE_40} />}
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const bl = StyleSheet.create({
  wrap: { marginBottom: 28 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  headingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  heading: { fontSize: 11, fontFamily: FontFamily.bold, color: WHITE_40, letterSpacing: 1.8 },
  list: { gap: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: DARK_BORDER, overflow: 'hidden',
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1 },
  title: { fontSize: 14, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  desc: { fontSize: 11, fontFamily: FontFamily.regular, color: WHITE_60, marginTop: 1, lineHeight: 15 },
});

// ─── Promo code widget ─────────────────────────────────────────────────────────

function PromoCodeInput({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (c: string) => api.membership.redeemCode(c),
    onSuccess: (data) => {
      setError(null);
      setSuccessMsg(`CulturePass+ activated for ${data.durationDays} days!`);
      setCode('');
      setTimeout(onSuccess, 1400);
    },
    onError: (err: Error) => {
      setError(err.message ?? 'Invalid or expired code');
    },
  });

  const handleRedeem = () => {
    if (!code.trim()) return;
    setError(null);
    membershipHaptic();
    mutation.mutate(code.trim().toUpperCase());
  };

  return (
    <View style={promo.wrap}>
      <View style={promo.labelRow}>
        <Ionicons name="pricetag-outline" size={14} color={GOLD} />
        <Text style={promo.label}>HAVE A PROMO OR GIFT CODE?</Text>
      </View>
      <Text style={promo.sub}>Enter a code to activate CulturePass+ instantly</Text>

      <View style={promo.row}>
        <TextInput
          value={code}
          onChangeText={v => { setCode(v); setError(null); setSuccessMsg(null); }}
          placeholder="e.g. CULTURE30"
          placeholderTextColor={WHITE_40}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRedeem}
          style={[promo.input, { borderColor: error ? '#EF4444' : DARK_BORDER }]}
          editable={!mutation.isPending}
        />
        <Pressable
          onPress={handleRedeem}
          disabled={!code.trim() || mutation.isPending}
          style={({ pressed }) => [
            promo.btn,
            { opacity: !code.trim() || mutation.isPending ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          {mutation.isPending
            ? <ActivityIndicator size="small" color={WHITE} />
            : <Text style={promo.btnText}>Apply</Text>}
        </Pressable>
      </View>

      {error ? (
        <View style={promo.msgRow}>
          <Ionicons name="alert-circle" size={13} color="#EF4444" />
          <Text style={[promo.msgText, { color: '#EF4444' }]}>{error}</Text>
        </View>
      ) : null}
      {successMsg ? (
        <View style={promo.msgRow}>
          <Ionicons name="checkmark-circle" size={13} color={CultureTokens.teal} />
          <Text style={[promo.msgText, { color: CultureTokens.teal }]}>{successMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const promo = StyleSheet.create({
  wrap: {
    borderRadius: 16, borderWidth: 1, borderColor: GOLD + '30',
    backgroundColor: GOLD + '06',
    padding: 18, marginBottom: 24, gap: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontSize: 11, fontFamily: FontFamily.bold, color: GOLD, letterSpacing: 1.4 },
  sub: { fontSize: 13, fontFamily: FontFamily.regular, color: WHITE_60, lineHeight: 18, marginTop: -4 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontFamily: FontFamily.bold, fontSize: 14,
    color: WHITE, backgroundColor: WHITE_20, letterSpacing: 1.2,
  },
  btn: {
    height: 46, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontFamily: FontFamily.bold, fontSize: 14, color: WHITE },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msgText: { fontSize: 12, fontFamily: FontFamily.medium, flex: 1 },
});

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function MembershipHubScreen() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const { hPad } = useLayout();
  const handleBack = useSafeBack('/(tabs)/my-space');
  const { userId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: membership, isLoading } = useQuery({
    queryKey: ['membership', userId],
    queryFn: () => membershipRepository.getMembership(userId!),
    enabled: !!userId,
  });

  const { data: memberCountData } = useQuery({
    queryKey: ['membership-member-count'],
    queryFn: () => api.membership.memberCount(),
  });

  const isPlus = membership?.tier === 'plus' && membership?.status === 'active';
  const memberCount = memberCountData?.count ?? 0;

  const handleCodeSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['membership', userId] });
  }, [queryClient, userId]);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D0F1E', '#12162A', '#0A0C14']} style={StyleSheet.absoluteFill} />

      {/* Top glow — gold for Plus, violet for others */}
      <LinearGradient
        colors={[isPlus ? GOLD + '14' : CultureTokens.violet + '10', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { height: '45%' }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 12, paddingHorizontal: hPad }]}>
        <Pressable
          onPress={() => { membershipHaptic(); handleBack(); }}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={WHITE} />
        </Pressable>
        <Text style={s.headerTitle}>CulturePass+</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          {
            paddingHorizontal: hPad,
            paddingTop: 20,
            paddingBottom: safeInsets.bottom + 48,
          },
        ]}
      >

        {/* ── VIEW 1: Active Plus member ────────────────────────────── */}
        {isAuthenticated && isPlus && membership ? (
          <>
            {/* Plus hero strip */}
            <Animated.View entering={FadeInUp.springify().damping(16)} style={s.plusHero}>
              <View style={s.plusHeroLeft}>
                <View style={s.plusIconRing}>
                  <LinearGradient colors={[CultureTokens.teal + '30', CultureTokens.teal + '08']} style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} />
                  <Ionicons name="checkmark-circle" size={28} color={CultureTokens.teal} />
                </View>
                <View>
                  <Text style={s.plusGreeting}>Welcome back</Text>
                  <Text style={s.plusStatus}>CulturePass+ Active</Text>
                </View>
              </View>
              <View style={[s.plusActiveBadge, { borderColor: CultureTokens.teal + '40', backgroundColor: CultureTokens.teal + '15' }]}>
                <View style={[s.plusDot, { backgroundColor: CultureTokens.teal }]} />
                <Text style={[s.plusBadgeText, { color: CultureTokens.teal }]}>Live</Text>
              </View>
            </Animated.View>

            <PlanStatusCard membership={membership} />
            <BenefitsList isActive />

            <View style={s.actionGroup}>
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/perks'); }}
                style={({ pressed }) => [s.actionRow, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
              >
                <View style={[s.actionIcon, { backgroundColor: GOLD + '18' }]}>
                  <Ionicons name="gift-outline" size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.actionLabel}>Explore your perks</Text>
                  <Text style={s.actionSub}>Members-only deals from top venues</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={WHITE_40} />
              </Pressable>
              <View style={s.actionDivider} />
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
                style={({ pressed }) => [s.actionRow, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
              >
                <View style={[s.actionIcon, { backgroundColor: WHITE_20 }]}>
                  <Ionicons name="settings-outline" size={18} color={WHITE_60} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.actionLabel}>Manage subscription</Text>
                  <Text style={s.actionSub}>Billing, renewal, and cancellation</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={WHITE_40} />
              </Pressable>
            </View>
          </>

        ) : isAuthenticated && !isLoading ? (
          /* ── VIEW 2: Signed-in free member ──────────────────────── */
          <>
            {/* Free plan card */}
            <Animated.View entering={FadeInDown.delay(40)} style={s.freePlanCard}>
              <View style={s.freePlanRow}>
                <View style={s.freePlanIcon}>
                  <Ionicons name="person-circle-outline" size={22} color={WHITE_60} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.freePlanLabel}>YOUR PLAN</Text>
                  <Text style={s.freePlanName}>Free</Text>
                </View>
                <Pressable
                  onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
                  style={s.upgradeChip}
                >
                  <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
                  <Ionicons name="diamond" size={11} color={WHITE} />
                  <Text style={s.upgradeChipText}>Upgrade</Text>
                </Pressable>
              </View>
            </Animated.View>

            <BenefitsList isActive={false} />

            {/* Promo code first — people with codes want this */}
            <PromoCodeInput onSuccess={handleCodeSuccess} />

            {/* Primary CTA */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ marginBottom: 12 }}>
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
                style={({ pressed }) => [s.mainCta, { opacity: pressed ? 0.88 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="See plans and pricing"
              >
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <Ionicons name="diamond" size={19} color={WHITE} />
                <Text style={s.mainCtaText}>Upgrade to CulturePass+</Text>
              </Pressable>
            </Animated.View>
          </>

        ) : !isAuthenticated ? (
          /* ── VIEW 3: Guest (not signed in) ───────────────────────── */
          <>
            {/* Hero */}
            <Animated.View entering={FadeInUp.springify().damping(16)} style={s.heroWrap}>
              <View style={s.heroIconRing}>
                <LinearGradient
                  colors={[GOLD + '35', GOLD + '10']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 56 }]}
                />
                <Ionicons name="diamond" size={48} color={GOLD} />
              </View>
              <Text style={s.heroTitle}>Belong deeper.</Text>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>PREMIUM MEMBERSHIP</Text>
              </View>
              <Text style={s.heroSub}>
                Early tickets, cashback on events, members-only perks, and a verified Plus badge across the platform.
              </Text>
              {memberCount > 0 ? (
                <View style={s.heroCount}>
                  <Ionicons name="people" size={13} color={WHITE_40} />
                  <Text style={s.heroCountText}>{memberCount.toLocaleString()} members and counting</Text>
                </View>
              ) : null}
            </Animated.View>

            <BenefitsList isActive={false} />

            {/* CTAs */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 10, marginBottom: 8 }}>
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/(onboarding)/login'); }}
                style={({ pressed }) => [s.mainCta, { opacity: pressed ? 0.88 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Sign in to upgrade"
              >
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <Ionicons name="diamond" size={19} color={WHITE} />
                <Text style={s.mainCtaText}>Sign in to unlock</Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [s.ghostBtn, { opacity: pressed ? 0.75 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Explore as guest"
              >
                <Text style={s.ghostText}>Explore as guest</Text>
              </Pressable>
            </Animated.View>
          </>
        ) : null}

        <Text style={s.fine}>
          Secured by Stripe · Cancel anytime · CulturePass+ is a marketplace membership, not a government service.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', zIndex: 10, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: WHITE_20, borderWidth: 1, borderColor: DARK_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  scroll: { flexGrow: 1 },

  // Plus hero strip
  plusHero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20, paddingVertical: 4,
  },
  plusHeroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plusIconRing: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: CultureTokens.teal + '50', overflow: 'hidden',
  },
  plusGreeting: { fontSize: 12, fontFamily: FontFamily.regular, color: WHITE_40 },
  plusStatus: { fontSize: 16, fontFamily: FontFamily.bold, color: WHITE, marginTop: 1, letterSpacing: -0.3 },
  plusActiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999,
  },
  plusDot: { width: 7, height: 7, borderRadius: 4 },
  plusBadgeText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.2 },

  // Free plan card
  freePlanCard: {
    borderRadius: 18, borderWidth: 1, borderColor: DARK_BORDER,
    padding: 16, marginBottom: 24, overflow: 'hidden',
  },
  freePlanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  freePlanIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: WHITE_20, alignItems: 'center', justifyContent: 'center',
  },
  freePlanLabel: { fontSize: 10, fontFamily: FontFamily.bold, color: WHITE_40, letterSpacing: 1.2 },
  freePlanName: { fontSize: 18, fontFamily: FontFamily.bold, color: WHITE, marginTop: 1 },
  upgradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, overflow: 'hidden',
  },
  upgradeChipText: { fontSize: 12, fontFamily: FontFamily.bold, color: WHITE },

  // Guest hero
  heroWrap: { alignItems: 'center', marginBottom: 32, paddingTop: 4 },
  heroIconRing: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GOLD_DIM,
    overflow: 'hidden', marginBottom: 22,
  },
  heroTitle: { fontSize: 38, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -1.4, textAlign: 'center' },
  heroBadge: {
    backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '40',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 10,
  },
  heroBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: GOLD, letterSpacing: 1.2 },
  heroSub: {
    fontSize: 15, fontFamily: FontFamily.regular, color: WHITE_60,
    textAlign: 'center', lineHeight: 23, marginTop: 14, paddingHorizontal: 8,
  },
  heroCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
  },
  heroCountText: { fontSize: 12, fontFamily: FontFamily.regular, color: WHITE_40 },

  // Shared CTA
  mainCta: {
    height: 56, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, overflow: 'hidden',
  },
  mainCtaText: { fontSize: 17, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostText: { fontSize: 14, fontFamily: FontFamily.medium, color: WHITE_40 },

  // Action rows (Plus)
  actionGroup: {
    borderRadius: 18, borderWidth: 1, borderColor: DARK_BORDER,
    overflow: 'hidden', marginBottom: 28,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontFamily: FontFamily.medium, color: WHITE },
  actionSub: { fontSize: 11, fontFamily: FontFamily.regular, color: WHITE_40, marginTop: 1 },
  actionDivider: { height: 1, backgroundColor: DARK_BORDER, marginHorizontal: 16 },

  fine: {
    fontSize: 11, fontFamily: FontFamily.regular,
    color: WHITE_40, textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, marginTop: 4,
  },
});
