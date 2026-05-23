/**
 * SearchManager — Manages search history, trending queries, result grouping,
 * and suggestions for the unified search system.
 *
 * Usage:
 *   import { searchManager } from '@/lib/search-manager';
 *   const recent = searchManager.getRecentSearches();
 *   searchManager.addRecentSearch('jazz festival');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_HISTORY_KEY = '@cp_search_history';
const MAX_RECENT_SEARCHES = 5;
const MAX_RESULTS_PER_GROUP = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Persisted search history structure. */
export interface SearchHistory {
  queries: string[]; // max 5, FIFO — most recent first
  lastUpdated: number;
}

/** Entity types supported in grouped search results. */
export type SearchEntityType =
  | 'event'
  | 'community'
  | 'business'
  | 'venue'
  | 'artist';

/** A single search result item with type and summary info. */
export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  imageUrl?: string;
  city?: string;
}

/** Grouped search results with max 3 per type and hasMore flags. */
export interface GroupedSearchResults {
  events: SearchResultItem[];
  communities: SearchResultItem[];
  businesses: SearchResultItem[];
  venues: SearchResultItem[];
  artists: SearchResultItem[];
  hasMore: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Internal state (in-memory cache of search history)
// ---------------------------------------------------------------------------

let cachedHistory: SearchHistory | null = null;

// ---------------------------------------------------------------------------
// Search History Management
// ---------------------------------------------------------------------------

/**
 * Loads search history from AsyncStorage into memory.
 * Returns the cached version if already loaded.
 */
async function loadHistory(): Promise<SearchHistory> {
  if (cachedHistory) return cachedHistory;

  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (raw) {
      cachedHistory = JSON.parse(raw) as SearchHistory;
    } else {
      cachedHistory = { queries: [], lastUpdated: Date.now() };
    }
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn('[SearchManager] Failed to load search history:', error);
    }
    cachedHistory = { queries: [], lastUpdated: Date.now() };
  }

  return cachedHistory;
}

/**
 * Persists the current in-memory history to AsyncStorage.
 */
async function persistHistory(): Promise<void> {
  if (!cachedHistory) return;

  try {
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(cachedHistory));
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn('[SearchManager] Failed to persist search history:', error);
    }
  }
}

/**
 * Returns the list of recent search queries (max 5, most recent first).
 * Loads from AsyncStorage on first call, then uses in-memory cache.
 */
async function getRecentSearches(): Promise<string[]> {
  const history = await loadHistory();
  return history.queries;
}

/**
 * Adds a query to the recent searches list.
 * - Adds to front (most recent first)
 * - Removes duplicates of the same query
 * - Removes oldest if list exceeds 5 items
 * - Persists to AsyncStorage
 */
async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  const history = await loadHistory();

  // Remove existing occurrence of this query (dedup)
  const filtered = history.queries.filter(
    (q) => q.toLowerCase() !== trimmed.toLowerCase(),
  );

  // Add to front
  filtered.unshift(trimmed);

  // Enforce max 5 items (FIFO — oldest removed)
  if (filtered.length > MAX_RECENT_SEARCHES) {
    filtered.splice(MAX_RECENT_SEARCHES);
  }

  cachedHistory = { queries: filtered, lastUpdated: Date.now() };
  await persistHistory();
}

/**
 * Clears all recent searches and persists the empty state.
 */
async function clearRecentSearches(): Promise<void> {
  cachedHistory = { queries: [], lastUpdated: Date.now() };
  await persistHistory();
}

// ---------------------------------------------------------------------------
// Trending & Suggestions (API-backed)
// ---------------------------------------------------------------------------

/**
 * Fetches trending search queries for a given city.
 * Returns an array of query strings.
 */
async function getTrendingSearches(city: string): Promise<string[]> {
  const response = await api.searchFlow.trending(city);
  return response.items.map((item) => item.query);
}

/**
 * Fetches search suggestions for a partial query.
 * Returns an array of suggested query strings.
 */
async function getSuggestions(partialQuery: string): Promise<string[]> {
  if (!partialQuery.trim()) return [];
  const response = await api.searchFlow.suggestions(partialQuery);
  return response.suggestions;
}

// ---------------------------------------------------------------------------
// Result Grouping
// ---------------------------------------------------------------------------

/**
 * Groups a flat list of search results by entity type.
 * - Max 3 results per type
 * - Sets hasMore flag when more than 3 exist for a type
 */
function groupResults(results: SearchResultItem[]): GroupedSearchResults {
  const groups: Record<SearchEntityType, SearchResultItem[]> = {
    event: [],
    community: [],
    business: [],
    venue: [],
    artist: [],
  };

  // Bucket results by type
  for (const result of results) {
    const bucket = groups[result.type];
    if (bucket) {
      bucket.push(result);
    }
  }

  // Build hasMore flags
  const hasMore: Record<string, boolean> = {
    events: groups.event.length > MAX_RESULTS_PER_GROUP,
    communities: groups.community.length > MAX_RESULTS_PER_GROUP,
    businesses: groups.business.length > MAX_RESULTS_PER_GROUP,
    venues: groups.venue.length > MAX_RESULTS_PER_GROUP,
    artists: groups.artist.length > MAX_RESULTS_PER_GROUP,
  };

  return {
    events: groups.event.slice(0, MAX_RESULTS_PER_GROUP),
    communities: groups.community.slice(0, MAX_RESULTS_PER_GROUP),
    businesses: groups.business.slice(0, MAX_RESULTS_PER_GROUP),
    venues: groups.venue.slice(0, MAX_RESULTS_PER_GROUP),
    artists: groups.artist.slice(0, MAX_RESULTS_PER_GROUP),
    hasMore,
  };
}

// ---------------------------------------------------------------------------
// Exported SearchManager singleton
// ---------------------------------------------------------------------------

export const searchManager = {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  getTrendingSearches,
  groupResults,
  getSuggestions,
} as const;
