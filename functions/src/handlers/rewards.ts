/**
 * Rewards summary — points, tier ladder, perks redeemed (derived from wallet + redemptions).
 */

import { Router, type Request, type Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import { walletsService } from '../services/firestore';
import { captureRouteError, qparam } from './utils';

const POINTS_PER_DOLLAR = 1;
/** Points needed to reach Gold tier (Silver → Gold). */
const REWARDS_TIER_GOLD_AT = 500;
/** Points needed for Diamond tier. */
const REWARDS_TIER_DIAMOND_AT = 2500;

interface RewardsSummaryResponse {
  userId: string;
  points: number;
  pointsPerDollar: number;
  tier: 'silver' | 'gold' | 'diamond';
  tierLabel: string;
  nextTier: 'gold' | 'diamond' | null;
  nextTierLabel: string | null;
  pointsToNextTier: number;
  progressPercent: number;
  perksRedeemed: number;
}

function buildRewardsSummary(userId: string, points: number, perksRedeemed: number): RewardsSummaryResponse {
  const p = Math.max(0, Math.floor(Number(points) || 0));
  let tier: RewardsSummaryResponse['tier'];
  let tierLabel: string;
  let nextTier: RewardsSummaryResponse['nextTier'];
  let nextTierLabel: string | null;
  let pointsToNextTier: number;
  let progressPercent: number;

  if (p >= REWARDS_TIER_DIAMOND_AT) {
    tier = 'diamond';
    tierLabel = 'Diamond';
    nextTier = null;
    nextTierLabel = null;
    pointsToNextTier = 0;
    progressPercent = 100;
  } else if (p >= REWARDS_TIER_GOLD_AT) {
    tier = 'gold';
    tierLabel = 'Gold';
    nextTier = 'diamond';
    nextTierLabel = 'Diamond';
    const span = REWARDS_TIER_DIAMOND_AT - REWARDS_TIER_GOLD_AT;
    const inTier = p - REWARDS_TIER_GOLD_AT;
    pointsToNextTier = Math.max(0, REWARDS_TIER_DIAMOND_AT - p);
    progressPercent = Math.min(100, Math.round((inTier / span) * 100));
  } else {
    tier = 'silver';
    tierLabel = 'Silver';
    nextTier = 'gold';
    nextTierLabel = 'Gold';
    pointsToNextTier = Math.max(0, REWARDS_TIER_GOLD_AT - p);
    progressPercent = Math.min(100, Math.round((p / REWARDS_TIER_GOLD_AT) * 100));
  }

  return {
    userId,
    points: p,
    pointsPerDollar: POINTS_PER_DOLLAR,
    tier,
    tierLabel,
    nextTier,
    nextTierLabel,
    pointsToNextTier,
    progressPercent,
    perksRedeemed: Math.max(0, Math.floor(Number(perksRedeemed) || 0)),
  };
}

export const rewardsRouter = Router();

/** GET /api/rewards/:userId — wallet points, tier progress, perk redemption count */
rewardsRouter.get('/rewards/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = qparam(req.params.userId);
  if (!isOwnerOrAdmin(req.user!, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    if (!isFirestoreConfigured) {
      return res.json(buildRewardsSummary(userId, 0, 0));
    }

    const wallet = await walletsService.getOrCreate(userId);
    const redemptionSnap = await db.collection('redemptions').where('userId', '==', userId).get();
    const perksRedeemed = redemptionSnap.size;

    return res.json(buildRewardsSummary(userId, wallet.points ?? 0, perksRedeemed));
  } catch (err) {
    captureRouteError(err, 'GET /api/rewards/:userId');
    return res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});
