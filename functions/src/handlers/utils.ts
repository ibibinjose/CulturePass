/**
 * Shared utilities used across route modules.
 * These were previously inlined in app.ts.
 */

import { randomBytes } from 'node:crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { getPostcodeData, getPostcodesByPlace } from '../../../shared/location/australian-postcodes';
import { log, setCorrelationId } from '../lib/logger';
import { walletsService, notificationsService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';

import { isOwnerOrAdmin, type RequestUser, ROLE_RANK } from '../middleware/auth';
import { type User } from '../../../shared/schema/user';
import { type UserRole } from '../../../shared/schema';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Basic helpers
// ---------------------------------------------------------------------------

/** Returns the current timestamp as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Safely extracts the Firebase Project ID from the FIREBASE_CONFIG environment variable.
 * Returns null if the environment variable is missing, malformed, or if the projectId is invalid.
 * Validates that the projectId only contains alphanumeric characters and hyphens.
 */
export function getFirebaseProjectId(): string | null {
  try {
    const raw = process.env.FIREBASE_CONFIG;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projectId?: string };
    const projectId = parsed.projectId;
    if (typeof projectId === 'string' && /^[a-z0-9-]+$/.test(projectId)) {
      return projectId;
    }
  } catch {
    // no-op: ignore JSON parse errors or other issues
  }
  return null;
}

/** Safely extract a single string from an Express route param (Express v5 types as string | string[]). */
export function qparam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

/** Safely extract a single string from an Express query param. */
export function qstr(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return String(v ?? '');
}

/** Generates a short, prefixed secure ID (e.g. "CP-U1A2B3"). */
export function generateSecureId(prefix: string): string {
  return `${prefix}${randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Privacy & Sanitization
// ---------------------------------------------------------------------------

export const PRIVATE_USER_FIELDS = new Set([
  'email',
  'phone',
  'postcode',
  'membership',
  'role',
  'ethnicityText',
  'interests',
  'communities',
  'interestCategoryIds',
  'languages',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'deviceTokens',
  'marketingOptIn',
  'dataProcessingConsent',
  'metadata',
]);

/**
 * Removes sensitive fields from a user object unless the requester is the owner or an admin.
 */
export function sanitizeUserResponse(
  user: Record<string, unknown> | User,
  requester?: RequestUser,
): Record<string, unknown> {
  const ownerId = typeof user.id === 'string' ? user.id : null;
  if (requester && isOwnerOrAdmin(requester, ownerId)) {
    return user as Record<string, unknown>;
  }

  const sanitized: Record<string, unknown> = { ...(user as Record<string, unknown>) };
  for (const field of PRIVATE_USER_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

/** 
 * Resolves the actor ID for an administrative audit log. 
 * High-rank admins can perform actions as other users, in which case we record the target actor.
 * Scoped admins (moderator, cityAdmin) always log their OWN id.
 */
export function resolveAdminAuditActorId(adminUser: RequestUser, requestedActorId?: string): string {
  if (adminUser.role === 'admin' || adminUser.role === 'platformAdmin') {
    return requestedActorId || adminUser.id;
  }
  return adminUser.id;
}

/** 
 * Permission logic for assigning administrative roles.
 * Admins can only assign roles lower than their own rank, and cannot target
 * users with a higher or equal rank to themselves.
 */
export function canAssignAdministrativeRole(
  adminUser: RequestUser,
  targetOriginalRole: UserRole,
  requestedNewRole: UserRole,
  targetUserId: string,
): boolean {
  if (adminUser.id === targetUserId) return false; // cannot promote oneself
  
  const adminRank = ROLE_RANK[adminUser.role] ?? 0;
  const targetRank = ROLE_RANK[targetOriginalRole] ?? 0;
  const newRank = ROLE_RANK[requestedNewRole] ?? 0;

  // platformAdmin can fully manage roles up to 'moderator'
  if (adminUser.role === 'platformAdmin') {
    // Test says platformAdmin CANNOT make an 'admin' (Test 114)
    // and CANNOT downgrade an 'admin' (Test 119)
    if (requestedNewRole === 'admin' || targetOriginalRole === 'admin') return false;
    return targetRank < adminRank && newRank < adminRank;
  }

  // Regular admins can assign roles up to their own rank (admin)
  if (adminUser.role === 'admin') {
    // Tests say admin CANNOT manage other admins (Test 104)
    if (targetOriginalRole === 'admin') return false;
    // Admin cannot escalate anyone to platformAdmin.
    if (requestedNewRole === 'platformAdmin') return false;
    return targetRank < adminRank && newRank <= adminRank;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Culture & Language data
// ---------------------------------------------------------------------------

export const CULTURE_ETHNICITIES = [
  'Aboriginal and Torres Strait Islander',
  'African',
  'Arab',
  'Bangladeshi',
  'Caribbean',
  'Chinese',
  'European',
  'Filipino',
  'Indian',
  'Japanese',
  'Korean',
  'Latin American',
  'Malay',
  'Malayali',
  'Malaysian Chinese',
  'Nepali',
  'Pacific Islander',
  'Pakistani',
  'Sri Lankan',
  'Vietnamese',
];

export const CULTURE_LANGUAGES = [
  'Arabic',
  'Cantonese',
  'English',
  'French',
  'Greek',
  'Hindi',
  'Indonesian',
  'Japanese',
  'Korean',
  'Malay',
  'Malayalam',
  'Mandarin',
  'Portuguese',
  'Punjabi',
  'Spanish',
  'Tagalog',
  'Tamil',
  'Telugu',
  'Urdu',
  'Vietnamese',
];

export const CULTURE_USAGE_SCORE = new Map<string, number>([
  ['english', 1000],
  ['mandarin', 850],
  ['hindi', 740],
  ['cantonese', 640],
  ['punjabi', 620],
  ['arabic', 600],
  ['tamil', 560],
  ['telugu', 520],
  ['malayalam', 500],
  ['malay', 480],
  ['vietnamese', 450],
  ['tagalog', 420],
  ['chinese', 700],
  ['indian', 680],
  ['filipino', 460],
  ['arab', 430],
]);

// ---------------------------------------------------------------------------
// Australian location resolution
// ---------------------------------------------------------------------------

export type ResolvedLocation = {
  city: string;
  state: string;
  country: string;
  postcode: number;
  latitude: number;
  longitude: number;
};

export function resolveAustralianLocation(
  input: Record<string, unknown>,
  required: boolean,
): { location?: ResolvedLocation; error?: string } {
  const cityInput = String(input.city ?? '').trim();
  const countryInput = String(input.country ?? 'Australia').trim() || 'Australia';
  const stateInput = String(input.state ?? input.stateCode ?? '').trim().toUpperCase();
  const postcodeRaw = String(input.postcode ?? '').trim();

  if (required && (!cityInput || !stateInput || !postcodeRaw)) {
    return { error: 'city, state, postcode, and country are required' };
  }

  if (!cityInput && !stateInput && !postcodeRaw) {
    return {};
  }

  const postcode = Number.parseInt(postcodeRaw, 10);
  if (!Number.isFinite(postcode)) {
    return { error: 'postcode must be a valid number' };
  }

  const postcodeMatch = getPostcodeData(postcode);
  if (!postcodeMatch) {
    return { error: 'postcode is not recognized in Australian postcode data' };
  }

  const cityMatches = getPostcodesByPlace(cityInput);
  const cityStateMatch = cityMatches.find((item) => item.state_code.toUpperCase() === stateInput);
  const resolved = cityStateMatch ?? postcodeMatch;

  if (stateInput && resolved.state_code.toUpperCase() !== stateInput) {
    return { error: 'state does not match postcode' };
  }

  return {
    location: {
      city: resolved.place_name,
      state: resolved.state_code,
      country: countryInput,
      postcode: resolved.postcode,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    },
  };
}

// ---------------------------------------------------------------------------
// Membership helpers
// ---------------------------------------------------------------------------

export type MembershipTier = 'free' | 'plus' | 'premium' | 'elite' | 'pro' | 'vip';
export type MembershipStatus = 'active' | 'inactive';

export const MEMBERSHIP_PLAN_CONFIG: Record<MembershipTier, {
  label: string;
  cashbackRate: number;
  earlyAccessHours: number;
}> = {
  free:    { label: 'Free',    cashbackRate: 0,    earlyAccessHours: 0  },
  plus:    { label: 'Plus',    cashbackRate: 0.02, earlyAccessHours: 48 },
  premium: { label: 'Premium', cashbackRate: 0.03, earlyAccessHours: 72 },
  elite:   { label: 'Elite',   cashbackRate: 0.04, earlyAccessHours: 72 },
  pro:     { label: 'Pro',     cashbackRate: 0.03, earlyAccessHours: 48 },
  vip:     { label: 'VIP',     cashbackRate: 0.05, earlyAccessHours: 96 },
};

export function normalizeMembershipTier(tier: unknown): MembershipTier {
  const value = String(tier ?? 'free').toLowerCase() as MembershipTier;
  return value in MEMBERSHIP_PLAN_CONFIG ? value : 'free';
}

export function isMembershipActive(tier: MembershipTier, isActive?: boolean, expiresAt?: string | null): boolean {
  if (tier === 'free') return false;
  if (isActive === false) return false;
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function buildMembershipResponse(params: {
  tier?: unknown;
  isActive?: boolean;
  expiresAt?: string | null;
  eventsAttended?: number;
}) {
  const tier = normalizeMembershipTier(params.tier);
  const config = MEMBERSHIP_PLAN_CONFIG[tier];
  const active = isMembershipActive(tier, params.isActive, params.expiresAt);
  const status: MembershipStatus = active ? 'active' : 'inactive';
  const cashbackRate = active ? config.cashbackRate : 0;
  return {
    tier,
    tierLabel: config.label,
    status,
    expiresAt: params.expiresAt ?? null,
    cashbackRate,
    cashbackMultiplier: 1 + cashbackRate,
    earlyAccessHours: active ? config.earlyAccessHours : 0,
    eventsAttended: Number(params.eventsAttended ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Rewards helpers
// ---------------------------------------------------------------------------

const POINTS_PER_DOLLAR = 1;

export function calculateRewardPoints(amountCents: number): number {
  const dollars = Math.floor(Math.max(0, Number(amountCents ?? 0)) / 100);
  return Math.max(0, dollars * POINTS_PER_DOLLAR);
}

export async function awardRewardsPoints(
  userId: string,
  amountCents: number,
  context: { ticketId?: string; source: string },
): Promise<number> {
  const points = calculateRewardPoints(amountCents);
  if (points <= 0) return 0;

  if (isFirestoreConfigured) {
    await walletsService.addPoints(userId, points);
    try {
      await notificationsService.create({
        userId,
        title: 'Reward points earned',
        message: `+${points} points from ${context.source}.`,
        type: 'rewards_points',
        metadata: {
          ticketId: context.ticketId ?? null,
          points,
          source: context.source,
        },
      });
    } catch (err) {
      // Non-fatal: reward points awarded but notification failed
      console.error('[rewards] notification create failed:', err);
    }
    return points;
  }

  return points;
}

// ---------------------------------------------------------------------------
// Request Body Parsing
// ---------------------------------------------------------------------------

/** Thrown when `parseBody` receives a payload that fails Zod validation — map to HTTP 400. */
export class RequestValidationError extends Error {
  readonly zodError: z.ZodError;

  constructor(zodError: z.ZodError) {
    const summary =
      zodError.errors.map((e) => e.message).filter(Boolean).join('; ') || 'Invalid request payload';
    super(summary);
    this.name = 'RequestValidationError';
    this.zodError = zodError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function formatValidationErrorPayload(error: z.ZodError): {
  error: string;
  details: { path: string; message: string }[];
} {
  return {
    error:
      error.errors.map((e) => e.message).filter(Boolean).join('; ') ||
      'Invalid request payload',
    details: error.errors.map((e) => ({
      path: e.path.map(String).join('.'),
      message: e.message,
    })),
  };
}

/** If `err` is a validation error from `parseBody`, sends 400 JSON and returns true. */
export function respondIfValidationError(res: Response, err: unknown): boolean {
  if (err instanceof RequestValidationError) {
    res.status(400).json(formatValidationErrorPayload(err.zodError));
    return true;
  }
  return false;
}

/** Use `Schema extends ZodTypeAny` + `z.infer` so Effects/transforms infer output (not `ZodSchema<T>` input quirks). */
export function parseBody<Schema extends z.ZodTypeAny>(schema: Schema, body: unknown): z.infer<Schema> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new RequestValidationError(parsed.error);
  }
  return parsed.data;
}

export function normalizeSafeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: unknown): boolean {
  return normalizeSafeExternalUrl(value) !== null;
}

/**
 * Logs an error to Cloud Logging (console.error).
 * Use this in every route catch block instead of bare console.error.
 */
export function captureRouteError(err: unknown, route: string): void {
  const correlationId = generateSecureId('ERR-');
  if (setCorrelationId) setCorrelationId(correlationId);

  log.error(`Route error in ${route}`, err, {
    route,
    correlationId,
  });
}

/**
 * Wraps an async route handler to catch errors and pass them to next().
 * Eliminates need for manual try/catch in every route.
 */
export const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
