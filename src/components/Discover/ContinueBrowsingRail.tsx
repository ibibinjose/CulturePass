/**
 * ContinueBrowsingRail — shows up to 3 recently visited entities (events,
 * communities, cities) since the last app launch or foreground return.
 *
 * Hidden when the user has no visits since the last launch (Req 1.1, 1.5).
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { useContinueBrowsing } from '@/hooks/discover/useContinueBrowsing';
import { useColors } from '@/hooks/useColors';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import { FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import type { RecentVisit } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

function routeForVisit(visit: RecentVisit): Parameters<typeof router.push>[0] {
  switch (visit.entityType) {
    case 'event':
      return { pathname: '/e/[id]', params: { id: visit.entityId } };
    case 'community':
      return { pathname: '/c/[id]', params: { id: visit.entityId } };
    case 'city':
      return { pathname: '/(tabs)/city' };
  }
}

const TYPE_ICON: Record<RecentVisit['entityType'], string> = {
  event: '🎟',
  community: '👥',
  city: '🏙',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ContinueBrowsingRailProps {
  /** Called when user taps "See all" — optional. */
  onSeeAll?: () => void;
}

export default function ContinueBrowsingRail({ onSeeAll }: ContinueBrowsingRailProps) {
  const { items } = useContinueBrowsing();
  const colors = useColors();
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: vPad }}>
      <View style={headerPadStyle}>
        <SectionHeader
          title="Continue Browsing"
          onSeeAll={items.length > 1 ? onSeeAll : undefined}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 12 }]}
      >
        {items.map((visit) => (
          <Pressable
            key={visit.entityId}
            onPress={() => router.push(routeForVisit(visit))}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Continue browsing: ${visit.title}`}
          >
            {visit.imageUrl ? (
              <Image
                source={{ uri: visit.imageUrl }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.surface }]}>
                <Text style={styles.thumbEmoji}>{TYPE_ICON[visit.entityType]}</Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={[styles.typeLabel, { color: colors.textTertiary }]} numberOfLines={1}>
                {visit.entityType.charAt(0).toUpperCase() + visit.entityType.slice(1)}
              </Text>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {visit.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumb: {
    width: '100%',
    height: 90,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 32,
  },
  meta: {
    padding: Spacing.sm,
    gap: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    lineHeight: 18,
  },
});
