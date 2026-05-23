import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { EventData, Community } from '@/shared/schema';
import { getCommunityProfilePathId } from '@/lib/community';
import { eventPaths } from '@/modules/events/services/navigation';
import type { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/theme';
import { M3Card } from '@/design-system/ui/M3Card';

type Colors = ReturnType<typeof useColors>;

interface DiscoverySectionProps {
  event: EventData;
  similarEvents: EventData[];
  relatedCommunities: Community[];
  colors: Colors;
  s?: unknown;
}

export function DiscoverySection({
  event,
  similarEvents,
  relatedCommunities,
}: DiscoverySectionProps) {
  const m3Colors = useM3Colors();
  const eventItems = similarEvents.slice(0, 6);
  const communityItems = relatedCommunities.slice(0, 4);
  const hasContent = eventItems.length > 0 || communityItems.length > 0;

  if (!hasContent) {
    return (
      <View style={[styles.emptyWrap, { borderColor: m3Colors.outlineVariant, backgroundColor: m3Colors.surfaceContainerLow }]}>
        <Ionicons name="sparkles-outline" size={18} color={m3Colors.primary} />
        <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
          We are still finding related picks in {event.city || 'your city'}.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {eventItems.length > 0 ? (
        <View style={styles.block}>
          <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>RECOMMENDED EVENTS</Text>
          <View style={styles.grid}>
            {eventItems.map((candidate) => (
              <M3Card
                key={candidate.id}
                variant="outlined"
                onPress={() => router.push(eventPaths.detailRoute(candidate.id))}
                style={styles.card}
              >
                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={2}>
                  {candidate.title}
                </Text>
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                  {[candidate.venue, candidate.city].filter(Boolean).join(' · ') || 'Venue TBC'}
                </Text>
              </M3Card>
            ))}
          </View>
        </View>
      ) : null}

      {communityItems.length > 0 ? (
        <View style={styles.block}>
          <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>RELATED COMMUNITIES</Text>
          <View style={styles.grid}>
            {communityItems.map((community) => (
              <M3Card
                key={community.id}
                variant="outlined"
                onPress={() =>
                  router.push(eventPaths.community(getCommunityProfilePathId(community)))
                }
                style={styles.card}
              >
                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={2}>
                  {community.name}
                </Text>
                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                  {community.city || event.city || 'Community'}
                </Text>
              </M3Card>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  block: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48.5%',
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
    gap: 4,
  },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
