import React from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripeMerchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER ?? 'merchant.au.culturepass.app';

export const StripeNativeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StripeProvider
      publishableKey={stripePublishableKey}
      merchantIdentifier={stripeMerchantIdentifier}
    >
      <>{children}</>
    </StripeProvider>
  );
};

export const useSafeStripe = () => {
  return useStripe();
};
