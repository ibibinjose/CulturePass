/**
 * useDraftRecovery Hook Tests
 *
 * Tests for the draft recovery hook that manages draft loading,
 * cross-device recovery, draft selection, and expiry handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDraftRecovery,
  formatDraftAge,
  calculateDraftCompletion,
  getDraftStepLabel,
} from '../useDraftRecovery';
import { api } from '@/lib/api';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      getDrafts: jest.fn().mockResolvedValue([]),
      getDraft: jest.fn(),
    },
  },
}));

const mockGetDrafts = api.profiles.getDrafts as jest.MockedFunction<typeof api.profiles.getDrafts>;

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockDraft(overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  return {
    id: 'draft-1',
    userId: 'user-123',
    entityType: 'community',
    formData: { entityType: 'community', name: 'Test' },
    currentStep: 2,
    completedSteps: [1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    deviceInfo: { platform: 'web', userAgent: 'Mozilla/5.0' },
    ...overrides,
  } as ProfileDraft;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDraftRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDrafts.mockResolvedValue([]);
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    it('initializes with loading state', () => {
      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('fetches drafts on mount', async () => {
      mockGetDrafts.mockResolvedValue([]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetDrafts).toHaveBeenCalledWith({ entityType: 'community' });
    });

    it('does not fetch drafts when disabled', async () => {
      renderHook(() => useDraftRecovery({ entityType: 'community', enabled: false }), {
        wrapper: createWrapper(),
      });

      // Give time for potential fetch
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockGetDrafts).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Draft Loading
  // -------------------------------------------------------------------------

  describe('draft loading', () => {
    it('loads drafts and shows recovery modal when drafts exist', async () => {
      const mockDraft = createMockDraft();
      mockGetDrafts.mockResolvedValue([mockDraft]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.showRecoveryModal).toBe(true);
    });

    it('does not show modal when no drafts exist', async () => {
      mockGetDrafts.mockResolvedValue([]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(0);
      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('does not show modal when autoShow is false', async () => {
      const mockDraft = createMockDraft();
      mockGetDrafts.mockResolvedValue([mockDraft]);

      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      mockGetDrafts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  // -------------------------------------------------------------------------
  // Expiry Handling
  // -------------------------------------------------------------------------

  describe('expiry handling', () => {
    it('filters out drafts older than 90 days', async () => {
      const recentDraft = createMockDraft({
        id: 'recent-draft',
        updatedAt: new Date().toISOString(),
      });
      const expiredDraft = createMockDraft({
        id: 'expired-draft',
        updatedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockGetDrafts.mockResolvedValue([recentDraft, expiredDraft]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.drafts[0].id).toBe('recent-draft');
    });

    it('keeps drafts exactly at 90 days', async () => {
      const borderlineDraft = createMockDraft({
        id: 'borderline-draft',
        updatedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockGetDrafts.mockResolvedValue([borderlineDraft]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Draft Selection
  // -------------------------------------------------------------------------

  describe('draft selection', () => {
    it('calls onSelectDraft callback when a draft is selected', async () => {
      const mockDraft = createMockDraft({ id: 'draft-1' });
      mockGetDrafts.mockResolvedValue([mockDraft]);
      const onSelectDraft = jest.fn();

      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', onSelectDraft }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleSelectDraft('draft-1');
      });

      expect(onSelectDraft).toHaveBeenCalledWith(mockDraft);
      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('does not call onSelectDraft for non-existent draft ID', async () => {
      const mockDraft = createMockDraft({ id: 'draft-1' });
      mockGetDrafts.mockResolvedValue([mockDraft]);
      const onSelectDraft = jest.fn();

      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', onSelectDraft }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleSelectDraft('non-existent-id');
      });

      expect(onSelectDraft).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Start Fresh
  // -------------------------------------------------------------------------

  describe('start fresh', () => {
    it('calls onStartFresh callback and closes modal', async () => {
      const mockDraft = createMockDraft();
      mockGetDrafts.mockResolvedValue([mockDraft]);
      const onStartFresh = jest.fn();

      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', onStartFresh }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.showRecoveryModal).toBe(true);
      });

      act(() => {
        result.current.handleStartFresh();
      });

      expect(onStartFresh).toHaveBeenCalledTimes(1);
      expect(result.current.showRecoveryModal).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Modal Controls
  // -------------------------------------------------------------------------

  describe('modal controls', () => {
    it('handleDismiss closes the modal', async () => {
      const mockDraft = createMockDraft();
      mockGetDrafts.mockResolvedValue([mockDraft]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.showRecoveryModal).toBe(true);
      });

      act(() => {
        result.current.handleDismiss();
      });

      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('showModal opens the modal manually', async () => {
      mockGetDrafts.mockResolvedValue([]);

      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.showRecoveryModal).toBe(false);

      act(() => {
        result.current.showModal();
      });

      expect(result.current.showRecoveryModal).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-Device Recovery
  // -------------------------------------------------------------------------

  describe('cross-device recovery', () => {
    it('loads drafts with device info from different devices', async () => {
      const webDraft = createMockDraft({
        id: 'web-draft',
        deviceInfo: { platform: 'web', userAgent: 'Chrome' },
        updatedAt: new Date(Date.now() - 1000).toISOString(),
      });
      const mobileDraft = createMockDraft({
        id: 'mobile-draft',
        deviceInfo: { platform: 'ios', userAgent: 'CulturePass/1.0' },
        updatedAt: new Date().toISOString(),
      });

      mockGetDrafts.mockResolvedValue([webDraft, mobileDraft]);

      const { result } = renderHook(() => useDraftRecovery({ entityType: 'community' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(2);
      expect(result.current.drafts.find((d) => d.id === 'web-draft')).toBeDefined();
      expect(result.current.drafts.find((d) => d.id === 'mobile-draft')).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Utility Function Tests
// ---------------------------------------------------------------------------

describe('formatDraftAge', () => {
  it('returns "Just now" for very recent drafts', () => {
    const now = new Date().toISOString();
    expect(formatDraftAge(now)).toBe('Just now');
  });

  it('returns minutes ago for drafts under an hour old', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatDraftAge(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('returns singular minute for 1 minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatDraftAge(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('returns hours ago for drafts under a day old', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatDraftAge(threeHoursAgo)).toBe('3 hours ago');
  });

  it('returns singular hour for 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatDraftAge(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns days ago for drafts under 30 days old', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDraftAge(fiveDaysAgo)).toBe('5 days ago');
  });

  it('returns formatted date for drafts older than 30 days', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatDraftAge(sixtyDaysAgo);
    // Should be a locale date string, not "X days ago"
    expect(result).not.toContain('days ago');
  });
});

describe('calculateDraftCompletion', () => {
  it('returns 0% for no completed steps', () => {
    const draft = createMockDraft({ completedSteps: [] });
    expect(calculateDraftCompletion(draft)).toBe(0);
  });

  it('returns correct percentage for partial completion (community = 7 steps)', () => {
    const draft = createMockDraft({ entityType: 'community', completedSteps: [1, 2, 3] });
    expect(calculateDraftCompletion(draft)).toBe(43);
  });

  it('returns ~86% for 6/7 steps on community', () => {
    const draft = createMockDraft({ entityType: 'community', completedSteps: [1, 2, 3, 4, 5, 6] });
    expect(calculateDraftCompletion(draft)).toBe(86);
  });

  it('returns 100% for all steps on a 6-step entity (venue)', () => {
    const draft = createMockDraft({ entityType: 'venue', completedSteps: [1, 2, 3, 4, 5, 6] });
    expect(calculateDraftCompletion(draft)).toBe(100);
  });

  it('returns ~14% for one completed step on community', () => {
    const draft = createMockDraft({ entityType: 'community', completedSteps: [1] });
    expect(calculateDraftCompletion(draft)).toBe(14);
  });
});

describe('getDraftStepLabel', () => {
  it('returns correct labels for all steps', () => {
    expect(getDraftStepLabel(1)).toBe('Basic Identity');
    expect(getDraftStepLabel(2)).toBe('Media & Branding');
    expect(getDraftStepLabel(3)).toBe('Legal & Compliance');
    expect(getDraftStepLabel(4)).toBe('Location & Operations');
    expect(getDraftStepLabel(5)).toBe('Rich Description');
    expect(getDraftStepLabel(6)).toBe('Review & Publish');
  });

  it('returns correct label for step 7 on 7-step entities', () => {
    expect(getDraftStepLabel(7, 'community')).toBe('Final Review');
  });

  it('returns fallback for unknown step numbers', () => {
    expect(getDraftStepLabel(0)).toBe('Step 0');
    expect(getDraftStepLabel(99)).toBe('Step 99');
  });
});
