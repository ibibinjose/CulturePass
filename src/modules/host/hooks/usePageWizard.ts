/**
 * Page Pro Wizard state hook — unified Create a Page flow
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { HostPageFormData, HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { validateHostPagePublishFormData } from '@/shared/schema/hostPage';
import { getPageTemplate } from '../config/pageTemplates.config';
import { getPageWizardSteps } from '../config/pageWizardSteps';
import type { PageWizardStepId } from '../config/pageWizardSteps';
import {
  getPageWizardStepSchemaByIndex,
  getPageWizardTotalSteps,
} from '../schemas/pageWizardSchema';
import { useAutoSave, type SaveStatus } from './useAutoSave';

export interface UsePageWizardOptions {
  entityType: HostEntityType;
  templateId?: HostPageTemplateId;
  pageId?: string;
  draftId?: string;
  onPublishSuccess?: (pageId: string, verificationRequired: boolean) => void;
}

function buildInitialFormData(
  entityType: HostEntityType,
  templateId?: HostPageTemplateId,
): HostPageFormData {
  const template = templateId ? getPageTemplate(templateId) : undefined;
  const preset = template?.preset;

  return {
    name: '',
    bio: '',
    registeredBusinessName: '',
    tradingName: '',
    categoryTags: preset?.categoryTags?.slice(0, 3) ?? [],
    culturalTags: preset?.culturalTags ?? [],
    languageTags: preset?.languageTags ?? ['English'],
    abn: '',
    gstRegistered: false,
    gstId: '',
    publicEmail: '',
    phoneNumber: '',
    whatsappNumber: '',
    primaryContactMethod: 'email',
    isOnlineOnly: false,
    socialLinks: [],
    executiveMembers: [],
    nationalityId: '',
    cultureIds: [],
    indigenousTags: [],
    isIndigenousOwned: false,
    membershipModel: preset?.membershipModel ?? 'free',
    ctaLabel: preset?.ctaLabel,
    ctaAction: preset?.ctaAction,
    templateId,
  };
}

function zodErrorsToRecord(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = [];
    out[key].push(issue.message);
  }
  return out;
}

export function usePageWizard({
  entityType,
  templateId,
  pageId: initialPageId,
  draftId: initialDraftId,
  onPublishSuccess,
}: UsePageWizardOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const wizardSteps = useMemo(() => getPageWizardSteps(entityType), [entityType]);
  const totalSteps = useMemo(() => getPageWizardTotalSteps(entityType), [entityType]);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<HostPageFormData>(() =>
    buildInitialFormData(entityType, templateId),
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [pageId, setPageId] = useState<string | null>(initialPageId ?? null);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId ?? null);
  const [isInitializing, setIsInitializing] = useState(!!initialDraftId);
  const initializedRef = useRef(false);

  const currentStepId: PageWizardStepId = wizardSteps[currentStep - 1] ?? 'basics';

  const publishMutation = useMutation({
    mutationFn: async () => {
      let activePageId = pageId;
      if (!activePageId) {
        const created = await api.hostPages.create({
          entityType,
          formData,
          templateId,
        });
        activePageId = created.id;
        setPageId(created.id);
      } else {
        await api.hostPages.update(activePageId, { formData, templateId });
      }
      return api.hostPages.publish(activePageId!);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['host-pages-my'] });
      onPublishSuccess?.(result.pageId, result.verificationRequired);
    },
  });

  const saveDraftToServer = useCallback(async () => {
    const result = await api.hostPages.saveDraft({
      pageId: pageId ?? undefined,
      entityType,
      formData,
      currentStep,
      completedSteps: Array.from(completedSteps),
      templateId,
      draftId: draftId ?? undefined,
      ...(Platform.OS !== 'web' && {
        deviceInfo: { platform: Platform.OS, userAgent: `${Platform.OS}-app` },
      }),
    });
    setDraftId(result.draftId);
    setIsDirty(false);
    if (result.draft.pageId && !pageId) {
      setPageId(result.draft.pageId);
    }
    if (__DEV__) {
      console.info('[PageWizard] Draft saved', result.draftId);
    }
  }, [pageId, entityType, formData, currentStep, completedSteps, templateId, draftId]);

  const { saveStatus, lastSaved, triggerSave, isSaving } = useAutoSave({
    formData,
    isDirty,
    onSave: saveDraftToServer,
    enabled: !!user,
  });

  useEffect(() => {
    if (!initialDraftId || initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const draft = await api.hostPages.getDraft(initialDraftId);
        setFormData({
          ...buildInitialFormData(entityType, templateId),
          ...draft.formData,
        });
        const clampedStep = Math.min(Math.max(draft.currentStep, 1), totalSteps);
        setCurrentStep(clampedStep);
        setCompletedSteps(new Set(draft.completedSteps.filter((s) => s <= totalSteps)));
        setDraftId(draft.id);
        if (draft.pageId) setPageId(draft.pageId);
      } catch (err) {
        if (__DEV__) console.error('[PageWizard] Draft restore failed', err);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [initialDraftId, entityType, templateId, totalSteps]);

  const updateFormData = useCallback((patch: Partial<HostPageFormData>) => {
    setFormData((prev: HostPageFormData) => ({ ...prev, ...patch }));
    setIsDirty(true);
    setValidationErrors({});
  }, []);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = getPageWizardStepSchemaByIndex(currentStep, entityType);
    try {
      schema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationErrors(zodErrorsToRecord(err));
      }
      return false;
    }
  }, [currentStep, entityType, formData]);

  const goToNextStep = useCallback(async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    setCurrentStep((s) => Math.min(s + 1, totalSteps));
  }, [validateCurrentStep, currentStep, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps],
  );

  const getFieldError = useCallback(
    (field: string) => validationErrors[field]?.[0],
    [validationErrors],
  );

  const publish = useCallback(async () => {
    const stepValid = await validateCurrentStep();
    if (!stepValid) return;

    const publishResult = validateHostPagePublishFormData(formData, entityType);
    if (!publishResult.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of publishResult.issues) {
        if (!errors[issue.path]) errors[issue.path] = [];
        errors[issue.path].push(issue.message);
      }
      setValidationErrors(errors);
      return;
    }

    await publishMutation.mutateAsync();
  }, [validateCurrentStep, formData, entityType, publishMutation]);

  return {
    entityType,
    templateId,
    wizardSteps,
    currentStep,
    currentStepId,
    completedSteps,
    totalSteps,
    formData,
    validationErrors,
    pageId,
    draftId,
    isDirty,
    isInitializing,
    saveStatus: saveStatus as SaveStatus,
    lastSaved,
    isSaving,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
    updateFormData,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    getFieldError,
    triggerSave,
    publish,
  };
}

export type UsePageWizardReturn = ReturnType<typeof usePageWizard>;