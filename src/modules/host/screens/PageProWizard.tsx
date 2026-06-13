/**
 * Page Pro Wizard — unified 5-step Create a Page flow
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { showUserAlert } from '@/lib/showUserAlert';
import { buildHostspaceCreateHref } from '@/constants/navigation/createNav';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import {
  M3TopAppBar,
  M3Button,
  M3FilterChip,
  M3Card,
} from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing, Radius } from '@/design-system/tokens/theme';
import type { HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { MediaUploadField } from '../components/fields/MediaUploadField';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator';
import { PageHomePreview } from '../components/PageHomePreview';
import { PagePublishSuccess } from '../components/PagePublishSuccess';
import { HostErrorBoundary } from '../components/ErrorBoundary';
import { usePageWizard } from '../hooks/usePageWizard';
import { isE2EFixturesEnabled } from '@/lib/e2e-fixtures';
import {
  getPageWizardStepLabel,
  getPageWizardStepHint,
} from '../config/pageWizardSteps';
import {
  PAGE_CATEGORY_PRESETS,
} from '../constants/pageTagPresets';
import { PAGE_TEMPLATES } from '../config/pageTemplates.config';
import { PageWizardBusinessStep } from '../components/pageWizard/PageWizardBusinessStep';
import { PageWizardContactStep } from '../components/pageWizard/PageWizardContactStep';
import { PageWizardLeadershipStep } from '../components/pageWizard/PageWizardLeadershipStep';
import { PageWizardTagsStep } from '../components/pageWizard/PageWizardTagsStep';
import { hostPageRequiresAbn } from '@/shared/schema/hostPage';

export interface PageProWizardProps {
  entityType: HostEntityType;
  templateId?: HostPageTemplateId;
  draftId?: string;
  pageId?: string;
  onCancel?: () => void;
}

const MEMBERSHIP_OPTIONS = [
  { id: 'free' as const, label: 'Free', desc: 'Anyone can follow' },
  { id: 'paid' as const, label: 'Paid', desc: 'Monthly membership fee' },
  { id: 'invite-only' as const, label: 'Invite only', desc: 'Curated membership' },
];

const CTA_OPTIONS = [
  { action: 'follow' as const, label: 'Follow' },
  { action: 'join' as const, label: 'Join' },
  { action: 'book' as const, label: 'Book' },
  { action: 'contact' as const, label: 'Contact' },
];

function PageProWizardInner({
  entityType,
  templateId,
  draftId,
  pageId,
  onCancel,
}: PageProWizardProps) {
  const colors = useM3Colors();
  const { hPad, isDesktop } = useLayout();
  const router = useRouter();
  const { user } = useAuth();
  const [published, setPublished] = useState<{ pageId: string; verificationRequired: boolean } | null>(null);
  const wizard = usePageWizard({
    entityType,
    templateId,
    draftId,
    pageId,
    onPublishSuccess: (id, verificationRequired) => {
      setPublished({ pageId: id, verificationRequired });
    },
  });

  const e2eFormAppliedRef = useRef(false);
  useEffect(() => {
    if (e2eFormAppliedRef.current) return;
    if (!isE2EFixturesEnabled() || typeof window === 'undefined') return;
    const patch = window.__CP_E2E_PAGE_FORM__;
    if (patch && typeof patch === 'object') {
      wizard.updateFormData(patch as Parameters<typeof wizard.updateFormData>[0]);
      e2eFormAppliedRef.current = true;
    }
  }, [wizard.updateFormData]);

  const categoryPresets = PAGE_CATEGORY_PRESETS[entityType] ?? PAGE_CATEGORY_PRESETS.community;

  const toggleCategory = useCallback(
    (tag: string) => {
      const current = wizard.formData.categoryTags ?? [];
      if (current.includes(tag)) {
        wizard.updateFormData({ categoryTags: current.filter((t: string) => t !== tag) });
      } else if (current.length < 3) {
        wizard.updateFormData({ categoryTags: [...current, tag] });
      }
    },
    [wizard],
  );

  const toggleTag = useCallback(
    (field: 'culturalTags' | 'languageTags', tag: string) => {
      const current = wizard.formData[field] ?? [];
      if (current.includes(tag)) {
        wizard.updateFormData({ [field]: current.filter((t: string) => t !== tag) });
      } else {
        wizard.updateFormData({ [field]: [...current, tag] });
      }
    },
    [wizard],
  );

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.replace(buildHostspaceCreateHref() as never);
  };

  const handlePublish = async () => {
    const result = await wizard.publish();
    if (result.ok) return;
    if (result.reason === 'validation' && result.issues?.length) {
      showUserAlert(
        'Complete required fields',
        result.issues.map((issue) => issue.message).join('\n'),
      );
      return;
    }
    if (result.reason === 'api') {
      showUserAlert('Publish failed', result.message ?? 'Please try again in a moment.');
      return;
    }
    if (result.reason === 'step') {
      showUserAlert('Check this step', 'Fix the highlighted fields before continuing.');
    }
  };

  if (entityType === 'community' || entityType === 'organiser' || entityType === 'organizer') {
    const type = entityType === 'community' ? 'community' : 'organizer';
    return <Redirect href={`/hostspace/create/page?type=${type}` as never} />;
  }

  if (published) {
    return (
      <PagePublishSuccess
        pageId={published.pageId}
        entityType={entityType}
        verificationRequired={published.verificationRequired}
        onDone={() => setPublished(null)}
      />
    );
  }

  if (wizard.isInitializing) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
          Restoring your draft…
        </Text>
      </View>
    );
  }

  const stepLabel = getPageWizardStepLabel(wizard.currentStepId);
  const stepHint = getPageWizardStepHint(wizard.currentStepId);

  const renderStep = () => {
    switch (wizard.currentStepId) {
      case 'basics':
        return (
          <View style={styles.step}>
            <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Basics</Text>
            <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.md }]}>
              {stepHint}
            </Text>
            <Text style={[M3Typography.labelLarge, { color: colors.onSurface }]}>Page name</Text>
            <TextInput
              value={wizard.formData.name}
              onChangeText={(name) => wizard.updateFormData({ name })}
              placeholder="e.g. Kerala Cultural Society"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface }]}
              accessibilityLabel="Page name"
            />
            {wizard.getFieldError('name') && (
              <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('name')}</Text>
            )}

            <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.md }]}>Bio</Text>
            <TextInput
              value={wizard.formData.bio}
              onChangeText={(bio) => wizard.updateFormData({ bio })}
              placeholder="1–2 sentences about your culture and community"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface }]}
              accessibilityLabel="Page bio"
            />
            {wizard.getFieldError('bio') && (
              <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('bio')}</Text>
            )}

            <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.md }]}>
              Categories (max 3)
            </Text>
            <View style={styles.chipRow}>
              {categoryPresets.map((cat) => (
                <M3FilterChip
                  key={cat}
                  label={cat}
                  selected={(wizard.formData.categoryTags ?? []).includes(cat)}
                  onPress={() => toggleCategory(cat)}
                />
              ))}
            </View>
            {wizard.getFieldError('categoryTags') && (
              <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('categoryTags')}</Text>
            )}

            {hostPageRequiresAbn(entityType) ? (
              <>
                <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.md }]}>
                  Trading name (optional)
                </Text>
                <TextInput
                  value={wizard.formData.tradingName ?? ''}
                  onChangeText={(tradingName) => wizard.updateFormData({ tradingName })}
                  placeholder="How customers know you"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface }]}
                  accessibilityLabel="Trading name"
                />
              </>
            ) : null}
          </View>
        );

      case 'tags':
        return (
          <PageWizardTagsStep
            entityType={entityType}
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            toggleCategory={toggleCategory}
          />
        );

      case 'business':
        return (
          <PageWizardBusinessStep
            entityType={entityType}
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            getFieldError={wizard.getFieldError}
          />
        );

      case 'contact':
        return (
          <PageWizardContactStep
            entityType={entityType}
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            getFieldError={wizard.getFieldError}
          />
        );

      case 'leadership':
        return (
          <PageWizardLeadershipStep
            entityType={entityType}
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            getFieldError={wizard.getFieldError}
          />
        );

      case 'branding':
        return (
          <View style={styles.step}>
            <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Branding</Text>
            <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.md }]}>
              Logo ≥180×180 · Cover ≥820×312
            </Text>
            <MediaUploadField
              label="Logo"
              type="logo"
              value={wizard.formData.logoUrl ?? ''}
              onChange={(logoUrl) => wizard.updateFormData({ logoUrl: logoUrl as string })}
              storagePath={`host-pages/${user?.id ?? 'draft'}`}
              aspectRatio={1}
              minDimensions={{ width: 180, height: 180 }}
              showCropTool
            />
            {wizard.getFieldError('logoUrl') && (
              <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('logoUrl')}</Text>
            )}
            <View style={{ height: Spacing.lg }} />
            <MediaUploadField
              label="Cover image"
              type="hero"
              value={wizard.formData.coverUrl ?? ''}
              onChange={(coverUrl) => wizard.updateFormData({ coverUrl: coverUrl as string })}
              storagePath={`host-pages/${user?.id ?? 'draft'}`}
              aspectRatio={820 / 312}
              minDimensions={{ width: 820, height: 312 }}
              showCropTool
            />
            {wizard.getFieldError('coverUrl') && (
              <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('coverUrl')}</Text>
            )}
          </View>
        );

      case 'membership':
        return (
          <View style={styles.step}>
            <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Membership & CTA</Text>
            <View style={styles.chipRow}>
              {MEMBERSHIP_OPTIONS.map((opt) => (
                <M3FilterChip
                  key={opt.id}
                  label={opt.label}
                  selected={wizard.formData.membershipModel === opt.id}
                  onPress={() => wizard.updateFormData({ membershipModel: opt.id })}
                />
              ))}
            </View>
            {wizard.formData.membershipModel === 'paid' && (
              <>
                <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.md }]}>
                  Monthly fee (cents)
                </Text>
                <TextInput
                  value={wizard.formData.monthlyFeeCents?.toString() ?? ''}
                  onChangeText={(v) => wizard.updateFormData({ monthlyFeeCents: parseInt(v, 10) || 0 })}
                  keyboardType="number-pad"
                  placeholder="e.g. 999 for $9.99"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface }]}
                  accessibilityLabel="Monthly membership fee in cents"
                />
                {wizard.getFieldError('monthlyFeeCents') && (
                  <Text style={[styles.error, { color: colors.error }]}>{wizard.getFieldError('monthlyFeeCents')}</Text>
                )}
              </>
            )}
            <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.lg }]}>Primary CTA</Text>
            <View style={styles.chipRow}>
              {CTA_OPTIONS.map((opt) => (
                <M3FilterChip
                  key={opt.action}
                  label={opt.label}
                  selected={wizard.formData.ctaAction === opt.action}
                  onPress={() => wizard.updateFormData({ ctaAction: opt.action, ctaLabel: opt.label })}
                />
              ))}
            </View>
            <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.lg }]}>Template</Text>
            <View style={styles.chipRow}>
              {PAGE_TEMPLATES.map((tpl) => (
                <M3FilterChip
                  key={tpl.id}
                  label={tpl.title}
                  selected={wizard.formData.templateId === tpl.id}
                  onPress={() => wizard.updateFormData({ templateId: tpl.id })}
                />
              ))}
            </View>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.step}>
            <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Live preview</Text>
            <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.md }]}>
              Your Page is your home on CulturePass
            </Text>
            <PageHomePreview formData={wizard.formData} entityType={entityType} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="page-pro-wizard">
      <M3TopAppBar
        title={`Create ${stepLabel}`}
        onBack={wizard.currentStep > 1 ? wizard.goToPreviousStep : handleCancel}
        actions={[
          {
            icon: 'save-outline',
            onPress: () => void wizard.triggerSave(),
            label: 'Save draft',
          },
        ]}
      />

      <View style={[styles.progressRow, { paddingHorizontal: hPad }]}>
        {wizard.wizardSteps.map((stepId, i) => {
          const stepNum = i + 1;
          const label = getPageWizardStepLabel(stepId);
          const active = stepNum === wizard.currentStep;
          const done = wizard.completedSteps.has(stepNum);
          return (
            <Pressable
              key={stepId}
              onPress={() => wizard.goToStep(stepNum)}
              style={styles.progressDot}
              accessibilityRole="button"
              accessibilityLabel={`Step ${stepNum}: ${label}`}
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: active || done ? colors.primary : colors.surfaceContainerHighest,
                  },
                ]}
              />
              {isDesktop && (
                <Text
                  style={[M3Typography.labelSmall, { color: active ? colors.primary : colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <AutoSaveIndicator status={wizard.saveStatus} lastSaved={wizard.lastSaved} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: hPad, maxWidth: isDesktop ? 720 : undefined, alignSelf: 'center', width: '100%' },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <M3Card style={{ padding: Spacing.lg, backgroundColor: colors.surfaceContainerLow }}>
          {renderStep()}
        </M3Card>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: hPad, borderTopColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
        {wizard.currentStep < wizard.totalSteps ? (
          <M3Button
            onPress={() => void wizard.goToNextStep()}
            accessibilityLabel="Continue to next step"
            testID="page-wizard-continue"
          >
            Continue
          </M3Button>
        ) : (
          <M3Button
            onPress={() => void handlePublish()}
            loading={wizard.isPublishing}
            accessibilityLabel="Publish page"
            testID="page-wizard-publish"
          >
            Publish Page
          </M3Button>
        )}
      </View>
    </View>
  );
}

export function PageProWizard(props: PageProWizardProps) {
  return (
    <HostErrorBoundary onGoBack={props.onCancel}>
      <PageProWizardInner {...props} />
    </HostErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, gap: 4 },
  progressDot: { alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  scroll: { paddingVertical: Spacing.md, paddingBottom: 100 },
  step: { gap: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginTop: 6,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  error: { ...M3Typography.bodySmall, marginTop: 4 },
  footer: { paddingVertical: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});