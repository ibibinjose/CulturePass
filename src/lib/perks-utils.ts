/**
 * Perks utility pure functions.
 *
 * - classifyPerk: determines redeemability status for a user/perk combination
 * - calculateRedemptionPreview: points arithmetic for the redemption confirmation step
 *
 * All functions are pure (no side effects) for testability.
 */

import type { MembershipTier } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PerkStatus =
  | 'redeemable'
  | 'tier_locked'
  | 'insufficient_points'
  | 'limit_reached';

/** The fields from Perk that classifyPerk needs. */
export interface ClassifiablePerk {
  /** Points required to redeem this perk. */
  pointsCost: number;
  /** Minimum membership tier required; undefined = no tier requirement. */
  requiredMembershipTier?: MembershipTier;
  /** Max redemptions per user; undefined = unlimited. */
  perUserLimit?: number;
}

export interface RedemptionPreview {
  /** Points remaining after redemption (minimum 0). */
  remainingBalance: number;
  /** Points deficit when balance is insufficient (0 when canRedeem = true). */
  deficit: number;
  /** Whether the user has enough points to redeem. */
  canRedeem: boolean;
}

// ---------------------------------------------------------------------------
// Tier ordering
// ---------------------------------------------------------------------------

const TIER_RANK: Record<MembershipTier, number> = {
  free: 0,
  plus: 1,
  elite: 2,
  pro: 3,
  premium: 4,
  vip: 5,
};

function tierMeets(userTier: MembershipTier, required: MembershipTier): boolean {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[required] ?? 0);
}

// ---------------------------------------------------------------------------
// classifyPerk
// ---------------------------------------------------------------------------

/**
 * Classifies a perk's redeemability for a specific user.
 *
 * Priority of checks (first failing check wins):
 *  1. Tier requirement — returns 'tier_locked' if not met
 *  2. Points balance — returns 'insufficient_points' if balance < cost
 *  3. Per-user limit — returns 'limit_reached' if redemptions exhausted
 *  4. Otherwise — returns 'redeemable'
 *
 * @param perk - Perk to evaluate
 * @param userTier - User's current membership tier
 * @param userPoints - User's current points balance
 * @param userRedemptionCount - How many times the user has redeemed this perk
 */
export function classifyPerk(
  perk: ClassifiablePerk,
  userTier: MembershipTier,
  userPoints: number,
  userRedemptionCount: number,
): PerkStatus {
  // 1. Tier check
  if (perk.requiredMembershipTier && !tierMeets(userTier, perk.requiredMembershipTier)) {
    return 'tier_locked';
  }

  // 2. Points check
  if (userPoints < perk.pointsCost) {
    return 'insufficient_points';
  }

  // 3. Per-user limit check
  if (perk.perUserLimit !== undefined && userRedemptionCount >= perk.perUserLimit) {
    return 'limit_reached';
  }

  return 'redeemable';
}

// ---------------------------------------------------------------------------
// calculateRedemptionPreview
// ---------------------------------------------------------------------------

/**
 * Computes the points arithmetic for the redemption confirmation step.
 *
 * - remainingBalance = max(0, balance - cost)
 * - deficit = max(0, cost - balance)
 * - canRedeem = balance >= cost
 *
 * @param currentBalance - User's current points balance
 * @param perkCost - Points required to redeem the perk
 */
export function calculateRedemptionPreview(
  currentBalance: number,
  perkCost: number,
): RedemptionPreview {
  const remaining = currentBalance - perkCost;
  return {
    remainingBalance: Math.max(0, remaining),
    deficit: Math.max(0, -remaining),
    canRedeem: remaining >= 0,
  };
}
