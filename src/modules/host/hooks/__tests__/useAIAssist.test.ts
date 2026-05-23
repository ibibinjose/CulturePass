/**
 * useAIAssist Hook Tests
 * 
 * Tests for the AI text assistance hook.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAIAssist } from '../useAIAssist';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    ai: {
      assist: jest.fn(),
    },
  },
}));

describe('useAIAssist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAIAssist());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);
  });

  it('calculates readability score correctly', () => {
    const { result } = renderHook(() => useAIAssist());

    const score = result.current.calculateReadability(
      'This is a simple sentence. It is easy to read. Everyone can understand it.'
    );

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('processes text successfully', async () => {
    const mockResponse = {
      suggestedText: 'Improved text here',
    };

    (api.ai.assist as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIAssist());

    await act(async () => {
      await result.current.processText('Original text', 'improve', 'description');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toEqual({
      originalText: 'Original text',
      suggestedText: 'Improved text here',
      operation: 'improve',
      readabilityScore: expect.any(Number),
    });
    expect(result.current.error).toBe(null);
  });

  it('handles API errors', async () => {
    const mockError = new Error('API error');
    (api.ai.assist as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAIAssist());

    await act(async () => {
      await result.current.processText('Original text', 'improve', 'description');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('API error');
    expect(result.current.result).toBe(null);
  });

  it('validates empty text', async () => {
    const { result } = renderHook(() => useAIAssist());

    await act(async () => {
      await result.current.processText('', 'improve', 'description');
    });

    expect(result.current.error).toBe('Please enter some text first');
    expect(api.ai.assist).not.toHaveBeenCalled();
  });

  it('clears result', () => {
    const { result } = renderHook(() => useAIAssist());

    act(() => {
      result.current.clearResult();
    });

    expect(result.current.result).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('sets loading state during processing', async () => {
    (api.ai.assist as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ suggestedText: 'Test' }), 100))
    );

    const { result } = renderHook(() => useAIAssist());

    act(() => {
      result.current.processText('Original text', 'improve', 'description');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
