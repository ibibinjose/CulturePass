/**
 * Unified directory + community listing wizard (orchestrator).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ImageGalleryPicker } from '@/design-system/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { modulesApi } from '@/modules/api';
import { getStyles } from '@/modules/events/components/create/styles';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { routeWithRedirect } from '@/lib/routes';
import { LISTING_CREATE_ROUTE } from '@/constants/navigation/experienceNav';
import { getCommunityProfilePathId } from '@/lib/community';
import type { Community, CommunityCategory, Profile } from '@/shared/schema';
import { CULTURES } from '@/constants/cultures';
import { LANGUAGES } from '@/constants/languages';

import {
  defaultListingForm,
  listingStepTitle,
  visibleListingSteps,
  type ListingFormState,
  type ListingStepId,
} from '@/modules/listings/create/types';
import { useListingDraftPersistence } from '@/modules/listings/create/useListingDraftPersistence';
import { useListingServerAutosave } from '@/modules/listings/create/useListingServerAutosave';
import {
  communityToListingFormPartial,
  formToCommunityCreateInput,
  formToProfilePayload,
  minimalDraftPayload,
} from '@/modules/listings/create/payload';
import { communitiesApi } from '@/modules/communities/api';
import {
  captureCreationPublishAttempt,
  captureCreationPublishError,
  captureCreationPublishSuccess,
  captureCreationWizardOpen,
  captureCreationWizardStep,
  captureMonetizationImpression,
} from '@/lib/creationAnalytics';
import { getCategoryDataflow } from '@/modules/host/config/hostspaceCreateCategories.config';
import { navigateToCreateById, findCategoryForListingEntity } from '@/lib/creationRouting';
import { findCategory } from '@/modules/host/config/hostspaceCreateCategories.config';
import {
  ListingStepIdentity,
  ListingStepAbout,
  ListingStepMedia,
  ListingStepLocation,
  ListingStepSocialHub,
  ListingStepAuLegal,
  ListingStepEntityExtras,
  ListingStepDelivery,
  ListingStepTeamVerify,
  ListingStepReview,
} from '@/modules/listings/create/steps';

function asParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseEntityType(raw: string | undefined): Profile['entityType'] | 'event' | null {
  if (!raw) return null;
  const r = raw.toLowerCase();
  if (r === 'event') return 'event';
  if (
    r === 'business' ||
    r === 'venue' ||
    r === 'artist' ||
    r === 'organizer' ||
    r === 'community' ||
    r === 'restaurant' ||
    r === 'brand' ||
    r === 'creator'
  ) {
    return r as Profile['entityType'];
  }
  return null;
}

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

function validateStep(step: ListingStepId, form: ListingFormState): string | null {
  if (step === 'identity' && form.name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (step === 'identity' && form.entityType === 'community' && form.handle.trim().length < 2) {
    return 'Community handle is required.';
  }
  if (step === 'location' && !form.city.trim()) {
    return 'City is required.';
  }
  if (step === 'entityExtras' && form.entityType === 'community' && form.cultureIds.length === 0) {
    return 'Select at least one primary culture.';
  }
  if (step === 'entityExtras' && form.entityType === 'community' && form.languageIds.length === 0 && form.languages.length === 0) {
    return 'Select at least one primary language.';
  }
  return null;
}

function directoryProfilePath(profile: Pick<Profile, 'id' | 'entityType'>): string {
  switch (profile.entityType) {
    case 'business':
      return `/business/${profile.id}`;
    case 'venue':
      return `/venue/${profile.id}`;
    case 'artist':
      return `/artist/${profile.id}`;
    case 'community':
      return `/community/${profile.id}`;
    default:
      return `/organiser/${profile.id}`;
  }
}

function CommunityLivePreview({
  form,
  colors,
}: {
  form: ListingFormState;
  colors: ReturnType<typeof useColors>;
}) {
  const cultureLabels = form.cultureIds
    .map((id) => CULTURES[id]?.label)
    .filter((label): label is string => Boolean(label));
  const languageLabels = form.languageIds
    .map((id) => LANGUAGES[id]?.name)
    .filter((label): label is string => Boolean(label));
  const displayCultures = cultureLabels.length ? cultureLabels : form.cultureTags.slice(0, 3);
  const displayLanguages = languageLabels.length ? languageLabels : form.languages.slice(0, 3);

  return (
    <View style={{ width: 340, paddingTop: 16, paddingBottom: 120 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.borderLight,
          borderRadius: 18,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 132, backgroundColor: CultureTokens.indigo + '18' }}>
          {form.coverImageUrl ? (
            <Image source={{ uri: form.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="images-outline" size={34} color={CultureTokens.indigo} />
            </View>
          )}
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginTop: -42 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: colors.surface,
                backgroundColor: CultureTokens.teal + '20',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="people-outline" size={30} color={CultureTokens.teal} />
              )}
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: CultureTokens.teal + '18' }}>
                <Text style={{ color: CultureTokens.teal, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
                  {form.joinMode === 'open' ? 'Public' : form.joinMode === 'request' ? 'Approval required' : 'Private'}
                </Text>
              </View>
            </View>
          </View>
          <View>
            <Text style={[TextStyles.title3, { color: colors.text }]} numberOfLines={2}>
              {form.name.trim() || 'Your community name'}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
              /c/{form.handle.trim() || 'your-community-name'}
            </Text>
          </View>
          {form.tagline.trim() ? (
            <Text style={[TextStyles.body, { color: colors.textSecondary }]} numberOfLines={2}>
              {form.tagline.trim()}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[...displayCultures, ...displayLanguages].slice(0, 5).map((label) => (
              <View key={label} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: CultureTokens.indigo + '12' }}>
                <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]} numberOfLines={1}>
              {form.city.trim() || 'Primary city'}{form.country.trim() ? `, ${form.country.trim()}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ListingCreateScreen({ seedCategoryId }: { seedCategoryId?: string } = {}) {
  const colors = useColors();
  const s = getStyles(colors);
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const { isDesktop, hPad } = useLayout();
  const { user, userId, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    listingEntityType?: string | string[];
    listingSubCategory?: string | string[];
    communityCategory?: string | string[];
    publisherProfileId?: string | string[];
    pageId?: string | string[];
    venueProfileId?: string | string[];
    editId?: string | string[];
  }>();

  const eventRedirected = useRef(false);
  const seededCategory = seedCategoryId ? findCategory(seedCategoryId) : null;
  const listingEntityParam =
    parseEntityType(asParam(params.listingEntityType)) ??
    (seededCategory?.entityType && seededCategory.entityType !== 'event'
      ? (seededCategory.entityType as Profile['entityType'])
      : undefined);
  const listingSubCategory = asParam(params.listingSubCategory) ?? seededCategory?.subCategory;
  const communityCategoryParam = asParam(params.communityCategory) as CommunityCategory | undefined;
  const editingCommunityId =
    asParam(params.editId) && listingEntityParam === 'community' ? asParam(params.editId)! : null;
  const editHydrateOnce = useRef(false);
  const [communityEditReady, setCommunityEditReady] = useState(() => !editingCommunityId);

  useEffect(() => {
    editHydrateOnce.current = false;
    setCommunityEditReady(!editingCommunityId);
  }, [editingCommunityId]);

  useEffect(() => {
    if (eventRedirected.current) return;
    if (listingEntityParam !== 'event') return;
    eventRedirected.current = true;
    const parentHostPageId = asParam(params.pageId) ?? asParam(params.publisherProfileId);
    navigateToCreateById('event', {
      source: 'listing_wizard_event_redirect',
      parentHostPageId,
      replace: true,
    });
  }, [listingEntityParam, params.pageId, params.publisherProfileId]);

  const initialEntity: Profile['entityType'] =
    listingEntityParam && listingEntityParam !== 'event' ? listingEntityParam : 'business';

  const entityHint = initialEntity;

  const [form, setForm] = useState<ListingFormState>(() => ({
    ...defaultListingForm({
      entityType: initialEntity,
      city: onboarding.city || user?.city || '',
      country: onboarding.country || user?.country || 'Australia',
    }),
    subCategory: listingSubCategory ?? '',
    ...(communityCategoryParam ? { communityCategory: communityCategoryParam } : {}),
  }));

  const setField = useCallback(<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onHydrateDraft = useCallback((parsed: Partial<ListingFormState>) => {
    setForm((prev) => ({
      ...prev,
      ...parsed,
      cultureTags: parsed.cultureTags ?? prev.cultureTags,
      gallery: parsed.gallery ?? prev.gallery,
      leadership: parsed.leadership ?? prev.leadership,
      partners: parsed.partners ?? prev.partners,
      languages: parsed.languages ?? prev.languages,
      cultureIds: parsed.cultureIds ?? prev.cultureIds,
      languageIds: parsed.languageIds ?? prev.languageIds,
      draftProfileId: parsed.draftProfileId ?? prev.draftProfileId,
    }));
  }, []);

  const { draftHydrated, clearDraft } = useListingDraftPersistence({
    form,
    userId,
    entityHint,
    onHydrateDraft,
    skipLocalDraftLoad: !!editingCommunityId,
  });

  const communityEditQuery = useQuery({
    queryKey: ['/api/communities', editingCommunityId],
    queryFn: () => communitiesApi.communities.get(editingCommunityId!),
    enabled: !!editingCommunityId && draftHydrated,
  });

  useEffect(() => {
    if (!editingCommunityId || !communityEditQuery.data || editHydrateOnce.current) return;
    onHydrateDraft(communityToListingFormPartial(communityEditQuery.data));
    editHydrateOnce.current = true;
    setCommunityEditReady(true);
  }, [editingCommunityId, communityEditQuery.data, onHydrateDraft]);

  useListingServerAutosave(form, draftHydrated && form.entityType !== 'community');

  useEffect(() => {
    if (!listingEntityParam || listingEntityParam === 'event') return;
    setForm((prev) => (prev.entityType === listingEntityParam ? prev : { ...prev, entityType: listingEntityParam }));
  }, [listingEntityParam]);

  const authRedirected = useRef(false);
  useEffect(() => {
    if (!draftHydrated || isAuthenticated || authRedirected.current) return;
    authRedirected.current = true;
    const searchParams = new URLSearchParams();
    const preservedKeys = [
      'listingEntityType',
      'listingSubCategory',
      'communityCategory',
      'publisherProfileId',
      'pageId',
      'venueProfileId',
      'editId',
    ] as const;
    preservedKeys.forEach((key) => {
      const value = asParam(params[key]);
      if (value) {
        searchParams.set(key, value);
      }
    });
    const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
    router.replace(
      routeWithRedirect('/(onboarding)/login', `${LISTING_CREATE_ROUTE}${q}`) as never,
    );
  }, [draftHydrated, isAuthenticated, params]);

  const steps = useMemo(() => visibleListingSteps(form.entityType), [form.entityType]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;

  const listingCategory = useMemo(
    () => findCategoryForListingEntity(initialEntity, listingSubCategory),
    [initialEntity, listingSubCategory],
  );
  const listingCreationCtx = useMemo(() => {
    const flow = getCategoryDataflow(listingCategory);
    return {
      categoryId: listingCategory.id,
      categoryLabel: listingCategory.label,
      layer: flow.layer,
      wizard: flow.wizard,
      storage: flow.storage,
      manageTab: flow.manageTab,
      source: editingCommunityId || form.draftProfileId ? 'listing_edit' : 'listing_wizard',
      parentProfileId: asParam(params.pageId) ?? asParam(params.publisherProfileId),
      entityType: form.entityType,
      subCategory: listingSubCategory,
    };
  }, [
    listingCategory,
    editingCommunityId,
    form.draftProfileId,
    form.entityType,
    listingSubCategory,
    params.pageId,
    params.publisherProfileId,
  ]);

  useEffect(() => {
    captureCreationWizardOpen(listingCreationCtx);
  }, [listingCreationCtx]);

  useEffect(() => {
    captureCreationWizardStep({
      ...listingCreationCtx,
      stepId: step,
      stepIndex,
    });
  }, [step, stepIndex, listingCreationCtx]);

  const [stepError, setStepError] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<'draft' | 'published'>('draft');
  const [profileImagePickerVisible, setProfileImagePickerVisible] = useState(false);
  const [ensuringDraft, setEnsuringDraft] = useState(false);
  const { uploadImage, deleteImage, uploading: imageUploading } = useImageUpload();
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const pickProfileImage = useCallback(() => {
    if (!isAuthenticated || !userId) {
      Alert.alert('Sign in required', 'Please sign in again to upload images.');
      router.replace(routeWithRedirect('/(onboarding)/login', LISTING_CREATE_ROUTE) as never);
      return;
    }
    haptic();
    setProfileImagePickerVisible(true);
  }, [isAuthenticated, userId]);

  const handleProfileImageSelected = useCallback((uri: string) => {
    setImageUploadError(null);
    setField('imageUrl', uri);
  }, [setField]);

  const pickCoverImage = useCallback(async () => {
    haptic();
    if (!isAuthenticated || !userId) {
      setImageUploadError('Please sign in to upload images.');
      Alert.alert('Sign in required', 'Please sign in again to upload images.');
      router.replace(routeWithRedirect('/(onboarding)/login', LISTING_CREATE_ROUTE) as never);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUploadError(null);
    try {
      if (form.coverImageUrl?.startsWith('https://')) {
        await deleteImage('profiles', userId, form.coverImageUrl, 'coverImageUrl');
      }
      const { downloadURL } = await uploadImage(result, 'profiles', userId, 'coverImageUrl', true);
      setField('coverImageUrl', downloadURL);
    } catch (e) {
      setImageUploadError(e instanceof Error ? e.message : 'Upload failed');
    }
  }, [form.coverImageUrl, userId, uploadImage, deleteImage, setField, isAuthenticated]);

  const createCommunity = useMutation({
    mutationFn: (input: ReturnType<typeof formToCommunityCreateInput>) => modulesApi.communities.create(input),
  });

  const updateCommunity = useMutation({
    mutationFn: (vars: { id: string; input: ReturnType<typeof formToCommunityCreateInput> }) =>
      communitiesApi.communities.update(vars.id, vars.input as Partial<Community>),
  });

  const finalizeProfile = useMutation({
    mutationFn: async (vars: { form: ListingFormState; publishMode: 'draft' | 'published' }) => {
      const status = vars.publishMode === 'published' ? 'published' : 'draft';
      const payload = formToProfilePayload(vars.form, status);
      if (vars.form.draftProfileId) {
        return modulesApi.profiles.update(vars.form.draftProfileId, payload as Record<string, unknown>);
      }
      return modulesApi.profiles.create(payload);
    },
  });

  const handleBack = useCallback(() => {
    haptic();
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setStepError(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/hostspace/create' as never);
  }, [stepIndex]);

  const handlePrimary = useCallback(async () => {
    const err = validateStep(step, form);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);

    if (step === 'identity' && form.entityType !== 'community' && isAuthenticated && !form.draftProfileId) {
      setEnsuringDraft(true);
      try {
        const created = await modulesApi.profiles.create(minimalDraftPayload(form));
        setForm((prev) => ({ ...prev, draftProfileId: created.id }));
      } catch {
        Alert.alert('Could not save draft', 'Check your connection and try again.');
        setEnsuringDraft(false);
        return;
      }
      setEnsuringDraft(false);
      if (!isLast) {
        setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      }
      return;
    }

    if (!isLast) {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      return;
    }

    captureCreationPublishAttempt(listingCreationCtx);

    if (form.entityType === 'community') {
      const input = formToCommunityCreateInput(form);
      if (editingCommunityId) {
        updateCommunity.mutate(
          { id: editingCommunityId, input },
          {
            onSuccess: (community) => {
              captureCreationPublishSuccess({
                ...listingCreationCtx,
                entityId: community.id,
                heritage: {
                  nationalityId: form.nationalityId.trim() || undefined,
                  indigenousTags: form.indigenousTags,
                  isIndigenousOwned: form.isIndigenousOwned,
                  cultureTagCount: form.cultureIds.length,
                },
              });
              if (publishMode === 'published') {
                captureMonetizationImpression('featured_listing', 'listing_community_publish');
              }
              void clearDraft();
              queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
              queryClient.invalidateQueries({ queryKey: ['/api/communities', editingCommunityId] });
              router.replace(`/c/${getCommunityProfilePathId(community)}` as never);
            },
            onError: () => {
              captureCreationPublishError({ ...listingCreationCtx, errorMessage: 'community_update_failed' });
              Alert.alert('Could not update community', 'Please try again shortly.');
            },
          },
        );
        return;
      }
      createCommunity.mutate(input, {
        onSuccess: (community) => {
          captureCreationPublishSuccess({
            ...listingCreationCtx,
            entityId: community.id,
            heritage: {
              nationalityId: form.nationalityId.trim() || undefined,
              indigenousTags: form.indigenousTags,
              isIndigenousOwned: form.isIndigenousOwned,
              cultureTagCount: form.cultureIds.length,
            },
          });
          if (publishMode === 'published') {
            captureMonetizationImpression('featured_listing', 'listing_community_publish');
          }
          void clearDraft();
          queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
          router.replace(`/c/${getCommunityProfilePathId(community)}` as never);
        },
        onError: () => {
          captureCreationPublishError({ ...listingCreationCtx, errorMessage: 'community_create_failed' });
          Alert.alert('Could not create community', 'Please try again shortly.');
        },
      });
      return;
    }

    finalizeProfile.mutate(
      { form, publishMode },
      {
        onSuccess: (profile: Profile) => {
          captureCreationPublishSuccess({
            ...listingCreationCtx,
            entityId: profile.id,
            heritage: {
              nationalityId: form.nationalityId.trim() || undefined,
              indigenousTags: form.indigenousTags,
              isIndigenousOwned: form.isIndigenousOwned,
              cultureTagCount: form.cultureIds.length,
            },
          });
          if (publishMode === 'published') {
            captureMonetizationImpression('featured_listing', 'listing_profile_publish');
          }
          void clearDraft();
          queryClient.invalidateQueries({ queryKey: ['/api/profiles/my'] });
          router.replace(directoryProfilePath(profile) as never);
        },
        onError: () => {
          captureCreationPublishError({ ...listingCreationCtx, errorMessage: 'listing_profile_save_failed' });
          Alert.alert('Could not save listing', 'Please try again shortly.');
        },
      },
    );
  }, [
    step,
    form,
    isAuthenticated,
    isLast,
    steps.length,
    publishMode,
    createCommunity,
    updateCommunity,
    finalizeProfile,
    clearDraft,
    queryClient,
    editingCommunityId,
    listingCreationCtx,
    publishMode,
  ]);

  const stepContent = useMemo(() => {
    const base = { form, setField, colors, s };
    switch (step) {
      case 'identity':
        return <ListingStepIdentity {...base} />;
      case 'about':
        return <ListingStepAbout {...base} />;
      case 'media':
        return (
          <ListingStepMedia
            {...base}
            imageUploading={imageUploading}
            imageUploadError={imageUploadError}
            pickProfileImage={pickProfileImage}
            pickCoverImage={pickCoverImage}
          />
        );
      case 'location':
        return <ListingStepLocation {...base} />;
      case 'social':
        return <ListingStepSocialHub {...base} />;
      case 'auLegal':
        return <ListingStepAuLegal {...base} />;
      case 'entityExtras':
        return <ListingStepEntityExtras {...base} />;
      case 'delivery':
        return <ListingStepDelivery {...base} />;
      case 'teamVerify':
        return <ListingStepTeamVerify {...base} />;
      case 'review':
        return (
          <ListingStepReview
            {...base}
            publishMode={publishMode}
            onPublishMode={setPublishMode}
          />
        );
      default:
        return null;
    }
  }, [
    step,
    form,
    setField,
    colors,
    s,
    imageUploading,
    imageUploadError,
    pickProfileImage,
    pickCoverImage,
    publishMode,
  ]);

  if (listingEntityParam === 'event') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} accessibilityLabel="Opening event creator" />
      </View>
    );
  }

  if (editingCommunityId && communityEditQuery.isError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          paddingHorizontal: 24,
        }}
      >
        <Text style={[TextStyles.body, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>
          Could not load this community for editing.
        </Text>
        <Button variant="primary" onPress={() => router.back()} accessibilityLabel="Go back">
          Go back
        </Button>
      </View>
    );
  }

  if (
    !draftHydrated ||
    !isAuthenticated ||
    (editingCommunityId && (!communityEditReady || communityEditQuery.isLoading))
  ) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} accessibilityLabel="Loading" />
      </View>
    );
  }

  const busy =
    ensuringDraft ||
    imageUploading ||
    createCommunity.isPending ||
    updateCommunity.isPending ||
    finalizeProfile.isPending;
  const isCommunityCreate = form.entityType === 'community';

  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: editingCommunityId ? 'Edit community' : 'New listing',
          headerShown: false,
        }}
      />

      <View style={{ paddingTop: topInset + 16, paddingHorizontal: hPad, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: listingSubCategory ? 4 : 6 }}>
          <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[TextStyles.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {isCommunityCreate
              ? editingCommunityId
                ? 'Edit community'
                : 'Create new community'
              : listingStepTitle(step)}
          </Text>
          {listingSubCategory ? (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: CultureTokens.indigo + '18',
              borderWidth: 1,
              borderColor: CultureTokens.indigo + '40',
            }}>
              <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {listingSubCategory.replace(/_/g, ' ')}
              </Text>
            </View>
          ) : null}
          <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
            {stepIndex + 1}/{steps.length}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
          {steps.map((id, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <View
                key={id}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: active ? CultureTokens.indigo + '22' : done ? colors.surfaceElevated : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? CultureTokens.indigo : colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins_600SemiBold',
                    color: active ? CultureTokens.indigo : colors.textSecondary,
                  }}
                >
                  {listingStepTitle(id)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1, paddingHorizontal: hPad }}>
        <View
          style={{
            flex: 1,
            flexDirection: isDesktop && isCommunityCreate ? 'row' : 'column',
            gap: isDesktop && isCommunityCreate ? 20 : 0,
            alignSelf: isDesktop && isCommunityCreate ? 'center' : 'stretch',
            width: '100%',
            maxWidth: isDesktop && isCommunityCreate ? 1120 : undefined,
          }}
        >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: safeInsets.bottom + 120,
            maxWidth: isDesktop && !isCommunityCreate ? 720 : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
            width: isDesktop ? '100%' : undefined,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {stepError ? (
            <View style={[s.errorBanner, { backgroundColor: colors.error + '18', marginBottom: 12 }]}>
              <Text style={{ color: colors.error }}>{stepError}</Text>
            </View>
          ) : null}
          {stepContent}
        </ScrollView>
        {isDesktop && isCommunityCreate ? (
          <CommunityLivePreview form={form} colors={colors} />
        ) : null}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: hPad,
          paddingBottom: (safeInsets.bottom) + 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.background,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {stepIndex > 0 ? (
          <Button
            variant="outline"
            onPress={handleBack}
            disabled={busy}
            accessibilityLabel="Previous step"
            style={{ borderColor: CultureTokens.indigo }}
            textStyle={{ color: CultureTokens.indigo }}
          >
            Back
          </Button>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Button
          variant="primary"
          onPress={handlePrimary}
          loading={busy}
          disabled={busy}
          accessibilityLabel={isLast ? 'Submit listing' : 'Next step'}
          style={{
            backgroundColor: CultureTokens.indigo,
            borderColor: CultureTokens.coral,
            borderWidth: 3,
          }}
          textStyle={{ color: '#FFFFFF' }}
        >
          {isLast
            ? form.entityType === 'community'
              ? editingCommunityId
                ? 'Save changes'
                : 'Create community'
              : publishMode === 'published'
                ? 'Publish'
                : 'Save draft'
            : 'Continue'}
        </Button>
      </View>
    </KeyboardAvoidingView>

    {userId ? (
      <ImageGalleryPicker
        visible={profileImagePickerVisible}
        onClose={() => setProfileImagePickerVisible(false)}
        currentUri={form.imageUrl || null}
        onSelect={handleProfileImageSelected}
        collectionName="profiles"
        docId={userId}
        fieldName="imageUrl"
        skipDbUpdate
      />
    ) : null}
    </>
  );
}
