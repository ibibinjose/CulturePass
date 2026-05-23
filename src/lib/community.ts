import { CultureTokens } from '@/design-system/tokens/theme';
import type {
  Community,
  CommunityActivityLevel,
  CommunityCadence,
  CommunityJoinMode,
} from '@/shared/schema';

const CATEGORY_ACCENTS: Record<string, string> = {
  cultural: CultureTokens.indigo,
  local_community: CultureTokens.teal,
  arts_sports_club: CultureTokens.coral,
  club: CultureTokens.gold,
  professional: CultureTokens.teal,
  business: CultureTokens.gold,
  brand: CultureTokens.violet,
  council: CultureTokens.teal,
  charity: CultureTokens.coral,
};

const JOIN_MODE_LABELS: Record<CommunityJoinMode, string> = {
  open: 'Open join',
  request: 'Approval required',
  invite: 'Invite only',
};

const CADENCE_LABELS: Record<CommunityCadence, string> = {
  weekly: 'Weekly gatherings',
  fortnightly: 'Fortnightly gatherings',
  monthly: 'Monthly gatherings',
  quarterly: 'Quarterly gatherings',
  seasonal: 'Seasonal programming',
};

const ACTIVITY_LABELS: Record<CommunityActivityLevel, string> = {
  new: 'New',
  steady: 'Steady',
  active: 'Active',
  thriving: 'Thriving',
};

const ACTIVITY_COLORS: Record<CommunityActivityLevel, string> = {
  new: CultureTokens.gold,
  steady: CultureTokens.teal,
  active: CultureTokens.indigo,
  thriving: CultureTokens.coral,
};

export function getCommunityMemberCount(community: Partial<Community>): number {
  return community.memberCount ?? community.membersCount ?? 0;
}

/**
 * Path segment for `/c/[id]` (and legacy `/community/[id]`) — prefers approved public handle.
 */
export function getCommunityProfilePathId(
  community: Pick<Community, 'id' | 'handle' | 'handleStatus' | 'slug'>,
): string {
  const h = (community.handle ?? '').trim();
  if (h && community.handleStatus === 'approved') return h;
  if (community.slug) return community.slug;
  return community.id;
}

export function getCommunityEventsCount(community: Partial<Community>): number {
  return community.communityHealth?.upcomingEventsCount
    ?? community.upcomingEventsCount
    ?? community.eventsCount
    ?? 0;
}

export function getCommunityAccent(
  community: Partial<Community>,
  fallback: string = CultureTokens.indigo,
): string {
  if (community.color) return community.color;
  if (community.communityCategory && CATEGORY_ACCENTS[community.communityCategory]) {
    return CATEGORY_ACCENTS[community.communityCategory];
  }
  if (community.category && CATEGORY_ACCENTS[community.category.toLowerCase()]) {
    return CATEGORY_ACCENTS[community.category.toLowerCase()];
  }
  return fallback;
}

export function getCommunityHeadline(community: Partial<Community>): string {
  return community.headline
    ?? community.mission
    ?? community.description
    ?? 'Connecting culture, belonging, and real-world experiences.';
}

export function getCommunityLabel(community: Partial<Community>): string {
  return community.communityType
    ?? community.category
    ?? community.communityCategory
    ?? 'Community';
}

export function getCommunityActivityLevel(community: Partial<Community>): CommunityActivityLevel {
  if (community.activityLevel) return community.activityLevel;

  const growth = community.communityHealth?.memberGrowth30d ?? 0;
  const weeklyPosts = community.communityHealth?.weeklyPosts ?? 0;
  const events = getCommunityEventsCount(community);
  const members = getCommunityMemberCount(community);

  if (growth >= 12 || weeklyPosts >= 6 || events >= 5) return 'thriving';
  if (growth >= 4 || weeklyPosts >= 2 || events >= 2) return 'active';
  if (members > 0) return 'steady';
  return 'new';
}

export function getCommunityActivityMeta(community: Partial<Community>) {
  const level = getCommunityActivityLevel(community);
  return {
    level,
    label: ACTIVITY_LABELS[level],
    color: ACTIVITY_COLORS[level],
  };
}

export function getCommunityJoinLabel(community: Partial<Community>): string | null {
  if (!community.joinMode) return null;
  return JOIN_MODE_LABELS[community.joinMode];
}

export function getCommunityCadenceLabel(community: Partial<Community>): string | null {
  if (!community.meetingCadence) return null;
  return CADENCE_LABELS[community.meetingCadence];
}

export function getCommunityLocationLabel(community: Partial<Community>): string | null {
  const location = [community.city, community.country].filter(Boolean).join(', ');
  return location || null;
}

export function getCommunitySignals(community: Partial<Community>): string[] {
  const signals: string[] = [];

  const label = getCommunityLabel(community);
  if (label) signals.push(label);

  if (community.countryOfOrigin) signals.push(community.countryOfOrigin);
  if (community.primaryLanguageLabel) signals.push(community.primaryLanguageLabel);
  if (community.chapterCount && community.chapterCount > 1) {
    signals.push(`${community.chapterCount} chapters`);
  }

  const joinLabel = getCommunityJoinLabel(community);
  if (joinLabel) signals.push(joinLabel);

  if (community.trustSignals?.safeSpacePolicy) signals.push('Safe space');

  return signals.slice(0, 4);
}

export function getCommunityTrustSignals(community: Partial<Community>): string[] {
  const signals: string[] = [];

  if (community.isVerified) signals.push('Verified community');
  if (community.trustSignals?.safeSpacePolicy) signals.push('Safe space policy');
  if (community.trustSignals?.moderationEnabled) signals.push('Moderated space');

  const verifiedLeaders = community.trustSignals?.verifiedLeadersCount ?? 0;
  if (verifiedLeaders > 0) {
    signals.push(
      verifiedLeaders === 1 ? '1 verified leader' : `${verifiedLeaders} verified leaders`,
    );
  }

  const responseRate = community.trustSignals?.responseRate ?? community.communityHealth?.responseRate ?? 0;
  if (responseRate > 0) signals.push(`${responseRate}% response rate`);

  return signals.slice(0, 4);
}

export function getCommunityDiscoveryReasons(community: Partial<Community>): string[] {
  const reasons: string[] = [];

  if (community.discoverySignals?.featuredReason) {
    reasons.push(community.discoverySignals.featuredReason);
  }

  const mutualMembers = community.discoverySignals?.mutualMembersCount ?? 0;
  if (mutualMembers > 0) {
    reasons.push(
      mutualMembers === 1 ? '1 mutual member' : `${mutualMembers} mutual members`,
    );
  }

  const matchScore = community.discoverySignals?.matchScore ?? 0;
  if (matchScore > 0) {
    const percentage = matchScore <= 1 ? Math.round(matchScore * 100) : Math.round(matchScore);
    reasons.push(`${percentage}% culture match`);
  }

  return reasons.slice(0, 3);
}
