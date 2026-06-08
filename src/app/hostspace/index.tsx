import React, { useMemo, useCallback, useState, Suspense } from 'react';
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

import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { M3TopAppBar, Skeleton, GlassView, PageContainer, LuxeText, LuxeButton, LuxeCard } from '@/design-system/ui';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { hostApi } from '@/modules/host/api';
import { canonicalEventPath, canonicalProfilePath } from '@/lib/publicPaths';
import { formatCompactDate } from '@/lib/format';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import type { EventData, Profile, HostApplication, ShopListing, HostPage } from '@/shared/schema';
import {
  HostspaceManageTabs,
  HostspaceManageTabHint,
  filterHostspaceManageItems,
  type HostspaceManageTab,
} from '@/modules/host/components/HostspaceManageTabs';
import { CultureFlagBadge } from '@/components/culture/CultureFlagBadge';
import {
  resolveEventCultureFlag,
  resolveHostPageCultureFlag,
  resolveProfileCultureFlag,
} from '@/lib/cultureIdentity';
import {
  navigateToCreateById,
  navigateToCreationLab,
  navigateToEditHostPage,
  navigateToEditShopListing,
  navigateToResumeDraft,
} from '@/lib/creationRouting';

// Creator Trust: Ongoing verification status visibility in HostSpace dashboard
import { VerificationStatusBanner } from '@/modules/host/components/VerificationStatusBanner';
import { useHostItemActions } from '@/modules/host/components/useHostItemActions';

// Static imports to resolve bundling issues on Web
import { DraftRecoveryModal } from '@/modules/host/components/DraftRecoveryModal';
import { HostItemActionSheet } from '@/modules/host/components/HostItemActionSheet';
import { CreateMenuSheet } from '@/modules/host/components/CreateMenuSheet';
import { UniversalShareSheet } from '@/modules/host/components/UniversalShareSheet';

type HostspaceSummary = {
  events: EventData[];
  profiles: Profile[];
  pages: HostPage[];
  shopListings: ShopListing[];
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
  draft: { label: 'DRAFT', color: Luxe.colors.gold },
  published: { label: 'LIVE', color: Luxe.colors.emerald },
  pending_verification: { label: 'PENDING', color: Luxe.colors.indigo },
  suspended: { label: 'SUSPENDED', color: Luxe.colors.terracotta },
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
  const [profiles, pages, shopResult] = await Promise.all([
    hostApi.profiles.my(),
    hostApi.hostPages.my(),
    api.cultureShop.getListings({ mine: true, limit: 48 }),
  ]);
  const eventResponses = await Promise.all([
    hostApi.events.list(userId),
    ...profiles.map((profile) => hostApi.events.listForPublisher(profile.id)),
  ]);

  return {
    profiles,
    pages,
    events: dedupeEvents(eventResponses.flatMap((response) => response.events ?? [])),
    shopListings: shopResult?.listings ?? [],
  };
}

function routeToProfile(profile: Profile) {
  router.push((canonicalProfilePath(profile) ?? `/profile/${profile.id}`) as never);
}

function routeToEvent(event: EventData) {
  router.push(canonicalEventPath(event) as never);
}

function routeToHostPage(page: HostPage) {
  navigateToEditHostPage(page.entityType, page.id, 'hostspace_manage_page_card');
}

function routeToShopListing(listing: ShopListing) {
  navigateToEditShopListing(listing.id, 'hostspace_manage_market_card');
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
    <GlassView intensity={10} style={[styles.statCard, { borderColor: colors.borderLight, borderWidth: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <LuxeText variant="title3" style={{ color: colors.text }}>{value}</LuxeText>
      <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, fontSize: 10 }}>{label}</LuxeText>
    </GlassView>
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
  const cultureFlag = resolveProfileCultureFlag(profile);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <GlassView
        intensity={8}
        onPress={() => routeToProfile(profile)}
        style={[styles.manageCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
        contentStyle={{ padding: 0 }}
      >
        <View style={styles.mediaBox}>
          {profile.coverImageUrl || profile.imageUrl || profile.avatarUrl ? (
            <Image
              source={{ uri: profile.coverImageUrl ?? profile.imageUrl ?? profile.avatarUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name={icon} size={32} color={Luxe.colors.indigo} />
            </View>
          )}

          <GlassView intensity={30} style={[styles.statusPill, { backgroundColor: statusConfig.color + 'CC' }]}>
            <LuxeText variant="badgeCaps" style={{ color: '#fff', fontSize: 9 }}>{statusConfig.label}</LuxeText>
          </GlassView>

          {cultureFlag ? (
            <View style={styles.cultureFlagWrap}>
              <CultureFlagBadge emoji={cultureFlag} size="sm" accessibilityLabel="Profile culture flag" />
            </View>
          ) : null}

          {/* Unified Actions Menu */}
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
          <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={1}>
            {profile.name}
          </LuxeText>
          <LuxeText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {[profile.category ?? profile.entityType, profile.city, profile.country].filter(Boolean).join(' · ')}
          </LuxeText>
          <View style={styles.metricRow}>
            <View style={styles.miniMetric}>
              <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
              <LuxeText variant="caption" style={{ color: colors.textTertiary }}>{profile.membersCount ?? profile.followersCount ?? 0}</LuxeText>
            </View>
            <View style={styles.miniMetric}>
              <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
              <LuxeText variant="caption" style={{ color: colors.textTertiary }}>{profile.eventsCount ?? 0}</LuxeText>
            </View>
          </View>

          {status === 'published' && (
            <View style={{ marginTop: 8 }}>
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
      </GlassView>
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
  const cultureFlag = resolveEventCultureFlag(event);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <GlassView
        intensity={8}
        onPress={() => routeToEvent(event)}
        style={[styles.manageCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
        contentStyle={{ padding: 0 }}
      >
        <View style={styles.mediaBox}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name="calendar-outline" size={32} color={Luxe.colors.terracotta} />
            </View>
          )}
          <GlassView intensity={30} style={[styles.statusPill, { backgroundColor: (status === 'published' ? Luxe.colors.emerald : Luxe.colors.gold) + 'CC' }]}>
            <LuxeText variant="badgeCaps" style={{ color: '#fff', fontSize: 9 }}>{status === 'published' ? 'LIVE' : 'DRAFT'}</LuxeText>
          </GlassView>

          {cultureFlag ? (
            <View style={styles.cultureFlagWrap}>
              <CultureFlagBadge emoji={cultureFlag} size="sm" accessibilityLabel="Event culture flag" />
            </View>
          ) : null}

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
          <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={1}>
            {event.title}
          </LuxeText>
          <LuxeText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {[event.date ? formatCompactDate(event.date) : 'Unscheduled', event.city, event.country].filter(Boolean).join(' · ')}
          </LuxeText>
          <View style={styles.metricRow}>
            <View style={styles.miniMetric}>
              <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
              <LuxeText variant="caption" style={{ color: colors.textTertiary }}>{event.attending ?? 0}</LuxeText>
            </View>
            <View style={styles.miniMetric}>
              <Ionicons name="cash-outline" size={13} color={colors.textTertiary} />
              <LuxeText variant="caption" style={{ color: colors.textTertiary }}>{event.priceLabel ?? (event.isFree ? 'Free' : 'Paid')}</LuxeText>
            </View>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Host Page Manage Card
// ---------------------------------------------------------------------------

type HostPageStatus = 'draft' | 'published' | 'blocked' | 'archived';

const HOST_PAGE_STATUS_CONFIG: Record<HostPageStatus, { label: string; color: string }> = {
  draft: { label: 'DRAFT', color: Luxe.colors.gold },
  published: { label: 'LIVE', color: Luxe.colors.emerald },
  blocked: { label: 'BLOCKED', color: Luxe.colors.terracotta },
  archived: { label: 'ARCHIVED', color: Luxe.colors.indigo },
};

function PageManageCard({
  page,
  index,
  isDesktop,
}: {
  page: HostPage;
  index: number;
  isDesktop: boolean;
}) {
  const colors = useColors();
  const status = (page.status ?? 'draft') as HostPageStatus;
  const statusConfig = HOST_PAGE_STATUS_CONFIG[status] ?? HOST_PAGE_STATUS_CONFIG.draft;
  const cultureFlag = resolveHostPageCultureFlag(page.formData);
  const icon = PROFILE_ICON[page.entityType] ?? 'document-text-outline';
  const imageUrl = page.formData.coverUrl ?? page.formData.logoUrl;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <GlassView
        intensity={8}
        onPress={() => routeToHostPage(page)}
        style={[styles.manageCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
        contentStyle={{ padding: 0 }}
      >
        <View style={styles.mediaBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name={icon} size={32} color={Luxe.colors.indigo} />
            </View>
          )}
          <GlassView intensity={30} style={[styles.statusPill, { backgroundColor: statusConfig.color + 'CC' }]}>
            <LuxeText variant="badgeCaps" style={{ color: '#fff', fontSize: 9 }}>{statusConfig.label}</LuxeText>
          </GlassView>
          {cultureFlag ? (
            <View style={styles.cultureFlagWrap}>
              <CultureFlagBadge emoji={cultureFlag} size="sm" accessibilityLabel="Page culture flag" />
            </View>
          ) : null}
        </View>
        <View style={styles.manageBody}>
          <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={1}>
            {page.formData.name}
          </LuxeText>
          <LuxeText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {[page.entityType, page.handle ? `@${page.handle}` : null].filter(Boolean).join(' · ')}
          </LuxeText>
        </View>
      </GlassView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// CultureMarket Listing Manage Card
// ---------------------------------------------------------------------------

function ShopListingManageCard({
  listing,
  index,
  isDesktop,
}: {
  listing: ShopListing;
  index: number;
  isDesktop: boolean;
}) {
  const colors = useColors();
  const status = listing.status ?? 'draft';
  const statusColor =
    status === 'active' ? Luxe.colors.emerald : status === 'sold' ? Luxe.colors.indigo : Luxe.colors.gold;
  const typeIcon: keyof typeof Ionicons.glyphMap =
    listing.type === 'service' ? 'construct-outline' : listing.type === 'link' ? 'link-outline' : 'bag-outline';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={isDesktop ? styles.cardWrapDesktop : styles.cardWrap}>
      <GlassView
        intensity={8}
        onPress={() => routeToShopListing(listing)}
        style={[styles.manageCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
        contentStyle={{ padding: 0 }}
      >
        <View style={styles.mediaBox}>
          {listing.imageUrl ? (
            <Image source={{ uri: listing.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name={typeIcon} size={32} color={Luxe.colors.emerald} />
            </View>
          )}
          <GlassView intensity={30} style={[styles.statusPill, { backgroundColor: statusColor + 'CC' }]}>
            <LuxeText variant="badgeCaps" style={{ color: '#fff', fontSize: 9 }}>{status.toUpperCase()}</LuxeText>
          </GlassView>
        </View>
        <View style={styles.manageBody}>
          <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={1}>
            {listing.title}
          </LuxeText>
          <LuxeText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {[
              listing.type,
              listing.isFree
                ? 'Free'
                : listing.priceCents != null
                  ? `$${(listing.priceCents / 100).toFixed(2)}`
                  : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </LuxeText>
        </View>
      </GlassView>
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
  drafts: any[];
  onResume: () => void;
}) {
  const colors = useColors();
  if (drafts.length === 0) return null;

  const latestDraft = drafts[0];
  const entityLabel = latestDraft.entityType.charAt(0).toUpperCase() + latestDraft.entityType.slice(1);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <GlassView
        intensity={20}
        onPress={onResume}
        style={[styles.draftBanner, { borderColor: Luxe.colors.indigo + '33', borderWidth: 1 }]}
        contentStyle={{ padding: 16 }}
      >
        <View style={styles.draftBannerContent}>
          <View style={[styles.draftBannerIcon, { backgroundColor: Luxe.colors.indigo + '18' }]}>
            <Ionicons name="document-text" size={20} color={Luxe.colors.indigo} />
          </View>
          <View style={styles.draftBannerText}>
            <LuxeText variant="bodyMedium" style={{ color: colors.text }}>
              Continue your {entityLabel} profile
            </LuxeText>
            <LuxeText variant="caption" style={{ color: colors.textSecondary }}>
              {drafts.length === 1
                ? 'You have an incomplete draft. Pick up where you left off.'
                : `You have ${drafts.length} incomplete drafts.`}
            </LuxeText>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={Luxe.colors.indigo} />
        </View>
      </GlassView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Card
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

  return (
    <GlassView
      intensity={10}
      onPress={onPress}
      style={[styles.quickActionCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
      contentStyle={{ padding: 16, alignItems: 'flex-start', gap: 12 }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <LuxeText variant="chip" style={{ color: colors.text, fontFamily: FontFamily.semibold }} numberOfLines={2}>
        {label}
      </LuxeText>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

function HostspaceWorkspace() {
  const colors = useColors();
  const isDark = useIsDark();
  const m3Colors = useM3Colors();
  const { hPad, isDesktop, windowSizeClass } = useLayout();
  const { userId, user } = useAuth();
  const { isOrganizer } = useRole();
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [manageTab, setManageTab] = useState<HostspaceManageTab>('all');

  // Action Sheet state
  const [actionSheetItem, setActionSheetItem] = useState<{
    type: 'profile' | 'event';
    data: Profile | EventData;
  } | null>(null);

  // Fast Create Menu
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Universal Share Sheet state
  const [shareItem, setShareItem] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const { getProfileActions, getEventActions } = useHostItemActions({
    onShare: (item) => {
      setShareItem(item);
      setActionSheetItem(null);
    },
  });

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['hostspace', 'workspace', userId],
    queryFn: () => fetchHostspaceSummary(userId!),
    enabled: Boolean(userId),
  });

  const { data: drafts = [] } = useQuery({
    queryKey: ['hostspace', 'drafts', userId],
    queryFn: () => hostApi.profiles.getDrafts(),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const { data: myAppData } = useQuery({
    queryKey: ['host-application', 'me'],
    queryFn: () => api.hostApplications.myApplication(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  const myApplication: HostApplication | null = (myAppData as any)?.application ?? null;

  const profiles = useMemo(() => data?.profiles ?? [], [data?.profiles]);
  const events = useMemo(() => data?.events ?? [], [data?.events]);
  const pages = useMemo(() => data?.pages ?? [], [data?.pages]);
  const shopListings = useMemo(() => data?.shopListings ?? [], [data?.shopListings]);

  const filteredManage = useMemo(
    () =>
      filterHostspaceManageItems({
        tab: manageTab,
        pages,
        events,
        profiles,
        shopListings,
      }),
    [manageTab, pages, events, profiles, shopListings],
  );

  const manageOffers = useMemo(() => {
    if (manageTab !== 'all') return [];
    return profiles.filter((p) => {
      const sub = (p.subCategory ?? p.category ?? '').toLowerCase();
      return sub.includes('offer') || sub.includes('perk') || sub.includes('deal');
    });
  }, [manageTab, profiles]);

  const manageEmptyCopy: Record<HostspaceManageTab, { message: string; action: string; onPress: () => void }> = {
    all: { message: 'Nothing published yet.', action: 'Get started', onPress: () => setShowCreateMenu(true) },
    pages: {
      message: 'No Pages yet.',
      action: 'Create Page',
      onPress: () => navigateToCreationLab('hostspace_empty_pages'),
    },
    events: {
      message: 'No events yet.',
      action: 'Launch event',
      onPress: () => navigateToCreateById('event', { source: 'hostspace_empty_events' }),
    },
    listings: {
      message: 'No directory listings yet.',
      action: 'Add listing',
      onPress: () => navigateToCreationLab('hostspace_empty_listings'),
    },
    offers: {
      message: 'No offers yet.',
      action: 'Create offer',
      onPress: () => navigateToCreateById('offer', { source: 'hostspace_empty_offers' }),
    },
    market: {
      message: 'No CultureMarket listings yet.',
      action: 'List on Market',
      onPress: () => navigateToCreateById('market-product', { source: 'hostspace_empty_market' }),
    },
  };

  const hasFilteredContent =
    filteredManage.pages.length > 0 ||
    filteredManage.events.length > 0 ||
    filteredManage.profiles.length > 0 ||
    filteredManage.shopListings.length > 0 ||
    (filteredManage.communities?.length ?? 0) > 0 ||
    manageOffers.length > 0;

  const handleSelectDraft = useCallback((draftId: string) => {
    setShowDraftModal(false);
    const draft = drafts.find((d) => d.id === draftId);
    if (draft) {
      navigateToResumeDraft({ entityType: draft.entityType, id: draftId }, 'hostspace_draft_modal');
    }
  }, [drafts]);

  const handleStartFresh = useCallback(() => {
    setShowDraftModal(false);
    navigateToCreationLab('hostspace_draft_modal_fresh');
  }, []);

  const handleDismissDraftModal = useCallback(() => {
    setShowDraftModal(false);
  }, []);

  const handleResumeDraft = useCallback(() => {
    if (drafts.length === 1) {
      navigateToResumeDraft(
        { entityType: drafts[0].entityType, id: drafts[0].id },
        'hostspace_draft_banner',
      );
    } else {
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

      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
      />

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
          { icon: 'add-circle-outline', onPress: () => navigateToCreationLab('hostspace_appbar') },
          { icon: 'scan-outline', onPress: () => router.push('/scanner' as never) },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { maxWidth: 1120, alignSelf: 'center', width: '100%' },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Luxe.colors.terracotta} />
        }
        showsVerticalScrollIndicator={false}
      >
        <PageContainer compact noTopPadding>

        {/* Hero */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
          <GlassView intensity={10} style={styles.badge}>
            <LuxeText variant="badgeCaps" style={{ color: Luxe.colors.terracotta }}>HOST WORKSPACE</LuxeText>
          </GlassView>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <LuxeText variant="caption" style={{ color: colors.textSecondary, letterSpacing: 1 }}>
                {getHostGreeting(user?.displayName).toUpperCase()}
              </LuxeText>
              <LuxeText variant="display" style={{ color: colors.text }}>Command Center</LuxeText>
              <LuxeText variant="body" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Create events, manage communities, and grow your cultural impact.
              </LuxeText>
            </View>
            <LuxeButton
              variant="filled"
              onPress={() => navigateToCreationLab('hostspace_hero_create')}
              style={styles.createButton}
              leftIcon="add"
            >
              Create
            </LuxeButton>
          </View>
        </Animated.View>

        {/* Draft Recovery */}
        {!isLoading && drafts.length > 0 && (
          <DraftRecoveryBanner drafts={drafts} onResume={handleResumeDraft} />
        )}

        {/* Sandbox mode banner */}
        {!isOrganizer && !myApplication && (
          <GlassView
            intensity={25}
            style={[styles.statusBanner, { borderColor: Luxe.colors.indigo + '33', borderWidth: 1, marginTop: 16 }]}
            contentStyle={{ padding: 20, flexDirection: 'row', gap: 16 }}
          >
            <View style={[styles.statusIconBox, { backgroundColor: Luxe.colors.indigo + '18' }]}>
              <Ionicons name="shield-half-outline" size={24} color={Luxe.colors.indigo} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <LuxeText variant="bodyMedium" style={{ color: colors.text }}>Sandbox Mode</LuxeText>
              <LuxeText variant="caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                Build your profiles and events as drafts. Apply to become a host to publish them live and sell tickets.
              </LuxeText>
              <LuxeButton
                variant="tonal"
                size="sm"
                onPress={() => router.push('/pages/create' as any)}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
                rightIcon="arrow-forward"
              >
                Apply as Host
              </LuxeButton>
            </View>
          </GlassView>
        )}

        {/* Application Status */}
        {myApplication && (
          <GlassView
            intensity={myApplication.status === 'approved' ? 35 : 20}
            style={[
              styles.statusBanner,
              {
                borderColor: (myApplication.status === 'approved' ? Luxe.colors.emerald : myApplication.status === 'rejected' ? Luxe.colors.terracotta : Luxe.colors.gold) + '33',
                borderWidth: 1,
                marginTop: 16
              },
            ]}
            contentStyle={{ padding: 20, flexDirection: 'row', gap: 16 }}
          >
            <View style={[styles.statusIconBox, { backgroundColor: (myApplication.status === 'approved' ? Luxe.colors.emerald : Luxe.colors.gold) + '18' }]}>
                <Ionicons
                  name={myApplication.status === 'approved' ? 'trophy' : myApplication.status === 'rejected' ? 'close-circle' : 'time'}
                  size={24}
                  color={myApplication.status === 'approved' ? Luxe.colors.emerald : myApplication.status === 'rejected' ? Luxe.colors.terracotta : Luxe.colors.gold}
                />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <LuxeText variant="bodyMedium" style={{ color: colors.text }}>
                {myApplication.status === 'approved' ? '🎉 You are now a Host!' : `Host Request: ${myApplication.status.toUpperCase()}`}
              </LuxeText>
              <LuxeText variant="caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                {myApplication.status === 'pending' && 'Your host request is pending review. We usually respond within 24–48 hours.'}
                {myApplication.status === 'approved' && 'Welcome to the community. Your Host Studio and creation tools are unlocked.'}
                {myApplication.status === 'rejected' && `Needs updates: "${myApplication.reviewNote || 'Please update your details.'}"`}
              </LuxeText>
              {myApplication.status === 'rejected' && (
                <LuxeButton
                  variant="tonal"
                  size="sm"
                  onPress={() => router.push('/pages/create' as any)}
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  leftIcon="create-outline"
                >
                  Update Application
                </LuxeButton>
              )}
            </View>
          </GlassView>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginBottom: 12 }}>QUICK ACTIONS</LuxeText>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              label="New Event"
              icon="calendar"
              color={Luxe.colors.terracotta}
              onPress={() => navigateToCreateById('event', { source: 'hostspace_quick_event' })}
            />
            <QuickAction
              label="Scan Tickets"
              icon="scan"
              color={Luxe.colors.indigo}
              onPress={() => router.push('/scanner' as never)}
            />
            <QuickAction
              label="New Community"
              icon="people"
              color={Luxe.colors.plum}
              onPress={() => navigateToCreateById('community', { source: 'hostspace_quick_community' })}
            />
            <QuickAction
              label="Create Listing"
              icon="storefront"
              color={Luxe.colors.emerald}
              onPress={() => navigateToCreateById('market-product', { source: 'hostspace_quick_market' })}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Published"
            value={events.filter(e => e.status === 'published').length}
            icon="radio-outline"
            color={Luxe.colors.terracotta}
          />
          <StatCard
            label="Upcoming"
            value={events.filter(e => e.date && new Date(e.date) > new Date()).length}
            icon="calendar-outline"
            color={Luxe.colors.emerald}
          />
          <StatCard
            label="Total"
            value={events.length}
            icon="stats-chart-outline"
            color={Luxe.colors.indigo}
          />
          <StatCard
            label="Profiles"
            value={profiles.length}
            icon="grid-outline"
            color={Luxe.colors.plum}
          />
        </View>

        {/* Insights Bar */}
        <GlassView
          intensity={8}
          onPress={() => router.push('/hostspace/dashboard' as never)}
          style={[styles.insightsBar, { borderColor: colors.borderLight, borderWidth: 1 }]}
          contentStyle={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Luxe.colors.emerald + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="analytics" size={16} color={Luxe.colors.emerald} />
            </View>
            <LuxeText variant="bodyMedium" style={{ color: colors.text, flex: 1 }}>
              {events.length > 0 ? 'Tap for reach & performance insights' : 'View your creator analytics'}
            </LuxeText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </GlassView>

        {/* Unified manage — Pages | Events | Listings | Offers | Market */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LuxeText variant="title3" style={{ color: colors.text }}>Manage your culture</LuxeText>
            <LuxeButton variant="ghost" size="sm" leftIcon="add" onPress={() => navigateToCreationLab('hostspace_manage_header')}>
              Create
            </LuxeButton>
          </View>
          <HostspaceManageTabs
            activeTab={manageTab}
            onTabChange={setManageTab}
            colors={{ onSurface: colors.text, onSurfaceVariant: colors.textSecondary }}
          />
          <HostspaceManageTabHint tab={manageTab} />

          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} width={isDesktop ? '31%' : '100%'} height={214} borderRadius={24} />
              ))}
            </View>
          ) : !hasFilteredContent ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                {manageEmptyCopy[manageTab].message}
              </LuxeText>
              <LuxeButton variant="tonal" size="sm" onPress={manageEmptyCopy[manageTab].onPress}>
                {manageEmptyCopy[manageTab].action}
              </LuxeButton>
            </View>
          ) : (
            <View style={styles.manageSections}>
              {filteredManage.pages.length > 0 ? (
                <View style={styles.manageSubsection}>
                  {manageTab === 'all' ? (
                    <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>PAGES</LuxeText>
                  ) : null}
                  <View style={styles.grid}>
                    {filteredManage.pages.map((page, index) => (
                      <PageManageCard key={page.id} page={page} index={index} isDesktop={isDesktop} />
                    ))}
                  </View>
                </View>
              ) : null}

              {filteredManage.events.length > 0 ? (
                <View style={styles.manageSubsection}>
                  {manageTab === 'all' ? (
                    <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>EVENTS</LuxeText>
                  ) : null}
                  <View style={styles.grid}>
                    {filteredManage.events.map((event, index) => (
                      <EventManageCard
                        key={event.id}
                        event={event}
                        index={index}
                        isDesktop={isDesktop}
                        onActionsPress={(e) => setActionSheetItem({ type: 'event', data: e })}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {(filteredManage.communities?.length ?? 0) > 0 ? (
                <View style={styles.manageSubsection}>
                  {manageTab === 'all' ? (
                    <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>COMMUNITIES</LuxeText>
                  ) : null}
                  <View style={styles.grid}>
                    {filteredManage.communities!.map((profile, index) => (
                      <ProfileManageCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        isDesktop={isDesktop}
                        onActionsPress={(p) => setActionSheetItem({ type: 'profile', data: p })}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {filteredManage.profiles.length > 0 ? (
                <View style={styles.manageSubsection}>
                  {manageTab === 'all' || manageTab === 'listings' || manageTab === 'offers' ? (
                    <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>
                      {manageTab === 'offers' ? 'OFFERS' : 'LISTINGS'}
                    </LuxeText>
                  ) : null}
                  <View style={styles.grid}>
                    {filteredManage.profiles.map((profile, index) => (
                      <ProfileManageCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        isDesktop={isDesktop}
                        onActionsPress={(p) => setActionSheetItem({ type: 'profile', data: p })}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {manageOffers.length > 0 ? (
                <View style={styles.manageSubsection}>
                  <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>OFFERS</LuxeText>
                  <View style={styles.grid}>
                    {manageOffers.map((profile, index) => (
                      <ProfileManageCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        isDesktop={isDesktop}
                        onActionsPress={(p) => setActionSheetItem({ type: 'profile', data: p })}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {filteredManage.shopListings.length > 0 ? (
                <View style={styles.manageSubsection}>
                  {manageTab === 'all' ? (
                    <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>CULTUREMARKET</LuxeText>
                  ) : null}
                  <View style={styles.grid}>
                    {filteredManage.shopListings.map((listing, index) => (
                      <ShopListingManageCard key={listing.id} listing={listing} index={index} isDesktop={isDesktop} />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
        </PageContainer>
      </ScrollView>

      {/* Modals & Sheets - Now Statically Imported */}
      <DraftRecoveryModal
        visible={showDraftModal}
        drafts={drafts}
        onSelectDraft={handleSelectDraft}
        onStartFresh={handleStartFresh}
        onDismiss={handleDismissDraftModal}
      />

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
              ? getProfileActions(actionSheetItem.data as Profile)
              : getEventActions(actionSheetItem.data as EventData)
          }
        />
      )}

      <CreateMenuSheet
        visible={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        availableProfiles={profiles.map(p => ({ id: p.id, name: p.name, entityType: p.entityType }))}
        onCreateUnderProfile={(profileId, type) => {
          setShowCreateMenu(false);
          if (type === 'event') {
            navigateToCreateById('event', {
              source: 'hostspace_create_under_profile_event',
              parentProfileId: profileId,
            });
          } else {
            navigateToCreateById('market-product', {
              source: 'hostspace_create_under_profile_market',
              parentProfileId: profileId,
            });
          }
        }}
      />

      {shareItem && (
        <UniversalShareSheet
          visible={!!shareItem}
          title={shareItem.title}
          url={shareItem.url}
          onClose={() => setShareItem(null)}
        />
      )}

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

function CreateFAB({ onPress }: { onPress: () => void }) {
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
        backgroundColor: Luxe.colors.terracotta,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
      }}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingTop: 16,
    paddingBottom: 120,
    gap: 32,
  },
  hero: { gap: 16 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },
  heroCopy: { flex: 1, minWidth: 260 },
  createButton: { minWidth: 140 },

  draftBanner: { borderRadius: 16, overflow: 'hidden' },
  draftBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  draftBannerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  draftBannerText: { flex: 1, gap: 2 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: 150, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  section: { gap: 16 },
  manageSections: { gap: 24 },
  manageSubsection: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cardWrap: { width: '100%' },
  cardWrapDesktop: { width: '31.5%' },
  manageCard: { borderRadius: 20, overflow: 'hidden' },
  mediaBox: { height: 120, backgroundColor: 'rgba(0,0,0,0.03)' },
  mediaFallback: { alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  cultureFlagWrap: { position: 'absolute', top: 10, right: 44, zIndex: 9 },
  actionMenuButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  manageBody: { padding: 16, gap: 6 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 4 },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 32, alignItems: 'center', gap: 16 },

  statusBanner: { borderRadius: 16, overflow: 'hidden' },
  statusIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  quickActionsSection: { marginBottom: 8 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionCard: { flex: 1, minWidth: '47%', borderRadius: 16, borderWidth: 1 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  insightsBar: { borderRadius: 20, overflow: 'hidden', marginTop: 8 },
});
