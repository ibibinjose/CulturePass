import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { paymentApi } from '@/modules/payment/api';

export function useDeletePaymentMethodMutation(userId?: string | null) {
  return useMutation({
    mutationFn: async (id: string) => {
      await paymentApi.paymentMethods.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods', userId] });
    },
  });
}
