/**
 * EventCardSkeleton — shimmer placeholder matching EventCard layout.
 * Rendered while event data is loading.
 *
 * Usage:
 *   {isLoading && Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { useColors } from '@/hooks/useColors';

export function EventCardSkeleton() {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {/* Image placeholder */}
      <Skeleton width="100%" height={160} borderRadius={0} />

      {/* Info section */}
      <View style={styles.info}>
        <View style={styles.contentWrap}>
          {/* Title — 2 lines */}
          <Skeleton width="90%" height={16} borderRadius={6} style={styles.row} />
          <Skeleton width="70%" height={16} borderRadius={6} style={styles.rowSmall} />

          {/* Meta section */}
          <View style={styles.metaSection}>
            <Skeleton width={120} height={12} borderRadius={5} style={styles.rowSmall} />
            <Skeleton width="50%" height={12} borderRadius={5} style={styles.rowSmall} />
          </View>
        </View>

        {/* Footer: category badge + price */}
        <View style={styles.footer}>
          <Skeleton width={80} height={22} borderRadius={8} />
          <Skeleton width={50} height={22} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  info: {
    padding: 16,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  contentWrap: {
    flex: 1,
    marginBottom: 12,
  },
  metaSection: {
    marginTop: 8,
    gap: 6,
  },
  row: {
    marginBottom: 8,
  },
  rowSmall: {
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Placeholder border
  },
});
