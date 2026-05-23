/**
 * Featured Cities Service — CulturePass Cloud Functions
 *
 * Manages the `featuredCities` Firestore collection.
 * These are the cities shown on the Discover tab CityRail —
 * a curated, admin-managed list with optional cover images
 * (stored in Firebase Storage). Separate from the locations
 * hierarchy used by onboarding (states + cities under `locations/{cc}`).
 *
 * Firestore structure:
 *   featuredCities/{cityId}
 *     name: string           — "Sydney"
 *     slug: string           — "sydney"
 *     countryCode: string    — "AU"
 *     countryName: string    — "Australia"
 *     countryEmoji: string   — "🇦🇺"
 *     stateCode?: string     — "NSW"
 *     imageUrl?: string      — Firebase Storage download URL
 *     featured: boolean      — shown in Discover CityRail
 *     order: number          — sort order (lower = first)
 *     lat?: number
 *     lng?: number
 *     createdAt: string (ISO)
 *     updatedAt: string (ISO)
 */

import { db } from '../admin';
import { InMemoryTtlCache } from './cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeaturedCity {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  countryEmoji: string;
  stateCode?: string;
  imageUrl?: string;
  featured: boolean;
  order: number;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityInput {
  name: string;
  countryCode: string;
  countryName: string;
  countryEmoji: string;
  stateCode?: string;
  imageUrl?: string;
  featured?: boolean;
  order?: number;
  lat?: number;
  lng?: number;
}

export interface UpdateCityInput {
  name?: string;
  countryCode?: string;
  countryName?: string;
  countryEmoji?: string;
  stateCode?: string;
  imageUrl?: string | null;
  featured?: boolean;
  order?: number;
  lat?: number;
  lng?: number;
}

// ---------------------------------------------------------------------------
// Firestore collection
// ---------------------------------------------------------------------------

const col = () => db.collection('featuredCities');

// ---------------------------------------------------------------------------
// Cache — 10-minute TTL, invalidated on writes
// ---------------------------------------------------------------------------

const cache = new InMemoryTtlCache(10 * 60_000);
const FEATURED_KEY = 'featuredCities:featured';
const ALL_KEY = 'featuredCities:all';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function cityIdentityKey(city: Pick<FeaturedCity, 'countryCode' | 'slug'>): string {
  return `${city.countryCode.toUpperCase()}::${city.slug}`;
}

function dedupeCities(cities: FeaturedCity[]): FeaturedCity[] {
  const byIdentity = new Map<string, FeaturedCity>();
  for (const city of cities) {
    const key = cityIdentityKey(city);
    const current = byIdentity.get(key);
    if (!current) {
      byIdentity.set(key, city);
      continue;
    }
    // Keep the city with the lowest configured order for stable UI ordering.
    if ((city.order ?? 999) < (current.order ?? 999)) {
      byIdentity.set(key, city);
    }
  }
  return [...byIdentity.values()].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function toCity(id: string, data: Record<string, unknown>): FeaturedCity {
  return {
    id,
    name: data.name as string,
    slug: (data.slug as string) ?? slugify(data.name as string),
    countryCode: data.countryCode as string,
    countryName: data.countryName as string,
    countryEmoji: data.countryEmoji as string,
    stateCode: data.stateCode as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
    featured: Boolean(data.featured),
    order: (data.order as number) ?? 999,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const citiesService = {
  /** Return all featured cities ordered by `order` asc */
  async getFeatured(): Promise<FeaturedCity[]> {
    const cached = cache.get<FeaturedCity[]>(FEATURED_KEY);
    if (cached) return cached;

    let snap;
    try {
      snap = await col()
        .where('featured', '==', true)
        .orderBy('order', 'asc')
        .get();
    } catch {
      // New Firebase projects often lack the composite index (featured + order). Fall back and sort in memory.
      snap = await col().where('featured', '==', true).get();
    }

    const cities = snap.docs
      .map((d) => toCity(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const deduped = dedupeCities(cities);
    cache.set(FEATURED_KEY, deduped);
    return deduped;
  },

  /** Return all cities (admin use) */
  async getAll(): Promise<FeaturedCity[]> {
    const cached = cache.get<FeaturedCity[]>(ALL_KEY);
    if (cached) return cached;

    const snap = await col().orderBy('order', 'asc').get();
    const cities = snap.docs.map((d) => toCity(d.id, d.data() as Record<string, unknown>));
    const deduped = dedupeCities(cities);
    cache.set(ALL_KEY, deduped);
    return deduped;
  },

  /** Get a single city by ID */
  async getById(id: string): Promise<FeaturedCity | null> {
    const doc = await col().doc(id).get();
    if (!doc.exists) return null;
    return toCity(doc.id, doc.data() as Record<string, unknown>);
  },

  /** Create a new featured city */
  async create(input: CreateCityInput): Promise<FeaturedCity> {
    const now = new Date().toISOString();
    const slug = slugify(input.name);

    // Determine next order if not specified
    let order = input.order;
    if (order === undefined) {
      const snap = await col().orderBy('order', 'desc').limit(1).get();
      order = snap.empty ? 0 : ((snap.docs[0].data().order as number) ?? 0) + 10;
    }

    const data = {
      name: input.name,
      slug,
      countryCode: input.countryCode,
      countryName: input.countryName,
      countryEmoji: input.countryEmoji,
      stateCode: input.stateCode ?? null,
      imageUrl: input.imageUrl ?? null,
      featured: input.featured ?? true,
      order,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await col().add(data);
    cache.del(FEATURED_KEY);
    cache.del(ALL_KEY);
    return toCity(ref.id, data);
  },

  /** Update a city (partial) */
  async update(id: string, input: UpdateCityInput): Promise<void> {
    const patch: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };

    // Regenerate slug if name changed
    if (input.name) patch.slug = slugify(input.name);

    // Explicitly allow clearing imageUrl
    if (input.imageUrl === null) patch.imageUrl = null;

    await col().doc(id).update(patch);
    cache.del(FEATURED_KEY);
    cache.del(ALL_KEY);
  },

  /** Delete a city */
  async delete(id: string): Promise<void> {
    await col().doc(id).delete();
    cache.del(FEATURED_KEY);
    cache.del(ALL_KEY);
  },

  /** Seed initial featured cities if collection is empty */
  async seedIfEmpty(): Promise<boolean> {
    const snap = await col().limit(1).get();
    if (!snap.empty) return false;
    await this.seed();
    return true;
  },

  /** Seed (or re-seed) with default cities */
  async seed(): Promise<void> {
    const batch = db.batch();
    const now = new Date().toISOString();

    DEFAULT_FEATURED_CITIES.forEach((city, i) => {
      // Deterministic ID prevents duplicate rows when seed runs multiple times.
      const ref = col().doc(`${city.countryCode.toLowerCase()}-${slugify(city.name)}`);
      batch.set(ref, {
        ...city,
        slug: slugify(city.name),
        featured: true,
        order: i * 10,
        imageUrl: null,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    cache.del(FEATURED_KEY);
    cache.del(ALL_KEY);
  },
};

// ---------------------------------------------------------------------------
// Default seed data — no external image URLs; admin uploads images via
// the admin/locations screen → Firebase Storage
// ---------------------------------------------------------------------------

const DEFAULT_FEATURED_CITIES: Omit<CreateCityInput, 'order' | 'imageUrl'>[] = [
  // Australia
  { name: 'Sydney',      countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'NSW', lat: -33.8688,  lng: 151.2093 },
  { name: 'Melbourne',   countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'VIC', lat: -37.8136,  lng: 144.9631 },
  { name: 'Brisbane',    countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'QLD', lat: -27.4698,  lng: 153.0251 },
  { name: 'Perth',       countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'WA',  lat: -31.9505,  lng: 115.8605 },
  { name: 'Adelaide',    countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'SA',  lat: -34.9285,  lng: 138.6007 },
  { name: 'Gold Coast',  countryCode: 'AU', countryName: 'Australia', countryEmoji: '🇦🇺', stateCode: 'QLD', lat: -28.0167,  lng: 153.4000 },
  // New Zealand
  { name: 'Auckland',    countryCode: 'NZ', countryName: 'New Zealand', countryEmoji: '🇳🇿', lat: -36.8509,  lng: 174.7645 },
  { name: 'Wellington',  countryCode: 'NZ', countryName: 'New Zealand', countryEmoji: '🇳🇿', lat: -41.2866,  lng: 174.7756 },
  // UAE
  { name: 'Dubai',       countryCode: 'AE', countryName: 'UAE',         countryEmoji: '🇦🇪', lat: 25.2048,   lng: 55.2708  },
  { name: 'Abu Dhabi',   countryCode: 'AE', countryName: 'UAE',         countryEmoji: '🇦🇪', lat: 24.4539,   lng: 54.3773  },
  // UK
  { name: 'London',      countryCode: 'GB', countryName: 'UK',          countryEmoji: '🇬🇧', lat: 51.5074,   lng: -0.1278  },
  { name: 'Birmingham',  countryCode: 'GB', countryName: 'UK',          countryEmoji: '🇬🇧', lat: 52.4862,   lng: -1.8904  },
  // Canada
  { name: 'Toronto',     countryCode: 'CA', countryName: 'Canada',      countryEmoji: '🇨🇦', lat: 43.6532,   lng: -79.3832 },
  { name: 'Vancouver',   countryCode: 'CA', countryName: 'Canada',      countryEmoji: '🇨🇦', lat: 49.2827,   lng: -123.1207 },
];
