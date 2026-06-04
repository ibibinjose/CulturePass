import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

import {
  APP_NAME,
  APP_AKA,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TAGLINE,
  APP_WEB_TITLE,
  SITE_ORIGIN,
  SITE_ORIGIN_WWW,
  THEME_COLOR_WEB,
} from '@/lib/app-meta';

const siteUrl = SITE_ORIGIN;
const siteTitle = APP_WEB_TITLE;
const siteDescription = APP_WEB_DESCRIPTION;
const ogImageUrl = `${siteUrl}/assets/images/social-preview.png`;
const ogImageWidth = 1200;
const ogImageHeight = 630;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: APP_NAME,
  alternateName: APP_AKA,
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/assets/images/icon.png`,
    width: 512,
    height: 512,
  },
  description: APP_WEB_DESCRIPTION,
  foundingDate: '2023',
  foundingLocation: {
    '@type': 'Place',
    name: 'Sydney, Australia',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@culturepass.app',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
  sameAs: [
    SITE_ORIGIN_WWW,
    'https://instagram.com/culturepass.app',
    'https://twitter.com/culturepassapp',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  alternateName: APP_AKA,
  url: siteUrl,
  description: siteDescription,
  inLanguage: 'en-AU',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const mobileAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: APP_NAME,
  alternateName: APP_AKA,
  description: APP_WEB_DESCRIPTION,
  url: siteUrl,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AUD',
  },
  author: {
    '@type': 'Organization',
    name: APP_NAME,
    url: siteUrl,
  },
};

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en-AU">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* ── Security headers (web layer) ─────────────────────────────────── */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(self), interest-cohort=()" />
        {/* NOTE: CSP must be set via HTTP headers in firebase.json (hosting.headers), NOT here.
            A <meta http-equiv="Content-Security-Policy"> blocks Metro's eval() in dev and
            breaks React Native Web's animation/reanimated runtime in prod. */}

        {/* ── Primary meta ─────────────────────────────────────────────────── */}
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={APP_WEB_KEYWORDS} />
        <meta name="author" content={APP_NAME} />
        <meta name="application-name" content={APP_AKA} />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
        <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large" />

        {/* ── Canonical + hreflang ─────────────────────────────────────────── */}
        {/* Per-page canonical is set in each screen's <Head>. This is the homepage fallback. */}
        <link rel="alternate" hrefLang="en-au" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />

        {/* ── Open Graph ───────────────────────────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={APP_NAME} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta property="og:image:alt" content={`${APP_AKA} — ${APP_WEB_TAGLINE}`} />
        <meta property="og:locale" content="en_AU" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="en_GB" />

        {/* ── Twitter / X Card ─────────────────────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@culturepassapp" />
        <meta name="twitter:creator" content="@culturepassapp" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={`${APP_AKA} — ${APP_WEB_TAGLINE}`} />

        {/* ── App install / deep link meta ─────────────────────────────────── */}
        <meta name="apple-itunes-app" content="app-id=6738947948" />
        <meta name="google-play-app" content="app-id=app.culturepass" />
        {/* Smart App Banner for Safari iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_AKA} />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* ── Theme / branding ─────────────────────────────────────────────── */}
        <meta name="theme-color" content={THEME_COLOR_WEB} />
        <meta name="msapplication-TileColor" content={THEME_COLOR_WEB} />

        {/* ── Icons / PWA ──────────────────────────────────────────────────── */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        <ScrollViewStyleReset />

        {/* ── Structured Data (JSON-LD) ─────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppJsonLd) }}
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
/* Full-viewport flex host so WebShell + Stack + tab ScrollViews get a bounded height */
html, body, #root { height: 100%; width: 100%; max-width: 100%; overflow-x: hidden; }
body { margin: 0; overscroll-behavior-x: none; }
#root { display: flex; flex-direction: column; flex: 1; min-height: 100%; }
:root { color-scheme: dark light; }

/* Mobile web safe area support (especially iOS Safari) */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}

/* Extra padding for iOS standalone/PWA mode (when added to home screen) */
@media (display-mode: standalone) {
  :root {
    --safe-area-inset-top: max(env(safe-area-inset-top, 0px), 44px);
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible,
[role="link"]:focus-visible,
[role="menuitem"]:focus-visible,
[tabindex]:not([tabindex="-1"]):focus-visible {
  outline: 2px solid #4F46E5; /* CultureTokens.indigo — focus ring */
  outline-offset: 2px;
}

/* Prevent text selection on interactive UI cards (drag gestures) */
.no-select { user-select: none; -webkit-user-select: none; }

/* Print: hide nav chrome, show only content */
@media print {
  [data-testid="tab-bar"], [data-testid="header-bar"], nav { display: none !important; }
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
