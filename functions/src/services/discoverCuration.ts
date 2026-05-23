import { db, isFirestoreConfigured } from '../admin';
import type {
  Profile,
  DiscoverArtistHighlight,
  DiscoverCurationConfig,
  DiscoverCurationResponse,
  DiscoverFeaturedArtistEntry,
  HeritagePlaylistEntry,
} from '../../../shared/schema';
import { DEFAULT_DISCOVER_CURATION } from '../../../shared/schema';

const COLLECTION_NAME = 'appConfig';
const DOCUMENT_ID = 'discoverCuration';

function cloneDefaultConfig(): DiscoverCurationConfig {
  return {
    featuredArtists: DEFAULT_DISCOVER_CURATION.featuredArtists.map((item) => ({ ...item })),
    heritagePlaylists: DEFAULT_DISCOVER_CURATION.heritagePlaylists.map((item) => ({
      ...item,
      matchKeys: item.matchKeys ? [...item.matchKeys] : undefined,
    })),
  };
}

function normalizeConfig(input?: Partial<DiscoverCurationConfig> | null): DiscoverCurationConfig {
  const fallback = cloneDefaultConfig();
  return {
    featuredArtists: Array.isArray(input?.featuredArtists)
      ? input!.featuredArtists.map((item) => ({ ...item }))
      : fallback.featuredArtists,
    heritagePlaylists: Array.isArray(input?.heritagePlaylists)
      ? input!.heritagePlaylists.map((item) => ({
          ...item,
          matchKeys: item.matchKeys ? [...item.matchKeys] : undefined,
        }))
      : fallback.heritagePlaylists,
    updatedAt: input?.updatedAt,
    updatedBy: input?.updatedBy,
  };
}

function matchesLocation(item: { city?: string; country?: string }, city?: string, country?: string): boolean {
  const cityMatch = !item.city || !city || item.city.toLowerCase() === city.toLowerCase();
  const countryMatch = !item.country || !country || item.country.toLowerCase() === country.toLowerCase();
  return cityMatch && countryMatch;
}

function buildArtistMeta(artist: DiscoverFeaturedArtistEntry, profile?: Profile): string {
  if (artist.meta?.trim()) return artist.meta.trim();
  const profileMeta = [profile?.city, profile?.country].filter(Boolean).join(', ');
  if (profileMeta) return profileMeta;
  return 'CulturePass artist';
}

function buildArtistSubtitle(artist: DiscoverFeaturedArtistEntry, profile?: Profile): string {
  if (artist.subtitle?.trim()) return artist.subtitle.trim();
  return profile?.category || profile?.title || profile?.subCategory || 'Featured artist';
}

function buildArtistImage(artist: DiscoverFeaturedArtistEntry, profile?: Profile): string | undefined {
  return artist.imageUrl || profile?.coverImageUrl || profile?.avatarUrl || profile?.imageUrl;
}

function buildFeaturedArtistHighlight(
  artist: DiscoverFeaturedArtistEntry,
  profile?: Profile,
): DiscoverArtistHighlight | null {
  const name = artist.name?.trim() || profile?.name?.trim();
  if (!name) return null;

  const subtitle = buildArtistSubtitle(artist, profile);
  const meta = buildArtistMeta(artist, profile);
  const imageUrl = buildArtistImage(artist, profile);
  const accentColor = artist.accentColor || DEFAULT_DISCOVER_CURATION.featuredArtists[0]?.accentColor || '#4F46E5';

  if (profile?.id) {
    return {
      id: artist.id,
      name,
      subtitle,
      meta,
      imageUrl,
      accentColor,
      ctaLabel: artist.ctaLabel || 'View artist',
      route: { type: 'artist', id: profile.id },
      source: 'profile',
    };
  }

  return {
    id: artist.id,
    name,
    subtitle,
    meta,
    imageUrl,
    accentColor,
    ctaLabel: artist.ctaLabel || 'Explore more',
    route: { type: 'explore', focus: artist.focus || 'heritage' },
    source: 'manual',
  };
}

function sortPlaylistByCultureMatch(items: HeritagePlaylistEntry[], cultureIds: string[]): HeritagePlaylistEntry[] {
  if (cultureIds.length === 0) return items;

  const lowered = cultureIds.map((item) => item.toLowerCase());

  return [...items].sort((left, right) => {
    const leftMatch = left.matchKeys?.some((key) => lowered.includes(key.toLowerCase())) ? 1 : 0;
    const rightMatch = right.matchKeys?.some((key) => lowered.includes(key.toLowerCase())) ? 1 : 0;
    return rightMatch - leftMatch;
  });
}

export async function getDiscoverCurationConfig(): Promise<{
  config: DiscoverCurationConfig;
  source: 'default' | 'firestore';
}> {
  if (!isFirestoreConfigured) {
    return { config: cloneDefaultConfig(), source: 'default' };
  }

  const snap = await db.collection(COLLECTION_NAME).doc(DOCUMENT_ID).get();
  if (!snap.exists) {
    return { config: cloneDefaultConfig(), source: 'default' };
  }

  return {
    config: normalizeConfig(snap.data() as Partial<DiscoverCurationConfig>),
    source: 'firestore',
  };
}

export async function updateDiscoverCurationConfig(
  payload: DiscoverCurationConfig,
  updatedBy: string,
): Promise<DiscoverCurationConfig> {
  const nextConfig: DiscoverCurationConfig = {
    featuredArtists: payload.featuredArtists.map((item) => ({ ...item })),
    heritagePlaylists: payload.heritagePlaylists.map((item) => ({
      ...item,
      matchKeys: item.matchKeys ? [...item.matchKeys] : undefined,
    })),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await db.collection(COLLECTION_NAME).doc(DOCUMENT_ID).set(nextConfig, { merge: false });
  return nextConfig;
}

export async function resolveDiscoverCuration(params: {
  city?: string;
  country?: string;
  cultureIds?: string[];
}): Promise<DiscoverCurationResponse> {
  const { config, source } = await getDiscoverCurationConfig();

  const eligibleArtists = config.featuredArtists.filter(
    (item) => item.active !== false && matchesLocation(item, params.city, params.country),
  );

  const profileIds = eligibleArtists
    .map((item) => item.profileId)
    .filter((item): item is string => Boolean(item));

  const profilesById = new Map<string, Profile>();

  if (isFirestoreConfigured && profileIds.length > 0) {
    const profileSnapshots = await Promise.all(
      profileIds.map((profileId) => db.collection('profiles').doc(profileId).get()),
    );

    for (const snap of profileSnapshots) {
      if (!snap.exists) continue;
      const profile = { id: snap.id, ...(snap.data() as Omit<Profile, 'id'>) } as Profile;
      profilesById.set(snap.id, profile);
    }
  }

  const featuredArtists = eligibleArtists
    .map((item) => buildFeaturedArtistHighlight(item, item.profileId ? profilesById.get(item.profileId) : undefined))
    .filter((item): item is DiscoverArtistHighlight => item !== null)
    .slice(0, 6);

  const playlistItems = sortPlaylistByCultureMatch(
    config.heritagePlaylists
      .filter((item) => item.active !== false && matchesLocation(item, params.city, params.country))
      .slice(0, 8),
    params.cultureIds ?? [],
  );

  return {
    featuredArtists,
    heritagePlaylist: playlistItems,
    source,
    updatedAt: config.updatedAt,
  };
}
