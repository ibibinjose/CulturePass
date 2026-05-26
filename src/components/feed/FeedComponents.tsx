// app/(tabs)/feed/_components/FeedComponents.tsx — Feed components
import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Keyboard, Share, Animated,
  type ViewStyle,
} from 'react-native';
// Reanimated intentionally NOT imported — interpolateColor worklet crashes iOS (SIGABRT via worklets::UIScheduler)
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, CardTokens, gradients } from '@/design-system/tokens/theme';
import { getCommunityHeadline, getCommunityProfilePathId } from '@/lib/community';
import { canonicalCommunityPath, canonicalEventPath, siteUrl } from '@/lib/publicPaths';
import { Button } from '@/design-system/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { timeAgo } from '@/lib/dateUtils';
import {
  subscribeComments, subscribeCommentCount,
  addComment, toggleLike, subscribeLiked, subscribeLikeCount, reportPost,
  type FeedComment, type PostCollection,
} from '@/lib/feedService';
import type { Community } from '@/shared/schema';
import { ACCENT, COUNTRY_FLAG, USE_NATIVE_DRIVER } from './feedConstants';
import { getDateLabel, getInitials, postCollection, postId } from './feedHelpers';
import type { FeedFilter, FeedPost, ListItem } from './types';

import { CommAvatar, UserAvatar } from './feedAvatars';

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { id: FeedFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; hint: string }[] = [
  { id: 'for-you', label: 'For You', icon: 'sparkles', hint: 'Show your full personalised mix of events and communities' },
  { id: 'events', label: 'Events', icon: 'calendar', hint: 'Show only event cards from the feed' },
  { id: 'communities', label: 'Communities', icon: 'people', hint: 'Show community updates, announcements, and milestones' },
];

// Inline animated chip — uses RN Animated only (Reanimated interpolateColor crashes iOS)
function FeedFilterChip({
  label, active, onPress, icon, count, colors, hint,
}: {
  label: string; active: boolean; onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count?: number;
  colors: ReturnType<typeof useColors>;
  hint: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }).start();
  }, [scale]);
  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 25 }).start();
  }, [scale]);

  const chipBg = active ? CultureTokens.indigo : colors.surface;
  const chipBorder = active ? CultureTokens.indigo : colors.borderLight;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      android_ripple={Platform.OS === 'android' ? { color: (active ? 'rgba(255,255,255,0.2)' : CultureTokens.indigo + '18'), borderless: false } : undefined}
    >
      <Animated.View style={[ffc.chip, { borderColor: chipBorder, backgroundColor: chipBg, transform: [{ scale }] }]}>
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textTertiary} accessible={false} />
        <Text style={[ffc.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
        {count != null && count > 0 && (
          <View style={[ffc.badge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surfaceElevated }]}>
            <Text style={[ffc.badgeText, { color: active ? '#fff' : colors.textTertiary }]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const ffc = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 11, minHeight: 46, borderRadius: 20, borderWidth: 1 },
  text:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 19 },
  badge:     { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', lineHeight: 14 },
});

function FeedFilterBar({ active, onChange, eventCount, commCount, colors, hPad }: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
  eventCount: number;
  commCount: number;
  colors: ReturnType<typeof useColors>;
  hPad: number;
}) {
  return (
    <View style={[fb.wrap, { backgroundColor: 'transparent' }]}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[fb.scroll, { paddingHorizontal: hPad, paddingRight: hPad + 4 }]}
        accessibilityRole="tablist"
        accessibilityLabel="Feed filters"
      >
        {FILTER_TABS.map((tab) => {
          const count = tab.id === 'events' ? eventCount : tab.id === 'communities' ? commCount : undefined;
          return (
            <FeedFilterChip
              key={tab.id}
              label={tab.label}
              active={active === tab.id}
              onPress={() => onChange(tab.id)}
              icon={tab.icon}
              count={count}
              colors={colors}
              hint={tab.hint}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap:  { paddingTop: 10, paddingBottom: 11 },
  scroll:{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 1 },
});

// ── Stories bar ───────────────────────────────────────────────────────────────

function StoriesBar({ communities, authUser, colors, isAuthenticated, onCreatePost, canPostStoryStatus, onCreateStoryPost, hPad }: {
  communities: Community[];
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  onCreatePost: () => void;
  /** Organizer, business, or admin — story-style status composer */
  canPostStoryStatus?: boolean;
  onCreateStoryPost?: () => void;
  hPad: number;
}) {
  const showStoryRing = Boolean(isAuthenticated && canPostStoryStatus && onCreateStoryPost);

  return (
    <View style={[st.wrap, { borderBottomColor: colors.borderLight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[st.scroll, { paddingHorizontal: hPad, paddingRight: hPad + 6 }]}
      >
        {/* Your story / sign in */}
        <Pressable
          style={st.item}
          onPress={onCreatePost}
          accessibilityRole="button"
          accessibilityLabel={isAuthenticated ? 'Create post' : 'Sign in to post'}
          accessibilityHint={isAuthenticated ? 'Compose an update for your community' : 'Opens sign in so you can share'}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: CultureTokens.indigo + '16', borderless: false } }
            : {})}
        >
          <View style={st.ringWrap}>
            <LinearGradient
              colors={gradients.culturepassBrand}
              style={st.ring}
            >
              <View style={[st.inner, { backgroundColor: colors.background }]}>
                {isAuthenticated && authUser?.avatarUrl
                  ? <Image source={{ uri: authUser.avatarUrl }} style={st.img} contentFit="cover" />
                  : <View style={[st.placeholder, { backgroundColor: CultureTokens.indigo + '18' }]}>
                      <Ionicons name={isAuthenticated ? 'add' : 'person'} size={20} color={CultureTokens.indigo} />
                    </View>}
              </View>
            </LinearGradient>
            {isAuthenticated && (
              <View style={[st.addDot, { backgroundColor: CultureTokens.indigo, borderColor: colors.background }]}>
                <Ionicons name="add" size={9} color="#fff" />
              </View>
            )}
          </View>
          <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
            {isAuthenticated ? 'Your Post' : 'Sign In'}
          </Text>
        </Pressable>

        {showStoryRing && (
          <Pressable
            style={st.item}
            onPress={onCreateStoryPost}
            accessibilityRole="button"
            accessibilityLabel="Create story status"
            accessibilityHint="Share a short story-style update with a portrait photo"
            {...(Platform.OS === 'android'
              ? { android_ripple: { color: CultureTokens.purple + '22', borderless: false } }
              : {})}
          >
            <LinearGradient
              colors={[CultureTokens.purple, CultureTokens.coral]}
              style={st.ring}
            >
              <View style={[st.inner, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="albums-outline" size={24} color={CultureTokens.purple} />
              </View>
            </LinearGradient>
            <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
              Story
            </Text>
          </Pressable>
        )}

        {/* Community stories */}
        {communities.slice(0, 14).map((comm, i) => {
          const accent = ACCENT[i % ACCENT.length];
          return (
            <Pressable
              key={comm.id}
              style={st.item}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push({ pathname: '/c/[id]', params: { id: getCommunityProfilePathId(comm) } });
              }}
              accessibilityRole="button"
              accessibilityLabel={comm.name}
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: accent + '28', borderless: false } }
                : {})}
            >
              <LinearGradient colors={[accent, accent + '80']} style={st.ring}>
                <View style={[st.inner, { backgroundColor: colors.background }]}>
                  <CommAvatar community={comm} size={50} colorIdx={i} />
                </View>
              </LinearGradient>
              <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
                {comm.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:        { borderBottomWidth: StyleSheet.hairlineWidth },
  scroll:      { paddingVertical: 13, gap: 14 },
  item:        { alignItems: 'center', gap: 6 },
  ringWrap:    { position: 'relative' },
  ring:        { width: 64, height: 64, borderRadius: 32, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  inner:       { width: 57, height: 57, borderRadius: 28.5, overflow: 'hidden' },
  img:         { width: 57, height: 57 },
  placeholder: { width: 57, height: 57, borderRadius: 28.5, alignItems: 'center', justifyContent: 'center' },
  addDot:      { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 11, fontFamily: 'Poppins_500Medium', maxWidth: 68, textAlign: 'center', lineHeight: 15 },
});

// ── Guest banner ──────────────────────────────────────────────────────────────

function GuestBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      style={({ pressed }) => [
        gst.wrap,
        { borderColor: CultureTokens.indigo + '30' },
        Platform.OS === 'ios' && pressed ? { opacity: 0.94 } : null,
      ]}
      onPress={() => router.push('/(onboarding)/login')}
      accessibilityRole="button"
      accessibilityLabel="Join the conversation"
      accessibilityHint="Sign in to like posts, comment, and share with your community"
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: CultureTokens.indigo + '18', borderless: false } }
        : {})}
    >
      <LinearGradient
        colors={[CultureTokens.indigo + '14', CultureTokens.teal + '0C']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[gst.iconWrap, { backgroundColor: CultureTokens.indigo + '20' }]}>
        <Ionicons name="people-circle-outline" size={22} color={CultureTokens.indigo} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[gst.title, { color: colors.text }]}>Join the conversation</Text>
        <Text style={[gst.sub, { color: colors.textSecondary }]}>Like, comment, and share with your community</Text>
      </View>
      <View style={[gst.cta, { backgroundColor: CultureTokens.indigo }]}>
        <Text style={gst.ctaText}>Sign In</Text>
      </View>
    </Pressable>
  );
}

const gst = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  sub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 15 },
  cta:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  ctaText:  { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 17 },
});

// ── Trending interstitial ─────────────────────────────────────────────────────

function TrendingInterstitial({ city, colors }: { city: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      onPress={() => router.push('/events')}
      style={({ pressed }) => [
        ti.wrap,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'ios' && pressed ? { opacity: 0.92 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={city ? `Trending events in ${city}` : 'Trending events near you'}
      accessibilityHint="Opens the events browse screen"
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: CultureTokens.gold + '28', borderless: false } }
        : {})}
    >
      <LinearGradient
        colors={[CultureTokens.gold + '12', CultureTokens.coral + '08']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <View style={[ti.iconWrap, { backgroundColor: CultureTokens.gold + '20' }]}>
        <Ionicons name="flame" size={20} color={CultureTokens.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ti.title, { color: colors.text }]}>
          Trending{city ? ` in ${city}` : ' near you'}
        </Text>
        <Text style={[ti.sub, { color: colors.textSecondary }]}>
          {"Discover what's popular this week"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} accessible={false} />
    </Pressable>
  );
}

const ti = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 10,
    minHeight: 74,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  sub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 16 },
});

// ── Report modal ──────────────────────────────────────────────────────────────


// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.9,  duration: 850, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(anim, { toValue: 0.35, duration: 850, useNativeDriver: USE_NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const bg = { backgroundColor: colors.borderLight, opacity: anim };
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={sk.header}>
        <Animated.View style={[sk.avatar, bg]} />
        <View style={{ flex: 1, gap: 7 }}>
          <Animated.View style={[sk.line, { width: '52%' }, bg]} />
          <Animated.View style={[sk.line, { width: '33%' }, bg]} />
        </View>
      </View>
      <Animated.View style={[sk.image, bg]} />
      <View style={sk.bodyPad}>
        <Animated.View style={[sk.line, { width: '88%' }, bg]} />
        <Animated.View style={[sk.line, { width: '65%', marginTop: 6 }, bg]} />
        <Animated.View style={[sk.viewBtn, { marginTop: 10 }, bg]} />
      </View>
      <View style={[sk.reactions, { borderTopColor: colors.borderLight }]}>
        {[0, 1, 2].map((i) => <Animated.View key={i} style={[sk.reactionBtn, bg]} />)}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 18, marginHorizontal: Platform.OS === 'web' ? 0 : 12 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  avatar:     { width: 38, height: 38, borderRadius: 19 },
  image:      { height: 200 },
  bodyPad:    { padding: 14 },
  line:       { height: 12, borderRadius: 6 },
  viewBtn:    { height: 32, width: 120, borderRadius: 20 },
  reactions:  { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 16 },
  reactionBtn:{ height: 22, width: 56, borderRadius: 6 },
});


// ── Feed list header (stories + create post + guest banner + divider) ─────────

function FeedListHeader({ communities, authUser, colors, isAuthenticated, hPad, city, onCreatePost, canPostStoryStatus, onCreateStoryPost }: {
  communities: Community[]; authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>; isAuthenticated: boolean;
  hPad: number; city: string; onCreatePost: () => void;
  canPostStoryStatus?: boolean;
  onCreateStoryPost?: () => void;
}) {
  return (
    <View>
      <StoriesBar
        communities={communities}
        authUser={authUser}
        colors={colors}
        isAuthenticated={isAuthenticated}
        onCreatePost={onCreatePost}
        canPostStoryStatus={canPostStoryStatus}
        onCreateStoryPost={onCreateStoryPost}
        hPad={hPad}
      />

      {/* Guest banner (posting happens via + button / story entry) */}
      <View style={[flh.createWrap, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        {!isAuthenticated && <GuestBanner colors={colors} />}
      </View>

      {/* Section header */}
      <View style={[flh.divider, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={[flh.divLine, { backgroundColor: colors.borderLight }]} />
        <View style={[flh.divPill, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="sparkles" size={10} color={CultureTokens.indigo} />
          <Text style={[flh.divText, { color: colors.textTertiary }]}>Culture feed</Text>
        </View>
        <View style={[flh.divLine, { backgroundColor: colors.borderLight }]} />
      </View>
    </View>
  );
}

const flh = StyleSheet.create({
  createWrap: { gap: 12, paddingTop: 10, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divLine:    { flex: 1, height: StyleSheet.hairlineWidth },
  divPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  divText:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────


// ── Re-exports for use in parent screen ──────────────────────────────────────
export { FeedFilterBar, SkeletonCard, FeedListHeader, TrendingInterstitial, COUNTRY_FLAG, ACCENT };
export { PostCard } from './PostCard';
export { CreatePostModal } from './CreatePostModal';
export { useAuthGate } from './feedHooks';
export type { FeedFilter, FeedPost, ListItem };

