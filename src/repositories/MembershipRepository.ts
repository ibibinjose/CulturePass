import { api, type MembershipSummary } from '@/lib/api';

export class MembershipRepository {
  async getMembership(userId: string): Promise<MembershipSummary> {
    return api.membership.get(userId);
  }

  async getMemberCount(): Promise<{ count: number }> {
    return api.membership.memberCount();
  }

  async subscribe(billingPeriod: 'monthly' | 'yearly', promoCode?: string, country?: string) {
    return api.membership.subscribe({ billingPeriod, promoCode, country });
  }

  async cancelMembership() {
    return api.membership.cancel();
  }
}

export const membershipRepository = new MembershipRepository();
