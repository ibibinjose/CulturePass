import React, { useMemo, useState } from 'react';
import { View, TextInput, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { BrowsePage, type BrowseItem, type CategoryFilter } from '@/modules/core/components';
import { modulesApi } from '@/modules/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import { CategoryColors, CultureTokens } from '@/design-system/tokens/theme';
import { useM3Colors } from '@/hooks/useM3Colors';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';

/**
 * Dedicated Browse Categories Screen
 * Path: /browse/[category]
 * 
 * Uses the BrowsePage component to show a curated discovery experience
 * across events, communities, and movies.
 */
export default function BrowseCategoryScreen() {
  const { category: categorySlug = 'All' } = useLocalSearchParams<{ category: string }>();
  const m3Colors = useM3Colors();
  const { state: onboarding } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Prepare categories for the filter row
  const categories: CategoryFilter[] = useMemo(() => {
    const all: CategoryFilter = { label: 'All', icon: 'apps-outline', color: CultureTokens.indigo };
    const mapped = EVENT_CATEGORIES.map(c => ({
      label: c.id,
      icon: c.icon,
      color: (CategoryColors as any)[c.id.toLowerCase().replace(/[^a-z]/g, '')] || CultureTokens.indigo
    }));
    return [all, ...mapped];
  }, []);

  // 2. Fetch data mix
  // Note: We use search.query with an empty string but the specific category
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['browse-category', categorySlug, onboarding.city, onboarding.country],
    queryFn: () => modulesApi.search.query({
      q: '',
      category: categorySlug === 'All' ? undefined : categorySlug,
      city: onboarding.city || undefined,
      country: onboarding.country || undefined,
      pageSize: 40
    }),
    staleTime: 5 * 60 * 1000
  });

  // 3. Map results to unified BrowseItem format + client search
  const items: BrowseItem[] = useMemo(() => {
    if (!data) return [];
    
    let browseItems: BrowseItem[] = [];

    // Map Events
    if (data.events) {
      data.events.forEach(e => {
        browseItems.push({
          id: e.id,
          title: e.title || 'Untitled Event',
          subtitle: e.venue || e.city || 'Event',
          description: e.description,
          imageUrl: e.imageUrl,
          priceLabel: e.isFree ? 'Free' : (e.priceCents ? `$${(e.priceCents / 100).toFixed(2)}` : undefined),
          type: 'event',
          category: e.category
        });
      });
    }

    // Map Movies
    if (data.movies) {
      data.movies.forEach(m => {
        browseItems.push({
          id: m.id,
          title: m.title || 'Untitled Movie',
          subtitle: m.language || 'Movie',
          imageUrl: m.posterUrl,
          type: 'movie',
          category: 'Music' // Fallback
        });
      });
    }

    // Map Profiles (Communities/Businesses)
    if (data.profiles) {
      data.profiles.forEach(p => {
        browseItems.push({
          id: p.id,
          title: p.name || 'Untitled Profile',
          subtitle: p.city || p.entityType || 'Community',
          imageUrl: p.imageUrl || p.avatarUrl,
          type: 'profile',
          category: p.category
        });
      });
    }

    // Client-side search for better UX
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      browseItems = browseItems.filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return browseItems;
  }, [data, searchQuery]);

  // 4. Handle item press - navigate to details
  const handleItemPress = (item: BrowseItem) => {
    const detailPath = item.type === 'event' 
      ? `/e/${item.id}` 
      : item.type === 'movie' 
        ? `/m/${item.id}` 
        : `/profile/${item.id}`;
    
    router.push(detailPath as any);
  };

  const activeCategory = categories.find(c => c.label === categorySlug) || categories[0];

  return (
    <ErrorBoundary>
      {/* Reimagined search bar for vibrant, consistent UX on /browse/All */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: m3Colors.background }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: m3Colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: m3Colors.outlineVariant,
          paddingHorizontal: 16,
          height: 48,
        }}>
          <Ionicons name="search" size={20} color={m3Colors.onSurfaceVariant} />
          <TextInput
            style={{ flex: 1, marginLeft: 12, fontSize: 16, color: m3Colors.onSurface }}
            placeholder="Search events, movies, communities..."
            placeholderTextColor={m3Colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={m3Colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      </View>

      <BrowsePage
        title={categorySlug === 'All' ? 'Discover Everything' : categorySlug}
        tagline="Culture, communities, events & more — all in one place"
        accentColor={activeCategory.color}
        accentIcon={activeCategory.icon}
        categories={categories}
        items={items}
        isLoading={isLoading}
        onItemPress={handleItemPress}
        selectedCategoryId={categorySlug}
        onCategoryChange={(newCat) => {
          router.replace(`/browse/${newCat}`);
        }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={activeCategory.color}
          />
        }
        layout="grid"
        imageRatio={1}
      />
    </ErrorBoundary>
  );
}
