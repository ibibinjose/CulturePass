import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

import {
  APP_NAME,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TITLE,
  SITE_ORIGIN,
  SITE_ORIGIN_WWW,
  THEME_COLOR_WEB,
} from '@/lib/app-meta';

const siteUrl = SITE_ORIGIN;
const siteTitle = APP_WEB_TITLE;
const siteDescription = APP_WEB_DESCRIPTION;
const ogImageUrl = `${siteUrl}/assets/images/social-preview.png`;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: APP_NAME,
  url: siteUrl,
  logo: ogImageUrl,
  sameAs: [SITE_ORIGIN_WWW],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: siteUrl,
  description: siteDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en-AU">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={APP_WEB_KEYWORDS} />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
        {/* Canonical URL is set path-aware in `app/_layout.tsx` (Head) after hydration — omit static duplicate. */}
        <link rel="alternate" hrefLang="en-au" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={APP_NAME} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={ogImageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={ogImageUrl} />

        <meta name="theme-color" content={THEME_COLOR_WEB} />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <ScrollViewStyleReset />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
