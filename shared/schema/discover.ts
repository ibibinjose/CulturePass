export const DISCOVER_FOCUS_OPTIONS = [
  'all',
  'indigenous',
  'music',
  'dance',
  'food',
  'art',
  'wellness',
  'film',
  'workshop',
  'heritage',
  'nightlife',
] as const;

export type DiscoverFocus = typeof DISCOVER_FOCUS_OPTIONS[number];

export const HERITAGE_PLAYLIST_TYPES = ['Music', 'Podcast', 'Story'] as const;

export type HeritagePlaylistType = typeof HERITAGE_PLAYLIST_TYPES[number];

export interface DiscoverFeaturedArtistEntry {
  id: string;
  profileId?: string;
  name?: string;
  subtitle?: string;
  meta?: string;
  imageUrl?: string;
  accentColor?: string;
  focus?: DiscoverFocus;
  ctaLabel?: string;
  city?: string;
  country?: string;
  active?: boolean;
}

export interface HeritagePlaylistEntry {
  id: string;
  title: string;
  artist: string;
  culture: string;
  imageUrl: string;
  typeLabel: HeritagePlaylistType;
  accentColor: string;
  focus: DiscoverFocus;
  /** Optional Spotify / Apple Music / web audio URL — opens in system browser or app. */
  externalUrl?: string;
  city?: string;
  country?: string;
  isLive?: boolean;
  active?: boolean;
  matchKeys?: string[];
}

export interface DiscoverCurationConfig {
  featuredArtists: DiscoverFeaturedArtistEntry[];
  heritagePlaylists: HeritagePlaylistEntry[];
  updatedAt?: string;
  updatedBy?: string;
}

export type DiscoverArtistRoute =
  | { type: 'artist'; id: string }
  | { type: 'explore'; focus: DiscoverFocus };

export interface DiscoverArtistHighlight {
  id: string;
  name: string;
  subtitle: string;
  meta: string;
  imageUrl?: string;
  accentColor: string;
  ctaLabel: string;
  route: DiscoverArtistRoute;
  source: 'profile' | 'manual';
}

export interface DiscoverCurationResponse {
  featuredArtists: DiscoverArtistHighlight[];
  heritagePlaylist: HeritagePlaylistEntry[];
  source: 'default' | 'firestore';
  updatedAt?: string;
}

export const DEFAULT_DISCOVER_CURATION: DiscoverCurationConfig = {
  featuredArtists: [
    {
      id: 'artist-aarav',
      name: 'Aarav Shrivastav',
      subtitle: 'Tabla Maestro',
      meta: 'Classical sessions and percussion storytelling',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      accentColor: '#FF8C42',
      focus: 'music',
      ctaLabel: 'Explore more',
      active: true,
    },
    {
      id: 'artist-suki',
      name: 'Suki Park',
      subtitle: 'K-Pop Voyager',
      meta: 'Dance, pop culture, and live stage energy',
      imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800&auto=format&fit=crop',
      accentColor: '#FF5E5B',
      focus: 'dance',
      ctaLabel: 'Explore more',
      active: true,
    },
    {
      id: 'artist-zainab',
      name: 'Zainab Al-Fayed',
      subtitle: 'Oud Artisan',
      meta: 'Traditional soundscapes and modern performance',
      imageUrl: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop',
      accentColor: '#0D9488',
      focus: 'music',
      ctaLabel: 'Explore more',
      active: true,
    },
  ],
  heritagePlaylists: [
    {
      id: 'playlist-sitar',
      title: 'Soul of the Sitar',
      artist: 'Ravi Shankar',
      culture: 'India',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
      typeLabel: 'Music',
      accentColor: '#FF8C42',
      focus: 'music',
      active: true,
      matchKeys: ['indian', 'hindi', 'punjabi', 'tamil', 'bengali', 'south_asian_diaspora'],
    },
    {
      id: 'playlist-seoul',
      title: 'Neo-Trad Seoul',
      artist: 'Leenalchi',
      culture: 'South Korea',
      imageUrl: 'https://images.unsplash.com/photo-1542152352-8418086054f7?q=80&w=800&auto=format&fit=crop',
      typeLabel: 'Music',
      accentColor: '#FF5E5B',
      focus: 'dance',
      isLive: true,
      active: true,
      matchKeys: ['korean', 'south_korean', 'east_asian_diaspora'],
    },
    {
      id: 'playlist-aegean',
      title: 'Aegean Echoes',
      artist: 'Yanni',
      culture: 'Greece',
      imageUrl: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop',
      typeLabel: 'Podcast',
      accentColor: '#4F46E5',
      focus: 'heritage',
      active: true,
      matchKeys: ['greek', 'mediterranean_diaspora'],
    },
    {
      id: 'playlist-diaspora-table',
      title: 'Diaspora Dinner Table',
      artist: 'CulturePass Radio',
      culture: 'Global Diaspora',
      imageUrl: 'https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=800&auto=format&fit=crop',
      typeLabel: 'Story',
      accentColor: '#FFC857',
      focus: 'heritage',
      active: true,
      externalUrl: 'https://open.spotify.com/search/diaspora%20stories%20podcast',
    },
  ],
};
