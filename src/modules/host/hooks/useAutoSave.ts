/**
 * Auto-Save Hook
 * 
 * Automatically saves form data every 8 seconds when the form is dirty.
 * Provides save status feedback and error handling.
 * 
 * Usage:
 * ```tsx
 * const { saveStatus, lastSaved, triggerSave } = useAutoSave({
 *   formData,
 *   isDirty,
 *   onSave: async (data) => {
 *     await api.profiles.saveDraft(draftId, data);
 *   },
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions<T> {
  /**
   * Form data to save
   */
  formData: T;
  /**
   * Whether the form has unsaved changes
   */
  isDirty: boolean;
  /**
   * Save function (should return a promise)
   */
  onSave: (data: T) => Promise<void>;
  /**
   * Auto-save interval in milliseconds (default: 8000ms = 8 seconds)
   */
  interval?: number;
  /**
   * Whether auto-save is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Callback when save succeeds
   */
  onSaveSuccess?: () => void;
  /**
   * Callback when save fails
   */
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  /**
   * Current save status
   */
  saveStatus: SaveStatus;
  /**
   * Last successful save timestamp
   */
  lastSaved: Date | null;
  /**
   * Manually trigger a save
   */
  triggerSave: () => Promise<void>;
  /**
   * Whether a save is currently in progress
   */
  isSaving: boolean;
}

/**
 * Auto-save hook for form data
 */
export function useAutoSave<T>({
  formData,
  isDirty,
  onSave,
  interval = 8000,
  enabled = true,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use refs to avoid recreating the interval on every render
  const formDataRef = useRef(formData);
  const isDirtyRef = useRef(isDirty);
  const onSaveRef = useRef(onSave);
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);

  // Update refs when values change
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onSaveSuccessRef.current = onSaveSuccess;
  }, [onSaveSuccess]);

  useEffect(() => {
    onSaveErrorRef.current = onSaveError;
  }, [onSaveError]);

  /**
   * Perform the save operation
   */
  const performSave = useCallback(async () => {
    // Don't save if already saving or not dirty
    if (isSaving || !isDirtyRef.current) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      await onSaveRef.current(formDataRef.current);

      // Update state on success
      setLastSaved(new Date());
      setSaveStatus('saved');
      onSaveSuccessRef.current?.();

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('[useAutoSave] Save failed:', error);
      setSaveStatus('error');
      onSaveErrorRef.current?.(error as Error);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  /**
   * Manually trigger a save
   */
  const triggerSave = useCallback(async () => {
    await performSave();
  }, [performSave]);

  /**
   * Set up auto-save interval
   */
  useEffect(() => {
    if (!enabled || !isDirty) {
      return;
    }

    const timer = setInterval(() => {
      if (isDirtyRef.current && !isSaving) {
        void performSave();
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, isDirty, interval, isSaving, performSave]);

  return {
    saveStatus,
    lastSaved,
    triggerSave,
    isSaving,
  };
}

/**
 * Format last saved time for display
 * 
 * @param lastSaved - Last saved timestamp
 * @returns Formatted string (e.g., "Saved 2 minutes ago")
 */
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) {
    return 'Not saved';
  }

  const now = new Date();
  const diffMs = now.getTime() - lastSaved.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) {
    return 'Saved just now';
  } else if (diffSeconds < 60) {
    return `Saved ${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return `Saved ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `Saved ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `Saved on ${lastSaved.toLocaleDateString()}`;
  }
}
