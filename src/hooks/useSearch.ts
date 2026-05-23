/**
 * useSearch — TanStack Query hook wrapping SearchManager.
 *
 * Provides reactive access to:
 * - Recent searches (local, AsyncStorage-backed)
 * - Trending searches (server, cached by city)
 * - Search suggestions (server, cached by partial query)
 * - Result grouping (pure transform)
 *
 * Usage:
 *   import { useSearch } from '@/hooks/useSearch';
 *   const { recentSearches, trending, suggestions, ... } = useSearch({ city: 'Sydney' });
 */

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { flowKeys } from './queries/keys';
import {
  searchManager,
  type GroupedSearchResults,
  type SearchResultItem,
} from '@/lib/search-manager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseSearchOptions {
  /** City for trending searches. Required for trending to be fetched. */
  city?: string;
  /** Partial query for suggestions. Must be ≥2 chars to trigger. */
  query?: string;
}

interface UseSearchReturn {
  /** Recent search queries (max 5, most recent first). */
  recentSearches: string[];
  /** Whether recent searches are loading from AsyncStorage. */
  recentLoading: boolean;
  /** Trending search queries for the given city. */
  trending: string[];
  /** Whether trending searches are loading. */
  trendingLoading: boolean;
  /** Suggestions for the current partial query. */
  suggestions: string[];
  /** Whether suggestions are loading. */
  suggestionsLoading: boolean;
  /** Add a query to recent searches. */
  addRecentSearch: (query: string) => Promise<void>;
  /** Clear all recent searches. */
  clearRecentSearches: () => Promise<void>;
  /** Group a flat list of search results by entity type. */
  groupResults: (results: SearchResultItem[]) => GroupedSearchResults;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { city, query } = options;
  const queryClient = useQueryClient();

  // ─── Recent Searches (local state, loaded from AsyncStorage) ──────────
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const searches = await searchManager.getRecentSearches();
      if (!cancelled) {
        setRecentSearches(searches);
        setRecentLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Trending Searches (server, TanStack Query) ───────────────────────
  const trendingQuery = useQuery<string[]>({
    queryKey: flowKeys.searchTrending(city ?? ''),
    queryFn: () => searchManager.getTrendingSearches(city!),
    enabled: !!city,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ─── Suggestions (server, TanStack Query) ─────────────────────────────
  const suggestionsQuery = useQuery<string[]>({
    queryKey: flowKeys.searchSuggestions(query ?? ''),
    queryFn: () => searchManager.getSuggestions(query!),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // ─── Actions ──────────────────────────────────────────────────────────

  const addRecentSearch = useCallback(async (searchQuery: string) => {
    await searchManager.addRecentSearch(searchQuery);
    const updated = await searchManager.getRecentSearches();
    setRecentSearches(updated);
  }, []);

  const clearRecentSearches = useCallback(async () => {
    await searchManager.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const groupResults = useCallback(
    (results: SearchResultItem[]) => searchManager.groupResults(results),
    [],
  );

  return {
    recentSearches,
    recentLoading,
    trending: trendingQuery.data ?? [],
    trendingLoading: trendingQuery.isLoading,
    suggestions: suggestionsQuery.data ?? [],
    suggestionsLoading: suggestionsQuery.isLoading,
    addRecentSearch,
    clearRecentSearches,
    groupResults,
  };
}
