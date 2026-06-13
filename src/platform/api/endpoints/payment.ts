import type {
  DigitalIdSummary,
  GoogleWalletClassBootstrapResponse,
  MembershipSummary,
  RewardsSummary,
  WalletBusinessCardReadinessResponse,
  WalletPassLinkResponse,
  WalletSummary,
  WalletTransaction,
} from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export function createMembershipNamespace(request: ApiRequestFn) {
  return {
    get: (userId: string) => request<MembershipSummary>('GET', `api/membership/${userId}`),
    memberCount: () => request<{ count: number }>('GET', 'api/membership/member-count'),
    introEligibility: () =>
      request<{ eligible: boolean; percentOff: number; headline: string; detail?: string }>(
        'GET',
        'api/membership/intro-eligibility',
      ),
    subscribe: (data: { billingPeriod: 'monthly' | 'yearly'; promoCode?: string; country?: string }) =>
      request<{
        checkoutUrl: string | null;
        sessionId?: string;
        devMode?: boolean;
        alreadyActive?: boolean;
        membership?: MembershipSummary;
        introDiscountApplied?: boolean;
        redeemedDirectly?: boolean;
        pricing?: {
          market: string;
          currency: string;
          amountCents: number;
          stripePriceId: string;
        };
      }>('POST', 'api/membership/subscribe', data),
    billingPortal: () => request<{ url: string }>('POST', 'api/membership/billing-portal'),
    cancel: () => request<{ success: boolean; membership?: MembershipSummary }>('POST', 'api/membership/cancel-subscription'),
    redeemCode: (code: string) =>
      request<{
        success: boolean;
        type: 'free_plus' | 'stripe_discount';
        durationDays?: number;
        expiresAt?: string;
        message?: string;
        membership?: MembershipSummary;
      }>('POST', 'api/membership/redeem-code', { code }),
  };
}

export function createWalletNamespace(request: ApiRequestFn) {
  return {
    get: (userId: string) => request<WalletSummary>('GET', `api/wallet/${userId}`),
    transactions: (userId: string) => request<WalletTransaction[]>('GET', `api/transactions/${userId}`),
    topup: (userId: string, amount: number) => request<WalletSummary>('POST', `api/wallet/${userId}/topup`, { amount }),
    digitalId: () => request<DigitalIdSummary>('GET', 'api/wallet/digital-id'),
    businessCardApple: () => request<WalletPassLinkResponse>('GET', 'api/wallet/business-card/apple'),
    businessCardGoogle: () => request<WalletPassLinkResponse>('GET', 'api/wallet/business-card/google'),
    businessCardReadiness: () =>
      request<{ apple: boolean; google: boolean; mockCredentials?: boolean; publicOrigin?: string }>(
        'GET',
        'api/wallet/business-card/readiness',
      ),
    bootstrapGoogleWalletClass: () =>
      request<GoogleWalletClassBootstrapResponse>('POST', 'api/admin/wallet/business-card/google/bootstrap-class'),
    adminBusinessCardReadiness: () =>
      request<WalletBusinessCardReadinessResponse>('GET', 'api/admin/wallet/business-card/readiness'),
  };
}

export function createRewardsNamespace(request: ApiRequestFn) {
  return {
    get: (userId: string) => request<RewardsSummary>('GET', `api/rewards/${userId}`),
  };
}

export function createPaymentMethodsNamespace(request: ApiRequestFn) {
  return {
    create: (data: Record<string, unknown>) => request<{ success?: boolean; id?: string }>('POST', 'api/payment-methods', data),
    remove: (id: string) => request<{ success?: boolean }>('DELETE', `api/payment-methods/${id}`),
    setDefault: (userId: string, methodId: string) =>
      request<{ success?: boolean }>('PUT', `api/payment-methods/${userId}/default/${methodId}`),
    list: (userId: string) => request<any[]>('GET', `api/payment-methods/${userId}`),
  };
}
