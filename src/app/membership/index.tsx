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
import { useColors } from '@/hooks/useColors';
import { LuxeButton, LuxeCard, LuxeText } from '@/design-system/ui';
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
  const colors = useColors();
  const renewalDate = formatRenewalDate(membership.expiresAt ?? null);
  const daysLeft = daysUntilRenewal(membership.expiresAt ?? null);
  const cashbackPct = Math.round((membership.cashbackRate ?? 0) * 100);

  return (
    <LuxeCard variant="glass" tone="auto" style={[card.wrap, { borderColor: colors.gold + '28' }]}>
      <View style={card.topRow}>
        <View style={card.planNameRow}>
          <View style={[card.iconBubble, { backgroundColor: colors.gold + '18' }]}>
            <Ionicons name="diamond" size={18} color={colors.gold} />
          </View>
          <LuxeText variant="title3" style={[card.planName, { color: colors.text }]}>CulturePass+</LuxeText>
        </View>
        <View style={[card.activeBadge, { borderColor: CultureTokens.teal + '40', backgroundColor: CultureTokens.teal + '20' }]}>
          <View style={card.activeDot} />
          <LuxeText variant="badge" style={card.activeText}>Active</LuxeText>
        </View>
      </View>

      <View style={[card.divider, { backgroundColor: colors.borderLight }]} />

      <View style={card.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
        <LuxeText variant="caption" style={[card.metaText, { color: colors.textSecondary }]}>
          Renews {renewalDate}
          {daysLeft !== null && daysLeft <= 14
            ? <LuxeText style={{ color: colors.gold }}> · {daysLeft}d left</LuxeText>
            : null}
        </LuxeText>
      </View>

      <View style={[card.statsRow, { backgroundColor: colors.surfaceVariant }]}>
        <View style={card.stat}>
          <LuxeText variant="title" style={[card.statValue, { color: colors.text }]}>{membership.eventsAttended ?? 0}</LuxeText>
          <LuxeText variant="caption" style={[card.statLabel, { color: colors.textTertiary }]}>Events attended</LuxeText>
        </View>
        <View style={[card.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={card.stat}>
          <LuxeText variant="title" style={[card.statValue, { color: colors.text }]}>{cashbackPct}%</LuxeText>
          <LuxeText variant="caption" style={[card.statLabel, { color: colors.textTertiary }]}>Cashback rate</LuxeText>
        </View>
        <View style={[card.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={card.stat}>
          <LuxeText variant="title" style={[card.statValue, { color: colors.text }]}>{membership.earlyAccessHours ?? 48}h</LuxeText>
          <LuxeText variant="caption" style={[card.statLabel, { color: colors.textTertiary }]}>Early access</LuxeText>
        </View>
      </View>
    </LuxeCard>
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
  const colors = useColors();
  return (
    <View style={bl.wrap}>
      <View style={bl.headingRow}>
        <View style={[bl.headingDot, { backgroundColor: colors.gold }]} />
        <LuxeText variant="badge" style={[bl.heading, { color: colors.textTertiary }]}>{isActive ? 'YOUR ACTIVE BENEFITS' : 'WHAT YOU GET'}</LuxeText>
      </View>
      <View style={bl.list}>
        {BENEFITS.map((b, i) => (
          <Animated.View key={b.title} entering={FadeInDown.delay(60 + i * 50).springify().damping(18)}>
            <LuxeCard variant="glass" tone="auto" size="sm" style={bl.row}>
              <View style={[bl.icon, { backgroundColor: b.color + '22' }]}>
                <Ionicons name={b.icon} size={20} color={b.color} />
              </View>
              <View style={bl.text}>
                <LuxeText variant="bodyMedium" style={[bl.title, { color: colors.text }]}>{b.title}</LuxeText>
                <LuxeText variant="caption" style={[bl.desc, { color: colors.textSecondary }]}>{b.desc}</LuxeText>
              </View>
              {isActive
                ? <Ionicons name="checkmark-circle" size={18} color={CultureTokens.teal} />
                : <Ionicons name="lock-closed" size={13} color={colors.textTertiary} />}
            </LuxeCard>
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
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1 },
  title: { fontSize: 14, fontFamily: FontFamily.bold, color: WHITE, letterSpacing: -0.2 },
  desc: { fontSize: 11, fontFamily: FontFamily.regular, color: WHITE_60, marginTop: 1, lineHeight: 15 },
});

// ─── Promo code widget ─────────────────────────────────────────────────────────

function PromoCodeInput({ onSuccess }: { onSuccess: () => void }) {
  const colors = useColors();
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
    <LuxeCard variant="glass" tone="auto" size="sm" style={[promo.wrap, { borderColor: colors.gold + '30', backgroundColor: colors.gold + '06' }]}>
      <View style={promo.labelRow}>
        <Ionicons name="pricetag-outline" size={14} color={colors.gold} />
        <LuxeText variant="badge" style={[promo.label, { color: colors.gold }]}>HAVE A PROMO OR GIFT CODE?</LuxeText>
      </View>
      <LuxeText variant="body" style={[promo.sub, { color: colors.textSecondary }]}>Enter a code to activate CulturePass+ instantly</LuxeText>

      <View style={promo.row}>
        <TextInput
          value={code}
          onChangeText={v => { setCode(v); setError(null); setSuccessMsg(null); }}
          placeholder="e.g. CULTURE30"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRedeem}
          style={[promo.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: error ? '#EF4444' : colors.borderLight }]}
          editable={!mutation.isPending}
        />
        <LuxeButton
          variant="filled"
          tone="auto"
          size="sm"
          onPress={handleRedeem}
          disabled={!code.trim() || mutation.isPending}
          loading={mutation.isPending}
        >
          Apply
        </LuxeButton>
      </View>

      {error ? (
        <View style={promo.msgRow}>
          <Ionicons name="alert-circle" size={13} color="#EF4444" />
          <LuxeText variant="caption" style={[promo.msgText, { color: '#EF4444' }]}>{error}</LuxeText>
        </View>
      ) : null}
      {successMsg ? (
        <View style={promo.msgRow}>
          <Ionicons name="checkmark-circle" size={13} color={CultureTokens.teal} />
          <LuxeText variant="caption" style={[promo.msgText, { color: CultureTokens.teal }]}>{successMsg}</LuxeText>
        </View>
      ) : null}
    </LuxeCard>
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
  const colors = useColors();

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
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Top glow — gold for Plus, primary for others */}
      <LinearGradient
        colors={[isPlus ? `${colors.gold}14` : `${colors.primary}08`, 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { height: '45%' }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 12, paddingHorizontal: hPad }]}>
        <Pressable
          onPress={() => { membershipHaptic(); handleBack(); }}
          style={({ pressed }) => [s.backBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <LuxeText variant="title3" style={[s.headerTitle, { color: colors.text }]}>CulturePass+</LuxeText>
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
                <View style={[s.plusIconRing, { borderColor: CultureTokens.teal + '50' }]}>
                  <LinearGradient colors={[CultureTokens.teal + '30', CultureTokens.teal + '08']} style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} />
                  <Ionicons name="checkmark-circle" size={28} color={CultureTokens.teal} />
                </View>
                <View>
                  <LuxeText variant="caption" style={[s.plusGreeting, { color: colors.textTertiary }]}>Welcome back</LuxeText>
                  <LuxeText variant="bodyMedium" style={[s.plusStatus, { color: colors.text }]}>CulturePass+ Active</LuxeText>
                </View>
              </View>
              <View style={[s.plusActiveBadge, { borderColor: CultureTokens.teal + '40', backgroundColor: CultureTokens.teal + '15' }]}>
                <View style={[s.plusDot, { backgroundColor: CultureTokens.teal }]} />
                <LuxeText variant="badge" style={[s.plusBadgeText, { color: CultureTokens.teal }]}>Live</LuxeText>
              </View>
            </Animated.View>

            <PlanStatusCard membership={membership} />
            <BenefitsList isActive />

            <LuxeCard variant="glass" tone="auto" size="sm" style={{ padding: 0, marginBottom: 28 }}>
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/perks'); }}
                style={({ pressed }) => [s.actionRow, { backgroundColor: pressed ? colors.primarySoft : 'transparent' }]}
                accessibilityRole="button"
              >
                <View style={[s.actionIcon, { backgroundColor: colors.gold + '18' }]}>
                  <Ionicons name="gift-outline" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={{ color: colors.text }}>Explore your perks</LuxeText>
                  <LuxeText variant="caption" style={{ color: colors.textSecondary }}>Members-only deals from top venues</LuxeText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
              <View style={[s.actionDivider, { backgroundColor: colors.borderLight }]} />
              <Pressable
                onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
                style={({ pressed }) => [s.actionRow, { backgroundColor: pressed ? colors.primarySoft : 'transparent' }]}
                accessibilityRole="button"
              >
                <View style={[s.actionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="settings-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={{ color: colors.text }}>Manage subscription</LuxeText>
                  <LuxeText variant="caption" style={{ color: colors.textSecondary }}>Billing, renewal, and cancellation</LuxeText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            </LuxeCard>
          </>

        ) : isAuthenticated && !isLoading ? (
          /* ── VIEW 2: Signed-in free member ──────────────────────── */
          <>
            {/* Free plan card */}
            <Animated.View entering={FadeInDown.delay(40)}>
              <LuxeCard variant="glass" tone="auto" size="sm" style={s.freePlanCard}>
                <View style={s.freePlanRow}>
                  <View style={[s.freePlanIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LuxeText variant="badge" style={{ color: colors.textTertiary }}>YOUR PLAN</LuxeText>
                    <LuxeText variant="title3" style={{ color: colors.text, marginTop: 1 }}>Free</LuxeText>
                  </View>
                  <LuxeButton
                    variant="filled"
                    tone="auto"
                    size="sm"
                    leftIcon="diamond"
                    onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
                  >
                    Upgrade
                  </LuxeButton>
                </View>
              </LuxeCard>
            </Animated.View>

            <BenefitsList isActive={false} />

            {/* Promo code first — people with codes want this */}
            <PromoCodeInput onSuccess={handleCodeSuccess} />

            {/* Primary CTA */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ marginBottom: 12 }}>
              <LuxeButton
                variant="filled"
                tone="auto"
                leftIcon="diamond"
                fullWidth
                onPress={() => { membershipHaptic(); router.push('/membership/upgrade'); }}
              >
                Upgrade to CulturePass+
              </LuxeButton>
            </Animated.View>
          </>

        ) : !isAuthenticated ? (
          /* ── VIEW 3: Guest (not signed in) ───────────────────────── */
          <>
            {/* Hero */}
            <Animated.View entering={FadeInUp.springify().damping(16)} style={s.heroWrap}>
              <View style={[s.heroIconRing, { borderColor: colors.gold + '50' }]}>
                <LinearGradient
                  colors={[colors.gold + '35', colors.gold + '10']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 56 }]}
                />
                <Ionicons name="diamond" size={48} color={colors.gold} />
              </View>
              <LuxeText variant="display" style={[s.heroTitle, { color: colors.text }]}>Belong deeper.</LuxeText>
              <View style={[s.heroBadge, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '40' }]}>
                <LuxeText variant="badge" style={[s.heroBadgeText, { color: colors.gold }]}>PREMIUM MEMBERSHIP</LuxeText>
              </View>
              <LuxeText variant="body" style={[s.heroSub, { color: colors.textSecondary }]}>
                Early tickets, cashback on events, members-only perks, and a verified Plus badge across the platform.
              </LuxeText>
              {memberCount > 0 ? (
                <View style={s.heroCount}>
                  <Ionicons name="people" size={13} color={colors.textTertiary} />
                  <LuxeText variant="caption" style={[s.heroCountText, { color: colors.textTertiary }]}>{memberCount.toLocaleString()} members and counting</LuxeText>
                </View>
              ) : null}
            </Animated.View>

            <BenefitsList isActive={false} />

            {/* CTAs */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 10, marginBottom: 8 }}>
              <LuxeButton
                variant="filled"
                tone="auto"
                leftIcon="diamond"
                fullWidth
                onPress={() => { membershipHaptic(); router.push('/(onboarding)/login'); }}
              >
                Sign in to unlock
              </LuxeButton>

              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [s.ghostBtn, { opacity: pressed ? 0.75 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Explore as guest"
              >
                <LuxeText variant="bodyMedium" style={[s.ghostText, { color: colors.textSecondary }]}>Explore as guest</LuxeText>
              </Pressable>
            </Animated.View>
          </>
        ) : null}

        <LuxeText variant="caption" style={[s.fine, { color: colors.textTertiary }]}>
          Secured by Stripe · Cancel anytime · CulturePass+ is a marketplace membership, not a government service.
        </LuxeText>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', zIndex: 10, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
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
    borderWidth: 1.5, overflow: 'hidden',
  },
  plusGreeting: { fontSize: 12, fontFamily: FontFamily.regular },
  plusStatus: { fontSize: 16, fontFamily: FontFamily.bold, marginTop: 1, letterSpacing: -0.3 },
  plusActiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999,
  },
  plusDot: { width: 7, height: 7, borderRadius: 4 },
  plusBadgeText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.2 },
 
  // Free plan card
  freePlanCard: {
    marginBottom: 24,
  },
  freePlanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  freePlanIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  freePlanLabel: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  freePlanName: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: 1 },
  upgradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, overflow: 'hidden',
  },
  upgradeChipText: { fontSize: 12, fontFamily: FontFamily.bold },
 
  // Guest hero
  heroWrap: { alignItems: 'center', marginBottom: 32, paddingTop: 4 },
  heroIconRing: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 22,
  },
  heroTitle: { fontSize: 38, fontFamily: FontFamily.bold, letterSpacing: -1.4, textAlign: 'center' },
  heroBadge: {
    borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 10,
  },
  heroBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  heroSub: {
    fontSize: 15, fontFamily: FontFamily.regular,
    textAlign: 'center', lineHeight: 23, marginTop: 14, paddingHorizontal: 8,
  },
  heroCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
  },
  heroCountText: { fontSize: 12, fontFamily: FontFamily.regular },
 
  // Shared CTA
  mainCta: {
    height: 56, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, overflow: 'hidden',
  },
  mainCtaText: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostText: { fontSize: 14, fontFamily: FontFamily.medium },
 
  // Action rows (Plus)
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontFamily: FontFamily.medium },
  actionSub: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 1 },
  actionDivider: { height: 1, marginHorizontal: 16 },
 
  fine: {
    fontSize: 11, fontFamily: FontFamily.regular,
    textAlign: 'center', lineHeight: 16,
    paddingHorizontal: 8, marginTop: 4,
  },
});
