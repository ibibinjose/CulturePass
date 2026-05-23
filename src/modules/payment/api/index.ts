import { api } from '@/lib/api';

export const paymentApi = {
  paymentMethods: api.paymentMethods,
  wallet: api.wallet,
  tickets: api.tickets,
  membership: api.membership,
  rewards: api.rewards,
};
