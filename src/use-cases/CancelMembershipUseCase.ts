import { membershipRepository } from '@/repositories/MembershipRepository';

export type CancelResult = 
  | { status: 'success' }
  | { status: 'error'; message: string };

export class CancelMembershipUseCase {
  async execute(): Promise<CancelResult> {
    try {
      await membershipRepository.cancelMembership();
      return { status: 'success' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to cancel membership' 
      };
    }
  }
}

export const cancelMembershipUseCase = new CancelMembershipUseCase();
