/**
 * Structured Logger for CulturePass Client
 *
 * Industry-standard logging:
 * - Levels: debug, info, warn, error
 * - Structured output (objects)
 * - Automatic Sentry integration for errors/warns
 * - Correlation ID support (for request tracing)
 * - Environment-aware (clean in prod, verbose in dev)
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('User action', { action: 'purchase', amount: 1999 });
 *   log.error('API failed', error, { endpoint: '/events' });
 */

import { Sentry, addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

function shouldLog(level: LogLevel): boolean {
  if (isDev) return true;
  // In production, still log warnings and errors
  return level === 'warn' || level === 'error';
}

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...context,
    platform: 'client',
  };
}

export const log = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog('debug')) return;
    const payload = formatMessage('debug', message, context);
    console.debug('[DEBUG]', message, context ?? '');
    // In dev, we can add to Sentry as breadcrumb
    if (isDev) {
      addBreadcrumb(message, 'debug', context);
    }
  },

  info(message: string, context?: LogContext) {
    if (!shouldLog('info')) return;
    const payload = formatMessage('info', message, context);
    console.log('[INFO]', message, context ?? '');
    addBreadcrumb(message, 'info', context);
  },

  warn(message: string, error?: unknown, context?: LogContext) {
    if (!shouldLog('warn')) return;
    const payload = formatMessage('warn', message, { ...context, error: error ? String(error) : undefined });
    console.warn('[WARN]', message, error ?? '', context ?? '');

    addBreadcrumb(message, 'warning', { ...context, error: error ? String(error) : undefined });

    if (error) {
      Sentry.captureException(error, {
        level: 'warning',
        extra: { message, ...context },
      });
    } else {
      Sentry.captureMessage(message, 'warning');
    }
  },

  error(message: string, error: unknown, context?: LogContext) {
    if (!shouldLog('error')) return;
    const payload = formatMessage('error', message, { ...context, error: error ? String(error) : undefined });
    console.error('[ERROR]', message, error, context ?? '');

    addBreadcrumb(message, 'error', { ...context, error: error ? String(error) : undefined });

    Sentry.captureException(error, {
      level: 'error',
      extra: { message, ...context },
    });
  },

  /**
   * Log an important user action as a breadcrumb (lightweight).
   */
  action(action: string, context?: LogContext) {
    addBreadcrumb(`User action: ${action}`, 'user-action', context);
    if (isDev) {
      console.log(`[ACTION] ${action}`, context ?? '');
    }
  },
};

/**
 * Set a correlation ID for the current "session" or request chain.
 * Useful when chaining multiple async operations.
 */
let currentCorrelationId: string | null = null;

export function setCorrelationId(id: string | null) {
  currentCorrelationId = id;
  if (id) {
    Sentry.setTag('correlation_id', id);
  }
}

export function getCorrelationId(): string | null {
  return currentCorrelationId;
}

// Convenience re-exports
export { addBreadcrumb };