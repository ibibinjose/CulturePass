import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/modules/core/components';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  CardTokens,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  LiquidGlassTokens,
  luxeDark,
} from '@/design-system/tokens/theme';
import { LuxeButton, LuxeText } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { BrandWordmark } from '@/design-system/ui/BrandWordmark';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';
import Head from 'expo-router/head';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const FORGOT_SEO_TITLE = `Reset password · ${APP_NAME}`;
const FORGOT_SEO_DESC =
  'Request a secure link to reset your CulturePass password and get back to events and communities.';
const FORGOT_CANONICAL = `${SITE_ORIGIN}/forgot-password`;

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const handleSubmit = async () => {
    if (!isValid) return;
    if (!auth) {
      Alert.alert('Unavailable', 'Password reset requires Firebase to be configured for this web build.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as Record<string, unknown>)?.code as string | undefined;
      const msg =
        code === 'auth/user-not-found'
          ? 'No account found with that email address.'
          : code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isValid) return;
    if (!auth) {
      Alert.alert('Unavailable', 'Password reset requires Firebase to be configured for this web build.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Email Sent', 'A new reset link has been sent to your email.');
    } catch {
      Alert.alert('Error', 'Could not resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enterUp = reducedMotion
    ? undefined
    : FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(onboarding)/login');

  const padBottom = Platform.OS === 'web' ? 40 : 60 + insets.bottom;

  return (
    <>
      <Head>
        <title>{FORGOT_SEO_TITLE}</title>
        <meta name="description" content={FORGOT_SEO_DESC} />
        <meta property="og:title" content={FORGOT_SEO_TITLE} />
        <meta property="og:description" content={FORGOT_SEO_DESC} />
        <meta property="og:url" content={FORGOT_CANONICAL} />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href={FORGOT_CANONICAL} />
      </Head>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill
          label="Back to Sign In"
          onPress={goBack}
        />
      ) : (
        <AuthMobileHeader variant="back-only" onPress={goBack} />
      )}

      <KeyboardAwareScrollViewCompat
        style={styles.keyboardAvoid}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: padBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enterUp} style={styles.cardWrap}>
          <AuthLiquidFormCard isDesktop={isDesktop}>
            {!sent ? (
              <>
                <View style={styles.brandBlock}>
                  <BrandWordmark size="md" withTagline={false} centered />
                </View>

                {/* Icon + heading */}
                <View style={styles.headerBlock}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: luxeDark.primaryContainer, borderColor: 'transparent' },
                    ]}
                  >
                    <Ionicons name="lock-open-outline" size={28} color={luxeDark.onPrimaryContainer} />
                  </View>
                  <LuxeText variant="display" style={[styles.title, { color: luxeDark.text }]}>Reset Password</LuxeText>
                  <LuxeText variant="body" style={[styles.subtitle, { color: luxeDark.textSecondary }]}>
                    Enter your account email and we&apos;ll send a reset link straight to your inbox.
                  </LuxeText>
                </View>

                <View style={styles.formBlock}>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="username"
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  <LuxeButton
                    variant="filled"
                    rightIcon="send"
                    loading={loading}
                    disabled={!isValid || loading}
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                  >
                    Send Reset Link
                  </LuxeButton>
                </View>

                <Pressable
                  style={styles.backRow}
                  onPress={goBack}
                  hitSlop={12}
                  accessibilityRole="link"
                  accessibilityLabel="Back to Sign In"
                >
                  <Ionicons name="chevron-back" size={14} color={luxeDark.primary} />
                  <LuxeText variant="bodyMedium" style={{ color: luxeDark.primary }}>Back to Sign In</LuxeText>
                </Pressable>
              </>
            ) : (
              /* Success state */
              <View style={styles.successContainer}>
                <View style={styles.brandBlock}>
                  <BrandWordmark size="md" withTagline={false} centered />
                </View>

                <View style={[styles.successIconWrap, { backgroundColor: luxeDark.emerald + '20', borderColor: 'transparent' }]}>
                  <Ionicons name="checkmark-circle" size={40} color={luxeDark.emerald} />
                </View>

                <LuxeText variant="display" style={[styles.successTitle, { color: luxeDark.text }]}>Check Your Email</LuxeText>
                <LuxeText variant="body" style={[styles.successSub, { color: luxeDark.textSecondary }]}>
                  We&apos;ve sent a reset link to:
                </LuxeText>
                <LuxeText variant="title3" style={[styles.emailDisplay, { color: luxeDark.accent }]}>{email}</LuxeText>
                <LuxeText variant="caption" style={[styles.successHint, { color: luxeDark.textTertiary }]}>
                  If you don&apos;t see it, check your spam folder. The link expires in 24 hours.
                </LuxeText>

                <LuxeButton
                  variant="filled"
                  leftIcon="chevron-back"
                  onPress={() => router.replace('/(onboarding)/login')}
                  style={[styles.submitBtn, { marginTop: Spacing.lg }]}
                >
                  Back to Sign In
                </LuxeButton>

                <Pressable
                  style={styles.backRow}
                  onPress={handleResend}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Resend reset email"
                  disabled={loading}
                >
                  <LuxeText variant="body" style={{ color: luxeDark.textSecondary, textAlign: 'center' }}>
                    Didn&apos;t get it?{' '}
                    <LuxeText variant="bodyMedium" style={{ color: luxeDark.primary }}>Resend</LuxeText>
                  </LuxeText>
                </Pressable>
              </View>
            )}
          </AuthLiquidFormCard>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    paddingTop: 12,
  },
  scrollContentDesktop: { 
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl
  },
  cardWrap: { width: '100%', maxWidth: 420, alignSelf: 'center' },

  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  title: {
    ...TextStyles.display,
    fontSize: Platform.OS === 'web' ? 30 : 26,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
    lineHeight: 21,
  },
  formBlock: { gap: Spacing.lg },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  backText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },

  /* Success */
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  successTitle: {
    ...TextStyles.display,
    fontSize: 24,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  successSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  emailDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  resendText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
  },
});