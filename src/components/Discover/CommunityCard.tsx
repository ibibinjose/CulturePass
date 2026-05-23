import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { GlassView } from '@/design-system/ui/GlassView';
import { SaveToggle } from '@/design-system/ui/SaveToggle';
import { LikeToggle } from '@/design-system/ui/LikeToggle';
import { useLikes } from '@/contexts/LikesContext';
import type { Community } from '@/shared/schema';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityMemberCount,
  getCommunityProfilePathId,
  getCommunitySignals,
} from '@/lib/community';
import { useSaved } from '@/contexts/SavedContext';

interface CommunityCardProps {
  community: Community;
  index?: number;
}

function CommunityCard({ community, index = 0 }: CommunityCardProps) {
  const colors = useColors();
  const { isCommunityBookmarked, toggleSaveCommunityBookmark } = useSaved();
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(community.id);
  const bookmarked = isCommunityBookmarked(community.id);
  const accent = getCommunityAccent(community, colors.primary);
  const members = getCommunityMemberCount(community);
  const upcomingEvents = getCommunityEventsCount(community);
  const activity = getCommunityActivityMeta(community);
  const signals = getCommunitySignals(community);

  const initial = (community.name ?? '?').charAt(0).toUpperCase();

  const handleCardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push({
      pathname: '/c/[id]',
      params: { id: getCommunityProfilePathId(community) },
    });
  };

  const handleBookmarkPress = (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    toggleSaveCommunityBookmark(community.id);
  };

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && styles.cardPressed,
          Platform.OS !== 'web' && Colors.shadows.medium,
        ]}
        onPress={handleCardPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${community.name} community`}
      >
        {/* Cover area */}
        <View style={[styles.cover, { backgroundColor: colors.backgroundSecondary }]}>
          {community.imageUrl ? (
            <Image
              source={{ uri: community.imageUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={300}
              accessibilityLabel={`${community.name} cover image`}
            />
          ) : (
            <LinearGradient
              colors={[accent + 'CC', accent + '66']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.coverBottomGradient}
          />

          {/* Initial letter fallback */}
          {!community.imageUrl && (
            <View style={styles.initialWrap} pointerEvents="none">
              <Text style={styles.initialText}>{initial}</Text>
            </View>
          )}

          {/* Top-left: type badge */}
          {signals.length > 0 && (
            <GlassView intensity={30} colorScheme="dark" style={styles.typeBadge}>
              <Text style={styles.typeBadgeText} numberOfLines={1}>
                {signals[0]}
              </Text>
            </GlassView>
          )}

          {/* Top-right: verified badge */}
          {community.isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Info strip */}
        <View style={styles.infoStrip}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.communityName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {community.name}
            </Text>
            {community.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {members.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {upcomingEvents > 0 ? upcomingEvents.toLocaleString() : '0'}
              </Text>
            </View>
            {(community as any).discoverySignals?.mutualMembersCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="git-network-outline" size={13} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.primary }]}>
                  {(community as any).discoverySignals.mutualMembersCount} mutual
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.activityPill, { backgroundColor: accent + '16', borderColor: accent + '30', borderWidth: 1 }]}>
            <Text style={[styles.activityText, { color: accent }]} numberOfLines={1}>
              {activity.label.toUpperCase()}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.floatingActions}>
        <LikeToggle liked={liked} onToggle={() => toggleLike(community.id)} tone="glass" size="md" />
        <SaveToggle saved={bookmarked} onToggle={handleBookmarkPress} tone="glass" size="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    position: 'relative',
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
        web: {
            transition: 'all 0.2s ease',
        }
    })
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  cover: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverBottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  initialWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontSize: 52,
    fontFamily: FontFamily.bold,
    color: 'rgba(255,255,255,0.9)',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: CultureTokens.indigo,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 118,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  infoStrip: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    height: 108,
    justifyContent: 'space-between',
  },
  communityName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    lineHeight: 20,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 22,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  activityPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityText: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
  },
});

export default React.memo(CommunityCard);
