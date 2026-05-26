/**
 * Request ID Middleware
 *
 * Generates a unique request ID for every incoming request.
 * This enables end-to-end tracing across logs, Sentry, and client responses.
 *
 * Industry standard practice (used by Google, Amazon, etc.).
 */

import { type Request, type Response, type NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { setCorrelationId } from '../lib/logger';

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${randomBytes(6).toString('hex')}`;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const requestId = existingId || generateRequestId();

  req.requestId = requestId;

  // Set in our structured logger so all subsequent logs get the ID
  setCorrelationId(requestId);

  // Also set as Sentry tag for this request scope
  // (Sentry will automatically include it in events from this request)
  try {
    // Dynamic import to avoid issues if Sentry not initialized in some contexts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.setTag('request_id', requestId);
  } catch {
    // Sentry not available or not initialized — safe to ignore
  }

  // Expose the ID to the client for support/debugging
  _res.setHeader('X-Request-ID', requestId);

  next();
}