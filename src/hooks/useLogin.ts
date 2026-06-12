import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { auth as firebaseAuth, FIREBASE_CLIENT_DISABLED_MESSAGE } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  isAuthCancellation,
  resolveAuthErrorMessage,
  signInWithAppleProvider,
  signInWithGoogleProvider,
} from '@/lib/social-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { deepLinkResolver } from '@/lib/deep-link-resolver';
import { captureEvent, identifyUser } from '@/lib/analytics';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export function handleFirebaseError(e: unknown, defaultMessage: string): string {
  return resolveAuthErrorMessage(e, defaultMessage);
}

export function useLogin(redirectTo: string | null) {
  const { waitForHydration, getSnapshot } = useOnboarding();
  const biometric = useBiometricAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const isValid = useMemo(() => email.trim().length > 0 && password.length >= 6, [email, password]);

  const validate = useCallback(() => {
    let valid = true;
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (password.length > 0 && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  }, [email, password]);

  const clearErrors = useCallback(() => {
    if (emailError) setEmailError('');
    if (passwordError) setPasswordError('');
    if (globalError) setGlobalError('');
  }, [emailError, passwordError, globalError]);

  /** Uses `getSnapshot()` after hydration so we do not read stale `isComplete` before the first re-render. */
  const postAuthRouteAfterHydration = useCallback(async () => {
    await waitForHydration();
    const snap = getSnapshot();

    // 1. Restore persisted deep-link destination (from tap-before-login, Req 10.4)
    const persisted = await deepLinkResolver.getPersistedDestination();
    if (persisted) {
      await deepLinkResolver.clearPersistedDestination();
      router.replace(persisted as never);
      return;
    }

    // 2. Incomplete onboarding → continue setup
    if (!snap.isComplete) {
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
      return;
    }

    // 3. Explicit redirectTo from the invoking screen (tab shortcuts normalized in sanitize)
    const safeRedirect = sanitizeInternalRedirect(redirectTo);
    if (safeRedirect) {
      router.replace(safeRedirect as never);
      return;
    }

    // 4. Default: return to previous screen or Discover
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [waitForHydration, getSnapshot, redirectTo]);

  const trackLogin = useCallback((method: string) => {
    const u = firebaseAuth?.currentUser;
    if (u) {
      identifyUser(u.uid, { email: u.email, name: u.displayName });
      captureEvent('Login Success', { method });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearErrors();
    if (!firebaseAuth) {
      setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      await signInWithGoogleProvider(firebaseAuth);
      trackLogin('google');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await postAuthRouteAfterHydration();
    } catch (e: unknown) {
      if (isAuthCancellation(e)) return;
      const errorMsg = handleFirebaseError(e, 'Google sign-in failed. Please try again.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web' && errorMsg) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'web') return;
    setLoading(true);
    clearErrors();
    if (!firebaseAuth) {
      setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      await signInWithAppleProvider(firebaseAuth);
      trackLogin('apple');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await postAuthRouteAfterHydration();
    } catch (e: unknown) {
      if (isAuthCancellation(e)) return;
      const errorMsg = handleFirebaseError(e, 'Apple sign-in failed. Please try again.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    clearErrors();
    if (!validate()) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      if (!firebaseAuth) {
        setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
        return;
      }
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      }
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      trackLogin('email');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (biometric.isAvailable && !biometric.biometricEnabled) {
        await biometric.promptToEnable(email, password);
      }
      await postAuthRouteAfterHydration();
    } catch (e: unknown) {
      const errorMsg = handleFirebaseError(e, 'Sign in failed. Please try again.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web' && errorMsg) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      if (!firebaseAuth) {
        setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
        return;
      }
      const creds = await biometric.authenticate();
      if (!creds) return; // user cancelled
      await signInWithEmailAndPassword(firebaseAuth, creds.email, creds.password);
      trackLogin('biometric');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await postAuthRouteAfterHydration();
    } catch (e: unknown) {
      const errorMsg = handleFirebaseError(e, 'Biometric sign-in failed. Please use your password.');
      if (errorMsg) setGlobalError(errorMsg);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [biometric, clearErrors, trackLogin, postAuthRouteAfterHydration]);

  return {
    email, setEmail,
    password, setPassword,
    emailError, passwordError, globalError,
    loading, rememberMe, setRememberMe,
    isValid,
    clearErrors,
    handleGoogleSignIn, handleAppleSignIn, handleLogin,
    handleBiometricLogin,
    biometricAvailable: biometric.isAvailable,
    biometricEnabled: biometric.biometricEnabled,
    biometricType: biometric.biometricType,
    disableBiometric: biometric.disableBiometric,
  };
}
