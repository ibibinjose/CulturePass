import { useCallback, useMemo, useState } from 'react';
import { Platform, Share } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLayout } from '@/hooks/useLayout';
import { api } from '@/lib/api';
import { resolveCityHeroImageUrl } from '@/constants/cityHeroImages';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import type { EventData, PaginatedEventsResponse, Profile } from '@/shared/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterMode = 'category' | 'culture' | 'language';

export const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

const CITY_META_MAP: Record<string, { tagline: string; cultures: string[]; languages: string[] }> = {
  sydney:    { tagline: 'Where 200+ cultures call home', cultures: ['Indian', 'Chinese', 'Lebanese', 'Greek', 'Filipino', 'Vietnamese', 'Korean', 'Sri Lankan', 'Nepalese'], languages: ['Tamil', 'Mandarin', 'Hindi', 'Arabic', 'Cantonese', 'Filipino', 'Malayalam', 'Telugu', 'Sinhalese'] },
  melbourne: { tagline: 'Cultural capital of the Southern Hemisphere', cultures: ['Italian', 'Greek', 'Vietnamese', 'Indian', 'Chinese', 'Lebanese', 'Sri Lankan'], languages: ['Greek', 'Mandarin', 'Hindi', 'Vietnamese', 'Italian', 'Arabic', 'Punjabi'] },
  brisbane:  { tagline: 'Sunshine and culture year-round', cultures: ['Chinese', 'Indian', 'Filipino', 'Vietnamese', 'Korean', 'South African'], languages: ['Mandarin', 'Hindi', 'Filipino', 'Vietnamese', 'Korean'] },
  perth:     { tagline: 'Western gateway to the world', cultures: ['Indian', 'Chinese', 'Filipino', 'South African', 'Sri Lankan', 'Malaysian'], languages: ['Mandarin', 'Hindi', 'Filipino', 'Tamil', 'Malay'] },
  adelaide:  { tagline: 'Festival city with deep cultural roots', cultures: ['Italian', 'Greek', 'Chinese', 'Vietnamese', 'Indian', 'Filipino'], languages: ['Mandarin', 'Greek', 'Italian', 'Hindi', 'Vietnamese', 'Filipino'] },
  london:    { tagline: "The world's culture crossroads", cultures: ['South Asian', 'Caribbean', 'West African', 'East African', 'Chinese', 'Bengali'], languages: ['Hindi', 'Punjabi', 'Arabic', 'Mandarin', 'Bengali', 'Urdu', 'Somali'] },
  dubai:     { tagline: 'Where East meets West', cultures: ['South Asian', 'Filipino', 'Arab', 'East African', 'Pakistani'], languages: ['Hindi', 'Arabic', 'Filipino', 'Urdu', 'Malayalam', 'Tamil'] },
  toronto:   { tagline: 'The most multicultural city on Earth', cultures: ['South Asian', 'Chinese', 'Filipino', 'Caribbean', 'South American'], languages: ['Hindi', 'Mandarin', 'Filipino', 'Punjabi', 'Portuguese', 'Urdu'] },
  auckland:  { tagline: 'Pacific cultures meet Māori heritage', cultures: ['Māori', 'Pacific Islander', 'Indian', 'Chinese', 'Filipino', 'Samoan'], languages: ['Māori', 'Samoan', 'Hindi', 'Mandarin', 'Tongan', 'Filipino'] },
};

const DEFAULT_META = { tagline: 'Explore the vibrant heartbeat of culture', cultures: [] as string[], languages: [] as string[] };

function getStateName(code: string | undefined): string | undefined {
  return GLOBAL_REGIONS.find((r) => r.value === code)?.label;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCityPage(cityName: string, cityCountry: string) {
  useOnboarding();
  const { isDesktop, contentWidth, width } = useLayout();

  // Static city metadata
  const meta = CITY_META_MAP[cityName.toLowerCase()] ?? DEFAULT_META;
  const heroImage = resolveCityHeroImageUrl(cityName);
  const stateCode = getStateForCity(cityName);
  const stateName = getStateName(stateCode);

  // Grid sizing
  const gridGap = 16;
  const gridWidth = isDesktop ? contentWidth : width - 40;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2) - 1;
  const desktopShellWidth = Math.max(0, contentWidth - 40);
  const desktopContentGap = gridGap * 2;
  const desktopEventsColumnWidth = Math.max(0, ((desktopShellWidth - desktopContentGap) * 2.8) / (2.8 + 1));
  const desktopCardWidth = Math.floor((desktopEventsColumnWidth - gridGap) / 2);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Data fetching
  const { data: eventsData, isLoading, refetch } = useQuery<PaginatedEventsResponse>({
    queryKey: ['/api/events', 'city', cityName, selectedCategories],
    queryFn: () =>
      api.events.list({
        city: cityName,
        country: cityCountry,
        pageSize: 60,
        category: selectedCategories.length === 1 ? selectedCategories[0].toLowerCase() : undefined,
      }),
    staleTime: 120_000,
  });

  const { data: venuesData } = useQuery<Profile[]>({
    queryKey: ['/api/businesses', 'city', cityName],
    queryFn: () => api.businesses.list({ city: cityName, country: cityCountry }),
    staleTime: 300_000,
  });

  const { data: councilRes } = useQuery({
    queryKey: ['/api/council/resolve', cityName, cityCountry],
    queryFn: () => api.council.resolve({ city: cityName, country: cityCountry }),
    enabled: cityCountry.toLowerCase() === 'australia' || cityCountry.toLowerCase() === 'au',
    staleTime: Infinity,
  });
  const council = councilRes?.council;

  const { data: profilesData } = useQuery<Profile[] | { profiles?: Profile[] }>({
    queryKey: ['/api/profiles', 'city-fallback', cityName, cityCountry],
    queryFn: () => api.profiles.list(),
    staleTime: 300_000,
  });

  const allEvents = useMemo<EventData[]>(() => eventsData?.events ?? [], [eventsData]);

  const venues = useMemo<Profile[]>(() => {
    const primary = venuesData ?? [];
    if (primary.length > 0) return primary.slice(0, 6);
    const all = Array.isArray(profilesData) ? profilesData : (profilesData?.profiles ?? []);
    const cityNorm = cityName.trim().toLowerCase();
    const countryNorm = cityCountry.trim().toLowerCase();
    const placeTypes = new Set(['business', 'venue', 'restaurant', 'organisation', 'organization']);
    return all
      .filter((p) => {
        const c = String(p.city ?? '').trim().toLowerCase();
        const cn = String(p.country ?? '').trim().toLowerCase();
        return c === cityNorm && (!cn || cn === countryNorm) && placeTypes.has(String(p.entityType ?? '').toLowerCase());
      })
      .slice(0, 6);
  }, [venuesData, profilesData, cityName, cityCountry]);

  // Derived filter options
  const uniqueCultureTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => (e.cultureTag ?? e.cultureTags ?? []).forEach((t: string) => set.add(t)));
    meta.cultures.forEach((c) => set.add(c));
    return Array.from(set).slice(0, 16);
  }, [allEvents, meta.cultures]);

  const uniqueLanguageTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => (e.languageTags ?? []).forEach((t: string) => set.add(t)));
    meta.languages.forEach((l) => set.add(l));
    return Array.from(set).slice(0, 14);
  }, [allEvents, meta.languages]);

  // Client-side filtering
  const filteredEvents = useMemo<EventData[]>(() => {
    let list = allEvents;
    if (selectedCategories.length > 1) {
      const lower = selectedCategories.map((c) => c.toLowerCase());
      list = list.filter((e) => lower.includes((e.category ?? '').toLowerCase()));
    }
    if (selectedCultures.length > 0) {
      list = list.filter((e) => {
        const tags = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
        return selectedCultures.some((s) => tags.some((t) => t.toLowerCase().includes(s.toLowerCase())));
      });
    }
    if (selectedLanguages.length > 0) {
      list = list.filter((e) => {
        const langs = e.languageTags ?? [];
        return selectedLanguages.some((s) => langs.some((l) => l.toLowerCase().includes(s.toLowerCase())));
      });
    }
    return list;
  }, [allEvents, selectedCategories, selectedCultures, selectedLanguages]);

  const totalActiveFilters = selectedCategories.length + selectedCultures.length + selectedLanguages.length;

  // Active filters / options for the currently selected mode
  const activeFilters =
    filterMode === 'category' ? selectedCategories
    : filterMode === 'culture' ? selectedCultures
    : selectedLanguages;

  const filterOptions =
    filterMode === 'category' ? CATEGORY_FILTERS
    : filterMode === 'culture' ? uniqueCultureTags
    : uniqueLanguageTags;

  const sectionTitle = useMemo(() => {
    const parts: string[] = [];
    if (selectedCategories.length) parts.push(selectedCategories.join(', '));
    if (selectedCultures.length) parts.push(selectedCultures.join(', '));
    if (selectedLanguages.length) parts.push(selectedLanguages.join(', '));
    return parts.length ? `${parts.join(' · ')} Events` : 'My City Highlights';
  }, [selectedCategories, selectedCultures, selectedLanguages]);

  // Actions
  const onToggleFilter = useCallback((f: string) => {
    const setter =
      filterMode === 'category' ? setSelectedCategories
      : filterMode === 'culture' ? setSelectedCultures
      : setSelectedLanguages;
    setter((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }, [filterMode]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedCultures([]);
    setSelectedLanguages([]);
  }, []);

  const clearModeFilter = useCallback(() => {
    if (filterMode === 'category') setSelectedCategories([]);
    else if (filterMode === 'culture') setSelectedCultures([]);
    else setSelectedLanguages([]);
  }, [filterMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = useCallback(async () => {
    const url = `https://culturepass.co/city/${encodeURIComponent(cityName)}?country=${encodeURIComponent(cityCountry)}`;
    const msg = `Explore ${cityName} on CulturePass — local events, communities and experiences.\n${url}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `${cityName} · My City`, text: msg, url });
      } else {
        await Share.share({ title: `${cityName} · My City`, message: msg, url });
      }
    } catch {}
  }, [cityName, cityCountry]);

  return {
    // metadata
    meta, heroImage, stateCode, stateName, council,
    // grid
    gridGap, cardWidth, desktopCardWidth,
    // data
    allEvents, venues, filteredEvents,
    isLoading, refreshing, onRefresh,
    // filter state
    filterMode, setFilterMode,
    selectedCategories, selectedCultures, selectedLanguages,
    setSelectedCultures, setSelectedLanguages,
    uniqueCultureTags, uniqueLanguageTags,
    totalActiveFilters, activeFilters, filterOptions,
    sectionTitle,
    // actions
    onToggleFilter, clearAllFilters, clearModeFilter, handleShare,
  };
}
