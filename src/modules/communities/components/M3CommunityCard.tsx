import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { M3Typography } from '@/design-system/tokens/typography';
import { useM3Colors } from '@/hooks/useM3Colors';
import { router } from 'expo-router';
import type { Community } from '@/shared/schema';
import { getCommunityProfilePathId, getCommunityMemberCount } from '@/lib/community';

interface M3CommunityCardProps {
  community: Community;
  variant?: 'elevated' | 'filled' | 'outlined';
}

export function M3CommunityCard({ community, variant = 'filled' }: M3CommunityCardProps) {
  const colors = useM3Colors();

  const handlePress = () => {
    router.push({
      pathname: '/c/[id]',
      params: { id: getCommunityProfilePathId(community) },
    });
  };

  const members = getCommunityMemberCount(community);

  return (
    <M3Card
      variant={variant}
      onPress={handlePress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {community.imageUrl ? (
          <CultureImage
            uri={community.imageUrl}
            style={styles.image}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryContainer }]}>
             <Text style={[M3Typography.displaySmall, { color: colors.onPrimaryContainer }]}>
               {community.name.charAt(0).toUpperCase()}
             </Text>
          </View>
        )}
        {community.isVerified && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[M3Typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            {members.toLocaleString()} members
          </Text>
        </View>
        {community.city && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {community.city}
            </Text>
          </View>
        )}
      </View>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Community cards often look good as squares
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
});
