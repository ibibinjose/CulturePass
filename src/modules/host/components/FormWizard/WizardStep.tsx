/**
 * WizardStep Component
 * 
 * Wrapper component that renders the appropriate step content based on the current step number.
 * Acts as a router for the 6 wizard steps.
 * 
 * Features:
 * - Dynamic step content rendering
 * - Props forwarding to step components
 * - Consistent layout and spacing
 * 
 * Usage:
 * ```tsx
 * <WizardStep
 *   step={3}
 *   entityType="community"
 *   formData={formData}
 *   updateFormData={updateFormData}
 *   validationErrors={errors}
 * />
 * ```
 */

import React, { Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui';
import { responsiveMaxWidth, responsiveSectionGap } from '../../utils/responsive';
import { createLazyStep, StepLoadingFallback } from '../../utils/performance';
import type { EntityType } from '../../hooks/useFormWizard';
import type { PartialFormData } from '../../services/formStateSerializer';

// Lazy-loaded step components — only the current step's code is loaded
const LazyStep1Identity = createLazyStep(
  () => import('../steps/Step1Identity'),
  'Step1Identity'
);
const LazyStep2Media = createLazyStep(
  () => import('../steps/Step2Media'),
  'Step2Media'
);
const LazyStep3Legal = createLazyStep(
  () => import('../steps/Step3Legal'),
  'Step3Legal'
);
const LazyStep4Location = createLazyStep(
  () => import('../steps/Step4Location'),
  'Step4Location'
);
const LazyStep5Description = createLazyStep(
  () => import('../steps/Step5Description'),
  'Step5Description'
);
const LazyTeamOrganizersStep = createLazyStep(
  () => import('../steps/TeamOrganizersStep'),
  'TeamOrganizersStep'
);
const LazyStep6Review = createLazyStep(
  () => import('../steps/Step6Review'),
  'Step6Review'
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardStepProps {
  /**
   * Current step number (1-6)
   */
  step: number;
  /**
   * Entity type
   */
  entityType: EntityType;
  /**
   * Form data
   */
  formData: PartialFormData;
  /**
   * Update form data callback
   */
  updateFormData: (data: Partial<PartialFormData>) => void;
  /**
   * Validation errors
   */
  validationErrors: Record<string, string[]>;
  /**
   * Get field error helper
   */
  getFieldError: (field: string) => string | undefined;
  /**
   * Whether validation is in progress
   */
  isValidating: boolean;
  /** Navigate to a wizard step (review step edit actions) */
  onGoToStep?: (step: number) => void;
  /** Persist draft via API */
  onSaveDraft?: () => Promise<void>;
  /** Publish profile via API */
  onPublish?: () => Promise<void>;
  isPublishing?: boolean;
  isSavingDraft?: boolean;

  // Optional analytics trackers (provided by container when in wizard context for upload/API events)
  trackUpload?: (status: 'success' | 'failure', fileType: string, fileSizeBytes?: number, durationMs?: number, errorMessage?: string) => void;
  trackApiCall?: (entry: { endpoint: string; method: string; durationMs: number; statusCode: number; success: boolean }) => void;
}

// ---------------------------------------------------------------------------
// Placeholder Step Components
// ---------------------------------------------------------------------------

function PlaceholderStep({ title }: { title: string }) {
  const colors = useColors();

  return (
    <View style={styles.placeholderContainer}>
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
        This step will be implemented in the next phase.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStep({
  step,
  entityType,
  formData,
  updateFormData,
  validationErrors,
  getFieldError,
  isValidating,
  onGoToStep,
  onSaveDraft,
  onPublish,
  isPublishing,
  isSavingDraft,
  trackUpload,
  trackApiCall,
}: WizardStepProps) {
  const layout = useLayout();

  // Common props to pass to all step components
  const stepProps = {
    step,
    entityType,
    formData,
    updateFormData,
    validationErrors,
    getFieldError,
    isValidating,
    onGoToStep,
    onSaveDraft,
    onPublish,
    isPublishing,
    isSavingDraft,
    trackUpload,
    trackApiCall,
  };


  // ---------------------------------------------------------------------------
  // Render Step Content — wrapped in responsive container
  // ---------------------------------------------------------------------------

  const renderStep = () => {
    const isTeamEntity = entityType === 'community' || entityType === 'business';

    if (isTeamEntity) {
      switch (step) {
        case 1: return <LazyStep1Identity {...stepProps} />;
        case 2: return <LazyStep2Media {...stepProps} />;
        case 3: return <LazyStep3Legal {...stepProps} />;
        case 4: return <LazyStep4Location {...stepProps} />;
        case 5: return <LazyTeamOrganizersStep {...stepProps} />;
        case 6: return <LazyStep5Description {...stepProps} />;
        case 7: return <LazyStep6Review {...stepProps} />;
        default: return <View style={styles.errorContainer}><Text style={styles.errorText}>Invalid step: {step}</Text></View>;
      }
    }

    switch (step) {
      case 1: return <LazyStep1Identity {...stepProps} />;
      case 2: return <LazyStep2Media {...stepProps} />;
      case 3: return <LazyStep3Legal {...stepProps} />;
      case 4: return <LazyStep4Location {...stepProps} />;
      case 5: return <LazyStep5Description {...stepProps} />;
      case 6: return <LazyStep6Review {...stepProps} />;
      default: return <View style={styles.errorContainer}><Text style={styles.errorText}>Invalid step: {step}</Text></View>;
    }
  };

  return (
    <View style={[styles.stepContainer, { gap: responsiveSectionGap(layout.isMobile) }]}>
      <Suspense fallback={<StepLoadingFallback />}>
        <View style={{ flex: 1 }}>{renderStep()}</View>
      </Suspense>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  placeholderContainer: {
    padding: Luxe.spacing.xl,
    gap: Luxe.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    padding: Luxe.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5E5B',
  },
});
