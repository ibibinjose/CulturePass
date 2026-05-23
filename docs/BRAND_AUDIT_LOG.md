# CulturePass Brand Audit Log

**Last Updated:** 2026-05-08  
**Source of truth for tokens:** [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md) and [`docs/STYLE_GUIDE.md`](STYLE_GUIDE.md) — not this file alone.

**2026 palette scrub:** Production code and generators now use **`CultureTokens.indigo` `#4F46E5`**, **`CultureTokens.teal` `#0D9488`**, and **violet → coral** `SignatureGradient`. Contrast and WCAG rows below were authored against older hex values; **re-measure** with current tokens before legal/accessibility sign-off.

This document tracks the brand compliance audit for every major route in `app/`.
All screens must follow **Token Integrity**, **Cultural Minimalism**, **Platform Parity**, and **Approachable Complexity** (max **one** primary CTA per screen where applicable).

**Audit Status Legend**
- ✅ Fully Compliant
- ⚠️ Minor Issues (needs fix)
- ❌ Major Violations (must fix before merge)
- ⏳ Not Audited Yet

---

## 1. Layout & Global Files

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/_layout.tsx` | 2026-03-29 | ✅ | Correct `Platform.OS === 'web' ? 0` topInset (line 163). Proper `useColors()` usage. All imports from `@/constants/theme`. |
| `app/(tabs)/_layout.tsx` | 2026-03-29 | ✅ | Clean tab routing. No token violations. |
| `app/+not-found.tsx` | — | ⏳ | Not audited |
| `app/+html.tsx` | — | ⏳ | Not audited |

---

## 2. High-Traffic & Root Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/(tabs)/index.tsx` (Discover) | 2026-03-29 | ✅ | `CultureTokens` from `@/constants/theme`. `useColors()` + `useLayout()` correct. No raw hex in JSX. |
| `app/events.tsx` | 2026-03-29 | ✅ | `CultureTokens.indigo` used properly. `Platform.OS === 'web' ? 0` correct (lines 163–164). Accessibility labels on filter chips (lines 286–340). |
| `app/landing.tsx` | 2026-03-29 | ⏳ | File not found — confirm path or remove from audit |
| `app/map.tsx` | 2026-03-29 | ✅ | `Image` from `expo-image` (line 2). `CultureTokens` throughout. No raw hex in styles. |
| `app/search/index.tsx` | 2026-03-29 | ⏳ | File not found at expected path |

---

## 3. Tab Screens (Core Navigation)

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/(tabs)/feed.tsx` | 2026-03-29 | ✅ | `CultureTokens` from theme (line 21). `Platform.OS === 'web' ? 0` correct (line 38). `__DEV__` guard on console (line 90). |
| `app/(tabs)/community.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `webShadow` from theme (line 23). Proper `useColors()` usage. |
| `app/(tabs)/profile.tsx` | 2026-03-29 | ✅ | All imports from `@/constants/theme`. `__DEV__` guard on console (line 507). |
| `app/(tabs)/directory.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `EntityTypeColors` from theme (line 17). `useColors()` correct. |
| `app/(tabs)/calendar.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `webShadow` from theme (line 10). `Platform.OS === 'web' ? 0` correct (line 38). |
| `app/(tabs)/explore.tsx` | 2026-03-29 | ✅ | `CultureTokens` all variants used. `Image` from `expo-image` (line 6). |
| `app/(tabs)/perks.tsx` | 2026-03-29 | ⏳ | File too large to fully audit — targeted grep needed |
| `app/(tabs)/dashboard.tsx` | 2026-03-29 | ✅ | Simple redirect component. No style violations. |

---

## 4. Detail & Dynamic Pages

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/event/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`#4285F4`/`#0078D4`~~ extracted to `GOOGLE_BRAND_COLOR`/`OUTLOOK_BRAND_COLOR` constants. Single primary CTA. ✅ `expo-image`, `useColors()`, topInset correct. |
| `app/venue/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. Teal accent, `expo-image`, haptics, accessibility labels, `ErrorBoundary` all correct. |
| `app/artist/[id].tsx` | 2026-03-29 | ✅ | No violations. Coral accent, analytics, all tokens correct. |
| `app/community/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`'#000'` shadowColor~~ → `colors.text`. ~~`'#FFFFFF'` freePillText~~ → `colors.textInverse`. |
| `app/business/[id].tsx` | 2026-03-29 | ✅ | **Full refactor**: Added `useColors()`, converted `getStyles(colors)` pattern. All hardcoded hex (`#0B0B14`, `#FFFFFF`, `rgba(255,255,255,...)`) replaced with `colors.*` tokens. `rgba(139,69,19,...)` indigenous badge replaced with `CultureTokens.gold` tints. `accessibilityLabel` added to all Pressables. Typecheck passes. |
| `app/movies/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`#D90429`/`#0055A5`~~ extracted to `HOYTS_BRAND_COLOR`/`EVENT_CINEMAS_BRAND_COLOR` constants. Gold accent, `expo-image`, accessibility correct. |
| `app/[handle].tsx` | — | ⏳ | Not audited |

---

## 5. Feature & Flow Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/onboarding/` (all files) | — | ⏳ | Not audited |
| `app/membership/upgrade.tsx` | 2026-03-29 | ⏳ | File not found at expected path |
| `app/tickets/index.tsx` | 2026-03-29 | ✅ | `CultureTokens` imported correctly (line 24). All gradients from `@/constants/theme`. No raw hex. |
| `app/checkout/index.tsx` | 2026-03-29 | ✅ | `Image` from `expo-image` (line 13). `CultureTokens` from theme (line 19). No raw hex in JSX. |
| `app/scanner.tsx` | 2026-03-29 | ⏳ | File not found at expected path |
| `app/submit/` | — | ⏳ | Not audited |
| `app/notifications/index.tsx` | — | ⏳ | Not audited |
| `app/saved/index.tsx` | — | ⏳ | Not audited |

---

## 6. Supporting & Utility Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/profile/edit.tsx` | — | ⏳ | Not audited |
| `app/settings/index.tsx` | 2026-03-29 | ✅ | Structure confirmed, no violations observed |
| `app/settings/about.tsx` | 2026-03-29 | ✅ | No violations observed |
| `app/about.tsx` | — | ⏳ | Not audited |
| `app/help/index.tsx` | — | ⏳ | Not audited |
| `app/legal/` | — | ⏳ | Not audited |
| `app/admin/` | — | ⏳ | Not audited |
| `app/menu.tsx` | — | ⏳ | Not audited |

---

## 7. Detailed Compliance Checklist (Duplicate per Screen)

Use this checklist for every audited screen:

### Imports & Token Integrity
- [ ] All tokens imported **only** from `@/constants/theme`
- [ ] `useColors()` and `useLayout()` hooks used correctly
- [ ] Zero raw hex values (`grep` test passed)
- [ ] `HeaderLogo.tsx` used where applicable

### Colors & Visuals
- [ ] Max **one** `variant="primary"` button (indigo)
- [ ] Semantic use of `CultureTokens.*` (indigo=trust, coral=action, gold=premium only)
- [ ] Correct functional/status/category colors
- [ ] Gradients and glass surfaces used appropriately
- [ ] Elevation via `ElevationAlias.*` only

### Typography
- [ ] Only `TextStyles.*` presets used
- [ ] `DesktopTextStyles.*` applied on `isDesktop` screens
- [ ] No inline font properties

### Spacing & Layout
- [ ] All spacing from `Spacing.*` (4-point grid)
- [ ] `hPad`, `columnWidth()`, `sidebarWidth` from `useLayout()`
- [ ] Uniform 16px radius (or `Radius.full` for pills/avatars)

### Components & Interactions
- [ ] `<Button>` component used instead of raw Pressable
- [ ] Cards use `CardTokens.*` and `expo-image`
- [ ] Avatars always circular
- [ ] Icons use `IconSize.*` + correct platform library
- [ ] Animations respect `prefersReducedMotion`

### Platform & Accessibility
- [ ] Desktop layout (sidebar + text overrides) correct
- [ ] Web uses light theme; native uses dark
- [ ] All interactive elements have `accessibilityLabel` + `role`
- [ ] Touch targets ≥ 44×44pt

### Brand Voice & Anti-Patterns
- [ ] Copy follows celebratory/inclusive/grounded voice
- [ ] No forbidden words ("users", "content", "diverse", etc.)
- [ ] Australian English, active voice, Oxford comma
- [ ] No inline styles, no direct sub-imports, `StyleSheet.create()` at module level

---

## Grep Validation (2026-03-29 baseline)

The following greps were run across the full `app/` directory:

| Pattern | Expected | Result |
|---------|----------|--------|
| `Platform.OS === 'web' ? 67` | 0 matches | ✅ 0 — bug not present |
| `import.*Image.*from 'react-native'` | 0 matches | ✅ 0 — `expo-image` used everywhere |
| `import.*from '@/constants/colors'` | 0 matches | ✅ 0 — all via `@/constants/theme` |
| `import.*from '@/constants/typography'` | 0 matches | ✅ 0 |
| `import.*from '@/constants/spacing'` | 0 matches | ✅ 0 |
| Raw hex in JSX styles | 0 matches | ✅ 0 |
| Unguarded `console.log` | — | ⏳ Not fully verified |

---

## 8. Token Contrast Audit (WCAG 2.2)

> Calculated 2026-03-29 using the WCAG relative luminance formula.
> AA Normal = 4.5:1 | AA Large = 3:1 (18pt+ or 14pt bold) | AA UI = 3:1 (non-text components, WCAG 1.4.11)
> AAA Normal = 7:1 | AAA Large = 4.5:1

### 8a. Light Mode — Foreground on `background: #FFFFFF`

| Token | Hex | Ratio | AA Normal | AA Large | AAA Normal | AAA Large | Notes |
|-------|-----|-------|-----------|----------|------------|-----------|-------|
| `colors.text` | `#1B0F2E` | **18.19:1** | ✅ | ✅ | ✅ | ✅ | |
| `colors.textSecondary` | `#4A4A4A` | **8.85:1** | ✅ | ✅ | ✅ | ✅ | |
| `colors.textTertiary` | ~~`#8D8D8D`~~ → `#767676` | ~~3.29:1~~ → **4.54:1** | ✅ fixed | ✅ | ❌ | ❌ | Was AA fail — fixed 2026-03-29 |
| `colors.tabIconDefault` | ~~`#8D8D8D`~~ → `#767676` | ~~3.29:1~~ → **4.54:1** | ✅ fixed | ✅ | ❌ | ❌ | Was AA fail — fixed 2026-03-29 |
| `CultureTokens.indigo` | `#4F46E5` | **5.57:1** | ✅ | ✅ | ❌ | ✅ | Safe for buttons/links on white |
| `sharedBase.secondary` | `#5856D6` | **5.68:1** | ✅ | ✅ | ❌ | ✅ | |
| `CultureTokens.coral` | `#FF5E5B` | **3.00:1** | ❌ | ✅ | ❌ | ❌ | **Text on white: prohibited** — decorative/icon use only |
| `sharedBase.error` | `#FF3B30` | **3.55:1** | ❌ | ✅ | ❌ | ❌ | Acceptable for large error headings only; use `colors.text` for error body copy |
| `CultureTokens.teal` | `#0D9488` | **2.17:1** | ❌ | ❌ | ❌ | ❌ | **Text on white: prohibited** — decorative/icon/background use only |
| `sharedBase.success` | `#34C759` | **2.22:1** | ❌ | ❌ | ❌ | ❌ | **Text on white: prohibited** — icon use only |
| `sharedBase.warning` / `accent` | `#FF9500` | **2.21:1** | ❌ | ❌ | ❌ | ❌ | **Text on white: prohibited** — icon/badge use only |
| `CultureTokens.gold` | `#FFC857` | **1.54:1** | ❌ | ❌ | ❌ | ❌ | **Text on white: prohibited** — background fills only, white text on top |

### 8b. Dark Mode — Foreground on `background: #060C16`

| Token | Hex | Ratio | AA Normal | AA Large | AAA Normal | AAA Large | Notes |
|-------|-----|-------|-----------|----------|------------|-----------|-------|
| `colors.text` | `#FFFFFF` | **19.57:1** | ✅ | ✅ | ✅ | ✅ | |
| `colors.textSecondary` | `#C9C9D6` | **11.92:1** | ✅ | ✅ | ✅ | ✅ | |
| `colors.textTertiary` | `#8D8D8D` | **5.95:1** | ✅ | ✅ | ❌ | ✅ | Passes AA; misses AAA 7:1 by ~1pt |
| `CultureTokens.indigo` | `#4F46E5` | **3.51:1** | ❌ text | ✅ UI | ❌ | ❌ | **Safe only as UI component (icon/border), not as text on dark backgrounds** |
| `tabIconSelected` | `#4F46E5` on `#0B0B14` | **3.52:1** | ❌ text | ✅ 1.4.11 | ❌ | ❌ | Passes WCAG 1.4.11 (UI 3:1); tab icon is non-text |
| `CultureTokens.coral` | `#FF5E5B` | **6.51:1** | ✅ | ✅ | ❌ | ✅ | Strong on dark — safe for text up to AAA Large |
| `CultureTokens.gold` | `#FFC857` | **12.71:1** | ✅ | ✅ | ✅ | ✅ | Excellent on dark — gold reserved for premium/indigenous |
| `CultureTokens.teal` | `#0D9488` | **9.02:1** | ✅ | ✅ | ✅ | ✅ | |
| `sharedBase.success` | `#34C759` | **8.82:1** | ✅ | ✅ | ✅ | ✅ | |

### 8c. Brand Color Text Safety Rules

These rules apply to all new screens and components:

```
DARK MODE (native):   coral, gold, teal, success ✅ safe as text
LIGHT MODE (web):     coral, gold, teal, success, warning, error ❌ NOT safe as text on white

ALWAYS SAFE:          colors.text, colors.textSecondary, colors.textTertiary (post-fix)
INDIGO (#4F46E5):     text on white ✅ (5.57:1) | text on dark ❌ | UI components on dark ✅ (3:1)
```

### 8d. Fixes Applied (2026-03-29)

- `constants/colors.ts`: `light.textTertiary` `#8D8D8D` → `#767676` (3.29:1 → 4.54:1, AA now passes)
- `constants/colors.ts`: `light.tabIconDefault` `#8D8D8D` → `#767676` (same fix — tab labels are text)

### 8e. Recommended AAA Improvements (selective)

For screens where it doesn't compromise aesthetics:
- `light.textTertiary` could go to `#595959` (7.02:1) for full AAA — consider for body metadata text
- `dark.textTertiary` `#8D8D8D` → `#7B7B8F` (≈7.1:1 on `#060C16`) to hit AAA on dark
- Hero text-on-image: verify scrim opacity ensures ≥7:1 for AAA; ≥4.5:1 for AA minimum

---

## 9. WCAG AAA Exploration

> WCAG 2.2 has 87 success criteria: ~32 Level A, ~24 additional at AA (~56 total), ~31 additional at AAA (87 total).
> CulturePass baseline is **AA**. This section tracks selective AAA enhancements where feasible.

### 9a. AA vs AAA — Key Differences for CulturePass

| Area | AA Baseline (current) | AAA Target | Feasibility |
|------|----------------------|------------|-------------|
| Normal text contrast | 4.5:1 | 7:1 | ✅ Achievable for body text; ⚠️ constrained on image overlays |
| Large text contrast | 3:1 | 4.5:1 | ✅ Achievable |
| Focus indicators | Visible (2.4.7), not obscured (2.4.11) | **Focus Appearance** (2.4.13): 2px+ outline, 3:1 contrast between focused/unfocused states | ✅ Achievable on web/desktop with neon tokens |
| Authentication | Accessible minimum | No cognitive tests without alternatives; enhanced help | ✅ Applicable to checkout, membership, login |
| Redundant entry | — | Avoid re-entering data in same session | ✅ Pre-fill known fields in checkout/forms |

### 9b. Focus Appearance (WCAG 2.4.13 — AAA) for Web

When implementing focus rings on web (desktop), the focus indicator must:
- Have an area ≥ the perimeter of the unfocused component × 2px (e.g., a 200px-wide button needs a 400px² ring area)
- Have a contrast ratio ≥ **3:1** between the focused and unfocused states
- Not be entirely hidden (2.4.11 AA already requires this)

**Recommended implementation for CulturePass web:**
```css
/* Global focus style for web — add to app/_layout.tsx or a global stylesheet */
:focus-visible {
  outline: 3px solid #4F46E5;   /* indigo — 5.57:1 on white */
  outline-offset: 2px;
  border-radius: 4px;
}
/* Override for dark surfaces */
.dark :focus-visible {
  outline-color: #4D9EE8;       /* lighter blue — passes 3:1 on dark bg */
}
```
For React Native web, use `focusStyle` prop on Pressable or the `onFocus` + `Animated` pattern.

### 9c. AAA Checklist (selective — apply per-screen)

- [ ] Hero text on scrims: verify ≥7:1 contrast (dark scrim opacity ~0.65+ for white text AAA)
- [ ] Body metadata (dates, venues, prices): use `textTertiary` post-fix `#767676` (AA); promote to `#595959` for AAA
- [ ] Form helper text and error messages: `#595959` or darker for AAA
- [ ] Focus rings on all web Pressables: 3px indigo, 3:1 focused/unfocused contrast
- [ ] Checkout/login: pre-fill known fields to reduce redundant entry (3.3.7 AAA)
- [ ] Extended audio descriptions: consider for any event video previews (SC 1.2.7)
- [ ] Indigenous content: always AAA contrast — gold text on dark surfaces ✅ already AAA

---

## 10. Inclusive Design Principles

> Framework: Microsoft Inclusive Design (3 core principles) + complementary principles from the Inclusive Design Principles project.
> CulturePass has a unique mandate: diaspora communities worldwide — design must travel with culture.

### 10a. Three Core Principles → CulturePass Mapping

| Principle | Definition | CulturePass Application |
|-----------|------------|------------------------|
| **Recognise Exclusion** | Identify where design creates barriers through our own biases | Audit each screen for language assumptions (English-only), data-heavy patterns (image carousels on low bandwidth), cultural stereotypes in placeholder imagery, and touch-only gestures |
| **Learn from Diversity** | Involve people with different lived experiences early and often | Co-design First Nations Spotlight with community; involve recent migrants in onboarding testing; test with users across varying digital literacy and device generations |
| **Solve for One, Extend to Many** | Design for edge cases first — solutions cascade to everyone | Keyboard-first checkout helps motor-impaired users AND one-handed mobile use. High-contrast mode helps low-vision users AND outdoor festival use in bright sunlight. Clear language helps non-native English speakers AND everyone in a noisy, distracted moment |

### 10b. CulturePass Brand Principles — Inclusive Design Alignment

| Brand Principle | Inclusive Design Alignment | Status |
|-----------------|---------------------------|--------|
| Cultural Minimalism | Prioritises content (events, communities) over decoration — removes clutter barriers | ✅ Strong |
| Token Integrity | Consistent, predictable visual language reduces cognitive load | ✅ Strong |
| Platform Parity | Native feel on every platform respects users' existing mental models | ✅ Strong |
| Approachable Complexity | Complex flows (ticketing, membership) made intuitive — supports varying digital literacy | ✅ Strong |
| Technical Craftsmanship | `expo-image` caching, lazy loading, virtualized lists — reduces data/performance barriers | ✅ Strong |

### 10c. Specific Opportunities (prioritised by impact)

**High Impact:**
- [ ] `textTertiary` contrast fix (**done** — 2026-03-29) — benefits low-vision users + outdoor use
- [ ] Hero button `accessibilityLabel` fixes (**done** — 2026-03-29) — benefits VoiceOver/TalkBack + keyboard users
- [ ] `checkout/index.tsx` form labels (**done** — 2026-03-29) — benefits screen reader users + voice control
- [ ] Verify event descriptions don't assume English as first language — use plain language, avoid idiom

**Medium Impact:**
- [ ] Add `lang` attribute to web root for screen reader language identification
- [ ] Support Dynamic Type / system font scaling (test TextStyles scale on iOS Settings > Accessibility > Larger Text)
- [ ] Add `accessibilityHint` to non-obvious CTAs (e.g., "Tap to view full event details")
- [ ] Offer reduced-data mode: low-resolution image option when `NetInfo` detects slow connection
- [ ] Test all screens with Increased Contrast mode enabled (iOS: Settings > Accessibility > Display & Text Size)

**Future Sprint (post-launch):**
- [ ] Right-to-left layout support (Arabic community in UAE)
- [ ] Multi-language event descriptions (translate key metadata: date, price, venue)
- [ ] Simplified onboarding path for users with lower digital literacy (fewer steps, larger touch targets, more affordances)
- [ ] Low-data mode toggle in Settings (replaces hero images with tinted placeholders)
- [ ] Indigenous content: community-led review process before publishing Spotlight content

### 10d. Situational Awareness Checklist

CulturePass users attend live events — design must perform in real-world conditions:

| Scenario | Current Risk | Recommended Fix |
|----------|-------------|-----------------|
| Bright outdoor sunlight | Low-contrast overlays (hero scrims) become unreadable | Increase hero scrim to ≥0.65 opacity; verify 4.5:1 on all critical text |
| One-handed use on public transport | Bottom-heavy CTAs hard to reach | Primary action buttons already at bottom — verify safe area clearance |
| Noisy venue (haptic-only feedback) | Missed audio cues | `expo-haptics` already in use ✅; ensure all confirmations have haptic |
| Low battery / reduced animations | Animated rails may not complete | `prefersReducedMotion` guard already documented; verify implementation |
| Slow/offline (waiting for event to start) | Blank states without offline support | Skeleton loaders in place ✅; add "No connection" empty state messaging |
| Cultural sensitivity | Placeholder images may use stereotypes | Audit all default/fallback images for cultural neutrality |

---

## 11. CulturePass App Skills

> A set of enforceable, guideline-aligned capabilities for developers, AI agents, and contributors.
> These skills translate `docs/BRAND_GUIDELINES.md` into living practice.

### 11a. Seven Core Skills

| # | Skill | Key Checks |
|---|-------|-----------|
| **1** | **Token Integrity** | Import only from `@/constants/theme`; zero raw hex in JSX; `useColors()` + `useLayout()` everywhere; run `typecheck` before done |
| **2** | **Cultural Minimalism** | Content (events, communities) leads; brand palette used semantically (indigo=trust, coral=energy, gold=premium/indigenous only); uniform 16px radius + 4pt grid |
| **3** | **Typography & Voice** | Only `TextStyles.*` + `DesktopTextStyles` on desktop; celebratory, inclusive, grounded AU English; no "users", "content", "diverse/multicultural" |
| **4** | **Component Craftsmanship** | `<Button>` not raw Pressable; one primary (indigo) CTA per screen; `IconSize.*`; `Duration.*` + `prefersReducedMotion` guard; `ElevationAlias.*` |
| **5** | **Platform Parity** | Dark native, light web; `topInset = 0` on web; sidebar at ≥1024px; `expo-image` not RN `Image`; test all three platforms |
| **6** | **Accessibility & Inclusive Design** | WCAG AA baseline (4.5:1 text, 3:1 UI, 44×44pt targets, `accessibilityRole/Label/Hint`); brand color text safety rules (Section 8c); focus rings on web; `accessibilityViewIsModal` on Modal; `__DEV__` console guards |
| **7** | **Process Discipline** | `StyleSheet.create()` at module level; `ErrorBoundary` on async screens; no bare `fetch()` — use `api.*`; `captureRouteError()` in Cloud Functions; files ≤800 lines |

### 11b. Pre-PR Checklist (copy into PR description)

```markdown
## Brand & Accessibility Checklist
- [ ] All imports from `@/constants/theme` only (no sub-imports)
- [ ] Zero raw hex values in JSX/styles (`grep -r "#[0-9A-Fa-f]\{6\}" app/` returns 0 in new code)
- [ ] `useColors()` used for all color values; `useLayout()` for all responsive values
- [ ] Max one `variant="primary"` button per screen
- [ ] All Pressables have `accessibilityRole` + `accessibilityLabel`
- [ ] All Images have `accessibilityLabel` (unless purely decorative: `accessibilityElementsHidden`)
- [ ] Modal has `accessibilityViewIsModal={true}`
- [ ] Contrast: no brand color (coral/gold/teal/success/warning/error) used as text on white
- [ ] `expo-image` used (not React Native `Image`)
- [ ] `StyleSheet.create()` at module level (not inside render)
- [ ] `ErrorBoundary` wraps screen if it has async data
- [ ] `__DEV__` guard on all `console.log`
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Tested on iOS + Android + web
```

### 11c. AI Agent Instructions

When generating or modifying CulturePass UI code, agents must:
1. **Read `@/constants/theme`** to confirm the correct export name before using any token
2. **Never generate raw hex** — if a token doesn't exist, note it as a gap rather than hardcoding
3. **Check `BRAND_AUDIT_LOG.md` Section 8c** before using any brand color as text
4. **Apply the Pre-PR Checklist** to all generated code before returning it
5. **Flag files >500 lines** and suggest extraction into focused sub-components
6. **Prefer `<Button>`** over `<Pressable>` for any user-facing interactive element

---

## Audit Summary

**Total Screens Audited:** 23 / ~40
**Fully Compliant (✅):** 21 (was 16 — 5 fixed 2026-03-29)
**Needs Attention (⚠️):** 0
**Major Violations (❌):** 0 (was 1 — fixed 2026-03-29)
**Not Audited (⏳):** 17

**Fixes Applied 2026-03-29:**
1. ✅ `TextStyles` sub-import fixed in `event/[id]`, `venue/[id]`, `community/[id]`, `movies/[id]` → `@/constants/theme`
2. ✅ `tickets/index.tsx` sub-import fixed (`@/constants/typography` → `@/constants/theme`)
3. ✅ `business/[id].tsx` fully refactored — `useColors()` added, all hardcoded hex replaced with `colors.*` tokens
4. ✅ Third-party brand colours extracted to named module-level constants in `event/[id]` and `movies/[id]`
5. ✅ `community/[id].tsx` `shadowColor` + `freePillText` replaced with `colors.text` / `colors.textInverse`
6. ✅ `venue/[id].tsx`, `artist/[id].tsx` hero buttons: `accessibilityRole` + `accessibilityLabel` added
7. ✅ `tickets/index.tsx` action bar: `accessibilityRole` + `accessibilityLabel` on all 3 Pressables
8. ✅ `checkout/index.tsx`: `TouchableOpacity` → `Pressable`, close/dismiss/image/input `accessibilityLabel` added
9. ✅ `constants/colors.ts`: `light.textTertiary` + `light.tabIconDefault` `#8D8D8D` → `#767676` (AA fix: 3.29:1 → 4.54:1)

**Recommended ESLint Rule (add to `.eslintrc`):**
```json
"no-restricted-imports": ["error", {
  "paths": [
    { "name": "@/constants/colors", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/typography", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/spacing", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/elevation", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/animations", "message": "Import from @/constants/theme instead." }
  ]
}]
```

**Files Not Found (path mismatch — verify):**
- `app/landing.tsx` — may be `app/landing/` or renamed
- `app/search/index.tsx` — may be `app/search.tsx`
- `app/scanner.tsx` — check `app/scanner/index.tsx`
- `app/membership/upgrade.tsx` — check `app/membership/` directory

**Next Audit Date:** Before April 15 launch — focus on `business/[id]` fix (❌), remaining `⏳` feature flows, and `perks.tsx`

---

**Approval Sign-off**

- Auditor: ___________________________ Date: 2026-03-29
- Reviewer: __________________________ Date: __________

---

**Notes / Action Items**
- [ ] Add ESLint rule to ban raw hex literals in style values
- [ ] Add ESLint rule to ban imports from `@/constants/colors`, `@/constants/typography`, `@/constants/spacing` (enforce `@/constants/theme` only)
- [ ] Reconcile audit template file paths against `CLAUDE.md` architecture section
- [ ] Audit `app/(tabs)/perks.tsx` with targeted grep (file too large for full read)
- [ ] Complete audit of all detail pages (`event/[id]`, `venue/[id]`, `artist/[id]`, `community/[id]`, `business/[id]`) before launch

---

*This document is generated from BRAND_GUIDELINES.md and must be kept up-to-date whenever new routes are added.*
