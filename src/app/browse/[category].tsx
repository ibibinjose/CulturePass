import React, { useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl } from 'react-native';

import { BrowsePage, type BrowseItem, type CategoryFilter } from '@/modules/core/components';
import { modulesApi } from '@/modules/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';
import { CategoryColors, CultureTokens } from '@/design-system/tokens/theme';
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
  const { state: onboarding } = useOnboarding();

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

  // 3. Map results to unified BrowseItem format
  const items: BrowseItem[] = useMemo(() => {
    if (!data) return [];
    
    const browseItems: BrowseItem[] = [];

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

    return browseItems;
  }, [data]);

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
      <BrowsePage
        title={categorySlug === 'All' ? 'Browse Categories' : categorySlug}
        tagline="Discover culture, community, and events"
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
