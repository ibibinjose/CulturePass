import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import type { EventData, Community, Ticket } from '@/shared/schema';
import { getCommunityProfilePathId } from '@/lib/community';

export function EventRailCard({ event, colors, index = 0 }: { event: EventData; colors: ReturnType<typeof useColors>; index?: number }) {
  const uri = event.heroImageUrl ?? event.imageUrl;
  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInRight.delay(index * 50).springify().damping(16) : undefined}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/event/${event.id}`);
        }}
        style={[pu.railCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={event.title}
      >
        {uri ? (
          <Image source={{ uri }} style={pu.railImage} contentFit="cover" />
        ) : (
          <View style={[pu.railImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="calendar-outline" size={22} color={CultureTokens.indigo} />
          </View>
        )}
        <Text numberOfLines={2} style={[pu.railTitle, { color: colors.text }]}>
          {event.title}
        </Text>
        <Text numberOfLines={1} style={[pu.railMeta, { color: colors.textTertiary }]}>
          {[event.date, event.time].filter(Boolean).join(' · ')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function TicketRailCard({ ticket, colors, index = 0 }: { ticket: Ticket; colors: ReturnType<typeof useColors>; index?: number }) {
  const uri = ticket.eventImageUrl;
  const title = ticket.eventTitle ?? ticket.eventName ?? ticket.eventSnapshot?.title ?? 'Event';
  const subtitle = [ticket.eventDate ?? ticket.date, ticket.eventTime].filter(Boolean).join(' · ');
  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInRight.delay(index * 50).springify().damping(16) : undefined}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/event/${ticket.eventId}`);
        }}
        style={[pu.railCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {uri ? (
          <Image source={{ uri }} style={pu.railImage} contentFit="cover" />
        ) : (
          <View style={[pu.railImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="ticket-outline" size={22} color={CultureTokens.indigo} />
          </View>
        )}
        <Text numberOfLines={2} style={[pu.railTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[pu.railMeta, { color: colors.textTertiary }]}>
          {subtitle || ' '}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function CommunityRailCard({ community, colors, index = 0 }: { community: Community; colors: ReturnType<typeof useColors>; index?: number }) {
  const uri = community.imageUrl;
  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInRight.delay(index * 50).springify().damping(16) : undefined}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/c/${getCommunityProfilePathId(community)}`);
        }}
        style={[pu.commRailCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={community.name}
      >
        {uri ? (
          <Image source={{ uri }} style={pu.commRailAvatar} contentFit="cover" />
        ) : (
          <View style={[pu.commRailAvatar, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="people-outline" size={20} color={CultureTokens.indigo} />
          </View>
        )}
        <Text numberOfLines={2} style={[pu.commRailName, { color: colors.text }]}>
          {community.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export const pu = StyleSheet.create({
  railScroll: { marginTop: 4, marginHorizontal: -4 },
  railScrollContent: { paddingHorizontal: 4, gap: 10, paddingBottom: 2 },
  railCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  railImage: { width: '100%', height: 88, backgroundColor: '#f0f0f0' },
  railTitle: { fontSize: 13, fontFamily: FontFamily.semibold, marginTop: 8, paddingHorizontal: 10, lineHeight: 18, minHeight: 36 },
  railMeta: { fontSize: 11, fontFamily: FontFamily.medium, marginTop: 4, paddingHorizontal: 10, minHeight: 16 },
  commRailCard: {
    width: 112,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 10,
    alignItems: 'center',
  },
  commRailAvatar: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  commRailName: { fontSize: 12, fontFamily: FontFamily.semibold, marginTop: 8, paddingHorizontal: 8, textAlign: 'center', lineHeight: 16, minHeight: 32 },
});
