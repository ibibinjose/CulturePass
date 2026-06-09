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
  M3TopAppBar,
  LuxeButton,
  LuxeCard,
  LuxeText,
  Input,
  Checkbox,
  CulturePassWordmark,
} from '@/design-system/ui';
import { AuthSocialSection } from '@/components/onboarding/AuthSocialSection';
import { AuthWebMarketingPanel } from '@/components/onboarding/AuthWebMarketingPanel';

import {
  CardTokens,
  FontFamily,
  FontSize,
  IconSize,
  LiquidGlassTokens,
  M3Typography,
  Spacing,
  TextStyles,
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
        <LuxeText variant="display" style={[s.title, { color: m3Colors.onSurface }]}>Welcome back</LuxeText>
        <LuxeText variant="body" style={[s.subtitle, { color: m3Colors.onSurfaceVariant }]}>
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

      <AuthSocialSection
        entering={enter(110)}
        onGooglePress={handleGoogleSignIn}
        onApplePress={handleAppleSignIn}
        loading={loading}
        mode="login"
      />

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
            <Text style={[s.forgotText, { color: m3Colors.primary }]}>Forgot?</Text>
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
            <AuthWebMarketingPanel enterAnimation={enter} variant="login" />

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
  /* Desktop two-column */
  webRow: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 48,
  },
});
