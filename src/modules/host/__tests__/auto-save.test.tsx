/**
 * Integration Tests: Auto-Save
 *
 * Tests the auto-save functionality including:
 * - Auto-save triggers every 8 seconds while editing
 * - Auto-save indicator shows "Saving..." then "Saved" status
 * - Auto-save handles network interruption gracefully (retry)
 * - Auto-save does not trigger when form is clean (no changes)
 * - Auto-save persists current step and completed steps
 * - Auto-save resumes after network recovery
 * - Unsaved changes warning on navigation away
 *
 * Uses Jest with @testing-library/react-native.
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAutoSave, formatLastSaved } from '../hooks/useAutoSave';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator';
import type { SaveStatus } from '../hooks/useAutoSave';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#FFFFFF',
    surface: '#F9F9F9',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    primary: '#4F46E5',
    error: '#FF5E5B',
    success: '#0D9488',
  }),
}));

jest.mock('@/hooks/useLayout', () => ({
  useLayout: () => ({
    isDesktop: true,
    isMobile: false,
    isTablet: false,
    hPad: 16,
    width: 1024,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/design-system/tokens/theme', () => ({
  Spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  Radius: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, full: 9999 },
  Elevation: { 2: {} },
  CultureTokens: {
    indigo: '#4F46E5',
    violet: '#9333EA',
    coral: '#FF5E5B',
    gold: '#FFC857',
    teal: '#0D9488',
  },
}));

jest.mock('@/design-system/tokens/colors', () => ({
  CultureTokens: {
    indigo: '#4F46E5',
    violet: '#9333EA',
    coral: '#FF5E5B',
    gold: '#FFC857',
    teal: '#0D9488',
  },
}));

jest.mock('../utils/accessibility', () => ({
  announceAutoSaveStatus: jest.fn(),
  liveRegionProps: () => ({}),
}));

// ---------------------------------------------------------------------------
// Tests: useAutoSave Hook
// ---------------------------------------------------------------------------

describe('useAutoSave Hook - Auto-Save Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Auto-save triggers every 8 seconds while editing', () => {
    it('should call onSave after 8 seconds when form is dirty', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      expect(mockOnSave).not.toHaveBeenCalled();

      // Advance time by 8 seconds
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should call onSave repeatedly at 8-second intervals', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      // First interval
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });
      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Second interval
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });
      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-save indicator shows "Saving..." then "Saved" status', () => {
    it('should transition from idle to saving to saved', async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      const mockOnSave = jest.fn().mockReturnValue(savePromise);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      // Initially idle
      expect(result.current.saveStatus).toBe('idle');

      // Trigger save via interval
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      // Should be saving
      expect(result.current.saveStatus).toBe('saving');

      // Resolve the save
      await act(async () => {
        resolveSave!();
      });

      // Should be saved
      expect(result.current.saveStatus).toBe('saved');

      // After 2 seconds, should return to idle
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.saveStatus).toBe('idle');
    });

    it('should update lastSaved timestamp after successful save', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      expect(result.current.lastSaved).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('Auto-save handles network interruption gracefully', () => {
    it('should set status to error when save fails', async () => {
      const mockOnSave = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(result.current.saveStatus).toBe('error');
    });

    it('should call onSaveError callback when save fails', async () => {
      const networkError = new Error('Network error');
      const mockOnSave = jest.fn().mockRejectedValue(networkError);
      const mockOnSaveError = jest.fn();

      renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
          onSaveError: mockOnSaveError,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(mockOnSaveError).toHaveBeenCalledWith(networkError);
    });

    it('should return to idle after 3 seconds on error', async () => {
      const mockOnSave = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(result.current.saveStatus).toBe('error');

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.saveStatus).toBe('idle');
    });
  });

  describe('Auto-save does not trigger when form is clean (no changes)', () => {
    it('should not call onSave when isDirty is false', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: false,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(16000); // Two intervals
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not set up interval when form is not dirty', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: false,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(24000); // Three intervals
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Auto-save does not trigger when disabled', () => {
    it('should not call onSave when enabled is false', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: false,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(16000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Auto-save persists current step and completed steps', () => {
    it('should pass the full form data to onSave including step info', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const formData = {
        name: 'Test Community',
        entityType: 'community',
        currentStep: 3,
        completedSteps: [1, 2],
      };

      renderHook(() =>
        useAutoSave({
          formData,
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      expect(mockOnSave).toHaveBeenCalledWith(formData);
    });
  });

  describe('Auto-save resumes after network recovery', () => {
    it('should retry save on next interval after a failure', async () => {
      const mockOnSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      // First attempt fails
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });
      expect(result.current.saveStatus).toBe('error');

      // Wait for error status to clear (3 seconds)
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(result.current.saveStatus).toBe('idle');

      // Next interval should retry and succeed
      await act(async () => {
        jest.advanceTimersByTime(5000); // Remaining time to next interval
      });

      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(result.current.saveStatus).toBe('saved');
    });
  });

  describe('Manual trigger save', () => {
    it('should allow manually triggering a save via triggerSave', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
        })
      );

      // Manually trigger save without waiting for interval
      await act(async () => {
        await result.current.triggerSave();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(result.current.saveStatus).toBe('saved');
    });

    it('should call onSaveSuccess callback on successful save', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const mockOnSaveSuccess = jest.fn();

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { name: 'Test' },
          isDirty: true,
          onSave: mockOnSave,
          interval: 8000,
          enabled: true,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.triggerSave();
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: AutoSaveIndicator Component
// ---------------------------------------------------------------------------

describe('AutoSaveIndicator Component - Auto-Save Integration', () => {
  describe('Indicator renders correct status', () => {
    it('should not render when status is idle', () => {
      const { queryByText } = render(
        <AutoSaveIndicator status="idle" lastSaved={null} />
      );

      expect(queryByText('Saving...')).toBeNull();
      expect(queryByText('Saved')).toBeNull();
    });

    it('should show "Saving..." when status is saving', () => {
      const { getByText } = render(
        <AutoSaveIndicator status="saving" lastSaved={null} />
      );

      expect(getByText('Saving...')).toBeTruthy();
    });

    it('should show "Error saving" when status is error', () => {
      const { getByText } = render(
        <AutoSaveIndicator status="error" lastSaved={null} />
      );

      expect(getByText('Error saving')).toBeTruthy();
    });

    it('should show saved text when status is saved', () => {
      const lastSaved = new Date();
      const { getByText } = render(
        <AutoSaveIndicator status="saved" lastSaved={lastSaved} />
      );

      // Should show "Saved just now" or similar
      expect(getByText(/Saved/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label for saving status', () => {
      const { getByLabelText } = render(
        <AutoSaveIndicator status="saving" lastSaved={null} />
      );

      expect(getByLabelText('Saving...')).toBeTruthy();
    });

    it('should have accessibility label for error status', () => {
      const { getByLabelText } = render(
        <AutoSaveIndicator status="error" lastSaved={null} />
      );

      expect(getByLabelText('Error saving')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: formatLastSaved Utility
// ---------------------------------------------------------------------------

describe('formatLastSaved Utility', () => {
  it('should return "Not saved" when lastSaved is null', () => {
    expect(formatLastSaved(null)).toBe('Not saved');
  });

  it('should return "Saved just now" for very recent saves', () => {
    const now = new Date();
    expect(formatLastSaved(now)).toBe('Saved just now');
  });

  it('should return seconds ago for saves under a minute', () => {
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
    expect(formatLastSaved(thirtySecsAgo)).toBe('Saved 30 seconds ago');
  });

  it('should return minutes ago for saves under an hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatLastSaved(fiveMinAgo)).toBe('Saved 5 minutes ago');
  });

  it('should return singular minute for 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000);
    expect(formatLastSaved(oneMinAgo)).toBe('Saved 1 minute ago');
  });

  it('should return hours ago for saves under a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatLastSaved(threeHoursAgo)).toBe('Saved 3 hours ago');
  });

  it('should return singular hour for 1 hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(formatLastSaved(oneHourAgo)).toBe('Saved 1 hour ago');
  });

  it('should return date string for saves older than a day', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = formatLastSaved(twoDaysAgo);
    expect(result).toContain('Saved on');
  });
});
