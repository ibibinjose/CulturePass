import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const STORE_KEY_ENABLED  = 'biometric_login_enabled';
const STORE_KEY_EMAIL    = 'biometric_login_email';
const STORE_KEY_PASSWORD = 'biometric_login_password';

export type BiometricType = 'faceid' | 'fingerprint' | null;

export interface BiometricCredentials {
  email: string;
  password: string;
}

export interface UseBiometricAuthReturn {
  /** Device has biometric hardware AND the user has enrolled at least one biometric */
  isAvailable: boolean;
  /** User has opted into biometric login for this app */
  biometricEnabled: boolean;
  /** 'faceid' on Face ID devices, 'fingerprint' otherwise */
  biometricType: BiometricType;
  /** Prompt for biometric and return stored credentials on success, null on cancel */
  authenticate: () => Promise<BiometricCredentials | null>;
  /** Store credentials and mark biometric login enabled */
  enableBiometric: (email: string, password: string) => Promise<void>;
  /** Clear stored credentials and disable biometric login */
  disableBiometric: () => Promise<void>;
  /**
   * Show an Alert offering to enable biometric login.
   * Call this after a successful email/password sign-in if biometric is not yet enabled.
   */
  promptToEnable: (email: string, password: string) => Promise<void>;
}

/**
 * Manages biometric (Face ID / Touch ID / fingerprint) login.
 *
 * Credentials are stored in expo-secure-store (iOS Keychain / Android Keystore).
 * Only email/password sign-in accounts can use biometric login — OAuth users
 * (Google, Apple) are not supported.
 *
 * Web is a no-op: all returned values are inert defaults.
 */
export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const available = hasHardware && isEnrolled;
      setIsAvailable(available);

      if (available) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(
          types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
            ? 'faceid'
            : 'fingerprint',
        );
        const stored = await SecureStore.getItemAsync(STORE_KEY_ENABLED);
        setBiometricEnabled(stored === 'true');
      }
    })();
  }, []);

  const enableBiometric = useCallback(async (email: string, password: string) => {
    await SecureStore.setItemAsync(STORE_KEY_EMAIL, email);
    await SecureStore.setItemAsync(STORE_KEY_PASSWORD, password);
    await SecureStore.setItemAsync(STORE_KEY_ENABLED, 'true');
    setBiometricEnabled(true);
  }, []);

  const disableBiometric = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORE_KEY_EMAIL);
    await SecureStore.deleteItemAsync(STORE_KEY_PASSWORD);
    await SecureStore.setItemAsync(STORE_KEY_ENABLED, 'false');
    setBiometricEnabled(false);
  }, []);

  const authenticate = useCallback(async (): Promise<BiometricCredentials | null> => {
    if (Platform.OS === 'web' || !isAvailable) return null;
    const label = biometricType === 'faceid' ? 'Face ID' : 'Touch ID';
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Sign in with ${label}`,
      fallbackLabel: 'Use Password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (!result.success) return null;
    const email    = await SecureStore.getItemAsync(STORE_KEY_EMAIL);
    const password = await SecureStore.getItemAsync(STORE_KEY_PASSWORD);
    if (!email || !password) return null;
    return { email, password };
  }, [isAvailable, biometricType]);

  const promptToEnable = useCallback(
    (email: string, password: string): Promise<void> => {
      if (Platform.OS === 'web' || !isAvailable) return Promise.resolve();
      const label = biometricType === 'faceid' ? 'Face ID' : 'Touch ID';
      return new Promise<void>((resolve) => {
        Alert.alert(
          `Enable ${label}?`,
          `Use ${label} for faster sign-in next time.`,
          [
            { text: 'Not Now', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Enable',
              onPress: async () => {
                await enableBiometric(email, password);
                resolve();
              },
            },
          ],
        );
      });
    },
    [isAvailable, biometricType, enableBiometric],
  );

  return {
    isAvailable,
    biometricEnabled,
    biometricType,
    authenticate,
    enableBiometric,
    disableBiometric,
    promptToEnable,
  };
}
