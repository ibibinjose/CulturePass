/**
 * Route protection rules for AuthGuard — single source of truth for tests + runtime.
 */

const PROTECTED_TOP_LEVEL = new Set([
  'tickets',
  'checkout',
  'payment',
  'saved',
  'settings',
  'membership',
  'submit',
  'scanner',
  'notifications',
  'contacts',
  'admin',
  'network',
  'create',
]);

const PROFILE_PRIVATE_SEGMENTS = new Set(['edit', 'digital-id', 'qr', 'public']);

/** Signed-in user's MySpace shell — not public entity profiles at /profile/[id]. */
export function isPrivateProfileRoute(segments: readonly string[]): boolean {
  if (segments[0] !== 'profile') return false;
  const sub = segments[1];
  if (!sub) return true;
  return PROFILE_PRIVATE_SEGMENTS.has(sub);
}

export function isAuthProtectedRoute(segments: readonly string[]): boolean {
  const top = segments[0];
  if (!top) return false;

  if (isPrivateProfileRoute(segments)) return true;

  if (top === 'membership') {
    const sub = segments[1];
    return !(sub === undefined || sub === 'index' || sub === 'upgrade');
  }

  if (PROTECTED_TOP_LEVEL.has(top)) return true;

  if (top === '(tabs)') {
    const tab = segments[1];
    return tab === 'profile' || tab === 'myspace' || tab === 'perks' || tab === 'calendar';
  }

  if (top === 'event' && segments[1] === 'create') return true;
  if (top === 'pages' && segments[1] === 'create') return true;
  if (top === 'listing' && segments[1] === 'create') return true;

  if (top === 'hostspace') {
    return (
      segments[1] === 'create' ||
      segments[1] === 'listing' ||
      (segments[1] === 'event' && segments[2] === 'create') ||
      (segments[2] === 'create' && Boolean(segments[1]))
    );
  }

  return false;
}