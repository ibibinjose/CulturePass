import React, { useState, useMemo } from 'react';
import {
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
import { modulesApi } from '@/modules/api';
import { CommunityWebDesktopLayout } from '@/modules/communities/components/detail/CommunityWebDesktopLayout';
import type { Community, EventData } from '@/shared/schema';

import {
  M3TopAppBar,
  LuxeButton,
  LuxeText,
  LuxeFilterChip,
  M3SectionHeader,
} from '@/design-system/ui';
import { LuxeCommunityCard } from '@/modules/communities/components/LuxeCommunityCard';
import { useCommunities, useJoinedCommunities, useFollowingCommunityIds } from '@/modules/communities/hooks/useCommunities';
import { getCommunityRecommendations } from '@/lib/community-utils';
import { getCommunityMemberCount } from '@/lib/community';

// ... (keep your existing imports for hooks, utils, types)

type CommunityCategory = 'all' | 'cultural' | 'business' | 'civic' | 'club' | 'faith' | 'arts';

const CATEGORY_OPTIONS: { id: CommunityCategory; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cultural', label: 'Cultural', icon: 'globe' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'civic', label: 'Civic', icon: 'people' },
  { id: 'club', label: 'Clubs', icon: 'people-circle' },
  { id: 'faith', label: 'Faith', icon: 'heart' },
  { id: 'arts', label: 'Arts', icon: 'color-palette' },
];

export default function CommunityTabScreen() {
  const m3Colors = useM3Colors();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { isDesktop, windowSizeClass } = layout;

  const { state: onboarding } = useOnboarding();
  const { user } = useAuth();
  const { savedCommunityBookmarks } = useSaved();

  const userCity = onboarding?.city?.trim() || 'Sydney';
  const userCountry = onboarding?.country?.trim() || 'Australia';
  const useDesktopCommunityLayout = Platform.OS === 'web' && isDesktop;
  const hPad = isDesktop ? Luxe.spacing.xl : Luxe.spacing.lg;

  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommunityCategory>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'near-you'>('near-you');
  const [sortMode, setSortMode] = useState<'activity' | 'size' | 'name'>('activity');

  // Stubs for Slice 2 / refactored feed + location UI (to be wired properly)
  const [cityName, setCity] = useState<string>(userCity);
  const [segment, setSegment] = useState<'discover' | 'feed'>('discover');
  const isAuthenticated = !!user;

  const numColumns = windowSizeClass === 'expanded' ? 3 : 2;

  const queryClient = useQueryClient();
  const { data: allCommunities = [] } = useCommunities();

  // === Clean & Beautiful Filter Bar ===
  const FilterBar = () => (
    <View style={{ paddingHorizontal: hPad, paddingTop: 12, paddingBottom: 8, gap: 12 }}>
      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CATEGORY_OPTIONS.map((cat) => (
          <LuxeFilterChip
            key={cat.id}
            label={cat.label}
            icon={cat.icon as any}
            selected={activeCategory === cat.id}
            onPress={() => setActiveCategory(cat.id)}
            compact
          />
        ))}
      </ScrollView>

      {/* Location + Sort Row */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <LuxeFilterChip
          label="Near You"
          selected={selectedLocation === 'near-you'}
          onPress={() => setSelectedLocation('near-you')}
          compact
        />
        <LuxeFilterChip
          label="All Cities"
          selected={selectedLocation === 'all'}
          onPress={() => setSelectedLocation('all')}
          compact
        />

        <View style={{ flex: 1 }} />

        {/* Simple Sort */}
        <Pressable 
          onPress={() => {
            const next = sortMode === 'activity' ? 'size' : sortMode === 'size' ? 'name' : 'activity';
            setSortMode(next);
          }}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 4, 
            backgroundColor: m3Colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <LuxeText variant="caption" style={{ color: m3Colors.onSurfaceVariant }}>
            {sortMode === 'activity' ? 'Most Active' : sortMode === 'size' ? 'Largest' : 'A–Z'}
          </LuxeText>
          <Ionicons name="swap-vertical" size={14} color={m3Colors.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );

  // === Clean Gallery Filtering ===
  const filteredCommunities = useMemo(() => {
    let result = [...allCommunities];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((c: any) => 
        c.communityCategory === activeCategory || 
        c.category?.toLowerCase() === activeCategory
      );
    }

    // Location filter
    if (selectedLocation === 'near-you') {
      result = result.filter((c: any) => 
        c.city?.toLowerCase() === userCity.toLowerCase() ||
        (c.chapterCities || []).some((ch: string) => ch.toLowerCase() === userCity.toLowerCase())
      );
    }

    // Sorting
    if (sortMode === 'size') {
      result.sort((a: any, b: any) => (b.membersCount || 0) - (a.membersCount || 0));
    } else if (sortMode === 'name') {
      result.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    } else {
      const levelOrder: Record<string, number> = { thriving: 4, active: 3, steady: 2, new: 1 };
      result.sort((a: any, b: any) => {
        const aLevel = levelOrder[a.activityLevel || 'new'] || 0;
        const bLevel = levelOrder[b.activityLevel || 'new'] || 0;
        return bLevel - aLevel || (b.membersCount || 0) - (a.membersCount || 0);
      });
    }

    return result;
  }, [allCommunities, activeCategory, selectedLocation, sortMode, userCity]);
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

  const joinedCommunities = useMemo(
    () => allCommunities.filter((c) => joinedSet.has(c.id)),
    [allCommunities, joinedSet],
  );

  const followingNotMember = useMemo(
    () => allCommunities.filter((c) => followingSet.has(c.id) && !joinedSet.has(c.id)),
    [allCommunities, joinedSet, followingSet],
  );

  const savedCommunities = useMemo(
    () => allCommunities.filter((c) => savedCommunityBookmarks.includes(c.id)),
    [allCommunities, savedCommunityBookmarks],
  );

  const { data: trendingEvents = [], isLoading: trendingLoading } = useQuery<EventData[]>({
    queryKey: ['discover', 'trending', userCity],
    queryFn: () => modulesApi.discover.trending(),
    enabled: useDesktopCommunityLayout,
    staleTime: 60_000,
  });

  const { data: cityEventsRes } = useQuery({
    queryKey: ['events', 'community-desktop', userCity],
    queryFn: () => modulesApi.events.list({ city: userCity, pageSize: 24 }),
    enabled: useDesktopCommunityLayout,
    staleTime: 60_000,
  });

  const cityEvents = useMemo(() => {
    const events = cityEventsRes?.events ?? [];
    const cityLower = userCity.toLowerCase();
    return events.filter((e) => e.city?.toLowerCase() === cityLower);
  }, [cityEventsRes?.events, userCity]);

  const orbitEvents = useMemo(() => {
    const events = cityEventsRes?.events ?? [];
    const cityLower = userCity.toLowerCase();
    return events.filter((e) => e.city?.toLowerCase() !== cityLower).slice(0, 12);
  }, [cityEventsRes?.events, userCity]);

  const handleRefreshDesktop = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['discover', 'trending'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'community-desktop'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationChange = (newCity: string) => {
    setCity?.(newCity);
  };

  // Enhanced FeedPostCard with better luxe treatment
  type FeedPost = {
    id?: string;
    authorName?: string;
    authorAvatar?: string;
    authorInitial?: string;
    locationLabel?: string;
    onPress?: () => void;
    [key: string]: any;
  };
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
      {/* Filters */}
      <View style={{ paddingHorizontal: hPad, paddingTop: 8 }}>
        <CategoryChips active={activeCategory} onChange={setActiveCategory} hPad={hPad} />
        
        {/* Location Filter */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <LuxeFilterChip 
            label="Near You" 
            selected={selectedLocation === 'near-you'} 
            onPress={() => setSelectedLocation('near-you')} 
            compact 
          />
          <LuxeFilterChip 
            label="All Locations" 
            selected={selectedLocation === 'all'} 
            onPress={() => setSelectedLocation('all')} 
            compact 
          />
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

  // discoverContent removed - now using unified gallery

  if (useDesktopCommunityLayout) {
    return (
      <View style={[styles.screen, { backgroundColor: m3Colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <CommunityWebDesktopLayout
          cityName={cityName}
          cityCountry={userCountry}
          contentWidth={layout.contentWidth}
          shellPad={layout.hPad}
          joinedCommunities={joinedCommunities as Community[]}
          followingNotMember={followingNotMember as Community[]}
          savedCommunities={savedCommunities as Community[]}
          exploreNearby={exploreCommunities as Community[]}
          allCommunities={allCommunities as Community[]}
          cityEvents={cityEvents}
          orbitEvents={orbitEvents}
          trendingEvents={trendingEvents}
          trendingLoading={trendingLoading}
          joinedCount={joinedCommunities.length}
          followingOnlyCount={followingNotMember.length}
          savedCount={savedCommunities.length}
          exploreCount={exploreCommunities.length}
          refreshing={refreshing}
          onRefresh={handleRefreshDesktop}
        />
      </View>
    );
  }

  // Main Render - Unified Community Gallery
  return (
    <View style={[styles.screen, { backgroundColor: m3Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <M3TopAppBar
        title="Communities"
        titleLeading={
          <Image source={require('@/assets/images/culturepass-logo.png')} style={{ width: 36, height: 36 }} />
        }
        actions={[
          { icon: 'add-circle-outline', onPress: () => router.push('/create/community') },
        ]}
      />

      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 12, paddingHorizontal: hPad } : undefined}
        renderItem={({ item }) => (
          <View style={{ flex: 1 / numColumns, marginBottom: 12 }}>
            <LuxeCommunityCard community={item} />
          </View>
        )}
        ListHeaderComponent={
          <>
            <View style={{ paddingHorizontal: hPad, paddingTop: 16, paddingBottom: 4 }}>
              <LuxeText variant="title2" style={{ color: luxeDark.text }}>
                Discover Communities
              </LuxeText>
              <LuxeText variant="body" style={{ color: luxeDark.textSecondary, marginTop: 2 }}>
                {filteredCommunities.length} communities • {selectedLocation === 'near-you' ? `Near ${userCity}` : 'Worldwide'}
              </LuxeText>
            </View>

            {/* Clean & Good Looking Filter Chips */}
            <View style={{ paddingHorizontal: hPad, paddingBottom: 12, gap: 10 }}>
              {/* Category Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: hPad + 32 }}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <LuxeFilterChip
                    key={cat.id}
                    label={cat.label}
                    icon={cat.icon as any}
                    selected={activeCategory === cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    compact
                  />
                ))}
              </ScrollView>

              {/* Location + Sort */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <LuxeFilterChip
                  label="Near You"
                  selected={selectedLocation === 'near-you'}
                  onPress={() => setSelectedLocation('near-you')}
                  compact
                />
                <LuxeFilterChip
                  label="All Locations"
                  selected={selectedLocation === 'all'}
                  onPress={() => setSelectedLocation('all')}
                  compact
                />

                <View style={{ flex: 1 }} />

                <Pressable
                  onPress={() => {
                    const next = sortMode === 'activity' ? 'size' : sortMode === 'size' ? 'name' : 'activity';
                    setSortMode(next);
                  }}
                  style={{
                    backgroundColor: m3Colors.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <LuxeText variant="caption" style={{ color: m3Colors.onSurfaceVariant }}>
                    {sortMode === 'activity' ? 'Most Active' : sortMode === 'size' ? 'Largest' : 'A–Z'}
                  </LuxeText>
                  <Ionicons name="swap-vertical" size={13} color={m3Colors.onSurfaceVariant} />
                </Pressable>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <LuxeText variant="body" style={{ color: luxeDark.textSecondary, textAlign: 'center' }}>
              No communities match your current filters.
            </LuxeText>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          width: isDesktop ? layout.contentWidth + layout.hPad * 2 : '100%',
          alignSelf: 'center'
        }}
      />
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: hPad, gap: 8, paddingVertical: 8, paddingRight: hPad + 32 }}>
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



// ─────────────────────────────────────────────────────────────────────────────
// EmptyFeed — luxe empty state for the Activity tab
// ─────────────────────────────────────────────────────────────────────────────

function EmptyFeed({ onDiscover }: { onDiscover: () => void }) {
  return (
    <View style={styles.emptyFeedLuxe}>
      <LinearGradient colors={['#1F1A3D', '#14122A']} style={styles.emptyFeedGradient}>
        <View style={styles.emptyFeedIcon}>
          <Ionicons name="radio-outline" size={32} color={Luxe.colors.appBlue} />
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