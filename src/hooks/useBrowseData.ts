import { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { BrowseItem, CategoryFilter } from '@/shared/schema/browse';

function canonicalizeCategoryToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  const aliases: Record<string, string> = {
    movie: 'film',
    movies: 'film',
    cinema: 'film',
    wellbeing: 'wellness',
    'well being': 'wellness',
    'health and wellness': 'wellness',
    arts: 'art',
    artist: 'art',
    artists: 'art',
    workshops: 'workshop',
    'food and drink': 'food',
    cuisine: 'food',
    concerts: 'music',
    concert: 'music',
    'live music': 'music',
    cultural: 'heritage',
    culture: 'heritage',
  };

  return aliases[normalized] ?? normalized;
}

function matchesCategorySelection(value: unknown, selectedCategory: string): boolean {
  const selected = canonicalizeCategoryToken(selectedCategory);

  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === 'string' && canonicalizeCategoryToken(entry) === selected);
  }

  return typeof value === 'string' && canonicalizeCategoryToken(value) === selected;
}

interface UseBrowseDataProps {
  items: BrowseItem[];
  categories: CategoryFilter[];
  categoryKey: string;
  onItemPress: (item: BrowseItem) => void;
  externalSelectedId?: string;
  onSelect?: (id: string) => void;
}

export function useBrowseData({ items, categories, categoryKey, onItemPress, externalSelectedId, onSelect }: UseBrowseDataProps) {
  const [internalSelectedCat, setInternalSelectedCat] = useState('All');

  const selectedCat = externalSelectedId ?? internalSelectedCat;
  const setSelectedCat = onSelect ?? setInternalSelectedCat;

  const filteredItems = useMemo(() => {
    if (selectedCat === 'All') return items;
    return items.filter((item) => {
      const val = item[categoryKey];
      return matchesCategorySelection(val, selectedCat);
    });
  }, [selectedCat, items, categoryKey]);

  const chipItems = useMemo(() => {
    return categories.map((c) => {
      const count = c.label === 'All'
        ? items.length
        : items.filter((item) => {
            const val = item[categoryKey];
            return matchesCategorySelection(val, c.label);
          }).length;
      return {
        id: c.label,
        label: c.label,
        icon: c.icon,
        color: c.color,
        count,
      };
    });
  }, [categories, items, categoryKey]);

  const handleItemPress = useCallback((item: BrowseItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onItemPress(item);
  }, [onItemPress]);

  return {
    selectedCat,
    setSelectedCat,
    filteredItems,
    chipItems,
    handleItemPress,
  };
}
