/**
 * Integration Tests: Draft Recovery
 *
 * Tests the draft recovery flow including modal display, draft selection,
 * start fresh behavior, cross-device recovery, draft expiry, and multi-draft handling.
 *
 * Uses Jest with @testing-library/react-native.
 * Mocks: API layer (api.profiles.*), TanStack Query (QueryClientProvider), navigation (expo-router).
 */

import React from 'react';
import { render, fireEvent, waitFor, act , renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DraftRecoveryModal } from '../components/DraftRecoveryModal';
import {
  useDraftRecovery,
  formatDraftAge,
  calculateDraftCompletion,
  getDraftStepLabel,
} from '../hooks/useDraftRecovery';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

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
  useIsDark: () => false,
  useColor: (key: string) => '#000000',
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
  CultureTokens: {
    indigo: '#4F46E5',
    violet: '#9333EA',
    coral: '#FF5E5B',
    gold: '#FFC857',
    teal: '#0D9488',
  },
}));

jest.mock('@/design-system/tokens/typography', () => ({
  TextStyles: {
    title2: { fontSize: 22, fontWeight: '700' },
    body: { fontSize: 16 },
    callout: { fontSize: 15 },
    caption: { fontSize: 12 },
  },
}));

// Mock API for hook tests
const mockGetDrafts = jest.fn().mockResolvedValue([]);
jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      getDrafts: (...args: unknown[]) => mockGetDrafts(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

function createMockDraft(overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  return {
    id: 'draft-1',
    userId: 'user-1',
    entityType: 'community',
    formData: { name: 'Test Community' },
    currentStep: 2,
    completedSteps: [1],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

const communityDraft = createMockDraft({
  id: 'draft-community-1',
  entityType: 'community',
  formData: { name: 'Sydney Cultural Hub' },
  currentStep: 3,
  completedSteps: [1, 2],
  updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
});

const venueDraft = createMockDraft({
  id: 'draft-venue-1',
  entityType: 'venue',
  formData: { name: 'The Grand Hall' },
  currentStep: 4,
  completedSteps: [1, 2, 3],
  updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
});

const businessDraft = createMockDraft({
  id: 'draft-business-1',
  entityType: 'business',
  formData: { name: 'Spice Market' },
  currentStep: 2,
  completedSteps: [1],
  updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
});

const artistDraft = createMockDraft({
  id: 'draft-artist-1',
  entityType: 'artist',
  formData: { name: 'DJ Kulture' },
  currentStep: 5,
  completedSteps: [1, 2, 3, 4],
  updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
});

const webDraft = createMockDraft({
  id: 'draft-web-1',
  entityType: 'professional',
  formData: { name: 'Jane Smith Consulting' },
  currentStep: 3,
  completedSteps: [1, 2],
  updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  deviceInfo: { platform: 'web', userAgent: 'Chrome/120' },
});

const mobileDraft = createMockDraft({
  id: 'draft-mobile-1',
  entityType: 'professional',
  formData: { name: 'Jane Smith Mobile Draft' },
  currentStep: 4,
  completedSteps: [1, 2, 3],
  updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  deviceInfo: { platform: 'ios', userAgent: 'CulturePass/1.0 iOS' },
});

// Expired draft (older than 90 days)
const expiredDraft = createMockDraft({
  id: 'draft-expired-1',
  entityType: 'organiser',
  formData: { name: 'Old Events Co' },
  currentStep: 2,
  completedSteps: [1],
  updatedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
});

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests: DraftRecoveryModal Component
// ---------------------------------------------------------------------------

describe('DraftRecoveryModal Integration - Draft Recovery', () => {
  const mockOnSelectDraft = jest.fn();
  const mockOnStartFresh = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft recovery modal appears when returning to incomplete form', () => {
    it('should render the modal when visible is true and drafts are provided', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText('Continue Your Work?')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <DraftRecoveryModal
          visible={false}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(queryByText('Continue Your Work?')).toBeNull();
    });

    it('should display draft count in the description', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText(/You have 2 incomplete profiles/)).toBeTruthy();
    });

    it('should display singular text for a single draft', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText(/You have 1 incomplete profile\./)).toBeTruthy();
    });
  });

  describe('Selecting a draft restores form state to correct step', () => {
    it('should call onSelectDraft with the draft ID when a draft card is pressed', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      const draftName = getByText('Sydney Cultural Hub');
      fireEvent.press(draftName.parent!);

      expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-community-1');
    });

    it('should call onSelectDraft with most recent draft when "Continue Most Recent" is pressed', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByText('Continue Most Recent'));

      expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-community-1');
    });

    it('should display the current step label for the draft', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      // communityDraft is on step 3 = "Legal & Compliance"
      expect(getByText('On: Legal & Compliance')).toBeTruthy();
    });

    it('should display the completion percentage', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      // communityDraft (7-step entity) has 2 completed steps out of 7 ≈ 29%
      expect(getByText('29%')).toBeTruthy();
    });
  });

  describe('Starting fresh creates new empty form', () => {
    it('should call onStartFresh when "Start Fresh" button is pressed', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByText('Start Fresh'));

      expect(mockOnStartFresh).toHaveBeenCalledTimes(1);
    });

    it('should not call onSelectDraft when starting fresh', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByText('Start Fresh'));

      expect(mockOnSelectDraft).not.toHaveBeenCalled();
    });

    it('should call onDismiss when "Dismiss" button is pressed', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByText('Dismiss'));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple drafts from different devices shown correctly', () => {
    it('should display all drafts in a scrollable list', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft, businessDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText('Sydney Cultural Hub')).toBeTruthy();
      expect(getByText('The Grand Hall')).toBeTruthy();
      expect(getByText('Spice Market')).toBeTruthy();
      expect(getByText(/You have 3 incomplete profiles/)).toBeTruthy();
    });

    it('should display entity type badges for each draft', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft, businessDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText('Community')).toBeTruthy();
      expect(getByText('Venue')).toBeTruthy();
      expect(getByText('Business')).toBeTruthy();
    });

    it('should allow selecting any draft from the list', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft, businessDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      const venueName = getByText('The Grand Hall');
      fireEvent.press(venueName.parent!);

      expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-venue-1');
    });

    it('should display different step labels for drafts at different stages', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText('On: Legal & Compliance')).toBeTruthy();
      expect(getByText('On: Location & Operations')).toBeTruthy();
    });

    it('should display progress bars for each draft', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[communityDraft, venueDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      // communityDraft (7-step): 2/7 ≈ 29%
      expect(getByText('29%')).toBeTruthy();
      // venueDraft (6-step): 3/6 = 50%
      expect(getByText('50%')).toBeTruthy();
    });
  });

  describe('Cross-device draft sync (web draft recovered on mobile)', () => {
    it('should display drafts from different devices with device info', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[webDraft, mobileDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      // Both drafts should be visible
      expect(getByText('Jane Smith Consulting')).toBeTruthy();
      expect(getByText('Jane Smith Mobile Draft')).toBeTruthy();
      expect(getByText(/You have 2 incomplete profiles/)).toBeTruthy();
    });

    it('should allow selecting a draft created on a different device', () => {
      const { getByText } = render(
        <DraftRecoveryModal
          visible={true}
          drafts={[webDraft, mobileDraft]}
          onSelectDraft={mockOnSelectDraft}
          onStartFresh={mockOnStartFresh}
          onDismiss={mockOnDismiss}
        />
      );

      // Select the most recent (first in array = webDraft) via Continue Most Recent
      fireEvent.press(getByText('Continue Most Recent'));

      expect(mockOnSelectDraft).toHaveBeenCalledWith('draft-web-1');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: useDraftRecovery Hook
// ---------------------------------------------------------------------------

describe('useDraftRecovery Hook - Draft Recovery Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft expiry (90 days) handled correctly', () => {
    it('should filter out drafts older than 90 days', async () => {
      // Return both valid and expired drafts from API
      mockGetDrafts.mockResolvedValueOnce([communityDraft, expiredDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Only the non-expired draft should be returned
      expect(result.current.drafts).toHaveLength(1);
      expect(result.current.drafts[0].id).toBe('draft-community-1');
    });

    it('should return empty array when all drafts are expired', async () => {
      mockGetDrafts.mockResolvedValueOnce([expiredDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'organiser', autoShow: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.drafts).toHaveLength(0);
    });
  });

  describe('Hook state management', () => {
    it('should show recovery modal when drafts exist and autoShow is true', async () => {
      mockGetDrafts.mockResolvedValueOnce([communityDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.showRecoveryModal).toBe(true);
      });
    });

    it('should not show recovery modal when autoShow is false', async () => {
      mockGetDrafts.mockResolvedValueOnce([communityDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('should hide modal when handleStartFresh is called', async () => {
      const mockOnStartFresh = jest.fn();
      mockGetDrafts.mockResolvedValueOnce([communityDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () =>
          useDraftRecovery({
            entityType: 'community',
            autoShow: true,
            onStartFresh: mockOnStartFresh,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.showRecoveryModal).toBe(true);
      });

      act(() => {
        result.current.handleStartFresh();
      });

      expect(result.current.showRecoveryModal).toBe(false);
      expect(mockOnStartFresh).toHaveBeenCalled();
    });

    it('should call onSelectDraft callback when a draft is selected', async () => {
      const mockOnSelectDraft = jest.fn();
      mockGetDrafts.mockResolvedValueOnce([communityDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () =>
          useDraftRecovery({
            entityType: 'community',
            autoShow: true,
            onSelectDraft: mockOnSelectDraft,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.drafts).toHaveLength(1);
      });

      act(() => {
        result.current.handleSelectDraft('draft-community-1');
      });

      expect(mockOnSelectDraft).toHaveBeenCalledWith(communityDraft);
      expect(result.current.showRecoveryModal).toBe(false);
    });

    it('should hide modal when handleDismiss is called', async () => {
      mockGetDrafts.mockResolvedValueOnce([communityDraft]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useDraftRecovery({ entityType: 'community', autoShow: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.showRecoveryModal).toBe(true);
      });

      act(() => {
        result.current.handleDismiss();
      });

      expect(result.current.showRecoveryModal).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: Utility Functions
// ---------------------------------------------------------------------------

describe('Draft Recovery Utility Functions', () => {
  describe('formatDraftAge', () => {
    it('should return "Just now" for very recent drafts', () => {
      const now = new Date().toISOString();
      expect(formatDraftAge(now)).toBe('Just now');
    });

    it('should return minutes ago for drafts under an hour old', () => {
      const thirtyMinAgo = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();
      expect(formatDraftAge(thirtyMinAgo)).toBe('30 minutes ago');
    });

    it('should return hours ago for drafts under a day old', () => {
      const fiveHoursAgo = new Date(
        Date.now() - 5 * 60 * 60 * 1000
      ).toISOString();
      expect(formatDraftAge(fiveHoursAgo)).toBe('5 hours ago');
    });

    it('should return days ago for drafts under 30 days old', () => {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(formatDraftAge(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return formatted date for drafts older than 30 days', () => {
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      const result = formatDraftAge(sixtyDaysAgo);
      // Should be a date string (locale-dependent)
      expect(result).not.toContain('ago');
    });
  });

  describe('calculateDraftCompletion', () => {
    it('should return 0% for draft with no completed steps', () => {
      const draft = createMockDraft({ completedSteps: [] });
      expect(calculateDraftCompletion(draft)).toBe(0);
    });

    it('should return ~14% for community draft with 1 completed step (7-step entity)', () => {
      const draft = createMockDraft({ entityType: 'community', completedSteps: [1] });
      expect(calculateDraftCompletion(draft)).toBe(14);
    });

    it('should return ~43% for community draft with 3 completed steps (7-step entity)', () => {
      const draft = createMockDraft({ entityType: 'community', completedSteps: [1, 2, 3] });
      expect(calculateDraftCompletion(draft)).toBe(43);
    });

    it('should return 100% for venue draft with all 6 steps completed (6-step entity)', () => {
      const draft = createMockDraft({ entityType: 'venue', completedSteps: [1, 2, 3, 4, 5, 6] });
      expect(calculateDraftCompletion(draft)).toBe(100);
    });
  });

  describe('getDraftStepLabel', () => {
    it('should return correct label for each step', () => {
      expect(getDraftStepLabel(1)).toBe('Basic Identity');
      expect(getDraftStepLabel(2)).toBe('Media & Branding');
      expect(getDraftStepLabel(3)).toBe('Legal & Compliance');
      expect(getDraftStepLabel(4)).toBe('Location & Operations');
      expect(getDraftStepLabel(5)).toBe('Rich Description');
      expect(getDraftStepLabel(6)).toBe('Review & Publish');
      expect(getDraftStepLabel(7, 'community')).toBe('Final Review');
    });

    it('should return fallback for invalid step numbers', () => {
      expect(getDraftStepLabel(0)).toBe('Step 0');
    });

    it('should return label for step 7 when entity uses 7 steps', () => {
      expect(getDraftStepLabel(7, 'community')).toBe('Final Review');
    });
  });
});
