import { Platform } from 'react-native';

type RequiredFirebaseEnvKey =
  | 'EXPO_PUBLIC_FIREBASE_API_KEY'
  | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
  | 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'
  | 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  | 'EXPO_PUBLIC_FIREBASE_APP_ID';

const REQUIRED_FIREBASE_KEYS: RequiredFirebaseEnvKey[] = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

// No hardcoded fallback values — all config must come from EXPO_PUBLIC_* env vars
// baked in at build time via eas.json build.*.env or a local .env file.
// If a key is missing, getFirebaseWebConfig() logs a warning and Firebase will
// fail gracefully on first use (auth won't work — which is the correct behaviour
// for a misconfigured build, rather than silently using stale credentials).
const FALLBACK_ENV: Record<string, never> = {};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '') + '/';
}

const ENV = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
  EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST,
} as const;

function getEnv(name: string): string | undefined {
  const rawValue = ENV[name as keyof typeof ENV] ?? FALLBACK_ENV[name as keyof typeof FALLBACK_ENV];
  let value = typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue.trim() : undefined;
  
  // Auto-translate localhost for Android emulator networking
  if (value && Platform.OS === 'android' && value.includes('localhost')) {
    value = value.replace(/localhost/g, '10.0.2.2');
  } else if (value && Platform.OS === 'android' && value.includes('127.0.0.1')) {
    value = value.replace(/127\.0\.0\.1/g, '10.0.2.2');
  }

  return value;
}

export function getExplicitApiUrl(): string | undefined {
  const apiUrl = getEnv('EXPO_PUBLIC_API_URL');
  return apiUrl ? normalizeBaseUrl(apiUrl) : undefined;
}

export function getMissingFirebaseEnvKeys(): RequiredFirebaseEnvKey[] {
  return REQUIRED_FIREBASE_KEYS.filter((key) => !getEnv(key));
}

/**
 * True when all six `EXPO_PUBLIC_FIREBASE_*` web keys are set and the API key is not a
 * short placeholder (e.g. `mock_api_key` from `npm run build-web:with-mock-firebase`). Prevents
 * `getAuth()` from throwing `auth/invalid-api-key` at module load.
 */
export function isFirebaseWebClientReady(): boolean {
  if (getMissingFirebaseEnvKeys().length > 0) return false;
  const apiKey = (getEnv('EXPO_PUBLIC_FIREBASE_API_KEY') ?? '').trim();
  if (apiKey.length < 30) return false;
  return true;
}

export function getFirebaseWebConfig() {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length > 0) {
    console.warn(
      '[CulturePass] Missing Firebase environment variables: ' + missing.join(', ') +
      '. Firebase services (Auth, Firestore, Storage) will not work.' +
      ' The app will not be functional until these variables are configured in .env and EAS build profiles.'
    );
  }

  return {
    apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY') ?? '',
    authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? '',
    projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') ?? '',
    storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? '',
    messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ?? '',
    appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID') ?? '',
  };
}

export function shouldUseFirebaseEmulators(): boolean {
  return getEnv('EXPO_PUBLIC_USE_FIREBASE_EMULATORS') === 'true';
}

export function getFirebaseEmulatorHost(): string {
  return getEnv('EXPO_PUBLIC_FIREBASE_EMULATOR_HOST') ?? '127.0.0.1';
}
