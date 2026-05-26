/**
 * Structured Logger for CulturePass Backend (Firebase Functions)
 *
 * Combines:
 * - firebase-functions logger (for Cloud Logging / GCP)
 * - Sentry for error tracking
 * - Correlation / request IDs for tracing
 *
 * Usage:
 *   import { log } from './logger';
 *   log.info('User signed up', { userId });
 *   log.error('Payment failed', error, { orderId });
 */

import { logger as firebaseLogger } from 'firebase-functions';
import * as Sentry from '@sentry/node';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

let currentCorrelationId: string | null = null;

export function setCorrelationId(id: string | null) {
  currentCorrelationId = id;
  if (id) {
    Sentry.setTag('correlation_id', id);
  }
}

function enrich(context?: LogContext) {
  return {
    ...context,
    correlationId: currentCorrelationId ?? undefined,
    timestamp: new Date().toISOString(),
  };
}

export const log = {
  debug(message: string, context?: LogContext) {
    firebaseLogger.debug(message, enrich(context));
  },

  info(message: string, context?: LogContext) {
    firebaseLogger.info(message, enrich(context));
    Sentry.addBreadcrumb({
      message,
      category: 'backend',
      level: 'info',
      data: context,
    });
  },

  warn(message: string, error?: unknown, context?: LogContext) {
    const enriched = enrich({ ...context, error: error ? String(error) : undefined });
    firebaseLogger.warn(message, enriched);

    Sentry.addBreadcrumb({
      message,
      category: 'backend',
      level: 'warning',
      data: enriched,
    });

    if (error) {
      Sentry.captureException(error, { level: 'warning', extra: enriched });
    }
  },

  error(message: string, error: unknown, context?: LogContext) {
    const enriched = enrich({ ...context, error: error ? String(error) : undefined });
    firebaseLogger.error(message, enriched);

    Sentry.addBreadcrumb({
      message,
      category: 'backend',
      level: 'error',
      data: enriched,
    });

    Sentry.captureException(error, { level: 'error', extra: enriched });
  },
};

// Re-export for convenience
