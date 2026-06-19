import React, { Fragment } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { KeyboardAwareScrollViewCompat } from '@/modules/core/components';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated,
  { FadeInUp, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { getAuthScreenPalette } from '@/components/onboarding/authScreenTheme';
import { useLayout } from '@/hooks/useLayout';
import { useSignup } from '@/hooks/useSignup';
import {
  M3TopAppBar,
  Input,
  Checkbox,
  PasswordStrengthIndicator,
  LuxeButton,
  LuxeCard,
  LuxeText,
  CulturePassWordmark,
} from '@/design-system/ui';
import { AuthAmbientBackground } from '@/components/onboarding/AuthScreenPrimitives';
import { AuthSocialSection } from '@/components/onboarding/AuthSocialSection';
import { AuthWebMarketingPanel } from '@/components/onboarding/AuthWebMarketingPanel';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';


import {
  CardTokens,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
  LiquidGlassTokens,
  Radius,
  M3Typography,
} from '@/design-system/tokens/theme';

import { routeWithRedirect } from '@/lib/routes';
import Head from 'expo-router/head';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const SIGNUP_SEO_TITLE = `Create account · ${APP_NAME}`;
const SIGNUP_SEO_DESC =
  'Join CulturePass to discover cultural events, join communities, unlock member perks, and belong anywhere.';
const SIGNUP_CANONICAL = `${SITE_ORIGIN}/signup`;

const HOST_VALUE_PROPS = [
  { icon: 'calendar-outline' as const, title: 'Create Events', desc: 'Publish ticketed or free events and manage bookings easily.' },
  { icon: 'storefront-outline' as const, title: 'List on CultureMarket', desc: 'Sell products, services, or list your cultural business.' },
  { icon: 'people-outline' as const, title: 'Build Communities', desc: 'Create groups, cultural associations, and member circles.' },
] as const;

interface AccountTypeSelectorProps {
  enterAnimation: (delay: number) => any;
  role: 'user' | 'organizer';
  setRole: (role: 'user' | 'organizer') => void;
  clearErrors: () => void;
  accent: string;
  text: string;
  textOnAccent: string;
  surfaceElevated: string;
  textSecondary: string;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({
  enterAnimation,
  role,
  setRole,
  clearErrors,
  accent,
  text,
  textOnAccent,
  surfaceElevated,
  textSecondary,
}) => {
  return (
    <Animated.View entering={enterAnimation(170)} style={s.accountTypeGroup}>
      <LuxeText variant="badgeCaps" style={{ color: textSecondary }}>ACCOUNT TYPE</LuxeText>
      <View style={[s.accountTypeRow, { backgroundColor: surfaceElevated, borderColor: 'transparent' }]}>
        {[
          { key: 'user' as const, label: 'User', icon: 'person-outline' as const },
          { key: 'organizer' as const, label: 'Host', icon: 'briefcase-outline' as const },
        ].map((option) => {
          const active = role === option.key;
          return (
            <Pressable
              key={option.key}
              style={[
                s.accountTypeOption,
                active && { backgroundColor: accent },
              ]}
              onPress={() => {
                setRole(option.key);
                clearErrors();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={active ? textOnAccent : accent}
              />
              <LuxeText
                variant="bodyMedium"
                style={{ color: active ? textOnAccent : text }}
              >
                {option.label}
              </LuxeText>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

interface SignUpFormFieldsProps {
  enterAnimation: (delay: number) => any;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  nameError: string | null;
  emailError: string | null;
  passwordError: string | null;
  clearErrors: () => void;
  handleSignUp: () => void;
}

const SignUpFormFields: React.FC<SignUpFormFieldsProps> = ({
  enterAnimation,
  name, setName, nameError,
  email, setEmail, emailError,
  password, setPassword, passwordError,
  clearErrors, handleSignUp
}) => {
  return (
    <Animated.View entering={enterAnimation(210)} style={s.form}>
      <Input
        label="Full Name"
        placeholder="Your full name"
        leftIcon="person-outline"
        value={name}
        onChangeText={(v: string) => { setName(v); clearErrors(); }}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        error={nameError ?? undefined}
      />

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
        error={emailError ?? undefined}
      />

      <View style={s.passwordGroup}>
        <Input
          label="Password"
          placeholder="Min. 6 characters"
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={(v: string) => { setPassword(v); clearErrors(); }}
          passwordToggle
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          error={passwordError ?? undefined}
        />
        {Boolean(password.length > 0) && <PasswordStrengthIndicator password={password} />}
      </View>
    </Animated.View>
  );
};

interface TermsCheckboxProps {
  enterAnimation: (delay: number) => any;
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
  clearErrors: () => void;
  accent: string;
  text: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  enterAnimation,
  agreed,
  setAgreed,
  clearErrors,
  accent,
  text,
}) => {
  return (
    <Animated.View entering={enterAnimation(260)} style={s.optionsRow}>
      <Checkbox
        checked={agreed}
        onToggle={(v: boolean) => { setAgreed(v); clearErrors(); }}
        label={
          <LuxeText variant="body" style={{ color: text, flex: 1 }}>
            I agree to the{' '}
            <LuxeText
              variant="bodyMedium"
              style={{ color: accent }}
              onPress={() => router.push('/(static)/legal/terms')}
            >
              Terms
            </LuxeText>
            {' & '}
            <LuxeText
              variant="bodyMedium"
              style={{ color: accent }}
              onPress={() => router.push('/(static)/legal/privacy')}
            >
              Privacy Policy
            </LuxeText>
          </LuxeText>
        }
      />
    </Animated.View>
  );
};

export default function SignUpScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
  const { isDesktop, isWeb, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const isExpanded = windowSizeClass === 'expanded';

  const searchParams = useLocalSearchParams();
  const isHostIntent = searchParams.intent === 'host' || searchParams.role === 'organizer';
  const authVariant = isHostIntent ? 'host' : 'signup';
  const authPalette = getAuthScreenPalette(authVariant, isDark, colors);

  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    agreed,
    setAgreed,
    nameError,
    emailError,
    passwordError,
    globalError,
    loading,
    role,
    setRole,
    isValid,
    clearErrors,
    handleGoogleSignUp,
    handleAppleSignUp,
    handleSignUp,
    redirectTo,
  } = useSignup();

  const shouldAnimate = !reducedMotion;

  const fadeInUp = shouldAnimate
    ? FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness)
    : undefined;

  const enter = (delay: number) =>
    shouldAnimate
      ? FadeInDown.delay(delay)
          .springify()
          .damping(LiquidGlassTokens.entranceSpring.damping)
          .stiffness(LiquidGlassTokens.entranceSpring.stiffness)
      : undefined;

  const bottomPadding = isWeb ? (insets.bottom > 0 ? insets.bottom : 40) : (64 + insets.bottom);

  const formContent = (
    <View style={s.cardInner}>
      <Animated.View entering={enter(30)} style={s.brandBlock}>
        <CulturePassWordmark size="md" showSuffix={false} />
      </Animated.View>

      <Animated.View entering={enter(70)} style={s.copyBlock}>
        <LuxeText variant="display" style={[s.title, { color: m3Colors.onSurface }]}>
          {isHostIntent ? 'Join as a Host' : 'Create your account'}
        </LuxeText>
        <LuxeText variant="body" style={[s.subtitle, { color: m3Colors.onSurfaceVariant }]}>
          {isHostIntent
            ? 'Setup your Host Hub workspace to start creating.'
            : 'Join CulturePass — your home for events and community.'}
        </LuxeText>
      </Animated.View>

      {/* Mobile-only info card (What is Host Hub) */}
      {isHostIntent && (
        <Animated.View
          entering={enter(80)}
          style={[
            s.hostHubInfoCard,
            {
              borderColor: authPalette.panelBorder,
              backgroundColor: authPalette.accentMuted,
            },
          ]}
        >
          <LuxeText variant="bodyMedium" style={[s.hostHubInfoTitle, { color: authPalette.text }]}>What is Host Hub?</LuxeText>
          <LuxeText variant="caption" style={[s.hostHubInfoDesc, { color: authPalette.textSecondary }]}>
            CulturePass Host Hub allows you to publish events, sell products/services, and build communities.
          </LuxeText>
          <View style={s.hostHubPerksList}>
            {HOST_VALUE_PROPS.map((item) => (
              <View key={item.title} style={s.hostHubPerkItem}>
                <View style={[s.hostHubPerkIconWrap, { backgroundColor: authPalette.surfaceElevated }]}>
                  <Ionicons name={item.icon} size={14} color={authPalette.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <LuxeText variant="bodyMedium" style={[s.hostHubPerkTitle, { color: authPalette.text }]}>{item.title}</LuxeText>
                  <LuxeText variant="caption" style={[s.hostHubPerkDesc, { color: authPalette.textSecondary }]}>{item.desc}</LuxeText>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {redirectTo ? (
        <OnboardingDestinationBanner redirectTo={redirectTo} variant="auth" />
      ) : null}

      {/* Global error */}
      {Boolean(globalError) && (
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
      )}

      <AuthSocialSection
        entering={enter(110)}
        onGooglePress={handleGoogleSignUp}
        onApplePress={handleAppleSignUp}
        loading={loading}
        mode="signup"
      />

      <Animated.View entering={enter(150)} style={s.divider}>
        <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
        <Text style={[s.divText, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>OR SIGN UP WITH EMAIL</Text>
        <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
      </Animated.View>

      <AccountTypeSelector
        enterAnimation={enter}
        role={role}
        setRole={setRole}
        clearErrors={clearErrors}
        accent={authPalette.accent}
        text={authPalette.text}
        textOnAccent={colors.textOnBrandGradient}
        surfaceElevated={authPalette.surfaceElevated}
        textSecondary={authPalette.textSecondary}
      />

      <SignUpFormFields
        enterAnimation={enter}
        name={name} setName={setName} nameError={nameError}
        email={email} setEmail={setEmail} emailError={emailError}
        password={password} setPassword={setPassword} passwordError={passwordError}
        clearErrors={clearErrors}
        handleSignUp={handleSignUp}
      />

      <TermsCheckbox
        enterAnimation={enter}
        agreed={agreed}
        setAgreed={setAgreed}
        clearErrors={clearErrors}
        accent={authPalette.accent}
        text={authPalette.text}
      />

      {/* CTA */}
      <Animated.View entering={enter(300)} style={s.ctaButtonContainer}>
        <LuxeButton
          variant="filled"
          fullWidth
          haptic
          rightIcon="arrow-forward"
          loading={loading}
          disabled={!isValid || loading}
          onPress={handleSignUp}
          style={s.submitButton}
        >
          Create Account
        </LuxeButton>
      </Animated.View>

      {/* Switch to sign in */}
      <Animated.View entering={enter(340)}>
        <Pressable
          style={s.switchRow}
          onPress={() => router.replace(routeWithRedirect('/(onboarding)/login', redirectTo) as string)}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={[s.switchText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
            Already have an account?{' '}
            <Text style={{ color: authPalette.accent, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  return (
    <Fragment>
      <Head>
        <title>{SIGNUP_SEO_TITLE}</title>
        <meta name="description" content={SIGNUP_SEO_DESC} />
        <meta property="og:title" content={SIGNUP_SEO_TITLE} />
        <meta property="og:description" content={SIGNUP_SEO_DESC} />
        <meta property="og:url" content={SIGNUP_CANONICAL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SIGNUP_SEO_TITLE} />
        <meta name="twitter:description" content={SIGNUP_SEO_DESC} />
        <link rel="canonical" href={SIGNUP_CANONICAL} />
      </Head>
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground variant={authVariant} />

      <M3TopAppBar
        title="Sign Up"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        variant="medium"
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={s.topAppBarImage}
            contentFit="contain"
          />
        }
      />

      <KeyboardAwareScrollViewCompat
        style={s.keyboardAvoid}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isWeb && isDesktop ? (
          <View style={s.webRow}>
            <AuthWebMarketingPanel
              enterAnimation={enter}
              variant={isHostIntent ? 'host' : 'signup'}
            />
            <Animated.View entering={fadeInUp} style={[s.cardWrap, s.cardWrapDesktop]}>
              <LuxeCard variant="default" style={{ padding: 32, borderColor: authPalette.panelBorder, borderWidth: 1 }}>
                {formContent}
              </LuxeCard>
            </Animated.View>
          </View>
        ) : (
          <Animated.View entering={fadeInUp} style={s.cardWrap}>
            <LuxeCard variant="default" style={{ padding: isExpanded ? 32 : 24, borderColor: authPalette.panelBorder, borderWidth: 1 }}>
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
  cardWrapDesktop: { maxWidth: 460, minWidth: 400, alignSelf: 'stretch' },
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
    fontSize: 26,
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
  passwordGroup: { gap: Spacing.sm },
  accountTypeGroup: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  accountTypeLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: CardTokens.radius,
    padding: Spacing.xs,
  },
  accountTypeOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: CardTokens.radius - 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  accountTypeText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
  },
  optionsRow: { marginTop: 8, marginBottom: Spacing.md },
  checkText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },
  ctaButtonContainer: { marginTop: 12 },
  submitButton: { height: 52, borderRadius: CardTokens.radius }, // Removed hardcoded colors

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
  topAppBarImage: { width: 40, height: 40, borderRadius: 20, marginLeft: 8 },
  hostHubInfoCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  hostHubInfoTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  hostHubInfoDesc: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    marginBottom: 16,
  },
  hostHubPerksList: {
    gap: 12,
  },
  hostHubPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostHubPerkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostHubPerkTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  hostHubPerkDesc: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 15,
  },
});