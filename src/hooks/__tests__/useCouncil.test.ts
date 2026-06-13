import { renderHook } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../lib/auth';
import { useCouncil } from '../useCouncil';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRefetch = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: jest.fn(() => ({
    state: { city: 'Sydney', country: 'Australia' },
  })),
}));

jest.mock('../../contexts/LocationContext', () => ({
  useLocationOptional: jest.fn(() => null),
}));

jest.mock('../../lib/auth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    userId: 'test-uid',
  })),
}));

jest.mock('../../lib/api', () => ({
  api: {
    council: {
      my: jest.fn(),
      resolve: jest.fn(),
    },
  },
}));

jest.mock('@shared/location/australian-postcodes', () => ({
  getPostcodesByPlace: jest.fn(() => [
    { postcode: 2000, place_name: 'Sydney', state_code: 'NSW' },
  ]),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCouncil hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    (useOnboarding as jest.Mock).mockReturnValue({
      state: { city: 'Sydney', country: 'Australia' },
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: 'test-uid',
    });
  });

  it('should pass enabled: true when authenticated', () => {
    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      }),
    );
  });

  it('should pass enabled: true for guests in Australia with a city (resolve path)', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });

    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      }),
    );
  });

  it('should pass enabled: false for guests without a city', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });
    (useOnboarding as jest.Mock).mockReturnValue({
      state: { city: '', country: 'Australia' },
    });

    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should expose council, councilId, lgaCode from LGA context', () => {
    const mockData = {
      council: { id: 'c1', name: 'City of Sydney', lgaCode: 'LGA12345' },
    };

    (useQuery as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useCouncil());

    expect(result.current.data).toBe(mockData);
    expect(result.current.council).toEqual(mockData.council);
    expect(result.current.councilId).toBe('c1');
    expect(result.current.lgaCode).toBe('LGA12345');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should use council context query key', () => {
    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['/api/council/context', 'my', 'Sydney', 2000, 'NSW'],
      }),
    );
  });
});
