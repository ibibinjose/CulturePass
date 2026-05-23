import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { auth as firebaseAuth, FIREBASE_CLIENT_DISABLED_MESSAGE } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { api } from '@/lib/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { captureEvent, identifyUser } from '@/lib/analytics';
import { HapticManager } from '@/lib/haptics';

export function useSignup() {
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [role, setRole] = useState<'user' | 'organizer'>('user');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  const [loading, setLoading] = useState(false);

  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const isValid = useMemo(() => {
    return normalizedName.length > 1 && normalizedEmail.includes('@') && password.length >= 6 && agreed;
  }, [normalizedName, normalizedEmail, password, agreed]);

  const clearErrors = useCallback(() => {
    if (nameError) setNameError('');
    if (emailError) setEmailError('');
    if (passwordError) setPasswordError('');
    if (globalError) setGlobalError('');
  }, [nameError, emailError, passwordError, globalError]);

  const validate = useCallback(() => {
    let valid = true;
    if (normalizedName.length < 2) {
      setNameError('Please enter your full name.');
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    if (!agreed) {
      setGlobalError('You must agree to the Terms of Service to continue.');
      valid = false;
    }
    return valid;
  }, [normalizedName, normalizedEmail, password, agreed]);

  const trackSignup = useCallback((method: string) => {
    const u = firebaseAuth?.currentUser;
    if (u) {
      identifyUser(u.uid, { email: u.email, name: u.displayName, role });
      captureEvent('Signup Success', { method, role });
    }
  }, [role]);

  const handleGoogleSignUp = useCallback(async () => {
    setLoading(true);
    clearErrors();
    if (!firebaseAuth) {
      setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, browserLocalPersistence);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, provider);
      } else {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const credential = GoogleAuthProvider.credential(tokens.idToken);
        await signInWithCredential(firebaseAuth, credential);
      }
      {
        const cur = firebaseAuth?.currentUser;
        if (cur) {
          await cur.getIdToken(true);
          try {
            await api.auth.register({
              displayName: cur.displayName ?? undefined,
              role,
            });
          } catch {
            /* idempotent if profile already exists */
          }
        }
      }
      trackSignup('google');
      await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      const code = err?.code as string | undefined;
      if (!code || !['auth/popup-closed-by-user', 'auth/cancelled-popup-request', '-5'].includes(code)) {
        setGlobalError('Google sign-up failed. Please try again.');
        await HapticManager.error();
      }
    } finally {
      setLoading(false);
    }
  }, [clearErrors, trackSignup, redirectTo, role]);

  const handleAppleSignUp = useCallback(async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'web') return;
    setLoading(true);
    clearErrors();
    if (!firebaseAuth) {
      setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      if (Platform.OS === 'web') {
        const provider = new OAuthProvider('apple.com');
        await signInWithPopup(firebaseAuth, provider);
      } else {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
          idToken: credential.identityToken ?? '',
          rawNonce: credential.authorizationCode ?? '',
        });
        await signInWithCredential(firebaseAuth, firebaseCredential);
      }
      {
        const cur = firebaseAuth?.currentUser;
        if (cur) {
          await cur.getIdToken(true);
          try {
            await api.auth.register({
              displayName: cur.displayName ?? undefined,
              role,
            });
          } catch {
            /* idempotent if profile already exists */
          }
        }
      }
      trackSignup('apple');
      if (Platform.OS !== 'web') await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        setGlobalError('Apple sign-up failed. Please try again.');
        if (Platform.OS !== 'web') await HapticManager.error();
      }
    } finally {
      setLoading(false);
    }
  }, [clearErrors, trackSignup, redirectTo, role]);

  const handleSignUp = useCallback(async () => {
    clearErrors();
    if (!validate()) {
      await HapticManager.error();
      return;
    }

    setLoading(true);
    try {
      if (!firebaseAuth) {
        setGlobalError(FIREBASE_CLIENT_DISABLED_MESSAGE);
        return;
      }
      if (Platform.OS === 'web') {
        await setPersistence(firebaseAuth, browserLocalPersistence);
      }
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName: normalizedName });
      await credential.user.getIdToken(true);
      await api.auth.register({ displayName: normalizedName, role });

      identifyUser(credential.user.uid, { email: normalizedEmail, name: normalizedName, role });
      captureEvent('Signup Success', { method: 'email', role });

      await HapticManager.success();
      router.replace(routeWithRedirect('/(onboarding)/location', redirectTo) as string);
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      const code = err?.code as string | undefined;
      if (code === 'auth/email-already-in-use') {
        setEmailError('An account with this email already exists.');
      } else if (code === 'auth/invalid-email') {
        setEmailError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setPasswordError('Password must be at least 6 characters.');
      } else if (code === 'auth/network-request-failed') {
        setGlobalError('Unable to connect. Please check your internet connection and try again.');
      } else {
        setGlobalError('Registration failed. Please try again.');
      }
      await HapticManager.error();
    } finally {
      setLoading(false);
    }
  }, [clearErrors, validate, normalizedEmail, password, normalizedName, role, redirectTo]);

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    agreed, setAgreed,
    role, setRole,
    nameError,
    emailError,
    passwordError,
    globalError,
    loading,
    isValid,
    clearErrors,
    handleGoogleSignUp,
    handleAppleSignUp,
    handleSignUp,
    redirectTo
  };
}
