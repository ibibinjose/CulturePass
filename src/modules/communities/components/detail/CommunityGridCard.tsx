import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { CultureTokens, shadows } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import {
  getCommunityActivityMeta,
  getCommunityLabel,
  getCommunityMemberCount,
} from '@/lib/community';
import type { Community } from '@/shared/schema';

// Deterministic gradient derived from first char of community name
const COVER_GRADIENTS: [string, string][] = [
  [CultureTokens.indigo, '#1B0F2E'],
  [CultureTokens.gold, '#6B3A0A'],
  [CultureTokens.coral, '#6B1A18'],
  [CultureTokens.teal, '#0D3B35'],
  [CultureTokens.gold, '#6B4600'],
];

function coverGradient(name: string): [string, string] {
  const idx = (name.charCodeAt(0) ?? 0) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[idx];
}

interface CommunityGridCardProps {
  item: Community;
  width: number;
  onPress: (item: Community) => void;
}

function CommunityGridCardComponent({ item, width, onPress }: CommunityGridCardProps) {
  const colors = useColors();
  const members = getCommunityMemberCount(item);
  const activity = getCommunityActivityMeta(item);
  const gradient = coverGradient(item.name ?? 'C');
  const initial = (item.name ?? 'C').charAt(0).toUpperCase();
  const label = getCommunityLabel(item);
  const description = item.headline ?? item.description ?? '';

  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? FadeInDown.duration(350).springify() : undefined}
      style={[styles.cardOuter, { width }]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.992 : 1 }],
          },
        ]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} community`}
      >
        {/* Cover: 160px with gradient overlay + title */}
        <View style={styles.cover}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={gradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.82)']}
            style={[StyleSheet.absoluteFill, styles.coverGradientBottom]}
          />
          {!item.imageUrl && (
            <View style={styles.initialWrap}>
              <Text style={styles.initialText}>{initial}</Text>
            </View>
          )}
          {label ? (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{label}</Text>
            </View>
          ) : null}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
          <View style={styles.coverFooter}>
            <Text style={styles.coverName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.coverMembersRow}>
              <Ionicons name="people" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.coverMembersText}>
                {members > 0 ? members.toLocaleString() : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info area below image */}
        <View style={styles.cardInfo}>
          {description ? (
            <Text
              style={[styles.cardDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={[styles.activityPill, { backgroundColor: activity.color + '22' }]}>
              <Text style={[styles.activityLabel, { color: activity.color }]}>
                {activity.label}
              </Text>
            </View>
            <View style={styles.viewLinkRow}>
              <Text style={[styles.viewLinkText, { color: CultureTokens.indigo }]}>View</Text>
              <Ionicons name="arrow-forward" size={11} color={CultureTokens.indigo} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 0,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.medium,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  cover: {
    height: 160,
    backgroundColor: '#1B0F2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverGradientBottom: {
    top: '40%', // Allow string for percentage, safe for RN style
  },
  initialWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CultureTokens.indigo,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  coverName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    letterSpacing: -0.2,
  },
  coverMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  coverMembersText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  cardInfo: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 13,
    gap: 9,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activityLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewLinkText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export const CommunityGridCard = React.memo(CommunityGridCardComponent);
export default CommunityGridCard;
