import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LuxeButton, LuxeCard, LuxeText } from '@/design-system/ui';
import { BrandWordmark } from '@/design-system/ui/BrandWordmark';
import { AuthAmbientBackground } from '@/components/onboarding/AuthScreenPrimitives';
import { Spacing, FontFamily, CardTokens } from '@/design-system/tokens/theme';
import Head from 'expo-router/head';
import { APP_NAME } from '@/lib/app-meta';

export default function VerifyEmailScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, isWeb } = useLayout();
  const { user, logout, sendVerificationEmail, checkEmailVerified, emailVerified } = useAuth();
  
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If email is verified, redirect the user immediately
  useEffect(() => {
    if (emailVerified) {
      router.replace('/(tabs)');
    }
  }, [emailVerified]);

  const handleResend = async () => {
    setResending(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await sendVerificationEmail();
      setStatusMessage('Verification link resent successfully! Please check your email inbox and spam folders.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage("We couldn't verify your email yet. Please click the link in the email sent to you, then try checking again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout('/(onboarding)/login');
    } catch (err) {
      // Ignored
    }
  };

  const userEmail = user?.email || 'your registered email';

  return (
    <>
      {isWeb && (
        <Head>
          <title>{`Verify Email · ${APP_NAME}`}</title>
        </Head>
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AuthAmbientBackground />
        
        <View style={styles.cardWrap}>
          <LuxeCard variant="default" style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.brandBlock}>
                <BrandWordmark size="md" withTagline={false} centered />
              </View>

              <View style={styles.copyBlock}>
                <LuxeText variant="display" style={[styles.title, { color: colors.text }]}>Verify your email</LuxeText>
                <LuxeText variant="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
                  We have sent a verification link to:
                </LuxeText>
                <LuxeText variant="bodyMedium" style={[styles.emailText, { color: colors.primary }]}>
                  {userEmail}
                </LuxeText>
                <LuxeText variant="caption" style={[styles.instructionText, { color: colors.textSecondary }]}>
                  Please click the link in that email to activate your account.
                </LuxeText>
              </View>

              {statusMessage && (
                <View style={[styles.banner, { backgroundColor: m3Colors.primaryContainer, borderColor: m3Colors.primary }]}>
                  <Ionicons name="checkmark-circle" size={20} color={m3Colors.onPrimaryContainer} />
                  <Text style={[styles.bannerText, { color: m3Colors.onPrimaryContainer }]}>{statusMessage}</Text>
                </View>
              )}

              {errorMessage && (
                <View style={[styles.banner, { backgroundColor: m3Colors.errorContainer, borderColor: m3Colors.error }]}>
                  <Ionicons name="alert-circle" size={20} color={m3Colors.onErrorContainer} />
                  <Text style={[styles.bannerText, { color: m3Colors.onErrorContainer }]}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.actionContainer}>
                <LuxeButton
                  variant="filled"
                  onPress={handleCheckStatus}
                  disabled={checking || resending}
                  fullWidth
                  style={styles.actionBtn}
                >
                  {checking ? 'Checking Status...' : 'I have verified my email'}
                </LuxeButton>

                <LuxeButton
                  variant="outlined"
                  onPress={handleResend}
                  disabled={checking || resending}
                  fullWidth
                  style={styles.actionBtn}
                >
                  {resending ? 'Resending Link...' : 'Resend Verification Email'}
                </LuxeButton>

                <LuxeButton
                  variant="tonal"
                  onPress={handleLogout}
                  disabled={checking || resending}
                  fullWidth
                  style={[styles.actionBtn, styles.logoutBtn]}
                >
                  Back to Log In
                </LuxeButton>
              </View>
            </View>
          </LuxeCard>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    padding: 28,
  },
  cardInner: {
    width: '100%',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  copyBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 6,
  },
  instructionText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  actionContainer: {
    gap: 12,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    height: 48,
    borderRadius: CardTokens.radius,
  },
  logoutBtn: {
    marginTop: 8,
  },
});
