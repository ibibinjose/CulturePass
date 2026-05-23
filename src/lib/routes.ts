/** Exact path replacements (no trailing slash). */
const LEGACY_EXACT_PATHS: Record<string, string> = {
  '/activities': '/activities',
  '/restaurants': '/restaurants',
  '/movies': '/movies',
  '/shopping': '/shopping',
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
] as const;

const TRUSTED_DEEP_LINK_HOSTS = new Set([
  'culturepass.app',
  'www.culturepass.app',
  'culturekerala.com',
  'www.culturekerala.com',
]);

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
      pathToNormalize = TRUSTED_DEEP_LINK_HOSTS.has(parsed.hostname)
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
  if (!candidate) return null;
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
    return null;
  }

  const normalized = remapLegacyPath(candidate);
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
