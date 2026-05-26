/**
 * /hostspace/apply — Host account application.
 *
 * Flow:
 *   1. Host-type selector (5 cards) — skipped only when a SINGLE initialType is passed
 *   2. Profile verification card (read-only, pulls from user profile) + host-specific details
 *   3. Success / under-review confirmation
 *
 * On submit → POST /api/host-applications
 * On approve → user role upgraded to 'organizer', hostspace unlocked
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { api } from '@/lib/api';
import { log } from '@/lib/logger';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import {
  CultureTokens,
  FontFamily,
  Radius,
  Spacing,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { HOST_TYPE_OPTIONS, type HostType } from '@/shared/schema';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const APPLY_CANONICAL = `${SITE_ORIGIN}/hostspace/apply`;
const APPLY_SEO_DESC =
  'Apply to become a CulturePass host — list cultural events, sell tickets, reach diaspora audiences, and sell on CultureMarket.';
const APPLY_SEO_TITLE = `Become a host · ${APP_NAME}`;

// ─── Types ─────────────────────────────────────────────────────────────────

type Step = 'type' | 'details' | 'success';

/** Only host-specific fields not already on the user's profile. */
type HostFormState = {
  hostType: HostType | null;
};

type FormErrors = Partial<Record<keyof HostFormState, string>>;

function readableProfileName(user?: { displayName?: string | null; username?: string | null; email?: string | null }) {
  const name =
    user?.displayName?.trim()
    || user?.username?.trim()
    || user?.email?.split('@')[0]?.trim()
    || 'CulturePass Member';

  return name.length >= 2 ? name : 'CulturePass Member';
}

const TYPE_ACCENT: Record<HostType, string> = {
  creator:   CultureTokens.coral,
  business:  CultureTokens.violet,
  organizer: CultureTokens.teal,
  venue:     CultureTokens.gold,
  community: CultureTokens.teal,
};

// ─── Validation ────────────────────────────────────────────────────────────

function validateForm(f: HostFormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.hostType) errors.hostType = 'Please select your primary host type.';
  return errors;
}

// ─── Sub-components ────────────────────────────────────────────────────────

/** Read-only profile row — shows a field from the user's existing profile. */
function ProfileField({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={[fs.profileField, { borderBottomColor: colors.borderLight }]}>
      <Ionicons name={icon} size={16} color={CultureTokens.teal} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[fs.profileFieldLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[fs.profileFieldValue, { color: colors.text }]} numberOfLines={3}>{value}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

function ApplyScreenInner() {
  const params = useLocalSearchParams<{ initialTypes?: string; intent?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const { user, hasRole } = useAuth();

  const isNationBuilderIntent = params.intent === 'nation-builder';

  // Only skip the type picker when a SINGLE initialType is provided
  const initialTypes = useMemo(() => {
    if (!params.initialTypes) return [];
    return params.initialTypes.split(',').filter(Boolean) as HostType[];
  }, [params.initialTypes]);

  const singleType = initialTypes.length === 1 ? initialTypes[0] ?? null : null;

  const [step, setStep] = useState<Step>(singleType ? 'details' : 'type');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // For Nation Builder intent, default to business/venue as the primary recommended types
  const defaultNationBuilderType = isNationBuilderIntent ? 'business' : singleType;

  const [form, setForm] = useState<HostFormState>({
    hostType: defaultNationBuilderType,
  });

  const setField = useCallback(<K extends keyof HostFormState>(k: K, v: HostFormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSubmitError(null);
    setErrors((prev) => { if (!prev[k]) return prev; const n = { ...prev }; delete n[k]; return n; });
  }, []);

  // Already a host — go straight to HostSpace
  useEffect(() => {
    if (hasRole('organizer')) router.replace('/hostspace' as any);
  }, [hasRole]);

  // Check if user already applied
  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ['my-host-application'],
    queryFn: () => api.hostApplications.myApplication(),
    staleTime: 60_000,
    enabled: !hasRole('organizer'),
  });

  useEffect(() => {
    if (existing?.application) {
      if (existing.application.status === 'approved') router.replace('/hostspace' as any);
      else setStep('success');
    }
  }, [existing]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const profileBio = user?.bio?.trim();
      const typeLabel = HOST_TYPE_OPTIONS
        .find((option) => option.id === form.hostType)
        ?.label.toLowerCase() ?? 'host';
      const profileName = readableProfileName(user ?? undefined);
      const description = profileBio && profileBio.length >= 20
        ? profileBio
        : `${profileName} is applying as a ${typeLabel} on CulturePass.`;

      return api.hostApplications.submit({
        hostType:         form.hostType!,
        // Verified from profile — pass through, not re-collected from form
        fullName:         profileName,
        businessName:     undefined,
        description,
        city:             user?.city?.trim()         || undefined,
        country:          user?.country              || 'AU',
        websiteUrl:       user?.socialLinks?.website ?? user?.website ?? undefined,
        instagramHandle:  user?.socialLinks?.instagram?.replace('@', '') ?? undefined,
        motivation:       undefined,
      });
    },
    onSuccess: () => {
      log.action('host_application.submitted', {
        hostType: form.hostType,
      });
      setHasSubmitted(true);
      setStep('success');
    },
    onError: (err: any) => {
      if (err?.code === 409 || err?.message?.includes('already_applied')) {
        setHasSubmitted(true);
        setStep('success');
      } else {
        setHasSubmitted(false);
        setSubmitError('Submission failed. Please check your connection and try again.');
        Alert.alert('Submission failed', 'Please check your connection and try again.');
      }
    },
  });

  const handleSubmit = useCallback(() => {
    if (submitMutation.isPending || hasSubmitted) return;
    setSubmitError(null);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) { Alert.alert('Please review your form', firstError); return; }
    submitMutation.mutate();
  }, [form, submitMutation, hasSubmitted]);

  if (existingLoading) {
    return (
      <View style={[fs.root, { backgroundColor: '#0F0B1A', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={CultureTokens.violet} />
      </View>
    );
  }

  const pageCol = {
    width: '100%' as const,
    maxWidth: isDesktop ? 680 : undefined,
    alignSelf: isDesktop ? ('center' as const) : ('stretch' as const),
  };

  const selectedTypeOpt = form.hostType ? HOST_TYPE_OPTIONS.find((o) => o.id === form.hostType) : null;
  const accent = form.hostType ? (TYPE_ACCENT[form.hostType] ?? CultureTokens.violet) : CultureTokens.violet;

  // ── Shared header ──────────────────────────────────────────────────────────

  const headerTitle =
    step === 'type'    ? 'Become a Host'
    : step === 'details' ? 'Verify & apply'
    : 'Application submitted';

  const darkHeader = step === 'type' || step === 'success';

  const Header = (
    <View style={[
      fs.header,
      { paddingTop: topInset + Spacing.sm, paddingHorizontal: hPad },
      darkHeader ? { backgroundColor: '#0F0B1A' } : { backgroundColor: colors.surface, borderBottomColor: colors.borderLight, borderBottomWidth: StyleSheet.hairlineWidth },
    ]}>
      <Pressable
        onPress={() => {
          if (step === 'details') { setStep('type'); return; }
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)' as any);
        }}
        style={fs.backBtn}
      >
        <Ionicons name="chevron-back" size={24} color={darkHeader ? '#fff' : colors.text} />
      </Pressable>
      <View style={{ alignItems: 'center' }}>
        {step === 'details' && form.hostType && (
          <View style={[fs.typePill, { backgroundColor: accent + '1A' }]}>
            <Ionicons name={selectedTypeOpt?.icon as any ?? 'grid-outline'} size={13} color={accent} />
            <Text style={[fs.typePillText, { color: accent }]}>{selectedTypeOpt?.label ?? ''}</Text>
          </View>
        )}
        <Text style={[fs.headerTitle, { color: darkHeader ? '#fff' : colors.text }]}>{headerTitle}</Text>
        <Text style={[fs.headerSub, { color: darkHeader ? 'rgba(255,255,255,0.4)' : colors.textTertiary }]}>
          CulturePass · Host Program
        </Text>
      </View>
      <View style={{ width: 44 }} />
    </View>
  );

  // ── Step: Success ─────────────────────────────────────────────────────────

  if (step === 'success') {
    const app = existing?.application;
    const isRejected = app?.status === 'rejected';
    return (
      <View style={[fs.root, { backgroundColor: '#0F0B1A' }]}>
        <Head>
          <title>{`Host application · ${APP_NAME}`}</title>
          <meta name="description" content="Your CulturePass host program application — review status and next steps." />
          <link rel="canonical" href={APPLY_CANONICAL} />
        </Head>
        <Stack.Screen options={{ headerShown: false }} />
        {Header}
        <ScrollView
          contentContainerStyle={[fs.successContent, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={pageCol}>
            <Animated.View entering={FadeInUp.delay(60).springify()} style={fs.successIconWrap}>
              <LinearGradient
                colors={isRejected ? ['#EF444444', '#EF444422'] : [CultureTokens.teal + '44', CultureTokens.teal + '22']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Ionicons
                name={isRejected ? 'close-circle' : 'checkmark-circle'}
                size={56}
                color={isRejected ? '#EF4444' : CultureTokens.teal}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <Text style={fs.successTitle}>
                {isRejected ? 'Application not approved' : app?.status === 'approved' ? 'Welcome, Host!' : 'Application submitted!'}
              </Text>
              <Text style={fs.successSub}>
                {isRejected
                  ? app?.reviewNote
                    ? `Our team left a note: ${app.reviewNote}`
                    : 'Your application was not approved at this time. You can re-apply after 30 days.'
                  : app?.status === 'approved'
                    ? 'Your host account is active. You can now create events, listings, communities, and more in HostSpace. Some profile types (venues, ABN businesses, professionals) may require an additional quick verification before publishing.'
                    : isNationBuilderIntent
                    ? "Thank you for applying to become a Nation Builder Partner. Our team will review your business/venue. Once approved, we'll generate a unique staff promo code (50% off CulturePass+) that you can share with your team, plus Nation Builder badges for your staff."
                    : "Our team will review your application and get back to you within 24 hours. We'll notify you by email when your host account is ready. Some profiles require extra verification after creation."}
              </Text>
            </Animated.View>

            {!isRejected && (
              <Animated.View entering={FadeInDown.delay(200).springify()} style={fs.timeline}>
                {[
                  { icon: 'checkmark-circle' as const, color: CultureTokens.teal, label: 'Application received', done: true },
                  { icon: 'search' as const, color: CultureTokens.gold, label: 'Team review (up to 24 hrs)', done: app?.status === 'approved' },
                  { icon: 'rocket-outline' as const, color: CultureTokens.violet, label: 'Host account activated', done: app?.status === 'approved' },
                ].map((t, i) => (
                  <View key={t.label} style={fs.timelineRow}>
                    <View style={[fs.timelineDot, { backgroundColor: t.done ? t.color : t.color + '33', borderColor: t.color }]}>
                      <Ionicons name={t.icon} size={16} color={t.done ? '#fff' : t.color} />
                    </View>
                    {i < 2 && <View style={[fs.timelineLine, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />}
                    <Text style={[fs.timelineLabel, { color: t.done ? '#fff' : 'rgba(255,255,255,0.55)' }]}>
                      {t.label}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).springify()} style={fs.successActions}>
              {app?.status === 'approved' && (
                <Pressable
                  onPress={() => router.replace('/hostspace' as any)}
                  style={({ pressed }) => [
                    fs.successBtn,
                    { opacity: pressed ? 0.9 : 1, backgroundColor: CultureTokens.teal },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name="rocket-outline" size={18} color="#fff" />
                  <Text style={fs.successBtnText}>Enter HostSpace — Create Listings & Events</Text>
                </Pressable>
              )}
              {isNationBuilderIntent && app?.status !== 'approved' && (
                <Pressable
                  onPress={() => router.push('/hostspace/create?intent=nation-builder' as any)}
                  style={({ pressed }) => [
                    fs.successBtn,
                    { opacity: pressed ? 0.9 : 1, backgroundColor: CultureTokens.gold },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name="briefcase-outline" size={18} color="#1C1917" />
                  <Text style={[fs.successBtnText, { color: '#1C1917' }]}>Start Creating Your Partner Listing</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.replace('/(tabs)' as any)}
                style={({ pressed }) => [fs.successBtn, { opacity: pressed ? 0.9 : 1, backgroundColor: CultureTokens.indigo }]}
                accessibilityRole="button"
              >
                <Ionicons name="home-outline" size={18} color="#fff" />
                <Text style={fs.successBtnText}>Back to Discover</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Step 1: Host-type selector ────────────────────────────────────────────

  if (step === 'type') {
    return (
      <View style={[fs.root, { backgroundColor: '#0F0B1A' }]}>
        <Head>
          <title>{APPLY_SEO_TITLE}</title>
          <meta name="description" content={APPLY_SEO_DESC} />
          <meta property="og:title" content={APPLY_SEO_TITLE} />
          <meta property="og:description" content={APPLY_SEO_DESC} />
          <meta property="og:url" content={APPLY_CANONICAL} />
          <meta name="twitter:card" content="summary_large_image" />
          <link rel="canonical" href={APPLY_CANONICAL} />
        </Head>
        <Stack.Screen options={{ headerShown: false }} />
        {Header}
        <ScrollView
          contentContainerStyle={[fs.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={pageCol}>
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              {isNationBuilderIntent && (
                <View style={[fs.nbHero, { backgroundColor: CultureTokens.gold + '15', borderColor: CultureTokens.gold + '40' }]}>
                  <View style={fs.nbBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={CultureTokens.gold} />
                    <Text style={[fs.nbBadgeText, { color: CultureTokens.gold }]}>NATION BUILDER PARTNER</Text>
                  </View>
                  <Text style={[fs.nbHeroTitle, { color: '#fff' }]}>
                    Partner with CulturePass
                  </Text>
                  <Text style={fs.nbHeroSub}>
                    Register your business or venue as a Nation Builder Partner. Your team gets 50% off CulturePass+ and special badges. Powerful retention + visibility tool.
                  </Text>
                </View>
              )}

              <Text style={fs.stepHeading}>
                {isNationBuilderIntent ? 'Choose your business type' : 'What best\n describes you?'}
              </Text>
              <Text style={fs.stepSub}>
                {isNationBuilderIntent 
                  ? 'Select Business/Brand or Venue Owner to become a Nation Builder Partner and unlock staff perks.'
                  : 'Choose your primary host role. You can create communities, events, businesses, venues, and listings after approval.'}
              </Text>
            </Animated.View>

            {HOST_TYPE_OPTIONS.map((opt, i) => {
              const ac = TYPE_ACCENT[opt.id];
              const active = form.hostType === opt.id;
              return (
                <Animated.View key={opt.id} entering={FadeInDown.delay(100 + i * 70).springify()}>
                  <Pressable
                    onPress={() => setField('hostType', opt.id)}
                    style={({ pressed }) => [
                      fs.typeCard,
                      active && { borderColor: ac, borderWidth: 2 },
                      { opacity: pressed ? 0.88 : 1 },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    {active && (
                      <LinearGradient
                        colors={[ac + '28', ac + '08']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <View style={[fs.typeCardIcon, { backgroundColor: ac + (active ? '33' : '1A') }]}>
                      <Ionicons name={opt.icon as any} size={24} color={ac} />
                      {isNationBuilderIntent && (opt.id === 'business' || opt.id === 'venue') && (
                        <View style={fs.nbRecommendBadge}>
                          <Text style={fs.nbRecommendText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[fs.typeCardLabel, { color: active ? '#fff' : 'rgba(255,255,255,0.9)' }]}>
                        {opt.label}
                      </Text>
                      <Text style={fs.typeCardDesc}>{opt.desc}</Text>
                    </View>
                    <View style={[fs.typeCardCheck, {
                      borderColor: active ? ac : 'rgba(255,255,255,0.2)',
                      backgroundColor: active ? ac : 'transparent',
                    }]}>
                      {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            <Animated.View entering={FadeInDown.delay(480).springify()}>
              <Pressable
                onPress={() => {
                  if (!form.hostType) {
                    Alert.alert('Select your primary role', 'Please choose what best describes you.');
                    return;
                  }
                  setStep('details');
                }}
                style={({ pressed }) => [
                  fs.nextBtn,
                  { opacity: !form.hostType || pressed ? 0.7 : 1, backgroundColor: CultureTokens.indigo },
                ]}
                accessibilityRole="button"
              >
                <Text style={fs.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Step 2: Profile verification + host-specific details ──────────────────

  const hasAvatar = !!user?.avatarUrl;
  const initials = (user?.displayName ?? user?.username ?? 'U')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const socialWebsite  = user?.socialLinks?.website  ?? user?.website;
  const socialInstagram= user?.socialLinks?.instagram?.replace('@', '');
  const socialTiktok   = user?.socialLinks?.tiktok;
  const socialYoutube  = user?.socialLinks?.youtube;
  const socialLinkedin = user?.socialLinks?.linkedin;
  const socialFacebook = user?.socialLinks?.facebook;

  const hasSocials = !!(socialWebsite || socialInstagram || socialTiktok || socialYoutube || socialLinkedin || socialFacebook);

  return (
    <KeyboardAvoidingView
      style={[fs.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Head>
        <title>{`Host application · ${APP_NAME}`}</title>
        <meta name="description" content={APPLY_SEO_DESC} />
        <link rel="canonical" href={APPLY_CANONICAL} />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      {Header}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[fs.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 120 }]}
      >
        <View style={pageCol}>

          {/* ── Profile verification card ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <View style={[fs.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>

              {/* Card header */}
              <View style={fs.profileCardHeader}>
                <View style={[fs.verifiedBadge, { backgroundColor: CultureTokens.teal + '18' }]}>
                  <Ionicons name="shield-checkmark" size={13} color={CultureTokens.teal} />
                  <Text style={[fs.verifiedBadgeText, { color: CultureTokens.teal }]}>
                    Verified from your CulturePass profile
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/settings/profile' as any)}
                  accessibilityRole="link"
                  accessibilityLabel="Edit your profile"
                >
                  <Text style={[fs.editLink, { color: CultureTokens.violet }]}>Edit profile</Text>
                </Pressable>
              </View>

              {/* Avatar + identity */}
              <View style={fs.profileIdentityRow}>
                {hasAvatar ? (
                  <Image
                    source={{ uri: user!.avatarUrl }}
                    style={fs.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[CultureTokens.violet, CultureTokens.coral]}
                    style={fs.avatar}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={fs.avatarInitials}>{initials}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[fs.profileName, { color: colors.text }]}>
                    {user?.displayName ?? user?.username ?? 'Your name'}
                  </Text>
                  {user?.handle ? (
                    <Text style={[fs.profileHandle, { color: colors.textTertiary }]}>
                      +{user.handle}
                    </Text>
                  ) : null}
                  {user?.email ? (
                    <Text style={[fs.profileEmail, { color: colors.textTertiary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Profile fields */}
              {user?.city ? (
                <ProfileField icon="location-outline" label="City" value={user.city} />
              ) : null}
              {user?.bio ? (
                <ProfileField icon="person-outline" label="Bio" value={user.bio} />
              ) : null}

              {/* Social links already on file */}
              {hasSocials && (
                <View style={[fs.socialsRow, { borderTopColor: colors.borderLight }]}>
                  <Ionicons name="link-outline" size={14} color={colors.textTertiary} />
                  <Text style={[fs.socialsLabel, { color: colors.textTertiary }]}>Social links on file:</Text>
                  {socialWebsite   && <SocialChip label="Website"   color={CultureTokens.indigo} />}
                  {socialInstagram && <SocialChip label="Instagram" color={CultureTokens.coral} />}
                  {socialTiktok    && <SocialChip label="TikTok"    color={colors.text} />}
                  {socialYoutube   && <SocialChip label="YouTube"   color="#FF0000" />}
                  {socialLinkedin  && <SocialChip label="LinkedIn"  color="#0A66C2" />}
                  {socialFacebook  && <SocialChip label="Facebook"  color="#1877F2" />}
                </View>
              )}

              {/* Missing info nudge */}
              {(!user?.bio || !user?.city || !hasSocials) && (
                <Pressable
                  onPress={() => router.push('/settings/profile' as any)}
                  style={[fs.missingNudge, { backgroundColor: CultureTokens.gold + '14', borderColor: CultureTokens.gold + '40' }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="information-circle-outline" size={16} color={CultureTokens.gold} />
                  <Text style={[fs.missingNudgeText, { color: CultureTokens.gold }]}>
                    {[!user?.bio && 'bio', !user?.city && 'city', !hasSocials && 'social links']
                      .filter(Boolean)
                      .join(', ')} missing from your profile.{' '}
                    <Text style={{ fontFamily: FontFamily.semibold }}>Add them to strengthen your application.</Text>
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {submitError ? (
            <View style={[fs.submitError, { backgroundColor: CultureTokens.coral + '14', borderColor: CultureTokens.coral + '40' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={CultureTokens.coral} />
              <Text style={[fs.submitErrorText, { color: CultureTokens.coral }]}>{submitError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Submit bar */}
      <View style={[fs.submitBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <View style={[{ paddingHorizontal: hPad }, pageCol]}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitMutation.isPending || hasSubmitted}
            style={({ pressed }) => [fs.submitBtn, { opacity: submitMutation.isPending || hasSubmitted || pressed ? 0.8 : 1 }]}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={SignatureGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {submitMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={fs.submitBtnText}>Submit application</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SocialChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[fs.socialChip, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[fs.socialChipText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const fs = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 17, textAlign: 'center' },
  headerSub: { fontFamily: FontFamily.regular, fontSize: 11, marginTop: 2 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
    alignSelf: 'center', marginBottom: 4,
  },
  typePillText: { fontFamily: FontFamily.semibold, fontSize: 11 },

  content: { paddingTop: Spacing.lg },
  successContent: { paddingTop: Spacing.xl, alignItems: 'center' },

  // Profile card
  profileCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  verifiedBadgeText: { fontFamily: FontFamily.semibold, fontSize: 12 },
  editLink: { fontFamily: FontFamily.semibold, fontSize: 13 },

  profileIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarInitials: {
    fontFamily: FontFamily.bold, fontSize: 20, color: '#fff',
  },
  profileName: { fontFamily: FontFamily.bold, fontSize: 16 },
  profileHandle: { fontFamily: FontFamily.medium, fontSize: 13 },
  profileEmail: { fontFamily: FontFamily.regular, fontSize: 12 },

  profileField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileFieldLabel: { fontFamily: FontFamily.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  profileFieldValue: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },

  socialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  socialsLabel: { fontFamily: FontFamily.medium, fontSize: 12 },
  socialChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm, borderWidth: 1,
  },
  socialChipText: { fontFamily: FontFamily.semibold, fontSize: 11 },

  missingNudge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: 12, padding: 12, borderRadius: Radius.md, borderWidth: 1,
  },
  missingNudgeText: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, flex: 1 },

  submitError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  submitErrorText: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, flex: 1 },

  // Submit
  submitBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingTop: 12,
  },
  submitBtn: {
    height: 52, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, overflow: 'hidden',
  },
  submitBtnText: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#fff' },

  // Type picker (step 1)
  stepHeading: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 36 : 28,
    letterSpacing: -0.5, color: '#fff',
    lineHeight: Platform.OS === 'web' ? 44 : 36,
    marginBottom: 10,
  },
  stepSub: {
    fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 23,
    color: 'rgba(255,255,255,0.6)', marginBottom: 28,
  },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10, overflow: 'hidden',
  },
  typeCardIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeCardLabel: { fontFamily: FontFamily.bold, fontSize: 15, marginBottom: 3 },
  typeCardDesc: {
    fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
  },
  typeCardCheck: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nextBtn: {
    height: 52, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, overflow: 'hidden', marginTop: 20,
  },
  nextBtnText: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#fff' },

  // Success
  successIconWrap: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 24, alignSelf: 'center',
  },
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 30 : 26,
    color: '#fff', letterSpacing: -0.4,
    textAlign: 'center', marginBottom: 12,
  },
  successSub: {
    fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 24,
    color: 'rgba(255,255,255,0.65)', textAlign: 'center',
    marginBottom: 32, maxWidth: 420,
  },
  timeline: { alignSelf: 'stretch', marginBottom: 32 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  timelineDot: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, zIndex: 1,
  },
  timelineLine: { position: 'absolute', left: 17, top: 42, width: 2, height: 20 },
  timelineLabel: { fontFamily: FontFamily.semibold, fontSize: 14, flex: 1 },
  successActions: { gap: 12, alignSelf: 'stretch' },
  successBtn: {
    height: 52, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, overflow: 'hidden',
  },
  successBtnText: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#fff' },

  // Nation Builder Intent special styles
  nbHero: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  nbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 200, 50, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  nbBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nbHeroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    marginBottom: 6,
  },
  nbHeroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.75)',
  },
  nbRecommendBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: CultureTokens.gold,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  nbRecommendText: {
    fontSize: 8,
    fontFamily: FontFamily.bold,
    color: '#1C1917',
    letterSpacing: 0.5,
  },
});

export default function ApplyScreen() {
  return (
    <ErrorBoundary>
      <ApplyScreenInner />
    </ErrorBoundary>
  );
}
