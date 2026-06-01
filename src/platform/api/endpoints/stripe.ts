import type { ApiRequestFn } from '../client';

export function createStripeNamespace(request: ApiRequestFn) {
  return {
    createCheckoutSession: (ticketData: {
      eventId: string;
      eventTitle?: string;
      eventDate?: string;
      tierName?: string;
      quantity?: number;
      totalPriceCents?: number;
      currency?: string;
      promoCode?: string;
      redeemPoints?: number;
    }) =>
      request<{ checkoutUrl?: string; ticketId: string; sessionId?: string; directConfirmation?: boolean }>(
        'POST',
        'api/stripe/create-checkout-session',
        { ticketData },
      ),

    createPaymentIntent: (ticketData: {
      eventId: string;
      eventTitle?: string;
      eventDate?: string;
      tierName?: string;
      quantity?: number;
      totalPriceCents?: number;
      currency?: string;
      promoCode?: string;
      redeemPoints?: number;
    }) =>
      request<{
        paymentIntent?: string;
        ephemeralKey?: string;
        customer?: string;
        publishableKey?: string;
        ticketId: string;
        paymentIntentId?: string;
        directConfirmation?: boolean;
      }>(
        'POST',
        'api/stripe/create-payment-intent',
        { ticketData },
      ),

    refund: (ticketId: string) =>
      request<Record<string, unknown>>('POST', 'api/stripe/refund', { ticketId }),

    connectCreateAccount: (profileId: string) =>
      request<{
        accountId: string;
        alreadyExists?: boolean;
        onboardingStatus?: string;
        payoutsEnabled?: boolean;
      }>('POST', 'api/stripe/connect/create-account', { profileId }),

    connectAccountLink: (profileId: string, refreshUrl?: string, returnUrl?: string) =>
      request<{ url: string }>('POST', 'api/stripe/connect/account-link', {
        profileId,
        ...(refreshUrl ? { refreshUrl } : {}),
        ...(returnUrl ? { returnUrl } : {}),
      }),

    connectStatus: (profileId: string) =>
      request<{
        accountId: string | null;
        stripeConnectOnboardingStatus: 'not_started' | 'pending' | 'restricted' | 'complete';
        payoutsEnabled: boolean;
        chargesEnabled?: boolean;
        detailsSubmitted?: boolean;
      }>('GET', `api/stripe/connect/status?profileId=${encodeURIComponent(profileId)}`),
  };
}
