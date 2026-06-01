import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import CategoryCard from './CategoryCard';
import { EVENT_CATEGORIES, type EventCategory } from '@/constants/eventCategories';
import { CategoryColors, CultureTokens } from '@/design-system/tokens/theme';

const CATEGORY_RAIL_SNAP_INTERVAL = 136; // Adjusted for nicer spacing (card + gap)

function CategoryRailComponent() {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  // Pre-map categories with colors for better performance
  const categoriesWithColors = useMemo(() => {
    return EVENT_CATEGORIES.map((item) => {
      const colorKey = item.id.toLowerCase().replace(/[^a-z]/g, '');
      const color = (CategoryColors as any)[colorKey] || CultureTokens.indigo;

      return {
        ...item,
        label: item.id,
        color,
      };
    });
  }, []);

  const handlePress = (categoryId: string) => {
    router.push({
      pathname: '/browse/[category]',
      params: { category: categoryId },
    });
  };

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader
          title="Browse Categories"
          onSeeAll={() => router.push('/browse/All')}
        />
      </View>

      <FlatList
        horizontal
        data={categoriesWithColors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            item={item}
            onPress={() => handlePress(item.id)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 12, paddingRight: 8 }]}
        decelerationRate="fast"
        snapToInterval={CATEGORY_RAIL_SNAP_INTERVAL}
        snapToAlignment="start"
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

export const CategoryRail = React.memo(CategoryRailComponent);