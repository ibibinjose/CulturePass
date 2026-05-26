/**
 * DeepLinkResolver — Resilient deep link resolution with fallback logic,
 * auth gate destination persistence, and Open Graph meta generation.
 *
 * Handles all short link prefixes: /e/, /c/, /b/, /v/, /u/, /o/, /t/
 *
 * Usage:
 *   import { deepLinkResolver } from '@/lib/deep-link-resolver';
 *   const result = await deepLinkResolver.resolve('e', 'abc123');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import { STORAGE_KEYS } from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Summary of an entity used in fallback results. */
export interface EntitySummary {
  id: string;
  type: DeepLinkEntityType;
  title: string;
  imageUrl?: string;
  city?: string;
  createdAt?: string;
}

/** Open Graph meta tags for social sharing previews. */
export interface OGMeta {
  title: string;
  image: string;
  description: string;
}

/** Result of resolving a deep link. */
export interface DeepLinkResult {
  status: 'resolved' | 'fallback' | 'not_found' | 'auth_required';
  targetRoute?: string;
  fallbackEntities?: EntitySummary[];
  ogMeta?: OGMeta;
}

/** Entity types mapped from short link prefixes. */
export type DeepLinkEntityType =
  | 'event'
  | 'community'
  | 'business'
  | 'venue'
  | 'user'
  | 'organisation'
  | 'ticket';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Valid short link prefixes and their corresponding entity types. */
const PREFIX_MAP: Record<string, DeepLinkEntityType> = {
  e: 'event',
  c: 'community',
  b: 'business',
  v: 'venue',
  u: 'user',
  o: 'organisation',
  t: 'ticket',
} as const;

/** Route templates for each entity type. */
const ROUTE_MAP: Record<DeepLinkEntityType, (id: string) => string> = {
  event: (id) => `/event/${encodeURIComponent(id)}`,
  community: (id) => `/community/${encodeURIComponent(id)}`,
  business: (id) => `/business/${encodeURIComponent(id)}`,
  venue: (id) => `/venue/${encodeURIComponent(id)}`,
  user: (id) => `/user/${encodeURIComponent(id)}`,
  organisation: (id) => `/organiser/${encodeURIComponent(id)}`,
  ticket: (id) => `/tickets/${encodeURIComponent(id)}`,
};

/** Maximum allowed length for an entity ID. */
const MAX_ID_LENGTH = 128;

/** Pattern for valid entity IDs (alphanumeric, hyphens, underscores). */
const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Maximum number of fallback entities to return. */
const MAX_FALLBACK_ENTITIES = 5;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Checks whether a prefix is a recognised short link prefix.
 */
function isValidPrefix(prefix: string): prefix is keyof typeof PREFIX_MAP {
  return Object.prototype.hasOwnProperty.call(PREFIX_MAP, prefix);
}

/**
 * Validates an entity ID for format correctness.
 * Returns true if the ID is non-empty, within length limits, and contains
 * only valid characters.
 */
function isValidId(id: string): boolean {
  if (!id || id.length === 0) return false;
  if (id.length > MAX_ID_LENGTH) return false;
  return VALID_ID_PATTERN.test(id);
}

// ---------------------------------------------------------------------------
// Resolution Logic
// ---------------------------------------------------------------------------

interface ResolveApiResponse {
  exists: boolean;
  entity?: {
    id: string;
    title?: string;
    name?: string;
    displayName?: string;
    imageUrl?: string;
    heroImage?: string;
    city?: string;
    description?: string;
    status?: string;
  };
  fallbackEntities?: {
    id: string;
    title?: string;
    name?: string;
    displayName?: string;
    imageUrl?: string;
    heroImage?: string;
    city?: string;
    createdAt?: string;
  }[];
  authRequired?: boolean;
}

/**
 * Resolves a deep link by checking entity existence and providing fallbacks.
 *
 * Resolution flow:
 * 1. Validate prefix and ID format → not_found if invalid
 * 2. Call backend to check entity existence
 * 3. If entity exists → resolved with targetRoute
 * 4. If auth required → auth_required with persisted destination
 * 5. If entity deleted/unpublished → query fallback entities of same type/city
 * 6. If fallback entities found → fallback with entities
 * 7. If no fallbacks → not_found (navigate to Discover + toast)
 */
async function resolve(prefix: string, id: string): Promise<DeepLinkResult> {
  // Step 1: Validate prefix and ID
  if (!isValidPrefix(prefix)) {
    return { status: 'not_found' };
  }

  if (!isValidId(id)) {
    return { status: 'not_found' };
  }

  const entityType = PREFIX_MAP[prefix];
  const targetRoute = ROUTE_MAP[entityType](id);

  try {
    // Step 2: Call backend to resolve the deep link
    const response = await api.raw<ResolveApiResponse>(
      'GET',
      `api/deep-links/resolve/${encodeURIComponent(prefix)}/${encodeURIComponent(id)}`
    );

    // Step 3: Auth required
    if (response.authRequired) {
      await persistDestination(targetRoute);
      return { status: 'auth_required', targetRoute };
    }

    // Step 4: Entity exists and is valid
    if (response.exists && response.entity) {
      return {
        status: 'resolved',
        targetRoute,
        ogMeta: generateOGMeta(prefix, response.entity),
      };
    }

    // Step 5: Entity not found — check for fallback entities
    if (response.fallbackEntities && response.fallbackEntities.length > 0) {
      const fallbackEntities: EntitySummary[] = response.fallbackEntities
        .slice(0, MAX_FALLBACK_ENTITIES)
        .map((entity) => ({
          id: entity.id,
          type: entityType,
          title: entity.title || entity.name || entity.displayName || 'Untitled',
          imageUrl: entity.imageUrl || entity.heroImage,
          city: entity.city,
          createdAt: entity.createdAt,
        }));

      return {
        status: 'fallback',
        fallbackEntities,
      };
    }

    // Step 6: No fallback entities available
    return { status: 'not_found' };
  } catch (error: unknown) {
    // Network errors or unexpected failures → not_found
    if (__DEV__) {
      console.error('[DeepLinkResolver] resolve failed:', error);
    }
    return { status: 'not_found' };
  }
}

// ---------------------------------------------------------------------------
// Auth Gate Destination Persistence
// ---------------------------------------------------------------------------

/**
 * Persists the intended destination route for retrieval after auth completes.
 * Used when an unauthenticated user taps a deep link to a login-required resource.
 */
async function persistDestination(route: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEEP_LINK_DESTINATION, route);
  } catch (error: unknown) {
    if (__DEV__) {
      console.error('[DeepLinkResolver] persistDestination failed:', error);
    }
  }
}

/**
 * Retrieves the persisted destination route after successful authentication.
 * Returns null if no destination was persisted.
 */
async function getPersistedDestination(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEEP_LINK_DESTINATION);
  } catch (error: unknown) {
    if (__DEV__) {
      console.error('[DeepLinkResolver] getPersistedDestination failed:', error);
    }
    return null;
  }
}

/**
 * Clears the persisted destination after navigation completes.
 * Should be called once the user has been navigated to the intended route.
 */
async function clearPersistedDestination(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DEEP_LINK_DESTINATION);
  } catch (error: unknown) {
    if (__DEV__) {
      console.error('[DeepLinkResolver] clearPersistedDestination failed:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Open Graph Meta Generation
// ---------------------------------------------------------------------------

/** Default OG meta descriptions per entity type. */
const OG_DESCRIPTIONS: Record<DeepLinkEntityType, string> = {
  event: 'Discover this event on CulturePass — your cultural lifestyle marketplace.',
  community: 'Join this community on CulturePass — belong anywhere.',
  business: 'Explore this business on CulturePass — your cultural lifestyle marketplace.',
  venue: 'Visit this venue on CulturePass — discover cultural spaces near you.',
  user: 'Connect with this member on CulturePass — belong anywhere.',
  organisation: 'Discover this organisation on CulturePass — your cultural lifestyle marketplace.',
  ticket: 'View ticket details on CulturePass — your cultural lifestyle marketplace.',
};

/** Default OG image when entity has no image. */
const DEFAULT_OG_IMAGE = 'https://culturepass.co/og-default.png';

/**
 * Generates Open Graph meta tags for a given entity and prefix.
 * Used for social sharing preview cards in messaging apps.
 *
 * @param prefix - The short link prefix (e, c, b, v, u, o, t)
 * @param entity - The entity data (flexible shape from API)
 * @returns OGMeta with title, image, and description
 */
function generateOGMeta(prefix: string, entity: unknown): OGMeta {
  if (!isValidPrefix(prefix)) {
    return {
      title: 'CulturePass',
      image: DEFAULT_OG_IMAGE,
      description: 'Discover. Connect. Belong.',
    };
  }

  const entityType = PREFIX_MAP[prefix];
  const entityObj = entity as Record<string, unknown> | null;

  // Extract title from various possible fields
  const title = extractString(entityObj, ['title', 'name', 'displayName']) || 'CulturePass';

  // Extract image from various possible fields
  const image = extractString(entityObj, ['imageUrl', 'heroImage', 'image', 'avatarUrl']) || DEFAULT_OG_IMAGE;

  // Extract description or use default
  const description =
    extractString(entityObj, ['description', 'bio', 'tagline', 'subtitle']) ||
    OG_DESCRIPTIONS[entityType];

  return { title, image, description };
}

/**
 * Extracts the first non-empty string value from an object given a list of
 * candidate field names.
 */
function extractString(
  obj: Record<string, unknown> | null | undefined,
  fields: string[]
): string | undefined {
  if (!obj) return undefined;
  for (const field of fields) {
    const value = obj[field];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the entity type for a given prefix, or undefined if invalid.
 */
function getEntityType(prefix: string): DeepLinkEntityType | undefined {
  if (isValidPrefix(prefix)) {
    return PREFIX_MAP[prefix];
  }
  return undefined;
}

/**
 * Returns the target route for a given prefix and ID without resolution.
 * Useful for constructing routes when you already know the entity exists.
 */
function getTargetRoute(prefix: string, id: string): string | undefined {
  if (!isValidPrefix(prefix) || !isValidId(id)) return undefined;
  const entityType = PREFIX_MAP[prefix];
  return ROUTE_MAP[entityType](id);
}

export const deepLinkResolver = {
  resolve,
  persistDestination,
  getPersistedDestination,
  clearPersistedDestination,
  generateOGMeta,
  getEntityType,
  getTargetRoute,
  isValidPrefix,
  isValidId,
} as const;
