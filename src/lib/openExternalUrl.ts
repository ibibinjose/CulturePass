import { Alert, Linking } from 'react-native';

/** Ensure share / wallet URLs open reliably (adds https when scheme omitted). */
export function normalizeHttpUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return `https://${t}`;
}

const ALLOWED_EXTERNAL_PROTOCOLS = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
  'webcal:',
  'culturepass:',
]);

export function isSafeExternalUrl(url: string): boolean {
  const normalized = normalizeHttpUrl(url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return false;
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname) return false;
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Open a URL in the system browser / host app. For http(s), skips `canOpenURL` so iOS does not
 * block universal links / Wallet redirects.
 */
export async function openExternalUrl(
  url: string,
  options?: { failureTitle?: string },
): Promise<boolean> {
  const normalized = normalizeHttpUrl(url);
  if (!normalized) return false;

  const fail = (msg: string) => {
    Alert.alert(options?.failureTitle ?? 'Could not open link', msg);
  };

  if (!isSafeExternalUrl(normalized)) {
    fail('This link is not supported.');
    return false;
  }

  try {
    const isHttp = /^https?:\/\//i.test(normalized);
    if (!isHttp) {
      const supported = await Linking.canOpenURL(normalized);
      if (!supported) {
        fail('This device cannot open that type of link.');
        return false;
      }
    }
    await Linking.openURL(normalized);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Something went wrong.';
    fail(msg);
    return false;
  }
}
