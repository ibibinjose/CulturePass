/**
 * Form Wizard State Management Hook
 * 
 * Manages the complete state for the 6-step profile creation wizard including:
 * - Step navigation with validation
 * - Form data management
 * - Auto-save integration
 * - Draft recovery
 * - Validation errors
 * - Lifecycle management
 * 
 * This is the main state management hook for the HostSpace Enterprise-Grade Form System.
 * 
 * Usage:
 * ```tsx
 * const wizard = useFormWizard({
 *   entityType: 'community',
 *   profileId: undefined, // or existing profile ID for editing
 *   draftId: undefined, // or draft ID to restore
 * });
 * 
 * // Navigate steps
 * wizard.goToNextStep();
 * wizard.goToPreviousStep();
 * wizard.goToStep(3);
 * 
 * // Update form data
 * wizard.updateFormData({ officialName: 'My Community' });
 * 
 * // Validate current step
 * const isValid = await wizard.validateCurrentStep();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ZodError } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/shared/schema';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';
import { getStepSchema } from '../schemas/profileSchema';
import {
  serializeFormData,
  deserializeFormData,
  calculateFormDiff,
  type PartialFormData,
} from '../services/formStateSerializer';
import { useAutoSave, type SaveStatus } from './useAutoSave';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType = 'community' | 'organiser' | 'venue' | 'business' | 'artist' | 'professional';

export interface FormWizardState {
  // Navigation
  currentStep: number;
  completedSteps: Set<number>;
  totalSteps: number;

  // Form Data
  formData: PartialFormData;
  entityType: EntityType;

  // Validation
  validationErrors: Record<string, string[]>;
  isValidating: boolean;

  // Save State
  isDirty: boolean;
  lastSaved: Date | null;
  saveStatus: SaveStatus;
  draftId: string | null;

  // Loading States
  isInitializing: boolean;
  isLoadingDraft: boolean;
  isLoadingProfile: boolean;
}

export interface UseFormWizardOptions {
  /**
   * Entity type for the profile
   */
  entityType: EntityType;
  /**
   * Existing profile ID (for editing)
   */
  profileId?: string;
  /**
   * Draft ID to restore
   */
  draftId?: string;
  /**
   * Callback when form is successfully published
   */
  onPublishSuccess?: (profileId: string) => void;
  /**
   * Callback when form initialization completes
   */
  onInitialized?: () => void;
}

export interface UseFormWizardReturn extends FormWizardState {
  // Navigation Methods
  canNavigateToStep: (step: number) => boolean;
  goToStep: (step: number) => void;
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;

  // Form Data Methods
  updateFormData: (data: Partial<PartialFormData>) => void;
  resetFormData: () => void;
  getFieldValue: <K extends keyof PartialFormData>(field: K) => PartialFormData[K];
  setFieldValue: <K extends keyof PartialFormData>(field: K, value: PartialFormData[K]) => void;

  // Validation Methods
  validateCurrentStep: () => Promise<boolean>;
  validateField: (field: string, value: unknown) => Promise<string | null>;
  clearValidationErrors: () => void;
  getFieldError: (field: string) => string | undefined;

  // Save Methods
  triggerSave: () => Promise<void>;
  saveDraft: () => Promise<void>;
  deleteDraft: () => Promise<void>;

  // Publish Method
  publish: () => Promise<void>;
  isPublishing: boolean;
  isSavingDraft: boolean;

  // Lifecycle Methods
  initialize: () => Promise<void>;
  cleanup: () => void;
}

const DRAFT_STORAGE_PREFIX = '@culturepass_profile_draft';
const TOTAL_STEPS = 6;

/**
 * Get local storage key for draft
 */
function getDraftStorageKey(userId: string | null, entityType: EntityType): string {
  return `${DRAFT_STORAGE_PREFIX}:${userId ?? 'guest'}:${entityType}`;
}

/**
 * Form Wizard Hook
 */
export function useFormWizard({
  entityType,
  profileId,
  draftId,
  onPublishSuccess,
  onInitialized,
}: UseFormWizardOptions): UseFormWizardReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<PartialFormData>({ entityType });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [backendDraftId, setBackendDraftId] = useState<string | null>(draftId ?? null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Refs to track initialization
  const hasInitialized = useRef(false);
  const initialFormDataRef = useRef<string>('');

  // ---------------------------------------------------------------------------
  // Load Existing Profile (for editing)
  // ---------------------------------------------------------------------------

  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => api.profiles.get(profileId!),
    enabled: !!profileId,
  });

  // ---------------------------------------------------------------------------
  // Load Draft
  // ---------------------------------------------------------------------------

  const { data: existingDraft, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['profile-draft', draftId],
    queryFn: () => api.profiles.getDraft(draftId!),
    enabled: !!draftId,
  });

  // ---------------------------------------------------------------------------
  // Save Draft Mutation
  // ---------------------------------------------------------------------------

  const saveDraftMutation = useMutation({
    mutationFn: async (data: {
      formData: PartialFormData;
      currentStep: number;
      completedSteps: number[];
    }) => {
      // If we have a backend draft ID, update it; otherwise create new
      if (backendDraftId) {
        return api.profiles.saveDraft(backendDraftId, {
          formData: data.formData as Partial<Profile>,
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          entityType,
        });
      } else {
        // Create new draft (use a temporary ID)
        const tempId = `temp-${Date.now()}`;
        const result = await api.profiles.saveDraft(tempId, {
          formData: data.formData as Partial<Profile>,
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          entityType,
        });
        setBackendDraftId(result.draftId);
        return result;
      }
    },
    onSuccess: (data) => {
      setLastSaved(new Date(data.savedAt));
      setIsDirty(false);
      // Invalidate drafts query
      queryClient.invalidateQueries({ queryKey: ['profile-drafts'] });
    },
    onError: (error) => {
      console.error('[useFormWizard] Failed to save draft:', error);
    },
  });

  // ---------------------------------------------------------------------------
  // Publish Mutation
  // ---------------------------------------------------------------------------

  const publishMutation = useMutation({
    mutationFn: async () => {
      // First, create or update the profile
      let profileIdToPublish: string;

      if (profileId) {
        // Update existing profile
        await api.profiles.update(profileId, formData as Partial<Profile>);
        profileIdToPublish = profileId;
      } else {
        // Create new profile
        const newProfile = await api.profiles.create(formData as Partial<Profile>);
        profileIdToPublish = newProfile.id!;
      }

      // Then publish it
      const result = await api.profiles.publish(profileIdToPublish);
      return { ...result, profileId: profileIdToPublish };
    },
    onSuccess: (data) => {
      // Clear draft after successful publish
      if (backendDraftId) {
        api.profiles.deleteDraft(backendDraftId).catch(() => {
          // Ignore errors
        });
      }
      // Clear local storage
      AsyncStorage.removeItem(getDraftStorageKey(user?.id ?? null, entityType)).catch(() => {
        // Ignore errors
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-drafts'] });
      // Call success callback
      onPublishSuccess?.(data.profileId);
    },
    onError: (error) => {
      console.error('[useFormWizard] Failed to publish profile:', error);
    },
  });

  // ---------------------------------------------------------------------------
  // Auto-Save Integration
  // ---------------------------------------------------------------------------

  const { saveStatus, triggerSave } = useAutoSave({
    formData,
    isDirty,
    onSave: async (data) => {
      await saveDraftMutation.mutateAsync({
        formData: data,
        currentStep,
        completedSteps: Array.from(completedSteps),
      });
    },
    enabled: !profileId, // Only auto-save for new profiles, not edits
  });

  // ---------------------------------------------------------------------------
  // Initialize Form
  // ---------------------------------------------------------------------------

  const initialize = useCallback(async () => {
    if (hasInitialized.current) return;

    setIsInitializing(true);

    try {
      let initialData: PartialFormData = { entityType };

      // Priority 1: Load existing profile (editing mode)
      if (existingProfile) {
        initialData = existingProfile as PartialFormData;
        setCurrentStep(1);
        setCompletedSteps(new Set([1, 2, 3, 4, 5])); // All steps completed for existing profile
      }
      // Priority 2: Load draft from backend
      else if (existingDraft) {
        initialData = existingDraft.formData as PartialFormData;
        setCurrentStep(existingDraft.currentStep);
        setCompletedSteps(new Set(existingDraft.completedSteps));
        setBackendDraftId(existingDraft.id);
      }
      // Priority 3: Load draft from local storage
      else {
        const localDraftKey = getDraftStorageKey(user?.id ?? null, entityType);
        const localDraft = await AsyncStorage.getItem(localDraftKey);
        if (localDraft) {
          try {
            initialData = deserializeFormData(localDraft);
          } catch (error) {
            console.error('[useFormWizard] Failed to parse local draft:', error);
          }
        }
      }

      setFormData(initialData);
      initialFormDataRef.current = serializeFormData(initialData);
      setIsDirty(false);
      hasInitialized.current = true;
      onInitialized?.();
    } finally {
      setIsInitializing(false);
    }
  }, [entityType, existingProfile, existingDraft, user?.id, onInitialized]);

  // Auto-initialize when dependencies are ready
  useEffect(() => {
    if (!isLoadingProfile && !isLoadingDraft) {
      void initialize();
    }
  }, [isLoadingProfile, isLoadingDraft, initialize]);

  // ---------------------------------------------------------------------------
  // Save to Local Storage (backup)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!hasInitialized.current || profileId) return; // Don't save locally when editing

    const timer = setTimeout(() => {
      const serialized = serializeFormData(formData);
      if (serialized !== initialFormDataRef.current) {
        const key = getDraftStorageKey(user?.id ?? null, entityType);
        AsyncStorage.setItem(key, serialized).catch(() => {
          // Ignore errors
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, entityType, user?.id, profileId]);

  // ---------------------------------------------------------------------------
  // Navigation Methods
  // ---------------------------------------------------------------------------

  const canNavigateToStep = useCallback(
    (step: number): boolean => {
      if (step < 1 || step > TOTAL_STEPS) return false;
      if (step <= currentStep) return true;
      return completedSteps.has(step - 1);
    },
    [currentStep, completedSteps]
  );

  const goToStep = useCallback(
    (step: number) => {
      if (canNavigateToStep(step)) {
        setCurrentStep(step);
        setValidationErrors({});
      }
    },
    [canNavigateToStep]
  );

  // ---------------------------------------------------------------------------
  // Validation Methods
  // ---------------------------------------------------------------------------

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationErrors({});

    try {
      const schema = getStepSchema(currentStep, entityType);
      await schema.parseAsync(formData);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors;
        setValidationErrors(errors as Record<string, string[]>);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, entityType, formData]);

  const goToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      setValidationErrors({});
    }
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setValidationErrors({});
    }
  }, [currentStep]);

  // ---------------------------------------------------------------------------
  // Form Data Methods
  // ---------------------------------------------------------------------------

  const updateFormData = useCallback((data: Partial<PartialFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data };
      setIsDirty(true);
      return updated;
    });
  }, []);

  const resetFormData = useCallback(() => {
    setFormData({ entityType });
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setValidationErrors({});
    setIsDirty(false);
    setLastSaved(null);
    setBackendDraftId(null);
  }, [entityType]);

  const getFieldValue = useCallback(
    <K extends keyof PartialFormData>(field: K): PartialFormData[K] => {
      return formData[field];
    },
    [formData]
  );

  const setFieldValue = useCallback(
    <K extends keyof PartialFormData>(field: K, value: PartialFormData[K]) => {
      updateFormData({ [field]: value } as Partial<PartialFormData>);
    },
    [updateFormData]
  );

  const validateField = useCallback(
    async (field: string, value: unknown): Promise<string | null> => {
      try {
        const schema = getStepSchema(currentStep, entityType);
        // Validate just this field by parsing the full object with only this field
        await schema.parseAsync({ [field]: value });
        return null;
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
          const fieldError = fieldErrors[field];
          return fieldError?.[0] ?? 'Invalid value';
        }
        return 'Validation error';
      }
    },
    [currentStep, entityType]
  );

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return validationErrors[field]?.[0];
    },
    [validationErrors]
  );

  // ---------------------------------------------------------------------------
  // Save Methods
  // ---------------------------------------------------------------------------

  const saveDraft = useCallback(async () => {
    await saveDraftMutation.mutateAsync({
      formData,
      currentStep,
      completedSteps: Array.from(completedSteps),
    });
  }, [formData, currentStep, completedSteps, saveDraftMutation]);

  const deleteDraft = useCallback(async () => {
    if (backendDraftId) {
      await api.profiles.deleteDraft(backendDraftId);
      setBackendDraftId(null);
    }
    // Clear local storage
    const key = getDraftStorageKey(user?.id ?? null, entityType);
    await AsyncStorage.removeItem(key);
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['profile-drafts'] });
  }, [backendDraftId, entityType, user?.id, queryClient]);

  // ---------------------------------------------------------------------------
  // Publish Method
  // ---------------------------------------------------------------------------

  const publish = useCallback(async () => {
    // Validate all steps before publishing
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      setCurrentStep(step);
      const isValid = await validateCurrentStep();
      if (!isValid) {
        throw new Error(`Validation failed at step ${step}`);
      }
    }

    await publishMutation.mutateAsync();
  }, [validateCurrentStep, publishMutation]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  const cleanup = useCallback(() => {
    resetFormData();
    hasInitialized.current = false;
  }, [resetFormData]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    currentStep,
    completedSteps,
    totalSteps: TOTAL_STEPS,
    formData,
    entityType,
    validationErrors,
    isValidating,
    isDirty,
    lastSaved,
    saveStatus,
    draftId: backendDraftId,
    isInitializing,
    isLoadingDraft,
    isLoadingProfile,

    // Navigation
    canNavigateToStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,

    // Form Data
    updateFormData,
    resetFormData,
    getFieldValue,
    setFieldValue,

    // Validation
    validateCurrentStep,
    validateField,
    clearValidationErrors,
    getFieldError,

    // Save
    triggerSave,
    saveDraft,
    deleteDraft,

    // Publish
    publish,
    isPublishing: publishMutation.isPending,
    isSavingDraft: saveDraftMutation.isPending,

    // Lifecycle
    initialize,
    cleanup,
  };
}
