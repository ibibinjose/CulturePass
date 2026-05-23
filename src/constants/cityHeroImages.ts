/**
 * Hero and Explore Cities rail imagery.
 *
 * Uses stable Wikimedia Commons URLs (verified) — many legacy Unsplash `photo-*` IDs now 404.
 * Keys match `FeaturedCityData.slug` (lowercase, hyphenated).
 */

export const CITY_HERO_IMAGES_BY_SLUG: Record<string, string> = {
  sydney:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Sydney_Opera_House_-_Dec_2008.jpg/1920px-Sydney_Opera_House_-_Dec_2008.jpg',
  melbourne:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Melbourne_skyline.jpg/1920px-Melbourne_skyline.jpg',
  brisbane:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Brisbane_Skyline.jpg/1920px-Brisbane_Skyline.jpg',
  perth:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Perth_skyline_from_Kings_Park.jpg/1920px-Perth_skyline_from_Kings_Park.jpg',
  adelaide:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Adelaide_city_centre_view.jpg/1920px-Adelaide_city_centre_view.jpg',
  'gold-coast':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Gold_Coast_skyline.jpg/1920px-Gold_Coast_skyline.jpg',
  auckland: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Auckland_CBD.jpg',
  wellington: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Wellington_from_Mount_Victoria.jpg',
  dubai:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg/1920px-Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg',
  'abu-dhabi':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Abu_Dhabi_Skyline.jpg/1920px-Abu_Dhabi_Skyline.jpg',
  london:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/London_from_a_hot_air_balloon.jpg/1920px-London_from_a_hot_air_balloon.jpg',
  birmingham:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Selfridges_Building_Birmingham.jpg/1920px-Selfridges_Building_Birmingham.jpg',
  toronto:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/TorontoSkyline.jpg/1920px-TorontoSkyline.jpg',
  vancouver:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Vancouver_skyline.jpg/1920px-Vancouver_skyline.jpg',
  /** Region-style keys still used by some routes */
  uae:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg/1920px-Dubai_Skyline_mit_Burj_Khalifa_%2818241030269%29.jpg',
};

/** Unsplash default skyline — still returns 200; used when a city has no mapped photo. */
export const DEFAULT_CITY_HERO_IMAGE =
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=90';

function slugifyCityKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function lookupCityImageUrl(cityNameOrSlug: string): string | undefined {
  const raw = cityNameOrSlug.toLowerCase().trim();
  if (CITY_HERO_IMAGES_BY_SLUG[raw]) return CITY_HERO_IMAGES_BY_SLUG[raw];
  const slug = slugifyCityKey(cityNameOrSlug);
  return CITY_HERO_IMAGES_BY_SLUG[slug];
}

/** Resolve hero/rail image from display name, API slug, or hyphenated key. */
export function resolveCityHeroImageUrl(cityNameOrSlug: string): string {
  return lookupCityImageUrl(cityNameOrSlug) ?? DEFAULT_CITY_HERO_IMAGE;
}

/**
 * Resolve image for a featured city row — tries slug, name, Firestore doc id, and `cc-` doc id prefix.
 */
export function resolveFeaturedCityImageUrl(city: {
  slug?: string;
  name?: string;
  id?: string;
}): string {
  const candidates = [city.slug, city.name, city.id].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  for (const c of candidates) {
    const hit = lookupCityImageUrl(c);
    if (hit) return hit;
  }
  const id = city.id?.trim() ?? '';
  const stripped = id.replace(/^[a-z]{2}-/i, '');
  if (stripped && stripped !== id) {
    const hit = lookupCityImageUrl(stripped);
    if (hit) return hit;
  }
  return DEFAULT_CITY_HERO_IMAGE;
}

/** True when the app should trust `imageUrl` from the API (non-empty https URL). */
export function isLikelyValidRemoteImageUrl(url: string | undefined | null): boolean {
  if (url == null || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (!/^https:\/\//i.test(t)) return false;
  if (/^https:\/\/localhost/i.test(t)) return false;
  return true;
}
