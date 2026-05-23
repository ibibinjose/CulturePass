import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { paymentApi } from '@/modules/payment/api';

export function useSetDefaultPaymentMethodMutation(userId?: string | null) {
  return useMutation({
    mutationFn: async (methodId: string) => {
      if (!userId) return;
      await paymentApi.paymentMethods.setDefault(userId, methodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods', userId] });
    },
  });
}
