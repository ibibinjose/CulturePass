import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { getCommunityProfilePathId } from '@/lib/community';
import { eventsApi } from '@/modules/events/api';
import { Spacing, FontFamily, FontSize } from '@/design-system/tokens/theme';
import type { Profile } from '@/shared/schema';

export type EventPublisherLineVariant = 'default' | 'compact' | 'onDark';

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaCompact: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    marginTop: 0,
  },
  metaOnDark: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.chip,
    flex: 1,
  },
  metaTextCompact: {
    fontSize: FontSize.caption,
  },
  metaTextOnDark: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    flexShrink: 1,
    maxWidth: '90%',
    textAlign: 'center',
  },
});

/**
 * Organiser line when `event.publisherProfileId` is set (React Query dedupes fetches by profile id).
 */
export function EventPublisherLine({
  profileId,
  variant = 'default',
}: {
  profileId: string;
  variant?: EventPublisherLineVariant;
}) {
  const colors = useColors();
  const { data: profile } = useQuery({
    queryKey: ['/api/profiles', profileId],
    queryFn: () => eventsApi.profiles.get(profileId) as Promise<Profile>,
    enabled: !!profileId,
    staleTime: 120_000,
  });
  if (!profile?.name) return null;

  const isCommunity = profile.entityType === 'community';
  const communityPathId = isCommunity ? getCommunityProfilePathId(profile) : null;

  const iconColor =
    variant === 'onDark' ? 'rgba(255,255,255,0.85)' : colors.textSecondary;
  const textColor =
    variant === 'onDark' ? 'rgba(255,255,255,0.92)' : colors.textSecondary;

  const metaStyle = [
    styles.meta,
    variant === 'compact' && styles.metaCompact,
    variant === 'onDark' && styles.metaOnDark,
  ];

  const textStyle =
    variant === 'onDark'
      ? [styles.metaTextOnDark, { color: textColor }]
      : [styles.metaText, variant === 'compact' && styles.metaTextCompact, { color: textColor }];

  const iconSize = variant === 'default' ? 13 : 12;
  const iconName = isCommunity ? 'people-outline' : 'business-outline';

  const rowInner = (
    <>
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
      <Text style={textStyle} numberOfLines={1}>
        {profile.name}
      </Text>
    </>
  );

  if (!communityPathId) {
    return <View style={metaStyle}>{rowInner}</View>;
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
      accessibilityLabel={`Open ${profile.name} community`}
      style={({ pressed }) => [
        ...metaStyle,
        { opacity: pressed ? 0.88 : 1 },
        Platform.OS === 'web' ? { cursor: 'pointer' as const } : null,
      ]}
      hitSlop={8}
    >
      {rowInner}
    </Pressable>
  );
}
