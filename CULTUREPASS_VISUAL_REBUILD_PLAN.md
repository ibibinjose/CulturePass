# CulturePass — Visual Excellence & Quality Rebuild Plan (2026)

**Status**: Active Execution  
**Owner**: Engineering + Design  
**Created**: 2026-05-27 (post v1.2.2 live)  
**Last Updated**: 2026-05-27 (Phase 0 complete — TS clean)

**Core Philosophy**: Elevate the existing excellent foundation. Do **not** nuke a live production app (users, hosts, payments, communities, Firebase backend). We will make CulturePass the most visually stunning, culturally authentic, and polished lifestyle platform in its category — while shipping value continuously and maintaining zero-downtime stability.

---

## 1. Current State Audit (May 2026)

### Strengths (Foundation We Build On)
- **Mature production app** (v1.2.2, live since 15 Apr 2026 on iOS/Android/Web).
- **Strong existing design system**: CulturePass.App wordmark palette (culture red, pass green, app blue), cyan digital-ID accents, Rich Indigo, Emerald Harmony, Poppins typography (400–800), detailed spacing/radius/elevation, M3 expressive color schemes (darkM3/lightM3), GlassView + LiquidGlass, CulturalAccents, gradients, vitrine experimental theme.
- **Architecture**: Expo 56 + RN 0.85 + React 19, Expo Router (src/ layout), TanStack Query, sophisticated providers, ErrorBoundary, widgets, deep linking, Stripe Connect, Firebase Functions.
- **Platform reach**: EAS production credentials configured, two iOS targets (main + WidgetsTarget), Firebase Hosting, full store submission checklists exist.
- **Hundreds of files** already correctly consuming design tokens.
- **Rich feature set**: Discover rails, events/ticketing, communities, host creation (complex multi-step), profile, perks, CultureMarket/Shop, admin, First Nations spotlight, etc.

### Critical Debt (Must Be Systematically Eradicated)
- **2 TypeScript errors** (fixed 2026-05-27): `WebSidebar.tsx` used `Layout` without importing it from theme.
- **515 ESLint warnings** (0 errors): unused vars, `require()` imports, hook dependency issues, console hygiene.
- **~53 TODO/FIXME** markers scattered across src/.
- **Visual debt** (documented in `docs/FIXES-001-layout-deformities.md`): 170+ raw hex color bypasses, absolute positioning sprawl, missing `numberOfLines` truncation, raw `Pressable` in feature code (violates "use `<Button>`" rule), inconsistent spacing.
- **Two color systems** in active use (`useColors` legacy + `useM3Colors`) — deprecation in progress but mixed usage causes drift.
- **Store readiness gaps**: Screenshots not in repo, public privacy policy not hosted, dependency vulnerabilities (xmldom high), bundle-size script broken, high console.* noise in production paths, no visual regression testing.
- **Typography**: Only Poppins family — excellent for UI but lacks premium display voice for heroes, branding, onboarding, and marketing moments.
- **Web sidebar**: Layout import bug (now fixed) + responsive edge cases on desktop/tablet.
- **Host creation & admin surfaces**: Highest concentration of visual debt (raw styles, timeline artifacts, absolute badges).

**Typecheck gate (post-fix)**: ✅ Clean (0 errors).  
**Lint gate**: 0 errors, 515 warnings (mostly low-severity; target <100 actionable in Phase 0–1).

---

## 2. New Visual Vision — "Luxe Heritage 2026"

**Tagline**: *Belong anywhere. Feel at home everywhere.*

CulturePass must feel like a **premium cultural passport** — warm, human, sophisticated, never sterile or generic-tech. The existing warm heritage palette is a strength; we elevate it rather than replace it.

### 2.1 Color Evolution (Luxe Heritage Palette)

**Core Signature (Retain + Refine)**
- `cultureRed` / `passGreen` / `appBlue`: #f80020 / #00A651 / #009EDB (CulturePass.App wordmark)
- `deepSaffron`: #F5A623 (secondary warmth, festivals, highlights)
- `richIndigo`: #4A5EBF (stories, links, map pins)
- `emeraldHarmony`: #0A8C7F (trust, venues, community)
- `heritageGold`: #D4A017 (premium badges, prestige, accents — **never** body text or dates)

**New Luxe Secondary Accents (Premium Layering)**
- `deepPlum`: #2E0052 (from vitrine — hero anchors, sophisticated overlays)
- `warmBronze`: #8B5E3C (subtle cultural depth)
- `softSage`: #6B7F6B (calm, balance, nature motifs)
- `electricOchre`: #FCD400 (sparingly — high-priority moments only, per vitrine)

**Dark Mode — True Premium OLED ("Night Festival" Elevated)**
- `background`: #000000 (true black for power + contrast)
- `surface`: #0F0F11 → `surfaceElevated`: #1A1A1D (layered depth)
- Richer saturation on brand accents while maintaining WCAG AA+ contrast everywhere.
- Glass: `rgba(255,255,255,0.06–0.12)` with stronger blur on web.

**Light Mode (Secondary but Beautiful)**
- Warm off-white field: #FAF9F6 (already good).
- Softer surfaces, elegant tonal cards.

**Gradients (Signature Language)**
- `culturepassBrand` (culture red → app blue) — max 1 per screen for hero/onboarding/flagship CTAs.
- New luxe variants: `plumOchre`, `heritageBronze`, `emeraldIndigo`, `goldSaffron`.
- Hero overlays: cinematic multi-stop (transparent → deep black with subtle brand tint).

**Accessibility**
- Every new color combination audited for WCAG AA (large text) / AA+ (body).
- High-contrast "textOnBrandGradient" always white or near-white.

### 2.2 Typography — Premium Pairing

**UI Voice (Keep & Refine)**
- **Poppins** (400–800) — excellent modern, warm, readable. Remains primary for body, UI, cards, tabs.
- Current scale (FontSize, LineHeight, LetterSpacing) is solid; tighten 4-point grid alignment.

**New Display / Hero Voice (Add for Stunning Moments)**
- Introduce a high-quality **premium display pairing**:
  - Option A (Cultural Gravitas): EB Garamond or Playfair Display (serif) for onboarding heroes, brand lockups, "Belong anywhere" moments, event titles on dark imagery.
  - Option B (Modern Luxury): Instrument Serif or Satoshi Variable (if licensing allows) for a contemporary high-end feel.
  - Fallback: Load a local exclusive TTF (e.g. "CulturePass Display") for true differentiation.
- Usage: Heroes, marketing headers, large section titles, onboarding, CultureX, premium profile treatments. **Never** for body or dense UI.

**Implementation**
- Load via `@expo-google-fonts` or local assets in `src/app/_layout.tsx`.
- New tokens: `FontFamily.display`, `TextStyles.heroDisplay`, `DesktopTextStyles.displayHero`.
- Responsive: larger on web desktop, tighter on mobile.

### 2.3 Layout & Structure Language

- **4/8-point precision grid** (already partially present) — enforce everywhere.
- **New Container System**: `Container` primitive with `maxContentWidth`, `tabletMax`, `desktopMax`, fluid padding, safe-area aware.
- **Web**: 240px left sidebar (fixed, collapsible) on ≥1024px; bottom tabs on tablet/mobile. Fix remaining responsive edge cases.
- **Cinematic Heroes**: Layered glass + subtle wordmark-tint overlays (culture red / app blue motifs) + premium photography with duotone or gradient treatments.
- **Cards & Surfaces**: Refined 20–24px radius, generous internal padding, subtle float shadows or glass, consistent hover/press states (scale + shadow lift).
- **Navigation**: M3TopAppBar + refined CustomTabBar (glass + blur on iOS/web, elevated on Android). NavigationRail on large tablets.
- **Empty States & Loading**: Treated as **art** — beautiful illustrations or cultural motifs, never generic spinners. Delightful skeleton patterns.
- **Motion**: Expressive springs (already have SpringConfig), tasteful haptics on key actions, smooth screen transitions, micro-interactions on CTAs and cards.

### 2.4 "Visually Stunning" Signature Elements (What Users Will Feel)

- **Layered Glassmorphism** as brand signature (already strong — make it world-class).
- **Cultural Motif Accents** used sparingly (subtle patterns, stamp/badge treatments, passport-inspired elements).
- **Premium Photography Treatment**: Soft vignettes, gentle duotones, elegant overlays.
- **Delightful Micro-Moments**: Pressed gradients, springy scale, haptic confirmation, beautiful success states.
- **Artful Empty States**: "No events yet" becomes a curated cultural vignette, not a sad icon.
- **Typography Hierarchy** that feels editorial and human.
- **Consistent Edge-to-Edge** + perfect safe-area handling on all platforms.

**Rule**: Max one Signature Gradient per screen. Reserve gold for prestige moments only.

---

## 3. Phased Roadmap & Gates

### Phase 0: Immediate Stabilization (COMPLETE — 2026-05-27)
- [x] Fix 2 TypeScript errors (WebSidebar Layout import).
- [x] Confirm typecheck clean (0 errors).
- [ ] Reduce actionable ESLint warnings below 150 (focus on unused vars, require() imports, hook deps in high-traffic files).
- [ ] Remove or guard top 20 `console.*` calls in production paths.
- [ ] Audit & fix 5 worst visual-debt files (raw hex + absolute positioning).
- **Gate**: `npm run typecheck && npm run lint -- --max-warnings 150` passes. No new TODOs without owner.

**2026-05-28 Update (Slice 1 Stabilization on `fix/luxe-foundation-stabilize` branch)**:

See dedicated plan: [`docs/SLICE2-GEOHASH-NEAREST-COUNCIL.md`](docs/SLICE2-GEOHASH-NEAREST-COUNCIL.md) — created after user request to proceed with A/B/C + explicit "write Slice 2 plan".

---

## Slice 2 Status (as of plan creation)
- User explicitly authorized execution start ("Start executing now").
- Created backup tag `pre-luxe-stabilize-20260528-0300` + execution branch.
- Eliminated all 15+ TypeScript errors introduced by the in-flight Luxe visual work (onboarding + host steps + CommunityTabScreen).
- Reduced lint errors on the 7 touched files from 3 → 0 (overall project now 0 lint errors).
- Performed light targeted hygiene on only the changed files (removed dead imports/vars from the refactor) → warnings on delta reduced from 56 to 21.
- **Result**: `npx tsc --noEmit` clean + `npm run lint` (0 errors) on the stabilized surfaces.
- Luxe primitives (`luxeHeritage.ts`, LuxeButton/Text/Card/FilterChip) now integrated without breaking the build on high-visibility onboarding flows.
- This constitutes practical completion of Phase 0 + strong foundation for Phase 1.

### Phase 1: Design System 2.0 "Luxe Heritage" Foundation
- Create `src/design-system/tokens/luxeHeritage.ts` (or evolve existing) with refined palette, new typography pairing, tightened layout tokens, expressive motion language.
- New stunning base primitives:
  - `LuxeButton` (or evolve M3Button/CulturalButton) with layered gradients, spring press, haptic.
  - `LuxeCard` / `LuxeGlassCard` with refined elevation + glass recipes.
  - `LuxeHero` with cinematic layering.
  - `LuxeChip`, `LuxeFAB`, `LuxeSheet`, `LuxeEmptyState`.
- Update `useM3Colors` + legacy bridge so new tokens are the single source.
- Add premium display font loading (Playfair or equivalent) in root layout.
- Create `/design-vitrine-luxe` screen for live token preview (evolve existing vitrine).
- **Gate**: All new components use only luxe tokens. Visual diff review on 3 key screens. Typecheck + lint clean.

### Phase 2: Core Experience Surfaces (Highest Impact)
Priority order (user-visible + conversion critical):
1. **Onboarding** (first impression — make breathtaking).
2. **Discover / Home** (hero treatment, rails, vitrines, filters, search).
3. **Event Detail + Booking Flow** (the money moment).
4. **Host Creation / Hostspace** (most complex flow — clean it).
5. **Profile / My Space** (identity & membership prestige).
6. **Community Detail + City Pages**.
7. **Perks, CultureMarket, CultureShop** (commerce polish).

Each surface:
- Full token migration (no raw hex).
- New luxe components.
- Refined typography + layout.
- Micro-interactions + haptics.
- Accessibility pass (VoiceOver, Dynamic Type, contrast).
- **Gate per surface**: Design review + cross-platform test (iOS/Android/Web) + no new debt.

### Phase 3: Platform Excellence & Parity
- **Web**: Sidebar polish (collapsible, search, role-aware nav), responsive mastery (768/1024/1280 breakpoints), PWA manifest, security headers in Firebase Hosting, Lighthouse ≥90 all categories.
- **iOS**: Signature glass + blur, haptics everywhere meaningful, widget polish (all 5 widgets), Live Activities where relevant, perfect safe-area + Dynamic Island.
- **Android**: Material You expressive theming (dynamic color if possible), edge-to-edge, refined FAB/sheets, haptic feedback parity.
- **Cross-platform**: Single source of truth for layout (useLayout hook already good — extend it).
- **Gate**: Visual + interaction parity audit on 5 core flows. No platform-specific hacks in feature code.

### Phase 4: Bug Eradication & QA Hardening
- Fix or justify all remaining ~53 TODO/FIXME (owner + date).
- Full accessibility audit (WCAG 2.2 AA target).
- ErrorBoundary coverage on every major surface + graceful offline states.
- Performance budget: Time-to-Interactive < 3s on 4G mid-tier device; web bundle < current baseline.
- Visual regression baseline (Playwright or Maestro + Percy/Argos or similar).
- **Gate**: `npm run qa:solid` passes cleanly. Zero P0/P1 bugs in 48h test flight / internal track.

### Phase 5: Store & Deploy Readiness
- Professional asset pack:
  - App icons (1024×1024 + all platform variants).
  - Screenshots for iPhone 6.7"/6.5"/5.5", iPad Pro 12.9", Android phones + 7"/10" tablets (min 8 per device class).
  - Feature graphic (1024×500), promotional video (optional but recommended).
- Privacy Policy & Terms hosted at canonical URLs (culturepass.app/legal/...), linked everywhere, updated for new data practices.
- Dependency vulnerability remediation or justification + security audit.
- Firebase Hosting: Strict security headers (HSTS, CSP, X-Frame-Options, etc.), proper SPA redirects, no source maps.
- EAS production builds verified clean for both iOS targets + Android App Bundle.
- App Store Connect / Google Play listings polished (keywords, descriptions, privacy nutrition label, age rating).
- **Gate**: Successful EAS production build (iOS + Android) + Firebase Hosting deploy with clean Lighthouse + no console errors in production bundle.

### Phase 6: Release, Monitoring & Continuous Elevation
- Staged rollout (internal → TestFlight/Play Internal → 5% → 50% → 100%).
- Sentry + PostHog + Firebase Performance Monitoring on all new surfaces.
- Post-release visual + UX audit with real users.
- Quarterly "Luxe Polish" sprints (never let debt accumulate again).

---

## 4. Execution Principles (Non-Negotiable)

1. **Single Source of Truth**: All colors, typography, spacing, radius, elevation, motion from `src/design-system/tokens/*`. No raw hex in feature code after Phase 1.
2. **Design Token First**: New component or screen? Tokens before pixels.
3. **Accessibility & Inclusion**: WCAG AA minimum on every surface. Cultural authenticity without compromising readability.
4. **Platform Parity by Design**: Layout, motion, and interaction feel native on each platform while sharing 95%+ of code.
5. **Test + Deploy Gates**: No surface ships without typecheck + lint gate + manual cross-platform smoke + (later) visual regression.
6. **Error Hygiene**: No `console.*` in production paths. All errors go through `captureRouteError` + Sentry.
7. **Performance Budgets**: Enforced in CI for web; manual checks on device for native.
8. **Continuous Shipping**: Each phase delivers user-visible value. We do not disappear for 6 months.

---

## 5. Immediate Next Actions (This Week — Starting 2026-05-27)

1. **Phase 0 Completion** (today/tomorrow)
   - Reduce actionable lint warnings (batch fixes on host/, admin/, profile/, marketplace).
   - Remove top console noise.
   - Fix 5 worst raw-hex + absolute-position files.

2. **Phase 1 Kickoff**
   - Create `src/design-system/tokens/luxeHeritage.ts` with full refined palette + typography pairing proposal + layout primitives.
   - Add premium display font (Playfair or equivalent) loading skeleton.
   - Build first 3 luxe base components (`LuxeButton`, `LuxeGlassCard`, `LuxeHero`).
   - Wire new tokens into root layout + 2 high-traffic screens for validation.

3. **Documentation & Communication**
   - Update `docs/DESIGN_TOKENS.md`, `docs/STYLE_GUIDE.md`, `docs/DESIGN_PRINCIPLES.md` with Luxe Heritage direction.
   - Create living "Visual Audit" Notion/FigJam board (or repo folder) for before/after.

4. **Tooling**
   - Fix `scripts/check-web-bundle-size.js` (top-level await issue).
   - Add visual regression baseline script (Playwright + comparison).

5. **First Deploy Test**
   - After Phase 0–1 foundation: `npm run build-web && firebase deploy --only hosting` (preview channel first).
   - Verify no console errors, correct fonts, new luxe components rendering.

---

## 6. Success Metrics (End of Phase 5)

- **Visual**: Zero raw hex in src/ (except constants). All surfaces use luxe tokens. Design review sign-off on 8 core flows.
- **Quality**: Typecheck 0 errors, ESLint <50 actionable warnings, 0 P0/P1 bugs in 7-day post-release window.
- **Performance**: Web Lighthouse ≥95 Performance/Accessibility/Best Practices/SEO. Native cold-start <2.5s on mid-tier devices.
- **Store**: All required screenshots + assets in repo + EAS production builds succeed + App Store / Play Store listings live with 4.7+ rating target.
- **Business**: Measurable uplift in onboarding completion, host creation conversion, event booking rate (tracked via PostHog).

---

## 7. Risks & Mitigations

- **Risk**: Design system migration touches too many files → drift or breakage.
  - **Mitigation**: Incremental adoption (new luxe tokens live alongside old). Feature-flag new components. Visual regression baseline before big changes.
- **Risk**: Premium font licensing / bundle size.
  - **Mitigation**: Start with Google Fonts (Playfair via @expo-google-fonts). Measure bundle delta. Offer subset or local TTF only if justified.
- **Risk**: Store submission delays (assets, policy, review).
  - **Mitigation**: Start asset production in parallel with Phase 2. Host privacy policy on Firebase Hosting early.
- **Risk**: Team velocity drop during polish.
  - **Mitigation**: Pair design + engineering on each surface. Time-box polish sprints. Ship value every 2 weeks.

---

## 8. References & Living Documents

- `docs/FIXES-001-layout-deformities.md` (visual debt baseline)
- `docs/STORE_SUBMISSION.md`, `APP_STORE_PUBLISHING_CHECKLIST.md`, `PLAY_STORE_PUBLISHING_CHECKLIST.md`, `WEB_PUBLISHING_CHECKLIST.md`
- `src/design-system/tokens/` (current source of truth)
- `src/app/_layout.tsx` (font loading, providers)
- `REBUILD.md` (nuclear cleanup commands — use only when truly needed)
- Future: `docs/DESIGN_SYSTEM_LUXE_HERITAGE.md`, `docs/VISUAL_AUDIT.md`

---

**This plan is the single source of truth for the 2026 visual & quality rebuild.**  
Every PR that touches UI must reference the relevant phase and gate.

**Let's make CulturePass the most beautiful cultural belonging platform on earth.**

— CulturePass Engineering & Design
Last updated: 2026-05-27 (Phase 0 stabilization complete, TypeScript clean, plan activated)
