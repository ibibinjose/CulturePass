# Web / Firebase Hosting Publishing Checklist (for completeness)

Although not a traditional "store", the web version must meet quality, security, and legal standards.

## 1. Build & Deployment
- [ ] Successful `npm run build-web` (static export to dist/)
- [ ] Firebase Hosting configured (firebase.json)
- [ ] Custom domain + HTTPS (culturepass.app)
- [ ] Proper redirects for SPA (index.html fallback)
- [ ] No source maps in production build
- [ ] Bundle size under budget (current script has issues — fix recommended)

## 2. Performance & UX
- [ ] Lighthouse scores: Performance >90, Accessibility >95, Best Practices >95, SEO >90
- [ ] Responsive across mobile, tablet, desktop (sidebar on >=1024px)
- [ ] Fast Time to Interactive
- [ ] Proper loading states, skeletons, error boundaries

## 3. Accessibility & Legal
- [ ] WCAG 2.1 AA compliant (or better)
- [ ] Privacy policy and terms linked in footer and accessible
- [ ] Cookie / tracking consent if applicable (PostHog, etc.)
- [ ] No misleading claims

## 4. Security Headers & Best Practices (Firebase Hosting)
- [ ] Strict-Transport-Security
- [ ] Content-Security-Policy (at least basic)
- [ ] X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] No sensitive data in client bundle (only EXPO_PUBLIC_ vars)
- [ ] Firebase Hosting security rules if using any dynamic content

## 5. SEO & Discoverability
- [ ] Proper <title>, meta description, Open Graph tags
- [ ] Sitemap.xml, robots.txt
- [ ] Canonical URLs
- [ ] Structured data where beneficial (events, etc.)

## 6. Monitoring
- [ ] Error tracking (Sentry or equivalent)
- [ ] Analytics (PostHog)
- [ ] Uptime monitoring
- [ ] Performance budgets enforced in CI

**Current CulturePass Web Status:**
- Good responsive layout (useLayout hook).
- Web export works.
- Some old web/Next.js remnants in the repo (web/ folder) — clean before launch if not used.
- Privacy policy stub exists but needs hosting at /legal/privacy.
- No visible security headers config in firebase.json snippet.
- High number of console.* statements in code (will pollute production logs).

**Gaps:** Security headers, full Lighthouse audit, public legal pages, cleaning old web/ artifacts.
