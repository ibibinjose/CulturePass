/**
 * Sentry Initialization - Browser/Web
 *
 * This file is only used by the Expo web build.
 * It mirrors the native Sentry setup while using the browser-compatible package.
 */
import * as Sentry from '@sentry/react';
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

  const release =
    Constants.expoConfig?.version ||
    process.env.EXPO_PUBLIC_RELEASE ||
    'development';

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? 'development' : process.env.EXPO_PUBLIC_ENV || 'production',
    release: `${release}@${Platform.OS}`,
    autoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: isDev ? 1.0 : 0.1,
    beforeSend(event, hint) {
      if (isDev && !process.env.EXPO_PUBLIC_FORCE_SENTRY) {
        return null;
      }

      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },
    integrations: (integrations) =>
      integrations.filter((integration) => {
        return !['Console', 'DebugSymbolicator'].includes(integration.name);
      }),
  });

  Sentry.setTag('platform', Platform.OS);
  Sentry.setTag('app_version', Constants.expoConfig?.version || 'unknown');

  if (!isDev) {
    console.log('[Sentry] Initialized successfully');
  }
}

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

export function captureException(error: unknown, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

export { Sentry };
