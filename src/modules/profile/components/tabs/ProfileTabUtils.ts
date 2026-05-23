import { communityGroups } from '@/constants/onboardingCommunities';

export const COMMUNITY_COLOR: Record<string, string> = {};
for (const g of communityGroups) {
  for (const m of g.members) {
    COMMUNITY_COLOR[m] = g.color;
  }
}
