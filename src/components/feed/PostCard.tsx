import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Keyboard, Share, Animated,
  type ViewStyle,
} from 'react-native';
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
} from '@/lib/feedService';
import type { Community } from '@/shared/schema';
import { ACCENT, COUNTRY_FLAG, USE_NATIVE_DRIVER } from './feedConstants';
import { getDateLabel, getInitials, postCollection, postId } from './feedHelpers';
import type { FeedPost } from './types';

import { useDebounced, useAuthGate } from './feedHooks';
import { CommAvatar } from './feedAvatars';
import { ReportModal, PostMoreMenu } from './feedPostModals';
import { ReactionsBar } from './PostReactionsBar';

// ── Post card header ──────────────────────────────────────────────────────────

export function PostCardHeader({ post, accent, colors, colorIdx, onMorePress }: {
  post: FeedPost; accent: string; colors: ReturnType<typeof useColors>;
  colorIdx: number; onMorePress: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const badge = post.kind === 'event'
    ? { icon: 'calendar-outline' as const, label: 'Event',  color: CultureTokens.gold }
    : post.kind === 'announcement'
      ? post.postStyle === 'story'
        ? { icon: 'aperture-outline' as const, label: 'Story', color: CultureTokens.purple }
        : { icon: 'megaphone-outline' as const, label: 'Update', color: CultureTokens.teal }
      : null;
  const showMatch = isAuthenticated && (post.matchReason?.length ?? 0) > 0 && (post.score ?? 0) > 0.35;

  return (
    <View style={ph.row}>
      <CommAvatar community={post.community} size={42} colorIdx={colorIdx} />
      <View style={ph.info}>
        <View style={ph.nameRow}>
          <Text style={[ph.name, { color: colors.text }]} numberOfLines={1}>{post.community.name}</Text>
          {post.community.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={CultureTokens.indigo} />
          )}
        </View>
        <View style={ph.metaRow}>
          <Text style={[ph.time, { color: colors.textTertiary }]}>{timeAgo(post.createdAt)}</Text>
          {badge && (
            <>
              <Text style={[ph.sep, { color: colors.textTertiary }]}>·</Text>
              <View style={[ph.pill, { backgroundColor: badge.color + '18' }]}>
                <Ionicons name={badge.icon} size={9} color={badge.color} />
                <Text style={[ph.pillText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </>
          )}
          {showMatch && (
            <>
              <Text style={[ph.sep, { color: colors.textTertiary }]}>·</Text>
              <View style={[ph.pill, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="sparkles" size={9} color={CultureTokens.indigo} />
                <Text style={[ph.pillText, { color: CultureTokens.indigo }]} numberOfLines={1}>
                  {post.matchReason![0]}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      <Pressable
        onPress={onMorePress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Post options"
        style={ph.moreBtn}
        {...(Platform.OS === 'android'
          ? { android_ripple: { color: CultureTokens.indigo + '18', borderless: true } }
          : {})}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const ph = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  info:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:    { fontSize: 14, fontFamily: 'Poppins_700Bold', flex: 1, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  time:    { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  sep:     { fontSize: 12, lineHeight: 16 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillText:{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', lineHeight: 14 },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Post card ─────────────────────────────────────────────────────────────────

// -- PostCard Memoized --
function PostCardInner({ post, colorIdx }: { post: FeedPost; colorIdx: number }) {
  const colors = useColors();
  const isDark = useIsDark();
  const accent = ACCENT[colorIdx % ACCENT.length];
  const { user, isAuthenticated } = useAuth();
  const gate = useAuthGate();

  const [hidden,     setHidden]     = useState(false);
  const [showMore,   setShowMore]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  const isOwn = isAuthenticated && user?.id === (post as { authorId?: string }).authorId;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (post.kind === 'event') {
      router.push({ pathname: '/e/[id]', params: { id: post.event.id } });
    } else {
      router.push({ pathname: '/c/[id]', params: { id: getCommunityProfilePathId(post.community) } });
    }
  }, [post]);

  const handleReport   = useCallback((reason: string) => {
    if (!user) return;
    reportPost(user.id, postId(post), postCollection(post.kind), reason).catch(() => {});
  }, [user, post]);

  const handleMorePress = useCallback(() => { gate(() => setShowMore(true)); }, [gate]);

  if (hidden) return null;

  const renderContent = () => {
    switch (post.kind) {
      case 'event': {
        const ev = post.event;
        const dateLabel = getDateLabel(ev.date);
        const isFree    = ev.isFree || ev.priceCents === 0;
        return (
          <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`View event: ${ev.title}`}>
            {/* Hero image */}
            <View style={pcd.eventImg}>
              <Image
                source={{ uri: ev.imageUrl ?? undefined }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
              {/* Bottom gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.35 }}
              />

              {/* Top-left: category / date badge */}
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={pcd.datePill}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={pcd.datePillText}>{dateLabel}</Text>
              </BlurView>

              {/* Top-right: price pill */}
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={[pcd.pricePill, { backgroundColor: isFree ? CultureTokens.teal + 'AA' : accent + 'AA' }]}>
                <Text style={pcd.pricePillText}>{isFree ? 'Free' : ev.priceLabel ?? 'Tickets'}</Text>
              </BlurView>

              {/* Bottom-left: venue + city */}
              <View style={pcd.eventFooter}>
                <View style={pcd.eventInfoRow}>
                  <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={pcd.eventInfoText} numberOfLines={1}>
                    {[ev.venue, ev.city].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {(ev.attending ?? 0) > 0 && (
                  <View style={pcd.eventInfoRow}>
                    <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.8)" />
                    <Text style={pcd.eventInfoText}>{ev.attending} going</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card body */}
            <View style={pcd.eventBody}>
              <Text style={[pcd.eventTitle, { color: colors.text }]} numberOfLines={2}>{ev.title}</Text>
              {/* Meta: date + time */}
              <View style={pcd.eventMeta}>
                <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]}>
                  {dateLabel}{ev.time ? ` at ${ev.time}` : ''}
                </Text>
                {ev.venue ? (
                  <>
                    <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]}>·</Text>
                    <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                    <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]} numberOfLines={1}>{ev.venue}</Text>
                  </>
                ) : null}
              </View>
              <View style={[pcd.viewRow, { borderColor: accent + '60', backgroundColor: accent + '10' }]}>
                <Text style={[pcd.viewText, { color: accent }]}>View Event</Text>
                <Ionicons name="arrow-forward" size={14} color={accent} />
              </View>
            </View>
          </Pressable>
        );
      }

      case 'announcement': {
        if (post.postStyle === 'story') {
          return (
            <Pressable onPress={handlePress}>
              {post.imageUrl ? (
                <View style={pcd.storyFrame}>
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={pcd.storyImg}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.82)']}
                    style={pcd.storyGradient}
                    start={{ x: 0.5, y: 0.35 }}
                  />
                  <View style={pcd.storyCaption}>
                    <Text style={pcd.storyCaptionText}>{post.body}</Text>
                  </View>
                </View>
              ) : (
                <View style={[pcd.storyTextCard, { borderColor: accent + '35', backgroundColor: accent + '10' }]}>
                  <Ionicons name="chatbox-ellipses-outline" size={26} color={accent} style={pcd.storyTextCardIcon} />
                  <Text style={[pcd.storyTextCardBody, { color: colors.text }]}>{post.body}</Text>
                </View>
              )}
            </Pressable>
          );
        }
        const MAX_LINES = 4;
        return (
          <Pressable onPress={handlePress}>
            {post.imageUrl && (
              <Image
                source={{ uri: post.imageUrl }}
                style={pcd.postImg}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={pcd.announcementBody}>
              <Text
                style={[pcd.announcementText, { color: colors.text }]}
                numberOfLines={bodyExpanded ? undefined : MAX_LINES}
              >
                {post.body}
              </Text>
              {!bodyExpanded && post.body.length > 180 && (
                <Pressable onPress={(e) => { e.stopPropagation?.(); setBodyExpanded(true); }}>
                  <Text style={[pcd.readMore, { color: accent }]}>Read more</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      }

      case 'welcome':
        return (
          <Pressable onPress={handlePress} style={pcd.welcomeWrap}>
            <LinearGradient colors={[accent + '1C', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={[pcd.welcomeIconWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name="people" size={28} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[pcd.welcomeTitle, { color: colors.text }]}>Welcome to {post.community.name}!</Text>
              <Text style={[pcd.welcomeSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {getCommunityHeadline(post.community)}
              </Text>
            </View>
          </Pressable>
        );

      case 'milestone':
        return (
          <Pressable onPress={handlePress} style={[pcd.milestoneWrap, { borderColor: accent + '30', backgroundColor: accent + '0A' }]}>
            <LinearGradient colors={[accent + '20', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pcd.milestoneIcon, { backgroundColor: accent + '22' }]}>
              <Ionicons name="trophy" size={24} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[pcd.milestoneTitle, { color: colors.text }]}>
                🎉 {post.community.name} reached {post.members.toLocaleString()} members!
              </Text>
              <Text style={[pcd.milestoneSub, { color: colors.textSecondary }]}>Be part of the growing community</Text>
            </View>
          </Pressable>
        );

      case 'collection-highlight':
        return (
          <Pressable onPress={handlePress} style={[pcd.milestoneWrap, { borderColor: CultureTokens.gold + '40', backgroundColor: CultureTokens.gold + '08', padding: 18 }]}>
            <LinearGradient colors={[CultureTokens.gold + '15', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pcd.milestoneIcon, { backgroundColor: CultureTokens.gold + '20', width: 56, height: 56, borderRadius: 18 }]}>
              <Ionicons name="ribbon" size={28} color={CultureTokens.gold} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[pcd.milestoneTitle, { color: colors.text, fontSize: 15 }]}>
                {post.userName} earned the {post.tokenName} Explorer Token!
              </Text>
              <Text style={[pcd.milestoneSub, { color: colors.textSecondary }]}>Shared to {post.community.name}</Text>
            </View>
          </Pressable>
        );
    }
  };

  // Mobile: full-bleed borderless post. Desktop/web: card with shadow.
  const isMobile = Platform.OS !== 'web';
  const cardStyle = isMobile
    ? {
        backgroundColor: colors.surface,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: 16,
        marginHorizontal: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
          android: { elevation: 2 },
          default: {},
        }),
      }
    : {
        backgroundColor: colors.surface,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: 20,
        overflow: 'hidden' as const,
        ...Platform.select<ViewStyle>({
          web: (isDark
            ? { boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }
            : { boxShadow: '0 8px 24px rgba(44,42,114,0.12)' }) as ViewStyle,
          ios: isDark
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }
            : { shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
          android: { elevation: 3 },
          default: isDark
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }
            : { shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        }),
      };

  return (
    <>
      <View style={[pcd.card, cardStyle]}>
        <PostCardHeader post={post} accent={accent} colors={colors} colorIdx={colorIdx} onMorePress={handleMorePress} />
        {renderContent()}
        <ReactionsBar post={post} colors={colors} />
      </View>

      <PostMoreMenu
        visible={showMore}
        onClose={() => setShowMore(false)}
        onReport={() => setShowReport(true)}
        onHide={() => setHidden(true)}
        isOwn={isOwn}
        colors={colors}
      />
      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        onReport={handleReport}
        colors={colors}
      />
    </>
  );
}

PostCardInner.displayName = 'PostCard';
export const PostCard = React.memo(
  PostCardInner,
  (prev, next) => {
    const a = prev.post;
    const b = next.post;
    if (prev.colorIdx !== next.colorIdx) return false;
    if (a.id !== b.id || a.kind !== b.kind || a.createdAt !== b.createdAt) return false;

    if (a.kind === 'event' && b.kind === 'event') {
      return (
        a.event.id === b.event.id &&
        a.event.title === b.event.title &&
        a.event.imageUrl === b.event.imageUrl &&
        a.event.attending === b.event.attending &&
        a.event.date === b.event.date &&
        a.event.time === b.event.time
      );
    }
    if (a.kind === 'announcement' && b.kind === 'announcement') {
      return (
        a.body === b.body &&
        a.imageUrl === b.imageUrl &&
        a.postStyle === b.postStyle &&
        a.likesCount === b.likesCount &&
        a.commentsCount === b.commentsCount
      );
    }
    if (a.kind === 'milestone' && b.kind === 'milestone') {
      return a.members === b.members && a.community.id === b.community.id;
    }
    if (a.kind === 'welcome' && b.kind === 'welcome') {
      return a.community.id === b.community.id;
    }
    if (a.kind === 'collection-highlight' && b.kind === 'collection-highlight') {
      return (
        a.tokenName === b.tokenName &&
        a.userName === b.userName &&
        a.community.id === b.community.id
      );
    }
    return false;
  },
);

const pcd = StyleSheet.create({
  card: {},

  // ── Event ─────────────────────────────────────────────────────────────────
  eventImg:     { height: Platform.OS === 'web' ? 260 : 320, position: 'relative', backgroundColor: '#0D0D14' },
  datePill:     { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  datePillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: 'rgba(255,255,255,0.95)', lineHeight: 15 },
  pricePill:    { position: 'absolute', top: 14, right: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pricePillText:{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 15 },
  eventFooter:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 5 },
  eventInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventInfoText:{ fontSize: 13, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.9)', flex: 1, lineHeight: 18 },
  eventBody:    { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 10 },
  eventTitle:   { fontSize: 19, fontFamily: 'Poppins_700Bold', lineHeight: 27, letterSpacing: -0.3 },
  eventMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText:{ fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  viewRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, marginBottom: 4 },
  viewText:     { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },

  // ── Announcement ──────────────────────────────────────────────────────────
  postImg:         { height: 260, width: '100%', backgroundColor: '#0D0D14' },
  storyFrame:      { width: '100%', aspectRatio: 9 / 16, maxHeight: 520, backgroundColor: '#0D0D14', position: 'relative' },
  storyImg:        { ...StyleSheet.absoluteFill },
  storyGradient:   { ...StyleSheet.absoluteFill },
  storyCaption:    { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 18 },
  storyCaptionText:{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22, color: '#fff' },
  storyTextCard:   { marginHorizontal: 16, marginBottom: 12, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  storyTextCardIcon: { marginBottom: 6 },
  storyTextCardBody:{ fontSize: 17, fontFamily: 'Poppins_600SemiBold', lineHeight: 24, textAlign: 'center' },
  announcementBody:{ paddingHorizontal: 16, paddingVertical: 14 },
  announcementText:{ fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 23, letterSpacing: 0.1 },
  readMore:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 6, lineHeight: 20 },

  // ── Welcome ───────────────────────────────────────────────────────────────
  welcomeWrap:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, overflow: 'hidden' },
  welcomeIconWrap:{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  welcomeSub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginTop: 3 },

  // ── Milestone / Collection ────────────────────────────────────────────────
  milestoneWrap: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 6, padding: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  milestoneIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle:{ fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  milestoneSub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
});
