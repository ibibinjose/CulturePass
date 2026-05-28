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
import { Luxe } from '@/design-system/tokens/luxeHeritage';

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
    borderRadius: Luxe.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Luxe.colors.dark.border || 'rgba(255,255,255,0.08)',
    backgroundColor: Luxe.colors.dark.surfaceElevated,
  },
  info: {
    padding: Luxe.spacing.md,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  contentWrap: {
    flex: 1,
    marginBottom: Luxe.spacing.sm,
  },
  metaSection: {
    marginTop: Luxe.spacing.sm,
    gap: 6,
  },
  row: {
    marginBottom: Luxe.spacing.sm,
  },
  rowSmall: {
    marginBottom: Luxe.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Luxe.spacing.sm,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Placeholder border
  },
});
