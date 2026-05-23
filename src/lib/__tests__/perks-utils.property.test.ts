/**
 * Property-Based Tests for perks-utils.ts
 *
 * Property 26: Perk Redeemability Classification
 * Property 27: Points Arithmetic for Redemption
 *
 * Validates: Requirements 13.2, 13.3, 13.5
 */

import * as fc from 'fast-check';
import {
  classifyPerk,
  calculateRedemptionPreview,
  type ClassifiablePerk,
} from '../perks-utils';
import type { MembershipTier } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const tiers: MembershipTier[] = ['free', 'plus', 'elite', 'pro', 'premium', 'vip'];
const tierArb = fc.constantFrom(...tiers);

const perkArb: fc.Arbitrary<ClassifiablePerk> = fc.record({
  pointsCost: fc.integer({ min: 0, max: 5000 }),
  requiredMembershipTier: fc.option(tierArb, { nil: undefined }),
  perUserLimit: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
});

const userArb = fc.record({
  tier: tierArb,
  points: fc.integer({ min: 0, max: 10000 }),
  redemptionCount: fc.integer({ min: 0, max: 20 }),
});

const balanceCostArb = fc.tuple(
  fc.integer({ min: 0, max: 10000 }),
  fc.integer({ min: 0, max: 10000 }),
);

// ---------------------------------------------------------------------------
// Property 26: classifyPerk
// ---------------------------------------------------------------------------

it('Property 26a: always returns exactly one PerkStatus value', () => {
  const VALID_STATUSES = new Set(['redeemable', 'tier_locked', 'insufficient_points', 'limit_reached']);
  fc.assert(
    fc.property(perkArb, userArb, (perk, user) => {
      const status = classifyPerk(perk, user.tier, user.points, user.redemptionCount);
      expect(VALID_STATUSES.has(status)).toBe(true);
    }),
    { numRuns: 500 },
  );
});

it('Property 26b: tier_locked when user tier rank < required tier rank', () => {
  // free user cannot redeem vip-required perk
  const perk: ClassifiablePerk = { pointsCost: 0, requiredMembershipTier: 'vip' };
  const status = classifyPerk(perk, 'free', 99999, 0);
  expect(status).toBe('tier_locked');
});

it('Property 26c: redeemable when all conditions met', () => {
  const perk: ClassifiablePerk = { pointsCost: 100, requiredMembershipTier: 'free' };
  const status = classifyPerk(perk, 'plus', 500, 0);
  expect(status).toBe('redeemable');
});

it('Property 26d: insufficient_points when points < cost (and tier met)', () => {
  const perk: ClassifiablePerk = { pointsCost: 1000 };
  const status = classifyPerk(perk, 'vip', 500, 0);
  expect(status).toBe('insufficient_points');
});

it('Property 26e: limit_reached when redemption count >= perUserLimit (and tier/points met)', () => {
  const perk: ClassifiablePerk = { pointsCost: 0, perUserLimit: 3 };
  const status = classifyPerk(perk, 'free', 99999, 3);
  expect(status).toBe('limit_reached');
});

it('Property 26f: tier_locked takes priority over insufficient_points', () => {
  // Both conditions fail — tier check runs first
  const perk: ClassifiablePerk = { pointsCost: 99999, requiredMembershipTier: 'vip' };
  const status = classifyPerk(perk, 'free', 0, 0);
  expect(status).toBe('tier_locked');
});

it('Property 26g: no required tier means tier check always passes', () => {
  fc.assert(
    fc.property(tierArb, fc.integer({ min: 0, max: 10000 }), (tier, points) => {
      const perk: ClassifiablePerk = { pointsCost: points + 1 }; // ensure insufficient points
      const status = classifyPerk(perk, tier, 0, 0);
      // Should be insufficient_points (not tier_locked) since no tier required
      expect(status).toBe('insufficient_points');
    }),
    { numRuns: 100 },
  );
});

// ---------------------------------------------------------------------------
// Property 27: calculateRedemptionPreview
// ---------------------------------------------------------------------------

it('Property 27a: remainingBalance = max(0, balance - cost)', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { remainingBalance } = calculateRedemptionPreview(balance, cost);
      expect(remainingBalance).toBe(Math.max(0, balance - cost));
    }),
    { numRuns: 200 },
  );
});

it('Property 27b: deficit = max(0, cost - balance)', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { deficit } = calculateRedemptionPreview(balance, cost);
      expect(deficit).toBe(Math.max(0, cost - balance));
    }),
    { numRuns: 200 },
  );
});

it('Property 27c: canRedeem = balance >= cost', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { canRedeem } = calculateRedemptionPreview(balance, cost);
      expect(canRedeem).toBe(balance >= cost);
    }),
    { numRuns: 200 },
  );
});

it('Property 27d: remainingBalance and deficit are mutually exclusive (one is always 0)', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { remainingBalance, deficit } = calculateRedemptionPreview(balance, cost);
      expect(Math.min(remainingBalance, deficit)).toBe(0);
    }),
    { numRuns: 200 },
  );
});

it('Property 27e: remainingBalance is always ≥0', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { remainingBalance } = calculateRedemptionPreview(balance, cost);
      expect(remainingBalance).toBeGreaterThanOrEqual(0);
    }),
    { numRuns: 200 },
  );
});

it('Property 27f: deficit is always ≥0', () => {
  fc.assert(
    fc.property(balanceCostArb, ([balance, cost]) => {
      const { deficit } = calculateRedemptionPreview(balance, cost);
      expect(deficit).toBeGreaterThanOrEqual(0);
    }),
    { numRuns: 200 },
  );
});
