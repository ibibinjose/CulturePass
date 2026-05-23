import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { M3Button, M3Card } from '@/design-system/ui';
import { formatCurrency } from '@/lib/currency';
import { formatEventDateTime, parseEventStartMs } from '@/lib/dateUtils';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { eventsApi, ApiError } from '@/modules/events/api';
import { useAuth } from '@/lib/auth';
import { useContacts } from '@/contexts/ContactsContext';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CultureTokens, M3Typography } from '@/design-system/tokens/theme';
import { getCommunityProfilePathId } from '@/lib/community';
import { EventDetailSkeleton } from '@/modules/events/components/detail/EventDetailSkeleton';
import { EventPageOrchestrator } from '@/modules/events/components/detail/EventPageOrchestrator';
import { EventHero } from '@/modules/events/components/detail/EventHero';
import { PrimaryActionSection } from '@/modules/events/components/detail/PrimaryActionSection';
import { DetailsSection } from '@/modules/events/components/detail/DetailsSection';
import { TicketsSection } from '@/modules/events/components/detail/TicketsSection';
import { HostSection } from '@/modules/events/components/detail/HostSection';
import { DiscoverySection } from '@/modules/events/components/detail/DiscoverySection';
import { SidebarCard } from '@/modules/events/components/detail/SidebarCard';
import { ScreenStateCard } from '@/design-system/ui/ScreenState';
import { getStyles } from '@/modules/events/components/detail/styles';
import {
  cityToCoordinates,
  confirmRemoveRsvp,
  promptRsvpLogin,
  resolveEventOrganizer,
  startCaseLabel,
  toCalendarDate,
} from '@/modules/events/components/detail/utils';
import { useEventTicketing } from '@/modules/events/components/detail/useEventTicketing';
import type { EventData } from '@/shared/schema';
import { canonicalEventPath, siteUrl } from '@/lib/publicPaths';
import { useEventDetailRouteState } from '@/modules/events/hooks/useEventDetailRouteState';
import { eventPaths } from '@/modules/events/services/navigation';
import { captureEvent } from '@/lib/analytics';

const EMPTY_EVENT: EventData = {
  id: '',
  title: '',
  description: '',
  date: '',
  country: '',
  city: '',
};

function normalizeTagList(...groups: (string[] | undefined)[]): string[] {
  const merged = groups.flatMap((group) => group ?? []).filter((value): value is string => Boolean(value));
  return Array.from(new Set(merged.map((item) => item.trim()).filter(Boolean)));
}

function StorySection({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const m3Colors = useM3Colors();
  return (
    <M3Card
      variant="filled"
      style={{
        marginBottom: 20,
        padding: 20,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={[M3Typography.labelSmall, { color: m3Colors.primary, letterSpacing: 1 }]}>{eyebrow.toUpperCase()}</Text>
        <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface, marginTop: 4 }]}>{title}</Text>
        {subtitle ? (
          <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, marginTop: 4 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </M3Card>
  );
}

export default function EventDetailScreen() {
  const { eventId, pathname, topInset, bottomInset } = useEventDetailRouteState();
  const { isDesktop } = useLayout();
  const { userId, user } = useAuth();
  const { contacts } = useContacts();
  const colors = useColors();
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
  const s = getStyles(colors, isDark);
  const queryClient = useQueryClient();
  const { uploading } = useImageUpload();

  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myRsvp, setMyRsvp] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expandedSnapshotCard, setExpandedSnapshotCard] = useState<'when' | 'where' | 'entry' | 'attendance' | null>(null);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.events.get(eventId),
    enabled: eventId.length > 0,
    staleTime: 15000,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const { data: myRsvpData } = useQuery({
    queryKey: ['event', eventId, 'my-rsvp', userId],
    queryFn: () => eventsApi.events.myRsvp(eventId),
    enabled: Boolean(userId && eventId),
    staleTime: 10000,
    refetchInterval: 20000,
  });

  const { data: publisherProfile } = useQuery({
    queryKey: ['profile', event?.publisherProfileId],
    queryFn: () => eventsApi.profiles.get(event!.publisherProfileId!),
    enabled: Boolean(event?.publisherProfileId),
  });

  const { data: similarEvents = [] } = useQuery({
    queryKey: ['event', event?.id, 'similar', event?.city, event?.country],
    enabled: Boolean(event?.id && event?.city),
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const response = await eventsApi.events.list({
        city: event!.city,
        country: event!.country,
        pageSize: 40,
        dateFrom: today,
        includeOngoing: true,
      });
      const nowMs = Date.now();
      return response.events
        .filter((candidate) => candidate.id !== event!.id)
        .sort((a, b) => {
          const aStart = parseEventStartMs(a.date, a.time) ?? Number.POSITIVE_INFINITY;
          const bStart = parseEventStartMs(b.date, b.time) ?? Number.POSITIVE_INFINITY;
          const aFutureBias = aStart >= nowMs ? 0 : 1;
          const bFutureBias = bStart >= nowMs ? 0 : 1;
          if (aFutureBias !== bFutureBias) return aFutureBias - bFutureBias;
          return aStart - bStart;
        })
        .slice(0, 10);
    },
  });

  const { data: relatedCommunities = [] } = useQuery({
    queryKey: ['event', event?.id, 'communities', event?.communityId, event?.city, event?.country],
    enabled: Boolean(event?.id),
    queryFn: async () => {
      if (event?.communityId) {
        try {
          const community = await eventsApi.communities.get(event.communityId);
          return [community];
        } catch {
          return [];
        }
      }
      const communities = await eventsApi.communities.list({ city: event?.city, country: event?.country });
      return communities.slice(0, 8);
    },
  });

  useEffect(() => {
    if (!event) return;
    const eventAsRecord = event as unknown as Record<string, unknown>;
    setSaved(Boolean(eventAsRecord.favorite ?? eventAsRecord.saved));
    setMyRsvp(event.myRsvp ?? null);
    captureEvent('event_detail_viewed', {
      event_id: event.id,
      event_title: event.title,
      city: event.city,
      country: event.country,
      category: event.category ?? null,
      is_free: Boolean(event.isFree || (event.priceCents ?? 0) <= 0),
      entry_type: event.entryType ?? null,
    });
  }, [event]);

  useEffect(() => {
    if (myRsvpData?.status === undefined) return;
    setMyRsvp(myRsvpData.status);
  }, [myRsvpData]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const organizer = useMemo(
    () => (event ? resolveEventOrganizer(event, publisherProfile) : null),
    [event, publisherProfile],
  );
  const hostCommunityPathId = useMemo(() => {
    if (!publisherProfile || publisherProfile.entityType !== 'community') return null;
    return getCommunityProfilePathId(publisherProfile);
  }, [publisherProfile]);
  const displayCategory = startCaseLabel(event?.category) ?? 'Cultural event';
  const displayCommunity = useMemo(() => {
    const first = relatedCommunities[0];
    return first?.name ?? 'Independent community';
  }, [relatedCommunities]);
  const isPlus = user?.subscriptionTier === 'plus' || user?.subscriptionTier === 'elite';
  const isFreeOrOpen = Boolean(
    event &&
      (event.entryType === 'free_open' ||
        event.isFree ||
        (event.priceCents ?? 0) <= 0),
  );

  const countdown = useMemo(() => {
    if (!event?.date) return null;
    const startsAt = toCalendarDate(event.date, event.time);
    if (!startsAt) return null;
    const diff = startsAt.getTime() - nowMs;
    if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0 };
    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return { ended: false, days, hours, minutes };
  }, [event?.date, event?.time, nowMs]);

  const capacityPercent = useMemo(() => {
    if (!event?.capacity || event.capacity <= 0) return 0;
    const percent = Math.round(((event.attending ?? 0) / event.capacity) * 100);
    return Math.max(0, Math.min(100, percent));
  }, [event?.attending, event?.capacity]);

  const cultureTags = normalizeTagList(event?.cultureTags, event?.cultureTag, event?.indigenousTags);
  const languageTags = normalizeTagList(event?.languageTags);
  const accessibilityTags = normalizeTagList(event?.accessibility);
  const artistSummary = (event?.artists ?? []).map((artist) => artist.name).filter(Boolean);
  const sponsorNames = normalizeTagList(
    (event?.eventSponsors ?? []).map((sponsor) => sponsor.name),
    event?.sponsors?.split(',').map((name) => name.trim()),
  );
  const eventTags = normalizeTagList(
    event?.tags,
    event?.category ? [event.category] : [],
    event?.eventType ? [event.eventType] : [],
  );
  const goingCount = Math.max(event?.rsvpGoing ?? 0, event?.attending ?? 0);
  const effectiveMyRsvp = myRsvpData?.status ?? myRsvp;

  const tierPrices = (event?.tiers ?? []).map((tier) => tier.priceCents).filter((price) => Number.isFinite(price));
  const floorTierPrice = tierPrices.length > 0 ? Math.min(...tierPrices) : event?.priceCents ?? 0;
  const ceilingTierPrice = tierPrices.length > 0 ? Math.max(...tierPrices) : event?.priceCents ?? 0;
  const entryLabel = isFreeOrOpen
    ? 'Free / RSVP'
    : floorTierPrice === ceilingTierPrice
      ? formatCurrency(floorTierPrice, event?.country)
      : `${formatCurrency(floorTierPrice, event?.country)} - ${formatCurrency(ceilingTierPrice, event?.country)}`;
  const startsLabel = event ? formatEventDateTime(event.date, event.time, event.country) : '';
  const venuePrimary = event?.venue || event?.city || 'Venue TBC';
  const venueSecondary = event?.address || [event?.city, event?.country].filter(Boolean).join(', ');
  const spotsLeft = event?.capacity ? Math.max(0, event.capacity - (event.attending ?? 0)) : null;
  const circleAttendees = useMemo(() => {
    if (!event?.city) return contacts.slice(0, 3);
    const city = event.city.trim().toLowerCase();
    const matchedCity = contacts.filter((contact) => contact.city?.trim().toLowerCase() === city);
    return (matchedCity.length > 0 ? matchedCity : contacts).slice(0, 3);
  }, [contacts, event?.city]);

  const saveMutation = useMutation({
    mutationFn: (nextSaved: boolean) => eventsApi.events.favorite(eventId, nextSaved),
    onMutate: async (nextSaved: boolean) => {
      setSaved(nextSaved);
      return { previous: !nextSaved };
    },
    onError: () => {
      setSaved((prev) => !prev);
      if (!userId) {
        promptRsvpLogin(pathname);
        return;
      }
      Alert.alert('Could not save event', 'Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'maybe' | 'not_going') => eventsApi.events.rsvp(eventId, status),
    onMutate: (status) => {
      setMyRsvp(status);
    },
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      if (mutationError instanceof ApiError && mutationError.isUnauthorized) {
        promptRsvpLogin(pathname);
        return;
      }
      Alert.alert('Could not update RSVP', 'Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const contactOrganizerMutation = useMutation({
    mutationFn: (message: string) =>
      eventsApi.events.contactOrganizer(eventId, { message, contactMethod: 'in_app' }),
    onSuccess: (result) => {
      if (result?.requestId) {
        router.push(`/enquiries/${encodeURIComponent(result.requestId)}` as any);
        return;
      }
      Alert.alert('Enquiry sent', 'The organiser has been notified and can follow up with you.');
    },
    onError: (mutationError) => {
      if (mutationError instanceof ApiError && mutationError.isUnauthorized) {
        promptRsvpLogin(pathname);
        return;
      }
      Alert.alert('Could not contact organiser', 'Please try again.');
    },
  });

  const handleShare = useCallback(async () => {
    if (!event) return;
    const webOrigin =
      typeof globalThis !== 'undefined' &&
      'location' in globalThis &&
      typeof globalThis.location?.origin === 'string'
        ? globalThis.location.origin
        : 'https://culturepass.app';
    const link = Platform.OS === 'web'
      ? `${webOrigin}/event/${event.id}`
      : `culturepass://event/${event.id}`;
    try {
      await Share.share({
        message: `${event.title} • ${event.city}\n${link}`,
        url: link,
        title: event.title,
      });
      captureEvent('event_shared', {
        event_id: event.id,
        event_title: event.title,
        city: event.city,
      });
    } catch {
      Alert.alert('Share unavailable', 'Try again in a moment.');
    }
  }, [event]);

  const handleSave = useCallback(() => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    const nextSaved = !saved;
    captureEvent('event_save_toggled', {
      event_id: eventId,
      saved: nextSaved,
    });
    saveMutation.mutate(nextSaved);
  }, [pathname, saveMutation, saved, userId, eventId]);

  const handleRsvp = useCallback((status: 'going' | 'maybe' | 'not_going') => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    captureEvent('event_rsvp_submitted', {
      event_id: eventId,
      event_title: event?.title ?? null,
      city: event?.city ?? null,
      rsvp_status: status,
    });
    rsvpMutation.mutate(status);
  }, [pathname, rsvpMutation, userId, eventId, event?.title, event?.city]);

  const handlePrimaryGoingPress = useCallback(() => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    if (effectiveMyRsvp === 'going') {
      confirmRemoveRsvp(() => handleRsvp('not_going'));
      return;
    }
    handleRsvp('going');
  }, [effectiveMyRsvp, handleRsvp, pathname, userId]);

  const openMap = useCallback(() => {
    if (!event) return;
    const locationText = [event.venue, event.address, event.city].filter(Boolean).join(', ');
    const fallbackCoords = cityToCoordinates(event.city);
    const mapQuery = event.lat && event.lng
      ? `${event.lat},${event.lng}`
      : fallbackCoords
        ? `${fallbackCoords.latitude},${fallbackCoords.longitude}`
        : locationText;
    const encoded = encodeURIComponent(mapQuery);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    });
    if (!mapUrl) return;
    Linking.openURL(mapUrl).catch(() => {
      Alert.alert('Unable to open map', 'Please check your map app settings.');
    });
  }, [event]);

  const handleEmailHost = useCallback(() => {
    if (!organizer?.email) return;
    Linking.openURL(`mailto:${organizer.email}?subject=${encodeURIComponent('Event enquiry')}`).catch(() => {
      Alert.alert('Could not open email', 'Please try again.');
    });
  }, [organizer?.email]);

  const handleCallHost = useCallback(() => {
    if (!organizer?.phone) return;
    Linking.openURL(`tel:${organizer.phone}`).catch(() => {
      Alert.alert('Could not place call', 'Please try again.');
    });
  }, [organizer?.phone]);

  const handleVisitWebsite = useCallback(() => {
    if (!organizer?.website) return;
    openExternalUrl(organizer.website, { failureTitle: 'Could not open website' }).then((opened) => {
      if (!opened) {
        Alert.alert('Could not open website', 'Please try again.');
      }
    }).catch(() => {
      Alert.alert('Could not open website', 'Please try again.');
    });
  }, [organizer?.website]);

  const canContactOrganizer = Boolean(event?.organizerId && userId && event.organizerId !== userId);
  const handleContactOrganizer = useCallback(() => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    if (!canContactOrganizer) {
      Alert.alert('Organiser unavailable', 'This event does not have a direct organiser contact flow yet.');
      return;
    }
    const defaultMessage = `Hi, I am interested in "${event?.title ?? 'this event'}". Could you share more details?`;
    contactOrganizerMutation.mutate(defaultMessage);
  }, [canContactOrganizer, contactOrganizerMutation, event?.title, pathname, userId]);

  const eventForTicketing = event ?? EMPTY_EVENT;
  const {
    eventTiers,
    isPurchasing,
    selectedTierIndex,
    setSelectedTierIndex,
    quantity,
    setQuantity,
    buyMode,
    setBuyMode,
    selectedTier,
    minQty,
    maxQty,
    rawTotal,
    discountAmount,
    totalPrice,
    effectiveQty,
    handleExternalTicketPress,
    handlePurchase,
  } = useEventTicketing({
    event: eventForTicketing,
    userId,
    pathname,
    setTicketModalVisible,
  });

  const openTicketModal = useCallback((tierIndex?: number) => {
    if (typeof tierIndex === 'number') {
      setSelectedTierIndex(tierIndex);
    }
    captureEvent('event_get_tickets_tapped', {
      event_id: eventId,
      event_title: event?.title ?? null,
      city: event?.city ?? null,
      tier_index: tierIndex ?? null,
    });
    setTicketModalVisible(true);
  }, [setSelectedTierIndex, eventId, event?.title, event?.city]);

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <View style={[s.emptyContainer, { paddingHorizontal: 20 }]}>
        <ScreenStateCard
          icon="alert-circle-outline"
          title="Event not available"
          message="This event may have been removed or is currently unavailable."
          actionLabel="Back to events"
          onAction={() => router.replace(eventPaths.list)}
          tone="error"
        />
      </View>
    );
  }

  const mainContent = (
    <>
      <EventHero
        event={event}
        heroDisplayUri={event.heroImageUrl ?? event.imageUrl}
        saved={saved}
        isDesktop={isDesktop}
        topInset={topInset}
        handleBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(eventPaths.list);
          }
        }}
        handleShare={handleShare}
        handleSave={handleSave}
      />

      <View style={s.detailShell}>
        <StorySection
          eyebrow="At a glance"
          title="Quick event snapshot"
          subtitle="Tap each tile to expand details, open maps, and check your circle."
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <M3Card
              variant="outlined"
              onPress={() => setExpandedSnapshotCard((current) => (current === 'when' ? null : 'when'))}
              style={{
                width: '48.5%',
                padding: 12,
                borderColor: expandedSnapshotCard === 'when' ? m3Colors.primary : m3Colors.outlineVariant,
              }}
              accessibilityRole="button"
              accessibilityLabel="Event date and time"
              accessibilityHint="Tap to expand full schedule"
            >
              <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>WHEN</Text>
              <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={expandedSnapshotCard === 'when' ? undefined : 1}>
                {startsLabel}
              </Text>
              {expandedSnapshotCard === 'when' ? (
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginTop: 4 }]}>
                  {event.endDate ? `Ends ${formatEventDateTime(event.endDate, event.endTime, event.country)}` : 'Single-session event'}
                </Text>
              ) : null}
            </M3Card>

            <M3Card
              variant="outlined"
              style={{
                width: '48.5%',
                padding: 12,
                borderColor: expandedSnapshotCard === 'where' ? m3Colors.primary : m3Colors.outlineVariant,
              }}
            >
              <Pressable
                onPress={() => setExpandedSnapshotCard((current) => (current === 'where' ? null : 'where'))}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                accessibilityRole="button"
                accessibilityLabel="Event venue and map"
                accessibilityHint="Tap to expand location details"
              >
                <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>WHERE</Text>
                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={expandedSnapshotCard === 'where' ? 2 : 1}>
                  {venuePrimary}
                </Text>
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={expandedSnapshotCard === 'where' ? 3 : 1}>
                  {venueSecondary}
                </Text>
              </Pressable>
              {expandedSnapshotCard === 'where' ? (
                <M3Button
                  variant="text"
                  leftIcon="map-outline"
                  onPress={openMap}
                  style={{ marginTop: 8, paddingHorizontal: 0, alignSelf: 'flex-start' }}
                >
                  Open map
                </M3Button>
              ) : null}
            </M3Card>

            <M3Card
              variant="outlined"
              onPress={() => setExpandedSnapshotCard((current) => (current === 'entry' ? null : 'entry'))}
              style={{
                width: '48.5%',
                padding: 12,
                borderColor: expandedSnapshotCard === 'entry' ? m3Colors.primary : m3Colors.outlineVariant,
              }}
              accessibilityRole="button"
              accessibilityLabel="Entry details"
              accessibilityHint="Tap to expand ticket or RSVP information"
            >
              <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>ENTRY</Text>
              <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={expandedSnapshotCard === 'entry' ? undefined : 1}>
                {entryLabel}
              </Text>
              {expandedSnapshotCard === 'entry' ? (
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginTop: 4 }]}>
                  {isFreeOrOpen ? 'No ticket required. RSVP helps organisers plan capacity.' : 'Tap reserve below to choose tier and quantity.'}
                </Text>
              ) : null}
            </M3Card>

            <M3Card
              variant="outlined"
              style={{
                width: '48.5%',
                padding: 12,
                borderColor: expandedSnapshotCard === 'attendance' ? m3Colors.primary : m3Colors.outlineVariant,
              }}
            >
              <Pressable
                onPress={() => setExpandedSnapshotCard((current) => (current === 'attendance' ? null : 'attendance'))}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                accessibilityRole="button"
                accessibilityLabel="Attendance details and your circle"
                accessibilityHint="Tap to see who in your circle may be attending"
              >
                <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>ATTENDANCE</Text>
                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={expandedSnapshotCard === 'attendance' ? undefined : 1}>
                  {goingCount.toLocaleString()} going
                </Text>
                {spotsLeft !== null ? (
                  <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                    {spotsLeft.toLocaleString()} spots left
                  </Text>
                ) : null}
              </Pressable>
              {expandedSnapshotCard === 'attendance' ? (
                <View style={{ marginTop: 12 }}>
                  {circleAttendees.length > 0 ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {circleAttendees.map((contact, index) => (
                          <View
                            key={`${contact.cpid}-${index}`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: m3Colors.primaryContainer,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: index === 0 ? 0 : -8,
                              borderWidth: 1,
                              borderColor: m3Colors.surface,
                            }}
                          >
                            <Text style={[M3Typography.labelSmall, { color: m3Colors.onPrimaryContainer, fontSize: 10 }]}>
                              {(contact.name?.trim()?.charAt(0) || '?').toUpperCase()}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                        Your circle: {circleAttendees.map((contact) => contact.name.split(' ')[0]).join(', ')}
                      </Text>
                    </>
                  ) : (
                    <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                      Connect contacts to see people you know.
                    </Text>
                  )}
                  <M3Button
                    variant="text"
                    leftIcon="people-outline"
                    onPress={() => router.push(eventPaths.contacts)}
                    style={{ marginTop: 8, paddingHorizontal: 0, alignSelf: 'flex-start' }}
                  >
                    Open circle
                  </M3Button>
                </View>
              ) : null}
            </M3Card>
          </View>

          <PrimaryActionSection
            event={event}
            saved={saved}
            isFreeOrOpen={isFreeOrOpen}
            myRsvp={effectiveMyRsvp}
            userId={userId}
            pathname={pathname}
            rsvpMutation={{ isPending: rsvpMutation.isPending }}
            handlePrimaryGoingPress={handlePrimaryGoingPress}
            handleRsvp={handleRsvp}
            handleExternalTicketPress={handleExternalTicketPress}
            openTicketModal={openTicketModal}
            handleShare={handleShare}
            handleSave={handleSave}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Plan your visit"
          title="Everything you need before you go"
          subtitle="Time, venue, accessibility and attendance insights."
        >
          <DetailsSection
            event={event}
            countdown={countdown}
            capacityPercent={capacityPercent}
            distanceKm={event.distanceKm ?? null}
            cultureTags={cultureTags}
            languageTags={languageTags}
            accessibilityTags={accessibilityTags}
            artistSummary={artistSummary}
            sponsorNames={sponsorNames}
            isPlus={isPlus}
            displayCategory={displayCategory}
            displayCommunity={displayCommunity}
            description={event.description}
            openMap={openMap}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Tickets & host"
          title="Reserve confidently"
          subtitle="Choose your tier and contact the organizer instantly."
        >
          <TicketsSection
            event={event}
            eventTiers={eventTiers ?? []}
            openTicketModal={openTicketModal}
            colors={colors}
            s={s}
          />

          <HostSection
            event={event}
            organizer={organizer ?? resolveEventOrganizer(event)}
            hostCommunityPathId={hostCommunityPathId}
            displayCategory={displayCategory}
            canContactOrganizer={canContactOrganizer}
            contactPending={contactOrganizerMutation.isPending}
            handleContactOrganizer={handleContactOrganizer}
            handleEmailHost={handleEmailHost}
            handleCallHost={handleCallHost}
            handleVisitWebsite={handleVisitWebsite}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Keep exploring"
          title={`More in ${event.city} (City)`}
          subtitle={`Related events and communities from live data in ${event.city}.`}
        >
          <DiscoverySection
            event={event}
            similarEvents={similarEvents}
            relatedCommunities={relatedCommunities}
            colors={colors}
            s={s}
          />
        </StorySection>
      </View>
    </>
  );

  const sidebarContent = (
    <SidebarCard
      event={event}
      organizer={organizer ?? resolveEventOrganizer(event)}
      eventTags={eventTags}
      goingCount={goingCount}
      handleEmailHost={handleEmailHost}
      handleCallHost={handleCallHost}
      handleVisitWebsite={handleVisitWebsite}
      colors={colors}
    />
  );

  const publicPath = canonicalEventPath(event);
  const pageUrl = siteUrl(publicPath);
  const desc =
    event.description && event.description.length > 0
      ? event.description.slice(0, 280).replace(/\s+/g, ' ').trim()
      : `${event.title} · ${startsLabel} · ${venuePrimary}`;

  return (
    <>
      <Head>
        <title>{`${event.title} | CulturePass`}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={`${event.title} | CulturePass`} />
        <meta property="og:description" content={desc} />
        {(event.heroImageUrl || event.imageUrl) ? (
          <meta property="og:image" content={(event.heroImageUrl || event.imageUrl) as string} />
        ) : null}
        <meta property="og:url" content={pageUrl} />
        <link rel="canonical" href={pageUrl} />
      </Head>
      <View style={s.container}>
      <EventPageOrchestrator
        isDesktop={isDesktop}
        bottomInset={bottomInset}
        mainContent={mainContent}
        sidebarContent={sidebarContent}
        s={s}
      />

      <Modal
        visible={ticketModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <View style={s.modalOverlay}>
            <M3Card variant="filled" style={[s.modalSheet, { backgroundColor: m3Colors.surface }]}>
            <View style={[s.modalHandle, { backgroundColor: m3Colors.outlineVariant }]} />
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, M3Typography.titleLarge, { color: m3Colors.onSurface }]}>Reserve your spot</Text>
              <Pressable
                onPress={() => setTicketModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close ticket selector"
              >
                <Ionicons name="close" size={24} color={m3Colors.onSurface} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomInset + 24 }}
              showsVerticalScrollIndicator={false}
            >
              {isFreeOrOpen ? null : (
                <>
                  <Text style={[s.modalGroupLabel, M3Typography.labelLarge, { color: m3Colors.onSurfaceVariant }]}>Purchase mode</Text>
                  <View style={s.buyModeRow}>
                    {[
                      { key: 'single', label: 'Single', icon: 'person-outline' },
                      { key: 'family', label: 'Family', icon: 'people-outline' },
                      { key: 'group', label: 'Group', icon: 'people-circle-outline' },
                    ].map((modeOption) => {
                      const active = buyMode === modeOption.key;
                      return (
                        <Pressable
                          key={modeOption.key}
                          onPress={() => setBuyMode(modeOption.key as 'single' | 'family' | 'group')}
                          style={[
                            s.buyModeBtn,
                            {
                              borderColor: active ? m3Colors.primary : m3Colors.outlineVariant,
                              backgroundColor: active ? m3Colors.primaryContainer : m3Colors.surfaceContainerLow,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Choose ${modeOption.label} purchase mode`}
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons
                            name={modeOption.icon as keyof typeof Ionicons.glyphMap}
                            size={16}
                            color={active ? m3Colors.onPrimaryContainer : m3Colors.onSurfaceVariant}
                          />
                          <Text style={[s.buyModeText, M3Typography.labelLarge, { color: active ? m3Colors.onPrimaryContainer : m3Colors.onSurfaceVariant }]}>
                            {modeOption.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[s.modalGroupLabel, M3Typography.labelLarge, { color: m3Colors.onSurfaceVariant }]}>Select tier</Text>
              {(eventTiers?.length ? eventTiers : [{ name: 'General Admission', priceCents: 0, available: 999 }]).map((tier, index) => {
                const active = selectedTierIndex === index;
                return (
                  <M3Card
                    key={`${tier.name}-${index}`}
                    variant={active ? 'filled' : 'outlined'}
                    onPress={() => setSelectedTierIndex(index)}
                    style={[
                        s.modalTierCard,
                        {
                            borderColor: active ? 'transparent' : m3Colors.outlineVariant,
                            backgroundColor: active ? m3Colors.secondaryContainer : 'transparent',
                            marginBottom: 12,
                        }
                    ]}
                  >
                    <View style={s.modalTierLeft}>
                      <View style={[s.radioOuter, { borderColor: active ? m3Colors.primary : m3Colors.outlineVariant }]}>
                        {active ? <View style={[s.radioInner, { backgroundColor: m3Colors.primary }]} /> : null}
                      </View>
                      <View>
                        <Text style={[s.modalTierName, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{tier.name}</Text>
                        <Text style={[s.modalTierAvail, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>{Math.max(tier.available, 0)} available</Text>
                      </View>
                    </View>
                    <Text style={[s.modalTierPrice, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                      {tier.priceCents === 0 ? 'Free' : formatCurrency(tier.priceCents, event.country)}
                    </Text>
                  </M3Card>
                );
              })}

              <Text style={[s.modalGroupLabel, M3Typography.labelLarge, { color: m3Colors.onSurfaceVariant, marginTop: 8 }]}>Quantity</Text>
              <View style={s.quantityRow}>
                <Pressable
                  onPress={() => setQuantity((current) => Math.max(minQty, current - 1))}
                  style={[s.quantityBtn, { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: m3Colors.outlineVariant, borderRadius: 12 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease ticket quantity"
                >
                  <Ionicons name="remove" size={24} color={m3Colors.onSurface} />
                </Pressable>
                <Text style={[s.quantityNum, M3Typography.headlineSmall, { color: m3Colors.onSurface }]}>{buyMode === 'family' ? 4 : quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((current) => Math.min(maxQty, current + 1))}
                  style={[s.quantityBtn, { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: m3Colors.outlineVariant, borderRadius: 12 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Increase ticket quantity"
                >
                  <Ionicons name="add" size={24} color={m3Colors.onSurface} />
                </Pressable>
              </View>

              <M3Card variant="filled" style={[s.priceSummaryBox, { backgroundColor: m3Colors.surfaceContainerHighest, padding: 20, marginBottom: 24, borderRadius: 16 }]}>
                <View style={s.pRow}>
                  <Text style={[s.pRowLabel, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Tier</Text>
                  <Text style={[s.pRowVal, M3Typography.bodyLarge, { color: m3Colors.onSurface }]}>{selectedTier?.name ?? 'General Admission'}</Text>
                </View>
                <View style={s.pRow}>
                  <Text style={[s.pRowLabel, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Tickets</Text>
                  <Text style={[s.pRowVal, M3Typography.bodyLarge, { color: m3Colors.onSurface }]}>{effectiveQty}</Text>
                </View>
                <View style={s.pRow}>
                  <Text style={[s.pRowLabel, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Subtotal</Text>
                  <Text style={[s.pRowVal, M3Typography.bodyLarge, { color: m3Colors.onSurface }]}>{formatCurrency(rawTotal, event.country)}</Text>
                </View>
                {discountAmount > 0 ? (
                  <View style={s.pRow}>
                    <Text style={[s.pRowLabel, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Discount</Text>
                    <Text style={[s.pRowVal, M3Typography.bodyLarge, { color: m3Colors.tertiary }]}>- {formatCurrency(discountAmount, event.country)}</Text>
                  </View>
                ) : null}
                <View style={[s.pDiv, { backgroundColor: m3Colors.outlineVariant, marginVertical: 12 }]} />
                <View style={s.pRow}>
                  <Text style={[s.pTotalLabel, M3Typography.titleLarge, { color: m3Colors.onSurface }]}>Total</Text>
                  <Text style={[s.pTotalVal, M3Typography.titleLarge, { color: m3Colors.primary }]}>{formatCurrency(totalPrice, event.country)}</Text>
                </View>
              </M3Card>

              <M3Button
                variant="filled"
                fullWidth
                onPress={handlePurchase}
                loading={isPurchasing}
                leftIcon={totalPrice > 0 ? 'card-outline' : 'checkmark-circle-outline'}
              >
                {totalPrice > 0 ? 'Continue to payment' : 'Confirm reservation'}
              </M3Button>
            </ScrollView>
          </M3Card>
        </View>
      </Modal>

      {uploading ? (
        <View style={{ position: 'absolute', top: topInset + 12, right: 16 }}>
          <ActivityIndicator size="small" color={CultureTokens.gold} />
        </View>
      ) : null}
    </View>
    </>
  );
}
