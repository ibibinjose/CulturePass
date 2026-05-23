import { db } from '../admin';
import { eventsService } from './events';
import { profilesService } from './profiles';
import { eventMatchesCategoryFilter } from './eventCategoryFilter';

export interface GlobalSearchFilters {
  city?: string;
  country?: string;
  category?: string;
  cultureTag?: string;
  entryType?: string;
  /** Matches `eventType` or `category` (case-insensitive) */
  eventType?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  lgaCode?: string;
}

export interface GlobalSearchResult {
  events: any[];
  profiles: any[];
  movies: any[];
  users: any[];
}

function matchesEntryTypeFilter(e: Record<string, unknown>, entryType: string | undefined): boolean {
  if (!entryType) return true;
  const isFreeLike =
    e.isFree === true ||
    e.entryType === 'free_open' ||
    e.entryType === 'free';
  if (entryType === 'free') return isFreeLike;
  if (entryType === 'ticketed') return !isFreeLike;
  return true;
}

export const searchService = {
  /**
   * Firestore-backed global search: bounded reads + in-memory match/filter.
   * For scale, add composite indexes or a dedicated search engine later.
   */
  async globalSearch(
    query: string,
    filters: GlobalSearchFilters = {},
    pageSize = 50,
  ): Promise<GlobalSearchResult> {
    const q = query.trim().toLowerCase();
    const hasTextQuery = q.length > 0;
    const city = filters.city?.trim();
    const country = filters.country?.trim();
    const category = filters.category?.trim();
    const cultureTag = filters.cultureTag?.trim().toLowerCase();
    const entryType = filters.entryType?.trim();
    const eventTypeFilter = filters.eventType?.trim().toLowerCase();
    const publisherProfileId = filters.publisherProfileId?.trim();
    const venueProfileId = filters.venueProfileId?.trim();
    const lgaCode = filters.lgaCode?.trim();

    const [eventSnap, profileSnap, movieSnap] = await Promise.all([
      db.collection('events').where('status', '==', 'published').limit(200).get(),
      db.collection('profiles').limit(200).get(),
      db.collection('movies').limit(100).get(),
    ]);

    const events = eventSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
      .filter((e) => {
        const title = String(e.title ?? '').toLowerCase();
        const desc = String(e.description ?? '').toLowerCase();
        const matchesQuery =
          !hasTextQuery || title.includes(q) || desc.includes(q);
        const matchesCity = !city || String(e.city ?? '').toLowerCase() === city.toLowerCase();
        const matchesCountry =
          !country || String(e.country ?? '').toLowerCase() === country.toLowerCase();
        const matchesCategory =
          !category || eventMatchesCategoryFilter(String(e.category ?? ''), category);
        const tags = Array.isArray(e.cultureTag) ? e.cultureTag : [];
        const matchesCulture =
          !cultureTag ||
          tags.some((t: unknown) => String(t).toLowerCase() === cultureTag);
        const matchesEntry = matchesEntryTypeFilter(e, entryType);
        const et = String(e.eventType ?? '').toLowerCase();
        const cat = String(e.category ?? '').toLowerCase();
        const matchesEventType =
          !eventTypeFilter || et === eventTypeFilter || cat === eventTypeFilter;
        const matchesPublisher =
          !publisherProfileId || String(e.publisherProfileId ?? '') === publisherProfileId;
        const matchesVenueProf =
          !venueProfileId || String(e.venueProfileId ?? '') === venueProfileId;
        const matchesLga =
          !lgaCode || String(e.lgaCode ?? '') === lgaCode;
        return (
          matchesQuery &&
          matchesCity &&
          matchesCountry &&
          matchesCategory &&
          matchesCulture &&
          matchesEntry &&
          matchesEventType &&
          matchesPublisher &&
          matchesVenueProf &&
          matchesLga
        );
      });

    const profiles = hasTextQuery
      ? profileSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
          .filter((p) => {
            const name = String(p.name ?? '').toLowerCase();
            const desc = String(p.description ?? '').toLowerCase();
            const matchesQuery = name.includes(q) || desc.includes(q);
            const matchesCity = !city || String(p.city ?? '').toLowerCase() === city.toLowerCase();
            const matchesCountry =
              !country || String(p.country ?? '').toLowerCase() === country.toLowerCase();
            return matchesQuery && matchesCity && matchesCountry;
          })
      : [];

    const movies = hasTextQuery
      ? movieSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
          .filter((m) => {
            const title = String(m.title ?? '').toLowerCase();
            const desc = String(m.description ?? '').toLowerCase();
            const matchesQuery = title.includes(q) || desc.includes(q);
            const matchesCountry =
              !country || String(m.country ?? '').toLowerCase() === country.toLowerCase();
            return matchesQuery && matchesCountry;
          })
      : [];

    const cap = Math.min(50, Math.max(1, pageSize));
    return {
      events: events.slice(0, cap),
      profiles: profiles.slice(0, cap),
      movies: movies.slice(0, cap),
      users: [],
    };
  },

  async getTrending(limit = 10): Promise<Record<string, unknown>[]> {
    const snap = await db.collection('events')
      .where('status', '==', 'published')
      .where('isFeatured', '==', true)
      .limit(limit)
      .get();
    
    // Fallback if not enough featured items
    if (snap.size < limit) {
      const more = await db.collection('events')
        .where('status', '==', 'published')
        .limit(limit)
        .get();
      return [...snap.docs, ...more.docs.filter(d => !snap.docs.some(sd => sd.id === d.id))]
        .slice(0, limit)
        .map(d => ({ id: d.id, ...d.data() }));
    }

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Get up to `limit` alternative query suggestions based on partial matches
   * against published event titles and profile names.
   * Used when a search returns zero results to help users refine their query.
   */
  async getSuggestions(query: string, limit = 3): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();

    // Fetch published events and profiles to build a suggestion corpus
    const [eventSnap, profileSnap] = await Promise.all([
      db.collection('events').where('status', '==', 'published').limit(200).get(),
      db.collection('profiles').limit(200).get(),
    ]);

    // Build a deduped set of titles/names for suggestion matching
    const seen = new Set<string>();
    const corpus: string[] = [];

    for (const doc of eventSnap.docs) {
      const title = String(doc.data().title ?? '').trim();
      if (title && !seen.has(title.toLowerCase())) {
        seen.add(title.toLowerCase());
        corpus.push(title);
      }
    }

    for (const doc of profileSnap.docs) {
      const name = String(doc.data().name ?? '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        corpus.push(name);
      }
    }

    // Find partial matches: items that start with the query first, then those that contain it
    const starts: string[] = [];
    const contains: string[] = [];

    for (const item of corpus) {
      const itemLower = item.toLowerCase();
      if (itemLower.startsWith(lower)) {
        starts.push(item);
      } else if (itemLower.includes(lower)) {
        contains.push(item);
      }
    }

    // Also try matching individual words from the query for broader suggestions
    const words = lower.split(/\s+/).filter(w => w.length >= 2);
    const wordMatches: string[] = [];
    if (starts.length + contains.length < limit && words.length > 1) {
      for (const item of corpus) {
        const itemLower = item.toLowerCase();
        // Skip items already matched
        if (itemLower.startsWith(lower) || itemLower.includes(lower)) continue;
        // Check if any word from the query appears in the item
        if (words.some(w => itemLower.includes(w))) {
          wordMatches.push(item);
        }
      }
    }

    return [...starts, ...contains, ...wordMatches].slice(0, limit);
  },

  /**
   * Get trending search queries for a specific city.
   * Returns popular event titles/categories from featured or recent events in that city.
   */
  async getTrendingSearches(city: string, limit = 3): Promise<TrendingSearchItem[]> {
    const trimmedCity = city.trim();
    if (!trimmedCity) return [];

    const cityLower = trimmedCity.toLowerCase();

    // Query featured events in the specified city
    const featuredSnap = await db.collection('events')
      .where('status', '==', 'published')
      .where('isFeatured', '==', true)
      .limit(50)
      .get();

    // Filter by city in-memory (Firestore doesn't support case-insensitive queries)
    const cityEvents = featuredSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
      .filter(e => String(e.city ?? '').toLowerCase() === cityLower);

    // If not enough featured events in city, fetch more published events
    if (cityEvents.length < limit) {
      const moreSnap = await db.collection('events')
        .where('status', '==', 'published')
        .limit(100)
        .get();

      const existingIds = new Set(cityEvents.map(e => e.id));
      const moreEvents = moreSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
        .filter(e =>
          !existingIds.has(e.id) &&
          String(e.city ?? '').toLowerCase() === cityLower,
        );

      cityEvents.push(...moreEvents);
    }

    // Build trending items from event titles, counting occurrences of similar terms
    const queryCountMap = new Map<string, number>();

    for (const event of cityEvents) {
      const title = String(event.title ?? '').trim();
      if (title) {
        const existing = queryCountMap.get(title) ?? 0;
        queryCountMap.set(title, existing + 1);
      }
    }

    // Sort by count descending, then alphabetically for stability
    const sorted = Array.from(queryCountMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit);

    return sorted.map(([query, count]) => ({ query, count }));
  },
};

export interface TrendingSearchItem {
  query: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Utility functions for unit tests (search, suggest, cache key)
// ---------------------------------------------------------------------------

export type SearchableItem = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  country?: string;
  tags?: string[];
};

/**
 * Simple in‑memory search used by unit tests.
 * Filters by query string (title/description/subtitle), type (or "all"), optional city, and optional tags.
 * Returns paginated results.
 */
export const runSearch = (
  items: SearchableItem[],
  opts: {
    q: string;
    type: string;
    page: number;
    pageSize: number;
    city?: string;
    tags?: string[];
  }
) => {
  const lowerQ = opts.q.toLowerCase();
  const filtered = items.filter(item => {
    // type filter
    if (opts.type !== 'all' && item.type !== opts.type) return false;
    // query match in title, subtitle or description
    const haystack = `${item.title || ''} ${item.subtitle || ''} ${item.description || ''}`.toLowerCase();
    if (!haystack.includes(lowerQ)) return false;
    // city filter
    if (opts.city && item.city?.toLowerCase() !== opts.city.toLowerCase()) return false;
    // tags filter – require at least one matching tag if tags supplied
    if (opts.tags && opts.tags.length > 0) {
      const itemTags = item.tags?.map(t => t.toLowerCase()) || [];
      const hasTag = opts.tags.some(t => itemTags.includes(t.toLowerCase()));
      if (!hasTag) return false;
    }
    return true;
  });

  const start = (opts.page - 1) * opts.pageSize;
  const end = start + opts.pageSize;
  const pageItems = filtered.slice(start, end);

  return {
    results: pageItems,
    page: opts.page,
    total: filtered.length
  };
};

/**
 * Suggest titles based on a prefix.
 * - Empty or whitespace‑only prefix returns []
 * - Duplicate titles are deduped (case‑sensitive keep first occurrence)
 * - Items that start with the prefix are ordered first, then those that contain it elsewhere.
 * - Optional limit (default 10).
 */
export const runSuggest = (items: SearchableItem[], prefix: string, limit = 10): string[] => {
  const trimmed = prefix.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();

  // Preserve insertion order while deduping
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const it of items) {
    if (!it.title) continue;
    if (seen.has(it.title)) continue;
    seen.add(it.title);
    titles.push(it.title);
  }

  const starts: string[] = [];
  const contains: string[] = [];
  for (const t of titles) {
    const low = t.toLowerCase();
    if (low.startsWith(lower)) {
      starts.push(t);
    } else if (low.includes(lower)) {
      contains.push(t);
    }
  }

  const result = [...starts, ...contains].slice(0, limit);
  return result;
};

/**
 * Build a deterministic cache key for search parameters.
 * Tags are sorted alphabetically to ensure order‑independence.
 */
export const buildSearchCacheKey = (params: Record<string, any>) => {
  const clone: Record<string, any> = { ...params };
  if (Array.isArray(clone.tags)) {
    clone.tags = [...clone.tags].sort();
  }
  return JSON.stringify(clone);
};

