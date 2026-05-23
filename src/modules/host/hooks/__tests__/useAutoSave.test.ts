/**
 * useAutoSave Hook Tests
 *
 * Tests for the auto-save hook that persists form data every 8 seconds.
 * Covers auto-save triggers, dirty state handling, status transitions,
 * error handling, manual save, and cleanup on unmount.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAutoSave, formatLastSaved } from '../useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    it('initializes with idle status', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community' },
          isDirty: false,
          onSave,
        })
      );

      expect(result.current.saveStatus).toBe('idle');
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.isSaving).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Auto-save triggers
  // -------------------------------------------------------------------------

  describe('auto-save triggers', () => {
    it('triggers save after 8 seconds when form is dirty', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      // Advance time by 8 seconds (default interval)
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger save when form is not dirty', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community' },
          isDirty: false,
          onSave,
        })
      );

      act(() => {
        jest.advanceTimersByTime(16000); // 2 intervals
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('does not trigger save when disabled', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
          enabled: false,
        })
      );

      act(() => {
        jest.advanceTimersByTime(16000);
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('uses custom interval when provided', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
          interval: 5000,
        })
      );

      // Should not fire at 4 seconds
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(onSave).not.toHaveBeenCalled();

      // Should fire at 5 seconds
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Save status transitions
  // -------------------------------------------------------------------------

  describe('save status transitions', () => {
    it('transitions from idle → saving → saved → idle on success', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      expect(result.current.saveStatus).toBe('idle');

      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      // Should be saving
      await waitFor(() => {
        expect(result.current.saveStatus).toBe('saved');
      });

      // After 2 seconds, should return to idle
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('idle');
      });
    });

    it('transitions to error status on save failure', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('error');
      });

      // After 3 seconds, should return to idle
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('idle');
      });
    });

    it('updates lastSaved on successful save', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      expect(result.current.lastSaved).toBeNull();

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(result.current.lastSaved).toBeInstanceOf(Date);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('calls onSaveError callback on failure', async () => {
      const onSaveError = jest.fn();
      const error = new Error('Save failed');
      const onSave = jest.fn().mockRejectedValue(error);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
          onSaveError,
        })
      );

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(onSaveError).toHaveBeenCalledWith(error);
      });
    });

    it('calls onSaveSuccess callback on success', async () => {
      const onSaveSuccess = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
          onSaveSuccess,
        })
      );

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Manual save trigger
  // -------------------------------------------------------------------------

  describe('manual save trigger', () => {
    it('triggers save immediately via triggerSave', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      await act(async () => {
        await result.current.triggerSave();
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({
        entityType: 'community',
        officialName: 'Test',
      });
    });

    it('does not save via triggerSave when not dirty', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community' },
          isDirty: false,
          onSave,
        })
      );

      await act(async () => {
        await result.current.triggerSave();
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  describe('cleanup on unmount', () => {
    it('clears interval on unmount', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { unmount } = renderHook(() =>
        useAutoSave({
          formData: { entityType: 'community', officialName: 'Test' },
          isDirty: true,
          onSave,
        })
      );

      unmount();

      // Advance time past the interval — save should NOT fire
      act(() => {
        jest.advanceTimersByTime(16000);
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // formatLastSaved utility
  // -------------------------------------------------------------------------

  describe('formatLastSaved', () => {
    it('returns "Not saved" when lastSaved is null', () => {
      expect(formatLastSaved(null)).toBe('Not saved');
    });

    it('returns "Saved just now" for recent saves (< 10 seconds)', () => {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5000);
      expect(formatLastSaved(fiveSecondsAgo)).toBe('Saved just now');
    });

    it('returns seconds ago for saves between 10-59 seconds', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      expect(formatLastSaved(thirtySecondsAgo)).toBe('Saved 30 seconds ago');
    });

    it('returns minutes ago for saves between 1-59 minutes', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatLastSaved(fiveMinutesAgo)).toBe('Saved 5 minutes ago');
    });

    it('returns singular minute for 1 minute', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      expect(formatLastSaved(oneMinuteAgo)).toBe('Saved 1 minute ago');
    });

    it('returns hours ago for saves between 1-23 hours', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatLastSaved(twoHoursAgo)).toBe('Saved 2 hours ago');
    });

    it('returns date for saves older than 24 hours', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatLastSaved(twoDaysAgo);
      expect(result).toMatch(/^Saved on /);
    });
  });
});
