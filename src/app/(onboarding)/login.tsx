import React, { Fragment } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { KeyboardAwareScrollViewCompat } from '@/modules/core/components';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useReducedMotion,
} from 'react-native-reanimated';

import { useLogin } from '@/hooks/useLogin';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import {
  M3Button,
  M3Card,
  M3TopAppBar,
  LuxeButton,
  LuxeCard,
  LuxeText,
  Input,
  Checkbox,
  SocialButton,
} from '@/design-system/ui';
import { CulturePassWordmark } from '@/design-system/ui';

import {
  CardTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  IconSize,
  LiquidGlassTokens,
  M3Typography,
  Spacing,
  TextStyles,
  Luxe,
  LuxeTextStyles,
  luxeDark,
} from '@/design-system/tokens/theme';

import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { AuthAmbientBackground } from '@/components/onboarding/AuthScreenPrimitives';
import Head from 'expo-router/head';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const LOGIN_SEO_TITLE = `Sign in · ${APP_NAME}`;
const LOGIN_SEO_DESC =
  'Sign in to CulturePass to discover cultural events, communities, tickets, member perks, and diaspora-friendly listings.';
const LOGIN_CANONICAL = `${SITE_ORIGIN}/login`;

export default function LoginScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, isWeb } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(
    searchParams.redirectTo ?? searchParams.redirect,
  );

  const {
    email,
    setEmail,
    password,
    setPassword,
    emailError,
    passwordError,
    globalError,
    loading,
    rememberMe,
    setRememberMe,
    isValid,
    clearErrors,
    handleGoogleSignIn,
    handleAppleSignIn,
    handleLogin,
    handleBiometricLogin,
    biometricAvailable,
    biometricEnabled,
    biometricType,
  } = useLogin(redirectTo);

  const enterUp = reducedMotion
    ? undefined
    : FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  const enter = (delay: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(delay)
          .springify()
          .damping(LiquidGlassTokens.entranceSpring.damping)
          .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  const padBottom = isWeb ? 40 : 64 + insets.bottom;

  const formContent = (
    <View style={s.cardInner}>
      {/* Brand — single appearance, inside the card */}
      <Animated.View entering={enter(30)} style={s.brandBlock}>
        <CulturePassWordmark size="md" showSuffix={false} />
      </Animated.View>

      {/* Copy */}
      <Animated.View entering={enter(70)} style={s.copyBlock}>
        <LuxeText variant="display" style={[s.title, { color: luxeDark.text }]}>Welcome back</LuxeText>
        <LuxeText variant="body" style={[s.subtitle, { color: luxeDark.textSecondary }]}>
          Sign in to your cultural home.
        </LuxeText>
      </Animated.View>

      {/* Global error */}
      {globalError ? (
        <Animated.View
          entering={enter(90)}
          style={[
            s.errorBanner,
            {
              backgroundColor: m3Colors.errorContainer,
              borderColor: m3Colors.error,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle" size={IconSize.md} color={m3Colors.onErrorContainer} />
          <Text style={[s.errorText, M3Typography.bodySmall, { color: m3Colors.onErrorContainer }]}>{globalError}</Text>
        </Animated.View>
      ) : null}

      {/* Social — full-width, top of form */}
      <Animated.View entering={enter(110)} style={s.socialStack}>
        <SocialButton
          provider="google"
          onPress={handleGoogleSignIn}
          disabled={loading}
          compact
          accessibilityLabel="Continue with Google"
        />
        {Platform.OS === 'ios' || Platform.OS === 'web' ? (
          <SocialButton
            provider="apple"
            onPress={handleAppleSignIn}
            disabled={loading}
            compact
            accessibilityLabel="Continue with Apple"
          />
        ) : (
          <SocialButton
            provider="apple"
            comingSoon
            disabled={loading}
            compact
            accessibilityLabel="Continue with Apple"
          />
        )}
      </Animated.View>

      {/* Divider */}
      <Animated.View entering={enter(150)} style={s.divider}>
        <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
        <Text style={[s.divText, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>OR CONTINUE WITH EMAIL</Text>
        <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
      </Animated.View>

      {/* Form fields */}
      <Animated.View entering={enter(180)} style={s.form}>
        <Input
          label="Email Address"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          value={email}
          onChangeText={(v: string) => { setEmail(v); clearErrors(); }}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          keyboardType="email-address"
          returnKeyType="next"
          error={emailError}
          onBlur={() => setEmail((prev: string) => prev.trim().toLowerCase())}
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={(v: string) => { setPassword(v); clearErrors(); }}
          passwordToggle
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          error={passwordError}
        />

        {/* Options: remember me + forgot */}
        <View style={s.optionsRow}>
          <Checkbox
            checked={rememberMe}
            onToggle={setRememberMe}
            label={
              <Text style={[s.rememberLabel, { color: colors.text }]}>Keep me signed in</Text>
            }
          />
          <Pressable
            hitSlop={12}
            style={s.forgotLink}
            onPress={() =>
              router.push(routeWithRedirect('/(onboarding)/forgot-password', redirectTo) as string)
            }
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
          >
            <Text style={s.forgotText}>Forgot?</Text>
          </Pressable>
        </View>

        <LuxeButton
          variant="filled"
          fullWidth
          haptic
          rightIcon="arrow-forward"
          loading={loading}
          disabled={!isValid || loading}
          onPress={handleLogin}
          style={{ marginTop: 12 }}
        >
          Sign In
        </LuxeButton>
      </Animated.View>

      {/* Biometric sign-in */}
      {Platform.OS !== 'web' && biometricAvailable && biometricEnabled ? (
        <Animated.View entering={enter(260)} style={s.biometricRow}>
          <LuxeButton
            variant="tonal"
            onPress={handleBiometricLogin}
            disabled={loading}
            leftIcon={biometricType === 'faceid' ? 'scan-outline' : 'finger-print-outline'}
            fullWidth
          >
            {biometricType === 'faceid' ? 'Sign in with Face ID' : 'Sign in with Touch ID'}
          </LuxeButton>
        </Animated.View>
      ) : null}

      {/* Switch to sign up */}
      <Animated.View entering={enter(300)}>
        <Pressable
          style={s.switchRow}
          onPress={() =>
            router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)
          }
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="Sign up for an account"
        >
          <Text style={[s.switchText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
            Don&apos;t have an account?{' '}
            <Text style={{ color: m3Colors.primary, fontWeight: '700' }}>Sign Up</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  return (
    <Fragment>
      <Head>
        <title>{LOGIN_SEO_TITLE}</title>
        <meta name="description" content={LOGIN_SEO_DESC} />
        <meta property="og:title" content={LOGIN_SEO_TITLE} />
        <meta property="og:description" content={LOGIN_SEO_DESC} />
        <meta property="og:url" content={LOGIN_CANONICAL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={LOGIN_SEO_TITLE} />
        <meta name="twitter:description" content={LOGIN_SEO_DESC} />
        <link rel="canonical" href={LOGIN_CANONICAL} />
      </Head>
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      <M3TopAppBar
        title="Login"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        variant="medium"
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <KeyboardAwareScrollViewCompat
        style={s.keyboardAvoid}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: padBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isWeb && isDesktop ? (
          <View style={s.webRow}>
            {/* Marketing column */}
            <View style={[s.webLeft, { backgroundColor: luxeDark.accentContainer }]}>
              <Animated.View entering={enter(40)} style={s.webKickerRow}>
                <View style={[s.webDot, { backgroundColor: luxeDark.primary }]} />
                <LuxeText variant="badgeCaps" style={s.webKickerText}>CULTUREPASS</LuxeText>
              </Animated.View>

              <Animated.View entering={enter(70)}>
                <LuxeText variant="displayHero" style={s.webHeadlineText}>Connecting cultures, building belonging.</LuxeText>
              </Animated.View>

              <Animated.View entering={enter(100)}>
                <LuxeText variant="hero" style={s.webLeadText}>
                  A premium cultural lifestyle marketplace built for diaspora cities.
                </LuxeText>
              </Animated.View>

              <Animated.View entering={enter(130)} style={s.webValueGrid}>
                {[
                  { icon: 'calendar-outline' as const, title: 'Events', desc: 'Discover what’s on this week.' },
                  { icon: 'people-outline' as const, title: 'Communities', desc: 'Join and share with your people.' },
                  { icon: 'gift-outline' as const, title: 'Perks', desc: 'Member-only rewards & offers.' },
                ].map((item) => (
                  <LuxeCard
                    key={item.title}
                    variant="glass"
                    style={s.webValueCard}
                  >
                    <View style={s.webValueStripe} />
                    <View style={[s.webValueIcon, { backgroundColor: luxeDark.surfaceElevated }]}>
                      <Ionicons name={item.icon} size={18} color={luxeDark.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <LuxeText variant="title3" style={s.webValueTitle}>{item.title}</LuxeText>
                      <LuxeText variant="caption" style={s.webValueDesc}>{item.desc}</LuxeText>
                    </View>
                  </LuxeCard>
                ))}
              </Animated.View>
            </View>

            {/* Form card */}
            <Animated.View entering={enterUp} style={s.cardWrap}>
              <LuxeCard variant="default" style={{ padding: 32 }}>
                {formContent}
              </LuxeCard>
            </Animated.View>
          </View>
        ) : (
          <Animated.View entering={enterUp} style={s.cardWrap}>
            <LuxeCard variant="default" style={{ padding: 24 }}>
              {formContent}
            </LuxeCard>
          </Animated.View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
    </Fragment>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 12,
  },
  scrollContentDesktop: {
    paddingVertical: 64,
    paddingHorizontal: 32,
  },

  cardWrap: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  cardInner: { width: '100%' },

  /* Brand */
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  /* Copy */
  copyBlock: { alignItems: 'center', marginBottom: Spacing.md },
  title: {
    ...TextStyles.display,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 21,
    color: undefined,
  },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  errorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  /* Social */
  socialStack: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    flexShrink: 0,
  },

  /* Form */
  form: { gap: 14, marginBottom: 4 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 2,
  },
  rememberLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.body2 },
  forgotLink: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: Spacing.sm,
    flexShrink: 0,
  },
  forgotText: {
    color: CultureTokens.indigo,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body2,
    textDecorationLine: 'underline',
  },
  submitBtn: { height: 52, borderRadius: CardTokens.radius, marginTop: 4 },

  /* Biometric */
  biometricRow: { marginTop: Spacing.md },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  biometricLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },

  /* Switch */
  switchRow: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout, textAlign: 'center' },
  switchLink: { color: CultureTokens.indigo, fontFamily: FontFamily.bold },

  /* Desktop two-column */
  webRow: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
  },
  webLeft: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#4A4AEB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  webKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  webKickerText: { color: '#F8F8F8', letterSpacing: 1.5 },
  webDot: { width: 8, height: 8, borderRadius: 4 },
  webKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  webHeadline: {
    fontFamily: FontFamily.bold,
    fontSize: 42,
    letterSpacing: -0.8,
    lineHeight: 50,
    marginBottom: 14,
  },
  webHeadlineText: { color: '#F8F8F8' },
  webLead: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 440,
    marginBottom: 24,
  },
  webLeadText: { color: '#F8F8F8', marginTop: 12 },
  webValueGrid: { gap: 12, marginTop: 8, maxWidth: 440 },
  webValueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#3CC76E',
    borderColor: '#1C1C1C',
    borderWidth: 2,
    borderRadius: CardTokens.radius,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  webValueStripe: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: '#FF2B9E',
  },
  webValueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webValueTitle: { color: '#1C1C1C', fontFamily: FontFamily.semibold, fontSize: 14 },
  webValueDesc: { color: '#1C1C1C', fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
