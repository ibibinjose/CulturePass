import type { ApiRequestFn } from '../client';
import type { PerkData } from '@/shared/schema';

export interface ClassifiedPerks {
  redeemable: PerkData[];
  locked: PerkData[];
  expiringSoon: PerkData[];
}

export function createPerksClassifyNamespace(request: ApiRequestFn) {
  return {
    /** Classify perks for current user (redeemable, locked, expiring soon) */
    classify: () =>
      request<ClassifiedPerks>('GET', 'api/perks/classify'),
  };
}
