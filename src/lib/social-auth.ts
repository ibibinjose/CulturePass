import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  type Auth,
} from 'firebase/auth';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function isGoogleSignInConfigured(): boolean {
  if (Platform.OS === 'web') return true;
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'web';
}

export function isAuthCancellation(e: unknown): boolean {
  const err = e as Record<string, unknown>;
  const code = err?.code as string | undefined;
  return (
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === '-5' ||
    code === '12501' ||
    code === 'SIGN_IN_CANCELLED'
  );
}

export function resolveAuthErrorMessage(e: unknown, defaultMessage: string): string {
  if (isAuthCancellation(e)) return '';
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Unable to connect. Please check your internet connection and try again.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return '';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      default:
        return e.message || defaultMessage;
    }
  }
  const err = e as Record<string, unknown>;
  if (typeof err?.message === 'string' && err.message.length > 0) {
    return err.message;
  }
  return defaultMessage;
}

async function generateAppleNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Array.from(await Crypto.getRandomBytesAsync(32), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, hashedNonce };
}

let googleConfigured = false;

/**
 * Configure @react-native-google-signin/google-signin once per app session (iOS + Android).
 * Web uses Firebase `signInWithPopup` — the free google-signin package has no web implementation.
 */
export async function ensureGoogleSignInConfigured(): Promise<void> {
  if (Platform.OS === 'web' || googleConfigured) return;

  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    offlineAccess: false,
  });

  googleConfigured = true;
}

async function signInWithGoogleNative(auth: Auth): Promise<void> {
  const {
    GoogleSignin,
    isCancelledResponse,
    isErrorWithCode,
    statusCodes,
  } = await import('@react-native-google-signin/google-signin');

  await ensureGoogleSignInConfigured();

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your environment.',
    );
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw { code: 'auth/cancelled-popup-request' };
    }

    const idToken =
      response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;

    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  } catch (e: unknown) {
    if (isErrorWithCode(e)) {
      if (
        e.code === statusCodes.SIGN_IN_CANCELLED ||
        e.code === statusCodes.IN_PROGRESS
      ) {
        throw { code: 'auth/cancelled-popup-request' };
      }
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is required for sign-in on this device.');
      }
    }
    throw e;
  }
}

export async function signInWithGoogleProvider(auth: Auth): Promise<void> {
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    return;
  }

  await signInWithGoogleNative(auth);
}

export async function signInWithAppleProvider(auth: Auth): Promise<void> {
  if (Platform.OS === 'web') {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await signInWithPopup(auth, provider);
    return;
  }

  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is only available on iOS and web.');
  }

  const { rawNonce, hashedNonce } = await generateAppleNonce();
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });
  await signInWithCredential(auth, firebaseCredential);
}