# FIXES-001: Layout, Formatting & Design Token Deformities — Remediation Plan

**Status**: In progress (P0–P22 remediation active — Jun 2026)
**Owner**: Engineering (with design-system + QA review)  
**Created**: 2026-05-26  
**Related**: QA Report (2026-05-26), TheApp.md §Engineering rules, src/design-system/tokens/

---

## 1. Problem Statement

A comprehensive QA pass (automated lint + typecheck + 1095 tests + manual static layout review) identified a cluster of **visual and formatting deformities** that are the most common sources of production layout bugs:

- Heavy bypass of the design token system (raw hex colors, inline spacing/font values, ad-hoc styles).
- Proliferation of `position: 'absolute'` without containment or reusable primitives.
- Extremely low use of `numberOfLines` / text truncation on cards, bios, tables, and titles.
- Raw `Pressable` / `Touchable*` usage in feature code (violates "use `<Button>`" rule).
- Import hygiene and console hygiene debt that indirectly increases layout fragility.
- One broken developer tool (bundle-size script) and missing visual regression coverage.

These issues are **concentrated** in the highest-complexity surfaces:
- Admin user directory (`src/app/admin/users.tsx`)
- Host profile creation / apply flow (multiple files in `modules/host/` and `app/hostspace/`)
- Marketplace tiles and daily deals
- Profile tabs and certain onboarding surfaces

While the app has excellent functional test coverage, strong TypeScript, and a mature design system, the **visual debt** will continue to produce:
- Text overflow / layout shift on long names, bios, or non-Latin content
- Clipping, z-index fights, and safe-area bugs (especially web desktop sidebar vs mobile)
- Color drift and dark-mode breakage
- Inconsistent spacing / alignment across screens and breakpoints

---

## 2. Severity & Scope

| Severity | Category                        | Count (approx) | Primary Files |
|----------|---------------------------------|----------------|---------------|
| P0       | Design token / hex bypass       | 170+ hex, dozens of inline style objects | admin/users.tsx, host/* (Step3Legal, DraftRecoveryModal, EntityTypeSelector, apply.tsx), marketplace tiles |
| P0       | Absolute positioning sprawl     | 20+            | Same + profile styles |
| P1       | Missing text truncation         | ~18 uses total in src/ | Cards, tables, bios, long titles everywhere |
| P1       | Raw Pressable in feature code   | 145+ total (many in host/admin) | Feature surfaces |
| P2       | Tooling & hygiene               | 1 broken script, import mess in _layout, ~17 console calls, direct AsyncStorage | scripts/, app/_layout, various |
| P2       | Process / coverage              | No visual regression, missing root instruction files | Playwright config + e2e/, docs/ |

**In-scope for this plan**: The four highest-risk files + tooling fixes + starter visual regression + a living remediation document. Broader M3 migration and full host flow cleanup are follow-on work.

---

## 3. Prioritized Target Files (This Initiative)

1. **src/constants/onboardingInterests.ts** (trivial, high-signal)
   - Wrong import: `from '@/constants/theme'` instead of design-system tokens.
   - Fix: one-line path change.

2. **scripts/check-web-bundle-size.js** (tooling health)
   - Top-level `await` in CommonJS → syntax error on run.
   - Fix: wrap in async IIFE or convert to ESM-friendly pattern (minimal diff).

3. **src/app/admin/users.tsx** (highest inline style density)
   - Dozens of raw `style={{ gap: 12, fontSize: 12, ... }}`, hex in filters, timeline, bulk bar, etc.
   - Already imports some tokens + has a partial `StyleSheet`.
   - **Targeted refactor**: extract 10–15 worst inline objects into the existing StyleSheet using `Spacing`, `FontFamily`, `Radius`, and `colors.*` where possible. Add clear comment block. Do **not** attempt full rewrite.

4. **src/modules/host/components/EntityTypeSelector.tsx** (core host entry, heavy visual surface)
   - Uses tokens well in many places, but still has one raw hex gradient stop, absolute `guidedBadge`, `existingBadge`, timeline artifacts.
   - **Targeted refactor**: replace the one hard-coded gradient stop with a token or documented overlay, extract the guided badge + existing badge into tiny reusable style constants (or leave with comment if extraction would be overkill), ensure all colors flow through `CultureTokens` or `colors`.

Other files flagged for later passes (not in this PR stack unless time allows):
- `src/modules/host/components/steps/Step3Legal.tsx`
- `src/modules/host/components/DraftRecoveryModal.tsx`
- `/hostspace/apply` fully removed (consolidated into `/hostspace/create`)
- Marketplace square/daily-deal tiles
- Profile tab styles

---

## 4. Proposed Stacked PR Strategy (Recommended)

Small, reviewable, low-risk PRs that can land independently:

**PR 1 — Quick Wins & Tooling (lowest risk)**
- Fix `onboardingInterests.ts` import.
- Fix bundle-size script.
- Remove or guard the ~17 stray `console.*` calls in `src/` (or convert to the logger).
- Tiny docs update: note the start of deformity remediation.
- Verification: `npm run lint`, `npm run typecheck`, `npm run size:web` (now works), full test suite.

**PR 2 — Admin User Directory Token Migration (demonstration PR)**
- Targeted extraction of inline styles in `admin/users.tsx` into the existing `styles` object.
- Replace worst offenders (filter chips, bulk bar, timeline items, stat cells, audit input, etc.) with token-backed styles.
- Add file-level or section-level comment: "Partial remediation of layout deformities — see docs/FIXES-001".
- Add 1–2 `numberOfLines` on long metadata fields as a cheap win.
- Verification: manual QA on the user directory (desktop + mobile web + iOS simulator), lint, typecheck, relevant Jest tests.

**PR 3 — Host EntityTypeSelector + One Absolute Pattern**
- Clean the remaining raw hex in the nation-builder gradient.
- Extract or document the two small absolute badges (`guidedBadge`, `existingBadge`).
- Optional: introduce a tiny `AbsoluteBadge` or `OverlayBadge` atom in `design-system/ui/` if the pattern repeats elsewhere (otherwise just comment).
- Add `numberOfLines` on description if missing.
- Verification: full host creation flow on web (desktop 1024px+ and mobile widths) + native.

**PR 4 — Visual Regression Scaffolding (process win)**
- Create `e2e/` directory.
- Add `e2e/visual-regression.spec.ts` with 3–4 critical flows:
  - Host apply / entity selector (desktop + mobile viewport)
  - Admin users directory (with filters open)
  - Discover feed or City rail (public surface)
- Use `expect(page).toHaveScreenshot({ fullPage: true, threshold: 0.2 })` or mask dynamic areas (timestamps, avatars).
- Update Playwright config if needed (already has screenshot support).
- Add a note in CI or a new `test:visual` script.
- Documentation: how to update baselines (`npx playwright test --update-snapshots`).
- Verification: run the new spec against a fresh `npm run build-web` + serve.

**PR 5 — Process & Guardrails (optional, can merge with any of the above)**
- Add a simple ESLint rule or `scripts/` grep that fails on raw hex outside `design-system/tokens/`.
- Enhance `qa:solid` to include the new visual hygiene checks + bundle size.
- Create (or stub) the missing root `AGENTS.md` / `CLAUDE.md` / `culturepass-rules.md` with pointers to this plan and TheApp.md.
- Update TheApp.md "Never" list if needed.

Each PR should be **< 250 LOC changed** where possible, with clear before/after screenshots in the description for visual work.

---

## 5. Verification Checklist (per PR + overall)

For every change:
- [ ] `npm run lint` (warnings only, no new errors)
- [ ] `npm run typecheck`
- [ ] `npm test` (or the relevant subset)
- [ ] Manual visual spot-check on the touched screen(s) in at least two breakpoints (desktop ≥1024, mobile web or simulator)
- [ ] For admin/host surfaces: test with long display names, long bios, and at least one non-Latin name
- [ ] Dark mode toggle (where supported)
- [ ] Web desktop sidebar layout (left nav present, content not clipped)
- [ ] For the bundle script: `npm run size:web` succeeds after a build

Overall exit criteria:
- Zero new P0 deformity patterns introduced.
- The four targeted files show measurable reduction in raw hex + inline style objects.
- Visual regression job exists and can be run locally.
- This document is updated with "Implemented" sections or links to the merged PRs.

---

## 6. Risks & Mitigations

- **Over-refactoring risk**: These files are complex admin + creator surfaces. Mitigation: targeted, comment-annotated changes only. Full design-system migration is out of scope for this stack.
- **Visual regression flakiness**: Dynamic data (avatars, timestamps, live stats). Mitigation: use `mask` or `threshold`, seed stable test data where possible, or limit to static public pages initially.
- **Web build time in CI**: Already part of existing flows. The new visual tests will require `npm run build-web` first (already documented in playwright.config).
- **Design system gaps**: If a needed token is missing, add it in the same PR (small addition to `colors.ts` / `spacing.ts` is acceptable and encouraged).

---

## 7. Rollout & Follow-up Work

After the initial stack lands:
- Schedule a 1–2 day "visual debt sweep" focused on the remaining host creation files and marketplace tiles.
- Add `numberOfLines` enforcement (perhaps a lightweight lint rule or codemod) for all `Text` inside cards and list rows.
- Consider a shared `TruncatedText` or prop pattern in the design system.
- Expand visual regression to native (via Maestro or Detox screenshot diffing) in a later quarter.

---

## 8. How to Use This Document

- Link this file from every PR in the stack.
- Update the "Implemented" section or add a table at the bottom with PR numbers and dates as they land.
- Treat it as a living checklist — if new deformity patterns are discovered during the work, add them here before the next PR.

**Current status (Jun 2026)**:
| PR slice | Status | Notes |
|----------|--------|-------|
| PR 1 Quick wins | Done | `onboardingInterests` tokens import; bundle-size script uses async `main()` |
| PR 2 Admin users | Done | Full `StyleSheet` migration (P3); `TruncatedText` on metadata |
| PR 3 EntityTypeSelector | Done | Hero text uses `textOnBrandGradient`; inline styles extracted (P4) |
| PR 4 Visual regression | Extended | `e2e/visual-regression.spec.ts` + perks mobile snapshot |
| PR 5 Guardrails | Done | `scripts/check-hex-outside-tokens.mjs`, `npm run hex:check` in `qa:solid` |
| QR card themes | Done | `src/design-system/tokens/qrCardThemes.ts` extracted from `profile/qr.tsx` |
| P3 Admin users (cont.) | Done | Remaining inline styles → `StyleSheet` (detail, bulk, filter, table, pagination) |
| P3 QR export tokens | Done | `qrCardExportHtml.ts`; print popup CSS uses `QR_CARD_EXPORT_HTML` |
| P3 Web map | Done | `NativeMapView.web.tsx` city chips + embed split on desktop `/map` |
| P3 ESLint guardrail | Done | Scoped `Pressable` warn in nav/onboarding (`eslint.config.js`) |
| P3 Visual regression | Extended | `map-desktop-split.png` snapshot at 1280px |
| P4 Host legal step | Done | `Step3Legal` hex → `CultureTokens`; `numberOfLines` on subtitle/note |
| P4 Draft recovery | Done | `DraftRecoveryModal` button text + shadow tokens |
| P4 EntityTypeSelector | Done | Remaining inline styles → `StyleSheet` |
| P4 Marketplace tiles | Done | `marketplaceTileOverlay.ts`; square + daily-deal tiles tokenized |
| P4 Hex guardrails | Done | Watchlist per-file budgets; global total informational only |
| P4 Visual regression | Extended | `cultureshop-deals-mobile.png`; `npm run test:visual` alias |
| P5 Profile tabs | Done | `EntityPublicProfile` inline styles → `StyleSheet`; `profileHeroOverlay.ts` |
| P5 Text truncation gate | Done | `scripts/check-card-text-truncation.mjs` in `qa:solid` |
| P5 Release QA | Done | `npm run qa:release` = `qa:solid` + `size:web` (after `build-web`) |
| P5 Docs / hygiene | Done | `AGENTS.md` + `TheApp.md` truncation rule; `Step3Legal` console guarded |
| P6 ProfileComponents | Done | Shared section header, reco row, avatar, skeleton, culture map → `StyleSheet` + tokens |
| P6 UserPublicProfile | Done | `TruncatedText` on name/bio/location; hero logo style extracted |
| P6 GuestProfileView | Done | Remaining inline layout → `gs` StyleSheet |
| P6 Truncation ratchet | Done | `EntityPublicProfile` budget → 0; watchlist expanded to profile module |
| P7 Profile tab sections | Done | 8 section files → `profileSectionLayout` + local `StyleSheet`; inline styles removed |
| P7 QR / identity hex | Done | `ProfileIdentityContactSection` QR surface uses `BorderTokens.white` / `.black` |
| P7 Team + header bar | Done | `TeamManagementModal` + `ProfileHeaderBar` inline/hex cleanup |
| P7 Section guardrails | Done | Hex + truncation watchlists expanded to all profile tab sections |
| P8 Public user profile | Done | `src/app/user/[id].tsx` hex → `userPublicProfileOverlay`; styles extracted |
| P8 Styles split | Done | `userPublicScreenStyles.ts`; reuses `ProfileUtils` `TIER_CFG` / `SOCIAL_DEFS` |
| P8 Truncation ratchet | Done | All public profile `<Text>` get `numberOfLines`; watchlist budget → 0 |
| P9 ConnectTeaser | Done | Feature fills + contrast ink → `connectTeaserTokens.ts`; inline styles extracted |
| P9 Connect guardrails | Done | Hex + truncation watchlists expanded to `ConnectTeaser.tsx` at 0/0 |
| P10 Community desktop | Done | `CommunityWebDesktopLayout` hex → `communityWebDesktopOverlay` |
| P10 Desktop inline styles | Done | Scroll gaps, composer column, rail layout → `StyleSheet` |
| P10 Community guardrails | Done | Hex + truncation watchlists expanded to desktop layout at 0/0 |
| P11 Saved screen | Done | `RetroStamp` palettes + heart badge → `savedScreenTokens.ts` |
| P11 Saved inline styles | Done | Scroll, skeleton, favorites row, empty block → `StyleSheet` |
| P11 Saved guardrails | Done | Hex + truncation watchlists expanded to `saved/index.tsx` at 0/0 |
| P12 CultureWheel | Done | Slice fills + wheel chrome → `cultureWheelModalTokens.ts` |
| P12 Wheel inline styles | Done | Header, spin button, result rows → `StyleSheet` |
| P12 CultureWheel guardrails | Done | Hex + truncation watchlists expanded to `CultureWheelModal.tsx` at 0/0 |
| P13 Default images | Done | Twelve placeholder gradients → `defaultImageGradients.ts` |
| P13 Default images guardrails | Done | Hex watchlist expanded to `defaultImages.ts` at 0/0 |
| P14 Discover home | Done | Category accent + CultureWheel promo → `discoverHomeTokens.ts` |
| P14 Discover inline styles | Done | Promo banner, intent pills, clear-filter → `StyleSheet` |
| P14 Discover guardrails | Done | Hex + truncation watchlists expanded to `(tabs)/index.tsx` at 0/0 |
| P15 Host event create | Done | Muji form + sponsor tiers + preview → `hostspaceEventCreateTokens.ts` |
| P15 Host form inline styles | Done | Section shell, chips, row flex, sponsor actions → `StyleSheet` |
| P15 Host event guardrails | Done | Hex + truncation watchlists expanded to `HostspaceEventCreateForm.tsx` at 0/0 |
| P16 CultureMarket home | Done | Hero, sell banner, FAQ/footer → `cultureMarketHomeTokens.ts` |
| P16 Market inline styles | Done | Search section, hero CTAs, listings shell → `StyleSheet` |
| P16 CultureMarket guardrails | Done | Hex + truncation watchlists expanded to `CultureMarket/index.tsx` at 0/0 |
| P17 Host community create | Done | Reuses `HOSTSPACE_MUJI_FORM` + legacy wizard banner tokens |
| P17 Community inline styles | Done | Deprecation banner, sponsor rows, preview shell → `StyleSheet` |
| P17 Community guardrails | Done | Hex + truncation watchlists expanded to `HostspaceCommunityCreateForm.tsx` at 0/0 |
| P18 Membership upgrade | Done | Plus card gradient/ink + promo errors → `membershipUpgradeTokens.ts` |
| P18 Upgrade truncation | Done | Card labels, pricing tabs → `numberOfLines` on raw `<Text>` |
| P18 Upgrade guardrails | Done | Hex + truncation watchlists expanded to `membership/upgrade.tsx` at 0/0 |
| P18 Footer duplicate keys | Done | Stable `id` on `site-footer-links.ts`; `Footer.tsx` keys by `id` not `href` |
| P19 Ticket print | Done | Fixed light/paper palette → `ticketPrintTokens.ts` |
| P19 Print truncation | Done | Badge + full ticket rows, toolbar labels → `numberOfLines` |
| P19 Print guardrails | Done | Hex + truncation watchlists expanded to `tickets/print/[id].tsx` at 0/0 |
| P20 Web top bar | Done | Dark gradient, sign-in CTA, menu chrome → `webTopBarTokens.ts` |
| P20 Top bar truncation | Done | Tabs, menu rows, footer meta → `numberOfLines` on raw `<Text>` |
| P20 WebTopBar guardrails | Done | Hex + truncation watchlists expanded to `WebTopBar.tsx` at 0/0 |
| P21 Profile styles | Done | Hero ink, iOS shadows, QR surface → `profileStylesTokens.ts` |
| P21 ProfileStyles guardrails | Done | Hex watchlist expanded to `ProfileStyles.ts` at 0/0 |
| Brand palette migration | Done | Yellow/saffron/gold → `brandCyanPalette.ts` (`#00ADEF`, `#00A7EF`, jet black) |
| Banned color guardrail | Done | `scripts/check-banned-colors.mjs` + `docs/COLOR_PALETTE.md` in `qa:solid` |
| P22 Account settings | Done | Auth provider chips + flash banners → `settingsAccountTokens.ts` |
| P22 Account truncation | Done | Badges, provider pills, CPID row → `numberOfLines` on raw `<Text>` |
| P22 Account guardrails | Done | Hex + truncation watchlists expanded to `settings/account.tsx` at 0/0 |

---

**Appendix: Quick Reference Commands**

```bash
# After any layout change
npm run qa:solid          # typecheck + lint + hex + truncation + unit tests
npm run lint && npm run typecheck && npm test

# Visual regression (after build)
npm run build-web
npx playwright test e2e/visual-regression.spec.ts --update-snapshots   # to accept new baselines (carefully)
npm run test:visual                                                    # alias for visual regression
npx playwright test e2e/visual-regression.spec.ts                      # normal run

# Bundle health (now fixed)
npm run size:web
```

---

*This plan was produced as part of the 2026-05-26 layout & deformity QA initiative. It is intentionally narrow and actionable so the team can deliver visible quality improvement in small, safe increments.*