import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/modules/payment/api';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  label: string;
  last4: string | null;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean | null;
  createdAt: string | null;
}

export function usePaymentMethodsQuery(userId?: string | null) {
  return useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods', userId],
    queryFn: () => paymentApi.paymentMethods.list(userId!),
    enabled: !!userId,
  });
}
