/**
 * SEO Meta Generation Service
 *
 * Generates SEO metadata for host profiles including:
 * - Meta title/description
 * - Open Graph tags
 * - Twitter Card tags
 * - JSON-LD structured data (schema.org)
 * - Canonical URLs
 * - XML sitemap entries
 * - Heading hierarchy
 * - Image alt text optimization
 *
 * Requirements: 30
 */

import { siteUrl } from '@/lib/publicPaths';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Entity type mapping for schema.org types */
export type SEOEntityType =
  | 'community'
  | 'organiser'
  | 'venue'
  | 'business'
  | 'artist'
  | 'professional';

/** Open Graph metadata for social sharing */
export interface OpenGraphMeta {
  'og:type': string;
  'og:title': string;
  'og:description': string;
  'og:url': string;
  'og:image': string;
  'og:image:width'?: string;
  'og:image:height'?: string;
  'og:image:alt'?: string;
  'og:site_name': string;
  'og:locale': string;
}

/** Twitter Card metadata */
export interface TwitterCardMeta {
  'twitter:card': 'summary' | 'summary_large_image';
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image': string;
  'twitter:image:alt'?: string;
  'twitter:site'?: string;
}

/** JSON-LD structured data */
export interface JsonLdData {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  url?: string;
  image?: string | string[];
  logo?: string;
  address?: JsonLdAddress;
  geo?: JsonLdGeo;
  telephone?: string;
  email?: string;
  sameAs?: string[];
  [key: string]: unknown;
}

interface JsonLdAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

interface JsonLdGeo {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

/** Complete SEO metadata for a profile */
export interface ProfileSEOMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: OpenGraphMeta;
  twitterCard: TwitterCardMeta;
  jsonLd: JsonLdData;
  headingHierarchy: HeadingHierarchy;
  imageAltTexts: ImageAltText[];
  robots: string;
}

/** Heading hierarchy for proper H1-H6 structure */
export interface HeadingHierarchy {
  h1: string;
  h2: string[];
  h3?: string[];
}

/** Optimized alt text for profile images */
export interface ImageAltText {
  imageUrl: string;
  altText: string;
  role: 'logo' | 'hero' | 'gallery' | 'avatar';
}

/** XML sitemap entry */
export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  images?: SitemapImage[];
}

interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

/** Profile data subset needed for SEO generation */
export interface SEOProfileData {
  id: string;
  entityType: SEOEntityType;
  officialName?: string;
  name?: string;
  handle?: string;
  handleStatus?: 'pending' | 'approved' | 'rejected';
  slug?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  imageUrl?: string;
  heroImageUrl?: string;
  coverImageUrl?: string;
  gallery?: string[];
  galleryImages?: string[];
  primaryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  publicEmail?: string;
  website?: string;
  socialLinks?: { platform: string; url: string }[];
  categoryTags?: string[];
  tags?: string[];
  status?: 'draft' | 'published' | 'suspended';
  updatedAt?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const META_TITLE_MAX_LENGTH = 60;
const META_DESCRIPTION_MAX_LENGTH = 160;
const TWITTER_HANDLE = '@CulturePassApp';

/** Schema.org type mapping for each entity type */
const SCHEMA_ORG_TYPE_MAP: Record<SEOEntityType, string> = {
  community: 'Organization',
  organiser: 'Organization',
  venue: 'LocalBusiness',
  business: 'LocalBusiness',
  artist: 'Person',
  professional: 'Person',
};

/** Human-readable entity type labels */
const ENTITY_TYPE_LABELS: Record<SEOEntityType, string> = {
  community: 'Community',
  organiser: 'Event Organiser',
  venue: 'Venue',
  business: 'Business',
  artist: 'Artist',
  professional: 'Professional',
};

// ---------------------------------------------------------------------------
// Meta Title Generation
// ---------------------------------------------------------------------------

/**
 * Generate SEO-optimized meta title from profile name and entity type.
 * Format: "{Name} — {EntityType} | CulturePass"
 * Truncates to 60 characters for optimal search display.
 */
export function generateMetaTitle(
  profileName: string,
  entityType: SEOEntityType,
): string {
  const label = ENTITY_TYPE_LABELS[entityType] || 'Profile';
  const suffix = ` | ${APP_NAME}`;
  const separator = ' — ';

  // Calculate available space for name
  const fixedLength = separator.length + label.length + suffix.length;
  const availableForName = META_TITLE_MAX_LENGTH - fixedLength;

  const truncatedName =
    profileName.length > availableForName
      ? profileName.substring(0, availableForName - 1).trim() + '…'
      : profileName;

  const title = `${truncatedName}${separator}${label}${suffix}`;

  // Final safety truncation
  if (title.length > META_TITLE_MAX_LENGTH) {
    return title.substring(0, META_TITLE_MAX_LENGTH - 1).trim() + '…';
  }

  return title;
}

// ---------------------------------------------------------------------------
// Meta Description Generation
// ---------------------------------------------------------------------------

/**
 * Generate meta description from tagline and first 160 characters of description.
 * Strips HTML tags from rich text content.
 */
export function generateMetaDescription(
  tagline?: string,
  description?: string,
): string {
  const cleanDescription = stripHtmlTags(description || '');
  const cleanTagline = (tagline || '').trim();

  if (cleanTagline && cleanDescription) {
    const combined = `${cleanTagline}. ${cleanDescription}`;
    return truncateAtWord(combined, META_DESCRIPTION_MAX_LENGTH);
  }

  if (cleanTagline) {
    return truncateAtWord(cleanTagline, META_DESCRIPTION_MAX_LENGTH);
  }

  if (cleanDescription) {
    return truncateAtWord(cleanDescription, META_DESCRIPTION_MAX_LENGTH);
  }

  return '';
}

// ---------------------------------------------------------------------------
// Canonical URL Generation
// ---------------------------------------------------------------------------

/**
 * Generate canonical URL for a profile.
 * Uses handle (if approved), slug, or ID as the path segment.
 */
export function generateCanonicalUrl(profile: SEOProfileData): string {
  const entityPrefix = getEntityUrlPrefix(profile.entityType);
  const segment = getProfileSegment(profile);
  return siteUrl(`${entityPrefix}/${segment}`);
}

/**
 * Get the URL prefix for an entity type.
 */
function getEntityUrlPrefix(entityType: SEOEntityType): string {
  switch (entityType) {
    case 'community':
      return '/community';
    case 'organiser':
      return '/organiser';
    case 'venue':
      return '/venue';
    case 'business':
      return '/business';
    case 'artist':
      return '/artist';
    case 'professional':
      return '/professional';
    default:
      return '/profile';
  }
}

/**
 * Get the URL segment for a profile (handle, slug, or ID).
 */
function getProfileSegment(profile: SEOProfileData): string {
  const handle = (profile.handle ?? '').trim();
  if (handle && profile.handleStatus === 'approved') {
    return handle.toLowerCase();
  }
  if (profile.slug) {
    return profile.slug;
  }
  return profile.id;
}

// ---------------------------------------------------------------------------
// Open Graph Tags
// ---------------------------------------------------------------------------

/**
 * Generate Open Graph tags for social media sharing.
 */
export function generateOpenGraphTags(profile: SEOProfileData): OpenGraphMeta {
  const name = profile.officialName || profile.name || '';
  const image = profile.heroImageUrl || profile.coverImageUrl || profile.logoUrl || profile.imageUrl || '';
  const description = generateMetaDescription(profile.tagline, profile.description);
  const url = generateCanonicalUrl(profile);

  return {
    'og:type': getOpenGraphType(profile.entityType),
    'og:title': generateMetaTitle(name, profile.entityType),
    'og:description': description,
    'og:url': url,
    'og:image': image,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': generateImageAlt(name, profile.entityType, 'hero'),
    'og:site_name': APP_NAME,
    'og:locale': 'en_AU',
  };
}

/**
 * Map entity type to Open Graph type.
 */
function getOpenGraphType(entityType: SEOEntityType): string {
  switch (entityType) {
    case 'community':
    case 'organiser':
      return 'profile';
    case 'venue':
    case 'business':
      return 'business.business';
    case 'artist':
    case 'professional':
      return 'profile';
    default:
      return 'website';
  }
}

// ---------------------------------------------------------------------------
// Twitter Card Tags
// ---------------------------------------------------------------------------

/**
 * Generate Twitter Card tags for Twitter sharing.
 */
export function generateTwitterCardTags(profile: SEOProfileData): TwitterCardMeta {
  const name = profile.officialName || profile.name || '';
  const image = profile.heroImageUrl || profile.coverImageUrl || profile.logoUrl || profile.imageUrl || '';
  const description = generateMetaDescription(profile.tagline, profile.description);

  return {
    'twitter:card': image ? 'summary_large_image' : 'summary',
    'twitter:title': generateMetaTitle(name, profile.entityType),
    'twitter:description': description,
    'twitter:image': image,
    'twitter:image:alt': generateImageAlt(name, profile.entityType, 'hero'),
    'twitter:site': TWITTER_HANDLE,
  };
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

/**
 * Generate JSON-LD structured data for rich search results.
 * Uses schema.org markup for the appropriate entity type.
 */
export function generateJsonLd(profile: SEOProfileData): JsonLdData {
  const schemaType = SCHEMA_ORG_TYPE_MAP[profile.entityType] || 'Thing';
  const name = profile.officialName || profile.name || '';
  const description = stripHtmlTags(profile.description || '');
  const url = generateCanonicalUrl(profile);
  const image = profile.heroImageUrl || profile.coverImageUrl || profile.logoUrl || profile.imageUrl;
  const logo = profile.logoUrl || profile.imageUrl;

  const jsonLd: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name,
    url,
  };

  if (description) {
    jsonLd.description = truncateAtWord(description, 300);
  }

  if (image) {
    jsonLd.image = image;
  }

  if (logo) {
    jsonLd.logo = logo;
  }

  // Address
  const address = buildJsonLdAddress(profile);
  if (address) {
    jsonLd.address = address;
  }

  // Geo coordinates
  const geo = buildJsonLdGeo(profile);
  if (geo) {
    jsonLd.geo = geo;
  }

  // Contact info
  const phone = profile.phone;
  if (phone) {
    jsonLd.telephone = phone;
  }

  const email = profile.publicEmail || profile.email;
  if (email) {
    jsonLd.email = email;
  }

  // Social links
  const sameAs = buildSameAsLinks(profile);
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }

  // Entity-specific fields
  addEntitySpecificJsonLd(jsonLd, profile);

  return jsonLd;
}

/**
 * Build PostalAddress for JSON-LD.
 */
function buildJsonLdAddress(profile: SEOProfileData): JsonLdAddress | null {
  const addr = profile.primaryAddress;
  if (addr && (addr.street || addr.city)) {
    return {
      '@type': 'PostalAddress',
      streetAddress: addr.street,
      addressLocality: addr.city,
      addressRegion: addr.state,
      postalCode: addr.postcode,
      addressCountry: addr.country || 'AU',
    };
  }

  // Fallback to flat address fields
  if (profile.address || profile.city) {
    return {
      '@type': 'PostalAddress',
      streetAddress: profile.address,
      addressLocality: profile.city,
      addressCountry: profile.country || 'AU',
    };
  }

  return null;
}

/**
 * Build GeoCoordinates for JSON-LD.
 */
function buildJsonLdGeo(profile: SEOProfileData): JsonLdGeo | null {
  const lat = profile.primaryAddress?.latitude ?? profile.latitude;
  const lng = profile.primaryAddress?.longitude ?? profile.longitude;

  if (lat != null && lng != null) {
    return {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    };
  }

  return null;
}

/**
 * Build sameAs links from social profiles and website.
 */
function buildSameAsLinks(profile: SEOProfileData): string[] {
  const links: string[] = [];

  if (profile.website) {
    links.push(profile.website);
  }

  if (profile.socialLinks) {
    for (const link of profile.socialLinks) {
      if (link.url) {
        links.push(link.url);
      }
    }
  }

  return links;
}

/**
 * Add entity-specific JSON-LD fields.
 */
function addEntitySpecificJsonLd(jsonLd: JsonLdData, profile: SEOProfileData): void {
  switch (profile.entityType) {
    case 'venue':
    case 'business':
      // LocalBusiness specific
      if (profile.categoryTags?.length || profile.tags?.length) {
        jsonLd.keywords = (profile.categoryTags || profile.tags || []).join(', ');
      }
      break;

    case 'artist':
    case 'professional':
      // Person specific
      jsonLd.jobTitle = ENTITY_TYPE_LABELS[profile.entityType];
      if (profile.categoryTags?.length || profile.tags?.length) {
        jsonLd.knowsAbout = (profile.categoryTags || profile.tags || []).join(', ');
      }
      break;

    case 'community':
    case 'organiser':
      // Organization specific
      if (profile.categoryTags?.length || profile.tags?.length) {
        jsonLd.keywords = (profile.categoryTags || profile.tags || []).join(', ');
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// XML Sitemap Entry
// ---------------------------------------------------------------------------

/**
 * Generate XML sitemap entry for a published profile.
 */
export function generateSitemapEntry(profile: SEOProfileData): SitemapEntry | null {
  // Only published profiles should be in the sitemap
  if (profile.status === 'draft' || profile.status === 'suspended') {
    return null;
  }

  const url = generateCanonicalUrl(profile);
  const lastmod = profile.updatedAt || profile.createdAt || new Date().toISOString();

  const entry: SitemapEntry = {
    loc: url,
    lastmod: formatSitemapDate(lastmod),
    changefreq: 'weekly',
    priority: getSitemapPriority(profile.entityType),
  };

  // Add images to sitemap
  const images = collectProfileImages(profile);
  if (images.length > 0) {
    entry.images = images.map((img) => ({
      loc: img.imageUrl,
      title: img.altText,
    }));
  }

  return entry;
}

/**
 * Generate XML sitemap string for multiple profiles.
 */
export function generateSitemapXml(profiles: SEOProfileData[]): string {
  const entries = profiles
    .map(generateSitemapEntry)
    .filter((entry): entry is SitemapEntry => entry !== null);

  const urlEntries = entries
    .map((entry) => {
      let imageXml = '';
      if (entry.images?.length) {
        imageXml = entry.images
          .map(
            (img) =>
              `    <image:image>\n      <image:loc>${escapeXml(img.loc)}</image:loc>${img.title ? `\n      <image:title>${escapeXml(img.title)}</image:title>` : ''}\n    </image:image>`,
          )
          .join('\n');
      }

      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>${imageXml ? `\n${imageXml}` : ''}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries}\n</urlset>`;
}

/**
 * Get sitemap priority based on entity type.
 */
function getSitemapPriority(entityType: SEOEntityType): number {
  switch (entityType) {
    case 'venue':
    case 'business':
      return 0.8;
    case 'community':
    case 'organiser':
      return 0.7;
    case 'artist':
    case 'professional':
      return 0.6;
    default:
      return 0.5;
  }
}

// ---------------------------------------------------------------------------
// Heading Hierarchy
// ---------------------------------------------------------------------------

/**
 * Generate proper heading hierarchy for a profile page.
 * H1: Profile name
 * H2: Major sections
 * H3: Sub-sections
 */
export function generateHeadingHierarchy(profile: SEOProfileData): HeadingHierarchy {
  const name = profile.officialName || profile.name || 'Profile';

  const h2Sections: string[] = ['About', 'Location', 'Contact'];

  // Add entity-specific sections
  switch (profile.entityType) {
    case 'community':
      h2Sections.push('Membership', 'Guidelines', 'Events');
      break;
    case 'organiser':
      h2Sections.push('Past Events', 'Credentials');
      break;
    case 'venue':
      h2Sections.push('Capacity', 'Facilities', 'Opening Hours');
      break;
    case 'business':
      h2Sections.push('Products & Services', 'Business Hours');
      break;
    case 'artist':
      h2Sections.push('Portfolio', 'Availability');
      break;
    case 'professional':
      h2Sections.push('Expertise', 'Rate Card', 'Availability');
      break;
  }

  return {
    h1: name,
    h2: h2Sections,
  };
}

// ---------------------------------------------------------------------------
// Image Alt Text Optimization
// ---------------------------------------------------------------------------

/**
 * Generate optimized alt text for profile images.
 */
export function generateImageAltTexts(profile: SEOProfileData): ImageAltText[] {
  const name = profile.officialName || profile.name || 'Profile';
  const entityLabel = ENTITY_TYPE_LABELS[profile.entityType] || 'Profile';
  const altTexts: ImageAltText[] = [];

  // Logo
  const logo = profile.logoUrl || profile.imageUrl;
  if (logo) {
    altTexts.push({
      imageUrl: logo,
      altText: `${name} logo — ${entityLabel} on ${APP_NAME}`,
      role: 'logo',
    });
  }

  // Hero/Cover image
  const hero = profile.heroImageUrl || profile.coverImageUrl;
  if (hero) {
    altTexts.push({
      imageUrl: hero,
      altText: generateImageAlt(name, profile.entityType, 'hero'),
      role: 'hero',
    });
  }

  // Gallery images
  const gallery = profile.galleryImages || profile.gallery || [];
  gallery.forEach((imageUrl, index) => {
    altTexts.push({
      imageUrl,
      altText: `${name} — Gallery image ${index + 1}`,
      role: 'gallery',
    });
  });

  return altTexts;
}

/**
 * Generate descriptive alt text for a single image.
 */
export function generateImageAlt(
  profileName: string,
  entityType: SEOEntityType,
  role: 'logo' | 'hero' | 'gallery' | 'avatar',
): string {
  const entityLabel = ENTITY_TYPE_LABELS[entityType] || 'Profile';

  switch (role) {
    case 'logo':
      return `${profileName} logo — ${entityLabel} on ${APP_NAME}`;
    case 'hero':
      return `${profileName} — ${entityLabel} cover image`;
    case 'gallery':
      return `${profileName} — Gallery photo`;
    case 'avatar':
      return `${profileName} profile photo`;
    default:
      return `${profileName} image`;
  }
}

// ---------------------------------------------------------------------------
// Robots Directives
// ---------------------------------------------------------------------------

/**
 * Generate robots meta tag content.
 * Published profiles are indexed; drafts and suspended profiles are not.
 */
export function generateRobotsDirective(status?: string): string {
  if (status === 'draft' || status === 'suspended') {
    return 'noindex, nofollow';
  }
  return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
}

/**
 * Generate robots.txt content for the profiles section.
 */
export function generateRobotsTxt(): string {
  return [
    'User-agent: *',
    '',
    '# Allow published profiles',
    'Allow: /community/',
    'Allow: /organiser/',
    'Allow: /venue/',
    'Allow: /business/',
    'Allow: /artist/',
    'Allow: /professional/',
    '',
    '# Disallow draft and admin pages',
    'Disallow: /hostspace/create/',
    'Disallow: /admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Complete SEO Meta Generation
// ---------------------------------------------------------------------------

/**
 * Generate complete SEO metadata for a profile.
 * This is the main entry point for SEO generation.
 */
export function generateProfileSEO(profile: SEOProfileData): ProfileSEOMeta {
  const name = profile.officialName || profile.name || '';

  return {
    title: generateMetaTitle(name, profile.entityType),
    description: generateMetaDescription(profile.tagline, profile.description),
    canonicalUrl: generateCanonicalUrl(profile),
    openGraph: generateOpenGraphTags(profile),
    twitterCard: generateTwitterCardTags(profile),
    jsonLd: generateJsonLd(profile),
    headingHierarchy: generateHeadingHierarchy(profile),
    imageAltTexts: generateImageAltTexts(profile),
    robots: generateRobotsDirective(profile.status),
  };
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags from rich text content.
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text at word boundary.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '…';
  }

  return truncated.trim() + '…';
}

/**
 * Format date for sitemap (YYYY-MM-DD).
 */
function formatSitemapDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Escape special XML characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Collect all images from a profile for sitemap inclusion.
 */
function collectProfileImages(profile: SEOProfileData): ImageAltText[] {
  return generateImageAltTexts(profile);
}
