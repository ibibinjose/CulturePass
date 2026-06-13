import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from 'react-native';
import { showUserAlert } from '@/lib/showUserAlert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { buildHostspaceCreateHref } from '@/constants/navigation/createNav';
import { CultureTokens, Spacing, TextStyles } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';

import {
  Section,
  Field,
  FormInput,
  ChoiceChip,
  CreateFormChipGrid,
  CreateFormTwoCol,
  CreateFormSelect,
} from '@/components/forms';
import { MediaUploadField } from './fields/MediaUploadField';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { PagePublishSuccess } from './PagePublishSuccess';
import { PageHomePreview } from './PageHomePreview';
import { OrgHostListingCreateSection } from './OrgHostListingCreateSection';
import { usePageWizard } from '../hooks/usePageWizard';
import { PAGE_CATEGORY_PRESETS } from '../constants/pageTagPresets';
import type { HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import type { HostPageFormData } from '@/shared/schema/hostPage';
import {
  ORGANISATION_COMMUNITY_TYPES,
  buildOrgCommunityCategoryTags,
  findOrganisationCommunityType,
  resolveOrganisationTypeFromHostPage,
  type OrganisationCommunityType,
  type OrganisationCommunityTypeId,
} from '../config/organisationCommunityTypes.config';

const MEMBERSHIP_OPTIONS = ['free', 'paid', 'invite-only'] as const;
const CTA_OPTIONS = [
  { action: 'follow' as const, label: 'Follow' },
  { action: 'join' as const, label: 'Join' },
  { action: 'book' as const, label: 'Book' },
  { action: 'contact' as const, label: 'Contact' },
];

export type OrganisationCommunityCategorySelector = 'grid' | 'dropdown';

export type OrganisationCommunityCreateFormProps = {
  initialTypeId?: string;
  draftId?: string;
  pageId?: string;
  templateId?: HostPageTemplateId;
  onCancel?: () => void;
  /** Desktop defaults to grid; mobile defaults to dropdown. */
  categorySelector?: OrganisationCommunityCategorySelector;
  showHero?: boolean;
  /** Parent HostspaceCreateShell owns scrolling — avoids nested scroll on web. */
  embeddedInShell?: boolean;
};

const REQUIRED_PROGRESS_KEYS: (keyof HostPageFormData)[] = [
  'name',
  'bio',
  'categoryTags',
  'publicEmail',
  'logoUrl',
  'coverUrl',
];

function computeFormProgress(formData: HostPageFormData): { done: number; total: number } {
  let done = 0;
  if (formData.name?.trim()) done += 1;
  if ((formData.bio?.trim().length ?? 0) >= 20) done += 1;
  if ((formData.categoryTags?.length ?? 0) > 0) done += 1;
  if (formData.publicEmail?.trim()) done += 1;
  if (formData.logoUrl?.trim()) done += 1;
  if (formData.coverUrl?.trim()) done += 1;
  return { done, total: REQUIRED_PROGRESS_KEYS.length };
}

function FormProgressBar({ done, total }: { done: number; total: number }) {
  const colors = useColors();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const ready = done >= total;

  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: ready ? CultureTokens.teal : CultureTokens.appBlue,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressLabel, { color: ready ? CultureTokens.teal : colors.textSecondary }]}>
        {ready ? 'Ready to publish' : `${done}/${total} required`}
      </Text>
    </View>
  );
}

function PageTypeSummaryCard({ pageType }: { pageType: OrganisationCommunityType }) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.typeSummary,
        {
          borderColor: `${pageType.color}55`,
          backgroundColor: `${pageType.color}10`,
        },
      ]}
    >
      <View style={[styles.typeSummaryIcon, { backgroundColor: `${pageType.color}20` }]}>
        <Ionicons name={pageType.icon} size={22} color={pageType.color} />
      </View>
      <View style={styles.typeSummaryCopy}>
        <Text style={[styles.typeSummaryLabel, { color: colors.text }]}>{pageType.label}</Text>
        <Text style={[styles.typeSummaryNotes, { color: colors.textSecondary }]} numberOfLines={2}>
          {pageType.notes}
        </Text>
      </View>
    </View>
  );
}

function OrganisationCommunityTypeSelector({
  selectedId,
  onSelect,
}: {
  selectedId: OrganisationCommunityTypeId;
  onSelect: (id: OrganisationCommunityTypeId) => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.typeGrid}>
      {ORGANISATION_COMMUNITY_TYPES.map((type) => {
        const active = type.id === selectedId;
        return (
          <Pressable
            key={type.id}
            onPress={() => onSelect(type.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${type.label}. ${type.notes}`}
            style={({ pressed }) => [
              styles.typeCard,
              {
                borderColor: active ? type.color : colors.borderLight,
                backgroundColor: active ? `${type.color}12` : colors.surface,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={[styles.typeIcon, { backgroundColor: `${type.color}18` }]}>
              <Ionicons name={type.icon} size={20} color={type.color} />
            </View>
            <Text style={[styles.typeLabel, { color: colors.text }]} numberOfLines={1}>
              {type.label}
            </Text>
            <Text style={[styles.typeNotes, { color: colors.textSecondary }]} numberOfLines={2}>
              {type.notes}
            </Text>
            {active ? (
              <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function OrganisationCommunityTypeDropdown({
  selectedId,
  onSelect,
  pageType,
}: {
  selectedId: OrganisationCommunityTypeId;
  onSelect: (id: OrganisationCommunityTypeId) => void;
  pageType: OrganisationCommunityType;
}) {
  return (
    <View style={styles.dropdownBlock}>
      <PageTypeSummaryCard pageType={pageType} />
      <CreateFormSelect
        value={selectedId}
        onChange={onSelect}
        accessibilityLabel="Page category"
        options={ORGANISATION_COMMUNITY_TYPES.map((type) => ({
          value: type.id,
          label: type.label,
          description: type.notes,
        }))}
      />
    </View>
  );
}

function OrganisationCommunityCreateFormBody({
  pageType,
  entityType,
  selectedTypeId,
  onTypeChange,
  draftId,
  pageId,
  templateId,
  onCancel,
  categorySelector,
  showHero,
  embeddedInShell,
}: {
  pageType: OrganisationCommunityType;
  entityType: HostEntityType;
  selectedTypeId: OrganisationCommunityTypeId;
  onTypeChange: (id: OrganisationCommunityTypeId) => void;
  draftId?: string;
  pageId?: string;
  templateId?: HostPageTemplateId;
  onCancel?: () => void;
  categorySelector?: OrganisationCommunityCategorySelector;
  showHero: boolean;
  embeddedInShell: boolean;
}) {
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const selectorMode: OrganisationCommunityCategorySelector =
    categorySelector ?? (isDesktop ? 'grid' : 'dropdown');
  const { user } = useAuth();
  const [published, setPublished] = useState<{ pageId: string; verificationRequired: boolean } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const wizard = usePageWizard({
    entityType,
    templateId,
    draftId,
    pageId,
    singlePageForm: true,
    onPageRestored: (page) => {
      const resolvedTypeId = resolveOrganisationTypeFromHostPage(
        page.entityType,
        page.formData.categoryTags ?? [],
      );
      if (resolvedTypeId !== selectedTypeId) {
        onTypeChange(resolvedTypeId);
      }
    },
    onPublishSuccess: (id, verificationRequired) => {
      setPublished({ pageId: id, verificationRequired });
    },
  });

  const categoryPresets = PAGE_CATEGORY_PRESETS[entityType] ?? PAGE_CATEGORY_PRESETS.community;
  const progress = computeFormProgress(wizard.formData);

  useEffect(() => {
    const current = wizard.formData.categoryTags ?? [];
    const next = buildOrgCommunityCategoryTags(pageType, current);
    if (next.join('|') !== current.join('|')) {
      wizard.updateFormData({ categoryTags: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync tags when page type changes
  }, [pageType.id]);

  const toggleCategory = useCallback(
    (tag: string) => {
      const current = wizard.formData.categoryTags ?? [];
      if (tag === pageType.label) return;
      if (current.includes(tag)) {
        wizard.updateFormData({
          categoryTags: buildOrgCommunityCategoryTags(
            pageType,
            current.filter((t) => t !== tag),
          ),
        });
      } else if (current.length < 3) {
        wizard.updateFormData({
          categoryTags: buildOrgCommunityCategoryTags(pageType, [...current, tag]),
        });
      }
    },
    [pageType, wizard],
  );

  const handleTypeChange = (nextId: OrganisationCommunityTypeId) => {
    if (nextId === selectedTypeId) return;
    if (wizard.isDirty) {
      Alert.alert(
        'Change page type?',
        'Switching type may reset some category tags. Your name and bio will be kept.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change', onPress: () => onTypeChange(nextId) },
        ],
      );
      return;
    }
    onTypeChange(nextId);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.replace(buildHostspaceCreateHref() as never);
  };

  const handlePublish = async () => {
    setPublishError(null);
    const result = await wizard.publish();
    if (result.ok) return;
    if (result.reason === 'validation' && result.issues?.length) {
      const message = result.issues.map((issue) => `• ${issue.message}`).join('\n');
      setPublishError(message);
      showUserAlert('Complete required fields', message);
      return;
    }
    if (result.reason === 'api') {
      const message = result.message ?? 'Please try again in a moment.';
      setPublishError(message);
      showUserAlert('Publish failed', message);
      return;
    }
    const message = 'Please fix the highlighted fields before publishing.';
    setPublishError(message);
    showUserAlert('Complete required fields', message);
  };

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
        <ActivityIndicator size="large" color={CultureTokens.appBlue} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Restoring your draft…</Text>
      </View>
    );
  }

  const formSections = (
    <>
      <Section
        title="Page category"
        icon={selectorMode === 'dropdown' ? 'list-outline' : 'grid-outline'}
      >
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          {selectorMode === 'dropdown'
            ? 'Pick the type that best matches your group — you can change it before publishing.'
            : 'Choose the type that best describes your organisation. This sets how your page appears in discovery.'}
        </Text>
        {selectorMode === 'dropdown' ? (
          <OrganisationCommunityTypeDropdown
            selectedId={selectedTypeId}
            onSelect={handleTypeChange}
            pageType={pageType}
          />
        ) : (
          <OrganisationCommunityTypeSelector selectedId={selectedTypeId} onSelect={handleTypeChange} />
        )}
      </Section>

      <Section title="Page identity" icon="id-card-outline">
        <Field label="Page name" required error={wizard.getFieldError('name')}>
          <FormInput
            value={wizard.formData.name}
            onChangeText={(name) => wizard.updateFormData({ name })}
            placeholder="e.g. Malayalee Cultural Society Sydney"
            accessibilityLabel="Page name"
          />
        </Field>
        <Field label="About your page" required hint="At least 20 characters" error={wizard.getFieldError('bio')}>
          <FormInput
            value={wizard.formData.bio}
            onChangeText={(bio) => wizard.updateFormData({ bio })}
            placeholder="Tell diaspora audiences who you serve and what you offer."
            multiline
            accessibilityLabel="Page bio"
          />
        </Field>
        {entityType === 'organiser' ? (
          <Field label="Registered legal name" hint="Optional — for associations and NGOs">
            <FormInput
              value={wizard.formData.registeredBusinessName ?? ''}
              onChangeText={(registeredBusinessName) => wizard.updateFormData({ registeredBusinessName })}
              placeholder="Legal entity name if different from page name"
              accessibilityLabel="Registered legal name"
            />
          </Field>
        ) : null}
        <Field label="Discovery categories" required hint="Max 3 — page type is always included">
          <CreateFormChipGrid>
            {categoryPresets.map((tag) => (
              <ChoiceChip
                key={tag}
                label={tag}
                selected={(wizard.formData.categoryTags ?? []).includes(tag)}
                onPress={() => toggleCategory(tag)}
              />
            ))}
          </CreateFormChipGrid>
        </Field>
      </Section>

      <Section title="Location & reach" icon="location-outline">
        <CreateFormTwoCol>
          <Field label="City">
            <FormInput
              value={wizard.formData.primaryAddress?.city ?? ''}
              onChangeText={(city) =>
                wizard.updateFormData({
                  primaryAddress: {
                    ...wizard.formData.primaryAddress,
                    city,
                    country: wizard.formData.primaryAddress?.country ?? 'Australia',
                    isPrimary: true,
                  },
                })
              }
              placeholder="Sydney"
              accessibilityLabel="City"
            />
          </Field>
          <Field label="State">
            <FormInput
              value={wizard.formData.primaryAddress?.state ?? ''}
              onChangeText={(state) =>
                wizard.updateFormData({
                  primaryAddress: {
                    ...wizard.formData.primaryAddress,
                    state,
                    country: wizard.formData.primaryAddress?.country ?? 'Australia',
                    isPrimary: true,
                  },
                })
              }
              placeholder="NSW"
              accessibilityLabel="State"
            />
          </Field>
        </CreateFormTwoCol>
        <Field label="Country">
          <FormInput
            value={wizard.formData.primaryAddress?.country ?? 'Australia'}
            onChangeText={(country) =>
              wizard.updateFormData({
                primaryAddress: {
                  ...wizard.formData.primaryAddress,
                  country,
                  isPrimary: true,
                },
              })
            }
            placeholder="Australia"
            accessibilityLabel="Country"
          />
        </Field>
        <View style={[styles.switchRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
          <View style={styles.switchText}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Online only</Text>
            <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
              No physical address — digital-first community or remote services
            </Text>
          </View>
          <Switch
            value={wizard.formData.isOnlineOnly ?? false}
            onValueChange={(isOnlineOnly) => wizard.updateFormData({ isOnlineOnly })}
            accessibilityLabel="Online only organisation"
          />
        </View>
      </Section>

      <Section title="Contact" icon="mail-outline">
        <Field label="Public email" required error={wizard.getFieldError('publicEmail')}>
          <FormInput
            value={wizard.formData.publicEmail ?? ''}
            onChangeText={(publicEmail) => wizard.updateFormData({ publicEmail })}
            placeholder={user?.email ?? 'hello@yourorg.org'}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Public email"
          />
        </Field>
        <CreateFormTwoCol>
          <Field label="Phone">
            <FormInput
              value={wizard.formData.phoneNumber ?? ''}
              onChangeText={(phoneNumber) => wizard.updateFormData({ phoneNumber })}
              placeholder="+61 …"
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
            />
          </Field>
          <Field label="WhatsApp">
            <FormInput
              value={wizard.formData.whatsappNumber ?? ''}
              onChangeText={(whatsappNumber) => wizard.updateFormData({ whatsappNumber })}
              placeholder="+61 …"
              keyboardType="phone-pad"
              accessibilityLabel="WhatsApp number"
            />
          </Field>
        </CreateFormTwoCol>
      </Section>

      <Section title="Membership & CTA" icon="people-outline">
        <Field label="Membership model">
          <CreateFormChipGrid>
            {MEMBERSHIP_OPTIONS.map((model) => (
              <ChoiceChip
                key={model}
                label={model === 'invite-only' ? 'Invite only' : model.charAt(0).toUpperCase() + model.slice(1)}
                selected={wizard.formData.membershipModel === model}
                onPress={() => wizard.updateFormData({ membershipModel: model })}
              />
            ))}
          </CreateFormChipGrid>
        </Field>
        <Field label="Primary button on your page">
          <CreateFormChipGrid>
            {CTA_OPTIONS.map((cta) => (
              <ChoiceChip
                key={cta.action}
                label={cta.label}
                selected={wizard.formData.ctaAction === cta.action}
                onPress={() => wizard.updateFormData({ ctaAction: cta.action, ctaLabel: cta.label })}
              />
            ))}
          </CreateFormChipGrid>
        </Field>
      </Section>

      <Section title="Branding" icon="image-outline">
        <Field label="Logo" required error={wizard.getFieldError('logoUrl')}>
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
        </Field>
        <Field label="Cover image" required error={wizard.getFieldError('coverUrl')}>
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
        </Field>
      </Section>

      {wizard.pageId ? (
        <OrgHostListingCreateSection
          hostPageId={wizard.pageId}
          source="org_community_form_edit"
        />
      ) : null}
    </>
  );

  const toolbar = (
    <View style={[styles.toolbar, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
      <View style={styles.toolbarLeft}>
        {showHero ? (
          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: CultureTokens.appBlue }]}>Organisations & Communities</Text>
            <Text style={[styles.title, { color: colors.text }]}>Create your page</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              One form for every org and community type.
            </Text>
          </View>
        ) : null}
        <AutoSaveIndicator status={wizard.saveStatus} lastSaved={wizard.lastSaved} />
      </View>
      <FormProgressBar done={progress.done} total={progress.total} />
    </View>
  );

  const footer = (
    <View
      style={[
        styles.footer,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.surface,
        },
        embeddedInShell && Platform.OS === 'web' ? (styles.footerSticky as object) : null,
      ]}
    >
      <Button variant="secondary" onPress={handleCancel} accessibilityLabel="Cancel create page">
        Cancel
      </Button>
      <Button
        variant="primary"
        onPress={handlePublish}
        loading={wizard.isPublishing}
        disabled={progress.done < progress.total}
        accessibilityLabel="Publish organisation page"
        style={isDesktop ? undefined : { flex: 1 }}
      >
        Publish page
      </Button>
    </View>
  );

  const content = (
    <>
      {publishError ? (
        <View style={[styles.publishErrorBanner, { borderColor: CultureTokens.coral, backgroundColor: `${CultureTokens.coral}14` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={CultureTokens.coral} />
          <Text style={[styles.publishErrorText, { color: colors.text }]}>{publishError}</Text>
        </View>
      ) : null}

      {toolbar}

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        <View style={styles.formColumn}>{formSections}</View>
        {isDesktop ? (
          <View style={styles.previewColumn}>
            <PageHomePreview formData={wizard.formData} entityType={entityType} />
          </View>
        ) : (
          <PageHomePreview formData={wizard.formData} entityType={entityType} />
        )}
      </View>

      {footer}
    </>
  );

  if (embeddedInShell) {
    return (
      <View style={[styles.shellContent, { paddingHorizontal: 0 }]}>
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );
}

export function OrganisationCommunityCreateForm({
  initialTypeId = 'community',
  draftId,
  pageId,
  templateId,
  onCancel,
  categorySelector,
  showHero = true,
  embeddedInShell = false,
}: OrganisationCommunityCreateFormProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<OrganisationCommunityTypeId>(() =>
    findOrganisationCommunityType(initialTypeId).id,
  );

  const pageType = findOrganisationCommunityType(selectedTypeId);
  const entityType = pageType.entityType;

  return (
    <OrganisationCommunityCreateFormBody
      key={selectedTypeId}
      pageType={pageType}
      entityType={entityType}
      selectedTypeId={selectedTypeId}
      onTypeChange={setSelectedTypeId}
      draftId={draftId}
      pageId={pageId}
      templateId={templateId}
      onCancel={onCancel}
      categorySelector={categorySelector}
      showHero={showHero}
      embeddedInShell={embeddedInShell}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  shellContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  toolbar: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  toolbarLeft: {
    gap: 8,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 108,
    textAlign: 'right',
  },
  layout: {
    gap: Spacing.md,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  formColumn: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.md,
  },
  previewColumn: {
    width: 360,
    flexShrink: 0,
    ...(Platform.OS === 'web'
      ? ({
          position: 'sticky' as const,
          top: 12,
          alignSelf: 'flex-start',
        } as object)
      : {}),
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  footerSticky: Platform.OS === 'web'
    ? ({
        position: 'sticky',
        bottom: 8,
        zIndex: 20,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      } as object)
    : {},
  typeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  typeSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSummaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  typeSummaryLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  typeSummaryNotes: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...TextStyles.body,
    marginTop: Spacing.md,
  },
  publishErrorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: Spacing.sm,
  },
  publishErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 19,
  },
  hero: {
    gap: 6,
  },
  dropdownBlock: {
    gap: Spacing.sm,
  },
  eyebrow: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    ...TextStyles.title2,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionHint: {
    ...TextStyles.caption,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    ...(Platform.OS === 'web'
      ? ({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        } as Record<string, unknown>)
      : {}),
  },
  typeCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: Platform.OS === 'web' ? undefined : '48%',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    position: 'relative',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  typeNotes: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: 4,
  },
  switchText: { flex: 1, minWidth: 0 },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  switchHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
});