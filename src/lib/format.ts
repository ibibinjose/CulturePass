import { ApiError } from '@/lib/api';

/**
 * Formats a city/country pair into a display label.
 * Replaces 18+ inline `[city, country].filter(Boolean).join(', ')` patterns.
 */
export function formatLocationLabel(city?: string | null, country?: string | null, fallback = 'your region'): string {
  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallback;
}

/**
 * Extracts a user-facing error message from an API error or generic Error.
 * Replaces 10+ inline `err instanceof ApiError ? ... : ...` patterns.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (err.isUnauthorized) return 'Please sign in again to continue.';
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Returns true if the error is an auth error requiring redirect.
 */
export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && !!err.isUnauthorized;
}

/**
 * Formats an ISO date string to a short display format.
 * Replaces 15+ inline `new Date(iso).toLocaleDateString(undefined, {...})` patterns.
 */
export function formatShortDate(iso: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return typeof iso === 'string' ? iso : '';
  return d.toLocaleDateString(undefined, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats an ISO date to "14 Apr" style (no year).
 */
export function formatCompactDate(iso: string | Date): string {
  return formatShortDate(iso, { day: 'numeric', month: 'short' });
}
