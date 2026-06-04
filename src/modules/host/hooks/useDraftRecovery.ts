/**
 * Draft Recovery Hook
 * 
 * Manages draft recovery flow for profile creation forms.
 * Fetches available drafts and provides UI state for draft selection modal.
 * 
 * Usage:
 * ```tsx
 * const {
 *   drafts,
 *   isLoading,
 *   showRecoveryModal,
 *   handleSelectDraft,
 *   handleStartFresh,
 *   handleDismiss,
 * } = useDraftRecovery({
 *   entityType: 'community',
 *   onSelectDraft: (draft) => {
 *     // Load draft into form
 *   },
 * });
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

export interface UseDraftRecoveryOptions {
  /**
   * Entity type to filter drafts
   */
  entityType?: string;
  /**
   * Callback when a draft is selected
   */
  onSelectDraft?: (draft: ProfileDraft) => void;
  /**
   * Callback when user chooses to start fresh
   */
  onStartFresh?: () => void;
  /**
   * Whether to automatically show recovery modal if drafts exist
   * (default: true)
   */
  autoShow?: boolean;
  /**
   * Whether draft recovery is enabled
   * (default: true)
   */
  enabled?: boolean;
}

export interface UseDraftRecoveryReturn {
  /**
   * Available drafts
   */
  drafts: ProfileDraft[];
  /**
   * Whether drafts are being loaded
   */
  isLoading: boolean;
  /**
   * Whether there was an error loading drafts
   */
  isError: boolean;
  /**
   * Error object if loading failed
   */
  error: Error | null;
  /**
   * Whether to show the recovery modal
   */
  showRecoveryModal: boolean;
  /**
   * Select a draft and load it into the form
   */
  handleSelectDraft: (draftId: string) => void;
  /**
   * Start fresh (dismiss modal and don't load any draft)
   */
  handleStartFresh: () => void;
  /**
   * Dismiss the recovery modal without taking action
   */
  handleDismiss: () => void;
  /**
   * Manually show the recovery modal
   */
  showModal: () => void;
  /**
   * Refetch drafts
   */
  refetch: () => void;
}

/**
 * Draft recovery hook
 */
export function useDraftRecovery({
  entityType,
  onSelectDraft,
  onStartFresh,
  autoShow = true,
  enabled = true,
}: UseDraftRecoveryOptions = {}): UseDraftRecoveryReturn {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Fetch drafts from API
  const {
    data: drafts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-drafts', entityType],
    queryFn: async () => {
      const allDrafts = await api.profiles.getDrafts(
        entityType ? { entityType } : undefined
      );
      // Filter out expired drafts (older than 90 days)
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return allDrafts.filter((draft) => {
        const updatedAt = new Date(draft.updatedAt);
        return updatedAt > ninetyDaysAgo;
      });
    },
    enabled,
    staleTime: 5000, // Keep fresh for 5 seconds to avoid spamming refetches during rapid edits
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });


  // Show recovery modal if drafts exist and autoShow is enabled
  useEffect(() => {
    if (autoShow && drafts.length > 0 && !isLoading) {
      setShowRecoveryModal(true);
    }
  }, [autoShow, drafts.length, isLoading]);

  /**
   * Handle draft selection
   */
  const handleSelectDraft = useCallback(
    (draftId: string) => {
      const selectedDraft = drafts.find((d) => d.id === draftId);
      if (selectedDraft) {
        onSelectDraft?.(selectedDraft);
        setShowRecoveryModal(false);
      }
    },
    [drafts, onSelectDraft]
  );

  /**
   * Handle start fresh
   */
  const handleStartFresh = useCallback(() => {
    onStartFresh?.();
    setShowRecoveryModal(false);
  }, [onStartFresh]);

  /**
   * Handle dismiss (close modal without action)
   */
  const handleDismiss = useCallback(() => {
    setShowRecoveryModal(false);
  }, []);

  /**
   * Manually show the recovery modal
   */
  const showModal = useCallback(() => {
    setShowRecoveryModal(true);
  }, []);

  return {
    drafts,
    isLoading,
    isError,
    error: error as Error | null,
    showRecoveryModal,
    handleSelectDraft,
    handleStartFresh,
    handleDismiss,
    showModal,
    refetch,
  };
}

/**
 * Format draft age for display
 * 
 * @param updatedAt - Draft last updated timestamp
 * @returns Formatted string (e.g., "2 hours ago")
 */
export function formatDraftAge(updatedAt: string): string {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return updated.toLocaleDateString();
  }
}

/**
 * Calculate draft completion percentage
 * 
 * @param draft - Profile draft
 * @returns Completion percentage (0-100)
 */
export function calculateDraftCompletion(draft: ProfileDraft): number {
  // Community and business now have 7 steps (see useFormWizard.getTotalSteps)
  const totalSteps = (draft.entityType === 'community' || draft.entityType === 'business') ? 7 : 6;
  const completedSteps = draft.completedSteps?.length ?? 0;
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Get draft step label
 * 
 * @param step - Step number (1-6)
 * @returns Step label
 */
export function getDraftStepLabel(step: number, entityType?: string): string {
  const baseLabels: Record<number, string> = {
    1: 'Basic Identity',
    2: 'Media & Branding',
    3: 'Legal & Compliance',
    4: 'Location & Operations',
    5: 'Rich Description',
    6: 'Review & Publish',
    7: 'Final Review', // 7th step for community/business
  };
  return baseLabels[step] || `Step ${step}`;
}
