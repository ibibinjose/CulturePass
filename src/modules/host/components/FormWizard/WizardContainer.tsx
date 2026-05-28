/**
 * WizardContainer Component
 * 
 * Orchestrates the 6-step profile creation wizard flow.
 * Manages step navigation, progress tracking, and integrates with form state management.
 * 
 * Features:
 * - 6-step wizard flow with validation
 * - Progress indicator
 * - Auto-save integration
 * - Draft recovery
 * - Mobile-responsive design with swipe gestures
 * - AppState listener for background auto-save
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <WizardContainer
 *   entityType="community"
 *   draftId={draftId}
 *   onPublishSuccess={(profileId) => router.push(`/profile/${profileId}`)}
 * />
 * ```
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useFormWizard, type EntityType } from '../../hooks/useFormWizard';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { responsiveMaxWidth } from '../../utils/responsive';
import {
  announceStepChange,
  focusFirstInput,
  createKeyboardHandler,
  progressAccessibilityProps,
} from '../../utils/accessibility';

import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { WizardStep } from './WizardStep';
import { AutoSaveIndicator } from '../AutoSaveIndicator';
import { DraftRecoveryModal } from '../DraftRecoveryModal';
import { useDraftRecovery } from '../../hooks/useDraftRecovery';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardContainerProps {
  /**
   * Entity type for the profile
   */
  entityType: EntityType;
  /**
   * Draft ID to restore (optional)
   */
  draftId?: string;
  /**
   * Existing profile ID for editing (optional)
   */
  profileId?: string;
  /**
   * Callback when form is successfully published
   */
  onPublishSuccess?: (profileId: string) => void;
  /**
   * Callback when user cancels/exits the wizard
   */
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Step Labels
// ---------------------------------------------------------------------------

const STEP_LABELS = [
  'Basic Identity',
  'Media & Branding',
  'Legal & Compliance',
  'Location & Operations',
  'Rich Description',
  'Review & Publish',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardContainer({
  entityType,
  draftId,
  profileId,
  onPublishSuccess,
  onCancel,
}: WizardContainerProps) {
  const colors = useColors();
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Top inset: 0 on web, insets.top on native
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  // ---------------------------------------------------------------------------
  // Draft Recovery
  // ---------------------------------------------------------------------------

  const draftRecovery = useDraftRecovery({
    entityType,
    onSelectDraft: (draft) => {
      // Load draft into form wizard
      if (__DEV__) console.log('[WizardContainer] Loading draft:', draft.id);
      // The wizard hook will handle loading the draft via draftId prop
      // We need to trigger a re-initialization with the draft
      router.replace({
        pathname: `/hostspace/create/${entityType}`,
        params: { draftId: draft.id },
      });
    },
    onStartFresh: () => {
      if (__DEV__) console.log('[WizardContainer] Starting fresh');
      // Continue with empty form
    },
    autoShow: !draftId && !profileId, // Only auto-show if not already loading a draft/profile
    enabled: !draftId && !profileId, // Only fetch drafts if not already loading
  });

  // ---------------------------------------------------------------------------
  // Form Wizard State
  // ---------------------------------------------------------------------------

  const wizard = useFormWizard({
    entityType,
    profileId,
    draftId,
    onPublishSuccess: (id) => {
      onPublishSuccess?.(id);
    },
    onInitialized: () => {
      if (__DEV__) console.log('[WizardContainer] Form initialized');
    },
  });

  // ---------------------------------------------------------------------------
  // Accessibility: Step Content Ref for Focus Management
  // ---------------------------------------------------------------------------

  const stepContentRef = useRef<View>(null);
  const previousStepRef = useRef(wizard.currentStep);

  // Announce step changes and move focus to first input
  useEffect(() => {
    if (previousStepRef.current !== wizard.currentStep) {
      // Announce the new step to screen readers
      announceStepChange(
        wizard.currentStep,
        STEP_LABELS[wizard.currentStep - 1],
        wizard.totalSteps
      );

      // Move focus to the step content area
      focusFirstInput(stepContentRef);

      previousStepRef.current = wizard.currentStep;
    }
  }, [wizard.currentStep, wizard.totalSteps]);

  // ---------------------------------------------------------------------------
  // Accessibility: Escape Key Handler (Web)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Navigation Handlers
  // ---------------------------------------------------------------------------

  const handleStepClick = useCallback(
    (step: number) => {
      if (wizard.canNavigateToStep(step)) {
        wizard.goToStep(step);
      }
    },
    [wizard]
  );

  const handleNext = useCallback(async () => {
    try {
      await wizard.goToNextStep();
    } catch (error) {
      console.error('[WizardContainer] Failed to advance step:', error);
      if (Platform.OS === 'web') {
        if (Platform.OS === 'web') {
          window.alert('Please fix the errors before continuing.');
        } else {
          Alert.alert('Validation Error', 'Please fix the errors before continuing.');
        }
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      }
    }
  }, [wizard]);

  const handleBack = useCallback(() => {
    wizard.goToPreviousStep();
  }, [wizard]);

  const handlePublish = useCallback(async () => {
    try {
      await wizard.publish();
    } catch (error) {
      console.error('[WizardContainer] Failed to publish profile:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to publish profile. Please try again.';
      if (Platform.OS === 'web') {
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Publish Error', message);
        }
      } else {
        Alert.alert('Publish failed', message);
      }
    }
  }, [wizard]);

  const handleSaveDraft = useCallback(async () => {
    try {
      await wizard.saveDraft();
      if (Platform.OS === 'web') {
        if (Platform.OS === 'web') {
          window.alert('Draft saved successfully.');
        } else {
          Alert.alert('Success', 'Draft saved successfully!');
        }
      } else {
        Alert.alert('Success', 'Draft saved successfully!');
      }
    } catch (error) {
      console.error('[WizardContainer] Failed to save draft:', error);
      if (Platform.OS === 'web') {
        if (Platform.OS === 'web') {
          window.alert('Failed to save draft. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to save draft. Please try again.');
      }
    }
  }, [wizard]);

  const handleGoToStep = useCallback(
    (step: number) => {
      if (wizard.canNavigateToStep(step)) {
        wizard.goToStep(step);
      }
    },
    [wizard],
  );

  const handleCancel = useCallback(() => {
    if (wizard.isDirty) {
      const confirmCancel = () => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(
            'You have unsaved changes. Are you sure you want to exit?'
          );
          if (confirmed) {
            onCancel?.();
            router.back();
          }
        } else {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Are you sure you want to exit?',
            [
              { text: 'Stay', style: 'cancel' },
              {
                text: 'Exit',
                style: 'destructive',
                onPress: () => {
                  onCancel?.();
                  router.back();
                },
              },
            ]
          );
        }
      };
      confirmCancel();
    } else {
      onCancel?.();
      router.back();
    }
  }, [wizard.isDirty, onCancel, router]);

  // ---------------------------------------------------------------------------
  // AppState Listener — auto-save when app is backgrounded (Requirement 22.10)
  // ---------------------------------------------------------------------------

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // When app moves to background or inactive, trigger save
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        if (wizard.isDirty) {
          if (__DEV__) console.log('[WizardContainer] App backgrounded — triggering auto-save');
          wizard.triggerSave?.();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [wizard.isDirty, wizard.triggerSave]);

  // ---------------------------------------------------------------------------
  // Swipe Gesture for Step Navigation (Requirement 22.9)
  // ---------------------------------------------------------------------------

  const isFirstStepRef = useRef(wizard.currentStep === 1);
  const isLastStepRef = useRef(wizard.currentStep === wizard.totalSteps);
  isFirstStepRef.current = wizard.currentStep === 1;
  isLastStepRef.current = wizard.currentStep === wizard.totalSteps;

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30]) // Require 30px horizontal movement to activate
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px (allow scrolling)
    .onEnd((event) => {
      if (layout.isDesktop) return; // Only on mobile/tablet

      const { translationX, velocityX } = event;
      const SWIPE_THRESHOLD = 80;
      const VELOCITY_THRESHOLD = 500;

      // Swipe left → next step
      if (
        (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) &&
        !isLastStepRef.current
      ) {
        handleNext();
      }
      // Swipe right → previous step
      else if (
        (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) &&
        !isFirstStepRef.current
      ) {
        handleBack();
      }
    });

  // ---------------------------------------------------------------------------
  // Browser Back Button Handler (Web)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (wizard.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [wizard.isDirty]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  // Memoize responsive max width style to avoid recalculation on every render
  const contentMaxWidthStyle = useMemo(
    () => responsiveMaxWidth(layout.isDesktop),
    [layout.isDesktop]
  );

  if (wizard.isInitializing || wizard.isLoadingDraft || wizard.isLoadingProfile || draftRecovery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          {/* loading placeholder */}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isFirstStep = wizard.currentStep === 1;
  const isLastStep = wizard.currentStep === wizard.totalSteps;

  const stepContent = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        visible={draftRecovery.showRecoveryModal}
        drafts={draftRecovery.drafts}
        onSelectDraft={draftRecovery.handleSelectDraft}
        onStartFresh={draftRecovery.handleStartFresh}
        onDismiss={draftRecovery.handleDismiss}
      />      {/* Progress Indicator */}
      <View
        style={[
          styles.progressContainer,
          {
            paddingTop: topInset + Luxe.spacing.md,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
        {...progressAccessibilityProps({
          currentStep: wizard.currentStep,
          totalSteps: wizard.totalSteps,
          stepLabel: STEP_LABELS[wizard.currentStep - 1],
        })}
      >
        <WizardProgress
          currentStep={wizard.currentStep}
          totalSteps={wizard.totalSteps}
          completedSteps={wizard.completedSteps}
          stepLabels={STEP_LABELS}
          onStepClick={handleStepClick}
        />
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.hPad,
            paddingBottom: insets.bottom + 100, // Extra space for navigation
          },
          contentMaxWidthStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel={`Step ${wizard.currentStep}: ${STEP_LABELS[wizard.currentStep - 1]}`}
      >
        <View ref={stepContentRef}>
          <WizardStep
            step={wizard.currentStep}
            entityType={wizard.entityType}
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            validationErrors={wizard.validationErrors}
            getFieldError={wizard.getFieldError}
            isValidating={wizard.isValidating}
            onGoToStep={handleGoToStep}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isPublishing={wizard.isPublishing}
            isSavingDraft={wizard.isSavingDraft}
          />
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        style={[
          styles.navigationContainer,
          {
            paddingBottom: insets.bottom + Luxe.spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <WizardNavigation
          currentStep={wizard.currentStep}
          totalSteps={wizard.totalSteps}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isValidating={wizard.isValidating}
          isPublishing={wizard.isPublishing}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={handleCancel}
          onPublish={handlePublish}
        />
      </View>

      {/* Auto-Save Indicator */}
      <AutoSaveIndicator
        status={wizard.saveStatus}
        lastSaved={wizard.lastSaved}
      />
    </View>
  );

  // Wrap in GestureDetector for swipe navigation on mobile
  if (!layout.isDesktop) {
    return (
      <GestureDetector gesture={swipeGesture}>
        {stepContent}
      </GestureDetector>
    );
  }

  return stepContent;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: Luxe.spacing.md,
    paddingBottom: Luxe.spacing.md,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Luxe.spacing.lg,
  },
  navigationContainer: {
    paddingHorizontal: Luxe.spacing.md,
    paddingTop: Luxe.spacing.md,
    borderTopWidth: 1,
  },
});
