import { PurchaseMembershipUseCase } from '../PurchaseMembershipUseCase';
import { membershipRepository } from '@/repositories/MembershipRepository';

jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    subscribe: jest.fn(),
  },
}));

describe('PurchaseMembershipUseCase', () => {
  let purchaseMembershipUseCase: PurchaseMembershipUseCase;

  beforeEach(() => {
    purchaseMembershipUseCase = new PurchaseMembershipUseCase();
    jest.clearAllMocks();
  });

  it('should return already_active when membership is already active', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      alreadyActive: true,
    });

    const result = await purchaseMembershipUseCase.execute('monthly');

    expect(result).toEqual({ status: 'already_active' });
    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
  });

  it('should return checkout_required with url when checkoutUrl is provided', async () => {
    const checkoutUrl = 'https://stripe.com/checkout';
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      checkoutUrl,
    });

    const result = await purchaseMembershipUseCase.execute('yearly');

    expect(result).toEqual({ status: 'checkout_required', url: checkoutUrl });
    expect(membershipRepository.subscribe).toHaveBeenCalledWith('yearly');
  });

  it('should return dev_mode_success when devMode is true', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      devMode: true,
    });

    const result = await purchaseMembershipUseCase.execute('monthly');

    expect(result).toEqual({ status: 'dev_mode_success' });
    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
  });

  it('should return error when repository returns unknown state', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({});

    const result = await purchaseMembershipUseCase.execute('monthly');

    expect(result).toEqual({ status: 'error', message: 'Unknown checkout state.' });
  });

  it('should return error when repository throws an Error object', async () => {
    const errorMessage = 'API Failure';
    (membershipRepository.subscribe as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await purchaseMembershipUseCase.execute('monthly');

    expect(result).toEqual({ status: 'error', message: errorMessage });
  });

  it('should return default error message when repository throws a non-Error object', async () => {
    (membershipRepository.subscribe as jest.Mock).mockRejectedValue('Fatal Error');

    const result = await purchaseMembershipUseCase.execute('monthly');

    expect(result).toEqual({ status: 'error', message: 'Failed to start subscription' });
  });
});
