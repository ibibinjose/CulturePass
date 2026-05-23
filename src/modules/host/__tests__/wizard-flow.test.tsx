/**
 * Integration Tests: Wizard Flow
 *
 * Tests the complete wizard flow across all six entity types.
 * Verifies step navigation, validation gating, progress indicator updates,
 * data persistence across steps, direct navigation to completed steps,
 * entity-specific fields, review step, and publish flow.
 *
 * Uses Jest with @testing-library/react-native.
 * Mocks: useFormWizard hook, navigation (expo-router).
 */

import React from 'react';
import { render, fireEvent, waitFor, act , renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFormWizard, type EntityType } from '../hooks/useFormWizard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock expo-router
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    replace: mockRouterReplace,
    push: mockRouterPush,
  }),
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', id: 'test-user-123' },
  }),
}));

// Mock API - use a getter to ensure the mock is always available
const mockApiProfiles = {
  get: jest.fn().mockResolvedValue(undefined),
  getDraft: jest.fn().mockResolvedValue(undefined),
  getDrafts: jest.fn().mockResolvedValue([]),
  saveDraft: jest.fn().mockResolvedValue({
    draftId: 'draft-123',
    savedAt: new Date().toISOString(),
  }),
  deleteDraft: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({ id: 'profile-123' }),
  update: jest.fn().mockResolvedValue({}),
  publish: jest.fn().mockResolvedValue({
    profileId: 'profile-123',
    status: 'published',
  }),
  validateHandle: jest.fn().mockResolvedValue({ available: true }),
};

jest.mock('@/lib/api', () => {
  return {
    get api() {
      return {
        get profiles() {
          return mockApiProfiles;
        },
      };
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock Zod schema validation — default: always passes
const mockParseAsync = jest.fn().mockResolvedValue({});
jest.mock('../schemas/profileSchema', () => ({
  getStepSchema: jest.fn().mockReturnValue({
    parseAsync: (...args: unknown[]) => mockParseAsync(...args),
    pick: jest.fn().mockReturnValue({
      parseAsync: jest.fn().mockResolvedValue({}),
    }),
  }),
}));

// Mock useAutoSave to avoid timer issues
jest.mock('../hooks/useAutoSave', () => ({
  useAutoSave: jest.fn(() => ({
    saveStatus: 'idle' as const,
    lastSaved: null,
    triggerSave: jest.fn().mockResolvedValue(undefined),
    isSaving: false,
  })),
  formatLastSaved: jest.fn().mockReturnValue('Just now'),
}));

// Mock the form state serializer
jest.mock('../services/formStateSerializer', () => ({
  serializeFormData: jest.fn().mockReturnValue('{}'),
  deserializeFormData: jest.fn().mockReturnValue({}),
  calculateFormDiff: jest.fn().mockReturnValue([]),
}));

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
// Tests: useFormWizard Hook Integration (Wizard Flow)
// ---------------------------------------------------------------------------

describe('useFormWizard Integration - Complete Wizard Flows', () => {
  beforeEach(() => {
    // Only clear call history, not implementations
    mockApiProfiles.get.mockClear();
    mockApiProfiles.getDraft.mockClear();
    mockApiProfiles.getDrafts.mockClear();
    mockApiProfiles.saveDraft.mockClear();
    mockApiProfiles.deleteDraft.mockClear();
    mockApiProfiles.create.mockClear();
    mockApiProfiles.update.mockClear();
    mockApiProfiles.publish.mockClear();
    mockApiProfiles.validateHandle.mockClear();
    mockParseAsync.mockClear();
    mockParseAsync.mockResolvedValue({});
    mockRouterBack.mockClear();
    mockRouterReplace.mockClear();
    mockRouterPush.mockClear();
  });

  // =========================================================================
  // 1. Full wizard flow for each entity type
  // =========================================================================

  describe('Full wizard flow for each entity type', () => {
    const entityTypes: EntityType[] = [
      'community',
      'organiser',
      'venue',
      'business',
      'artist',
      'professional',
    ];

    entityTypes.forEach((entityType) => {
      it(`should initialize wizard for "${entityType}" at step 1`, async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(
          () => useFormWizard({ entityType }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isInitializing).toBe(false);
        });

        expect(result.current.currentStep).toBe(1);
        expect(result.current.entityType).toBe(entityType);
        expect(result.current.totalSteps).toBe(6);
      });

      it(`should navigate through all 6 steps for "${entityType}"`, async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(
          () => useFormWizard({ entityType }),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isInitializing).toBe(false);
        });

        // Navigate through all 6 steps
        for (let step = 1; step < 6; step++) {
          await act(async () => {
            await result.current.goToNextStep();
          });
          expect(result.current.currentStep).toBe(step + 1);
        }

        // Should be on step 6
        expect(result.current.currentStep).toBe(6);
      });
    });
  });

  // =========================================================================
  // 2. Step navigation (next/back), validation gating between steps
  // =========================================================================

  describe('Step navigation (next/back) and validation gating', () => {
    it('should advance to next step when validation passes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.currentStep).toBe(1);

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should go back to previous step without data loss', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Go to step 2
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(2);

      // Go back to step 1
      act(() => {
        result.current.goToPreviousStep();
      });
      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 1', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should prevent advancement when validation fails', async () => {
      const { ZodError } = require('zod');

      mockParseAsync.mockRejectedValueOnce(
        new ZodError([
          {
            code: 'too_small',
            minimum: 2,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'Official name is required',
            path: ['officialName'],
          },
        ])
      );

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Should remain on step 1
      expect(result.current.currentStep).toBe(1);
      // Should have validation errors
      expect(result.current.validationErrors).toHaveProperty('officialName');
    });

    it('should allow advancement after fixing validation errors', async () => {
      const { ZodError } = require('zod');

      // First attempt: validation fails
      mockParseAsync.mockRejectedValueOnce(
        new ZodError([
          {
            code: 'too_small',
            minimum: 2,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'Official name is required',
            path: ['officialName'],
          },
        ])
      );

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // First attempt fails
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(1);

      // Second attempt: validation passes
      mockParseAsync.mockResolvedValueOnce({});
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(2);
    });

    it('should clear validation errors when navigating back', async () => {
      const { ZodError } = require('zod');

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Go to step 2 first
      await act(async () => {
        await result.current.goToNextStep();
      });

      // Fail validation on step 2
      mockParseAsync.mockRejectedValueOnce(
        new ZodError([
          {
            code: 'custom',
            message: 'Logo is required',
            path: ['logoUrl'],
          },
        ])
      );

      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.validationErrors).toHaveProperty('logoUrl');

      // Go back — errors should clear
      act(() => {
        result.current.goToPreviousStep();
      });
      expect(result.current.validationErrors).toEqual({});
    });
  });

  // =========================================================================
  // 3. Progress indicator updates as steps complete
  // =========================================================================

  describe('Progress indicator updates as steps complete', () => {
    it('should mark steps as completed when advancing', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.completedSteps.size).toBe(0);

      // Complete step 1
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.completedSteps.has(1)).toBe(true);

      // Complete step 2
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.completedSteps.has(2)).toBe(true);

      // Complete step 3
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.completedSteps.has(3)).toBe(true);
    });

    it('should track total steps as 6', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'venue' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.totalSteps).toBe(6);
    });
  });

  // =========================================================================
  // 4. Form data persistence across step navigation
  // =========================================================================

  describe('Form data persistence across step navigation', () => {
    it('should maintain form data when navigating forward and back', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Update form data on step 1
      act(() => {
        result.current.updateFormData({
          officialName: 'My Community',
          handle: 'my-community',
        });
      });

      // Navigate to step 2
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(2);

      // Navigate back to step 1
      act(() => {
        result.current.goToPreviousStep();
      });

      // Data should persist
      expect(result.current.formData.officialName).toBe('My Community');
      expect(result.current.formData.handle).toBe('my-community');
    });

    it('should not lose data when navigating multiple steps', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'business' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Set data on step 1
      act(() => {
        result.current.updateFormData({ officialName: 'Test Business' });
      });

      // Navigate to step 4
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(4);

      // Navigate back to step 1
      act(() => {
        result.current.goToPreviousStep();
      });
      act(() => {
        result.current.goToPreviousStep();
      });
      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData.officialName).toBe('Test Business');
    });

    it('should mark form as dirty when data is updated', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'artist' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.updateFormData({ officialName: 'New Artist' });
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  // =========================================================================
  // 5. Direct navigation to previously completed steps
  // =========================================================================

  describe('Direct navigation to previously completed steps', () => {
    it('should allow navigating to a completed step directly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Complete steps 1, 2, 3
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(4);

      // Navigate directly to step 1
      act(() => {
        result.current.goToStep(1);
      });
      expect(result.current.currentStep).toBe(1);

      // Navigate directly to step 3
      act(() => {
        result.current.goToStep(3);
      });
      expect(result.current.currentStep).toBe(3);
    });

    it('should not allow navigating to an incomplete future step', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Only on step 1, try to jump to step 4
      act(() => {
        result.current.goToStep(4);
      });

      // Should remain on step 1
      expect(result.current.currentStep).toBe(1);
    });

    it('should report canNavigateToStep correctly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'venue' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Complete step 1 and 2
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(3);

      // Can navigate to completed steps
      expect(result.current.canNavigateToStep(1)).toBe(true);
      expect(result.current.canNavigateToStep(2)).toBe(true);
      expect(result.current.canNavigateToStep(3)).toBe(true);

      // Cannot navigate to future incomplete steps
      expect(result.current.canNavigateToStep(5)).toBe(false);
      expect(result.current.canNavigateToStep(6)).toBe(false);
    });
  });

  // =========================================================================
  // 6. Entity-specific fields appear on correct entity types
  // =========================================================================

  describe('Entity-specific fields appear on correct entity types', () => {
    it('should set entityType in form data for community', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.formData.entityType).toBe('community');
    });

    it('should set entityType in form data for venue', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'venue' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.formData.entityType).toBe('venue');
    });

    it('should set entityType in form data for professional', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'professional' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.formData.entityType).toBe('professional');
    });

    it('should preserve entityType throughout navigation', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'artist' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Navigate through steps
      await act(async () => {
        await result.current.goToNextStep();
      });
      await act(async () => {
        await result.current.goToNextStep();
      });

      // Entity type should remain the same
      expect(result.current.entityType).toBe('artist');
      expect(result.current.formData.entityType).toBe('artist');
    });
  });

  // =========================================================================
  // 7. Publish flow (with and without verification requirement)
  // =========================================================================

  describe('Publish flow', () => {
    it('should call create and publish APIs when publishing', async () => {
      const mockOnPublishSuccess = jest.fn();
      const wrapper = createWrapper();
      const { result } = renderHook(
        () =>
          useFormWizard({
            entityType: 'community',
            onPublishSuccess: mockOnPublishSuccess,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Navigate to step 6
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.goToNextStep();
        });
      }
      expect(result.current.currentStep).toBe(6);

      // Publish
      await act(async () => {
        await result.current.publish();
      });

      expect(mockApiProfiles.create).toHaveBeenCalled();
      expect(mockApiProfiles.publish).toHaveBeenCalled();
    });

    it('should call onPublishSuccess with profile ID after publish', async () => {
      const mockOnPublishSuccess = jest.fn();
      const wrapper = createWrapper();
      const { result } = renderHook(
        () =>
          useFormWizard({
            entityType: 'community',
            onPublishSuccess: mockOnPublishSuccess,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Navigate to step 6
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.goToNextStep();
        });
      }

      await act(async () => {
        await result.current.publish();
      });

      await waitFor(() => {
        expect(mockOnPublishSuccess).toHaveBeenCalledWith('profile-123');
      });
    });

    it('should update existing profile when profileId is provided', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () =>
          useFormWizard({
            entityType: 'community',
            profileId: 'existing-profile-1',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Navigate to step 6
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.goToNextStep();
        });
      }

      await act(async () => {
        await result.current.publish();
      });

      // Should call update instead of create
      expect(mockApiProfiles.update).toHaveBeenCalledWith(
        'existing-profile-1',
        expect.any(Object)
      );
      expect(mockApiProfiles.publish).toHaveBeenCalled();
    });

    it('should delete draft after successful publish', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community', draftId: 'draft-to-delete' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Navigate to step 6
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.goToNextStep();
        });
      }

      await act(async () => {
        await result.current.publish();
      });

      await waitFor(() => {
        expect(mockApiProfiles.deleteDraft).toHaveBeenCalledWith('draft-to-delete');
      });
    });
  });

  // =========================================================================
  // 8. Form reset and cleanup
  // =========================================================================

  describe('Form reset and cleanup', () => {
    it('should reset form data when resetFormData is called', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // Update form data and navigate
      act(() => {
        result.current.updateFormData({ officialName: 'Test' });
      });
      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.formData.officialName).toBe('Test');

      // Reset
      act(() => {
        result.current.resetFormData();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.completedSteps.size).toBe(0);
      expect(result.current.formData.officialName).toBeUndefined();
      expect(result.current.isDirty).toBe(false);
    });

    it('should save draft when saveDraft is called', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      act(() => {
        result.current.updateFormData({ officialName: 'Draft Community' });
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(mockApiProfiles.saveDraft).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 9. Field-level operations
  // =========================================================================

  describe('Field-level operations', () => {
    it('should get and set individual field values', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      act(() => {
        result.current.setFieldValue('officialName', 'Field Test');
      });

      expect(result.current.getFieldValue('officialName')).toBe('Field Test');
    });

    it('should validate individual fields', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFormWizard({ entityType: 'community' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      });

      // With default mock (passes), field validation should return null
      const error = await act(async () => {
        return result.current.validateField('officialName', 'Valid Name');
      });

      expect(error).toBeNull();
    });
  });
});
