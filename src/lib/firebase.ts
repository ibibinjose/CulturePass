/**
 * Firebase client SDK initialization — Expo app side.
 * Consumed by lib/auth.tsx and any screen that needs client Firebase access.
 *
 * All config is read from EXPO_PUBLIC_* env vars so they are baked
 * into the bundle at build time (Expo convention).
 *
 * ─── Setup ─────────────────────────────────────────────────────────────────
 * 1. Go to: console.firebase.google.com → your project → Project Settings
 *    → Your apps → Web app → SDK setup and configuration
 * 2. Copy the config values into your .env file (see .env.example)
 * 3. For EAS builds set the same vars inside eas.json build.*.env
 * ───────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
  type Persistence,
 Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import type { Functions } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirebaseWebConfig,
  getMissingFirebaseEnvKeys,
  isFirebaseWebClientReady,
  shouldUseFirebaseEmulators,
  getFirebaseEmulatorHost,
} from '@/lib/config';

export { isFirebaseWebClientReady } from '@/lib/config';

/** User-facing hint when auth/storage was not initialized (missing or placeholder env). */
export const FIREBASE_CLIENT_DISABLED_MESSAGE =
  'This deploy is missing valid Firebase web keys (EXPO_PUBLIC_FIREBASE_*). Rebuild the web bundle with your production .env or CI secrets.';

const missingKeys = getMissingFirebaseEnvKeys();

// Never throw at import on production web: a missing bake of EXPO_PUBLIC_* would yield a blank
// Hosting page (React never mounts). Surface misconfiguration loudly without killing the runtime.
if (missingKeys.length > 0) {
  const emulatorNote = shouldUseFirebaseEmulators()
    ? ' Emulator mode still needs the same Web app keys for initializeApp; only traffic is redirected to emulators.\n'
    : '';
  const hint =
    emulatorNote +
    'Copy .env.example to .env, paste your Web app config from Firebase Console → Project settings, ' +
    'then rebuild web (EXPO_PUBLIC_* are baked in at bundler startup).';
  const message = `[CulturePass] Firebase is not configured (missing: ${missingKeys.join(', ')}).\n${hint}`;
  if (__DEV__ && !process.env.CI) {
    throw new Error(message);
  }
  console.error(message);
}

const firebaseWebReady = isFirebaseWebClientReady();
const firebaseConfig = getFirebaseWebConfig();

export const firebaseApp: FirebaseApp | null = (() => {
  if (!firebaseWebReady) return null;
  try {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.error('[firebase] initializeApp failed:', error);
    return null;
  }
})();

// App Check (web + reCAPTCHA v3). Enable enforcement in Firebase Console after keys are live.
// Native clients should use DeviceCheck / Play Integrity via the native App Check SDK when you add it.
if (
  firebaseApp &&
  Platform.OS === 'web' &&
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { window?: unknown }).window !== 'undefined' &&
  !shouldUseFirebaseEmulators()
) {
  const siteKey = process.env.EXPO_PUBLIC_APPCHECK_SITE_KEY?.trim();
  if (siteKey && siteKey.length > 10) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appCheck = require('firebase/app-check') as typeof import('firebase/app-check');
      appCheck.initializeAppCheck(firebaseApp, {
        provider: new appCheck.ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error('[firebase] App Check initialization failed:', error);
    }
  }
}

/**
 * Firebase Auth instance with platform-appropriate persistence:
 * - Web:     localStorage (Firebase default via getAuth)
 * - Native:  AsyncStorage (survives app restarts)
 *
 * getReactNativePersistence exists in Metro's RN bundle but is absent from the
 * web TypeScript types, so we resolve it via require() to avoid TS2305.
 * initializeAuth throws if called twice on the same app (hot reload),
 * so we fall back to getAuth() which returns the existing instance.
 */
export const auth: Auth | null = (() => {
  if (!firebaseApp) return null;
  try {
    if (Platform.OS === 'web') {
      return getAuth(firebaseApp);
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => Persistence;
    };
    try {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (error) {
      const maybeFirebaseError = error as { code?: string; message?: string };
      if (maybeFirebaseError.code !== 'auth/already-initialized') {
        console.warn('[firebase] initializeAuth fallback to getAuth:', maybeFirebaseError.message ?? error);
      }
      return getAuth(firebaseApp);
    }
  } catch (error) {
    console.error('[firebase] Auth initialization failed:', error);
    return null;
  }
})();

export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;
export const functions: Functions | null = firebaseApp
  ? getFunctions(firebaseApp, 'us-central1')
  : null;

let emulatorsConnected = false;

if (__DEV__ && shouldUseFirebaseEmulators() && !emulatorsConnected && auth && db && storage && functions) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : getFirebaseEmulatorHost();

  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  } catch {}

  try {
    connectFirestoreEmulator(db, host, 8080);
  } catch {}

  try {
    connectStorageEmulator(storage, host, 9199);
  } catch {}

  try {
    connectFunctionsEmulator(functions, host, 5001);
  } catch {}

  emulatorsConnected = true;
}
