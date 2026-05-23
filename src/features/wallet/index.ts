import { api } from '@/lib/api';

export async function getWalletFeatureSummary(userId: string) {
  const [wallet, rewards, redemptions, tickets] = await Promise.all([
    api.wallet.get(userId),
    api.rewards.get(userId),
    api.perks.redemptions(),
    api.tickets.forUser(userId),
  ]);

  return {
    wallet,
    rewards,
    tickets,
    redemptionsCount: redemptions.redemptions.length,
    ticketCount: tickets.length,
  };
}
