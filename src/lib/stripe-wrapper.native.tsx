import React from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

export const StripeNativeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
      merchantIdentifier="merchant.au.culturepass.app"
    >
      <>{children}</>
    </StripeProvider>
  );
};

export const useSafeStripe = () => {
  return useStripe();
};
