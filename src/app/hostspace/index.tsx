import React, { useMemo, useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, TextStyles, M3Typography, Radius, Spacing } from '@/design-system/tokens/theme';
import { M3TopAppBar, M3Card, Button, Skeleton } from '@/design-system/ui';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { DraftRecoveryModal } from '@/modules/host/components/DraftRecoveryModal';
import { hostApi } from '@/modules/host/api';
import { canonicalEventPath, canonicalProfilePath } from '@/lib/publicPaths';
import { formatCompactDate } from '@/lib/format';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import type { EventData, Profile } from '@/shared/schema';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

type HostspaceSummary = {
  events: EventData[];
  profiles: Profile[];
};

const HOSTSPACE_HEAD_TITLE = `HostSpace · manage your culture · ${APP_NAME}`;
const HOSTSPACE_HEAD_DESC =
  'Manage your CulturePass communities, events, listings, venues, businesses, and creator profiles from HostSpace.';
const HOSTSPACE_HEAD_URL = `${SITE_ORIGIN}/hostspace`;

const PROFILE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  community: 'people-outline',
  business: 'storefront-outline',
  venue: 'location-outline',
  artist: 'mic-outline',
  organizer: 'briefcase-outline',
  organiser: 'briefcase-outline',
  professional: 'person-circle-outline',
  restaurant: 'restaurant-outline',
  brand: 'sparkles-outline',
  creator: 'person-circle-outline',
};

// ---------------------------------------------------------------------------
// Status Badge Config
// ---------------------------------------------------------------------------

type ProfileStatus = 'draft' | 'published' | 'pending_verification' | 'suspended';

const STATUS_CONFIG: Record<ProfileStatus, { label: string; color: string }> = {
  draft: { label: 'DRAFT', color: CultureTokens.gold },
  published: { label: 'LIVE', color: CultureTokens.teal },
  pending_verification: { label: 'PENDING', color: CultureTokens.violet },
  suspended: { label: 'SUSPENDED', color: CultureTokens.coral },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dedupeEvents(events: EventData[]): EventData[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

async function fetchHostspaceSummary(userId: string): Promise<HostspaceSummary> {
  const profiles = await hostApi.profiles.my();
  const eventResponses = await Promise.all([
    hostApi.events.list(userId),
    ...profiles.map((profile) => hostApi.events.listForPublisher(profile.id)),
  ]);

  return {
    profiles,
    events: dedupeEvents(eventResponses.flatMap((response) => response.events ?? [])),
  };
}

function routeToProfile(profile: Profile) {
  router.push((canonicalProfilePath(profile) ?? `/profile/${profile.id}`) as never);
}

function routeToEvent(event: EventData) {
  router.push(canonicalEventPath(event) as never);
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const colors = useColors();
  return (
    <M3Card variant="outlined" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Profile Manage Card (with verification status badge)
// ---------------------------------------------------------------------------

function ProfileManageCard({ profile, index, isDesktop }: { profile: Profile; index: number; isDesktop: boolean }) {
  const colors = useColors();
  const icon = PROFILE_ICON[profile.entityType] ?? 'grid-outline';
  const status = (profile.status ?? 'draft') as ProfileStatus;
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <M3Card
        variant="outlined"
        onPress={() => routeToProfile(profile)}
        style={styles.manageCard}
        accessibilityLabel={`${profile.name}, ${profile.entityType}, status: ${statusConfig.label}`}
        accessibilityRole="button"
      >
        <View style={styles.mediaBox}>
          {profile.coverImageUrl || profile.imageUrl || profile.avatarUrl ? (
            <Image
              source={{ uri: profile.coverImageUrl ?? profile.imageUrl ?? profile.avatarUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`${profile.name} cover image`}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name={icon} size={26} color={CultureTokens.indigo} />
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>
        <View style={styles.manageBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {[profile.category ?? profile.entityType, profile.city, profile.country].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.metricRow}>
            <View style={styles.miniMetric}>
              <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textTertiary }]}>{profile.membersCount ?? profile.followersCount ?? 0}</Text>
            </View>
            <View style={styles.miniMetric}>
              <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textTertiary }]}>{profile.eventsCount ?? 0}</Text>
            </View>
          </View>
        </View>
      </M3Card>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Event Manage Card
// ---------------------------------------------------------------------------

function EventManageCard({ event, index, isDesktop }: { event: EventData; index: number; isDesktop: boolean }) {
  const colors = useColors();
  const status = event.status ?? 'draft';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <M3Card
        variant="outlined"
        onPress={() => routeToEvent(event)}
        style={styles.manageCard}
        accessibilityLabel={`${event.title}, status: ${status === 'published' ? 'live' : 'draft'}`}
        accessibilityRole="button"
      >
        <View style={styles.mediaBox}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name="calendar-outline" size={26} color={CultureTokens.coral} />
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: status === 'published' ? CultureTokens.teal : CultureTokens.gold }]}>
            <Text style={styles.statusText}>{status === 'published' ? 'LIVE' : 'DRAFT'}</Text>
          </View>
        </View>
        <View style={styles.manageBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {[event.date ? formatCompactDate(event.date) : 'Unscheduled', event.city, event.country].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.metricRow}>
            <View style={styles.miniMetric}>
              <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textTertiary }]}>{event.attending ?? 0}</Text>
            </View>
            <View style={styles.miniMetric}>
              <Ionicons name="cash-outline" size={13} color={colors.textTertiary} />
              <Text style={[styles.metricText, { color: colors.textTertiary }]}>{event.priceLabel ?? (event.isFree ? 'Free' : 'Paid')}</Text>
            </View>
          </View>
        </View>
      </M3Card>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Draft Recovery Banner
// ---------------------------------------------------------------------------

function DraftRecoveryBanner({
  drafts,
  onResume,
}: {
  drafts: ProfileDraft[];
  onResume: () => void;
}) {
  const colors = useColors();
  if (drafts.length === 0) return null;

  const latestDraft = drafts[0];
  const entityLabel = latestDraft.entityType.charAt(0).toUpperCase() + latestDraft.entityType.slice(1);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <M3Card
        variant="filled"
        style={[styles.draftBanner, { backgroundColor: CultureTokens.violet + '12' }]}
        onPress={onResume}
        accessibilityLabel={`You have ${drafts.length} incomplete draft${drafts.length > 1 ? 's' : ''}. Tap to continue.`}
        accessibilityRole="button"
      >
        <View style={styles.draftBannerContent}>
          <View style={[styles.draftBannerIcon, { backgroundColor: CultureTokens.violet + '20' }]}>
            <Ionicons name="document-text" size={20} color={CultureTokens.violet} />
          </View>
          <View style={styles.draftBannerText}>
            <Text style={[styles.draftBannerTitle, { color: colors.text }]}>
              Continue your {entityLabel} profile
            </Text>
            <Text style={[styles.draftBannerSubtitle, { color: colors.textSecondary }]}>
              {drafts.length === 1
                ? 'You have an incomplete draft. Pick up where you left off.'
                : `You have ${drafts.length} incomplete drafts.`}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color={CultureTokens.violet} />
        </View>
      </M3Card>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
      <Ionicons name="add-circle-outline" size={30} color={CultureTokens.indigo} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Button variant="primary" size="sm" leftIcon="add" onPress={onPress}>
        {action}
      </Button>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create New Profile CTA
// ---------------------------------------------------------------------------

function CreateProfileCTA() {
  const colors = useColors();
  const { isDesktop } = useLayout();

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <LinearGradient
        colors={[CultureTokens.violet, CultureTokens.coral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.createCTA}
      >
        <View style={styles.createCTAContent}>
          <View style={styles.createCTAIcon}>
            <Ionicons name="add-circle" size={36} color="#FFFFFF" />
          </View>
          <View style={styles.createCTACopy}>
            <Text style={styles.createCTATitle}>Create New Profile</Text>
            <Text style={styles.createCTASubtitle}>
              Launch a community, venue, business, artist, organiser, or professional profile.
            </Text>
          </View>
          {isDesktop && (
            <Button
              variant="primary"
              size="md"
              leftIcon="add"
              onPress={() => router.push('/hostspace/create' as never)}
              style={styles.createCTAButton}
              accessibilityLabel="Create a new host profile"
            >
              Get Started
            </Button>
          )}
        </View>
        {!isDesktop && (
          <Button
            variant="primary"
            size="md"
            leftIcon="add"
            onPress={() => router.push('/hostspace/create' as never)}
            style={styles.createCTAButtonMobile}
            accessibilityLabel="Create a new host profile"
          >
            Get Started
          </Button>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

function HostspaceWorkspace() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { hPad, isDesktop, windowSizeClass } = useLayout();
  const { userId } = useAuth();
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Fetch workspace summary (profiles + events)
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['hostspace', 'workspace', userId],
    queryFn: () => fetchHostspaceSummary(userId!),
    enabled: Boolean(userId),
  });

  // Fetch drafts for recovery prompts
  const { data: drafts = [] } = useQuery({
    queryKey: ['hostspace', 'drafts', userId],
    queryFn: () => hostApi.profiles.getDrafts(),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const profiles = data?.profiles ?? [];
  const events = data?.events ?? [];
  const communities = useMemo(
    () => profiles.filter((profile) => profile.entityType === 'community'),
    [profiles],
  );
  const otherProfiles = useMemo(
    () => profiles.filter((profile) => profile.entityType !== 'community'),
    [profiles],
  );

  const handleSelectDraft = useCallback((draftId: string) => {
    setShowDraftModal(false);
    const draft = drafts.find((d) => d.id === draftId);
    if (draft) {
      router.push(`/hostspace/create?category=${draft.entityType}&draftId=${draftId}` as never);
    }
  }, [drafts]);

  const handleStartFresh = useCallback(() => {
    setShowDraftModal(false);
    router.push('/hostspace/create' as never);
  }, []);

  const handleDismissDraftModal = useCallback(() => {
    setShowDraftModal(false);
  }, []);

  const handleResumeDraft = useCallback(() => {
    if (drafts.length === 1) {
      // Single draft — navigate directly
      const draft = drafts[0];
      router.push(`/hostspace/create?category=${draft.entityType}&draftId=${draft.id}` as never);
    } else {
      // Multiple drafts — show selection modal
      setShowDraftModal(true);
    }
  }, [drafts]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Head>
        <title>{HOSTSPACE_HEAD_TITLE}</title>
        <meta name="description" content={HOSTSPACE_HEAD_DESC} />
        <meta property="og:title" content={HOSTSPACE_HEAD_TITLE} />
        <meta property="og:description" content={HOSTSPACE_HEAD_DESC} />
        <meta property="og:url" content={HOSTSPACE_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={HOSTSPACE_HEAD_URL} />
      </Head>
      <Stack.Screen options={{ title: 'HostSpace | CulturePass', headerShown: false }} />
      <M3TopAppBar
        title="HostSpace"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
        variant={windowSizeClass === 'expanded' ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
        actions={[
          { icon: 'add-circle-outline', onPress: () => router.push('/hostspace/create' as never) },
          { icon: 'scan-outline', onPress: () => router.push('/scanner' as never) },
        ]}
      />
      <LinearGradient
        colors={[CultureTokens.indigo + '10', CultureTokens.teal + '08', colors.background]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: hPad, maxWidth: isDesktop ? 1120 : undefined, alignSelf: 'center', width: '100%' },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={CultureTokens.indigo} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: m3Colors.secondaryContainer }]}>
            <Text style={[styles.badgeText, { color: m3Colors.onSecondaryContainer }]}>HOST WORKSPACE</Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={[styles.title, { color: colors.text }]}>Manage your culture.</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your communities, events, listings, venues, businesses, and creator profiles live here.
              </Text>
            </View>
            <Button
              variant="primary"
              size="md"
              leftIcon="add"
              onPress={() => router.push('/hostspace/create' as never)}
              style={styles.createButton}
              accessibilityLabel="Create in HostSpace"
            >
              Create
            </Button>
          </View>
        </Animated.View>

        {/* Draft Recovery Banner */}
        {!isLoading && drafts.length > 0 && (
          <DraftRecoveryBanner drafts={drafts} onResume={handleResumeDraft} />
        )}

        {/* Create New Profile CTA */}
        <CreateProfileCTA />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Communities" value={communities.length} icon="people-outline" color={CultureTokens.violet} />
          <StatCard label="Events" value={events.length} icon="calendar-outline" color={CultureTokens.coral} />
          <StatCard label="Listings" value={otherProfiles.length} icon="storefront-outline" color={CultureTokens.teal} />
        </View>

        {/* Communities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Communities you manage</Text>
            <Button variant="ghost" size="sm" leftIcon="add" onPress={() => router.push('/hostspace/create/community' as never)}>
              Community
            </Button>
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : communities.length === 0 ? (
            <EmptyState title="No communities yet." action="Create Community" onPress={() => router.push('/hostspace/create/community' as never)} />
          ) : (
            <View style={styles.grid}>
              {communities.map((profile, index) => <ProfileManageCard key={profile.id} profile={profile} index={index} isDesktop={isDesktop} />)}
            </View>
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Events you manage</Text>
            <Button variant="ghost" size="sm" leftIcon="add" onPress={() => router.push('/hostspace/create/event' as never)}>
              Event
            </Button>
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : events.length === 0 ? (
            <EmptyState title="No events yet." action="Create Event" onPress={() => router.push('/hostspace/create/event' as never)} />
          ) : (
            <View style={styles.grid}>
              {events.map((event, index) => <EventManageCard key={event.id} event={event} index={index} isDesktop={isDesktop} />)}
            </View>
          )}
        </View>

        {/* Listings & Profiles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Listings and profiles</Text>
            <Button variant="ghost" size="sm" leftIcon="add" onPress={() => router.push('/hostspace/create' as never)}>
              Listing
            </Button>
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : otherProfiles.length === 0 ? (
            <EmptyState title="No listings or profiles yet." action="Create Listing" onPress={() => router.push('/hostspace/create' as never)} />
          ) : (
            <View style={styles.grid}>
              {otherProfiles.map((profile, index) => <ProfileManageCard key={profile.id} profile={profile} index={index} isDesktop={isDesktop} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        visible={showDraftModal}
        drafts={drafts}
        onSelectDraft={handleSelectDraft}
        onStartFresh={handleStartFresh}
        onDismiss={handleDismissDraftModal}
      />
    </View>
  );
}

export default function HostspaceIndexScreen() {
  return (
    <ErrorBoundary>
      <HostspaceAccessGate intent="hub">
        <HostspaceWorkspace />
      </HostspaceAccessGate>
    </ErrorBoundary>
  );
}


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingTop: 32,
    paddingBottom: 120,
    gap: 28,
  },
  hero: {
    gap: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
  },
  heroCopy: {
    flex: 1,
    minWidth: 260,
    gap: 8,
  },
  title: {
    ...TextStyles.display,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 0,
  },
  subtitle: {
    ...M3Typography.bodyLarge,
    maxWidth: 680,
  },
  createButton: {
    minWidth: Platform.OS === 'web' ? 150 : undefined,
  },
  // Draft Recovery Banner
  draftBanner: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  draftBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  draftBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBannerText: {
    flex: 1,
    gap: 2,
  },
  draftBannerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 20,
  },
  draftBannerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  // Create Profile CTA
  createCTA: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  createCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  createCTAIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCTACopy: {
    flex: 1,
    gap: 4,
  },
  createCTATitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  createCTASubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  createCTAButton: {
    backgroundColor: '#FFFFFF',
    minWidth: 140,
  },
  createCTAButtonMobile: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins_700Bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Sections
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontSize: 20,
    lineHeight: 26,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cardWrap: {
    width: '100%',
  },
  cardWrapDesktop: {
    width: '31.8%',
    minWidth: 260,
  },
  manageCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  mediaBox: {
    height: 112,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  mediaFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  statusPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.7,
  },
  manageBody: {
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins_700Bold',
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  miniMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
