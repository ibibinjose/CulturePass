import React from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import CategoryCard from './CategoryCard';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import { CategoryColors, CultureTokens } from '@/design-system/tokens/theme';

const CATEGORY_RAIL_SNAP_INTERVAL = 124; // 112px card + 12px gap

function CategoryRailComponent() {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

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
        data={EVENT_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Map canonical category ID to theme color if available
          const colorKey = item.id.toLowerCase().replace(/[^a-z]/g, '');
          const color = (CategoryColors as any)[colorKey] || CultureTokens.indigo;

          return (
            <CategoryCard 
              item={{ ...item, label: item.id, color }} 
              onPress={() => router.push({
                pathname: '/browse/[category]',
                params: { category: item.id }
              })} 
            />
          );
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 12 }]}
        decelerationRate="fast"
        snapToInterval={CATEGORY_RAIL_SNAP_INTERVAL}
        snapToAlignment="start"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

export const CategoryRail = React.memo(CategoryRailComponent);
