import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { captureEventSave } from '@/lib/analytics-funnel';
import { captureEvent } from '@/lib/analytics';
import type { UserSubscribedCity } from '@/shared/schema/user';

export type SavedHubBookmark = {
  id: string;
  href: string;
  slug: string;
  state: string;
  language: string;
  title: string;
  subtitle?: string;
  savedAt: string;
};

export function hubBookmarkId(slug: string, state: string, language: string): string {
  return `${slug}::${state.toUpperCase()}::${language.toLowerCase()}`;
}

export type SubscribedCity = {
  city: string;
  country: string;
  subscribedAt: string;
};

function cityKey(city: string, country: string): string {
  return `${city.trim().toLowerCase()}::${country.trim().toLowerCase()}`;
}

function normalizeSubscribedCities(value: unknown): SubscribedCity[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: SubscribedCity[] = [];
  for (const raw of value) {
    const city = typeof (raw as { city?: unknown })?.city === 'string'
      ? (raw as { city: string }).city.trim()
      : '';
    const country = typeof (raw as { country?: unknown })?.country === 'string'
      ? (raw as { country: string }).country.trim()
      : '';
    const subscribedAtRaw = (raw as { subscribedAt?: unknown })?.subscribedAt;
    const subscribedAt = typeof subscribedAtRaw === 'string' && subscribedAtRaw.length > 0
      ? subscribedAtRaw
      : new Date().toISOString();
    if (!city || !country) continue;
    const key = cityKey(city, country);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ city, country, subscribedAt });
  }
  return out;
}

function mergeSubscribedCities(local: SubscribedCity[], remote: SubscribedCity[]): SubscribedCity[] {
  const map = new Map<string, SubscribedCity>();
  for (const entry of [...remote, ...local]) {
    map.set(cityKey(entry.city, entry.country), entry);
  }
  return [...map.values()];
}

function sameSubscribedCitySet(a: SubscribedCity[], b: SubscribedCity[]): boolean {
  if (a.length !== b.length) return false;
  const aKeys = new Set(a.map((c) => cityKey(c.city, c.country)));
  return b.every((c) => aKeys.has(cityKey(c.city, c.country)));
}

interface SavedContextValue {
  savedEvents: string[];
  joinedCommunities: string[];
  /** Bookmark community IDs to revisit (separate from join). */
  savedCommunityBookmarks: string[];
  savedHubs: SavedHubBookmark[];
  subscribedCities: SubscribedCity[];
  citySubscriptionSync: {
    mode: 'local' | 'account';
    status: 'idle' | 'syncing' | 'ok' | 'error';
  };
  toggleSaveEvent: (id: string) => void;
  toggleJoinCommunity: (id: string) => Promise<void>;
  toggleSaveCommunityBookmark: (id: string) => void;
  toggleSaveHub: (payload: Omit<SavedHubBookmark, 'id' | 'savedAt'>) => void;
  toggleSubscribeCity: (city: string, country: string) => void;
  isEventSaved: (id: string) => boolean;
  isCommunityJoined: (id: string) => boolean;
  isCommunityBookmarked: (id: string) => boolean;
  isHubSaved: (slug: string, state: string, language: string) => boolean;
  isCitySubscribed: (city: string, country: string) => boolean;
}

const SAVED_EVENTS_KEY = '@culturepass_saved_events';
const JOINED_COMMUNITIES_KEY = '@culturepass_joined_communities';
const SAVED_COMMUNITY_BOOKMARKS_KEY = '@culturepass_saved_community_bookmarks';
const SAVED_HUBS_KEY = '@culturepass_saved_hubs';
const SUBSCRIBED_CITIES_KEY = '@culturepass_subscribed_cities';

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [savedCommunityBookmarks, setSavedCommunityBookmarks] = useState<string[]>([]);
  const [savedHubs, setSavedHubs] = useState<SavedHubBookmark[]>([]);
  const [subscribedCities, setSubscribedCities] = useState<SubscribedCity[]>([]);
  const [citySyncStatus, setCitySyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const { isAuthenticated, userId } = useAuth();
  const didSyncFromApi = useRef(false);
  const didSyncCitiesFromApi = useRef(false);
  const didSyncSavedEventsFromApi = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SAVED_EVENTS_KEY),
      AsyncStorage.getItem(JOINED_COMMUNITIES_KEY),
      AsyncStorage.getItem(SAVED_COMMUNITY_BOOKMARKS_KEY),
      AsyncStorage.getItem(SAVED_HUBS_KEY),
      AsyncStorage.getItem(SUBSCRIBED_CITIES_KEY),
    ]).then(([events, communities, bookmarks, hubs, cities]) => {
      if (events) setSavedEvents(JSON.parse(events));
      if (communities) setJoinedCommunities(JSON.parse(communities));
      if (bookmarks) {
        try {
          const b = JSON.parse(bookmarks) as string[];
          if (Array.isArray(b)) setSavedCommunityBookmarks(b);
        } catch {
          /* ignore */
        }
      }
      if (hubs) {
        try {
          const parsed = JSON.parse(hubs) as SavedHubBookmark[];
          if (Array.isArray(parsed)) setSavedHubs(parsed);
        } catch {
          /* ignore corrupt */
        }
      }
      if (cities) {
        try {
          const parsed = JSON.parse(cities) as SubscribedCity[];
          if (Array.isArray(parsed)) setSubscribedCities(parsed);
        } catch {
          /* ignore corrupt */
        }
      }
    });
  }, []);

  // Sync joined communities from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      didSyncFromApi.current = false;
      return;
    }
    if (didSyncFromApi.current) return;
    didSyncFromApi.current = true;

    api.communities.joined()
      .then(({ communityIds }) => {
        setJoinedCommunities(communityIds);
        AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(communityIds));
      })
      .catch(() => { /* keep local state on error */ });
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      didSyncSavedEventsFromApi.current = false;
      return;
    }
    if (didSyncSavedEventsFromApi.current) return;
    didSyncSavedEventsFromApi.current = true;

    api.users.me()
      .then((user) => {
        const remote = (user as { savedEventIds?: unknown }).savedEventIds;
        if (!Array.isArray(remote)) return;
        setSavedEvents((local) => {
          const merged = [...new Set([...local, ...remote.filter((id): id is string => typeof id === 'string')])];
          AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(merged));
          return merged;
        });
      })
      .catch(() => {
        /* keep local state on error */
      });
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      didSyncCitiesFromApi.current = false;
      setCitySyncStatus('idle');
      return;
    }
    if (didSyncCitiesFromApi.current) return;
    didSyncCitiesFromApi.current = true;

    api.users.me()
      .then((user) => {
        const remote = normalizeSubscribedCities((user as { subscribedCities?: UserSubscribedCity[] }).subscribedCities ?? []);
        setSubscribedCities((local) => {
          const merged = mergeSubscribedCities(local, remote);
          AsyncStorage.setItem(SUBSCRIBED_CITIES_KEY, JSON.stringify(merged));
          if (!sameSubscribedCitySet(merged, remote)) {
            setCitySyncStatus('syncing');
            api.users.update(userId, { subscribedCities: merged })
              .then(() => setCitySyncStatus('ok'))
              .catch(() => {
                setCitySyncStatus('error');
                /* ignore sync error; keep local merged state */
              });
          } else {
            setCitySyncStatus('ok');
          }
          return merged;
        });
      })
      .catch(() => {
        setCitySyncStatus('error');
        /* keep local state on error */
      });
  }, [isAuthenticated, userId]);

  const toggleSaveEvent = useCallback((id: string) => {
    let wasSavedSnapshot = false;
    setSavedEvents(prev => {
      const wasSaved = prev.includes(id);
      wasSavedSnapshot = wasSaved;
      const next = wasSaved ? prev.filter(e => e !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(next));
      if (!wasSaved) {
        captureEventSave(id, userId ?? undefined, 'saved_context');
      }
      return next;
    });
    if (isAuthenticated) {
      api.events.favorite(id, !wasSavedSnapshot).catch(() => {
        setSavedEvents(prev => {
          const next = wasSavedSnapshot
            ? [...new Set([...prev, id])]
            : prev.filter(e => e !== id);
          AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(next));
          return next;
        });
      });
    }
  }, [isAuthenticated, userId]);

  const toggleSaveCommunityBookmark = useCallback((id: string) => {
    setSavedCommunityBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_COMMUNITY_BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSaveHub = useCallback((payload: Omit<SavedHubBookmark, 'id' | 'savedAt'>) => {
    const id = hubBookmarkId(payload.slug, payload.state, payload.language);
    setSavedHubs((prev) => {
      const exists = prev.some((h) => h.id === id);
      const next = exists
        ? prev.filter((h) => h.id !== id)
        : [
            ...prev,
            {
              ...payload,
              id,
              savedAt: new Date().toISOString(),
            },
          ];
      AsyncStorage.setItem(SAVED_HUBS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleJoinCommunity = useCallback(async (id: string) => {
    const isJoined = (prev: string[]) => prev.includes(id);

    // Optimistic update
    let wasJoined = false;
    setJoinedCommunities(prev => {
      wasJoined = isJoined(prev);
      const next = wasJoined ? prev.filter(c => c !== id) : [...prev, id];
      AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(next));
      return next;
    });

    captureEvent(wasJoined ? 'community_left' : 'community_joined', {
      community_id: id,
    });

    if (!isAuthenticated) return;

    try {
      if (wasJoined) {
        await api.communities.leave(id);
      } else {
        await api.communities.join(id);
      }
    } catch {
      // Revert on error
      setJoinedCommunities(prev => {
        const next = wasJoined ? [...prev, id] : prev.filter(c => c !== id);
        AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [isAuthenticated]);

  const toggleSubscribeCity = useCallback((city: string, country: string) => {
    const key = cityKey(city, country);
    const exists = subscribedCities.some((c) => cityKey(c.city, c.country) === key);
    const next = exists
      ? subscribedCities.filter((c) => cityKey(c.city, c.country) !== key)
      : [...subscribedCities, { city: city.trim(), country: country.trim(), subscribedAt: new Date().toISOString() }];

    setSubscribedCities(next);
    AsyncStorage.setItem(SUBSCRIBED_CITIES_KEY, JSON.stringify(next));

    if (isAuthenticated && userId) {
      setCitySyncStatus('syncing');
      api.users.update(userId, { subscribedCities: next })
        .then(() => setCitySyncStatus('ok'))
        .catch(() => {
          // Revert optimistic update if server sync fails.
          setSubscribedCities(subscribedCities);
          AsyncStorage.setItem(SUBSCRIBED_CITIES_KEY, JSON.stringify(subscribedCities));
          setCitySyncStatus('error');
        });
    }
  }, [isAuthenticated, subscribedCities, userId]);

  const savedEventSet = useMemo(() => new Set(savedEvents), [savedEvents]);
  const joinedCommunitySet = useMemo(() => new Set(joinedCommunities), [joinedCommunities]);
  const savedBookmarkSet = useMemo(() => new Set(savedCommunityBookmarks), [savedCommunityBookmarks]);
  const savedHubIdSet = useMemo(() => new Set(savedHubs.map((h) => h.id)), [savedHubs]);
  const subscribedCitySet = useMemo(() => new Set(subscribedCities.map((c) => cityKey(c.city, c.country))), [subscribedCities]);

  const isEventSaved = useCallback((id: string) => savedEventSet.has(id), [savedEventSet]);
  const isCommunityJoined = useCallback((id: string) => joinedCommunitySet.has(id), [joinedCommunitySet]);
  const isCommunityBookmarked = useCallback(
    (id: string) => savedBookmarkSet.has(id),
    [savedBookmarkSet],
  );
  const isHubSaved = useCallback(
    (slug: string, state: string, language: string) =>
      savedHubIdSet.has(hubBookmarkId(slug, state, language)),
    [savedHubIdSet],
  );
  const isCitySubscribed = useCallback(
    (city: string, country: string) => subscribedCitySet.has(cityKey(city, country)),
    [subscribedCitySet],
  );

  const value = useMemo(
    () => ({
      savedEvents,
      joinedCommunities,
      savedCommunityBookmarks,
      savedHubs,
      subscribedCities,
      citySubscriptionSync: {
        mode: (isAuthenticated ? 'account' : 'local') as 'account' | 'local',
        status: citySyncStatus,
      },
      toggleSaveEvent,
      toggleJoinCommunity,
      toggleSaveCommunityBookmark,
      toggleSaveHub,
      toggleSubscribeCity,
      isEventSaved,
      isCommunityJoined,
      isCommunityBookmarked,
      isHubSaved,
      isCitySubscribed,
    }),
    [
      savedEvents,
      joinedCommunities,
      savedCommunityBookmarks,
      savedHubs,
      subscribedCities,
      isAuthenticated,
      citySyncStatus,
      toggleSaveEvent,
      toggleJoinCommunity,
      toggleSaveCommunityBookmark,
      toggleSaveHub,
      toggleSubscribeCity,
      isEventSaved,
      isCommunityJoined,
      isCommunityBookmarked,
      isHubSaved,
      isCitySubscribed,
    ],
  );

  return (
    <SavedContext.Provider value={value}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within SavedProvider');
  return context;
}
