import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, Alert, ActivityIndicator, Share,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ImageGalleryPicker } from '@/design-system/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { ApiError, eventsApi } from '@/modules/events/api';
import { ALL_NATIONALITIES, getCulturesForNationality } from '@/constants/cultures';
import {
  EventData,
  EventType,
  EventArtist,
  EventSponsor,
  EventHostInfo,
  CULTURE_TODAY_EVENT_TAG,
  CULTUREX_EXPLORES_CULTURE_TAG,
} from '@/shared/schema';
import { TextStyles } from '@/design-system/tokens/typography';
import { useImageUpload } from '@/hooks/useImageUpload';
import { getCurrencyForCountry } from '@/lib/dateUtils';
import { useAuth } from '@/lib/auth';
import { eventPaths } from '@/modules/events/services/navigation';
import { useEventCreateDraftPersistence } from '@/modules/events/hooks/useEventCreateDraftPersistence';

import { getStyles } from '@/modules/events/components/create/styles';
import {
  FormData, ArtistDraft, SponsorDraft, TierDraft,
  defaultForm, ALL_STEPS, STEP_TITLES, STEP_ICONS, getStepSub, EVENT_TYPES,
} from '@/modules/events/components/create/types';
import { StepBasics } from '@/modules/events/components/create/StepBasics';
import { StepPublishing } from '@/modules/events/components/create/StepPublishing';
import { StepImage } from '@/modules/events/components/create/StepImage';
import { StepLocation } from '@/modules/events/components/create/StepLocation';
import { StepDatetime } from '@/modules/events/components/create/StepDatetime';
import { StepEntry } from '@/modules/events/components/create/StepEntry';
import { StepTickets } from '@/modules/events/components/create/StepTickets';
import { StepTeam } from '@/modules/events/components/create/StepTeam';
import { StepCulture } from '@/modules/events/components/create/StepCulture';
import { StepReview } from '@/modules/events/components/create/StepReview';

type Step = typeof ALL_STEPS[number];

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isAustralianDate = (value: string): boolean => /^\d{2}\/\d{2}\/\d{4}$/.test(value);

const toIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isIsoDate(trimmed)) return trimmed;
  if (isAustralianDate(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    return `${year}-${month}-${day}`;
  }
  return null;
};

const asStringParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return value[0] ?? null;
  return null;
};

const API_EVENT_TYPE_TO_FORM: Partial<Record<EventType, FormData['eventType']>> = {
  festival: 'Festival',
  concert: 'Music',
  workshop: 'Talks, Courses & Workshops',
  puja: 'Festival',
  sports: 'Sport & Fitness',
  food: 'Food & Drink',
  cultural: 'Community & Causes',
  community: 'Community & Causes',
  exhibition: 'Exhibitions',
  conference: 'Talks, Courses & Workshops',
  networking: 'Talks, Courses & Workshops',
  nightlife: 'Nightlife',
  family: 'Family',
  film: 'Theatre, Dance & Film',
  theatre: 'Theatre, Dance & Film',
  comedy: 'Theatre, Dance & Film',
  dance: 'Theatre, Dance & Film',
  wellness: 'Sport & Fitness',
  market: 'Shopping, Markets & Fairs',
  tour: 'Tours & Experiences',
  charity: 'Community & Causes',
  religious: 'Community & Causes',
  other: 'other',
};

const FORM_TO_API_EVENT_TYPE: Record<string, EventType> = {
  'kids & youth': 'family',
  family: 'family',
  'children & family': 'family',
  'community & causes': 'community',
  exhibitions: 'exhibition',
  festival: 'festival',
  'food & drink': 'food',
  music: 'concert',
  nightlife: 'nightlife',
  'shopping, markets & fairs': 'market',
  'sport & fitness': 'sports',
  'talks, courses & workshops': 'conference',
  'theatre, dance & film': 'theatre',
  'tours & experiences': 'tour',
  other: 'other',
};

const normalizeFormEventType = (value: unknown): FormData['eventType'] => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const asExisting = EVENT_TYPES.find((t) => t.id === raw)?.id;
  if (asExisting) return asExisting;
  const lowered = raw.toLowerCase();
  if (lowered === 'children & family') return 'Family';
  const fromApi = API_EVENT_TYPE_TO_FORM[lowered as EventType];
  if (fromApi) return fromApi;
  const fromFormLower = EVENT_TYPES.find((t) => String(t.id).toLowerCase() === lowered)?.id;
  if (fromFormLower) return fromFormLower;
  return 'other';
};

const toApiEventType = (value: FormData['eventType']): EventType | undefined => {
  if (!value) return undefined;
  const lowered = String(value).toLowerCase();
  const mapped = FORM_TO_API_EVENT_TYPE[lowered];
  if (mapped) return mapped;
  if (lowered === 'community') return 'community';
  if (lowered === 'cultural') return 'cultural';
  if (lowered === 'exhibition') return 'exhibition';
  if (lowered === 'conference') return 'conference';
  if (lowered === 'networking') return 'networking';
  if (lowered === 'nightlife') return 'nightlife';
  if (lowered === 'family') return 'family';
  if (lowered === 'film') return 'film';
  if (lowered === 'theatre') return 'theatre';
  if (lowered === 'comedy') return 'comedy';
  if (lowered === 'dance') return 'dance';
  if (lowered === 'wellness') return 'wellness';
  if (lowered === 'market') return 'market';
  if (lowered === 'tour') return 'tour';
  if (lowered === 'charity') return 'charity';
  if (lowered === 'religious') return 'religious';
  if (lowered === 'festival') return 'festival';
  if (lowered === 'concert') return 'concert';
  if (lowered === 'workshop') return 'workshop';
  if (lowered === 'puja') return 'puja';
  if (lowered === 'sports') return 'sports';
  if (lowered === 'food') return 'food';
  if (lowered === 'other') return 'other';
  return undefined;
};

const buildCultureTagPayload = (form: FormData): string[] => {
  const cx = CULTUREX_EXPLORES_CULTURE_TAG.toLowerCase();
  const ids = form.cultureTagIds.filter((id) => String(id).toLowerCase() !== cx);
  return form.cultureXInvite ? [...ids, CULTUREX_EXPLORES_CULTURE_TAG] : ids;
};

const sanitizeUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname.includes('.')) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// Success Screen
// ---------------------------------------------------------------------------
function SuccessScreen({
  event,
  onCreateAnother,
  colors,
}: {
  event: EventData;
  onCreateAnother: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const s = getStyles(colors);
  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out ${event.title} on CulturePass!` });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={[s.successRoot, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.teal + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={s.successIconWrap}>
        <Ionicons name="checkmark-circle" size={80} color={CultureTokens.teal} />
      </View>
      <View style={s.successContent}>
        <Text style={[s.successTitle, { color: colors.text }]}>Published!</Text>
        <Text style={[s.successSub, { color: colors.textSecondary }]}>
          {event.title} is now live and visible in Discover.
        </Text>
        {event.heroImageUrl ? (
          <Image
            source={{ uri: event.heroImageUrl }}
            style={s.successImage}
            contentFit="cover"
            accessibilityLabel="Event hero image"
          />
        ) : null}
      </View>
      <View style={s.successActions}>
        <Button
          variant="primary" size="lg" fullWidth leftIcon="eye-outline"
          style={{ backgroundColor: CultureTokens.teal }}
          onPress={() => router.replace(eventPaths.detail(event.id))}
        >
          View Event
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          fullWidth 
          leftIcon="share-social-outline" 
          onPress={handleShare}
          style={{ borderColor: colors.borderLight }}
        >
          Share Event
        </Button>
        <Button variant="ghost" size="md" fullWidth onPress={onCreateAnother}>
          Create Another Event
        </Button>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateEventScreen() {
  const searchParams = useLocalSearchParams<{
    editId?: string | string[];
    publisherProfileId?: string | string[];
    venueProfileId?: string | string[];
  }>();
  const editId = asStringParam(searchParams.editId);
  const isEditing = !!editId;
  const publisherProfileIdPrefill = asStringParam(searchParams.publisherProfileId);
  const venueProfileIdPrefill = asStringParam(searchParams.venueProfileId);
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { state: onboardingState } = useOnboarding();

  const isDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [form, setForm] = useState<FormData>({
    ...defaultForm,
    city: onboardingState.city || '',
    country: onboardingState.country || 'Australia',
    cultureTagIds: onboardingState.cultureIds?.slice(0, 3) ?? [],
    languageTagIds: onboardingState.languageIds?.slice(0, 2) ?? [],
    accessibilityIds: [],
    publisherProfileId: !isEditing && publisherProfileIdPrefill ? publisherProfileIdPrefill : defaultForm.publisherProfileId,
    venueProfileId: !isEditing && venueProfileIdPrefill ? venueProfileIdPrefill : defaultForm.venueProfileId,
    useLinkedVenue: !isEditing && Boolean(venueProfileIdPrefill?.trim()),
  });

  const [stepIndex, setStepIndex] = useState(0);
  const { uploading: imageUploading } = useImageUpload();
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [publishedEvent, setPublishedEvent] = useState<EventData | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [newArtist, setNewArtist] = useState<ArtistDraft>({ name: '', role: '' });
  const [newSponsor, setNewSponsor] = useState<SponsorDraft>({ name: '', tier: 'gold' });
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState<TierDraft>({ name: '', priceCents: '', capacity: '' });
  const [artistSearch, setArtistSearch] = useState('');
  const [hydratedFromExisting, setHydratedFromExisting] = useState(false);
  const onHydrateDraft = useCallback((parsed: Partial<FormData>) => {
    setForm((prev) => ({
      ...prev,
      ...parsed,
      city: parsed.city ?? prev.city,
      country: parsed.country ?? prev.country,
    }));
  }, []);

  const { isSavingDraft, saveDraft, clearDraft } = useEventCreateDraftPersistence<FormData>({
    form,
    userId,
    isEditing,
    onHydrateDraft,
  });
  const currentStepForQueries = useMemo(
    () => ALL_STEPS.filter((s) => s !== 'tickets' || form.entryType === 'ticketed')[stepIndex],
    [form.entryType, stepIndex],
  );

  const existingEventQuery = useQuery({
    queryKey: ['/api/events', editId],
    queryFn: () => eventsApi.events.get(editId!),
    enabled: isEditing,
    staleTime: 30_000,
  });

  const { data: artistResults } = useQuery({
    queryKey: ['/api/profiles', 'artist', artistSearch],
    queryFn: () => eventsApi.profiles.list(),
    enabled: currentStepForQueries === 'team' && artistSearch.length > 1,
    staleTime: 30_000,
  });

  const visibleSteps = useMemo((): Step[] =>
    ALL_STEPS.filter((s) => s !== 'tickets' || form.entryType === 'ticketed'),
  [form.entryType]);

  const step = visibleSteps[stepIndex];

  const availableCultures = useMemo(() => {
    const nat = onboardingState.nationalityId;
    if (nat) return getCulturesForNationality(nat);
    return ALL_NATIONALITIES.flatMap((n) => getCulturesForNationality(n.id)).slice(0, 30);
  }, [onboardingState.nationalityId]);

  const currency = getCurrencyForCountry(form.country);

  useEffect(() => {
    if (!isEditing || hydratedFromExisting || !existingEventQuery.data) return;
    const event = existingEventQuery.data;
    const entryType = event.entryType ?? (event.isFree ? 'free_open' : 'ticketed');
    const mappedTiers = (event.tiers ?? []).map((tier) => ({
      name: tier.name ?? 'General Admission',
      priceCents: String((tier.priceCents ?? 0) / 100),
      capacity: tier.available != null ? String(tier.available) : '',
    }));

    setForm((prev) => ({
      ...prev,
      title: event.title ?? '',
      description: event.description ?? '',
      eventType: normalizeFormEventType(event.eventType ?? event.category),
      visibility: event.visibility ?? 'public',
      vibe: (event.vibe as FormData['vibe']) ?? '',
      audience: (event.audience as FormData['audience']) ?? '',
      heroImageUrl: event.heroImageUrl ?? event.imageUrl ?? '',
      publisherProfileId: event.publisherProfileId ?? '',
      venue: event.venue ?? '',
      address: event.address ?? '',
      city: event.city ?? prev.city,
      country: event.country ?? prev.country,
      locationType: event.locationType ?? 'physical',
      meetingLink: event.meetingLink ?? '',
      timezone: event.timezone ?? prev.timezone,
      venueProfileId: event.venueProfileId ?? '',
      useLinkedVenue: !!event.venueProfileId,
      date: event.date ?? '',
      endDate: event.endDate ?? '',
      time: event.time ?? '',
      endTime: event.endTime ?? '',
      entryType,
      waitlistEnabled: event.waitlistEnabled ?? false,
      requireApproval: event.requireApproval ?? false,
      guestListVisibility: event.guestListVisibility ?? 'host_only',
      sendReminders: event.sendReminders ?? true,
      reminderAutomationEnabled: event.reminderAutomationEnabled ?? true,
      reminderOffsetsMinutes: event.reminderOffsetsMinutes ?? [1440, 120],
      maxTicketsPerOrder: event.maxTicketsPerOrder != null ? String(event.maxTicketsPerOrder) : '',
      registrationFields: event.registrationFields ?? { name: true, email: true, phone: false, company: false },
      customQuestions: event.customQuestions ?? [],
      isFree: entryType !== 'ticketed',
      priceCents: event.priceCents != null ? String(event.priceCents / 100) : '',
      capacity: event.capacity != null ? String(event.capacity) : '',
      tiers: mappedTiers.length > 0 ? mappedTiers : prev.tiers,
      artists: (event.artists ?? []).map((artist) => ({
        name: artist.name,
        role: artist.role ?? '',
        profileId: artist.profileId,
        imageUrl: artist.imageUrl,
      })),
      sponsors: (event.eventSponsors ?? []).map((sponsor) => ({
        name: sponsor.name,
        tier: sponsor.tier,
        websiteUrl: sponsor.websiteUrl,
        logoUrl: sponsor.logoUrl,
      })),
      hostInfo: {
        name: event.hostInfo?.name ?? event.hostName ?? '',
        contactEmail: event.hostInfo?.contactEmail ?? event.hostEmail ?? '',
        contactPhone: event.hostInfo?.contactPhone ?? event.hostPhone ?? '',
        websiteUrl: sanitizeUrl(event.hostInfo?.websiteUrl ?? '') ?? '',
      },
      cultureTagIds: event.cultureTag ?? [],
      languageTagIds: event.languageTags ?? [],
      accessibilityIds: event.accessibility ?? [],
      cultureTodayPromo: (event.tags ?? []).includes(CULTURE_TODAY_EVENT_TAG),
    }));
    setHydratedFromExisting(true);
  }, [isEditing, hydratedFromExisting, existingEventQuery.data]);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async () => {
      const isTicketed = form.entryType === 'ticketed';
      const startDateIso = toIsoDate(form.date) ?? form.date;
      const endDateIso = toIsoDate(form.endDate);
      const payload: Partial<EventData> = {
        title:       form.title.trim(),
        description: form.description.trim(),
        eventType:   toApiEventType(form.eventType),
        visibility:  form.visibility,
        vibe:        form.vibe.trim() || undefined,
        audience:    form.audience.trim() || undefined,
        category:    form.eventType || undefined,
        venue:       form.venue.trim() || undefined,
        address:     form.address.trim() || undefined,
        city:        form.city.trim(),
        country:     form.country.trim(),
        locationType: form.locationType,
        meetingLink: sanitizeUrl(form.meetingLink) ?? undefined,
        timezone:     form.timezone.trim() || undefined,
        date:        startDateIso,
        endDate:     endDateIso || undefined,
        time:        form.time || undefined,
        endTime:     form.endTime || undefined,
        heroImageUrl: form.heroImageUrl || undefined,
        imageUrl:    form.heroImageUrl || undefined,
        entryType:   form.entryType,
        waitlistEnabled: form.waitlistEnabled,
        requireApproval: form.requireApproval || form.visibility === 'approval_required',
        guestListVisibility: form.guestListVisibility,
        sendReminders: form.sendReminders,
        reminderAutomationEnabled: form.reminderAutomationEnabled,
        reminderOffsetsMinutes: form.reminderOffsetsMinutes,
        maxTicketsPerOrder: form.maxTicketsPerOrder ? parseInt(form.maxTicketsPerOrder, 10) : undefined,
        registrationFields: form.registrationFields,
        customQuestions: form.customQuestions.length > 0 ? form.customQuestions : undefined,
        isFree:      !isTicketed,
        priceCents:  isTicketed && form.tiers.length === 0
          ? Math.round(parseFloat(form.priceCents || '0') * 100)
          : 0,
        capacity:    form.capacity ? parseInt(form.capacity, 10) : undefined,
        tiers:       isTicketed && form.tiers.length > 0
          ? form.tiers.map((t) => ({
              name: t.name,
              priceCents: Math.round(parseFloat(t.priceCents || '0') * 100),
              available: t.capacity ? parseInt(t.capacity, 10) : 999,
            }))
          : undefined,
        cultureTag:  buildCultureTagPayload(form),
        languageTags: form.languageTagIds,
        accessibility: form.accessibilityIds,
        ...(form.cultureTodayPromo ? { tags: [CULTURE_TODAY_EVENT_TAG] } : {}),
        artists: form.artists.length > 0
          ? form.artists.map((a) => ({ name: a.name, role: a.role || undefined, profileId: a.profileId, imageUrl: a.imageUrl } as EventArtist))
          : undefined,
        eventSponsors: form.sponsors.length > 0
          ? form.sponsors.map((sp) => ({
              name: sp.name,
              tier: sp.tier,
              websiteUrl: sanitizeUrl(sp.websiteUrl ?? ''),
              logoUrl: sp.logoUrl,
            } as EventSponsor))
          : undefined,
        hostInfo: form.hostInfo.name ? ({
          name: form.hostInfo.name,
          contactEmail: form.hostInfo.contactEmail || undefined,
          contactPhone: form.hostInfo.contactPhone || undefined,
          websiteUrl: sanitizeUrl(form.hostInfo.websiteUrl ?? ''),
        } as EventHostInfo) : null,
        hostName:  form.hostInfo.name || undefined,
        hostEmail: form.hostInfo.contactEmail || undefined,
        hostPhone: form.hostInfo.contactPhone || undefined,
        ...(form.publisherProfileId.trim()
          ? { publisherProfileId: form.publisherProfileId.trim() }
          : {}),
        ...(form.useLinkedVenue && form.venueProfileId.trim()
          ? { venueProfileId: form.venueProfileId.trim() }
          : {}),
      };
      if (isEditing && editId) {
        const updated = await eventsApi.events.update(editId, payload);
        return updated;
      }

      const draft = await eventsApi.events.create(payload);
      await eventsApi.events.publish(draft.id);
      return draft;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isEditing) {
        router.replace(`/event/${event.id}`);
        return;
      }
      void clearDraft();
      setPublishedEvent(event);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push(eventPaths.login);
        return;
      }
      const message = err instanceof Error ? err.message : 'Please try again.';
      setPublishError(message);
      if (Platform.OS !== 'web') Alert.alert('Could not create event', message);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCultureTag = useCallback((id: string) => {
    haptic();
    setField('cultureTagIds', form.cultureTagIds.includes(id)
      ? form.cultureTagIds.filter((c) => c !== id)
      : [...form.cultureTagIds, id]);
  }, [form.cultureTagIds, setField]);

  const toggleLanguageTag = useCallback((id: string) => {
    haptic();
    setField('languageTagIds', form.languageTagIds.includes(id)
      ? form.languageTagIds.filter((l) => l !== id)
      : [...form.languageTagIds, id]);
  }, [form.languageTagIds, setField]);

  const toggleAccessibilityTag = useCallback((id: string) => {
    haptic();
    setField('accessibilityIds', form.accessibilityIds.includes(id)
      ? form.accessibilityIds.filter((l) => l !== id)
      : [...form.accessibilityIds, id]);
  }, [form.accessibilityIds, setField]);

  const pickImage = useCallback(() => {
    haptic();
    setImagePickerVisible(true);
  }, []);

  const handleImageSelected = useCallback((uri: string) => {
    setImageUploadError(null);
    setField('heroImageUrl', uri);
  }, [setField]);

  const saveDraftLocalAndExit = useCallback(async () => {
    try {
      await saveDraft();
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } finally {
      // handled inside hook
    }
  }, [saveDraft]);

  const addArtist = useCallback(() => {
    if (!newArtist.name.trim()) return;
    setField('artists', [...form.artists, { ...newArtist, name: newArtist.name.trim() }]);
    setNewArtist({ name: '', role: '' });
    setShowArtistForm(false);
    haptic();
  }, [newArtist, form.artists, setField]);

  const removeArtist = useCallback((index: number) => {
    setField('artists', form.artists.filter((_, i) => i !== index));
  }, [form.artists, setField]);

  const addSponsor = useCallback(() => {
    if (!newSponsor.name.trim()) return;
    setField('sponsors', [...form.sponsors, { ...newSponsor, name: newSponsor.name.trim() }]);
    setNewSponsor({ name: '', tier: 'gold' });
    setShowSponsorForm(false);
    haptic();
  }, [newSponsor, form.sponsors, setField]);

  const removeSponsor = useCallback((index: number) => {
    setField('sponsors', form.sponsors.filter((_, i) => i !== index));
  }, [form.sponsors, setField]);

  const addTier = useCallback(() => {
    if (!newTier.name.trim()) return;
    setField('tiers', [...form.tiers, { ...newTier, name: newTier.name.trim() }]);
    setNewTier({ name: '', priceCents: '', capacity: '' });
    setShowAddTier(false);
    haptic();
  }, [newTier, form.tiers, setField]);

  const removeTier = useCallback((index: number) => {
    setField('tiers', form.tiers.filter((_, i) => i !== index));
  }, [form.tiers, setField]);

  const validateStep = useCallback((): string | null => {
    if (step === 'basics') {
      if (!form.title.trim()) return 'Event title is required.';
      if (form.title.trim().length < 5) return 'Title must be at least 5 characters.';
      if (!form.description.trim()) return 'Description is required.';
    }
    if (step === 'location') {
      if (form.locationType !== 'virtual' && !form.city.trim()) return 'City is required for in-person or hybrid events.';
      if ((form.locationType === 'virtual' || form.locationType === 'hybrid') && !sanitizeUrl(form.meetingLink)) {
        return 'A valid meeting link is required for virtual or hybrid events.';
      }
      if (form.useLinkedVenue && !form.venueProfileId.trim()) {
        return 'Select a saved venue profile, or switch to one-off address.';
      }
    }
    if (step === 'datetime') {
      if (!form.date) return 'Date is required.';
      const startDateIso = toIsoDate(form.date);
      if (!startDateIso) return 'Date format must be DD/MM/YYYY.';
      if (form.endDate) {
        const endDateIso = toIsoDate(form.endDate);
        if (!endDateIso) return 'End date format must be DD/MM/YYYY.';
        if (endDateIso < startDateIso) return 'End date cannot be before start date.';
      }
    }
    if (step === 'tickets' && form.tiers.length === 0 && !form.priceCents)
      return 'Add at least one ticket tier or a price.';
    return null;
  }, [step, form]);

  const goNext = useCallback(() => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError(null);
    setPublishError(null);
    if (step === 'review') { createEvent(); return; }
    haptic();
    setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  }, [step, validateStep, createEvent, visibleSteps.length]);

  const goBack = useCallback(() => {
    setStepError(null);
    setPublishError(null);
    if (stepIndex === 0) {
      void saveDraftLocalAndExit();
      return;
    }
    haptic();
    setStepIndex((i) => i - 1);
  }, [stepIndex, saveDraftLocalAndExit]);

  if (isEditing && existingEventQuery.isLoading && !hydratedFromExisting) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
      </View>
    );
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  if (publishedEvent) {
    return (
      <SuccessScreen
        event={publishedEvent}
        onCreateAnother={() => {
          setPublishedEvent(null);
          setForm({
            ...defaultForm,
            city: form.city,
            country: form.country,
            cultureTagIds: onboardingState.cultureIds?.slice(0, 3) ?? [],
            languageTagIds: onboardingState.languageIds?.slice(0, 2) ?? [],
            cultureTodayPromo: false,
          });
          setStepIndex(0);
        }}
        colors={colors}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: topInset + 16 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={s.topCenter}>
          <Text style={[TextStyles.title3, { color: colors.text }]}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            Step {stepIndex + 1} of {visibleSteps.length}
          </Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {/* Step dot indicator */}
      <View style={s.stepDots}>
        {visibleSteps.map((vs, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={vs} style={s.stepDotWrap}>
              <View style={[
                s.stepDot,
                active && { backgroundColor: CultureTokens.indigo, width: 24 },
                done && { backgroundColor: CultureTokens.teal },
                !active && !done && { backgroundColor: colors.borderLight },
              ]}>
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              {i < visibleSteps.length - 1 && (
                <View
                  style={[
                    s.stepDotLine,
                    { backgroundColor: i < stepIndex ? CultureTokens.teal : colors.borderLight },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
        >
          <View
            key={step}
            style={[s.card, isDesktop && s.cardDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {/* Step header */}
            <View style={s.stepHeader}>
              <View style={[s.stepIconWrap, { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo }]}>
                <Ionicons name={STEP_ICONS[step]} size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.title2, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
                <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>{getStepSub(step)}</Text>
              </View>
            </View>

            {/* Step content */}
            {step === 'basics' && (
              <StepBasics form={form} setField={setField} colors={colors} s={s} stepError={stepError} haptic={haptic} />
            )}
            {step === 'publishing' && (
              <StepPublishing form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'image' && (
              <StepImage form={form} setField={setField} colors={colors} s={s} imageUploading={imageUploading} imageUploadError={imageUploadError} pickImage={pickImage} />
            )}
            {step === 'location' && (
              <StepLocation form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'datetime' && (
              <StepDatetime form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'entry' && (
              <StepEntry form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'tickets' && (
              <StepTickets
                form={form} setField={setField} colors={colors} s={s} currency={currency}
                showAddTier={showAddTier} setShowAddTier={setShowAddTier}
                newTier={newTier} setNewTier={setNewTier}
                addTier={addTier} removeTier={removeTier} haptic={haptic}
              />
            )}
            {step === 'team' && (
              <StepTeam
                form={form} setField={setField} colors={colors} s={s}
                showArtistForm={showArtistForm} setShowArtistForm={setShowArtistForm}
                newArtist={newArtist} setNewArtist={setNewArtist}
                artistSearch={artistSearch} setArtistSearch={setArtistSearch}
                artistResults={artistResults}
                addArtist={addArtist} removeArtist={removeArtist}
                showSponsorForm={showSponsorForm} setShowSponsorForm={setShowSponsorForm}
                newSponsor={newSponsor} setNewSponsor={setNewSponsor}
                addSponsor={addSponsor} removeSponsor={removeSponsor}
                haptic={haptic}
              />
            )}
            {step === 'culture' && (
              <StepCulture
                form={form} colors={colors} s={s}
                toggleCultureTag={toggleCultureTag} toggleLanguageTag={toggleLanguageTag}
                toggleAccessibilityTag={toggleAccessibilityTag}
                haptic={haptic}
                initialNationalityId={onboardingState.nationalityId}
                onCultureTodayToggle={() => {
                  haptic();
                  setField('cultureTodayPromo', !form.cultureTodayPromo);
                }}
                onCultureXInviteToggle={() => {
                  haptic();
                  setField('cultureXInvite', !form.cultureXInvite);
                }}
              />
            )}
            {step === 'review' && (
              <StepReview
                form={form} colors={colors} s={s}
                availableCultures={availableCultures}
                publishError={publishError}
              />
            )}

            {/* Inline step error */}
            {stepError ? (
              <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={[s.errorBannerText, { color: colors.error }]}>{stepError}</Text>
              </View>
            ) : null}

            {/* Navigation */}
            <View style={[s.navRow, isDesktop && s.navRowDesktop]}>
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onPress={goBack} style={s.navBack}>Back</Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                onPress={() => { void saveDraftLocalAndExit(); }}
                disabled={isSavingDraft || isPending || imageUploading}
              >
                {isSavingDraft ? 'Saving…' : 'Save Draft & Exit'}
              </Button>
              <Button
                variant="primary" size="lg"
                fullWidth={stepIndex === 0}
                rightIcon={step === 'review' ? undefined : 'arrow-forward'}
                onPress={goNext}
                disabled={isPending || imageUploading}
                style={[s.navNext, { flex: stepIndex > 0 ? 1 : undefined }]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : step === 'review' ? (
                  isEditing ? 'Save Changes' : 'Publish Event'
                ) : step === 'image' ? (
                  form.heroImageUrl ? 'Continue' : 'Skip for Now'
                ) : (
                  'Continue'
                )}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageGalleryPicker
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        currentUri={form.heroImageUrl || null}
        onSelect={handleImageSelected}
        collectionName="events"
        docId={userId ?? `anon-${Date.now()}`}
        fieldName="heroImageUrl"
        skipDbUpdate
      />
    </View>
    </>
  );
}
