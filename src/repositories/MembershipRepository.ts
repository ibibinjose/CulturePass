import { api, type MembershipSummary } from '@/lib/api';

export class MembershipRepository {
  async getMembership(userId: string): Promise<MembershipSummary> {
    return api.membership.get(userId);
  }

  async getMemberCount(): Promise<{ count: number }> {
    return api.membership.memberCount();
  }

  async subscribe(billingPeriod: 'monthly' | 'yearly') {
    return api.membership.subscribe({ billingPeriod });
  }

  async cancelMembership() {
    return api.membership.cancel();
  }
}

export const membershipRepository = new MembershipRepository();
