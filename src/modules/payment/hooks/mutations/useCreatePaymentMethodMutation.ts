import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { paymentApi } from '@/modules/payment/api';

export function useCreatePaymentMethodMutation(userId?: string | null, onSuccess?: () => void) {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await paymentApi.paymentMethods.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods', userId] });
      onSuccess?.();
    },
  });
}
