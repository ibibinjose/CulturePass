import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRootNavigationState } from 'expo-router';
import Head from 'expo-router/head';
import { usePostHog } from 'posthog-react-native';
import { useColors, useIsDark } from '@/hooks/useColors';
import { isCultureKeralaHost } from '@/lib/domainHost';
import {
  APP_NAME,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TITLE,
  APP_WEB_TAGLINE,
  SITE_ORIGIN,
} from '@/lib/app-meta';

// ---------------------------------------------------------------------------
// Global Metadata Component
// ---------------------------------------------------------------------------
export function GlobalMetadata() {
  // Also guard usePathname defensively
  let pathname = '/';
  try {
    pathname = usePathname() || '/';
  } catch {
    pathname = '/';
  }

  const isKeralaDomain = isCultureKeralaHost();
  const colors = useColors();
  const isDark = useIsDark();
  const isWeb = Platform.OS === 'web';

  const siteOrigin = isKeralaDomain ? 'https://culturekerala.com' : SITE_ORIGIN;
  const siteTitle = isKeralaDomain
    ? 'CultureKerala — Kerala & Malayalee Communities Worldwide'
    : APP_WEB_TITLE;
  const siteDescription = isKeralaDomain
    ? 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.'
    : APP_WEB_DESCRIPTION;
  const siteKeywords = isKeralaDomain
    ? 'CultureKerala, Kerala Communities, Malayalee, Malayalam, Kerala Events, Malayali Diaspora'
    : APP_WEB_KEYWORDS;

  const currentPath = pathname || '/';
  const canonicalUrl = `${siteOrigin}${currentPath === '/' ? '' : currentPath}`;
  const socialPreviewUrl = `${siteOrigin}/assets/images/social-preview.png`;

  const keralaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CultureKerala',
    url: 'https://culturekerala.com/',
    description: 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.',
    inLanguage: ['en', 'ml'],
    keywords: ['Kerala', 'Malayalee', 'Malayalam', 'Kerala events', 'Kerala communities'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://culturekerala.com/search?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const culturepassJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: APP_NAME,
        alternateName: APP_WEB_TAGLINE,
        url: siteOrigin + '/',
        description: siteDescription,
        inLanguage: 'en-AU',
        publisher: { '@id': `${siteOrigin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteOrigin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: APP_NAME,
        url: siteOrigin + '/',
        description: siteDescription,
        slogan: APP_WEB_TAGLINE,
      },
    ],
  };

  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <link rel="canonical" href={canonicalUrl} />
      {isKeralaDomain && <meta name="robots" content="index,follow,max-image-preview:large" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={socialPreviewUrl} />
      <meta property="og:site_name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
      <meta property="og:locale" content={isKeralaDomain ? 'ml_IN' : 'en_AU'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={socialPreviewUrl} />
      <meta name="application-name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
      <meta name="apple-mobile-web-app-title" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />

      {isWeb && (
        isKeralaDomain ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(keralaJsonLd) }}
          />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(culturepassJsonLd) }}
          />
        )
      )}

      <meta name="theme-color" content={colors.background} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content={isDark ? "black-translucent" : "default"}
      />
    </Head>
  );
}

// ---------------------------------------------------------------------------
// Navigation Tracking Component
// ---------------------------------------------------------------------------
export function NavigationTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      posthog.screen(pathname);
    }
  }, [pathname, posthog]);

  return null;
}

export function NavigationMetadata() {
  // Defensive guard: useRootNavigationState can throw during early web hydration
  // or before Expo Router has mounted its internal NavigationContainer.
  let navState: ReturnType<typeof useRootNavigationState> | null = null;

  try {
    navState = useRootNavigationState();
  } catch (error) {
    // Navigation context not ready yet — silently skip on first few renders.
    // This is common on web during initial bundle/hydration.
    if (__DEV__) {
      // Only log in development to avoid noise
      console.warn('[NavigationMetadata] Navigation context not ready yet');
    }
    return null;
  }

  if (!navState?.key) {
    return null;
  }

  return (
    <>
      <GlobalMetadata />
      <NavigationTracker />
    </>
  );
}
