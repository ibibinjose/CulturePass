/**
 * WizardContainer Component
 * 
 * Orchestrates the profile creation wizard flow (6 or 7 steps depending on entity type).
 * Manages step navigation, progress tracking, and integrates with form state management.
 * 
 * Features:
 * - 6 or 7-step wizard flow (extra Team step for community/business) with validation
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
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  AppState,
  ActivityIndicator,
  type AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useFormWizard, type EntityType } from '../../hooks/useFormWizard';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { responsiveMaxWidth } from '../../utils/responsive';
import {
  announceStepChange,
  focusFirstInput,
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

function getStepLabels(entityType: EntityType): string[] {
  const displayNames: Record<EntityType, string> = {
    community: 'Community',
    organiser: 'Organiser',
    organizer: 'Organiser',
    venue: 'Venue',
    business: 'Business',
    artist: 'Artist',
    professional: 'Professional',
  };

  const typeName = displayNames[entityType] || entityType;
  const base = [
    `${typeName} Profile`,
    'Media & Branding',
    'Legal & Compliance',
    'Location & Operations',
  ];

  if (entityType === 'community' || entityType === 'business') {
    return [
      ...base,
      'Team & Organizers',
      'Rich Description',
      'Review & Publish',
    ];
  }

  return [...base, 'Rich Description', 'Review & Publish'];
}

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
  const router = useRouter();
  const { isOrganizer } = useRole();

  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;

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
        pathname: '/hostspace/create' as any,
        params: { profileType: entityType, draftId: draft.id } as any,
      });
    },
    onStartFresh: () => {
      if (__DEV__) console.log('[WizardContainer] Starting fresh');
      // Continue with empty form
    },
    autoShow: !draftId && !profileId, // Only auto-show if not already loading a draft/profile
    enabled: !draftId && !profileId, // Only fetch drafts if not already loading
  });

  const handleOnInitialized = useCallback(() => {
    if (__DEV__) console.log('[WizardContainer] Form initialized');
  }, []);

  const handleOnPublishSuccess = useCallback((id: string) => {
    onPublishSuccess?.(id);
  }, [onPublishSuccess]);

  // ---------------------------------------------------------------------------
  // Form Wizard State
  // ---------------------------------------------------------------------------

  const wizard = useFormWizard({
    entityType,
    profileId,
    draftId,
    onPublishSuccess: handleOnPublishSuccess,
    onInitialized: handleOnInitialized,
  });

  // ---------------------------------------------------------------------------
  // Accessibility: Step Content Ref for Focus Management
  // ---------------------------------------------------------------------------

  const stepContentRef = useRef<View>(null);
  const previousStepRef = useRef(wizard.currentStep);
  const handleCancelRef = useRef<() => void>(() => {}); // Updated in effect below to always have latest handleCancel

  // Announce step changes and move focus to first input
  useEffect(() => {
    if (previousStepRef.current !== wizard.currentStep) {
      // Announce the new step to screen readers
      announceStepChange(
        wizard.currentStep,
        getStepLabels(wizard.entityType)[wizard.currentStep - 1],
        wizard.totalSteps
      );

      // Move focus to the step content area
      focusFirstInput(stepContentRef);

      previousStepRef.current = wizard.currentStep;
    }
  }, [wizard.currentStep, wizard.totalSteps, wizard.entityType]);

  // ---------------------------------------------------------------------------
  // Accessibility: Escape Key Handler (Web)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Stable because we use handleCancelRef.current inside

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
        window.alert('Please fix the errors before continuing.');
      } else {
        Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      }
    }
  }, [wizard]);

  const handleBack = useCallback(() => {
    wizard.goToPreviousStep();
  }, [wizard]);

  const handlePublish = useCallback(async () => {
    if (!isOrganizer) {
      if (Platform.OS === 'web') {
        if (window.confirm('You are in Sandbox Mode. You must apply to become a host and be approved before you can publish. Would you like to apply now?')) {
          router.push('/hostspace/create');
        }
      } else {
        Alert.alert(
          'Host Approval Required',
          'You are in Sandbox Mode. You must apply to become a host and be approved before you can publish.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Create Host Profile', onPress: () => router.push('/hostspace/create') }
          ]
        );
      }
      return;
    }

    try {
      await wizard.publish();
    } catch (error) {
      console.error('[WizardContainer] Failed to publish profile:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to publish profile. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Publish failed', message);
      }
    }
  }, [wizard, isOrganizer, router]);

  const handleSaveDraft = useCallback(async () => {
    try {
      await wizard.saveDraft();
      if (Platform.OS === 'web') {
        window.alert('Draft saved successfully.');
      } else {
        Alert.alert('Success', 'Draft saved successfully!');
      }
    } catch (error) {
      console.error('[WizardContainer] Failed to save draft:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to save draft. Please try again.');
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

  // Keep a ref to the latest handleCancel so the early Escape key effect (which runs before this definition)
  // always calls the current version without causing the effect to re-subscribe on every render.
  useEffect(() => {
    handleCancelRef.current = handleCancel;
  }, [handleCancel]);

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
  }, [wizard.isDirty, wizard.triggerSave]); // eslint-disable-line react-hooks/exhaustive-deps -- specific properties are stable enough; full `wizard` object would cause unnecessary re-subscriptions

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

  // We only show a blocking loading state during initial load of the requested resource (draft/profile)
  // or until the wizard hook has finished its initialization.
  // We do NOT block on draftRecovery.isLoading because that's a background fetch for other drafts.
  const isBlocking = wizard.isInitializing || wizard.isLoadingDraft || wizard.isLoadingProfile;

  if (isBlocking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>
            Preparing your creation experience...
          </Text>
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
      />
      {/* Progress Indicator */}
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
          stepLabel: getStepLabels(wizard.entityType)[wizard.currentStep - 1],
        })}
      ><WizardProgress
          currentStep={wizard.currentStep}
          totalSteps={wizard.totalSteps}
          completedSteps={wizard.completedSteps}
          stepLabels={getStepLabels(wizard.entityType)}
          onStepClick={handleStepClick}
        /></View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.hPad,
            paddingBottom: safeInsets.bottom + 100, // Extra space for navigation
          },
          contentMaxWidthStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel={`Step ${wizard.currentStep}: ${getStepLabels(wizard.entityType)[wizard.currentStep - 1]}`}
      ><View ref={stepContentRef}><WizardStep
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
            trackUpload={wizard.trackUpload}
            trackApiCall={wizard.trackApiCall}
          /></View></ScrollView>

      {/* Navigation Buttons */}
      <View
        style={[
          styles.navigationContainer,
          {
            paddingBottom: safeInsets.bottom + Luxe.spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      ><WizardNavigation
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
        /></View>

      {/* Auto-Save Indicator */}
      <AutoSaveIndicator
        status={wizard.saveStatus}
        lastSaved={wizard.lastSaved}
      />

      {/* DEV: Surface session metrics for host wizard funnel debugging (step times, auto-save rates, validation errors, abandonment). Data-driven polish. */}
      {__DEV__ && (
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, marginTop: 4 }}>
          <Text style={{ color: '#0f0', fontSize: 9, fontFamily: 'monospace' }} numberOfLines={2}>
            DEV: {JSON.stringify(wizard.getSessionAnalyticsMetrics?.() || { note: 'metrics' })}
          </Text>
        </View>
      )}
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
