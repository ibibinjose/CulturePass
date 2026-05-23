import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import Head from 'expo-router/head';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeBack } from '@/lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HomeLogoMark } from '@/modules/core/layout/tabs/TabHeaderChrome';
import { M3Button, M3TopAppBar } from '@/design-system/ui';
import { useAuth } from '@/lib/auth';
import { isAppAdminEmail } from '@/lib/admin';
import {
  useCommunity,
  useCommunityBusinesses,
  useCommunityMembers,
  useCommunityRecommendedEvents,
  useJoinCommunity,
  useJoinedCommunities,
  useLeaveCommunity,
} from '@/modules/communities/hooks/useCommunities';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { LISTING_CREATE_ROUTE } from '@/constants/navigation/experienceNav';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityHeadline,
  getCommunityJoinLabel,
  getCommunityCadenceLabel,
  getCommunityLocationLabel,
  getCommunityMemberCount,
  getCommunityProfilePathId,
  getCommunityTrustSignals,
} from '@/lib/community';
import { ApiError } from '@/modules/communities/api';
import { canonicalCommunityPath, routeCommunityMembers, siteUrl } from '@/lib/publicPaths';
import {
  communityDetailHaptic,
  communityTabQuerySuffix,
  normalizeCommunityId,
  parseCommunityTabParam,
  type CommunityDetailTab,
  type CommunityMemberItem,
} from '@/modules/communities/components/detail/communityDetailUtils';
import { DetailSkeleton, EventRow, SectionCard } from '@/modules/communities/components/detail/CommunityDetailScreen.parts';
import { CommunityDetailHero } from '@/modules/communities/components/detail/CommunityDetailHero';
import { CommunityDetailTabBody } from '@/modules/communities/components/detail/CommunityDetailTabBody';
import {
  COMMUNITY_WEB_SCROLL,
  COMMUNITY_WEB_TOP_CHROME,
  s,
} from '@/modules/communities/components/detail/CommunityDetailScreen.styles';

type Tab = CommunityDetailTab;
type MemberItem = CommunityMemberItem;

const normalizeId = normalizeCommunityId;
const tabQuerySuffix = communityTabQuerySuffix;
const haptic = communityDetailHaptic;

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CommunityDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; tab?: string | string[] }>();
  const pathname = usePathname();
  const id = useMemo(() => normalizeId(params.id), [params.id]);
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, hPad, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomInset = Platform.OS === 'web' ? 28 : insets.bottom;
  const { user } = useAuth();
  const isExpanded = windowSizeClass === 'expanded';

  const tab = useMemo(() => parseCommunityTabParam(params.tab), [params.tab]);
  const setCommunityTab = useCallback((next: Tab) => {
    if (next === tab) return;
    router.setParams({ tab: next === 'about' ? '' : next } as Record<string, string>);
  }, [tab]);
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);
  const [optimisticMemberDelta, setOptimisticMemberDelta] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const handleHeroBack = useSafeBack('/(tabs)');

  const communityQuery = useCommunity(id);
  const community = communityQuery.data;
  const docId = community?.id ?? '';
  const isOwner = !!(user?.id && community?.ownerId && community.ownerId === user.id);
  const isAppAdmin = isAppAdminEmail(user?.email);
  const canManageCommunity = isOwner || isAppAdmin;

  const membersQuery = useCommunityMembers(docId, { enabled: !!docId });
  const eventsQuery = useCommunityRecommendedEvents(docId, { enabled: !!docId });
  const businessesQuery = useCommunityBusinesses(docId, { enabled: !!docId });
  const joinedQuery = useJoinedCommunities();
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  // Canonical redirect on web — fires once when community data arrives or pathname changes.
  // tab is accessed via ref to avoid re-triggering on tab-pill switches (setParams only
  // changes the query string, not the pathname, so the redirect condition never flips).
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (Platform.OS !== 'web' || !community) return;
    const strippedPath = pathname.replace(/\/$/, '').split('?')[0];
    // Only redirect when we're on a top-level community/c path (no sub-segments like /members)
    const isCommunityDetailPath = /^\/(?:community|c)\/[^/]+$/.test(strippedPath);
    if (!isCommunityDetailPath) return;
    const canonical = canonicalCommunityPath(community);
    if (strippedPath !== canonical) {
      router.replace(`${canonical}${tabQuerySuffix(tabRef.current)}` as never);
    }
  }, [community, pathname]);

  const joinedFromServer = !!docId && (joinedQuery.data?.communityIds ?? []).includes(docId);
  const isJoined = optimisticJoined ?? joinedFromServer;

  const accent = useMemo(() => getCommunityAccent(community ?? {}), [community]);
  const activity = community ? getCommunityActivityMeta(community) : null;
  const headline = community ? getCommunityHeadline(community) : '';
  const trustSignals = community ? getCommunityTrustSignals(community) : [];
  const locationLabel = community ? getCommunityLocationLabel(community) : null;
  const joinLabel = community ? getCommunityJoinLabel(community) : null;
  const cadenceLabel = community ? getCommunityCadenceLabel(community) : null;
  const members: MemberItem[] = membersQuery.data?.members ?? [];
  const recommendedEvents = eventsQuery.data ?? [];
  const memberBusinesses = businessesQuery.data?.businesses ?? [];
  const memberCountValue = Math.max(0, getCommunityMemberCount(community ?? {}) + optimisticMemberDelta);
  const heroImage = community?.coverImageUrl || community?.imageUrl;
  const pathId = community ? getCommunityProfilePathId(community) : id;

  // Registry visibility
  const hasFoundingStory = !!(community?.foundedDate || community?.foundedLocation || community?.foundingStory);
  const hasLeadership = (community?.leadership?.length ?? 0) > 0;
  const hasGovernance = !!(community?.legalStatus || community?.registrationNumber || community?.governingStructure);
  const hasPartners = (community?.partners?.length ?? 0) > 0;
  const hasGallery = (community?.gallery?.length ?? 0) > 0;
  const hasLinks = (community?.links?.length ?? 0) > 0;
  const hasRegistry = hasFoundingStory || hasLeadership || hasGovernance || hasPartners || hasGallery || memberBusinesses.length > 0 || hasLinks;

  const handleShare = useCallback(() => {
    haptic();
    if (Platform.OS === 'web' && community) {
      const shareUrl = siteUrl(canonicalCommunityPath(community));
      if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({ title: community.name, url: shareUrl }).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    }
  }, [community]);

  const handleEditCommunity = useCallback(() => {
    if (!community) return;
    haptic();
    router.push({
      pathname: LISTING_CREATE_ROUTE,
      params: { listingEntityType: 'community', editId: community.id },
    } as never);
  }, [community]);

  const handleJoinToggle = useCallback(() => {
    if (!id) return;
    if (!user) { router.push('/(onboarding)/login'); return; }
    haptic();
    if (isJoined) {
      setOptimisticJoined(false);
      setOptimisticMemberDelta((p) => p - 1);
      leaveMutation.mutate(id);
    } else {
      setOptimisticJoined(true);
      setOptimisticMemberDelta((p) => p + 1);
      joinMutation.mutate(id);
    }
  }, [id, user, isJoined, joinMutation, leaveMutation]);

  // ── Error / loading states ────────────────────────────────────────────────

  if (!id.trim()) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="people-circle-outline" size={56} color={colors.textTertiary} />
        <Text style={[s.emptyTitle, { color: colors.text }]}>Community not found</Text>
        <Text style={[s.emptySub, { color: colors.textSecondary }]}>This link is missing a community ID.</Text>
        <M3Button onPress={() => router.replace('/(tabs)/community')} style={s.emptyBtn}>Back to Community Hub</M3Button>
      </View>
    );
  }

  if (communityQuery.isLoading) return <DetailSkeleton />;

  if (!community) {
    const apiErr = communityQuery.error instanceof ApiError ? communityQuery.error : null;
    const isNetwork = apiErr?.status === 0;
    const isServer = apiErr != null && apiErr.status >= 500;
    const title = isNetwork ? "Can't reach CulturePass" : isServer ? 'Something went wrong' : 'Community not found';
    const sub = isNetwork
      ? 'Check your connection and try again.'
      : isServer
        ? 'Could not load this community. Try again.'
        : 'This community may have moved or is no longer available.';
    return (
      <View style={[s.centered, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <Ionicons name={isNetwork ? 'cloud-offline-outline' : 'alert-circle-outline'} size={52} color={colors.textTertiary} />
        <Text style={[s.emptyTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[s.emptySub, { color: colors.textSecondary }]}>{sub}</Text>
        <M3Button onPress={() => communityQuery.refetch()} style={s.emptyBtn}>Try again</M3Button>
        <M3Button onPress={() => router.replace('/(tabs)/community')} style={{ marginTop: 8 }}>Back to Community Hub</M3Button>
      </View>
    );
  }

  // ── SEO ──────────────────────────────────────────────────────────────────

  const pageUrl = siteUrl(canonicalCommunityPath(community));
  const metaDesc = headline || `Join ${community.name} on CulturePass.`;

  const tabContent = (
    <CommunityDetailTabBody
      community={community}
      tab={tab}
      onTabChange={setCommunityTab}
      accent={accent}
      isWeb={isWeb}
      pathId={pathId}
      locationLabel={locationLabel}
      joinLabel={joinLabel}
      cadenceLabel={cadenceLabel}
      trustSignals={trustSignals}
      recommendedEvents={recommendedEvents}
      eventsLoading={eventsQuery.isLoading}
      members={members}
      membersLoading={membersQuery.isLoading}
      memberCountValue={memberCountValue}
      memberBusinesses={memberBusinesses}
      isJoined={isJoined}
      onJoinToggle={handleJoinToggle}
      hasFoundingStory={hasFoundingStory}
      hasLeadership={hasLeadership}
      hasGovernance={hasGovernance}
      hasPartners={hasPartners}
      hasGallery={hasGallery}
      hasLinks={hasLinks}
      hasRegistry={hasRegistry}
    />
  );

  return (
    <ErrorBoundary>
      <Head>
        <title>{`${community.name} | CulturePass Community`}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={`${community.name} | CulturePass`} />
        <meta property="og:description" content={metaDesc} />
        {heroImage ? <meta property="og:image" content={heroImage} /> : null}
        <meta property="og:url" content={pageUrl} />
        <link rel="canonical" href={pageUrl} />
      </Head>

      <View style={[s.root, { backgroundColor: m3Colors.background }]}>
        <View style={COMMUNITY_WEB_TOP_CHROME}>
          <M3TopAppBar
            title={community.name}
            onBack={handleHeroBack}
            variant={isWeb ? 'small' : isExpanded ? 'large' : 'medium'}
            denseWeb={isWeb}
            titleLeading={<HomeLogoMark compact />}
            actions={[
              ...(canManageCommunity
                ? [{ icon: 'create-outline' as const, onPress: handleEditCommunity }]
                : []),
              { icon: 'share-outline', onPress: handleShare },
              {
                icon: 'people-outline',
                onPress: () => {
                  haptic();
                  router.push(routeCommunityMembers({ id: pathId }) as never);
                },
              },
            ]}
          />
        </View>
        <ScrollView
          ref={scrollRef}
          style={COMMUNITY_WEB_SCROLL}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 36 }}
          refreshControl={
            Platform.OS === 'web' ? undefined : (
              <RefreshControl
                refreshing={communityQuery.isRefetching}
                onRefresh={() => {
                  communityQuery.refetch();
                  membersQuery.refetch();
                  eventsQuery.refetch();
                }}
                tintColor={m3Colors.primary}
              />
            )
          }
        >
          <CommunityDetailHero
            community={community}
            heroImage={heroImage}
            accent={accent}
            locationLabel={locationLabel}
            headline={headline}
            memberCountValue={memberCountValue}
            eventCount={recommendedEvents.length}
            activityLabel={activity?.label ?? 'New'}
            activityColor={activity?.color}
            isJoined={isJoined}
            joinPending={joinMutation.isPending || leaveMutation.isPending}
            onJoinToggle={handleJoinToggle}
            isExpanded={isExpanded}
          />

          {/* ── Main content ──────────────────────────────────────────── */}
          <View style={[s.mainShell, s.content, isWeb && s.contentWeb, { paddingHorizontal: isDesktop ? hPad : 16 }]}>
            {isDesktop ? (
              <View style={s.desktopGrid}>
                {/* Left column: about + registry */}
                <View style={s.desktopLeft}>{tabContent}</View>
                {/* Right column: events preview */}
                <View style={s.desktopRight}>
                  {recommendedEvents.length > 0 && (
                    <SectionCard title="Upcoming Events">
                      {recommendedEvents.slice(0, 5).map((event) => (
                        <EventRow key={event.id} event={event} accent={accent} />
                      ))}
                    </SectionCard>
                  )}
                </View>
              </View>
            ) : (
              tabContent
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
