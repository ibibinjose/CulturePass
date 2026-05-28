import React, { Fragment } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { KeyboardAwareScrollViewCompat } from '@/modules/core/components';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated,
  { FadeInUp, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useSignup } from '@/hooks/useSignup';
import {
  M3Card,
  CulturalTopAppBar,
  Input,
  Checkbox,
  SocialButton,
  PasswordStrengthIndicator,
  LuxeButton,
  LuxeCard,
  LuxeText,
} from '@/design-system/ui';
import { BrandWordmark } from '@/design-system/ui/BrandWordmark';


import {
  CultureTokens,
  CardTokens,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
  LiquidGlassTokens,
  luxeDark,
} from '@/design-system/tokens/theme';

import { routeWithRedirect } from '@/lib/routes';
import Head from 'expo-router/head';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const SIGNUP_SEO_TITLE = `Create account · ${APP_NAME}`;
const SIGNUP_SEO_DESC =
  'Join CulturePass to discover cultural events, join communities, unlock member perks, and belong anywhere.';
const SIGNUP_CANONICAL = `${SITE_ORIGIN}/signup`;

// Luxe Heritage values
const _LUXE_TITLE = 'Create your account';
const _LUXE_SUB = 'Your cultural passport starts here.';

const VALUE_PROPS = [
  { icon: 'calendar-outline' as const, title: 'Cultural Events', desc: "Discover what's on this week in your city." },
  { icon: 'people-outline' as const, title: 'Your Community', desc: 'Connect with people who share your culture.' },
  { icon: 'gift-outline' as const, title: 'Member Perks', desc: 'Exclusive rewards from local businesses.' },
] as const;

// --- Sub-components for better modularity ---

interface SocialLoginSectionProps {
  enterAnimation: (delay: number) => any;
  handleGoogleSignUp: () => void;
  handleAppleSignUp: () => void;
  loading: boolean;
}

const SocialLoginSection: React.FC<SocialLoginSectionProps> = ({ enterAnimation, handleGoogleSignUp, handleAppleSignUp, loading }) => {
  return (
    <Animated.View entering={enterAnimation(110)} style={s.socialStack}>
      <SocialButton
        provider="google"
        onPress={handleGoogleSignUp}
        disabled={loading}
        compact
        accessibilityLabel="Sign up with Google"
      />
      <SocialButton
        provider="apple"
        onPress={handleAppleSignUp}
        disabled={loading}
        compact
        comingSoon={Platform.OS !== 'ios' && Platform.OS !== 'web'}
        accessibilityLabel="Sign up with Apple"
      />
    </Animated.View>
  );
};

interface AccountTypeSelectorProps {
  enterAnimation: (delay: number) => any;
  role: 'user' | 'organizer';
  setRole: (role: 'user' | 'organizer') => void;
  clearErrors: () => void;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ enterAnimation, role, setRole, clearErrors }) => {
  return (
    <Animated.View entering={enterAnimation(170)} style={s.accountTypeGroup}>
      <LuxeText variant="badgeCaps" style={{ color: luxeDark.textSecondary }}>ACCOUNT TYPE</LuxeText>
      <View style={[s.accountTypeRow, { backgroundColor: luxeDark.surfaceElevated, borderColor: 'transparent' }]}>
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
                active && { backgroundColor: luxeDark.primary },
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
                color={active ? luxeDark.textOnBrandGradient : luxeDark.primary}
              />
              <LuxeText
                variant="bodyMedium"
                style={{ color: active ? luxeDark.textOnBrandGradient : luxeDark.text }}
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
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ enterAnimation, agreed, setAgreed, clearErrors }) => {
  return (
    <Animated.View entering={enterAnimation(260)} style={s.optionsRow}>
      <Checkbox
        checked={agreed}
        onToggle={(v: boolean) => { setAgreed(v); clearErrors(); }}
        label={
          <LuxeText variant="body" style={{ color: luxeDark.text, flex: 1 }}>
            I agree to the{' '}
            <LuxeText
              variant="bodyMedium"
              style={{ color: luxeDark.primary }}
              onPress={() => router.push('/(static)/legal/terms')}
            >
              Terms
            </LuxeText>
            {' & '}
            <LuxeText
              variant="bodyMedium"
              style={{ color: luxeDark.primary }}
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

interface WebMarketingPanelProps {
  enterAnimation: (delay: number) => any;
}

const WebMarketingPanel: React.FC<WebMarketingPanelProps> = ({ enterAnimation }) => {
  return (
    <View style={[s.webLeft, { backgroundColor: luxeDark.accentContainer }]}>
      <Animated.View entering={enterAnimation(40)} style={s.webKickerRow}>
        <View style={[s.webDot, { backgroundColor: luxeDark.primary }]} />
        <LuxeText variant="badgeCaps" style={s.webKickerText}>CULTUREPASS</LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(70)}>
        <LuxeText variant="displayHero" style={s.webHeadlineText}>
          Your cultural home,{'\n'}anywhere.
        </LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(100)}>
        <LuxeText variant="hero" style={s.webLeadText}>
          The premium marketplace for diaspora communities — events, businesses, and member perks.
        </LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(130)} style={s.webValueGrid}>
        {VALUE_PROPS.map((item, index) => (
          <Animated.View
            key={item.title}
            entering={enterAnimation(160 + index * 30)}
            style={s.webValueItem}
          >
            <LuxeCard
              variant="glass"
              style={s.webValueCard}
            >
                <View style={s.webValueStripe} />
                <View style={[s.webValueIcon, { backgroundColor: luxeDark.surfaceElevated }]}>
                  <Ionicons name={item.icon} size={18} color={luxeDark.primary} />
                </View>
                <View style={s.webValueTextContent}>
                  <LuxeText variant="title3" style={s.webValueTitle}>{item.title}</LuxeText>
                  <LuxeText variant="caption" style={s.webValueDesc}>{item.desc}</LuxeText>
                </View>
            </LuxeCard>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
};

// --- Main SignUpScreen Component ---

export default function SignUpScreen() {
  const m3Colors = useM3Colors();
  const { isDesktop, isWeb, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const isExpanded = windowSizeClass === 'expanded';

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
    <LuxeCard variant="default" style={{ padding: isExpanded ? 32 : 24 }}>
      {/* Brand — single appearance, inside the card */}
      <Animated.View entering={enter(30)} style={s.brandBlock}>
        <BrandWordmark size="md" withTagline={false} centered />
      </Animated.View>

      {/* Copy */}
      <Animated.View entering={enter(70)} style={s.copyBlock}>
        <LuxeText variant="display" style={[s.title, { color: luxeDark.text }]}>
          Create your account
        </LuxeText>
        <LuxeText variant="body" style={[s.subtitle, { color: luxeDark.textSecondary }]}>
          Join CulturePass — your home for events and community.
        </LuxeText>
      </Animated.View>

      {/* Global error */}
      {Boolean(globalError) && (
        <Animated.View
          entering={enter(90)}
          style={[
            s.errorBanner,
            {
              backgroundColor: luxeDark.error + '20',
              borderColor: luxeDark.error,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle" size={IconSize.md} color={luxeDark.error} />
          <LuxeText variant="caption" style={{ color: luxeDark.error, flex: 1 }}>{globalError}</LuxeText>
        </Animated.View>
      )}

      <SocialLoginSection
        enterAnimation={enter}
        handleGoogleSignUp={handleGoogleSignUp}
        handleAppleSignUp={handleAppleSignUp}
        loading={loading}
      />

      {/* Divider */}
      <Animated.View entering={enter(150)} style={s.divider}>
        <View style={[s.divLine, { backgroundColor: luxeDark.border }]} />
        <LuxeText variant="badgeCaps" style={{ color: luxeDark.textSecondary }}>OR SIGN UP WITH EMAIL</LuxeText>
        <View style={[s.divLine, { backgroundColor: luxeDark.border }]} />
      </Animated.View>

      <AccountTypeSelector
        enterAnimation={enter}
        role={role}
        setRole={setRole}
        clearErrors={clearErrors}
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
          <LuxeText variant="body" style={{ color: luxeDark.textSecondary, textAlign: 'center' }}>
            Already have an account?{' '}
            <LuxeText variant="bodyMedium" style={{ color: luxeDark.primary }}>Sign In</LuxeText>
          </LuxeText>
        </Pressable>
      </Animated.View>
    </LuxeCard>
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
    <View style={[s.container, { backgroundColor: m3Colors.background }]}>
      <CulturalTopAppBar
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
            <WebMarketingPanel enterAnimation={enter} />
            <Animated.View entering={fadeInUp} style={[s.cardWrap, s.cardWrapDesktop]}>
              {formContent}
            </Animated.View>
          </View>
        ) : (
          <Animated.View entering={fadeInUp} style={s.cardWrap}>
            {formContent}
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
  linkText: { color: CultureTokens.richIndigo, fontFamily: FontFamily.semibold },
  ctaButtonContainer: { marginTop: 12 },
  submitButton: { height: 52, borderRadius: CardTokens.radius }, // Removed hardcoded colors

  /* Switch */
  switchRow: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout, textAlign: 'center' },
  switchLink: { color: CultureTokens.richIndigo, fontFamily: FontFamily.bold },

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
  webLeft: {
    flex: 1,
    minWidth: 360,
    maxWidth: 560,
    backgroundColor: CultureTokens.richIndigo,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1C1C1C',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  webKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  webDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: CultureTokens.heritageGold },
  webKickerText: { color: '#F8F8F8', letterSpacing: 1.5 },
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
    maxWidth: 520,
    marginBottom: 28,
  },
  webLeadText: { color: '#F8F8F8', marginTop: 12 },
  webValueGrid: { gap: 12, marginTop: 8, maxWidth: 520 },
  webValueItem: { width: '100%' },
  webValueCard: {
    width: '100%',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CultureTokens.emeraldHarmony,
    borderColor: '#1C1C1C',
    borderWidth: 2,
    borderRadius: CardTokens.radius,
  },
  webValueStripe: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: CultureTokens.heritageGold,
  },
  webValueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webValueTextContent: { flex: 1, minWidth: 0 },
  webValueTitle: { color: '#1C1C1C', fontFamily: FontFamily.semibold, fontSize: 14 },
  webValueDesc: {
    color: '#1C1C1C',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  topAppBarImage: { width: 40, height: 40, borderRadius: 20, marginLeft: 8 },
});