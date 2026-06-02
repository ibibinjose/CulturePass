import React, { useMemo, useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
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
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { CultureTokens, TextStyles, M3Typography, Radius, Spacing, FontFamily } from '@/design-system/tokens/theme';
import { M3TopAppBar, M3Card, M3Button, Skeleton, GlassView, PageContainer, CulturePassWordmark } from '@/design-system/ui';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { DraftRecoveryModal } from '@/modules/host/components/DraftRecoveryModal';
import { hostApi } from '@/modules/host/api';
import { canonicalEventPath, canonicalProfilePath } from '@/lib/publicPaths';
import { formatCompactDate } from '@/lib/format';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import type { EventData, Profile, HostApplication, ShopListing } from '@/shared/schema';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';

// Creator Trust: Ongoing verification status visibility in HostSpace dashboard
import { VerificationStatusBanner } from '@/modules/host/components/VerificationStatusBanner';
import { HostItemActionSheet } from '@/modules/host/components/HostItemActionSheet';
import { useHostItemActions } from '@/modules/host/components/useHostItemActions';
import { CreateMenuSheet } from '@/modules/host/components/CreateMenuSheet';
import { UniversalShareSheet } from '@/modules/host/components/UniversalShareSheet';

type HostspaceSummary = {
  events: EventData[];
  profiles: Profile[];
  listings: ShopListing[];
};

// Personalized greeting for hosts
function getHostGreeting(displayName?: string | null) {
  const hour = new Date().getHours();
  const name = displayName?.split(' ')[0] ?? 'Host';
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

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
    listings: [],
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

function ProfileManageCard({ 
  profile, 
  index, 
  isDesktop,
  onActionsPress,
}: { 
  profile: Profile; 
  index: number; 
  isDesktop: boolean;
  onActionsPress?: (profile: Profile) => void;
}) {
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

          {/* Unified Actions Menu (Edit / Share / Analytics / Team / Delete) */}
          {onActionsPress && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onActionsPress(profile);
              }}
              style={styles.actionMenuButton}
              hitSlop={12}
            >
              <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
            </Pressable>
          )}
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

          {/* Creator Trust: Ongoing verification status for published rich profiles (dashboard visibility) */}
          {status === 'published' && (
            <View style={{ marginTop: Spacing.sm }}>
              <VerificationStatusBanner
                status={(profile as any).verificationStatus === 'approved' ? 'approved' : 'not_started'}
                entityType={profile.entityType as any}
                unlocksToday={['Directory visible', 'Free events live']}
                unlocksAfter={['Paid features', 'Marketplace sales']}
                compact
                location="dashboard"
              />
            </View>
          )}
        </View>
      </M3Card>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Event Manage Card
// ---------------------------------------------------------------------------

function EventManageCard({ 
  event, 
  index, 
  isDesktop,
  onActionsPress,
}: { 
  event: EventData; 
  index: number; 
  isDesktop: boolean;
  onActionsPress?: (event: EventData) => void;
}) {
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

          {/* Unified Actions Menu */}
          {onActionsPress && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onActionsPress(event);
              }}
              style={styles.actionMenuButton}
              hitSlop={12}
            >
              <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
            </Pressable>
          )}
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
      <M3Button variant="filled" size="sm" leftIcon="add" onPress={onPress}>
        {action}
      </M3Button>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Card (beautiful, tappable, host-focused)
// ---------------------------------------------------------------------------

function QuickAction({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const m3 = useM3Colors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: m3.onSurface }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Create New Profile CTA
// ---------------------------------------------------------------------------

function CreateProfileCTA() {
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
            <M3Button
              variant="filled"
              size="md"
              leftIcon="add"
              onPress={() => router.push('/hostspace/create' as never)}
              style={styles.createCTAButton}
              accessibilityLabel="Create a new host profile"
            >
              Get Started
            </M3Button>
          )}
        </View>
        {!isDesktop && (
          <M3Button
            variant="filled"
            size="md"
            leftIcon="add"
            onPress={() => router.push('/hostspace/create' as never)}
            style={styles.createCTAButtonMobile}
            accessibilityLabel="Create a new host profile"
          >
            Get Started
          </M3Button>
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
  const { userId, user } = useAuth();
  const { isOrganizer } = useRole();
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Action Sheet state for unified Edit/Share/Analytics/Team/Delete
  const [actionSheetItem, setActionSheetItem] = useState<{
    type: 'profile' | 'event';
    data: Profile | EventData;
  } | null>(null);

  // Fast Create Menu
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Universal Share Sheet state (for Profile + Event + future Listings)
  const [shareItem, setShareItem] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const { getProfileActions, getEventActions } = useHostItemActions();

  // Wrappers that replace the placeholder share behavior with the real UniversalShareSheet
  const getProfileActionsWithShare = (profile: Profile) => {
    const baseActions = getProfileActions(profile);
    return baseActions.map(action => 
      action.key === 'share' 
        ? {
            ...action,
            onPress: () => {
              const url = `${SITE_ORIGIN}/profile/${profile.handle || profile.id}`;
              setShareItem({ title: profile.name, url });
              setActionSheetItem(null); // close action sheet first
            }
          }
        : action
    );
  };

  const getEventActionsWithShare = (event: EventData) => {
    const baseActions = getEventActions(event);
    return baseActions.map(action => 
      action.key === 'share' 
        ? {
            ...action,
            onPress: () => {
              const url = canonicalEventPath(event);
              setShareItem({ title: event.title || 'Event', url });
              setActionSheetItem(null);
            }
          }
        : action
    );
  };

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

  // Host application status (for aspiring + recently approved organizers)
  const { data: myAppData } = useQuery({
    queryKey: ['host-application', 'me'],
    queryFn: () => api.hostApplications.myApplication(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  const myApplication: HostApplication | null = (myAppData as any)?.application ?? null;

  const profiles = useMemo(() => data?.profiles ?? [], [data?.profiles]);
  const events = useMemo(() => data?.events ?? [], [data?.events]);
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
      // Use profileType param for rich profiles (Phase 1 unification)
      const richTypes = ['business', 'venue', 'artist', 'professional', 'organizer', 'community'];
      if (richTypes.includes(draft.entityType)) {
        router.push(`/hostspace/create?profileType=${draft.entityType}&draftId=${draftId}` as never);
      } else {
        router.push(`/hostspace/create?category=${draft.entityType}&draftId=${draftId}` as never);
      }
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
      const richTypes = ['business', 'venue', 'artist', 'professional', 'organizer', 'community'];
      if (richTypes.includes(draft.entityType)) {
        router.push(`/hostspace/create?profileType=${draft.entityType}&draftId=${draft.id}` as never);
      } else {
        router.push(`/hostspace/create?category=${draft.entityType}&draftId=${draft.id}` as never);
      }
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
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { maxWidth: isDesktop ? 1120 : undefined, alignSelf: 'center', width: '100%' },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={CultureTokens.indigo} />
        }
        showsVerticalScrollIndicator={false}
      >
        <PageContainer compact noTopPadding>
        {/* Hero + Personalized Dashboard Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: m3Colors.secondaryContainer }]}>
            <Text style={[styles.badgeText, { color: m3Colors.onSecondaryContainer }]}>HOST WORKSPACE</Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getHostGreeting(user?.displayName)}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>Your Host Command Center</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Create events, manage communities, scan tickets, and grow your cultural impact.
              </Text>
            </View>
            <M3Button
              variant="filled"
              onPress={() => router.push('/hostspace/create' as never)}
              style={styles.createButton}
              accessibilityLabel="Create in HostSpace"
            >
              Create
            </M3Button>
          </View>
        </Animated.View>

        {/* Draft Recovery Banner */}
        {!isLoading && drafts.length > 0 && (
          <DraftRecoveryBanner drafts={drafts} onResume={handleResumeDraft} />
        )}

        {/* Sandbox mode banner for users who haven't applied yet */}
        {!isOrganizer && !myApplication && (
          <View style={{ marginBottom: 16 }}>
            <GlassView
              intensity={25}
              style={[
                styles.statusBanner,
                {
                  borderColor: CultureTokens.violet + '60',
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Ionicons
                  name="shield-half-outline"
                  size={24}
                  color={CultureTokens.violet}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>
                    Welcome to HostSpace (Sandbox Mode)
                  </Text>
                  <Text style={[styles.statusSub, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                    Create profiles, events, and listings as drafts under your name. Apply to become a host to publish them live and sell tickets.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/hostspace/create' as any)}
                    style={({ pressed }) => [
                      styles.bannerCta,
                      { opacity: pressed ? 0.9 : 1, backgroundColor: CultureTokens.indigo, marginTop: 10 }
                    ]}
                  >
                    <Text style={styles.bannerCtaText}>Apply to become a Host</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </GlassView>
          </View>
        )}

        {/* Application Status + Celebration for newly approved hosts */}
        {myApplication && (
          <View style={{ marginBottom: 16 }}>
            <GlassView
              intensity={myApplication.status === 'approved' ? 35 : 20}
              style={[
                styles.statusBanner,
                {
                  borderColor: myApplication.status === 'approved' ? '#10B981' : myApplication.status === 'rejected' ? CultureTokens.coral : CultureTokens.gold,
                  backgroundColor: myApplication.status === 'approved' ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.03)',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Ionicons
                  name={myApplication.status === 'approved' ? 'trophy' : myApplication.status === 'rejected' ? 'close-circle' : 'time'}
                  size={24}
                  color={myApplication.status === 'approved' ? '#10B981' : myApplication.status === 'rejected' ? CultureTokens.coral : CultureTokens.gold}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>
                    {myApplication.status === 'approved' ? '🎉 You are now a Host!' : `Host Request: ${myApplication.status.toUpperCase()}`}
                  </Text>
                  <Text style={[styles.statusSub, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                    {myApplication.status === 'pending' && 'Your host profile request is pending review. We usually respond within 24–48 hours. In the meantime, you can continue creating and editing your drafts in Sandbox Mode.'}
                    {myApplication.status === 'approved' && 'Welcome to the Host community. Your full Host Studio, creation tools, and ticket scanner are unlocked.'}
                    {myApplication.status === 'rejected' && `Your request needs updates: "${myApplication.reviewNote || 'Please update your details and re-submit.'}" You can still build drafts in Sandbox Mode.`}
                  </Text>
                  {myApplication.status === 'rejected' && (
                    <Pressable
                      onPress={() => router.push('/hostspace/create' as any)}
                      style={({ pressed }) => [
                        styles.bannerCta,
                        { opacity: pressed ? 0.9 : 1, backgroundColor: CultureTokens.indigo, marginTop: 10 }
                      ]}
                    >
                      <Text style={styles.bannerCtaText}>Update Application</Text>
                      <Ionicons name="create-outline" size={14} color="#fff" />
                    </Pressable>
                  )}
                </View>
              </View>
            </GlassView>
          </View>
        )}

        {/* Quick Actions — the heart of the delightful Host experience */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitleSmall, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              label="New Event"
              icon="calendar"
              color={CultureTokens.indigo}
              onPress={() => router.push('/hostspace/create/event' as never)}
            />
            <QuickAction
              label="Scan Tickets"
              icon="scan"
              color={CultureTokens.coral}
              onPress={() => router.push('/scanner' as never)}
            />
            <QuickAction
              label="New Community"
              icon="people"
              color={CultureTokens.violet}
              onPress={() => router.push('/hostspace/create?profileType=community' as never)}
            />
            <QuickAction
              label="Create Listing"
              icon="storefront"
              color={CultureTokens.teal}
              onPress={() => router.push('/hostspace/create/listing' as never)}
            />
          </View>
        </View>

        {/* Consolidated Performance Overview (merged stats + insights) */}
        {/* Elevated Host Stats — at-a-glance command center metrics */}
        <View style={styles.statsRow}>
          <StatCard
            label="Published"
            value={events.filter(e => e.status === 'published').length}
            icon="radio-outline"
            color={CultureTokens.indigo}
          />
          <StatCard
            label="Upcoming"
            value={events.filter(e => e.date && new Date(e.date) > new Date()).length}
            icon="calendar-outline"
            color={CultureTokens.teal}
          />
          <StatCard
            label="Total Events"
            value={events.length}
            icon="calendar"
            color={CultureTokens.coral}
          />
          <StatCard
            label="Profiles"
            value={profiles.length}
            icon="grid-outline"
            color={CultureTokens.violet}
          />
        </View>

        {/* Simple Insights — Monitoring brought into the main view (no need to jump to separate dashboard) */}
        <Pressable 
          onPress={() => router.push('/hostspace/dashboard' as never)}
          style={[styles.insightsBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        >
          <View style={styles.insightsContent}>
            <Ionicons name="analytics-outline" size={16} color={CultureTokens.teal} />
            <Text style={[styles.insightsText, { color: colors.text }]}>
              {events.length > 0 
                ? `${events.filter(e => e.status === 'published').length} live • Tap for reach & team activity` 
                : 'View performance insights & team activity'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
          <M3Button
            variant="text"
            onPress={() => router.push('/hostspace/dashboard' as never)}
          >
            View detailed analytics →
          </M3Button>
        </View>

        {/* Communities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Communities you manage</Text>
            <M3Button variant="text" size="sm" leftIcon="add" onPress={() => router.push('/hostspace/create?profileType=community' as never)}>
              Community
            </M3Button>
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : communities.length === 0 ? (
            <EmptyState title="No communities yet." action="Create" onPress={() => setShowCreateMenu(true)} />
          ) : (
            <View style={styles.grid}>
              {communities.map((profile, index) => (
                <ProfileManageCard 
                  key={profile.id} 
                  profile={profile} 
                  index={index} 
                  isDesktop={isDesktop} 
                  onActionsPress={(p) => setActionSheetItem({ type: 'profile', data: p })} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Events you manage</Text>
            {/* Removed duplicate "Event" button — use the main + in top bar instead for unified creation */}
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : events.length === 0 ? (
            <EmptyState title="No events yet." action="Create" onPress={() => setShowCreateMenu(true)} />
          ) : (
            <View style={styles.grid}>
              {events.map((event, index) => (
                <EventManageCard 
                  key={event.id} 
                  event={event} 
                  index={index} 
                  isDesktop={isDesktop} 
                  onActionsPress={(e) => setActionSheetItem({ type: 'event', data: e })} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Listings & Profiles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Listings and profiles</Text>
            {/* Removed duplicate "Listing" button — main + Create button in header is the single entry point */}
          </View>
          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2].map((item) => <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />)}
            </View>
          ) : otherProfiles.length === 0 ? (
            <EmptyState title="No listings or profiles yet." action="Create" onPress={() => setShowCreateMenu(true)} />
          ) : (
            <View style={styles.grid}>
              {otherProfiles.map((profile, index) => (
                <ProfileManageCard 
                  key={profile.id} 
                  profile={profile} 
                  index={index} 
                  isDesktop={isDesktop} 
                  onActionsPress={(p) => setActionSheetItem({ type: 'profile', data: p })} 
                />
              ))}
            </View>
          )}
        </View>
        </PageContainer>
      </ScrollView>

      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        visible={showDraftModal}
        drafts={drafts}
        onSelectDraft={handleSelectDraft}
        onStartFresh={handleStartFresh}
        onDismiss={handleDismissDraftModal}
      />

      {/* Unified Action Sheet for all Host Creations - simplifies Edit/Share/Analytics/Team/Delete */}
      {actionSheetItem && (
        <HostItemActionSheet
          visible={!!actionSheetItem}
          itemType={actionSheetItem.type}
          itemName={
            actionSheetItem.type === 'profile' 
              ? (actionSheetItem.data as Profile).name 
              : (actionSheetItem.data as EventData).title || 'Event'
          }
          onClose={() => setActionSheetItem(null)}
          actions={
            actionSheetItem.type === 'profile'
              ? getProfileActionsWithShare(actionSheetItem.data as Profile)
              : getEventActionsWithShare(actionSheetItem.data as EventData)
          }
        />
      )}

      {/* Fast Create Menu - collapses the old split between wizard and quick content */}
      <CreateMenuSheet 
        visible={showCreateMenu} 
        onClose={() => setShowCreateMenu(false)} 
        availableProfiles={profiles.map(p => ({ id: p.id, name: p.name, entityType: p.entityType }))}
        onCreateUnderProfile={(profileId, type) => {
          setShowCreateMenu(false);
          if (type === 'event') {
            router.push(`/hostspace/create/event?parentProfile=${profileId}` as never);
          } else {
            router.push(`/hostspace/create/listing?parentProfile=${profileId}` as never);
          }
        }}
      />

      {/* Universal Share Sheet - now properly used from ActionSheet (no more placeholder routes) */}
      {shareItem && (
        <UniversalShareSheet
          visible={!!shareItem}
          title={shareItem.title}
          url={shareItem.url}
          onClose={() => setShareItem(null)}
        />
      )}

      {/* Mobile FAB for super fast creation (iOS/Android) */}
      {!isDesktop && (
        <CreateFAB onPress={() => setShowCreateMenu(true)} />
      )}
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

// Mobile-friendly FAB for fast creation (iOS/Android)
function CreateFAB({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: CultureTokens.indigo,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
      }}
      accessibilityLabel="Create new"
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
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
  actionMenuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

  // Application Status Banner (unified host journey)
  statusBanner: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: 14,
    backgroundColor: 'rgba(15,23,42,0.03)',
  },
  statusTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  statusSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },

  // Greeting in hero
  greeting: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    marginBottom: 4,
  },

  // Quick Actions Dashboard Section
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionTitleSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },

  // Lightweight internal navigation for HostSpace (best standard power-user feel)
  hostNavChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  hostChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  hostChipActive: {
    backgroundColor: CultureTokens.indigo,
  },
  hostChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(15,23,42,0.75)',
  },
  hostChipTextActive: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#fff',
  },
  // Stubs for insights bar (referenced in JSX, migration in progress)
  insightsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  insightsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  insightsText: {
    fontSize: 13,
    flex: 1,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerCtaText: {
    color: '#fff',
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
});
