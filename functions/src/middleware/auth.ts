/**
 * Firebase Auth middleware for Cloud Functions.
 *
 * Uses Firebase Admin SDK to verify ID tokens issued by Firebase Auth.
 * Token revocation is checked on every request (checkRevoked: true).
 *
 * Role hierarchy (loosest → strictest):
 *   user  <  organizer = business = sponsor  <  cityAdmin  <  moderator  <  admin = platformAdmin
 *
 * Roles stored as Firebase custom claims: role, tier, city, country
 * Set via:  admin.auth().setCustomUserClaims(uid, { role: 'organizer', ... })
 *
 * Security design notes:
 * - 401 = not authenticated (no/invalid/expired/revoked token)
 * - 403 = authenticated but insufficient permissions
 * - Error responses NEVER expose required roles or internal role names to the client
 * - Token freshness enforced via requireFresh() for mutating sensitive data
 */

import type { Request, Response, NextFunction } from 'express';
import { authAdmin } from '../admin';
import { captureRouteError } from '../handlers/utils';
import { logger } from 'firebase-functions';
import { UserRole } from '../../../shared/schema/common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequestUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  tier?: string;
  city?: string;
  country?: string;
  /** UTC epoch seconds when the token was issued (Firebase `iat` claim) */
  issuedAt: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      accessToken?: string;
      /** Set by `express.json({ verify })` for Stripe webhook signature verification */
      rawBody?: Buffer;
    }
  }
}

// ---------------------------------------------------------------------------
// Role rank table
// ---------------------------------------------------------------------------

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  organizer: 1,
  business: 1,
  sponsor: 1,
  cityAdmin: 2,
  moderator: 3,
  admin: 4,
  platformAdmin: 4,
  superAdmin: 5,
};

function envList(name: string, defaults: string[] = []): string[] {
  return (process.env[name] ?? defaults.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const SUPER_ADMIN_IDS = new Set(envList('SUPER_ADMIN_UIDS', []));
const SUPER_ADMIN_EMAILS = new Set(envList('SUPER_ADMIN_EMAILS', []).map((email) => email.toLowerCase()));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the user's numeric rank. */
export function userRank(user: RequestUser): number {
  if (isBootstrapSuperAdmin(user.id, user.email)) return ROLE_RANK['superAdmin'];
  return ROLE_RANK[user.role] ?? 0;
}

/** True if the user holds admin-level or higher access. */
export function isAdminUser(user: RequestUser): boolean {
  return userRank(user) >= ROLE_RANK['admin'];
}

/** True if the user is a superAdmin or configured bootstrap super-admin. */
export function isSuperAdmin(user: RequestUser): boolean {
  return userRank(user) >= ROLE_RANK['superAdmin'];
}

function isBootstrapSuperAdmin(uid: string, email?: string | null): boolean {
  if (SUPER_ADMIN_IDS.has(uid)) return true;
  return typeof email === 'string' && SUPER_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

/**
 * True if the user owns the resource OR has elevated access.
 * Elevated = moderator, cityAdmin, admin, platformAdmin.
 */
export function isOwnerOrAdmin(user: RequestUser, ownerId: string | null | undefined): boolean {
  if (userRank(user) >= ROLE_RANK['moderator']) return true;
  return !!ownerId && user.id === ownerId;
}

/**
 * True if the user owns the resource OR is a city admin scoped to the same city
 * OR has full admin access.
 */
export function isOwnerOrCityAdmin(
  user: RequestUser,
  ownerId: string | null | undefined,
  resourceCity?: string | null,
): boolean {
  if (isAdminUser(user)) return true;
  if (user.role === 'cityAdmin' && resourceCity && user.city === resourceCity) return true;
  if (user.role === 'moderator') return true;
  return !!ownerId && user.id === ownerId;
}

/**
 * Returns true if the token is fresh enough for sensitive mutations.
 * "Fresh" means it was issued within the last `maxAgeSeconds` seconds (default 3600 = 1 hour).
 */
export function isTokenFresh(user: RequestUser, maxAgeSeconds = 3600): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - user.issuedAt <= maxAgeSeconds;
}

// ---------------------------------------------------------------------------
// authenticate  (global — attaches req.user when token is present and valid)
// ---------------------------------------------------------------------------

/**
 * Global middleware applied to every request.
 * Attaches `req.user` from the Firebase Bearer token when present and valid.
 *
 * Uses checkRevoked: false for performance — skips the extra Admin SDK Firestore
 * round-trip on every request. Token signature + expiry are still fully verified.
 * Use requireRevocationCheck() on sensitive mutation routes (payments, admin writes,
 * account deletion) where catching a revoked token immediately matters.
 *
 * Never throws; use requireAuth / requireRole on individual routes.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  req.accessToken = token;

  try {
    // checkRevoked: false — verifies signature + expiry without the extra Firestore
    // round-trip. This saves ~100–200ms per request on every authenticated call.
    const decoded = await authAdmin.verifyIdToken(token, false);

    const role = (decoded['role'] as UserRole | undefined) ?? 'user';
    const effectiveRole: UserRole = isBootstrapSuperAdmin(decoded.uid, decoded.email) ? 'superAdmin' : role;

    req.user = {
      id: decoded.uid,
      username:
        (decoded['username'] as string | undefined) ??
        decoded.email?.split('@')[0] ??
        decoded.uid,
      email: decoded.email,
      role: effectiveRole,
      tier: decoded['tier'] as string | undefined,
      city: decoded['city'] as string | undefined,
      country: decoded['country'] as string | undefined,
      issuedAt: decoded.iat ?? 0,
    };
  } catch {
    // Invalid or expired token — leave req.user undefined.
    // Protected routes downstream will return 401.
  }

  next();
}

// ---------------------------------------------------------------------------
// requireAuth  (route-level — blocks unauthenticated requests)
// ---------------------------------------------------------------------------

/**
 * Route-level guard. Rejects with 401 if no authenticated user is present.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// requireFresh  (token freshness — for sensitive mutations)
// ---------------------------------------------------------------------------

/**
 * Route-level guard. Rejects with 401 if the token is older than `maxAgeSeconds`.
 * Use on password change, payment initiation, admin writes, and other sensitive mutations.
 * Clients should call `/api/auth/refresh` to get a fresh token before retrying.
 *
 * Default: 3600 seconds (1 hour).
 */
export function requireFresh(maxAgeSeconds = 3600) {
  return function freshnessGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!isTokenFresh(req.user, maxAgeSeconds)) {
      res.status(401).json({ error: 'Session expired. Please re-authenticate.' });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// requireRevocationCheck  (sensitive mutations — opt-in revocation check)
// ---------------------------------------------------------------------------

/**
 * Route-level guard that verifies the token is not revoked.
 * Use only on routes where catching a disabled/deleted account immediately matters:
 * - Stripe payment initiation
 * - Admin writes
 * - Account deletion
 *
 * Apply AFTER requireAuth so req.user is guaranteed to exist.
 *
 * Example:
 *   router.post('/payment/intent', requireAuth, requireRevocationCheck, handler)
 */
export async function requireRevocationCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.accessToken) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    await authAdmin.verifyIdToken(req.accessToken, true);
    next();
  } catch {
    res.status(401).json({ error: 'Session revoked. Please sign in again.' });
  }
}

// ---------------------------------------------------------------------------
// requireRole  (role-based guard)
// ---------------------------------------------------------------------------

/**
 * Route-level role guard.
 *
 * The user must be authenticated AND hold at least one of the specified roles.
 * Users with admin or platformAdmin rank always pass.
 *
 * Forbidden responses do NOT reveal which roles are required (prevents enumeration).
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const rank = userRank(req.user);
    // Admin-level users always pass
    const allowed = rank >= ROLE_RANK['admin'] || allowedRoles.includes(req.user.role);

    if (!allowed) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// requireMinRank  (numeric rank guard — avoid exposing role names)
// ---------------------------------------------------------------------------

/**
 * Route-level guard requiring a minimum numeric rank.
 * Prefer requireRole() for readability; use requireMinRank for generic middleware.
 */
export function requireMinRank(minRank: number) {
  return function rankGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (userRank(req.user) < minRank) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// requireSuperAdmin  (platformAdmin-only)
// ---------------------------------------------------------------------------

/**
 * Route-level guard. Only platformAdmin users pass.
 * Use for: feature flag writes, GDPR exports, platform configuration, audit log purges.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!isSuperAdmin(req.user)) {
    res.status(403).json({ error: 'Insufficient permissions.' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// requireCityAdmin  (city-scoped admin guard)
// ---------------------------------------------------------------------------

/**
 * Route-level guard. Passes if:
 *   - User is admin / platformAdmin (full access), OR
 *   - User is a cityAdmin whose `city` claim matches the target city.
 *
 * @param getTargetCity  Function that extracts the city to check from the request.
 *                       Typically reads from req.params.city or req.body.city.
 *
 * Usage:
 *   router.delete('/cities/:city/events/:id',
 *     requireCityAdmin(req => req.params.city),
 *     deleteEventHandler,
 *   );
 */
export function requireCityAdmin(getTargetCity: (req: Request) => string | undefined) {
  return function cityAdminGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (isAdminUser(req.user)) {
      return next(); // Full admins bypass city scoping
    }

    if (req.user.role !== 'cityAdmin') {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    const targetCity = getTargetCity(req);
    if (!targetCity || req.user.city !== targetCity) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// requireOwnerOrAdmin  (route-level ownership guard)
// ---------------------------------------------------------------------------

/**
 * Route-level ownership guard.
 *
 * Passes if the authenticated user owns the resource OR has moderator+ access.
 *
 * @param getOwnerId  Async function that resolves to the resource owner's UID.
 *                    Return `null` to treat as "not found" (responds 404).
 *
 * Usage:
 *   router.delete('/events/:id',
 *     requireAuth,
 *     requireOwnerOrAdmin(async req => {
 *       const event = await eventsService.get(req.params.id);
 *       return event?.organizerId ?? null;
 *     }),
 *     deleteEventHandler,
 *   );
 */
export function requireOwnerOrAdmin(
  getOwnerId: (req: Request) => Promise<string | null | undefined>,
) {
  return async function ownerOrAdminGuard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    try {
      const ownerId = await getOwnerId(req);

      if (ownerId === null) {
        res.status(404).json({ error: 'Resource not found.' });
        return;
      }

      if (!isOwnerOrAdmin(req.user, ownerId)) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}
