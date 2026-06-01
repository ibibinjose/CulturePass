import React from 'react';

export const StripeNativeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useSafeStripe = () => {
  return {
    initPaymentSheet: (options: any) => Promise.resolve({ error: undefined as { message: string } | undefined }),
    presentPaymentSheet: () => Promise.resolve({ error: undefined as { code: string; message: string } | undefined }),
  };
};
