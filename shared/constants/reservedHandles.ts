/**
 * Canonical reserved profile handles — used by client validation and Cloud Functions.
 * Keep this list in sync across the app; do not duplicate elsewhere.
 */

/** Sorted, deduplicated reserved handles (lowercase). */
export const RESERVED_HANDLES_LIST = [
  'admin',
  'administrator',
  'api',
  'app',
  'billing',
  'blog',
  'community',
  'contact',
  'culture-pass',
  'culturepass',
  'dashboard',
  'docs',
  'events',
  'explore',
  'ftp',
  'help',
  'home',
  'host-space',
  'hostspace',
  'info',
  'localhost',
  'login',
  'logout',
  'mail',
  'marketplace',
  'me',
  'moderator',
  'notifications',
  'official',
  'privacy',
  'profile',
  'register',
  'root',
  'search',
  'security',
  'settings',
  'signup',
  'staff',
  'status',
  'superuser',
  'support',
  'system',
  'team',
  'terms',
  'test',
  'user',
  'users',
  'verified',
  'www',
] as const;

export const RESERVED_HANDLES: ReadonlySet<string> = new Set(RESERVED_HANDLES_LIST);

export function isReservedHandle(handle: string): boolean {
  const normalized = handle.trim().toLowerCase();
  if (!normalized) return false;
  return RESERVED_HANDLES.has(normalized);
}
