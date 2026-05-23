import { ApiError } from '@/lib/api';
import type { FieldErrors } from './config';

type ErrorBodyShape = {
  error?: string;
  message?: string;
  details?: Record<string, string>;
};

function stripUrlSuffix(msg: string): string {
  return msg.replace(/\s*\([^)]*https?:\/\/[^)]+\)\s*$/, '').trim();
}

function tryParseJsonObject(text: string): ErrorBodyShape | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed) as ErrorBodyShape;
  } catch {
    return null;
  }
}

/**
 * Normalises API / network failures from Creator Studio mutations into user-facing copy
 * and optional field-level errors (when the API returns structured `details`).
 */
export function mapSubmitMutationError(err: unknown): {
  networkBanner: string | null;
  fieldPatch: FieldErrors;
} {
  const empty: FieldErrors = {};

  if (err instanceof ApiError) {
    if (err.isUnauthorized) {
      return {
        networkBanner: 'Your session expired. Sign in again and retry.',
        fieldPatch: empty,
      };
    }
    if (err.isForbidden) {
      return {
        networkBanner: 'You do not have permission to create this listing. Request organizer access or use an admin account.',
        fieldPatch: empty,
      };
    }
    if (err.isNetworkError) {
      return {
        networkBanner: 'Could not reach CulturePass. Check your connection, VPN, or try again shortly.',
        fieldPatch: empty,
      };
    }

    let raw = stripUrlSuffix(err.message);
    const parsed = tryParseJsonObject(raw);
    let message = parsed?.error ?? parsed?.message ?? raw;
    if (typeof message !== 'string') message = raw;
    message = message.replace(/^"\s*|\s*"$/g, '').trim();
    if (!message) message = 'Something went wrong. Please try again.';

    const fieldPatch: FieldErrors = {};
    if (parsed?.details && typeof parsed.details === 'object') {
      for (const [k, v] of Object.entries(parsed.details)) {
        if (typeof v === 'string' && v.trim()) {
          const key = k as keyof FieldErrors;
          fieldPatch[key] = v;
        }
      }
    }

    if (err.status >= 500) {
      return {
        networkBanner: 'Our servers had a problem. Please try again in a few minutes.',
        fieldPatch,
      };
    }

    if (Object.keys(fieldPatch).length > 0) {
      return { networkBanner: null, fieldPatch };
    }

    return {
      networkBanner: message.length > 180 ? `${message.slice(0, 177)}…` : message,
      fieldPatch: empty,
    };
  }

  if (err instanceof Error) {
    const msg = err.message || '';
    const isNetworkError =
      msg === 'Failed to fetch' ||
      msg.includes('Network request failed') ||
      msg.includes('ERR_CONNECTION_REFUSED') ||
      msg.includes('aborted') ||
      msg.includes('AbortError');
    if (isNetworkError) {
      return {
        networkBanner: 'Could not reach the server. Check your connection or try again later.',
        fieldPatch: empty,
      };
    }
    const match = msg.match(/^(\d{3}):\s*(.+)/s);
    if (match) {
      const status = parseInt(match[1], 10);
      const synthetic = new ApiError(status, stripUrlSuffix(match[2]));
      return mapSubmitMutationError(synthetic);
    }
    return {
      networkBanner: msg.length > 180 ? `${msg.slice(0, 177)}…` : msg || 'Something went wrong.',
      fieldPatch: empty,
    };
  }

  return {
    networkBanner: 'Something went wrong. Please try again.',
    fieldPatch: empty,
  };
}
