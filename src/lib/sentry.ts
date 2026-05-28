/**
 * Sentry Initialization - World-Class Observability
 *
 * This module provides a single source of truth for error tracking,
 * performance monitoring, and user context across the entire app
 * (iOS, Android, Web).
 *
 * Industry standards followed:
 * - Proper environment & release tracking
 * - User context (id, role, username)
 * - Breadcrumbs for key user actions
 * - Integration with React Query & custom ErrorBoundaries
 * - Graceful degradation if DSN is missing (dev-friendly)
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn;

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

export function initSentry() {
  if (!SENTRY_DSN) {
    if (!isDev) {
      console.warn('[Sentry] No DSN provided. Error tracking disabled in production.');
    }
    return;
  }

  // Release name must match what you create via release hook or sentry-cli in CI.
  // Recommended: "1.3.0-b27@ios" (use EXPO_PUBLIC_RELEASE in CI for richer versions).
  const release =
    process.env.EXPO_PUBLIC_RELEASE ||
    Constants.expoConfig?.version ||
    'development';

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? 'development' : (process.env.EXPO_PUBLIC_ENV || 'production'),
    release: `${release}@${Platform.OS}`,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: isDev ? 1.0 : 0.1, // Lower in prod
    enableNative: true,
    enableNativeCrashHandling: true,
    enableNativeNagger: false,

    // Performance
    enableUserInteractionTracing: true,

    // Before sending events
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly wanted
      if (isDev && !process.env.EXPO_PUBLIC_FORCE_SENTRY) {
        return null;
      }

      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },

    integrations: (integrations) => {
      // Remove default integrations we don't want
      return integrations.filter((integration) => {
        return !['Console', 'DebugSymbolicator'].includes(integration.name);
      });
    },
  });

  // Set initial context
  Sentry.setTag('platform', Platform.OS);
  Sentry.setTag('app_version', Constants.expoConfig?.version || 'unknown');

  if (!isDev) {
    console.log('[Sentry] Initialized successfully');
  }
}

/**
 * Set user context on login / auth change.
 * Call this from AuthProvider when user state changes.
 */
export function setSentryUser(user: {
  id: string;
  username?: string;
  role?: string;
  email?: string;
} | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  Sentry.setTag('user_role', user.role || 'user');
}

/**
 * Capture a handled error with extra context.
 * Use this instead of console.error for important errors.
 */
export function captureException(error: unknown, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Add a breadcrumb for important user actions.
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

// Re-export Sentry for direct use where needed (e.g. ErrorBoundary)
export { Sentry };