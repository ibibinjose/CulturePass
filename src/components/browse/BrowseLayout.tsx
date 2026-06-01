import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { TextStyles } from '@/design-system/tokens/typography';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { BrowseCard } from './BrowseCard';
import type { BrowseItem } from '@/modules/core/components';

interface BrowseLayoutProps {
  items: BrowseItem[];
  isLoading: boolean;
  layout: 'list' | 'grid';
  title: string;
  selectedCat: string;
  accentColor: string;
  accentIcon: string;
  emptyMessage: string;
  emptyIcon: string;
  imageRatio?: number;
  onItemPress: (item: BrowseItem) => void;
  onClearFilter: () => void;
  renderItemExtra?: (item: BrowseItem) => React.ReactNode;
}

export function BrowseLayout({
  items,
  isLoading,
  layout,
  title,
  selectedCat,
  accentColor,
  accentIcon,
  emptyMessage,
  emptyIcon,
  imageRatio,
  onItemPress,
  onClearFilter,
  renderItemExtra,
}: BrowseLayoutProps) {
  const m3Colors = useM3Colors();
  const isGrid = layout === 'grid';

  if (isLoading) {
    return (
      <View style={styles.listSection}>
        {[0, 1, 2, 3].map((k) => (
          <View key={k} style={[styles.skeletonCard, { backgroundColor: m3Colors.surface, borderColor: m3Colors.outlineVariant }]}>
            <Skeleton width={80} height={80} borderRadius={16} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="80%" height={16} borderRadius={8} />
              <Skeleton width="55%" height={13} borderRadius={6} />
              <Skeleton width="95%" height={13} borderRadius={6} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Skeleton width={60} height={22} borderRadius={10} />
                <Skeleton width={48} height={22} borderRadius={10} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap} accessibilityLiveRegion="polite">
        <View style={[styles.emptyIconBg, { backgroundColor: m3Colors.surface }]}>
          <Ionicons name={emptyIcon as keyof typeof Ionicons.glyphMap} size={48} color={m3Colors.onSurfaceVariant} />
        </View>
        <Text style={[TextStyles.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
          {selectedCat !== 'All' ? `No ${title.toLowerCase()} in "${selectedCat}"` : emptyMessage}
        </Text>
        {selectedCat !== 'All' && (
          <Pressable
            onPress={onClearFilter}
            accessibilityLabel="Clear filter"
            accessibilityRole="button"
          >
            <Text style={[TextStyles.caption, { color: accentColor, textDecorationLine: 'underline', marginTop: 8 }]}>Show all {title.toLowerCase()}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.listSection}>
      <View style={styles.listHeaderRow}>
        <Text style={[styles.resultCount, { color: m3Colors.onSurfaceVariant }]}>
          {items.length} {title.toLowerCase()} found
        </Text>
      </View>

      <View style={isGrid ? styles.gridContainer : styles.listContainer}>
        {items.map((item) => (
          <View key={item.id} style={isGrid ? styles.gridItem : styles.listItem}>
            <BrowseCard
              item={item}
              layout={layout}
              accentColor={accentColor}
              accentIcon={accentIcon}
              imageRatio={imageRatio}
              onPress={onItemPress}
              renderExtra={renderItemExtra}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listSection: { paddingHorizontal: 20 },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resultCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  listContainer: { gap: 14 },
  listItem: { width: '100%' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridItem: { width: Platform.OS === 'web' ? '18%' : '47%' },
  skeletonCard: { flexDirection: 'row', padding: 14, borderRadius: 16, borderWidth: 1, gap: 14, marginBottom: 14 },
});
