/**
 * SEO Service Tests
 *
 * Tests for the SEO meta generation service.
 * Covers meta title/description generation, Open Graph tags,
 * Twitter Card tags, JSON-LD structured data, canonical URLs,
 * sitemap generation, heading hierarchy, and image alt texts.
 */

import {
  generateMetaTitle,
  generateMetaDescription,
  generateCanonicalUrl,
  generateOpenGraphTags,
  generateTwitterCardTags,
  generateJsonLd,
  generateSitemapEntry,
  generateSitemapXml,
  generateHeadingHierarchy,
  generateImageAltTexts,
  generateImageAlt,
  generateRobotsDirective,
  generateRobotsTxt,
  generateProfileSEO,
  stripHtmlTags,
  truncateAtWord,
  type SEOProfileData,
} from '../seoService';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/publicPaths', () => ({
  siteUrl: (path: string) => `https://culturepass.co${path}`,
}));

jest.mock('@/lib/app-meta', () => ({
  APP_NAME: 'CulturePass',
  SITE_ORIGIN: 'https://culturepass.co',
}));

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function createMockProfile(overrides: Partial<SEOProfileData> = {}): SEOProfileData {
  return {
    id: 'profile-123',
    entityType: 'community',
    officialName: 'Sydney Cultural Hub',
    handle: 'sydney-cultural-hub',
    handleStatus: 'approved',
    tagline: 'Connecting cultures in Sydney',
    description: '<p>A vibrant community bringing together diverse cultures.</p>',
    logoUrl: 'https://cdn.example.com/logo.jpg',
    heroImageUrl: 'https://cdn.example.com/hero.jpg',
    galleryImages: ['https://cdn.example.com/gallery1.jpg'],
    primaryAddress: {
      street: '123 George St',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'AU',
      latitude: -33.8688,
      longitude: 151.2093,
    },
    publicEmail: 'hello@sydneyculturalhub.com',
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/sydculturalhub' },
    ],
    categoryTags: ['culture', 'community', 'events'],
    status: 'published',
    updatedAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Meta Title Generation
// ---------------------------------------------------------------------------

describe('generateMetaTitle', () => {
  it('generates title in format "Name — EntityType | CulturePass"', () => {
    const title = generateMetaTitle('Sydney Cultural Hub', 'community');
    expect(title).toContain('Sydney Cultural Hub');
    expect(title).toContain('Community');
    expect(title).toContain('CulturePass');
  });

  it('truncates long names to fit within 60 characters', () => {
    const longName = 'The Absolutely Incredible and Amazing Sydney Cultural Hub Community Organization';
    const title = generateMetaTitle(longName, 'community');
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('uses correct entity type labels', () => {
    expect(generateMetaTitle('Test', 'venue')).toContain('Venue');
    expect(generateMetaTitle('Test', 'business')).toContain('Business');
    expect(generateMetaTitle('Test', 'artist')).toContain('Artist');
    expect(generateMetaTitle('Test', 'professional')).toContain('Professional');
    expect(generateMetaTitle('Test', 'organiser')).toContain('Event Organiser');
  });

  it('handles short names without truncation', () => {
    const title = generateMetaTitle('Hub', 'venue');
    expect(title).toContain('Hub');
    expect(title).not.toContain('…');
  });
});

// ---------------------------------------------------------------------------
// Meta Description Generation
// ---------------------------------------------------------------------------

describe('generateMetaDescription', () => {
  it('combines tagline and description', () => {
    const desc = generateMetaDescription(
      'Connecting cultures',
      'A vibrant community bringing together diverse cultures in Sydney.'
    );
    expect(desc).toContain('Connecting cultures');
  });

  it('truncates long descriptions (including ellipsis)', () => {
    const longDesc = 'A'.repeat(200);
    const desc = generateMetaDescription('Tagline', longDesc);
    // truncateAtWord may add an ellipsis character, so allow 161 (160 + '…')
    expect(desc.length).toBeLessThanOrEqual(161);
    expect(desc).toContain('…');
  });

  it('strips HTML tags from description', () => {
    const desc = generateMetaDescription(
      undefined,
      '<p>A <strong>vibrant</strong> community.</p>'
    );
    expect(desc).not.toContain('<p>');
    expect(desc).not.toContain('<strong>');
    expect(desc).toContain('vibrant');
  });

  it('returns empty string when no tagline or description', () => {
    expect(generateMetaDescription(undefined, undefined)).toBe('');
    expect(generateMetaDescription('', '')).toBe('');
  });

  it('uses tagline alone when no description', () => {
    const desc = generateMetaDescription('Just a tagline', undefined);
    expect(desc).toBe('Just a tagline');
  });

  it('uses description alone when no tagline', () => {
    const desc = generateMetaDescription(undefined, 'Just a description.');
    expect(desc).toBe('Just a description.');
  });
});

// ---------------------------------------------------------------------------
// Canonical URL Generation
// ---------------------------------------------------------------------------

describe('generateCanonicalUrl', () => {
  it('uses approved handle for URL segment', () => {
    const profile = createMockProfile({
      handle: 'sydney-hub',
      handleStatus: 'approved',
    });
    const url = generateCanonicalUrl(profile);
    expect(url).toBe('https://culturepass.co/community/sydney-hub');
  });

  it('uses slug when handle is not approved', () => {
    const profile = createMockProfile({
      handle: 'pending-handle',
      handleStatus: 'pending',
      slug: 'my-slug',
    });
    const url = generateCanonicalUrl(profile);
    expect(url).toBe('https://culturepass.co/community/my-slug');
  });

  it('falls back to ID when no handle or slug', () => {
    const profile = createMockProfile({
      handle: '',
      handleStatus: undefined,
      slug: undefined,
    });
    const url = generateCanonicalUrl(profile);
    expect(url).toBe('https://culturepass.co/community/profile-123');
  });

  it('uses correct entity type prefix', () => {
    expect(generateCanonicalUrl(createMockProfile({ entityType: 'venue' }))).toContain('/venue/');
    expect(generateCanonicalUrl(createMockProfile({ entityType: 'business' }))).toContain('/business/');
    expect(generateCanonicalUrl(createMockProfile({ entityType: 'artist' }))).toContain('/artist/');
    expect(generateCanonicalUrl(createMockProfile({ entityType: 'professional' }))).toContain('/professional/');
    expect(generateCanonicalUrl(createMockProfile({ entityType: 'organiser' }))).toContain('/organiser/');
  });
});

// ---------------------------------------------------------------------------
// Open Graph Tags
// ---------------------------------------------------------------------------

describe('generateOpenGraphTags', () => {
  it('generates all required OG tags', () => {
    const profile = createMockProfile();
    const og = generateOpenGraphTags(profile);

    expect(og['og:type']).toBeDefined();
    expect(og['og:title']).toBeDefined();
    expect(og['og:description']).toBeDefined();
    expect(og['og:url']).toBeDefined();
    expect(og['og:image']).toBeDefined();
    expect(og['og:site_name']).toBe('CulturePass');
    expect(og['og:locale']).toBe('en_AU');
  });

  it('uses hero image for og:image', () => {
    const profile = createMockProfile({ heroImageUrl: 'https://cdn.example.com/hero.jpg' });
    const og = generateOpenGraphTags(profile);
    expect(og['og:image']).toBe('https://cdn.example.com/hero.jpg');
  });

  it('falls back to logo when no hero image', () => {
    const profile = createMockProfile({ heroImageUrl: undefined, logoUrl: 'https://cdn.example.com/logo.jpg' });
    const og = generateOpenGraphTags(profile);
    expect(og['og:image']).toBe('https://cdn.example.com/logo.jpg');
  });

  it('sets correct og:type for different entity types', () => {
    expect(generateOpenGraphTags(createMockProfile({ entityType: 'venue' }))['og:type']).toBe('business.business');
    expect(generateOpenGraphTags(createMockProfile({ entityType: 'business' }))['og:type']).toBe('business.business');
    expect(generateOpenGraphTags(createMockProfile({ entityType: 'community' }))['og:type']).toBe('profile');
    expect(generateOpenGraphTags(createMockProfile({ entityType: 'artist' }))['og:type']).toBe('profile');
  });

  it('includes image dimensions', () => {
    const og = generateOpenGraphTags(createMockProfile());
    expect(og['og:image:width']).toBe('1200');
    expect(og['og:image:height']).toBe('630');
  });
});

// ---------------------------------------------------------------------------
// Twitter Card Tags
// ---------------------------------------------------------------------------

describe('generateTwitterCardTags', () => {
  it('generates all required Twitter Card tags', () => {
    const profile = createMockProfile();
    const tc = generateTwitterCardTags(profile);

    expect(tc['twitter:card']).toBeDefined();
    expect(tc['twitter:title']).toBeDefined();
    expect(tc['twitter:description']).toBeDefined();
    expect(tc['twitter:image']).toBeDefined();
    expect(tc['twitter:site']).toBe('@CulturePassApp');
  });

  it('uses summary_large_image when image exists', () => {
    const profile = createMockProfile({ heroImageUrl: 'https://cdn.example.com/hero.jpg' });
    const tc = generateTwitterCardTags(profile);
    expect(tc['twitter:card']).toBe('summary_large_image');
  });

  it('uses summary when no image', () => {
    const profile = createMockProfile({
      heroImageUrl: undefined,
      coverImageUrl: undefined,
      logoUrl: undefined,
      imageUrl: undefined,
    });
    const tc = generateTwitterCardTags(profile);
    expect(tc['twitter:card']).toBe('summary');
  });
});

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

describe('generateJsonLd', () => {
  it('generates valid JSON-LD with @context and @type', () => {
    const profile = createMockProfile();
    const jsonLd = generateJsonLd(profile);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBeDefined();
    expect(jsonLd.name).toBe('Sydney Cultural Hub');
  });

  it('maps entity types to correct schema.org types', () => {
    expect(generateJsonLd(createMockProfile({ entityType: 'community' }))['@type']).toBe('Organization');
    expect(generateJsonLd(createMockProfile({ entityType: 'organiser' }))['@type']).toBe('Organization');
    expect(generateJsonLd(createMockProfile({ entityType: 'venue' }))['@type']).toBe('LocalBusiness');
    expect(generateJsonLd(createMockProfile({ entityType: 'business' }))['@type']).toBe('LocalBusiness');
    expect(generateJsonLd(createMockProfile({ entityType: 'artist' }))['@type']).toBe('Person');
    expect(generateJsonLd(createMockProfile({ entityType: 'professional' }))['@type']).toBe('Person');
  });

  it('includes address when available', () => {
    const profile = createMockProfile();
    const jsonLd = generateJsonLd(profile);

    expect(jsonLd.address).toBeDefined();
    expect(jsonLd.address!['@type']).toBe('PostalAddress');
    expect(jsonLd.address!.addressLocality).toBe('Sydney');
    expect(jsonLd.address!.addressRegion).toBe('NSW');
  });

  it('includes geo coordinates when available', () => {
    const profile = createMockProfile();
    const jsonLd = generateJsonLd(profile);

    expect(jsonLd.geo).toBeDefined();
    expect(jsonLd.geo!['@type']).toBe('GeoCoordinates');
    expect(jsonLd.geo!.latitude).toBe(-33.8688);
    expect(jsonLd.geo!.longitude).toBe(151.2093);
  });

  it('includes sameAs links from social profiles', () => {
    const profile = createMockProfile({
      socialLinks: [
        { platform: 'instagram', url: 'https://instagram.com/test' },
        { platform: 'facebook', url: 'https://facebook.com/test' },
      ],
    });
    const jsonLd = generateJsonLd(profile);

    expect(jsonLd.sameAs).toContain('https://instagram.com/test');
    expect(jsonLd.sameAs).toContain('https://facebook.com/test');
  });

  it('includes description stripped of HTML', () => {
    const profile = createMockProfile({
      description: '<p>A <strong>great</strong> community.</p>',
    });
    const jsonLd = generateJsonLd(profile);

    expect(jsonLd.description).not.toContain('<p>');
    expect(jsonLd.description).toContain('great');
  });

  it('omits address when not available', () => {
    const profile = createMockProfile({ primaryAddress: undefined });
    const jsonLd = generateJsonLd(profile);
    expect(jsonLd.address).toBeUndefined();
  });

  it('adds entity-specific fields for artist/professional', () => {
    const profile = createMockProfile({
      entityType: 'artist',
      categoryTags: ['music', 'performance'],
    });
    const jsonLd = generateJsonLd(profile);
    expect(jsonLd.jobTitle).toBe('Artist');
    expect(jsonLd.knowsAbout).toContain('music');
  });
});

// ---------------------------------------------------------------------------
// Sitemap Generation
// ---------------------------------------------------------------------------

describe('generateSitemapEntry', () => {
  it('generates sitemap entry for published profiles', () => {
    const profile = createMockProfile({ status: 'published' });
    const entry = generateSitemapEntry(profile);

    expect(entry).not.toBeNull();
    expect(entry!.loc).toContain('culturepass.co');
    expect(entry!.changefreq).toBe('weekly');
    expect(entry!.priority).toBeGreaterThan(0);
  });

  it('returns null for draft profiles', () => {
    const profile = createMockProfile({ status: 'draft' });
    expect(generateSitemapEntry(profile)).toBeNull();
  });

  it('returns null for suspended profiles', () => {
    const profile = createMockProfile({ status: 'suspended' });
    expect(generateSitemapEntry(profile)).toBeNull();
  });

  it('assigns higher priority to venues and businesses', () => {
    const venue = generateSitemapEntry(createMockProfile({ entityType: 'venue', status: 'published' }));
    const artist = generateSitemapEntry(createMockProfile({ entityType: 'artist', status: 'published' }));

    expect(venue!.priority).toBeGreaterThan(artist!.priority);
  });

  it('includes images in sitemap entry', () => {
    const profile = createMockProfile({
      status: 'published',
      logoUrl: 'https://cdn.example.com/logo.jpg',
      heroImageUrl: 'https://cdn.example.com/hero.jpg',
    });
    const entry = generateSitemapEntry(profile);

    expect(entry!.images).toBeDefined();
    expect(entry!.images!.length).toBeGreaterThan(0);
  });
});

describe('generateSitemapXml', () => {
  it('generates valid XML sitemap', () => {
    const profiles = [
      createMockProfile({ id: '1', status: 'published' }),
      createMockProfile({ id: '2', status: 'published', entityType: 'venue' }),
    ];
    const xml = generateSitemapXml(profiles);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<url>');
    expect(xml).toContain('<loc>');
  });

  it('excludes draft profiles from sitemap', () => {
    const profiles = [
      createMockProfile({ id: '1', status: 'published' }),
      createMockProfile({ id: '2', status: 'draft' }),
    ];
    const xml = generateSitemapXml(profiles);

    // Should only have one <url> entry
    const urlCount = (xml.match(/<url>/g) || []).length;
    expect(urlCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Heading Hierarchy
// ---------------------------------------------------------------------------

describe('generateHeadingHierarchy', () => {
  it('uses profile name as H1', () => {
    const profile = createMockProfile({ officialName: 'My Community' });
    const hierarchy = generateHeadingHierarchy(profile);
    expect(hierarchy.h1).toBe('My Community');
  });

  it('includes common sections in H2', () => {
    const profile = createMockProfile();
    const hierarchy = generateHeadingHierarchy(profile);
    expect(hierarchy.h2).toContain('About');
    expect(hierarchy.h2).toContain('Location');
    expect(hierarchy.h2).toContain('Contact');
  });

  it('includes entity-specific sections for venue', () => {
    const profile = createMockProfile({ entityType: 'venue' });
    const hierarchy = generateHeadingHierarchy(profile);
    expect(hierarchy.h2).toContain('Capacity');
    expect(hierarchy.h2).toContain('Opening Hours');
  });

  it('includes entity-specific sections for artist', () => {
    const profile = createMockProfile({ entityType: 'artist' });
    const hierarchy = generateHeadingHierarchy(profile);
    expect(hierarchy.h2).toContain('Portfolio');
    expect(hierarchy.h2).toContain('Availability');
  });

  it('includes entity-specific sections for professional', () => {
    const profile = createMockProfile({ entityType: 'professional' });
    const hierarchy = generateHeadingHierarchy(profile);
    expect(hierarchy.h2).toContain('Expertise');
    expect(hierarchy.h2).toContain('Rate Card');
  });
});

// ---------------------------------------------------------------------------
// Image Alt Texts
// ---------------------------------------------------------------------------

describe('generateImageAltTexts', () => {
  it('generates alt text for logo', () => {
    const profile = createMockProfile({ logoUrl: 'https://cdn.example.com/logo.jpg' });
    const altTexts = generateImageAltTexts(profile);
    const logoAlt = altTexts.find((a) => a.role === 'logo');

    expect(logoAlt).toBeDefined();
    expect(logoAlt!.altText).toContain('Sydney Cultural Hub');
    expect(logoAlt!.altText).toContain('logo');
  });

  it('generates alt text for hero image', () => {
    const profile = createMockProfile({ heroImageUrl: 'https://cdn.example.com/hero.jpg' });
    const altTexts = generateImageAltTexts(profile);
    const heroAlt = altTexts.find((a) => a.role === 'hero');

    expect(heroAlt).toBeDefined();
    expect(heroAlt!.altText).toContain('cover image');
  });

  it('generates alt text for gallery images', () => {
    const profile = createMockProfile({
      galleryImages: ['https://cdn.example.com/g1.jpg', 'https://cdn.example.com/g2.jpg'],
    });
    const altTexts = generateImageAltTexts(profile);
    const galleryAlts = altTexts.filter((a) => a.role === 'gallery');

    expect(galleryAlts).toHaveLength(2);
    expect(galleryAlts[0].altText).toContain('Gallery image 1');
    expect(galleryAlts[1].altText).toContain('Gallery image 2');
  });

  it('returns empty array when no images', () => {
    const profile = createMockProfile({
      logoUrl: undefined,
      imageUrl: undefined,
      heroImageUrl: undefined,
      coverImageUrl: undefined,
      galleryImages: undefined,
    });
    const altTexts = generateImageAltTexts(profile);
    expect(altTexts).toHaveLength(0);
  });
});

describe('generateImageAlt', () => {
  it('generates correct alt for logo', () => {
    const alt = generateImageAlt('My Venue', 'venue', 'logo');
    expect(alt).toContain('My Venue');
    expect(alt).toContain('logo');
    expect(alt).toContain('CulturePass');
  });

  it('generates correct alt for hero', () => {
    const alt = generateImageAlt('My Venue', 'venue', 'hero');
    expect(alt).toContain('cover image');
  });

  it('generates correct alt for gallery', () => {
    const alt = generateImageAlt('My Venue', 'venue', 'gallery');
    expect(alt).toContain('Gallery photo');
  });
});

// ---------------------------------------------------------------------------
// Robots Directive
// ---------------------------------------------------------------------------

describe('generateRobotsDirective', () => {
  it('returns index,follow for published profiles', () => {
    const robots = generateRobotsDirective('published');
    expect(robots).toContain('index');
    expect(robots).toContain('follow');
  });

  it('returns noindex,nofollow for draft profiles', () => {
    const robots = generateRobotsDirective('draft');
    expect(robots).toContain('noindex');
    expect(robots).toContain('nofollow');
  });

  it('returns noindex,nofollow for suspended profiles', () => {
    const robots = generateRobotsDirective('suspended');
    expect(robots).toContain('noindex');
  });

  it('returns index,follow for undefined status', () => {
    const robots = generateRobotsDirective(undefined);
    expect(robots).toContain('index');
  });
});

describe('generateRobotsTxt', () => {
  it('allows profile entity paths', () => {
    const txt = generateRobotsTxt();
    expect(txt).toContain('Allow: /community/');
    expect(txt).toContain('Allow: /venue/');
    expect(txt).toContain('Allow: /business/');
  });

  it('disallows admin and API paths', () => {
    const txt = generateRobotsTxt();
    expect(txt).toContain('Disallow: /admin/');
    expect(txt).toContain('Disallow: /api/');
  });

  it('includes sitemap URL', () => {
    const txt = generateRobotsTxt();
    expect(txt).toContain('Sitemap:');
    expect(txt).toContain('sitemap.xml');
  });
});

// ---------------------------------------------------------------------------
// Complete SEO Generation
// ---------------------------------------------------------------------------

describe('generateProfileSEO', () => {
  it('generates complete SEO metadata', () => {
    const profile = createMockProfile();
    const seo = generateProfileSEO(profile);

    expect(seo.title).toBeDefined();
    expect(seo.description).toBeDefined();
    expect(seo.canonicalUrl).toBeDefined();
    expect(seo.openGraph).toBeDefined();
    expect(seo.twitterCard).toBeDefined();
    expect(seo.jsonLd).toBeDefined();
    expect(seo.headingHierarchy).toBeDefined();
    expect(seo.imageAltTexts).toBeDefined();
    expect(seo.robots).toBeDefined();
  });

  it('all components are consistent', () => {
    const profile = createMockProfile();
    const seo = generateProfileSEO(profile);

    // Title should be consistent across meta and OG
    expect(seo.title).toBe(seo.openGraph['og:title']);
    expect(seo.title).toBe(seo.twitterCard['twitter:title']);

    // URL should be consistent
    expect(seo.canonicalUrl).toBe(seo.openGraph['og:url']);
  });
});

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

describe('stripHtmlTags', () => {
  it('removes HTML tags', () => {
    expect(stripHtmlTags('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes HTML entities', () => {
    expect(stripHtmlTags('&amp; &lt; &gt; &quot; &#39;')).toBe("& < > \" '");
  });

  it('replaces &nbsp; with space', () => {
    expect(stripHtmlTags('Hello&nbsp;world')).toBe('Hello world');
  });

  it('collapses multiple whitespace', () => {
    expect(stripHtmlTags('Hello   world')).toBe('Hello world');
  });

  it('handles empty string', () => {
    expect(stripHtmlTags('')).toBe('');
  });
});

describe('truncateAtWord', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncateAtWord('Short text', 100)).toBe('Short text');
  });

  it('truncates at word boundary', () => {
    const text = 'This is a longer text that needs to be truncated at a word boundary';
    const result = truncateAtWord(text, 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('…');
  });

  it('does not break words', () => {
    const text = 'Hello wonderful world of programming';
    const result = truncateAtWord(text, 15);
    // Should not cut "wonderful" in the middle
    expect(result).not.toMatch(/wonderf…$/);
  });
});
