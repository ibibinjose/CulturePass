/**
 * EventPublisherLogo — white square brand logo tile, bottom-right of event card image.
 *
 * Matches the UNiDAYS brand logo pattern: a white rounded square with the
 * publisher profile's imageUrl inside, or a coloured initial box as fallback.
 *
 * Uses the same React Query key as EventPublisherLine so the profile fetch
 * is always deduplicated — zero extra network requests.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { getCommunityProfilePathId } from '@/lib/community';
import { eventsApi } from '@/modules/events/api';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import type { Profile } from '@/shared/schema';

type Props = {
  profileId: string;
  /** Size of the white square in dp. Default 46. */
  size?: number;
  /** Fallback accent color when no image (hex string). */
  fallbackColor?: string;
  /** Fallback initial letter when no profile found. */
  fallbackInitial?: string;
};

export function EventPublisherLogo({
  profileId,
  size = 46,
  fallbackColor = CultureTokens.violet,
  fallbackInitial,
}: Props) {
  const { data: profile } = useQuery({
    queryKey: ['/api/profiles', profileId],
    queryFn: () => eventsApi.profiles.get(profileId) as Promise<Profile>,
    enabled: !!profileId,
    staleTime: 120_000,
  });

  const initial = fallbackInitial ?? profile?.name?.charAt(0)?.toUpperCase() ?? '?';

  const isCommunity = profile?.entityType === 'community';
  const communityPathId = profile && isCommunity ? getCommunityProfilePathId(profile) : null;

  const tile = (
    <View style={[styles.box, { width: size, height: size }]}>
      {profile?.imageUrl ? (
        <Image
          source={{ uri: profile.imageUrl }}
          style={styles.img}
          contentFit="contain"
          recyclingKey={`pub-logo-${profileId}`}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { backgroundColor: fallbackColor + '22' },
          ]}
        >
          <Text style={[styles.initial, { color: fallbackColor, fontSize: Math.round(size * 0.38) }]}>
            {initial}
          </Text>
        </View>
      )}
    </View>
  );

  if (!communityPathId) {
    return tile;
  }

  return (
    <Pressable
      onPress={(e) => {
        if (typeof (e as { stopPropagation?: () => void }).stopPropagation === 'function') {
          (e as { stopPropagation: () => void }).stopPropagation();
        }
        router.push({ pathname: '/c/[id]', params: { id: communityPathId } });
      }}
      accessibilityRole="link"
      accessibilityLabel={profile?.name ? `Open ${profile.name} community` : 'Open community'}
      hitSlop={6}
      style={({ pressed }) => [pressed && { opacity: 0.9 }, Platform.OS === 'web' && { cursor: 'pointer' as const }]}
    >
      {tile}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(0,45,80)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 2px 8px 0px rgba(0, 45, 80, 0.12)' } as any,
    }),
  },
  img: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: FontFamily.bold,
  },
});
