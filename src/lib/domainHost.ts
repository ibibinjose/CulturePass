import { Platform } from 'react-native';
import { SITE_ORIGIN } from '@/lib/app-meta';

const KERALA_HOSTS = new Set(['culturekerala.com', 'www.culturekerala.com']);

function currentHostname(): string {
  if (Platform.OS !== 'web') return '';
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

export function isCultureKeralaHost(): boolean {
  return KERALA_HOSTS.has(currentHostname());
}

/** Canonical share / SEO origin: CultureKerala domain when on that host, else culturepass.app */
export function getMarketingWebOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (KERALA_HOSTS.has(h)) {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }
  return SITE_ORIGIN;
}

