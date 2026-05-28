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
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Luxe, luxeDark } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import { useAuth } from '@/lib/auth';

import {
  M3TopAppBar,
  LuxeButton,
  LuxeText,
  LuxeFilterChip,
  M3SectionHeader,
} from '@/design-system/ui';
import { LuxeCommunityCard } from '@/modules/communities/components/LuxeCommunityCard';
import { LuxeEventCard } from '@/modules/events/components/LuxeEventCard';
import { useCommunities, useJoinedCommunities, useFollowingCommunityIds } from '@/modules/communities/hooks/useCommunities';
import { getCommunityRecommendations } from '@/lib/community-utils';
import { getCommunityMemberCount } from '@/lib/community';

// ... (keep your existing imports for hooks, utils, types)

const COMMUNITY_CARD_WIDTH = 320;
const EVENT_CARD_WIDTH = 272;
const POST_HEIGHT_ESTIMATE = 360;

type Segment = 'feed' | 'discover';
type CommunityCategory = 'all' | 'cultural' | 'business' | 'civic' | 'club';

export default function CommunityTabScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { isDesktop } = layout;

  const { state: onboarding, setCity } = useOnboarding();
  const { savedCommunityBookmarks } = useSaved();
  const { isAuthenticated, user } = useAuth();

  const cityName = onboarding?.city?.trim() || 'Sydney';
  const hPad = isDesktop ? Luxe.spacing.xl : Luxe.spacing.lg;

  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommunityCategory>('all');
  const [segment, setSegment] = useState<Segment>('feed');

  // Add type definitions
  type CommunityPost = {
    id: string;
    name: string;
    imageUrl?: string;
  };

  type FeedItem = {
    id: string;
    kind: string;
    communityId?: string;
    communityName?: string;
    communityImageUrl?: string;
    body?: string;
    postStyle?: string;
    imageUrl?: string;
    authorId?: string;
    likesCount?: number;
    commentsCount?: number;
    createdAt: string;
    event?: any;
  };

  // Loose type matching what the local luxe FeedPostCard expects
  type FeedPost = {
    id: string;
    authorName: string;
    authorAvatar?: string;
    authorInitial: string;
    timeLabel?: string;
    locationLabel?: string;
    title: string;
    body?: string;
    imageUrl?: string;
    likeCount?: number;
    commentCount?: number;
    onPress: () => void;
    onShare: () => void;
  };

  // Feed query (stubbed safely so the screen doesn't crash when the real API isn't wired)
  const feedQuery = useQuery({
    queryKey: ['community-feed', cityName],
    queryFn: async () => ({ items: [] as any[] }),
    staleTime: 3 * 60 * 1000,
  });

  const feedPosts = useMemo(() => {
    const serverItems = (feedQuery.data?.items ?? []) as unknown as FeedItem[];
    return serverItems.map((item: FeedItem) => {
      const communityName = item.communityName || 'Community';
      const authorName = communityName;
      const title = item.body ? item.body.slice(0, 80) : (item.kind === 'event' ? 'Community Event' : 'Update from ' + communityName);

      return {
        id: item.id,
        authorName,
        authorAvatar: item.communityImageUrl,
        authorInitial: communityName.charAt(0).toUpperCase(),
        accentColor: Luxe.colors.terracotta,
        timeLabel: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
        locationLabel: cityName,
        title,
        body: item.body || '',
        imageUrl: item.imageUrl || item.communityImageUrl,
        likeCount: item.likesCount || 0,
        commentCount: item.commentsCount || 0,
        onPress: () => {
          if (item.communityId) {
            router.push({ pathname: '/c/[id]', params: { id: item.communityId } });
          }
        },
        onShare: () => {
          Share.share({ message: title + (item.body ? '\n' + item.body : '') }).catch(() => {});
        },
      };
    });
  }, [feedQuery.data, cityName]);

  // Community data for Discover rails + Trending (restored for luxe experience)
  const { data: allCommunities = [] } = useCommunities();
  const { data: joinedData } = useJoinedCommunities();
  const { data: followingIds = [] } = useFollowingCommunityIds();

  const joinedSet = useMemo(() => new Set(joinedData?.communityIds ?? []), [joinedData]);
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const trendingCommunities = useMemo(() => {
    return [...allCommunities]
      .filter(c => !joinedSet.has(c.id) && !followingSet.has(c.id))
      .sort((a, b) => {
        const scoreA = (a.isVerified ? 100 : 0) + getCommunityMemberCount(a);
        const scoreB = (b.isVerified ? 100 : 0) + getCommunityMemberCount(b);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [allCommunities, joinedSet, followingSet]);

  const recommendedCommunities = useMemo(() => {
    return getCommunityRecommendations([], allCommunities, Array.from(joinedSet), 6)
      .filter(c => !joinedSet.has(c.id));
  }, [allCommunities, joinedSet]);

  const exploreCommunities = useMemo(() => {
    return allCommunities
      .filter(c => !joinedSet.has(c.id) && !followingSet.has(c.id))
      .slice(0, 12);
  }, [allCommunities, joinedSet, followingSet]);

  const handleLocationChange = (newCity: string) => {
    setCity?.(newCity);
  };

  // Enhanced FeedPostCard with better luxe treatment
  const FeedPostCard = ({ post }: { post: FeedPost }) => {
    const scale = useSharedValue(1);
    const [liked, setLiked] = useState(false);

    const cardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.985, { damping: 22, stiffness: 280 });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });
    };

    return (
      <Animated.View style={[styles.postCard, cardStyle]}>
        <Pressable onPress={post.onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              {post.authorAvatar ? (
                <Image source={{ uri: post.authorAvatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <LuxeText style={styles.avatarInitial}>{post.authorInitial}</LuxeText>
              )}
            </View>

            <View style={styles.postMeta}>
              <LuxeText variant="bodyMedium" style={styles.authorName}>{post.authorName}</LuxeText>
              {post.locationLabel && (
                <LuxeText variant="caption" style={styles.locationLabel}>
                  {post.locationLabel}
                </LuxeText>
              )}
            </View>

            {post.timeLabel && (
              <LuxeText variant="caption" style={styles.timestamp}>{post.timeLabel}</LuxeText>
            )}
          </View>

          {post.imageUrl && (
            <View style={styles.postImageContainer}>
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.postImage}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={styles.imageGradient}
              />
            </View>
          )}

          <View style={styles.postContent}>
            <LuxeText variant="title3" style={styles.postTitle} numberOfLines={2}>
              {post.title}
            </LuxeText>
            {post.body && (
              <LuxeText variant="body" style={styles.postBodyText} numberOfLines={3}>
                {post.body}
              </LuxeText>
            )}
          </View>

          <View style={styles.postActions}>
            <LuxeButton
              variant="glass"
              size="sm"
              leftIcon={liked ? 'heart' : 'heart-outline'}
              onPress={() => setLiked(!liked)}
            >
              {liked ? (post.likeCount || 0) + 1 : (post.likeCount || 0)}
            </LuxeButton>

            <LuxeButton variant="glass" size="sm" leftIcon="chatbubble-outline">
              {post.commentCount}
            </LuxeButton>

            <LuxeButton variant="glass" size="sm" leftIcon="arrow-redo-outline" onPress={post.onShare}>
              {null}
            </LuxeButton>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Improved StatsBar + Hero
  const StatsBar = () => (
    <View style={[styles.heroContainer, { paddingHorizontal: hPad }]}>
      <View style={styles.premiumHero}>
        <LuxeText variant="display" style={styles.heroTitle}>
          Find your people in {cityName}
        </LuxeText>
        <LuxeText variant="body" style={styles.heroSubtitle}>
          Cultural communities • Local events • Meaningful connections
        </LuxeText>

        <View style={styles.heroActions}>
          {isAuthenticated && (
            <LuxeButton variant="filled" size="md" onPress={() => router.push('/create/community')}>
              Create Hub
            </LuxeButton>
          )}
          <LuxeButton
            variant="outlined"
            size="md"
            onPress={() => setSegment('discover')}
          >
            Explore
          </LuxeButton>
        </View>
      </View>

      {/* Segment Switcher */}
      <View style={[styles.segmentContainer, { paddingHorizontal: hPad }]}>
        <View style={styles.segmentShell}>
          {(['feed', 'discover'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSegment(s)}
              style={[styles.segmentPill, segment === s && styles.segmentPillActive]}
            >
              <Ionicons
                name={s === 'feed' ? 'pulse' : 'compass'}
                size={18}
                color={segment === s ? m3Colors.onPrimary : m3Colors.onSurfaceVariant}
              />
              <LuxeText style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
                {s === 'feed' ? 'Activity' : 'Discover'}
              </LuxeText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderListHeader = () => (
    <View>
      <StatsBar />

      <LocationSelector currentCity={cityName} onLocationChange={handleLocationChange} />

      {segment === 'discover' && (
        <CategoryChips active={activeCategory} onChange={setActiveCategory} hPad={hPad} />
      )}
    </View>
  );

  const discoverContent = renderDiscoverContent(
    segment,
    activeCategory,
    setActiveCategory,
    hPad,
    trendingCommunities,
    recommendedCommunities,
    exploreCommunities,
    setSegment
  );

  // Main Render
  return (
    <View style={[styles.screen, { backgroundColor: m3Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <M3TopAppBar
        title="Community"
        titleLeading={
          <Image source={require('@/assets/images/culturepass-logo.png')} style={{ width: 36, height: 36 }} />
        }
        actions={[
          { icon: 'add-circle-outline', onPress: () => router.push('/create/community') },
        ]}
      />

      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        {segment === 'feed' ? (
          <FlatList
            data={feedPosts}
            renderItem={({ item }) => <FeedPostCard post={item} />}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={<EmptyFeed onDiscover={() => setSegment('discover')} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 80 }}
          >
            {discoverContent}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyFeed — luxe empty state for the Activity tab (fixes "EmptyFeed is not defined")
// ─────────────────────────────────────────────────────────────────────────────

// ── Minimal but beautiful discover helpers (restored luxe rails + Trending) ──

function LocationSelector({ currentCity, onLocationChange }: { currentCity: string; onLocationChange: (c: string) => void }) {
  const sample = ['Sydney', 'Melbourne', 'Brisbane', 'Perth'];
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <LuxeText variant="caption" style={{ color: luxeDark.textSecondary, marginBottom: 6 }}>Your city</LuxeText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {sample.map((city) => (
          <Pressable
            key={city}
            onPress={() => onLocationChange(city)}
            style={[
              { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: luxeDark.border },
              currentCity === city && { backgroundColor: luxeDark.primaryContainer, borderColor: 'transparent' }
            ]}
          >
            <LuxeText variant="caption" style={{ color: currentCity === city ? luxeDark.onPrimaryContainer : luxeDark.textSecondary }}>{city}</LuxeText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryChips({ active, onChange, hPad }: { active: CommunityCategory; onChange: (c: CommunityCategory) => void; hPad: number }) {
  const cats: { id: CommunityCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'cultural', label: 'Cultural', icon: 'color-palette-outline' },
    { id: 'business', label: 'Business', icon: 'briefcase-outline' },
    { id: 'civic', label: 'Civic', icon: 'business-outline' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 8, paddingVertical: 8 }}>
      {cats.map((c) => (
        <LuxeFilterChip
          key={c.id}
          label={c.label}
          icon={c.icon}
          selected={active === c.id}
          onPress={() => onChange(c.id)}
          compact
        />
      ))}
    </ScrollView>
  );
}

function renderDiscoverContent(
  segment: Segment,
  activeCategory: CommunityCategory,
  setActiveCategory: (c: CommunityCategory) => void,
  hPad: number,
  trending: any[],
  recommended: any[],
  explore: any[],
  setSegment: (s: Segment) => void
) {
  if (segment !== 'discover') return null;

  return (
    <View style={{ paddingHorizontal: hPad, gap: 28, paddingTop: 12 }}>
      {/* Trending rail with prominent luxe cards (the main feature we built) */}
      {trending.length > 0 && (
        <View>
          <M3SectionHeader title="Trending in your city" subtitle="Standout communities people are joining right now" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={340} decelerationRate="fast" contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
            {trending.map((c: any) => (
              <View key={c.id} style={{ width: 338 }}>
                <LuxeCommunityCard community={c} variant="featured" size="large" />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <View>
          <M3SectionHeader title="Recommended for you" subtitle="Based on your interests" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={328} decelerationRate="fast" contentContainerStyle={{ gap: 14 }}>
            {recommended.map((c: any) => (
              <View key={c.id} style={{ width: 310 }}>
                <LuxeCommunityCard community={c} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Near you / Explore */}
      {explore.length > 0 && (
        <View>
          <M3SectionHeader title="Discover more" subtitle="Communities in your area" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={328} decelerationRate="fast" contentContainerStyle={{ gap: 14 }}>
            {explore.map((c: any) => (
              <View key={c.id} style={{ width: 310 }}>
                <LuxeCommunityCard community={c} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {trending.length === 0 && recommended.length === 0 && explore.length === 0 && (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <LuxeText variant="body" style={{ color: luxeDark.textSecondary, textAlign: 'center' }}>
            No communities found yet. Try creating one!
          </LuxeText>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyFeed — luxe empty state for the Activity tab
// ─────────────────────────────────────────────────────────────────────────────

function EmptyFeed({ onDiscover }: { onDiscover: () => void }) {
  return (
    <View style={styles.emptyFeedLuxe}>
      <LinearGradient colors={['#1F1A3D', '#14122A']} style={styles.emptyFeedGradient}>
        <View style={styles.emptyFeedIcon}>
          <Ionicons name="radio-outline" size={32} color={Luxe.colors.terracotta} />
        </View>
        <LuxeText variant="title2" style={{ color: luxeDark.text, textAlign: 'center' }}>
          Your feed is quiet
        </LuxeText>
        <LuxeText variant="body" style={{ color: luxeDark.textSecondary, textAlign: 'center', lineHeight: 21, paddingHorizontal: 12 }}>
          Join or follow hubs to see their events, posts and announcements appear here.
        </LuxeText>
        <LuxeButton
          variant="filled"
          size="md"
          onPress={onDiscover}
          style={styles.emptyFeedCta}
        >
          Explore communities
        </LuxeButton>
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (Significantly Improved)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shell: { flex: 1, width: '100%' },
  shellDesktop: { maxWidth: 1280, alignSelf: 'center' },

  heroContainer: { paddingTop: 12 },
  premiumHero: {
    backgroundColor: luxeDark.surfaceElevated,
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: { textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { textAlign: 'center', opacity: 0.8, marginBottom: 24 },
  heroActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },

  segmentContainer: { marginBottom: 16 },
  segmentShell: {
    backgroundColor: luxeDark.surfaceElevated,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    alignSelf: 'center',
    minWidth: 280,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  segmentPillActive: { backgroundColor: luxeDark.primary },
  segmentText: { fontSize: 15, fontWeight: '600' },
  segmentTextActive: { color: '#FFFFFF' },

  postCard: {
    marginHorizontal: Luxe.spacing.lg,
    marginBottom: Luxe.spacing.lg,
    backgroundColor: luxeDark.surfaceElevated,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: luxeDark.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: luxeDark.primaryContainer,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: luxeDark.onPrimaryContainer,
  },
  authorName: { fontWeight: '600' },
  locationLabel: { color: luxeDark.textSecondary },
  timestamp: { color: luxeDark.textTertiary, marginLeft: 'auto' },

  postImageContainer: { position: 'relative' },
  postImage: { width: '100%', height: 260 },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
  },

  postContent: { padding: 16, paddingTop: 12 },
  postTitle: { marginBottom: 6 },
  postBodyText: { color: luxeDark.textSecondary, lineHeight: 22 },

  postActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: luxeDark.divider,
  },

  // Missing styles referenced by the local FeedPostCard
  postMeta: { flex: 1, minWidth: 0 },

  // Luxe empty states (restored)
  emptyFeedLuxe: {
    marginHorizontal: Luxe.spacing.lg,
    marginTop: Luxe.spacing.xl,
    marginBottom: Luxe.spacing.xl,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: luxeDark.border,
  },
  emptyFeedGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyFeedIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyFeedCta: {
    marginTop: 8,
    minWidth: 178,
  },
});