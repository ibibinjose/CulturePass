/**
 * CommunityTabScreen — refactored for a clean social-feed layout.
 *
 * Architecture decisions:
 *   • FlatList replaces the outer ScrollView — feed items are virtualised,
 *     eliminating jank on long activity feeds.
 *   • Segment switcher (Activity | Discover) keeps both use-cases on one tab
 *     without burying discovery under a large hero banner.
 *   • FeedPostCard maps orbit events (joined/followed community events) into a
 *     social-post grammar: avatar → meta → image → text → actions.
 *   • All measurements pull from design tokens; no magic numbers.
 *   • Horizontal community rails live in the Discover segment — nested
 *     nestedScrollEnabled ScrollViews continue to work inside a FlatList.
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { modulesApi } from '@/modules/api';
import {
  communityKeys,
  useCommunities,
  useFollowingCommunityIds,
  useJoinedCommunities,
} from '@/modules/communities/hooks/useCommunities';
import {
  AvatarTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  M3Typography,
  Radius,
  Spacing,
} from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { getCommunityRecommendations } from '@/lib/community-utils';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import { useAuth } from '@/lib/auth';
import { withAlpha } from '@/lib/withAlpha';
import { M3TopAppBar, M3Button, M3FilterChip, M3SectionHeader, M3Card } from '@/design-system/ui';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { M3CommunityCard } from '@/modules/communities/components/M3CommunityCard';
import type { Community, EventData } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const COMMUNITY_CARD_WIDTH = 274;
const EVENT_CARD_WIDTH = 258;
const NO_IDS: string[] = [];
// Approximate height for getItemLayout — an average post with image.
const POST_HEIGHT_ESTIMATE = 340;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommunityCategory = 'all' | 'cultural' | 'business' | 'civic' | 'club';
type Segment = 'feed' | 'discover';

type CommunityWithLooseCategory = Community & {
  communityCategory?: string;
  category?: string;
};

interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorInitial: string;
  accentColor: string;
  timeLabel: string;
  locationLabel: string;
  title: string;
  body?: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  onPress: () => void;
  onShare: () => void;
}

// ---------------------------------------------------------------------------
// Category filter config
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS: {
  id: CommunityCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'all',      label: 'All',      icon: 'apps-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'color-palette-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'civic',    label: 'Civic',    icon: 'business-outline' },
  { id: 'club',     label: 'Clubs',    icon: 'people-outline' },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function communityTabOrbitEventsKey(city: string, country: string, orbitKey: string) {
  return ['community-tab', 'orbit-events', city, country, orbitKey] as const;
}

function normPlace(value: string | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function communityCategory(community: Community): CommunityCategory {
  const raw = String(
    (community as CommunityWithLooseCategory).communityCategory ??
      (community as CommunityWithLooseCategory).category ??
      'cultural',
  ).toLowerCase();

  if (raw === 'business' || raw === 'brand' || raw === 'professional') return 'business';
  if (raw === 'council') return 'civic';
  if (raw === 'club' || raw === 'arts_sports_club') return 'club';
  if (raw === 'local_community' || raw === 'cultural' || raw === 'charity') return 'cultural';

  if (raw.includes('business') || raw.includes('professional') || raw.includes('brand')) return 'business';
  if (raw.includes('council') || raw.includes('civic') || raw.includes('government')) return 'civic';
  if (raw.includes('club') || raw.includes('society') || raw.includes('sport') || raw.includes('arts_sports'))
    return 'club';
  return 'cultural';
}

function communitiesForIds(all: Community[], ids: string[]): Community[] {
  const byId = new Map<string, Community>();
  for (const c of all) {
    byId.set(c.id, c);
    if (c.slug) byId.set(c.slug, c);
  }
  return ids.map((id) => byId.get(id)).filter((c): c is Community => Boolean(c));
}

function uniqueCommunities(list: Community[]) {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function filterByCategory(list: Community[], active: CommunityCategory) {
  if (active === 'all') return list;
  return list.filter((c) => communityCategory(c) === active);
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ---------------------------------------------------------------------------
// StatsBar — page hero + segment switcher + real community counts
// ---------------------------------------------------------------------------

function StatsBar({
  activityCount,
  joined,
  following,
  exploreCount,
  savedCount,
  cityName,
  activeSegment,
  onChangeSegment,
  onCreateHub,
  onPressActivity,
  onPressJoined,
  onPressFollowing,
  hPad,
  isAuthenticated,
}: {
  activityCount: number;
  joined: number;
  following: number;
  exploreCount: number;
  savedCount: number;
  cityName: string;
  activeSegment: Segment;
  onChangeSegment: (s: Segment) => void;
  onCreateHub: () => void;
  onPressActivity: () => void;
  onPressJoined: () => void;
  onPressFollowing: () => void;
  hPad: number;
  isAuthenticated: boolean;
}) {
  const m3Colors = useM3Colors();
  const colors = useColors();
  const { isDesktop } = useLayout();
  const stats = [
    { label: 'Activity', value: activityCount, icon: 'pulse-outline' as const, onPress: onPressActivity },
    { label: 'Joined', value: joined, icon: 'people-outline' as const, onPress: onPressJoined },
    { label: 'Following', value: following, icon: 'heart-outline' as const, onPress: onPressFollowing },
    { label: 'Saved', value: savedCount, icon: 'bookmark-outline' as const, onPress: () => onChangeSegment('discover') },
  ];

  return (
    <View style={[styles.communityOverview, { paddingHorizontal: hPad }]}>
      <LinearGradient
        colors={[withAlpha(CultureTokens.indigo, 0.98), withAlpha(CultureTokens.coral, 0.9)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.communityHero, isDesktop && styles.communityHeroDesktop]}
      >
        <View style={styles.heroCopy}>
          <View style={styles.heroKickerRow}>
            <Ionicons name="sparkles-outline" size={14} color={colors.textInverse} />
            <Text style={[styles.heroKicker, { color: colors.textInverse }]}>Community orbit</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.textInverse }]}>Find your people in {cityName}</Text>
          <Text style={[styles.heroSubtitle, { color: withAlpha(colors.textInverse, 0.86) }]}>
            Follow cultural hubs, join communities, and keep upcoming events in one living feed.
          </Text>
        </View>

        <View style={styles.heroActions}>
          <M3Button
            variant="elevated"
            leftIcon="compass-outline"
            onPress={() => onChangeSegment('discover')}
            accessibilityLabel="Discover communities"
            style={styles.heroActionButton}
          >
            Discover
          </M3Button>
          {isAuthenticated ? (
            <M3Button
              variant="elevated"
              leftIcon="add"
              onPress={onCreateHub}
              accessibilityLabel="Create community hub"
              style={styles.heroActionButton}
            >
              Create hub
            </M3Button>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.overviewRail}
      >
        <View style={[styles.segmentShell, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
          {(['feed', 'discover'] as Segment[]).map((id) => {
            const isActive = activeSegment === id;
            const label = id === 'feed' ? 'Activity' : 'Discover';
            const icon = id === 'feed' ? 'pulse-outline' : 'compass-outline';
            return (
              <Pressable
                key={id}
                onPress={() => onChangeSegment(id)}
                style={[
                  styles.segmentPill,
                  isActive && { backgroundColor: m3Colors.surface, borderColor: m3Colors.primary },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Show ${label.toLowerCase()} communities`}
              >
                <Ionicons
                  name={icon}
                  size={17}
                  color={isActive ? m3Colors.primary : m3Colors.onSurfaceVariant}
                />
                <Text style={[styles.segmentLabel, { color: isActive ? m3Colors.primary : m3Colors.onSurfaceVariant }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {stats.map((stat) => (
          <Pressable
            key={stat.label}
            onPress={stat.onPress}
            style={[
              styles.statTile,
              {
                backgroundColor: m3Colors.surfaceContainerLow,
                borderColor: m3Colors.outlineVariant,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${stat.value} ${stat.label.toLowerCase()}`}
          >
            <View style={[styles.statIcon, { backgroundColor: withAlpha(CultureTokens.indigo, 0.12) }]}>
              <Ionicons name={stat.icon} size={16} color={CultureTokens.indigo} />
            </View>
            <Text style={[styles.statNum, { color: m3Colors.onSurface }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
              {stat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeSegment === 'feed' && (
        <View style={[styles.feedContext, { backgroundColor: withAlpha(CultureTokens.coral, 0.1) }]}>
          <Ionicons name="radio-outline" size={18} color={CultureTokens.coral} />
          <Text style={[styles.feedContextText, { color: colors.text }]}>
            {activityCount > 0
              ? `${activityCount} upcoming update${activityCount === 1 ? '' : 's'} from your joined and followed hubs.`
              : `Follow or join a hub to turn this into your personal community feed.`}
          </Text>
        </View>
      )}

      {activeSegment === 'discover' && (
        <View style={[styles.feedContext, { backgroundColor: withAlpha(CultureTokens.indigo, 0.1) }]}>
          <Ionicons name="location-outline" size={18} color={CultureTokens.indigo} />
          <Text style={[styles.feedContextText, { color: colors.text }]}>
            {exploreCount > 0
              ? `${exploreCount} suggested hub${exploreCount === 1 ? '' : 's'} near ${cityName}.`
              : `Try a different category or search beyond ${cityName}.`}
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CategoryChips — horizontal filter rail for Discover
// ---------------------------------------------------------------------------

function CategoryChips({
  active,
  onChange,
  hPad,
}: {
  active: CommunityCategory;
  onChange: (c: CommunityCategory) => void;
  hPad: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.categoryRail, { paddingHorizontal: hPad, paddingVertical: 12 }]}
    >
      {CATEGORY_FILTERS.map((item) => (
        <M3FilterChip
          key={item.id}
          label={item.label}
          icon={item.icon}
          selected={active === item.id}
          onPress={() => onChange(item.id)}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// FeedPostCard
// ---------------------------------------------------------------------------

function FeedPostCard({ post }: { post: FeedPost }) {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const [liked, setLiked] = useState(false);

  return (
    <M3Card
      variant="elevated"
      onPress={post.onPress}
      style={styles.postCard}
    >
      {/* Header row: avatar + name/location + timestamp */}
      <View style={styles.postHeader}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: m3Colors.primaryContainer },
          ]}
        >
          {post.authorAvatar ? (
            <Image
              source={{ uri: post.authorAvatar }}
              style={styles.avatarImg}
              contentFit="cover"
            />
          ) : (
            <Text style={[styles.avatarInitial, { color: m3Colors.onPrimaryContainer }]}>
              {post.authorInitial}
            </Text>
          )}
        </View>
        <View style={styles.postMeta}>
          <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={1}>
            {post.authorName}
          </Text>
          {post.locationLabel ? (
            <Text
              style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {post.locationLabel}
            </Text>
          ) : null}
        </View>
        {post.timeLabel ? (
          <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
            {post.timeLabel}
          </Text>
        ) : null}
      </View>

      {/* Optional cover image */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      {/* Text content */}
      <View style={styles.postBody}>
        <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]} numberOfLines={2}>
          {post.title}
        </Text>
        {post.body ? (
          <Text
            style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}
            numberOfLines={3}
          >
            {post.body}
          </Text>
        ) : null}
      </View>

      {/* Action row: like · comment · share */}
      <View style={[styles.postActions, { borderTopColor: colors.borderLight }]}>
        <M3Button
          variant="text"
          leftIcon={liked ? 'heart' : 'heart-outline'}
          onPress={() => setLiked((v) => !v)}
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
          style={styles.postActionButton}
          labelStyle={{ color: liked ? CultureTokens.coral : m3Colors.onSurfaceVariant }}
        >
          {liked ? String(post.likeCount + 1) : String(post.likeCount || '')}
        </M3Button>

        <M3Button
          variant="text"
          leftIcon="chatbubble-outline"
          onPress={post.onPress}
          accessibilityLabel="Open comments"
          style={styles.postActionButton}
        >
          {String(post.commentCount || '')}
        </M3Button>

        <M3Button
          variant="text"
          leftIcon="arrow-redo-outline"
          onPress={post.onShare}
          accessibilityLabel="Share post"
          style={styles.postActionButton}
        />
      </View>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// PostSkeleton — placeholder while orbit events load
// ---------------------------------------------------------------------------

function PostSkeleton() {
  const colors = useColors();
  const shade = withAlpha(colors.borderLight, 0.7);
  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: shade }]} />
        <View style={styles.postMeta}>
          <View style={[styles.skelLine, { width: '52%', backgroundColor: shade }]} />
          <View style={[styles.skelLine, { width: '36%', marginTop: 6, backgroundColor: shade }]} />
        </View>
      </View>
      <View style={[styles.postImage, { backgroundColor: shade }]} />
      <View style={[styles.postBody, { gap: 8 }]}>
        <View style={[styles.skelLine, { width: '78%', height: 16, backgroundColor: shade }]} />
        <View style={[styles.skelLine, { width: '55%', height: 14, backgroundColor: shade }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// EmptyFeed
// ---------------------------------------------------------------------------

function EmptyFeed({ onDiscover }: { onDiscover: () => void }) {
  const colors = useColors();
  const m3Colors = useM3Colors();
  return (
    <View style={[styles.emptyFeed, { borderColor: colors.borderLight }]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: m3Colors.primaryContainer }]}>
        <Ionicons name="people-outline" size={28} color={m3Colors.onPrimaryContainer} />
      </View>
      <Text style={[styles.emptyTitle, { color: m3Colors.onSurface }]}>No activity yet</Text>
      <Text style={[styles.emptyBody, { color: m3Colors.onSurfaceVariant }]}>
        Join or follow communities to see their events and announcements here.
      </Text>
      <M3Button
        variant="filled"
        onPress={onDiscover}
        accessibilityLabel="Discover community hubs"
        style={styles.emptyButton}
      >
        Discover hubs
      </M3Button>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <M3SectionHeader
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

// ---------------------------------------------------------------------------
// CommunityRail — horizontal community card scroll
// ---------------------------------------------------------------------------

function CommunityRail({
  communities,
  loading,
  empty,
  hPad,
}: {
  communities: Community[];
  loading?: boolean;
  empty: ReactNode;
  hPad: number;
}) {
  const colors = useColors();
  if (loading) {
    return (
      <View style={[styles.railLoading, { paddingHorizontal: hPad }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={COMMUNITY_CARD_WIDTH + Spacing.md}
      contentContainerStyle={[styles.railContent, { paddingHorizontal: hPad }]}
    >
      {communities.length === 0
        ? empty
        : communities.map((c, i) => (
            <View key={c.id} style={styles.communityCardShell}>
              <M3CommunityCard community={c} />
            </View>
          ))}
    </ScrollView>
  );
}

function EventRail({
  events,
  loading,
  empty,
  hPad,
}: {
  events: EventData[];
  loading?: boolean;
  empty: ReactNode;
  hPad: number;
}) {
  const colors = useColors();
  if (loading) {
    return (
      <View style={[styles.railLoading, { paddingHorizontal: hPad }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={EVENT_CARD_WIDTH + Spacing.md}
      contentContainerStyle={[styles.railContent, { paddingHorizontal: hPad }]}
    >
      {events.length === 0
        ? empty
        : events.map((event, i) => (
            <View key={event.id} style={styles.eventCardShell}>
              <M3EventCard event={event} />
            </View>
          ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// EmptyPanel — used inside horizontal rails
// ---------------------------------------------------------------------------

function EmptyPanel({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const m3Colors = useM3Colors();
  return (
    <M3Card
      variant="filled"
      style={styles.emptyPanel}
    >
      <View style={[styles.emptyPanelIcon, { backgroundColor: m3Colors.primaryContainer }]}>
        <Ionicons name={icon} size={22} color={m3Colors.onPrimaryContainer} />
      </View>
      <Text style={[styles.emptyTitle, { color: m3Colors.onSurface }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.emptyBody, { color: m3Colors.onSurfaceVariant }]} numberOfLines={3}>
        {body}
      </Text>
      <M3Button
        variant="outlined"
        onPress={onAction}
        accessibilityLabel={actionLabel}
        style={styles.emptyPanelButton}
      >
        {actionLabel}
      </M3Button>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CommunityTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const queryClient = useQueryClient();
  const { state: onboarding } = useOnboarding();
  const { savedCommunityBookmarks } = useSaved();
  const { isAuthenticated } = useAuth();

  const cityName    = onboarding?.city?.trim()    || 'Sydney';
  const cityCountry = onboarding?.country?.trim() || 'Australia';
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const hPad = layout.isDesktop ? Spacing.xl : layout.hPad;
  const maxWidth = layout.isDesktop ? 920 : undefined;
  const isWeb = Platform.OS === 'web';

  const [refreshing,      setRefreshing]      = useState(false);
  const [activeCategory,  setActiveCategory]  = useState<CommunityCategory>('all');
  const [segment,         setSegment]         = useState<Segment>('feed');
  const listRef = useRef<FlatList<FeedPost>>(null);
  const joinedSectionY = useRef(0);
  const followingSectionY = useRef(0);

  // ─── Queries ─────────────────────────────────────────────────────────────

  const {
    data: allCommunities = [],
    refetch: refetchCommunities,
    isLoading: communitiesLoading,
  } = useCommunities();

  const { data: joinedData,  refetch: refetchJoined }    = useJoinedCommunities();
  const { data: followingIds = [], refetch: refetchFollowing } = useFollowingCommunityIds();

  const joinedIds  = joinedData?.communityIds ?? NO_IDS;
  const joinedSet  = useMemo(() => new Set(joinedIds),   [joinedIds]);
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const joinedCommunities = useMemo(
    () => communitiesForIds(allCommunities, joinedIds),
    [allCommunities, joinedIds],
  );

  // Recommendations: shown when user has <3 joined communities (Req 6.1)
  const recommendedCommunities = useMemo(
    () => getCommunityRecommendations(
      onboarding?.cultureIds ?? [],
      allCommunities,
      joinedIds,
      6,
    ),
    [onboarding?.cultureIds, allCommunities, joinedIds],
  );
  const followingNotMember = useMemo(
    () => communitiesForIds(allCommunities, followingIds).filter((c) => !joinedSet.has(c.id)),
    [allCommunities, followingIds, joinedSet],
  );
  const savedCommunities = useMemo(
    () => allCommunities.filter((c) => savedCommunityBookmarks.includes(c.id)),
    [allCommunities, savedCommunityBookmarks],
  );
  const exploreCommunities = useMemo(() => {
    const cityNorm    = normPlace(cityName);
    const countryNorm = normPlace(cityCountry);
    const nearby = allCommunities.filter((c) => {
      const inCity    = !cityNorm    || normPlace(c.city)    === cityNorm;
      const inCountry = !countryNorm || normPlace(c.country) === countryNorm;
      return inCity && inCountry && !joinedSet.has(c.id) && !followingSet.has(c.id);
    });
    const fallback = allCommunities.filter(
      (c) => !joinedSet.has(c.id) && !followingSet.has(c.id),
    );
    return filterByCategory(
      uniqueCommunities(nearby.length > 0 ? nearby : fallback),
      activeCategory,
    ).slice(0, 16);
  }, [activeCategory, allCommunities, cityCountry, cityName, followingSet, joinedSet]);

  const orbitIds = useMemo(
    () => Array.from(new Set([...joinedIds, ...followingIds])),
    [followingIds, joinedIds],
  );
  const orbitKey = useMemo(() => [...orbitIds].sort().join(','), [orbitIds]);
  const orbitSet = useMemo(() => new Set(orbitIds), [orbitIds]);

  const {
    data: orbitEvents = [],
    refetch: refetchOrbitEvents,
    isLoading: orbitEventsLoading,
  } = useQuery({
    queryKey: communityTabOrbitEventsKey(cityName, cityCountry, orbitKey),
    queryFn: async () => {
      if (orbitIds.length === 0) return [];
      const res = await modulesApi.events.list({ city: cityName, country: cityCountry, pageSize: 120 });
      const events: EventData[] = res.events ?? [];
      return events
        .filter((event) => {
          const cId = event.communityId;
          const pId = event.publisherProfileId;
          return (
            (cId != null && cId !== '' && orbitSet.has(cId)) ||
            (pId != null && pId !== '' && orbitSet.has(pId))
          );
        })
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .slice(0, 24);
    },
    enabled: orbitIds.length > 0,
    staleTime: 90_000,
  });

  // ─── Map orbit events → FeedPost ─────────────────────────────────────────

  const feedPosts = useMemo<FeedPost[]>(() => {
    const communityMap = new Map<string, Community>();
    for (const c of allCommunities) {
      communityMap.set(c.id, c);
      if (c.slug) communityMap.set(c.slug, c);
    }
    return orbitEvents.map((event) => {
      const communityId = event.communityId ?? event.publisherProfileId ?? '';
      const community   = communityMap.get(communityId);
      const authorName  = community?.name ?? 'CulturePass';
      return {
        id:            event.id,
        authorName,
        authorAvatar:  community?.imageUrl,
        authorInitial: authorName.charAt(0).toUpperCase(),
        accentColor:   CultureTokens.community,
        timeLabel:     formatRelativeTime(event.date ?? event.createdAt),
        locationLabel: [event.city, event.category].filter(Boolean).join(' · '),
        title:         event.title,
        body:          event.description,
        imageUrl:      event.imageUrl ?? event.heroImageUrl,
        likeCount:     0,
        commentCount:  0,
        onPress: () =>
          router.push({ pathname: '/e/[id]', params: { id: event.id } }),
        onShare: async () => {
          try {
            await Share.share({
              title:   event.title,
              message: `${event.title}\nhttps://culturepass.app/e/${event.id}`,
              url:     `https://culturepass.app/e/${event.id}`,
            });
          } catch {}
        },
      } satisfies FeedPost;
    });
  }, [orbitEvents, allCommunities]);

  // ─── Pull-to-refresh ─────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communityKeys.all }),
      queryClient.invalidateQueries({ queryKey: communityKeys.joined() }),
      queryClient.invalidateQueries({ queryKey: communityKeys.followingCommunities() }),
      queryClient.invalidateQueries({ queryKey: ['community-tab'] }),
      refetchCommunities(),
      refetchJoined(),
      refetchFollowing(),
      refetchOrbitEvents(),
    ]);
    setRefreshing(false);
  }, [queryClient, refetchCommunities, refetchFollowing, refetchJoined, refetchOrbitEvents]);

  // ─── Navigation callbacks ─────────────────────────────────────────────────

  const goSearch = useCallback(() => router.push('/search'), []);
  const goCalendar = useCallback(() => router.push('/(tabs)/calendar'), []);
  const goCreateHub = useCallback(
    () => router.push('/hostspace/create/community' as never),
    [],
  );
  const handleShare = useCallback(async () => {
    const url =
      typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/community`
        : 'https://culturepass.app/community';
    try {
      await Share.share({
        title:   'CulturePass Community',
        message: `Explore cultural communities around ${cityName} on CulturePass.\n${url}`,
        url,
      });
    } catch {}
  }, [cityName]);

  const openDiscoverSection = useCallback((target: 'joined' | 'following') => {
    setSegment('discover');
    setActiveCategory('all');
    const offset = target === 'joined' ? joinedSectionY.current : followingSectionY.current;
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: Math.max(0, offset), animated: true });
    }, 80);
  }, []);

  // ─── FlatList helpers ─────────────────────────────────────────────────────

  const renderPost = useCallback(
    ({ item }: { item: FeedPost }) => (
      <View
        style={[
          styles.postWrap,
          { paddingHorizontal: hPad },
          maxWidth ? { maxWidth: maxWidth, alignSelf: 'center', width: '100%' } : undefined,
        ]}
      >
        <FeedPostCard post={item} />
      </View>
    ),
    [hPad, maxWidth],
  );

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: POST_HEIGHT_ESTIMATE,
      offset: POST_HEIGHT_ESTIMATE * index,
      index,
    }),
    [],
  );

  // ─── List header (shared across both segments) ────────────────────────────

  const listHeader = useMemo(
    () => (
      <View
        style={[
          styles.listHeader,
          maxWidth ? { maxWidth: maxWidth, alignSelf: 'center', width: '100%' } : undefined,
        ]}
      >
        <StatsBar
          activityCount={feedPosts.length}
          joined={joinedCommunities.length}
          following={followingNotMember.length}
          exploreCount={exploreCommunities.length}
          savedCount={savedCommunities.length}
          cityName={cityName}
          activeSegment={segment}
          onChangeSegment={setSegment}
          onCreateHub={goCreateHub}
          onPressActivity={() => setSegment('feed')}
          onPressJoined={() => openDiscoverSection('joined')}
          onPressFollowing={() => openDiscoverSection('following')}
          hPad={hPad}
          isAuthenticated={isAuthenticated}
        />
        {segment === 'feed' ? (
          <View style={styles.activeSectionIntro}>
            <View style={{ paddingHorizontal: hPad }}>
              <SectionHeader
                title="Latest from your orbit"
                subtitle="Events and updates from communities you follow or joined"
                actionLabel={feedPosts.length > 0 ? 'Calendar' : undefined}
                onAction={feedPosts.length > 0 ? goCalendar : undefined}
              />
            </View>
          </View>
        ) : (
          <View style={styles.activeSectionIntro}>
            <View style={{ paddingHorizontal: hPad }}>
              <SectionHeader
                title="Browse cultural hubs"
                subtitle={`Start local in ${cityName}, then widen the circle`}
                actionLabel="Search"
                onAction={goSearch}
              />
            </View>
            <CategoryChips active={activeCategory} onChange={setActiveCategory} hPad={hPad} />
          </View>
        )}
      </View>
    ),
    [
      maxWidth, joinedCommunities.length, followingNotMember.length,
      exploreCommunities.length, savedCommunities.length, cityName, feedPosts.length,
      goCreateHub, goCalendar, goSearch, hPad, isAuthenticated, segment, activeCategory, openDiscoverSection,
    ],
  );

  // ─── Discover content (FlatList footer when segment = 'discover') ─────────

  const discoverContent = useMemo(
    () => (
      <View
        style={[
          styles.discoverSections,
          maxWidth ? { maxWidth: maxWidth, alignSelf: 'center', width: '100%' } : undefined,
        ]}
      >
        {/* Your communities */}
        {/* Recommended for You — shown when <3 joined communities (Req 6.1) */}
        {recommendedCommunities.length > 0 && (
          <View style={styles.discoverSection}>
            <View style={{ paddingHorizontal: hPad }}>
              <SectionHeader
                title="Recommended for You"
                subtitle="Communities matching your cultural background"
              />
            </View>
            <CommunityRail
              communities={recommendedCommunities}
              loading={false}
              hPad={hPad}
              empty={null}
            />
          </View>
        )}

        <View
          style={styles.discoverSection}
          onLayout={(event) => {
            joinedSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={{ paddingHorizontal: hPad }}>
            <SectionHeader
              title="Your communities"
              subtitle="Hubs you've joined as a member"
              actionLabel={joinedCommunities.length > 0 ? 'See all' : undefined}
              onAction={joinedCommunities.length > 0 ? goSearch : undefined}
            />
          </View>
          <CommunityRail
            communities={joinedCommunities}
            loading={communitiesLoading}
            hPad={hPad}
            empty={
              <EmptyPanel
                icon="people-outline"
                title="No memberships yet"
                body="Find a cultural hub and join when it feels right."
                actionLabel="Search hubs"
                onAction={goSearch}
              />
            }
          />
        </View>

        {/* Following */}
        <View
          style={styles.discoverSection}
          onLayout={(event) => {
            followingSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={{ paddingHorizontal: hPad }}>
            <SectionHeader title="Following" subtitle="Communities you keep in your orbit" />
          </View>
          <CommunityRail
            communities={followingNotMember}
            hPad={hPad}
            empty={
              <EmptyPanel
                icon="heart-outline"
                title="Nothing followed yet"
                body="Open a community profile and follow it to stay updated."
                actionLabel="Browse hubs"
                onAction={goSearch}
              />
            }
          />
        </View>

        {/* Explore nearby */}
        <View style={styles.discoverSection}>
          <View style={{ paddingHorizontal: hPad }}>
            <SectionHeader
              title={`Explore near ${cityName}`}
              subtitle="Filtered by the category above"
              actionLabel="Search all"
              onAction={goSearch}
            />
          </View>
          <CommunityRail
            communities={exploreCommunities}
            loading={communitiesLoading}
            hPad={hPad}
            empty={
              <EmptyPanel
                icon="compass-outline"
                title="No hubs in this filter"
                body="Try another category or use search to look beyond your area."
                actionLabel="Search all"
                onAction={goSearch}
              />
            }
          />
        </View>

        {/* Saved */}
        <View style={styles.discoverSection}>
          <View style={{ paddingHorizontal: hPad }}>
            <SectionHeader title="Saved" subtitle="Bookmarked hubs to revisit later" />
          </View>
          <CommunityRail
            communities={savedCommunities}
            hPad={hPad}
            empty={
              <EmptyPanel
                icon="bookmark-outline"
                title="No saved hubs"
                body="Tap the bookmark on a community card to save it here."
                actionLabel="Explore hubs"
                onAction={goSearch}
              />
            }
          />
        </View>

        {/* Events from orbit */}
        <View style={styles.discoverSection}>
          <View style={{ paddingHorizontal: hPad }}>
            <SectionHeader
              title="Events from your orbit"
              subtitle="Upcoming moments from joined or followed communities"
              actionLabel={orbitEvents.length > 0 ? 'Calendar' : undefined}
              onAction={orbitEvents.length > 0 ? goCalendar : undefined}
            />
          </View>
          <EventRail
            events={orbitEvents}
            loading={orbitEventsLoading}
            hPad={hPad}
            empty={
              <EmptyPanel
                icon="calendar-outline"
                title="Connect with hubs first"
                body="Once you join or follow communities, their events appear here."
                actionLabel="Find hubs"
                onAction={goSearch}
              />
            }
          />
        </View>
      </View>
    ),
    [
      maxWidth, hPad, joinedCommunities, goSearch, communitiesLoading,
      followingNotMember, cityName, exploreCommunities, savedCommunities,
      orbitEvents, orbitEventsLoading, goCalendar,
    ],
  );

  // ─── List footer ──────────────────────────────────────────────────────────

  const listFooter = useMemo(() => {
    if (segment === 'discover') return discoverContent;

    // Feed segment: skeleton → empty state → nothing (items already rendered)
    const showSkeletons = orbitEventsLoading && feedPosts.length === 0;
    const showEmpty     = !orbitEventsLoading && feedPosts.length === 0;
    if (!showSkeletons && !showEmpty) return null;

    return (
      <View
        style={[
          styles.feedFooter,
          maxWidth ? { maxWidth: maxWidth, alignSelf: 'center', width: '100%' } : undefined,
        ]}
      >
        {showSkeletons
          ? [1, 2, 3].map((k) => (
              <View key={k} style={{ paddingHorizontal: hPad }}>
                <PostSkeleton />
              </View>
            ))
          : <EmptyFeed onDiscover={() => setSegment('discover')} />}
      </View>
    );
  }, [segment, orbitEventsLoading, feedPosts.length, discoverContent, maxWidth, hPad]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <Head>
        <title>{`Community · ${cityName} · CulturePass`}</title>
        <meta
          name="description"
          content={`Cultural communities, hubs, and events near ${cityName}. Join, follow, and explore on CulturePass.`}
        />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <M3TopAppBar
          title="Community"
          variant="small"
          titleLeading={
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={{ width: isWeb ? 28 : 40, height: isWeb ? 28 : 40, borderRadius: 20, marginLeft: 8 }}
              contentFit="contain"
            />
          }
          denseWeb={isWeb}
          actions={[
            { icon: 'share-social-outline', onPress: handleShare },
          ]}
        />
        <FlatList
          ref={listRef}
          data={segment === 'feed' ? feedPosts : []}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{
            paddingBottom: bottomInset + layout.tabBarHeight + Spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          // Android performance
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={10}
          getItemLayout={getItemLayout}
        />
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ── TopBar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  navTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title2,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  navIconBtnPressed: {
    opacity: 0.55,
  },

  // ── Community overview ─────────────────────────────────────────────────────
  communityOverview: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  communityHero: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 18px 38px rgba(15,23,42,0.18)',
      },
    }),
  },
  communityHeroDesktop: {
    padding: Spacing.lg,
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroCopy: {
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
    maxWidth: 560,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    lineHeight: 22,
    maxWidth: 560,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'flex-start',
  },
  heroActionButton: {
    flex: 1,
    minWidth: 0,
  },
  heroActionButtonNative: {
    backgroundColor: withAlpha('#FFFFFF', 0.18),
    borderColor: withAlpha('#FFFFFF', 0.4),
  },
  heroActionLabelNative: {
    color: '#FFFFFF',
  },
  overviewRail: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  segmentShell: {
    minHeight: 46,
    minWidth: 226,
    borderRadius: Radius.lg,
    padding: 4,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segmentPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statsGridDesktop: {
    flexWrap: 'nowrap',
  },
  statTile: {
    minHeight: 46,
    minWidth: 126,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statTileDesktop: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.callout,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  feedContext: {
    minHeight: 48,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  feedContextText: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },
  segmentLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },

  // ── Category chips ─────────────────────────────────────────────────────────
  categoryScroll: {
    marginTop: Spacing.sm,
  },
  categoryRail: {
    gap: Spacing.sm,
    paddingVertical: Platform.OS === 'web' ? 2 : 4,
    paddingBottom: Platform.OS === 'web' ? Spacing.sm : Spacing.md,
  },
  activeSectionIntro: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryChipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
  },

  // ── FeedPostCard ───────────────────────────────────────────────────────────
  postWrap: {
    width: '100%',
  },
  postCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: AvatarTokens.size.md,
    height: AvatarTokens.size.md,
    borderRadius: AvatarTokens.radius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
  },
  postMeta: {
    flex: 1,
    minWidth: 0,
  },
  postAuthor: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.callout,
    lineHeight: 20,
  },
  postLocation: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: 16,
    marginTop: 1,
  },
  postTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: 16,
    flexShrink: 0,
  },
  postImage: {
    width: '100%',
    height: 220,
  },
  postBody: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  postTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.callout,
    lineHeight: 22,
  },
  postBodyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  postActionButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  actionCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
  },

  // ── Skeleton ───────────────────────────────────────────────────────────────
  skelLine: {
    height: 12,
    borderRadius: Radius.xs,
  },

  // ── Empty states ───────────────────────────────────────────────────────────
  emptyFeed: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyButton: {
    marginTop: Spacing.xs,
    minWidth: 156,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyPrimaryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  emptyPrimaryBtnLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
    color: '#FFFFFF',
  },
  emptyPanel: {
    width: COMMUNITY_CARD_WIDTH,
    minHeight: 224,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  emptyPanelButton: {
    marginTop: Spacing.xs,
    alignSelf: 'stretch',
  },
  emptyPanelIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOutlineBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyOutlineBtnLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
  },

  // ── Feed footer ────────────────────────────────────────────────────────────
  feedFooter: {
    width: '100%',
  },

  // ── Section header ─────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: 2,
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
    marginTop: 2,
  },
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
  },

  // ── Discover sections ──────────────────────────────────────────────────────
  discoverSections: {
    width: '100%',
    gap: Spacing.xl,
    paddingTop: Spacing.md,
  },
  discoverSection: {
    gap: Spacing.md,
  },

  // ── Community / event rails ────────────────────────────────────────────────
  railContent: {
    gap: Spacing.md,
    paddingVertical: 2,
  },
  railLoading: {
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  communityCardShell: {
    width: COMMUNITY_CARD_WIDTH,
  },
  eventCardShell: {
    width: EVENT_CARD_WIDTH,
  },

  // ── List header container ─────────────────────────────────────────────────
  listHeader: {
    width: '100%',
  },
});
