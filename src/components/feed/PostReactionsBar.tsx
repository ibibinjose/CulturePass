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
import { CommentsSheet } from './CommentsSheet';

// ── Reactions bar ─────────────────────────────────────────────────────────────

export function ReactionsBar({ post, colors }: { post: FeedPost; colors: ReturnType<typeof useColors> }) {
  const { isAuthenticated, user } = useAuth();
  const gate  = useAuthGate();
  const pid   = postId(post);
  const pcol  = postCollection(post.kind);
  const initLikes    = post.kind === 'announcement' ? (post.likesCount    ?? 0) : 0;
  const initComments = post.kind === 'announcement' ? (post.commentsCount ?? 0) : 0;

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(initLikes);
  const [commentCount, setCommentCount] = useState(initComments);
  const [showComments, setShowComments] = useState(false);
  const [likeError,    setLikeError]    = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    return subscribeLiked(pid, pcol, user.id, setLiked);
  }, [isAuthenticated, user?.id, pid, pcol]);

  useEffect(() => {
    return subscribeLikeCount(pid, pcol, (n) => { if (n > 0) setLikeCount(n); });
  }, [pid, pcol]);

  useEffect(() => {
    return subscribeCommentCount(pid, pcol, (n) => { if (n > 0) setCommentCount(n); });
  }, [pid, pcol]);

  const doToggleLike = useCallback(async () => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((v) => Math.max(0, wasLiked ? v - 1 : v + 1));
    setLikeError(false);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.5, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: USE_NATIVE_DRIVER, speed: 25 }),
    ]).start();
    try {
      await toggleLike(pid, pcol, user.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((v) => Math.max(0, wasLiked ? v + 1 : v - 1));
      setLikeError(true);
    }
  }, [user, liked, pid, pcol, scaleAnim]);

  const debouncedLike = useDebounced(doToggleLike, 500);
  const handleLike    = useCallback(() => { gate(debouncedLike); }, [gate, debouncedLike]);
  const handleComment = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  }, []);
  const handleShare   = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isEvent  = post.kind === 'event';
    const title    = isEvent ? post.event.title : `${post.community.name} update`;
    const shareUrl = isEvent
      ? siteUrl(canonicalEventPath(post.event))
      : siteUrl(canonicalCommunityPath(post.community));
    const message  = isEvent
      ? `Check out "${post.event.title}" on CulturePass!\n\n${shareUrl}`
      : `Check out this update from ${post.community.name} on CulturePass!\n\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title, text: message, url: shareUrl });
      } else {
        await Share.share({ title, message, url: shareUrl });
      }
    } catch { /* user cancelled */ }
  }, [post]);

  const likeColor    = likeError ? CultureTokens.coral + '80' : liked ? '#E0245E' : colors.textSecondary;
  const commentColor = colors.textSecondary;
  const shareColor   = colors.textSecondary;

  return (
    <>
      {/* Like count summary (Facebook style — shows above buttons if likes > 0) */}
      {likeCount > 0 && (
        <View style={[rxn.likeSummary, { borderTopColor: colors.borderLight }]}>
          <Ionicons name="heart" size={14} color="#E0245E" />
          <Text style={[rxn.likeSummaryText, { color: colors.textTertiary }]}>
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            {commentCount > 0 ? `  ·  ${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
      )}

      <View style={[rxn.wrap, { borderTopColor: colors.borderLight }]}>
        {/* Like */}
        <Pressable
          style={rxn.btn}
          onPress={handleLike}
          accessibilityRole="button"
          accessibilityLabel={`Like — ${likeCount} likes`}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: (liked ? '#E0245E' : colors.textSecondary) + '22', borderless: false } }
            : {})}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={21} color={likeColor} />
          </Animated.View>
          <Text style={[rxn.btnLabel, { color: likeColor, fontFamily: liked ? 'Poppins_700Bold' : 'Poppins_500Medium' }]}>
            Like
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          style={rxn.btn}
          onPress={handleComment}
          accessibilityRole="button"
          accessibilityLabel={`Comment — ${commentCount} comments`}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: colors.textSecondary + '22', borderless: false } }
            : {})}
        >
          <Ionicons name="chatbubble-outline" size={20} color={commentColor} />
          <Text style={[rxn.btnLabel, { color: commentColor }]}>Comment</Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={rxn.btn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: colors.textSecondary + '22', borderless: false } }
            : {})}
        >
          <Ionicons name="share-social-outline" size={21} color={shareColor} />
          <Text style={[rxn.btnLabel, { color: shareColor }]}>Share</Text>
        </Pressable>
      </View>

      <CommentsSheet visible={showComments} onClose={() => setShowComments(false)} post={post} colors={colors} />
    </>
  );
}

const rxn = StyleSheet.create({
  likeSummary:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  likeSummaryText: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  wrap:            { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  btn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, minHeight: 48 },
  btnLabel:        { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
});
