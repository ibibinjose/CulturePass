/**
 * Structured Logger for CulturePass Backend (Firebase Functions)
 *
 * Combines:
 * - firebase-functions logger (for Cloud Logging / GCP)
 * - Correlation / request IDs for tracing
 *
 * Usage:
 *   import { log } from './logger';
 *   log.info('User signed up', { userId });
 *   log.error('Payment failed', error, { orderId });
 */

import { logger as firebaseLogger } from 'firebase-functions';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

let currentCorrelationId: string | null = null;

export function setCorrelationId(id: string | null) {
  currentCorrelationId = id;
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
  },

  warn(message: string, error?: unknown, context?: LogContext) {
    const enriched = enrich({ ...context, error: error ? String(error) : undefined });
    firebaseLogger.warn(message, enriched);
  },

  error(message: string, error: unknown, context?: LogContext) {
    const enriched = enrich({ ...context, error: error ? String(error) : undefined });
    firebaseLogger.error(message, enriched);
  },
};
