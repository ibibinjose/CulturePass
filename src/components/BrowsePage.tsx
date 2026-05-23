import React from 'react';
import { View, ScrollView, Platform, StyleSheet, RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useBrowseData } from '@/hooks/useBrowseData';
import { FilterChipRow } from '@/modules/core/components';
import { CultureTokens } from '@/design-system/tokens/theme';

// Modular Components
import { BrowseHeader } from './browse/BrowseHeader';
import { PromotedRail } from './browse/PromotedRail';
import { BrowseLayout } from './browse/BrowseLayout';

import type { CategoryFilter, BrowseItem } from '@/shared/schema/browse';
export type { CategoryFilter, BrowseItem } from '@/shared/schema/browse';

interface BrowsePageProps {
  title: string;
  tagline?: string;
  accentColor?: string;
  accentIcon?: string;
  categories: CategoryFilter[];
  categoryKey?: string;
  items: BrowseItem[];
  isLoading: boolean;
  promotedItems?: BrowseItem[];
  promotedTitle?: string;
  onItemPress: (item: BrowseItem) => void;
  renderItemExtra?: (item: BrowseItem) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  layout?: 'list' | 'grid';
  imageRatio?: number;
  selectedCategoryId?: string;
  onCategoryChange?: (id: string) => void;
}

export default function BrowsePage({
  title,
  tagline,
  accentColor = CultureTokens.indigo,
  accentIcon = 'compass',
  categories,
  categoryKey = 'category',
  items,
  isLoading,
  promotedItems = [],
  promotedTitle = 'Popular',
  onItemPress,
  renderItemExtra,
  emptyMessage = 'Nothing found',
  emptyIcon = 'search-outline',
  refreshControl,
  layout = 'list',
  imageRatio = 1,
  selectedCategoryId,
  onCategoryChange,
}: BrowsePageProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const {
    selectedCat,
    setSelectedCat,
    filteredItems,
    chipItems,
    handleItemPress,
  } = useBrowseData({
    items,
    categories,
    categoryKey,
    onItemPress,
    externalSelectedId: selectedCategoryId,
    onSelect: onCategoryChange,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>
      <BrowseHeader 
        title={title} 
        tagline={tagline} 
        accentColor={accentColor} 
        accentIcon={accentIcon} 
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        refreshControl={refreshControl}
      >
        <PromotedRail 
          title={promotedTitle} 
          items={promotedItems} 
          accentColor={accentColor} 
          accentIcon={accentIcon} 
          onItemPress={handleItemPress} 
        />

        {categories.length > 0 && (
          <FilterChipRow
            items={chipItems}
            selectedId={selectedCat}
            onSelect={setSelectedCat}
          />
        )}

        <BrowseLayout 
          items={filteredItems}
          isLoading={isLoading}
          layout={layout}
          title={title}
          selectedCat={selectedCat}
          accentColor={accentColor}
          accentIcon={accentIcon}
          emptyMessage={emptyMessage}
          emptyIcon={emptyIcon}
          imageRatio={imageRatio}
          onItemPress={handleItemPress}
          onClearFilter={() => setSelectedCat('All')}
          renderItemExtra={renderItemExtra}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
