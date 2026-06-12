import { normalizeTabShortcut } from '@/lib/onboardingDestination';

function listingLegacyEntityToCategory(
  entityType: string | null,
  subCategory: string | null,
): string {
  if (subCategory) {
    const normalized = subCategory.toLowerCase().replace(/\s+/g, '_');
    if (normalized === 'dining' || normalized === 'movie' || normalized === 'art') return normalized;
    if (normalized === 'travel' || normalized === 'shopping') return normalized;
  }
  if (!entityType) return 'business';
  const et = entityType.toLowerCase();
  if (et === 'restaurant') return 'dining';
  if (et === 'community') return 'community';
  if (et === 'event') return 'event';
  if (et === 'organizer' || et === 'organiser') return 'organizer';
  return et;
}

/** Exact path replacements (no trailing slash). */
const LEGACY_EXACT_PATHS: Record<string, string> = {
  '/activities': '/activities',
  '/restaurants': '/restaurants',
  '/movies': '/movies',
  '/shopping': '/shopping',
  '/my-space': '/myspace',
  '/MySpace': '/myspace',
};

export const LEGACY_ROUTE_REMAPS = [
  ['/venue/', '/v/'],
  ['/artist/', '/t/'],
  ['/artists/', '/t/'],
  ['/organiser/', '/o/'],
  ['/organizer/', '/o/'],
  ['/events/', '/e/'],
  ['/communities/', '/c/'],
  ['/community/', '/c/'],
  ['/event/', '/e/'],
  ['/profiles/', '/profile/'],
  ['/tickets/', '/tickets/'],
  ['/users/', '/u/'],
  ['/user/', '/u/'],
  ['/businesses/', '/business/'],
  ['/business/', '/b/'],
  ['/restaurant/', '/business/'],
  ['/restaurants/', '/business/'],
  ['/movie/', '/event/'],
  ['/movies/', '/event/'],
  ['/shop/', '/CultureMarket/'],
  ['/perk/', '/perks/'],
  ['/activity/', '/activities/'],
] as const;

const TRUSTED_DEEP_LINK_HOSTS = new Set([
  'culturepass.app',
  'www.culturepass.app',
  'culturekerala.com',
  'www.culturekerala.com',
]);

function isTrustedHost(host: string): boolean {
  const h = host.toLowerCase().trim();
  if (TRUSTED_DEEP_LINK_HOSTS.has(h)) return true;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.local')) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  return false;
}

type RedirectValue = string | string[] | null | undefined;

export function remapLegacyPath(path: string): string {
  if (!path) return '/';

  const [rawPath, rawQuery] = path.split('?');
  let cleanPath = rawPath || '/';
  const querySuffix = rawQuery ? `?${rawQuery}` : '';

  const exact = LEGACY_EXACT_PATHS[cleanPath];
  if (exact) {
    cleanPath = exact;
  }

  if (cleanPath === '/pages/create/listing' || cleanPath === '/hostspace/create/listing') {
    return `/hostspace/listing${querySuffix}`;
  }

  if (cleanPath === '/event/create') {
    return `/hostspace/event/create${querySuffix}`;
  }

  if (cleanPath === '/listing/create') {
    const qs = new URLSearchParams(querySuffix.replace(/^\?/, ''));
    const entityType = qs.get('listingEntityType');
    const subCategory = qs.get('listingSubCategory');
    const category = listingLegacyEntityToCategory(entityType, subCategory);
    qs.delete('listingEntityType');
    qs.delete('listingSubCategory');
    const remaining = qs.toString();
    const suffix = remaining ? `?${remaining}` : '';
    return `/hostspace/${category}/create${suffix}`;
  }

  if (cleanPath === '/pages/create' || cleanPath === '/hostspace/create') {
    const qs = new URLSearchParams(querySuffix.replace(/^\?/, ''));
    const category = qs.get('category');
    const entityType = qs.get('entityType');
    qs.delete('category');
    qs.delete('entityType');
    qs.delete('panel');
    const remaining = qs.toString();
    const suffix = remaining ? `?${remaining}` : '';
    if (category) return `/hostspace/${category}/create${suffix}`;
    if (entityType) {
      const mapped =
        entityType === 'organizer' || entityType === 'organiser' ? 'organizer' : entityType;
      return `/hostspace/${mapped}/create${suffix}`;
    }
    return `/hostspace/create${suffix}`;
  }

  if (cleanPath.startsWith('/hostspace/create/')) {
    const segment = cleanPath.slice('/hostspace/create/'.length).split('/')[0];
    if (segment === 'listing') return `/hostspace/listing${querySuffix}`;
    if (segment === 'page' || !segment) return `/hostspace/create${querySuffix}`;
    return `/hostspace/${segment}/create${querySuffix}`;
  }

  if (cleanPath.startsWith('/pages/create/')) {
    const segment = cleanPath.slice('/pages/create/'.length).split('/')[0];
    if (segment === 'listing') return `/hostspace/listing${querySuffix}`;
    if (!segment) return `/hostspace/create${querySuffix}`;
    return `/hostspace/${segment}/create${querySuffix}`;
  }

  if (cleanPath === '/hostspace') {
    const qs = new URLSearchParams(querySuffix.replace(/^\?/, ''));
    if (qs.get('panel') === 'create') {
      const category = qs.get('category');
      const entityType = qs.get('entityType');
      qs.delete('panel');
      qs.delete('category');
      qs.delete('entityType');
      const remaining = qs.toString();
      const suffix = remaining ? `?${remaining}` : '';
      if (category) return `/hostspace/${category}/create${suffix}`;
      if (entityType) {
        const mapped =
          entityType === 'organizer' || entityType === 'organiser' ? 'organizer' : entityType;
        return `/hostspace/${mapped}/create${suffix}`;
      }
      return `/hostspace/create${suffix}`;
    }
  }

  let changed = true;
  let guard = 0;
  while (changed && guard < 16) {
    guard += 1;
    changed = false;
    for (const [from, to] of LEGACY_ROUTE_REMAPS) {
      if (cleanPath.startsWith(from)) {
        cleanPath = cleanPath.replace(from, to);
        changed = true;
        break;
      }
    }
  }

  return `${cleanPath}${querySuffix}`;
}

export function normalizeSystemPath(path: string, initial = false): string {
  if (!path) return '/';

  let pathToNormalize = path.trim();

  try {
    const parsed = new URL(pathToNormalize);
    const protocol = parsed.protocol.replace(':', '');

    if (protocol === 'culturepass') {
      const hostAsPath = parsed.hostname ? `/${parsed.hostname}` : '';
      pathToNormalize = `${hostAsPath}${parsed.pathname}${parsed.search}`;
    } else if (protocol === 'https' || protocol === 'http') {
      pathToNormalize = isTrustedHost(parsed.hostname)
        ? `${parsed.pathname}${parsed.search}`
        : '/';
    }
  } catch {
    // Plain Expo Router paths fall through unchanged.
  }

  const remapped = remapLegacyPath(pathToNormalize);
  const [rawPath, rawQuery] = remapped.split('?');
  const cleanPath = rawPath || '/';
  const querySuffix = rawQuery ? `?${rawQuery}` : '';

  if (initial && cleanPath === '/home') {
    return `/(tabs)${querySuffix}`;
  }

  return `${cleanPath}${querySuffix}`;
}

export function sanitizeInternalRedirect(value: RedirectValue): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== 'string' || !candidate) return null;
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
    return null;
  }

  const normalized = remapLegacyPath(normalizeTabShortcut(candidate));
  const cleanPath = normalized.split('?')[0] || '/';

  // Redirects should always leave the auth/onboarding shell.
  if (cleanPath.startsWith('/(onboarding)') || cleanPath === '/landing') {
    return null;
  }

  return normalized;
}

export function routeWithRedirect(pathname: string, redirectTo: RedirectValue) {
  const safeRedirect = sanitizeInternalRedirect(redirectTo);
  if (!safeRedirect) return pathname;
  return { pathname, params: { redirectTo: safeRedirect } };
}
