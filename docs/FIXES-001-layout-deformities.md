# FIXES-001: Layout, Formatting & Design Token Deformities — Remediation Plan

**Status**: Proposed  
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
- `src/app/hostspace/apply.tsx`
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

**Current status**: Plan written. Execution of PR 1–4 in progress (see linked PRs or commits).

---

**Appendix: Quick Reference Commands**

```bash
# After any layout change
npm run lint && npm run typecheck && npm test

# Visual regression (after build)
npm run build-web
npx playwright test e2e/visual-regression.spec.ts --update-snapshots   # to accept new baselines (carefully)
npx playwright test e2e/visual-regression.spec.ts                      # normal run

# Bundle health (now fixed)
npm run size:web
```

---

*This plan was produced as part of the 2026-05-26 layout & deformity QA initiative. It is intentionally narrow and actionable so the team can deliver visible quality improvement in small, safe increments.*