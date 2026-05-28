import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Luxe, luxeDark } from '@/design-system/tokens/theme';
import { LuxeCard, LuxeText } from '@/design-system/ui';
import { CultureImage } from '@/design-system/ui/CultureImage';
import type { Community } from '@/shared/schema';
import { getCommunityProfilePathId, getCommunityMemberCount } from '@/lib/community';

interface LuxeCommunityCardProps {
  community: Community;
  variant?: 'default' | 'tonal' | 'glass';
}

export function LuxeCommunityCard({ community, variant = 'default' }: LuxeCommunityCardProps) {
  const handlePress = () => {
    router.push({
      pathname: '/c/[id]',
      params: { id: getCommunityProfilePathId(community) },
    });
  };

  const members = getCommunityMemberCount(community);

  return (
    <LuxeCard
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
          <View style={[styles.imagePlaceholder, { backgroundColor: Luxe.colors.indigo + '20' }]}>
             <LuxeText variant="display" style={{ color: Luxe.colors.indigo }}>
               {community.name.charAt(0).toUpperCase()}
             </LuxeText>
          </View>
        )}
        {community.isVerified && (
          <View style={[styles.badge, { backgroundColor: Luxe.colors.terracotta }]}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <LuxeText variant="bodyMedium" style={{ color: luxeDark.text }} numberOfLines={1}>
          {community.name}
        </LuxeText>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={Luxe.colors.terracotta} />
          <LuxeText variant="caption" style={{ color: luxeDark.textSecondary }}>
            {members.toLocaleString()} members
          </LuxeText>
        </View>
        {community.city && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={luxeDark.textTertiary} />
            <LuxeText variant="caption" style={{ color: luxeDark.textTertiary }} numberOfLines={1}>
              {community.city}
            </LuxeText>
          </View>
        )}
      </View>
    </LuxeCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: luxeDark.surfaceElevated,
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
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  content: {
    padding: 12,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
