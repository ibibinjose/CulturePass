import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { QueryClient, QueryFunction, QueryCache } from '@tanstack/react-query';
import { ApiError } from '@/platform/api/client';
import { Sentry } from '@/lib/sentry';
import { log, getCorrelationId } from '@/lib/logger';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getExplicitApiUrl,
  getFirebaseEmulatorHost,
  getFirebaseWebConfig,
  shouldUseFirebaseEmulators,
} from '@/lib/config';

/**
 * CulturePass Sydney Query Client v2.0
 * Sydney API + Kerala diaspora optimized
 */

// Module-level token store — set by AuthProvider via setAccessToken().
// This avoids calling useAuth() outside a React component (hook rule violation).
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// Optional token refresher — injected by AuthProvider so apiRequest can
// self-heal on 401 responses without importing Firebase directly.
let _tokenRefresher: (() => Promise<string | null>) | null = null;

export function setTokenRefresher(fn: (() => Promise<string | null>) | null): void {
  _tokenRefresher = fn;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '') + '/';
}

/**
 * Base URL for the Functions-hosted HTTP API (Express `api` function).
 * - Production / preview: EXPO_PUBLIC_API_URL or same-origin `/api` on hosted web
 * - Local web: explicit URL, or Functions emulator (5001) when emulators enabled,
 *   else legacy `server-dev.ts` on 5050
 */
function localFunctionsEmulatorApiBase(host: string): string {
  const projectId = getFirebaseWebConfig().projectId;
  return normalizeBaseUrl(`http://${host}:5001/${projectId}/australia-southeast1/api`);
}

/**
 * True when EXPO_PUBLIC_API_URL points at the local Firebase Functions emulator HTTP
 * entry (port 5001, …/australia-southeast1/api). The emulator process sets FIREBASE_AUTH_EMULATOR_HOST;
 * Firebase Admin then verifies ID tokens against the Auth emulator. Tokens from
 * production Firebase Auth (client with EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== 'true')
 * will always fail → 401 "Authentication required." on /api/auth/me.
 */
function isFunctionsEmulatorHttpApiBase(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const loopbackHost =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '[::1]' ||
      u.hostname === '10.0.2.2';
    if (!loopbackHost || u.port !== '5001') return false;
    return u.pathname.includes('/australia-southeast1/api');
  } catch {
    return false;
  }
}

function hostedCloudFunctionsApiBase(): string | null {
  const projectId = getFirebaseWebConfig().projectId;
  if (!projectId) return null;
  return normalizeBaseUrl(`https://australia-southeast1-${projectId}.cloudfunctions.net/api`);
}

let _cachedApiUrl: string | null = null;

function resolveApiUrl(): string {
  const explicit = getExplicitApiUrl();

  // Production Auth + Functions emulator URL → token verification always fails on the server.
  if (explicit && !shouldUseFirebaseEmulators()) {
    const normalizedExplicit = normalizeBaseUrl(explicit);
    if (isFunctionsEmulatorHttpApiBase(normalizedExplicit)) {
      const hosted = hostedCloudFunctionsApiBase();
      if (hosted) {
        if (__DEV__) {
          console.warn(
            '[api] EXPO_PUBLIC_API_URL targets the Functions emulator (:5001) but EXPO_PUBLIC_USE_FIREBASE_EMULATORS is not true.',
            'The app uses production Firebase Auth; use hosted Cloud Functions for API calls:',
            hosted,
            'To hit :5001 instead, set EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true and run the full emulator suite (including Auth).',
          );
        }
        return hosted;
      }
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    // Hosted web should use same-origin `/api` rewrites to avoid cross-origin
    // CORS drift between Firebase Hosting and direct Functions domains.
    if (!isLocalhost) {
      return normalizeBaseUrl(window.location.origin);
    }

    if (explicit) {
      return normalizeBaseUrl(explicit);
    }

    if (shouldUseFirebaseEmulators()) {
      const host = getFirebaseEmulatorHost();
      const base = localFunctionsEmulatorApiBase(host);
      if (__DEV__) {
        console.log('[api] Local web + emulators →', base);
      }
      return base;
    }

    if (__DEV__) {
      console.warn(
        '[api] EXPO_PUBLIC_API_URL not set on localhost — falling back to http://localhost:5050 (server-dev).',
        'For Firebase emulator use EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true, or set EXPO_PUBLIC_API_URL to production.',
      );
    }
    return normalizeBaseUrl('http://localhost:5050');
  }

  if (explicit) return normalizeBaseUrl(explicit);

  const EMULATOR_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  if (Platform.OS !== 'web') {
    if (!__DEV__) {
      throw new Error('EXPO_PUBLIC_API_URL must be configured for production builds.');
    }
    if (shouldUseFirebaseEmulators()) {
      const host = Platform.OS === 'android' ? '10.0.2.2' : getFirebaseEmulatorHost();
      return localFunctionsEmulatorApiBase(host);
    }
    // Native dev without an explicit API URL should still work out of the box.
    // Prefer hosted Cloud Functions when Firebase project config is available
    // instead of loopback-only localhost fallbacks that fail on physical devices.
    const hosted = hostedCloudFunctionsApiBase();
    if (hosted) {
      if (__DEV__) {
        console.warn(
          '[api] EXPO_PUBLIC_API_URL not set — falling back to hosted Cloud Functions:',
          hosted,
        );
      }
      return hosted;
    }
    console.warn(`[api] EXPO_PUBLIC_API_URL not set — falling back to http://${EMULATOR_HOST}:5050. Set it in .env to use the Firebase emulator or production API.`);
    return normalizeBaseUrl(`http://${EMULATOR_HOST}:5050`);
  }

  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (host) return normalizeBaseUrl(`https://${host}`);

  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }

  return normalizeBaseUrl(`http://${EMULATOR_HOST}:5050`);
}

export function resetApiUrlCache(): void {
  _cachedApiUrl = null;
}

export function getApiUrl(): string {
  if (_cachedApiUrl) return _cachedApiUrl;
  const resolved = resolveApiUrl();
  _cachedApiUrl = resolved;
  return resolved;
}

function normalizeRoute(route: string): string {
  return route.startsWith('/') ? route.slice(1) : route;
}

function routeForBase(baseUrl: string, route: string): string {
  const cleanedRoute = normalizeRoute(route);
  const basePath = new URL(baseUrl).pathname.replace(/\/+$/, '');
  const baseHasApiPrefix = basePath.endsWith('/api');
  const routeHasApiPrefix = cleanedRoute.startsWith('api/');

  // If the base URL exported by the Cloud Function already ends in /api,
  // we must ensure we don't send /api/api/... by stripping it from the route.
  if (baseHasApiPrefix && routeHasApiPrefix) {
    return cleanedRoute.slice(4);
  }

  // If we are hitting a Hosting rewrite (base is just root /) 
  // but the route is missing the api/ prefix, we might want to add it?
  // Our api.ts always includes it, so we're safe.

  return cleanedRoute;
}

export function buildApiUrl(route: string): string {
  const baseUrl = getApiUrl();
  const normalizedRoute = routeForBase(baseUrl, route);
  return new URL(normalizedRoute, baseUrl).toString();
}

export async function throwIfResNotOk(res: Response): Promise<void> {
  if (res.ok) return;

  let errorText = res.statusText;
  try {
    errorText = await res.text();
  } catch {}

  const error = new Error(`${res.status}: ${errorText} (${res.url})`) as Error & { status: number; response: string };
  error.status = res.status;
  error.response = errorText;
  throw error;
}

/**
 * Auth-aware API request. Reads token from module-level store (set by AuthProvider)
 * rather than calling useAuth() which would violate React hook rules.
 *
 * On 401: attempts one token refresh via _tokenRefresher (injected by AuthProvider)
 * and retries the request. If the retry also fails, the error is re-thrown.
 */
const API_TIMEOUT_MS = 30_000; // 30 second timeout for API requests

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  route: string,
  data?: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {},
  _isRetry = false
): Promise<Response> {
  const url = new URL(buildApiUrl(route));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  // expo/fetch uses FetchRequestInit which rejects null signal — strip it out.
  const { signal: callerSignal, ...safeOptions } = options as RequestInit & { signal?: AbortSignal | null };
  const credentials = Platform.OS === 'web' ? 'include' : safeOptions.credentials;

  // Use caller's signal if provided, otherwise create a timeout signal.
  // Some runtimes (including certain Expo environments) do not implement AbortSignal.timeout.
  let signal = callerSignal ?? undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (!signal) {
    const timeoutCapableAbortSignal =
      typeof AbortSignal !== 'undefined'
      && typeof (AbortSignal as typeof AbortSignal & { timeout?: (ms: number) => AbortSignal }).timeout === 'function';

    if (timeoutCapableAbortSignal) {
      signal = (AbortSignal as typeof AbortSignal & { timeout: (ms: number) => AbortSignal }).timeout(API_TIMEOUT_MS);
    } else {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      signal = controller.signal;
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...safeOptions,
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials,
      signal,
    } as Parameters<typeof fetch>[1]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // On 401, attempt a token refresh and retry once.
  if (res.status === 401 && !_isRetry && _tokenRefresher) {
    try {
      const newToken = await _tokenRefresher();
      if (newToken) {
        return apiRequest(method, route, data, options, true);
      }
    } catch {
      // Refresh failed — fall through to throwIfResNotOk which will throw 401.
    }
  }

  await throwIfResNotOk(res);
  return res;
}

/**
 * Multipart upload (e.g. images). Does not set Content-Type — the runtime sets the boundary.
 * Uses the same auth + 401 refresh behaviour as apiRequest.
 */
export async function apiRequestMultipart(
  method: 'POST' | 'PUT',
  route: string,
  formData: FormData,
  options: Omit<RequestInit, 'method' | 'body'> = {},
  _isRetry = false
): Promise<Response> {
  const url = new URL(buildApiUrl(route));
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) {
    headers.Authorization = `Bearer ${_accessToken}`;
  }

  const { signal: callerSignal, ...safeOptions } = options as RequestInit & { signal?: AbortSignal | null };
  const credentials = Platform.OS === 'web' ? 'include' : safeOptions.credentials;

  let signal = callerSignal ?? undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (!signal) {
    const timeoutCapableAbortSignal =
      typeof AbortSignal !== 'undefined'
      && typeof (AbortSignal as typeof AbortSignal & { timeout?: (ms: number) => AbortSignal }).timeout === 'function';

    if (timeoutCapableAbortSignal) {
      signal = (AbortSignal as typeof AbortSignal & { timeout: (ms: number) => AbortSignal }).timeout(API_TIMEOUT_MS);
    } else {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      signal = controller.signal;
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...safeOptions,
      method,
      headers,
      body: formData,
      credentials,
      signal,
    } as Parameters<typeof fetch>[1]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (res.status === 401 && !_isRetry && _tokenRefresher) {
    try {
      const newToken = await _tokenRefresher();
      if (newToken) {
        return apiRequestMultipart(method, route, formData, options, true);
      }
    } catch {
      // fall through
    }
  }

  await throwIfResNotOk(res);
  return res;
}

// In-process request cache (5 min TTL)
const _cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function apiRequestCached(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  route: string,
  data?: unknown
): Promise<unknown> {
  const cacheKey = `${method}:${route}:${JSON.stringify(data ?? {})}`;
  const cached = _cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await apiRequest(method, route, data);
  const json = await res.json();

  _cache.set(cacheKey, { data: json, timestamp: Date.now() });
  return json;
}

type UnauthorizedBehavior = 'returnNull' | 'throw' | 'redirect';

export const getQueryFn: <T>(
  options: { on401: UnauthorizedBehavior }
) => QueryFunction<T> = ({ on401 }) => async ({ queryKey }) => {
  const route = Array.isArray(queryKey) ? queryKey.join('/') : String(queryKey);
  const res = await fetch(buildApiUrl(route), {
    headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : undefined,
    credentials: Platform.OS === 'web' ? 'include' : undefined,
  });

  if (res.status === 401) {
    if (on401 === 'returnNull') return null as any;
    if (on401 === 'redirect') {
      router.replace('/(onboarding)/login');
      return null as any;
    }
  }

  await throwIfResNotOk(res);
  return res.json();
};

/**
 * No retry on 4xx — only retry transient network/server errors.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;

  if (error instanceof Error) {
    const match = error.message.match(/^(\d{3}):/);
    if (match && parseInt(match[1]) >= 400 && parseInt(match[1]) < 500) {
      return false;
    }
  }

  return true;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const queryKeyStr = JSON.stringify(query.queryKey);

      if (error instanceof ApiError) {
        if (error.isServerError) {
          log.error('Query server error', error, {
            queryKey: queryKeyStr,
            status: error.status,
            correlationId: getCorrelationId(),
          });
        } else if (error.isRateLimited) {
          log.warn('Query rate limited', undefined, {
            queryKey: queryKeyStr,
          });
        }
      } else if (error instanceof Error) {
        log.error('Unexpected query error', error, {
          queryKey: queryKeyStr,
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: shouldRetry,
      refetchOnWindowFocus: Platform.OS === 'web',
      refetchInterval: false,
      networkMode: 'online',
    },
    mutations: {
      retry: 2,
      onMutate: async () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  // Use a custom key to avoid colliding with other AsyncStorage items
  key: 'CULTUREPASS_QUERY_CACHE_V1',
  // Limit cached data to avoid blowing up storage limits (10MB limit in AsyncStorage usually, we go 5MB)
  throttleTime: 1000,
});

export function invalidateSydneyQueries() {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey.some(
        (key) =>
          String(key).toLowerCase().includes('sydney') ||
          String(key).toLowerCase().includes('event')
      ),
  });
}

export function invalidateUserQueries(userId: string) {
  queryClient.invalidateQueries({ queryKey: ['user', userId] });
  queryClient.invalidateQueries({ queryKey: ['profile', userId] });
}

export function preheatSydneyData() {
  queryClient.prefetchQuery({
    queryKey: ['sydneyEvents'],
    queryFn: () => apiRequestCached('GET', 'api/events?city=sydney'),
  });
}
