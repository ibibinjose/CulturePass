import { CancelMembershipUseCase } from '../CancelMembershipUseCase';
import { membershipRepository } from '@/repositories/MembershipRepository';

jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    cancelMembership: jest.fn(),
  },
}));

describe('CancelMembershipUseCase', () => {
  let cancelMembershipUseCase: CancelMembershipUseCase;

  beforeEach(() => {
    cancelMembershipUseCase = new CancelMembershipUseCase();
    jest.clearAllMocks();
  });

  it('should return success when membership is cancelled successfully', async () => {
    (membershipRepository.cancelMembership as jest.Mock).mockResolvedValue(undefined);

    const result = await cancelMembershipUseCase.execute();

    expect(result).toEqual({ status: 'success' });
    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
  });

  it('should return error when membership cancellation fails with an Error object', async () => {
    const errorMessage = 'Network error';
    (membershipRepository.cancelMembership as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await cancelMembershipUseCase.execute();

    expect(result).toEqual({ status: 'error', message: errorMessage });
    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
  });

  it('should return default error message when membership cancellation fails with a non-Error object', async () => {
    (membershipRepository.cancelMembership as jest.Mock).mockRejectedValue('Something went wrong');

    const result = await cancelMembershipUseCase.execute();

    expect(result).toEqual({ status: 'error', message: 'Failed to cancel membership' });
    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
  });
});
