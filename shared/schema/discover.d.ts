export declare const DISCOVER_FOCUS_OPTIONS: readonly ["all", "indigenous", "music", "dance", "food", "art", "wellness", "film", "workshop", "heritage", "nightlife"];
export type DiscoverFocus = typeof DISCOVER_FOCUS_OPTIONS[number];
export declare const HERITAGE_PLAYLIST_TYPES: readonly ["Music", "Podcast", "Story"];
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
export type DiscoverArtistRoute = {
    type: 'artist';
    id: string;
} | {
    type: 'explore';
    focus: DiscoverFocus;
};
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
export declare const DEFAULT_DISCOVER_CURATION: DiscoverCurationConfig;
//# sourceMappingURL=discover.d.ts.map