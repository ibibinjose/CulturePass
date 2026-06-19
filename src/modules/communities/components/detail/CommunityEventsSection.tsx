import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { M3Card } from '@/design-system/ui';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import type { EventData } from '@/shared/schema';
import { CommunityEventCard } from '@/modules/communities/components/detail/CommunityEventCard';
import { SectionCard } from '@/modules/communities/components/detail/CommunityDetailScreen.parts';

export type CommunityEventsSectionProps = {
  events: EventData[];
  loading: boolean;
  accent: string;
  communityName: string;
  /** Shown when listing includes national padding (sparse local catalog). */
  locationScopeNote?: string;
  /** Sidebar / desktop rail — denser compact rows */
  compact?: boolean;
  maxCompact?: number;
};

export function CommunityEventsSection({
  events,
  loading,
  accent,
  communityName,
  locationScopeNote,
  compact = false,
  maxCompact = 5,
}: CommunityEventsSectionProps) {
  const m3Colors = useM3Colors();
  const { isDesktop } = useLayout();

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [events],
  );

  const [featured, ...rest] = sorted;
  const showFeatured = !compact && !!featured && sorted.length > 0;
  const gridEvents = showFeatured ? rest : sorted;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Skeleton width="100%" height={compact ? 72 : 220} borderRadius={18} />
        <Skeleton width="100%" height={compact ? 72 : 160} borderRadius={18} />
        <Skeleton width="100%" height={compact ? 72 : 160} borderRadius={18} />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <M3Card variant="outlined" style={[styles.emptyState, { borderColor: m3Colors.outlineVariant }]}>
        <View style={[styles.emptyIcon, { backgroundColor: withAlpha(accent, 0.12) }]}>
          <Ionicons name="calendar-outline" size={32} color={accent} />
        </View>
        <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface, textAlign: 'center' }]}>
          No upcoming events
        </Text>
        <Text
          style={[
            M3Typography.bodyMedium,
            { color: m3Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
          ]}
        >
          When {communityName} lists new gatherings, they&apos;ll show up here with dates, venues, and ticket links.
        </Text>
      </M3Card>
    );
  }

  if (compact) {
    const items = sorted.slice(0, maxCompact);
    return (
      <SectionCard
        title="Upcoming Events"
        subtitle={locationScopeNote ?? `${sorted.length} scheduled`}
      >
        <View style={{ gap: 0 }}>
          {items.map((event) => (
            <CommunityEventCard key={event.id} event={event} accent={accent} variant="compact" />
          ))}
        </View>
        {sorted.length > maxCompact ? (
          <Text style={[M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant, marginTop: 8 }]}>
            +{sorted.length - maxCompact} more on the Events tab
          </Text>
        ) : null}
      </SectionCard>
    );
  }

  const useGrid = isDesktop && Platform.OS === 'web' && gridEvents.length > 1;
  const eventCountLabel = `${sorted.length} event${sorted.length !== 1 ? 's' : ''}`;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { borderBottomColor: m3Colors.outlineVariant }]}>
        <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface, fontFamily: FontFamily.bold }]}>
            Upcoming Events
          </Text>
          <Text
            style={[
              M3Typography.bodyMedium,
              { color: m3Colors.onSurfaceVariant, marginTop: 4, lineHeight: 22 },
            ]}
          >
            {locationScopeNote ?? `${eventCountLabel} from ${communityName}`}
          </Text>
        </View>
      </View>

      {showFeatured ? (
        <CommunityEventCard event={featured} accent={accent} variant="featured" />
      ) : null}

      {gridEvents.length > 0 ? (
        <View style={[styles.grid, useGrid && styles.gridDesktop]}>
          {gridEvents.map((event) => (
            <View key={event.id} style={useGrid ? styles.gridItem : styles.gridItemFull}>
              <CommunityEventCard event={event} accent={accent} variant="card" />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginTop: 4,
  },
  grid: {
    gap: 14,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '48%',
    minWidth: 280,
    maxWidth: '100%',
  },
  gridItemFull: {
    width: '100%',
  },
  loadingWrap: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});