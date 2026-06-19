import { membershipRepository } from '@/repositories/MembershipRepository';

export type PurchaseResult = 
  | { status: 'already_active' }
  | { status: 'checkout_required'; url: string }
  | { status: 'dev_mode_success' }
  | { status: 'direct_redeemed' }
  | { status: 'error'; message: string };

export class PurchaseMembershipUseCase {
  async execute(
    billingPeriod: 'monthly' | 'yearly',
    promoCode?: string,
    country?: string,
  ): Promise<PurchaseResult> {
    try {
      const data = await membershipRepository.subscribe(billingPeriod, promoCode, country);
      
      if (data.alreadyActive) {
        return { status: 'already_active' };
      }
      if (data.redeemedDirectly) {
        return { status: 'direct_redeemed' };
      }
      if (data.checkoutUrl) {
        return { status: 'checkout_required', url: data.checkoutUrl };
      }
      if (data.devMode) {
        return { status: 'dev_mode_success' };
      }
      
      return { status: 'error', message: 'Unknown checkout state.' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to start subscription' 
      };
    }
  }
}

export const purchaseMembershipUseCase = new PurchaseMembershipUseCase();
