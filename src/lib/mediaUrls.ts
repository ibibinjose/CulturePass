import { Platform } from 'react-native';
import { getFirebaseEmulatorHost, shouldUseFirebaseEmulators } from '@/lib/config';

/**
 * Rewrites Firebase Storage emulator HTTP URLs so each native runtime can reach the host machine.
 * - Android emulator: `127.0.0.1` / `localhost` → `10.0.2.2`
 * - iOS (esp. physical device): when `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` is your Mac’s LAN IP,
 *   replaces loopback host so ATS + routing reach the emulator.
 *
 * Production `https://` URLs are returned unchanged.
 */
export function normalizeRemoteImageUri(uri: string | undefined | null): string | undefined {
  if (uri == null || uri === '') return undefined;
  if (!__DEV__ || !shouldUseFirebaseEmulators()) return uri;
  if (!uri.startsWith('http://')) return uri;

  try {
    const url = new URL(uri);
    const host = url.hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') return uri;

    if (Platform.OS === 'android') {
      url.hostname = '10.0.2.2';
      return url.toString();
    }

    if (Platform.OS === 'ios') {
      const lan = getFirebaseEmulatorHost();
      if (lan && lan !== '127.0.0.1' && lan !== 'localhost') {
        url.hostname = lan;
        return url.toString();
      }
    }
  } catch {
    return uri;
  }

  return uri;
}
