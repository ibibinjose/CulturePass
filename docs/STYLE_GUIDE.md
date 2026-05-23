# CulturePass — Complete Style Guide & Design System

> **Version 2.0 — May 2026**
> Audience: Design, Product, iOS, Android, Web engineers, and external partners.
>
> This document is the **complete, production-ready** specification for CulturePass.
> **Authoritative token values** live in [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md) and in
> code at `@/design-system/tokens/theme`.
> **Five inviolable design laws**: [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

---

## Table of Contents

1. [Brand Foundations](#1-brand-foundations)
2. [Global Grid & Spacing System](#2-global-grid--spacing-system)
3. [Component Library](#3-component-library)
4. [Screen-by-Screen Documentation](#4-screen-by-screen-documentation)
5. [Key User Flows](#5-key-user-flows)
6. [Design System Token Handoff](#6-design-system-token-handoff)

---

# 1. Brand Foundations

## 1.1 Product Identity

| Item | Standard |
|------|----------|
| **Product name** | **CulturePass** — one word, capital C and capital P |
| **Regional label** | **CulturePass AU** — Australia-only legal/marketing copy only |
| **Platform model** | B2B2C cultural lifestyle marketplace for diaspora communities |
| **Tagline — Primary** | *Belong anywhere.* (period included) |
| **Tagline — Secondary** | *Discover. Connect. Belong.* |
| **Platform tagline** | *Your one-stop lifestyle platform for cultural diaspora communities* |
| **Aesthetic** | "Night Festival" — bold contrast, warm surfaces, content-first |
| **Voice** | Welcoming, curious, premium yet approachable, culturally respectful |
| **Markets (Phase 1)** | Sydney + Melbourne; AU, NZ, UAE, UK, CA |

**Tagline rules**: Only use the official taglines above. Never invent variants. "Belong anywhere." with the full stop is the only primary tagline.

---

## 1.2 Logo & Wordmark

### Components

| Component | File | Usage |
|-----------|------|-------|
| `BrandLockup` | `src/design-system/ui/BrandLockup.tsx` | Icon mark + wordmark together (app header, splash, marketing) |
| `BrandWordmark` | `src/design-system/ui/BrandWordmark.tsx` | Text-only wordmark (compact surfaces, email footers) |

### Wordmark Rendering Rules

- **Always** render "CulturePass" as a single word with capital C and P.
- Never split across lines mid-word.
- Clear-space rule: minimum half the wordmark height on all four sides.
- Approved color treatments:
  - On dark: `#FAF9F6` (warm white) wordmark.
  - On light: `#1C1917` (near-black) wordmark.
  - On brand gradient: `#FFFFFF` (pure white) wordmark.
- Never apply drop shadow, stroke, or outline to the wordmark.
- Never stretch, skew, or change letter-spacing.

### Logo Icon Mark

- Minimum display size: 24×24 dp/pt.
- Preferred size in headers: 32×32 dp/pt.
- Never apply the SignatureGradient to the icon mark unless on a dedicated brand/splash surface.

---

## 1.3 Color System

### Design Principle

> **Law 2 — Integrity of Identity**: `CultureTokens` are immutable brand signatures. Never hardcode hex values in components. Use `CultureTokens.*` for brand colors and `useColors()` for semantic/functional UI.

### Core Brand Colors (`CultureTokens`)

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';
```

| Token | Hex | Role | WCAG on Dark Surface `#0C0A09` | WCAG on Light Surface `#FFFBF7` |
|-------|-----|------|-------------------------------|----------------------------------|
| `CultureTokens.indigo` | `#4F46E5` | Primary brand — trust, platform identity, transactions | AA (3.0:1) — use at 18px+ or bold | Fails — use as bg with white text |
| `CultureTokens.violet` | `#9333EA` | Active nav, community energy, gradient start | AA at large text only | Fails — use as bg with white text |
| `CultureTokens.coral` | `#FF5E5B` | Action, movement, urgency, CTAs | AA at large (3.8:1) | Fails on white — use as bg with dark text |
| `CultureTokens.gold` | `#FFC857` | Premium accent, chrome ONLY — **never body/datetime text** | 5.7:1 AA ✓ | 1.5:1 fails — accent only |
| `CultureTokens.teal` | `#0D9488` | Belonging, venues, free/live badges | AA (3.7:1) | Fails on white — icon/badge use |
| `CultureTokens.emerald` | `#10B981` | Success, growth, join actions | AA (3.2:1) | Marginal — icon/badge use |
| `CultureTokens.purple` | `#A855F7` | Community, creativity, secondary accents | AA (3.5:1) | Fails — use as bg with white text |

> **Gold and Teal accessibility note**: These are designated non-text accent colors. Do not use them for body copy, headings, or datetime labels on arbitrary surfaces. They pass AA only when used as icon/badge fills on sufficiently contrasting backgrounds.

### Signature Gradient

```typescript
import { SignatureGradient } from '@/design-system/tokens/theme';
// → [CultureTokens.violet '#9333EA', CultureTokens.coral '#FF5E5B']
// Direction: horizontal, LinearGradient start={x:0,y:0.2}
// CONSTRAINT: max ONE full SignatureGradient per screen.
// ALLOWED: hero banners, onboarding, CulturePass+ membership surfaces.
```

**Rationale**: The gradient is the platform's most emotionally resonant brand expression. Overuse dilutes its premium, "Night Festival" feel. It must remain a reward, not wallpaper.

### Semantic Color Roles (`useColors()`)

> Always access at runtime via `useColors()`. Never hardcode these hex values.

```typescript
import { useColors } from '@/hooks/useColors';
const colors = useColors();
```

| Role | Light Hex | Dark Hex | Usage |
|------|-----------|----------|-------|
| `colors.primary` | `#1C1917` | `#FAF9F6` | Primary text, primary CTA background |
| `colors.text` | `#1C1917` | `#FAF9F6` | Body copy — 16:1 contrast both modes ✓ AA |
| `colors.textSecondary` | `#44403C` | `#A8A29E` | Supporting text, captions — 7:1/3.8:1 ✓ |
| `colors.textTertiary` | `#78716C` | `#78716C` | Placeholders, inactive nav — decorative use only |
| `colors.background` | `#FFFBF7` | `#0C0A09` | Page background (OLED-black on dark) |
| `colors.surface` | `#FFFDFA` | `#1C1917` | Card / modal background |
| `colors.surfaceElevated` | `#FFFBF7` | `#292524` | Lifted surface (inputs, nested cards, dropdowns) |
| `colors.border` | `#E7E5E4` | `#44403C` | Standard border dividers |
| `colors.borderLight` | `#D6D3D1` | `#57534E` | Hairline dividers |
| `colors.tabBar` | `rgba(255,255,255,0.96)` | `rgba(0,0,0,0.94)` | Tab bar base (with BlurView/backdrop on top) |
| `colors.tabIconSelected` | `#18181B` | `CultureTokens.violet` | Active tab icon |
| `colors.eventDate` | `#DC2626` | `#F87171` | Event date/time text on card backgrounds |
| `colors.eventDateOnMedia` | `#FECACA` | `#FECACA` | Event date/time text over dark photography |

> **Event date text rule (inviolable)**: Use `colors.eventDate` with `TextStyles.eventCardDate`. Never use gold, yellow, or any `CultureTokens` color for event datetime labels. This constraint is a design principle, not a preference.

### Light vs Dark Mode

| Platform | Default Mode |
|----------|-------------|
| iOS | Dark ("Night Festival") |
| Android | Dark ("Night Festival") |
| Web | Light |

Dark mode is never hardcoded — `useColors()` returns the correct set based on the active color scheme. Never hardcode `#FFFBF7` or `#0C0A09` in component files.

### Legacy Colors (Deprecated)

Do not use: `#0066CC` ("CulturePass Blue"), `#2EC4B6` ("Ocean Teal"), any value not in `CultureTokens` or `useColors()`.

---

## 1.4 Typography

### Primary Font

**Poppins** — loaded via `@expo-google-fonts/poppins`. Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).

Platform fallbacks: `SF Pro` on iOS, `Roboto` on Android, `system-ui` on web.

```typescript
import { FontFamily, FontSize, TextStyles } from '@/design-system/tokens/theme';

FontFamily.regular   // Poppins_400Regular
FontFamily.medium    // Poppins_500Medium
FontFamily.semibold  // Poppins_600SemiBold
FontFamily.bold      // Poppins_700Bold
```

### Type Scale

| Step | Token | Size | Weight | Line Height | Letter Spacing | Usage |
|------|-------|------|--------|-------------|----------------|-------|
| Display | `FontSize.display` | 32px | Bold (700) | 38px | -0.5 | Marketing, rare landing hero |
| Hero | `FontSize.hero` | 28px | Bold (700) | 34px | -0.3 | Onboarding, large hero titles |
| Title | `FontSize.title` | 24px | Bold (700) | 30px | -0.2 | Main screen titles |
| Title 2 | — | 20px | Bold (700) | 26px | -0.1 | Subheadings, section titles |
| Body | `FontSize.body` | 16px | Regular (400) | 24px | 0 | Primary reading text |
| Callout | — | 15px | Regular (400) or SemiBold (600) | 22px | 0 | Secondary blocks, button labels |
| Body 2 | `FontSize.body2` | 14px | Regular (400) | 20px | 0 | Card copy, captions |
| Chip | `FontSize.chip` | 13px | Medium (500) | 18px | 0 | Filter chips, culture tags |
| Caption | `FontSize.caption` | 12px | Regular (400) | 16px | 0 | Timestamps, metadata |
| Tab Label | `FontSize.tab` | 10px | SemiBold (600) | 13px | 0.2 | Bottom tab labels ONLY |

### Typography Rules

- **Case**: Sentence case on all buttons, navigation labels, and headers. Never ALL CAPS except for badge labels where space is extremely limited.
- **Headings**: Slightly tight tracking (see `LetterSpacing` tokens above).
- **Button labels**: `FontFamily.semibold`, `letterSpacing: 0.15`.
- **No stretching**: Never apply `scaleX`/`scaleY` transforms to text.
- **Event card title**: Use `TextStyles.eventCardTitle` — bold, 14px, tight tracking.
- **Event card date**: Use `TextStyles.eventCardDate` with `colors.eventDate` — semibold, 13px.

### iOS Dynamic Type

All Text components should respect iOS Dynamic Type by avoiding fixed pixel heights on containers. Use `adjustsFontSizeToFit` only for single-line constrained labels. Do not suppress Dynamic Type.

### Android Font Scaling

Do not use `allowFontScaling={false}` unless absolutely required for a brand glyph. Always test at 200% font scale to ensure layouts reflow gracefully.

### Web Accessibility

`font-size` in `rem` on the web for scalability. Default base: 16px. Do not set `font-size` on `<html>` — let the browser respect user preferences.

---

## 1.5 Iconography

### Platform Sets

| Platform | Icon System | Style |
|----------|-------------|-------|
| iOS | SF Symbols via `expo-symbols` (iOS 16+) | 2pt line weight ("regular" weight) |
| Android | Material Symbols / Ionicons (`@expo/vector-icons`) | Matching stroke weight |
| Web | Ionicons SVG set | 24px grid, consistent stroke |

### Rules

- **Minimum touch target**: 44×44 pt/dp on all interactive icons (matches `AccessibilityTokens.minTapTarget`).
- Inactive navigation icons: `colors.textTertiary`.
- Active navigation icons: `#FFFFFF` (on gradient pill) / `CultureTokens.violet` (dark mode selected).
- Semantic icon sizes via `IconSize` tokens: `xs=12`, `sm=16`, `md=20`, `lg=24`, `xl=32`, `xxl=40`.

### Critical Icon Mappings

| Action | iOS Symbol | Android/Ionicons |
|--------|-----------|-----------------|
| Discover | `house.fill` | `home` |
| Calendar | `calendar` | `calendar` |
| Community | `person.3.fill` | `people` |
| City | `map.fill` | `map` |
| My Space | `person.crop.circle.fill` | `person-circle` |
| Search | `magnifyingglass` | `search` |
| Notifications | `bell.fill` | `notifications` |
| Menu | `line.3.horizontal` | `menu` |
| Add/Create | `plus` | `add` |
| Ticket | `ticket.fill` | `ticket` |
| Heart / Like | `heart.fill` | `heart` |
| Bookmark | `bookmark.fill` | `bookmark` |
| Back | `chevron.backward` | `chevron-back` |
| Share | `square.and.arrow.up` | `share-social` |
| Filter | `slider.horizontal.3` | `options` |
| Location | `location.fill` | `location` |

---

## 1.6 Elevation & Shadow System

### Platform Philosophy

| Platform | Elevation Method | Blur |
|----------|-----------------|------|
| iOS | `BlurView` (expo-blur), `blurFallback.ios = 56` | Yes — real-time |
| Android | Solid elevated `rgba` surface, `elevation: 1` | No blur |
| Web | CSS `backdrop-filter: blur(18px) saturate(140%)` | CSS filter |

```typescript
import { LiquidGlassTokens, Elevation } from '@/design-system/tokens/theme';

// GlassView component abstracts this:
import { GlassView } from '@/design-system/ui/GlassView';
// .native.tsx → BlurView (iOS) / solid rgba (Android)
// .web.tsx    → backdrop-filter: blur(18px) saturate(140%)
```

### Elevation Scale (`Elevation`)

| Level | dp (Android) | iOS Shadow | Web Box-Shadow | Usage |
|-------|-------------|-----------|----------------|-------|
| 0 | 0 | none | none | Flat surface |
| 1 | 2 | 0 1 2 rgba(0,0,0,0.08) | 0 1px 3px rgba(0,0,0,0.06) | Cards, chips |
| 2 | 3 | 0 2 4 rgba(0,0,0,0.10) | 0 2px 6px rgba(0,0,0,0.08) | Inputs, rows |
| 3 | 5 | 0 4 8 rgba(0,0,0,0.12) | 0 4px 12px rgba(0,0,0,0.10) | Modals, dropdowns |
| 4 | 8 | 0 8 16 rgba(0,0,0,0.14) | 0 8px 24px rgba(0,0,0,0.12) | Sheets, overlays |
| FAB | 10 | 0 10 20 rgba(0,0,0,0.18) | 0 10px 28px rgba(0,0,0,0.14) | FABs |

### Glass Surface Token Reference

```typescript
// Header glass icon buttons (GlobalNavActions)
const glassStyle = {
  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  borderWidth: 1,
  borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
  borderRadius: 12,
  width: 44,
  height: 44,
};

// Tab bar glass (iOS native)
// BlurView intensity 56, tint adapts to theme
// Android: backgroundColor rgba(0,0,0,0.94) dark / rgba(255,255,255,0.96) light
```

---

## 1.7 Motion & Animation Principles

### Core Motion Tokens

```typescript
import { Duration, SpringConfig } from '@/design-system/tokens/theme';

Duration.fast    // 150ms — micro-feedback (tap, toggle)
Duration.normal  // 250ms — component transitions
Duration.slow    // 400ms — screen-level changes, hero entrance

SpringConfig.smooth  // { damping: 18, stiffness: 200 } — default spring
SpringConfig.snappy  // { damping: 14, stiffness: 280 } — quick snappy feedback
```

### Platform Motion Rules

| Interaction | Animation | Platform |
|-------------|-----------|----------|
| Tab press | `withSpring(0.90 → 1.0)` scale (Reanimated 4) | iOS + Android |
| Button press | `withSpring(0.97)` scale | All |
| Card press | `withSpring(0.985)` scale | All |
| Screen transitions | Native stack defaults | All |
| Tab switch | No custom animation (platform default) | All |
| Modal entrance | Slide up from bottom | All |
| Toast entrance | Slide + fade | All |

### Haptics

```typescript
import * as Haptics from 'expo-haptics';

// On interactive tap (buttons, toggles, nav items):
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On destructive action confirmation:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// On success (ticket purchase, join complete):
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

Haptics are silently no-ops on web — no platform guards needed.

### Reduced Motion

```typescript
import { prefersReducedMotion } from '@/design-system/tokens/theme';
// Returns true when OS accessibility reduces motion
// When true: substitute opacity fade for scale/translate animations
```

---

# 2. Global Grid & Spacing System

## 2.1 4-Point Grid

All spacing uses multiples of 4. Never use arbitrary pixel values like 7, 11, or 15.

```typescript
import { Spacing } from '@/design-system/tokens/theme';

Spacing.xs   // 4px  — icon gaps, tight padding
Spacing.sm   // 8px  — compact internal spacing
Spacing.md   // 16px — default padding, standard gaps
Spacing.lg   // 24px — section spacing, generous padding
Spacing.xl   // 32px — section breaks, hero margins
```

**CSS custom properties** (web): `--cp-spacing-xs: 4px`, `--cp-spacing-sm: 8px`, `--cp-spacing-md: 16px`, `--cp-spacing-lg: 24px`, `--cp-spacing-xl: 32px`.

## 2.2 Horizontal Padding

```typescript
const { hPad } = useLayout();
// Mobile (<768px): 16px (20px on wider phones)
// Tablet (768–1023px): 24px
// Desktop (≥1024px): 32px
```

Always use `hPad` from `useLayout()` — never hardcode screen horizontal padding.

## 2.3 Column Grids

| Breakpoint | Columns | Gutter | Usage |
|-----------|---------|--------|-------|
| Mobile <768px | 4 | 16px | Single-column content, 2-col grids |
| Tablet 768–1023px | 8 | 24px | 2–3 col grids, horizontal rails |
| Desktop ≥1024px | 12 | 32px | 3–4 col grids, sidebar + content |

**Readable content width (web)**: Constrain long-form text to 720–920px max-width within the 12-column grid. Do not allow article copy to span all 12 columns at desktop.

## 2.4 Breakpoints

```typescript
import { Breakpoints } from '@/design-system/tokens/theme';
// Also accessible via useLayout():
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth } = useLayout();

Breakpoints.tablet   // 768px
Breakpoints.desktop  // 1024px

// Sidebar width: 240px on desktop, 0 elsewhere
```

## 2.5 Radius Scale

```typescript
import { Radius } from '@/design-system/tokens/theme';

Radius.xs    // 6px  — badges, micro-pills, notification dots
Radius.sm    // 10px — chips, filter pills, small controls
Radius.md    // 16px — buttons, inputs, search bars (default)
Radius.lg    // 20px — event cards, standard content cards
Radius.xl    // 24px — modals, bottom sheets, large surfaces
Radius.full  // 9999 — circular avatars, pill badges, toggle tracks
```

**CSS custom properties**: `--cp-radius-xs: 6px`, `--cp-radius-sm: 10px`, `--cp-radius-md: 16px`, `--cp-radius-lg: 20px`, `--cp-radius-xl: 24px`, `--cp-radius-full: 9999px`.

## 2.6 Safe Area & Insets

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// ALWAYS:
const topInset = Platform.OS === 'web' ? 0 : insets.top;
// NEVER: Platform.OS === 'web' ? 67 : insets.top — 67 is dead legacy code
```

Web `topInset` is always 0. Content sits beside the 240px left sidebar on desktop — there is no top bar on web.

---

# 3. Component Library

For every component: iOS · Android · Web variants, all states, accessibility annotations, and token references.

---

## 3.1 Navigation

### 3.1.1 Top App Bar / Header Chrome (`TabHeaderChrome.tsx`)

**Purpose**: Every main tab header. Pattern: Logo mark · Page title · Glass action buttons.

#### Anatomy

```
┌──────────────────────────────────────────────────────┐
│  [BrandMark 32×32]  [Page Title]    [🔔][🔍][☰]     │
│                                    44×44 glass buttons│
└──────────────────────────────────────────────────────┘
```

#### Specs

| Property | Value |
|----------|-------|
| Height | `HeaderTokens.height` = 44px native, 48px web |
| Horizontal padding | `HeaderTokens.paddingHorizontal` = 20px |
| Background | Glass (`GlassView`) — BlurView on iOS, solid on Android |
| Title font | `HeaderTokens.titleFontFamily` (Poppins Bold), 22px |
| Icon button size | 44×44px, `borderRadius: 12` |
| Icon button glass | Dark: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.10)` border; Light: `rgba(0,0,0,0.04)` bg, `rgba(0,0,0,0.07)` border |
| Notification badge | Coral bg `CultureTokens.coral`, 1.5px white border, min 16×16px, `Radius.full` |

#### States

| State | Visual |
|-------|--------|
| Default | Glass background, icon buttons visible |
| Scrolled | Blur intensifies slightly (iOS BlurView auto) |
| Search active | Search bar replaces title row |
| Dark | `rgba(255,255,255,0.08)` bg, white icons |
| Light | `rgba(0,0,0,0.04)` bg, dark icons |

#### Accessibility

```typescript
// Each glass icon button:
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Search"  // "Notifications (3 unread)", "Menu"
  style={glassButtonStyle}
/>
```

#### M3TopAppBar Variants (domain/feature screens)

```typescript
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';

// Small (default): left-aligned title, back button, trailing actions
<M3TopAppBar title="Event Details" onBack={router.back} actions={[...]} />

// Center-aligned: title centered (iOS modal convention)
<M3TopAppBar title="Checkout" variant="center-aligned" />

// Large: expanded title below header row
<M3TopAppBar title="Discover" variant="large" />

// Web variants: denseWeb, webHighContrast, webChromeless props available
```

---

### 3.1.2 Bottom Tab Bar (`CustomTabBar.tsx`)

**Purpose**: Primary navigation for mobile native and tablet web. Not shown on desktop web (≥1024px).

#### Specs

| Property | Value |
|----------|-------|
| Height | 84px native (including bottom inset on iPhone) |
| Background | `colors.tabBar` + BlurView (iOS), solid elevated (Android) |
| Active pill size | 56×32px (wider for balance), `Radius.full` |
| Active pill fill | `SignatureGradient` horizontal — violet `#9333EA` → coral `#FF5E5B` |
| Active icon color | `#FFFFFF` (on gradient) |
| Active label color | `CultureTokens.violet` |
| Inactive icon | `colors.textTertiary` |
| Inactive label | `colors.textTertiary` |
| Label font | `FontSize.tab` 10px, `FontFamily.semibold` |
| Press animation | `withSpring(0.90)` on pressIn → `withSpring(1.0)` on pressOut |
| Haptics | `Haptics.impactAsync(Light)` on tab change |

#### iOS Specifics

- BlurView `intensity={56}` over `colors.tabBar` background color.
- Home indicator spacing: add `insets.bottom` to tab bar height.
- SF Symbols for icons where possible.

#### Android Specifics

- No BlurView — use solid `colors.tabBar` with `elevation: 8`.
- Material Symbols / Ionicons for icons.

#### Web / Tablet

- Same gradient pill pattern.
- No blur on tablet web — `rgba` background.
- Hidden on desktop ≥1024px (sidebar takes over).

#### Visible Tabs

| Index | Label | Icon | Route |
|-------|-------|------|-------|
| 0 | Discover | `home` | `/(tabs)/` |
| 1 | Calendar | `calendar` | `/(tabs)/calendar` |
| 2 | Community | `people` | `/(tabs)/community` |
| 3 | City | `map` | `/(tabs)/city` |
| 4 | My Space | `person-circle` | `/(tabs)/my-space` |

#### Accessibility

```typescript
<Pressable
  accessibilityRole="tab"
  accessibilityLabel="Discover"
  accessibilityState={{ selected: isActive }}
/>
```

---

### 3.1.3 Desktop Web Sidebar (`WebSidebar.tsx`)

**Purpose**: Replaces the bottom tab bar on desktop (≥1024px).

| Property | Value |
|----------|-------|
| Width | 240px fixed (`useLayout().sidebarWidth`) |
| Position | Fixed left edge, full viewport height |
| Background | `colors.surface` + hairline right border |
| Nav item height | `TabBarTokens.heightDesktop` = 56px |
| Active state | Background `CultureTokens.indigo` at 8% opacity, indigo left accent bar 3px |
| Logo area | `BrandLockup` at top, padding 24px |
| Bottom area | User avatar, settings icon |

---

### 3.1.4 M3 Navigation Rail (`M3NavigationRail.tsx`)

**Purpose**: Tablet-width vertical navigation (768–1023px where applicable).

| Property | Value |
|----------|-------|
| Width | 80px |
| Item layout | Icon centered, label below |
| Active indicator | 64×32px pill, `CultureTokens.violet` at 12% bg |
| Active icon | `CultureTokens.violet` |

---

### 3.1.5 GlassView

```typescript
import { GlassView } from '@/design-system/ui/GlassView';

// iOS (.native.tsx): BlurView, intensity=56, tint adapts to theme
// Android (.native.tsx): solid rgba surface, elevation:1, no blur
// Web (.web.tsx): CSS backdrop-filter: blur(18px) saturate(140%)
```

Use `GlassView` whenever a surface floats over imagery (tab bar, header chrome, overlays on hero images). Never manually replicate the platform logic — use the component.

---

## 3.2 Buttons

**Rule**: ONE primary (solid fill) CTA per screen. Any second solid button must become secondary, outline, or ghost.

```typescript
import { Button } from '@/design-system/ui/Button';
import { M3Button } from '@/design-system/ui/M3Button';
```

### Button Variants

| Variant | Background | Label Color | Border | Usage |
|---------|-----------|-------------|--------|-------|
| `primary` | `colors.primary` | `colors.textInverse` | None | Main action per screen |
| `secondary` | `colors.surfaceElevated` | `colors.text` | None | Supporting action |
| `outline` | Transparent | `colors.text` | `colors.border` 1px | Tertiary, reversible |
| `ghost` | Transparent | `colors.textSecondary` | None | Quaternary, links |
| `gradient` | `SignatureGradient` diagonal | `#FFFFFF` | None | Hero/onboarding/CulturePass+ only |
| `danger` | `CultureTokens.coral` at 12% | `CultureTokens.coral` | None | Destructive — never primary |
| `gold` | `CultureTokens.gold` | `#1C1917` dark | None | Premium tier surfaces only |
| `glass` | rgba fill (see above) | `colors.text` | rgba border | Over imagery/gradients |

### Button Tokens

```typescript
ButtonTokens.height.md    // 52px — default height
ButtonTokens.height.sm    // 44px — compact contexts
ButtonTokens.height.lg    // 60px — hero CTAs
ButtonTokens.paddingH.md  // 20px horizontal padding
ButtonTokens.radius       // 16px (Radius.md)
ButtonTokens.radiusPill   // 9999 (Radius.full) — pill variant
ButtonTokens.fontSize.md  // 15px label
ButtonTokens.iconGap      // 8px between icon and label
ButtonTokens.pressScale   // 0.97
```

### Label Style

```typescript
// All button labels:
fontFamily:    FontFamily.semibold  // Poppins_600SemiBold
letterSpacing: 0.15
```

### States

| State | Visual | Code Pattern |
|-------|--------|-------------|
| Rest | Full color | Default style |
| Hover (web) | Brightness 108% | `hovered && { opacity: 0.92 }` |
| Pressed | Scale 0.97, slight darkening | `withSpring(0.97)` |
| Disabled | 40% opacity | `disabled && { opacity: 0.4 }` |
| Loading | Label hidden, `ActivityIndicator` in place | `isLoading && <ActivityIndicator />` |

### M3Button Variants (Material 3)

```typescript
// Used on feature/domain screens
<M3Button variant="filled" />     // Primary filled (indigo/brand)
<M3Button variant="tonal" />      // Tonal (secondary brand tint)
<M3Button variant="outlined" />   // Outlined
<M3Button variant="elevated" />   // Surface with shadow
<M3Button variant="text" />       // Ghost/text only
```

### Accessibility

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Buy tickets"
  accessibilityState={{ disabled }}
  accessibilityHint="Navigates to ticket selection"
/>
// Web: aria-label, aria-disabled, type="button"
```

---

## 3.3 Cards

### 3.3.1 EventCard

The primary content unit. Governed by feature flag `eventcard-v2` which swaps V1 → V2.

```typescript
import EventCard from '@/modules/events/components/EventCard';
// Internally routes to EventCardV1 or EventCardV2 based on flag
```

#### Specs

| Property | Value |
|----------|-------|
| Width | `CardGrammarTokens.width` = 248px |
| Image height | `CardGrammarTokens.imageHeight` = 140px |
| Content padding | `CardGrammarTokens.contentPadding` = 12px |
| Border radius | `CardTokens.radius` = `Radius.lg` = 20px |
| Title font | `TextStyles.eventCardTitle` — Bold 14px, tight tracking |
| Date font | `TextStyles.eventCardDate` — SemiBold 13px, 0.15 spacing |
| Date color (card bg) | `colors.eventDate` — red spectrum, never gold |
| Date color (on image) | `colors.eventDateOnMedia` — `#FECACA`, soft rose |
| Press scale | `CardTokens.pressScale` = 0.985 |
| Shadow | `Elevation[1]` — subtle lift |

#### States

| State | Visual |
|-------|--------|
| Default | Surface bg, standard shadow |
| Pressed | 0.985 scale, haptic light |
| Saved | SaveToggle bookmark filled |
| Liked | LikeToggle heart filled, coral tint |
| Loading | `Skeleton` placeholder at same dimensions |

#### V2 Mode-C (flag-gated)

EventCardV2 uses Mode-C primitives — same props, refreshed visual layer with enhanced image treatment and culture tag overlays. Enabled by setting `eventcard-v2` flag.

---

### 3.3.2 SpotlightCard

**Purpose**: Flagship hero event — max ONE per screen section.

| Property | Value |
|----------|-------|
| Width | Full width (within hPad) |
| Image height | 220px mobile, 280px desktop |
| Overlay | LinearGradient transparent → `rgba(0,0,0,0.65)` from bottom |
| Title | `FontSize.title` Bold, white, bottom-left |
| Subtitle | `FontSize.body2` white, below title |
| Radius | `CardTokens.radiusLarge` = `Radius.xl` = 24px |
| CTA chip | Coral background, white label |

---

### 3.3.3 M3Card

```typescript
import { M3Card } from '@/design-system/ui/M3Card';

<M3Card variant="elevated" />    // shadow + surface
<M3Card variant="filled" />      // surfaceVariant fill
<M3Card variant="outlined" />    // border stroke, no shadow
```

All M3Card variants use `Radius.lg = 20px` and `Spacing.md = 16px` padding.

---

### 3.3.4 FeedCard

Used in social/activity feed. Width: full (within hPad). Height: auto. Image: 200px if present. Content: 16px padding. Avatar: 40px circle left-aligned.

---

### 3.3.5 BrowseCard

Used in browse category pages. Responsive grid: 2-col mobile, 3-col tablet, 4-col desktop. Image: aspect-ratio 4:3. Radius: `Radius.lg`. Hover on web: +4px lift.

---

### 3.3.6 PerkCard

| Property | Value |
|----------|-------|
| Width | Full-width list rows |
| Image | 80×80px thumbnail, left-aligned |
| Badge | Membership tier, gold bg |
| Expiry | `colors.textTertiary`, `FontSize.caption` |

---

### 3.3.7 Community Card

| Property | Value |
|----------|-------|
| Image | 160×100px header image |
| Avatar | 48px circle, overlapping bottom edge of image |
| Member count | Emerald icon + count |
| Join CTA | `M3Button` tonal variant |
| Radius | `Radius.lg` |

---

## 3.4 Text Fields & Search

### Search Bar

| Property | Value |
|----------|-------|
| Height | `InputTokens.heightSearch` = 48px |
| Radius | `InputTokens.radius` = `Radius.md` = 16px |
| Background | Glass style on native / `colors.surfaceElevated` |
| Icon | Search icon `colors.textTertiary`, left-aligned, gap 10px |
| Placeholder | `colors.textTertiary`, `FontSize.body` |
| Active border | `CultureTokens.indigo` 1.5px |
| Clear button | Appears when text present, `colors.textTertiary` × icon |

### Standard Input

| Property | Value |
|----------|-------|
| Height | `InputTokens.height` = 52px |
| Radius | 16px |
| Padding | H:16px, V:12px |
| Font | `FontSize.body` (16px) |
| Border | `colors.border` 1px rest / `CultureTokens.indigo` 1.5px focus |
| Error | `CultureTokens.coral` border + error message below |
| Label | Float above on focus (animated), `FontSize.caption` |

### DatePickerInput

```typescript
import { DatePickerInput } from '@/design-system/ui/DatePickerInput';
// Calendar icon trigger, native DatePicker on iOS/Android, custom picker on web
```

---

## 3.5 Filter & Chip System

### FilterChips / AnimatedFilterChip

```typescript
import { FilterChips, AnimatedFilterChip } from '@/design-system/ui/FilterChips';

// Horizontal scroll strip of selectable chips
ChipTokens.height    // 38px
ChipTokens.paddingH  // 16px
ChipTokens.radius    // Radius.full (pill shape)
ChipTokens.fontSize  // 13px
ChipTokens.gap       // 8px between chips
```

| State | Visual |
|-------|--------|
| Rest | `colors.surface` bg, `colors.border` border, `colors.textSecondary` label |
| Selected | `CultureTokens.violet` bg, white label, no border |
| Pressed | 0.97 scale |
| Disabled | 40% opacity |

### M3FilterChip

```typescript
import { M3FilterChip } from '@/design-system/ui/M3FilterChip';
// M3 color roles: secondaryContainer bg when selected
```

---

## 3.6 Lists & Rails

### HeroCarousel

- Full-width auto-advancing carousel.
- Each slide: SpotlightCard with `SignatureGradient` overlay (ONE per carousel, not per slide — the gradient is on the flagship slide only).
- Pagination dots: 6×6px, `CultureTokens.violet` active, `colors.textTertiary` inactive.
- Auto-advance: 5s interval, pause on interaction.

### EventRail / ActivityRail / CommunityRail / CategoryRail / CityRail

- Horizontal scroll via `ScrollView horizontal`.
- `M3SectionHeader` above with title + "See all" → browse route.
- EventRail item: `EventCard` 248px wide.
- Rail spacing: `Spacing.md` (16px) between items, `hPad` leading/trailing.

### PromotedRail

Featured/sponsored content. First item may have `CultureTokens.gold` "Featured" badge.

---

## 3.7 Overlays

### Modal

| Property | Value |
|----------|-------|
| Background | `colors.surface` |
| Radius | `Radius.xl` (24px) top corners |
| Backdrop | `rgba(0,0,0,0.6)` |
| Z-Index | `ZIndex.modal` = 400 |
| Max width (web) | 480px, centered |
| Handle indicator | 40×4px, `SheetTokens.handleColor`, centered top |

### Bottom Sheet

| Platform | Implementation |
|----------|---------------|
| iOS | Native ActionSheet or custom slide-up sheet |
| Android | M3 Modal Bottom Sheet pattern |
| Web | Fixed overlay panel, max-width 480px, centered |

All sheets: `SheetTokens.borderRadius` = `Radius.xl` = 24px top corners.

### Dialog (Confirmation)

Use for destructive actions only.
- Title: explicit consequence — "Delete event? This cannot be undone."
- Buttons: Cancel (outline) + Confirm Danger (danger variant).
- Never use a dialog for non-destructive confirmations — use a toast instead.

---

## 3.8 Progress & Feedback

### Skeleton

```typescript
import { Skeleton } from '@/design-system/ui/Skeleton';
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton';

// Always show skeleton immediately on mount — never a blank screen
// Animate: shimmer from left to right, Duration.slow = 400ms loop
// Color: colors.surfaceElevated base, colors.border shimmer highlight
```

### ActivityIndicator

- Color: `CultureTokens.violet` (standard), `#FFFFFF` on dark overlays.
- Always show when an async operation ≥300ms is in progress.

### Toast / Snackbar

```typescript
// Z-Index: ZIndex.toast = 500
// Position: bottom center, 16px above tab bar
// Duration: 3000ms auto-dismiss (errors: 5000ms)
// Radius: Radius.md (16px)
// Success: Emerald accent
// Error: Coral accent
// Info: Indigo accent
```

### Badge

```typescript
// Notification badge on header icons:
// Background: CultureTokens.coral
// Border: 1.5px white
// Size: min 16×16px, Radius.full
// Font: FontSize.caption bold, white
// Position: top-right corner of icon button
```

---

## 3.9 Avatars & Identity

```typescript
import { CultureImage } from '@/design-system/ui/CultureImage';

// Always use CultureImage (expo-image under the hood) — not React Native Image
// AvatarTokens.size.md = 40px (list items)
// AvatarTokens.size.lg = 56px (profile headers)
// AvatarTokens.size.xl = 72px (detail pages)
// AvatarTokens.radius = Radius.full (circular)
```

| Type | Shape | Size |
|------|-------|------|
| User avatar | `Radius.full` circle | 40px list, 72px profile |
| Community avatar | `Radius.lg` 20px square | 56px card, 80px detail |
| Artist avatar | `Radius.full` circle | 56px card |
| Organisation logo | `Radius.md` 16px | 48px card |

Fallback: initials on `CultureTokens.indigo` background.

---

## 3.10 Custom CulturePass Components

### HeroCarousel (`src/components/Discover/HeroCarousel.tsx`)

- Platform: All.
- Contains 3–5 SpotlightCard slides.
- `SignatureGradient` overlay on primary/featured slide.
- Accessibility: `accessibilityRole="adjustable"`, announce "Slide X of Y".

### IndigenousSpotlight (`src/components/Discover/IndigenousSpotlight.tsx`)

- Purpose: Culturally respectful Indigenous content card.
- Visual treatment: Earth tones — `CultureTokens.teal` accents, warm photography.
- Never uses `SignatureGradient` — its own distinct warm palette.
- Must include appropriate cultural acknowledgment copy.
- Accessibility: Full `accessibilityLabel` describing content and culture.

### SuperAppLinks (`src/components/Discover/SuperAppLinks.tsx`)

- 2×3 or 3×2 grid of quick-access destination tiles on Discover tab.
- Each tile: icon + label, `Radius.lg`, branded icon color.
- Routes to: CultureX, Host, Perks, Directory, Wallet, Map.

### CommunityHomeBanner (`src/components/CommunityHomeBanner.tsx`)

- Full-width hero for community detail pages.
- Image + gradient overlay + community name + member count.
- Join CTA: `M3Button` filled variant, top-right position.

### WidgetIdentityQRCard

- Displays user's CulturePass QR code.
- Background: dark glass surface.
- QR: white on dark.
- Radius: `LiquidGlassTokens.corner.mainCard` = 28px.

### WidgetNearbyEventsCard / WidgetUpcomingTicketCard / WidgetSpotlightCard

- Home screen widget surfaces.
- All use glass treatment (`GlassView`).
- `Radius.xl` for outer container.

### LikeToggle / SaveToggle

```typescript
import { LikeToggle, SaveToggle } from '@/design-system/ui/LikeToggle';
// LikeToggle: heart icon, backed by LikesContext
// SaveToggle: bookmark icon, backed by SavedContext
// Active: CultureTokens.coral (like) / CultureTokens.violet (save)
// Inactive: colors.textTertiary
// Press: withSpring scale 0.85 → 1.05 → 1.0
```

### SocialLinksBar (`src/components/SocialLinksBar.tsx`)

- Row of platform icon buttons (Instagram, Facebook, Twitter/X, Website).
- 44×44px touch targets.
- Icon color: `colors.textSecondary`.

### FilterModal (`src/components/FilterModal.tsx`)

- Full-screen overlay filter panel.
- Header: "Filters" title + "Reset" ghost button + close.
- Sections: Date range, Category, Culture Tag, City, Entry Type.
- Apply CTA: primary button, full width.

### LocationPicker (`src/components/LocationPicker.tsx`)

- City/country selection interface.
- Search input at top.
- Grid of city cards below.
- Selected city: `CultureTokens.violet` checkmark badge.

### NativeMapView (`src/components/NativeMapView.tsx`)

- `.native.tsx`: Expo MapView / react-native-maps.
- `.web.tsx`: Embedded map link / static image with open-in-maps CTA.
- Never load native map SDK on web.

### M3FAB (`src/design-system/ui/M3FAB.tsx`)

```typescript
// Floating Action Button for create flows
// Size: 56×56px standard, 40×40px small
// Background: CultureTokens.indigo (primary), CultureTokens.violet (secondary)
// Icon: white, IconSize.lg = 24px
// Elevation: MaterialExpressive.elevation.fab = 10
// Position: bottom-right, above tab bar (+ insets.bottom)
// Z-Index: ZIndex.overlay = 300
```

### M3SectionHeader (`src/design-system/ui/M3SectionHeader.tsx`)

```typescript
// Section title + optional "See all" action
// Title: SectionTokens.titleFontSize = 20px, bold
// "See all": colors.primary, FontSize.body2, right-aligned
// Padding: SectionTokens.verticalPadding + hPad
```

---

# 4. Screen-by-Screen Documentation

> Format per screen: Route · Purpose · Platform layout · Component hierarchy · Interactions · States · Accessibility.

---

## 4.1 Main Tab Screens

### Discover (index)
**Route**: `/(tabs)/` | **File**: `src/app/(tabs)/index.tsx`

**Purpose**: Primary discovery surface. Content-first feed of events, communities, categories, and cultural highlights.

**Layout Structure**

```
[TabHeaderChrome: BrandLockup + 🔔 🔍]
ScrollView (vertical)
  [HeroCarousel — 3 slides, full bleed]
  [M3SectionHeader "Events Near You"]
  [EventRail — horizontal scroll of EventCards]
  [M3SectionHeader "Communities"]
  [CommunityRail]
  [M3SectionHeader "Explore Categories"]
  [CategoryRail]
  [M3SectionHeader "Featured Cities"]
  [CityRail]
  [IndigenousSpotlight — IF indigenous content available]
  [SuperAppLinks — 2×3 quick-access grid]
  [M3SectionHeader "Highlights"]
  [EventRail]
  [bottom padding: TabBarTokens.heightMobile + insets.bottom]
```

**Platform Notes**

| Platform | Notes |
|----------|-------|
| iOS | TabHeaderChrome with BlurView, Dark mode default, SF Symbols |
| Android | Solid header, Ionicons, Dark mode default |
| Desktop web | Sidebar visible, no tab bar, `topInset = 0`, 12-col grid |
| Tablet web | Bottom tab bar, 8-col grid |

**Interactions**
- HeroCarousel auto-advances every 5s; swipe to manually advance.
- EventCard tap → `/(domain)/event/[id]`.
- CommunityCard tap → `/(domain)/community/[id]`.
- "See all" on EventRail → `/browse/events`.
- Scroll: header glass opacity intensifies slightly.

**States**
- **Loading**: Skeleton placeholders for each rail (FeedCardSkeleton at same dimensions).
- **Empty (no location set)**: Location prompt card with "Set your city" CTA.
- **Error**: ScreenState error component with "Try again" retry.
- **No events**: "No events yet in your city — check back soon" invitation card.

**Accessibility**
- `ScrollView` with `accessible={false}` on decorative containers.
- Each EventCard: `accessibilityRole="button"`, `accessibilityLabel="[Event title], [Date], [Venue]"`.
- HeroCarousel: `accessibilityRole="adjustable"`, `accessibilityValue={{ text: 'Slide 1 of 3' }}`.

---

### Calendar
**Route**: `/(tabs)/calendar` | **File**: `src/app/(tabs)/calendar.tsx`

**Purpose**: Temporal event discovery — browse events by date and filter by category/culture.

**Layout Structure**

```
[M3TopAppBar "Calendar" — center-aligned]
[CalendarTabs: Month | Week | Agenda]
[CalendarFilters — horizontal chip strip]
  Culture: All | Indian | Chinese | Filipino | ...
  Category: All | Music | Food | Art | ...
[CalendarMonthGrid — 7-col grid of date cells]
[MapToggle — FAB-style, bottom-right]
[EventList — dates → grouped EventCard list below grid]
```

**Platform Notes**
- iOS: Native `DatePicker` not used here; custom CalendarMonthGrid.
- Android: Same custom grid.
- Web: CalendarMonthGrid + side-by-side event list on desktop.

**Interactions**
- Tap date cell → expand event list for that date.
- Filter chips animate selection.
- MapToggle → switch to map view of events.

**States**
- Loading: Skeleton grid cells.
- Empty month: "No events in [Month]" with navigation arrows to adjacent months.

**Accessibility**
- Date cells: `accessibilityRole="button"`, `accessibilityLabel="[Date], [N] events"`.
- Selected date: `accessibilityState={{ selected: true }}`.

---

### Community
**Route**: `/(tabs)/community` | **File**: `src/app/(tabs)/community.tsx`

**Purpose**: Community discovery and social feed.

**Layout Structure**

```
[TabHeaderChrome: BrandLockup + 🔍 + Compose button]
[CommunityTabs: For You | My Communities | Discover]
  [For You tab]
    [FeedCard list — joined community posts + activities]
  [My Communities tab]
    [CommunityRail — horizontal joined communities]
    [Activity feed for joined communities]
  [Discover tab]
    [M3SectionHeader "By Culture"]
    [CommunityRail — filtered by culture tag]
    [M3SectionHeader "Near You"]
    [CommunityRail — filtered by city]
```

**States**
- Loading: FeedCardSkeleton repeated 3×.
- Empty (no joined communities): "Join a community to see posts here" with Discover tab prompt.
- New user: Onboarding card with "Find communities that match your culture."

---

### City
**Route**: `/(tabs)/city` | **File**: `src/app/(tabs)/city.tsx`

**Purpose**: City destination exploration — local events, venues, culture spots.

**Layout Structure**

```
[TabHeaderChrome: city name + 🔍]
[CityHeroBanner — full-width hero image with city name overlay]
[HorizontalCultureRail — filter by culture/ethnicity]
[M3SectionHeader "Events in [City]"]
[EventRail]
[M3SectionHeader "Venues"]
[VenueRail]
[M3SectionHeader "Businesses"]
[BusinessRail]
[M3SectionHeader "Communities"]
[CommunityRail]
```

**States**
- City not detected: "Set your city" prompt CTA.
- Loading: skeleton hero + rail placeholders.

---

### My Space
**Route**: `/(tabs)/my-space` | **File**: `src/app/(tabs)/my-space.tsx`

**Purpose**: Personal dashboard — tickets, membership, saved events, profile summary.

**Layout Structure**

```
[ProfileHeader: avatar + name + culture tags + edit button]
[MembershipCard — tier badge, expiry, upgrade CTA if free tier]
[M3SectionHeader "Upcoming Tickets"]
[TicketRail — horizontal scroll of WidgetUpcomingTicketCard]
[M3SectionHeader "Saved Events"]
[EventRail — saved events]
[M3SectionHeader "My Communities"]
[CommunityRail — joined]
[M3SectionHeader "Recent Activity"]
[ActivityRail]
[SettingsRow → /settings]
```

**States**
- No tickets: "No upcoming events — discover events to get started."
- No saved: "Bookmark events to save them here."
- Loading: skeleton cards per section.

---

## 4.2 Hidden Tab Screens (href=null)

### CultureX
**Route**: `/(tabs)/CultureX` | Reached via: SuperAppLinks on Discover

**Purpose**: Immersive cultural experience — curated editorial content, cultural spotlights, live events.

**Layout**: Full bleed hero imagery, minimal chrome, `SignatureGradient` used as editorial accent. Dark mode preferred on all platforms.

---

### Host
**Route**: `/(tabs)/host` | Reached via: SuperAppLinks, host dashboard links

**Purpose**: Host/organiser dashboard surface. Entry to event creation, analytics, and backstage management.

**Layout Structure**

```
[M3TopAppBar "Host Dashboard"]
[HostSummaryCard — upcoming events count, total attendees, revenue]
[M3SectionHeader "Your Events"]
[EventList with status badges: Live / Draft / Cancelled]
[M3FAB: Create Event → /hostspace/create]
```

---

### Profile / Directory / Dashboard / Menu

These hidden tabs provide full-screen experiences accessible from within the app flow. They follow the standard `M3TopAppBar` + `ScrollView` layout with platform-native patterns.

---

## 4.3 Domain Screens

### Event Detail
**Route**: `/(domain)/event/[id]` | **File**: `src/app/(domain)/event/[id].tsx`

**Layout**

```
[Hero image — full-width, aspect 16:9, 240px mobile / 320px desktop]
  [Back button — glass, top-left]
  [Share button — glass, top-right]
  [SaveToggle — glass, below share]
[Content ScrollView]
  [EventTitle — FontSize.title Bold]
  [EventDateRow: date icon + colors.eventDate date/time text]
  [VenueRow: location icon + venue name → /venue/[id]]
  [CultureTagChips — horizontal strip]
  [TicketCTA section]
    [Price display]
    [M3Button "Get Tickets" filled — ONE primary CTA]
    [Tier selector if multiple tiers]
  [EventDescription — FontSize.body]
  [ArtistRail — if artists present]
  [SponsorsRow — if sponsors present]
  [HostInfoCard — organiser avatar + name → /organiser/[id]]
  [NativeMapView — venue map]
  [RelatedEventsRail]
[StickyFooter (iOS/Android): price + "Get Tickets" CTA button]
```

**States**
- Loading: skeleton layout — image placeholder, text skeletons.
- Sold out: CTA becomes "Sold Out" disabled state.
- Free entry: CTA becomes "RSVP Free" with teal accent.
- Past event: CTA hidden, "Event has passed" banner.
- Draft (organiser view): "Preview mode" banner + "Publish" CTA.

**Accessibility**
- Hero image: `accessibilityLabel="Hero image for [event title]"`.
- Date row: `accessibilityLabel="[Date], [Time]"`.
- CTA: `accessibilityRole="button"`, `accessibilityLabel="Get tickets for [event title], from $[price]"`.

---

### Business Detail
**Route**: `/(domain)/business/[id]`

**Layout**: Hero image → Business name/type → About → Hours → Address/Map → Events hosted → Contact/Social links. M3TopAppBar with share action.

---

### Venue Detail
**Route**: `/(domain)/venue/[id]`

**Layout**: Hero image → Venue name → Capacity → Address/Map → Upcoming events rail → Gallery strip → Contact. Teal accent used for "Live" and capacity badges.

---

### Community Detail
**Route**: `/(domain)/community/[id]` | **File**: `src/modules/communities/components/detail/CommunityDetailScreen.tsx`

**Layout**

```
[CommunityHomeBanner — full-width, community image + gradient + name]
  [MembersRail — top members avatars, overlapping circles]
  [Join CTA — M3Button filled]
[Content]
  [M3SectionHeader "About"]
  [Description text]
  [CultureTagChips]
  [M3SectionHeader "Members ([count])"]
  [MembersRail → /community/[id]/members]
  [M3SectionHeader "Events"]
  [EventRail — community-hosted events]
  [M3SectionHeader "Posts" — feature-flagged]
  [FeedCard list]
```

**States**
- Not a member: Join CTA visible.
- Member: Leave / Member badge.
- Private community: locked overlay on posts, join request flow.

---

### Community Members
**Route**: `/(domain)/community/[id]/members`

**Layout**: M3TopAppBar + search + member list rows (avatar + name + role badge + follow button).

---

### Artist Detail
**Route**: `/(domain)/artist/[id]`

**Layout**: Full-bleed hero (portrait orientation preferred) → Artist name → Genre tags → Bio → Upcoming events rail → Social links bar.

---

### Listing Create
**Route**: `/(domain)/listing/create` | **File**: `src/app/(domain)/listing/create.tsx`

Multi-step form. See Flow 5.8 (Listing Creation).

---

## 4.4 Onboarding Screens

### Cultures Selection
**Route**: `/(onboarding)/cultures`

**Purpose**: User selects 1–5 culture identities.

**Layout**

```
[Progress bar: step 1 of 4, SignatureGradient fill]
[Hero: 'What cultures are part of your story?']
[Subtitle: 'Select all that resonate with you.']
[CultureGrid — 2-col grid of CultureCard tiles]
  Each tile: flag emoji + culture name, Radius.md
  Selected: CultureTokens.violet bg, white text, checkmark
  Unselected: colors.surface bg, colors.text
[Continue CTA — primary, disabled until ≥1 selected]
```

**Accessibility**: Each culture tile `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`, `accessibilityLabel="[Culture name]"`.

---

### Location Selection
**Route**: `/(onboarding)/location`

**Layout**

```
[Progress bar: step 2 of 4]
[Hero: 'Where are you based?']
[LocationPicker — city search + city grid]
[Detect location CTA — ghost, location icon]
[Continue CTA]
```

---

### Signup / Login
**Routes**: `/(onboarding)/signup`, `/(onboarding)/login`

**Layout (Signup)**

```
[Logo + 'Create your account']
[Email Input]
[Password Input + PasswordStrengthIndicator]
[Terms checkbox]
[Primary CTA: 'Create account']
[Divider: 'or continue with']
[SocialButton: Google]
[SocialButton: Apple — iOS native only]
[Link: 'Already have an account? Sign in']
```

**Rules**
- Apple Sign-In: render only on iOS native (check `Platform.OS === 'ios'`).
- Google Sign-In: all platforms.
- Biometric: offered after first login if device supports it.

---

### Biometric Auth
**Route**: Triggered from login/app-lock

Handled by `useBiometricAuth`. Shows system Face ID / Touch ID / Android Biometric prompt. No custom UI required — delegate fully to system.

---

## 4.5 Create Hub

### Hub Index
**Route**: `/create/` | **File**: `src/app/create/index.tsx`

**Layout**

```
[M3TopAppBar "Create"]
[M3SectionHeader "What would you like to create?"]
[CreateTypeGrid — 2-col grid]
  [Event card → /create/event]
  [Community card → /create/community]
  [Listing card → /create/listing]
  [Business card → /create/business]
```

Each card: icon (branded color) + title + subtitle describing the type.

---

### Create [type]
**Route**: `/create/[type]` | **File**: `src/app/create/[type].tsx`

Routes to type-specific multi-step creation flows. All follow:
1. `M3TopAppBar` with back + step counter.
2. `ProgressBar` (`SignatureGradient` fill).
3. Single focused step per screen.
4. Next/Continue CTA at bottom (sticky on native).

---

## 4.6 Host Space

### Host Dashboard
**Route**: `/hostspace/` | **File**: `src/app/hostspace/index.tsx`

```
[M3TopAppBar "Host Space"]
[SummaryCards row: events, attendees, revenue]
[M3SectionHeader "Your Events"]
[EventList — status: Live badge (teal), Draft (textTertiary), Cancelled (coral)]
[M3FAB "+" → /hostspace/create]
```

---

### Host Create Event
**Route**: `/hostspace/create` → `/hostspace/create/[category]`

Multi-step: Category → Details → Date/Time → Venue → Tickets/Pricing → Media → Review → Publish.
See Flow 5.9 (Host Event Creation).

---

### Backstage
**Route**: `/dashboard/backstage/[id]`

**Purpose**: Real-time event management for live events.

```
[M3TopAppBar "Backstage: [Event Name]"]
[LiveMetrics: checked-in / capacity (teal progress bar)]
[ScannerCTA → /scanner]
[AttendeeList — real-time updates]
[ActionRow: Send announcement / Close doors]
```

---

## 4.7 Organiser Profile

**Route**: `/organiser/[id]` | **File**: `src/app/organiser/[id].tsx`

```
[HeroBanner — organiser cover image]
[OrgAvatar — 72px, overlapping bottom of banner]
[Name + Verified badge (indigo tick)]
[M3SectionHeader "Upcoming Events"]
[EventRail]
[M3SectionHeader "Past Events"]
[EventRail]
[SocialLinksBar]
[Follow button — M3Button outlined]
```

---

## 4.8 Dashboard Screens

### Organizer Dashboard
**Route**: `/dashboard/organizer`

```
[M3TopAppBar "Dashboard"]
[DateRangePicker]
[MetricsGrid: Tickets sold / Revenue / Views / Conversion]
[RevenueChart — line chart, CultureTokens.violet line]
[M3SectionHeader "Your Events"]
[EventManagementList with analytics chips]
```

### Venue Dashboard / Sponsor Dashboard

Similar analytics-focused layouts with domain-specific metrics.

---

## 4.9 User & Social Screens

### User Profile
**Route**: `/user/[id]` | **File**: `src/app/user/[id].tsx`

```
[ProfileHeader: avatar 72px + name + culture tags]
[FollowButton — M3Button, changes state after follow]
[StatRow: followers | following | events attended]
[M3SectionHeader "Events Attended"]
[EventRail]
[M3SectionHeader "Communities"]
[CommunityRail]
```

### Profile Edit
**Route**: `/profile/edit` | **File**: `src/app/profile/edit.tsx`

```
[M3TopAppBar "Edit Profile" + Save action]
[AvatarEditor — tap to upload, 96px circle]
[Input: Display Name]
[Input: Bio]
[CultureTagSelector]
[InterestsSelector]
[SocialLinksEditor]
[DangerZone: Delete account link]
```

### Network Screen
**Route**: `/network/`

```
[M3TopAppBar "Network"]
[Tabs: Added | Followers | Following | Suggestions]
[UserList — avatar + name + follow/unfollow M3Button]
```

TanStack Query `useQuery` for each tab, `useMutation` for follow/unfollow.

### Contacts CRM
**Route**: `/contacts/` | **Detail**: `/contacts/[cpid]`

```
[M3TopAppBar "Contacts" + search]
[Search bar]
[SegmentChips: All | Pinned | Tagged | Recent]
[ContactList — avatar + name + last interaction + pin toggle]
```

Detail:
```
[M3TopAppBar "[Name]"]
[ContactHeader: avatar + name + cpid]
[NoteInput]
[TagsRow — add/remove tags]
[InterestsList]
[ActivityTimeline]
```

---

## 4.10 Discovery & Browse

### Browse Category
**Route**: `/browse/[category]` | **File**: `src/app/browse/[category].tsx`

```
[BrowseHeader — hero image + category name]
[FilterChips strip — subcategory filters]
[PromotedRail — sponsored results]
[BrowseCard grid — responsive: 2/3/4 columns]
```

### Explore
**Route**: `/explore` | **File**: `src/app/explore.tsx`

Discovery map + rail hybrid. `NativeMapView` full-height with overlay rails.

### Search
**Route**: `/search/`

```
[SearchBar — full width, auto-focused on entry]
[RecentSearches chips]
[SearchResults TabView: Events | Profiles | Movies | Users]
[FilterChips per tab]
[ResultList — EventCard / ProfileCard / MovieCard rows]
```

### Map
**Route**: `/map`

Full-screen `NativeMapView`. Event pins with coral markers. Cluster on zoom out. Tap pin → EventCard preview sheet.

### My Council
**Route**: `/my-council`

```
[M3TopAppBar "My Council Area"]
[CouncilInfoCard: LGA name + boundary map]
[M3SectionHeader "Events in Your Area"]
[EventRail — lgaCode-filtered]
```

---

## 4.11 Payment & Commerce

### Checkout Flow
**Route**: `/checkout/` (multi-step)

```
Step 1: Ticket Selection
  [EventSummaryCard — compact]
  [TierSelector: Free | General | VIP]
  [QuantitySelector]
  [PriceSummary]
  [Continue CTA]

Step 2: Contact Details
  [Input: Full name]
  [Input: Email]
  [Continue CTA]

Step 3: Payment
  [StripePaymentSheet — native Stripe UI]
  [Apple Pay / Google Pay buttons if available]
  [Pay CTA: primary, SignatureGradient for CulturePass+ purchase]

Step 4: Confirmation
  [SuccessAnimation — emerald checkmark]
  [TicketCard preview]
  [Add to Calendar CTA]
  [View Ticket CTA → /tickets/[id]]
```

### Tickets
**Route**: `/tickets/` | **Detail**: `/tickets/[id]`

```
[M3TopAppBar "My Tickets"]
[Tabs: Upcoming | Past]
[TicketCard list — QR visible]
```

Detail:
```
[M3TopAppBar "[Event Name]"]
[TicketQRCard — WidgetIdentityQRCard style, dark glass]
[EventDetails]
[TransferTicket ghost CTA]
```

### Membership Upgrade
**Route**: `/membership/`

```
[Hero: SignatureGradient bg — ONLY on this screen]
[MembershipTierCards: Free | Plus | Pro]
  [Feature comparison table]
[CTA: 'Upgrade to CulturePass+' — gradient button]
[StripePaymentSheet]
```

Note: This is one of the sanctioned screens for `SignatureGradient` usage.

### Wallet
**Route**: `/payment/wallet`

```
[BalanceCard — dark glass, violet accent]
[TransactionHistory list]
[Top-up CTA]
[Apple Pay / Google Pay integration]
```

### Perks
**Route**: `/perks/`

```
[M3TopAppBar "Perks"]
[MembershipBanner — current tier + upgrade nudge]
[FilterChips: All | Food | Events | Shopping | ...]
[PerkCard list]
```

**Perk Detail** (`/perks/[id]`):
```
[PerkHero — business image]
[PerkAbout — description, terms]
[PerkMembershipCard — tier required]
[PerkCouponModal — triggered on "Redeem"]
  [Barcode / QR code]
  [Expiry countdown]
```

---

## 4.12 Settings & Static Screens

### Notifications
**Route**: `/notifications/`

```
[M3TopAppBar "Notifications"]
[NotificationList — grouped by date]
  Each row: icon + title + body + time + deep-link tap
[Mark all read — ghost button]
```

Settings (`/settings/notifications`):
```
[Toggle list: Events near me | Communities | Promotions | ...]
Each toggle: M3Switch, right-aligned
```

### Settings
**Route**: `/settings/`

```
[ProfileSummaryRow]
[Section: Account — Edit profile, Change password, Connect accounts]
[Section: Appearance — Theme (System/Dark/Light), Language]
[Section: Privacy — Location, Data export]
[Section: Notifications → /settings/notifications]
[Section: Biometric — Face ID / Fingerprint toggle]
[Section: About → /about]
[Danger Zone — Delete account (danger button)]
```

### Static Screens (About / Legal / Help / Contact / Landing)

These follow a document layout: `M3TopAppBar` + `ScrollView` + long-form text content. Font: `FontSize.body`, line height 24px. Section headings: `FontSize.title2` Bold.

---

## 4.13 Admin Screens

All admin routes under `/admin/` use the same base layout:

```
[M3TopAppBar "[Screen Name]" + admin badge]
[AdminNavSidebar (web) / AdminTabBar (native)]
[Content area]
```

Key admin screens:

| Route | Purpose |
|-------|---------|
| `/admin/users` | User list + role management |
| `/admin/audit-logs` | Immutable action log |
| `/admin/moderation` | Reported content queue |
| `/admin/finance` | Revenue / payout overview |
| `/admin/discover` | Discover curation — feature event slots |
| `/admin/import` | Bulk event/profile import |
| `/admin/handles` | Username / handle management |
| `/admin/notifications` | Platform-wide push broadcasts |
| `/admin/platform` | Feature flags, system config |
| `/admin/data-compliance` | GDPR / privacy export requests |
| `/admin/updates` | In-app changelog management |
| `/admin/dashboard` | Summary metrics |

Admin screens use `colors.surface` backgrounds and standard M3 data table patterns. Admin-only `role` check via `useRole()` before rendering.

---

## 4.14 Shortlinks

Shortlink routes do a quick data fetch then redirect to the full domain route:

| Route | Redirects to |
|-------|-------------|
| `/b/[id]` | `/(domain)/business/[id]` |
| `/c/[id]` | `/(domain)/community/[id]` |
| `/c/[id]/members` | `/(domain)/community/[id]/members` |
| `/e/[id]` | `/(domain)/event/[id]` |
| `/t/[id]` | `/tickets/[id]` |
| `/u/[id]` | `/user/[id]` |
| `/v/[id]` | `/(domain)/venue/[id]` |

Each shortlink page shows a loading skeleton matching the destination layout while the redirect resolves. On web, use `router.replace()` (not `push`) so the shortlink URL doesn't appear in back-stack.

---

# 5. Key User Flows

## 5.1 Onboarding

**Steps**: 4 atomic steps, progress bar (SignatureGradient fill) at top.

```
Step 1: Cultures
  Route: /(onboarding)/cultures
  → CultureGrid selection, 1–5 cultures
  → Continue CTA (active once ≥1 selected)

Step 2: Location
  Route: /(onboarding)/location
  → LocationPicker (city search + grid)
  → GPS detect option
  → lgaCode written server-side on submit
  → Continue CTA

Step 3: Interests
  Route: /(onboarding)/interests (or merged into cultures)
  → Tag chips: Music, Food, Art, Sports, Fashion, ...
  → Select ≥3 recommended, no max enforced
  → Continue CTA

Step 4: Account Creation
  Route: /(onboarding)/signup
  → Email + password form (or social auth)
  → Terms checkbox required
  → Create account → Firebase Auth → Firestore user doc
  → Optional: biometric setup prompt

Post-onboarding:
  → router.replace('/(tabs)/')
  → Discover tab with personalized rails
```

**Haptics**: Light impact on each step completion. Success notification on account created.

**Accessibility**: Progress bar `accessibilityLabel="Step [N] of 4"`. Back button always available (except on final confirmation).

---

## 5.2 Authentication

### Email / Password

```
1. /login → email input → password input → Sign in
2. Firebase Auth signInWithEmailAndPassword
3. On success: router.replace('/(tabs)/')
4. On error: inline error below password field, coral border
```

### Google Sign-In

```
1. SocialButton "Continue with Google"
2. expo-auth-session / Google OAuth
3. Firebase signInWithCredential
4. New user: redirect to onboarding step 1
5. Returning: redirect to /(tabs)/
```

### Apple Sign-In (iOS only)

```
// Only rendered when Platform.OS === 'ios'
1. SocialButton "Continue with Apple"
2. expo-apple-authentication
3. Firebase signInWithCredential
4. Same routing as Google
```

### Biometric Unlock

```
1. App returns from background
2. useBiometricAuth checks device capability
3. If enabled: system biometric prompt
4. On success: resume session
5. On failure: fall back to PIN/password
```

---

## 5.3 Event Discovery & Filtering

```
1. Discover tab (/(tabs)/)
   → EventRail — tap EventCard → event detail
   → OR: search icon → /search

2. Search (/search/)
   → Type query → instant results (events, profiles)
   → FilterChips: Category | Culture tag | City | Entry type
   → Tap result → event detail

3. Browse (/browse/[category])
   → Category from CategoryRail or SuperAppLinks
   → BrowseCard grid + PromotedRail
   → FilterModal for advanced filters
   → Tap card → event detail

4. Calendar (/(tabs)/calendar)
   → Select date → event list
   → CalendarFilters for culture/category
   → Tap event → event detail

5. Map (/map)
   → Pan/zoom → event pins
   → Tap pin → EventCard preview sheet
   → Tap sheet → event detail
```

---

## 5.4 Event Ticketing

```
1. Event detail /(domain)/event/[id]
   → "Get Tickets" M3Button (primary, 1 per screen)

2. Tier Selection
   → TierSelector (Free / General / VIP / Custom)
   → QuantityPicker (+ / - buttons, Radius.full)
   → PriceSummary auto-updates

3. Checkout — /checkout/
   Step 1: Confirm selection
   Step 2: Contact details (name, email)
   Step 3: Payment (Stripe PaymentSheet)
     → Apple Pay / Google Pay if available (shown as primary)
     → Card input (Stripe Elements)

4. Confirmation
   → Success screen (emerald checkmark + animation)
   → Ticket QR card preview (WidgetIdentityQRCard)
   → "Add to Calendar" CTA (useCalendarSync)
   → "View Ticket" → /tickets/[id]

5. Ticket use
   → QR code in /tickets/[id]
   → Scanner validates at venue (/scanner)
```

**Error handling**: Stripe errors shown inline. Session timeout: warn 60s before, allow re-confirm without re-entering card.

---

## 5.5 Community Joining

```
1. Community discovered via:
   CommunityRail → CommunityCard tap
   OR search → community result
   OR shortlink /c/[id]

2. Community detail /(domain)/community/[id]
   → CommunityHomeBanner + member count
   → "Join" M3Button (primary)

3. Membership check:
   Free community → immediate join, optimistic UI
   Paid tier community → MembershipGate overlay
     → "Upgrade to Plus" → /membership/
     → OR: pay one-time community fee → /checkout/

4. Post-join:
   → Button changes to "Member ✓"
   → Community appears in My Communities tab
   → Feed updates with community posts
   → Optional: push notifications enabled prompt
```

---

## 5.6 Listing Creation

```
1. /create/ → select "Listing"
2. /create/listing (or /(domain)/listing/create)

Multi-step with progress bar:
  Step 1: Listing Type (Event / Business / Venue / Artist)
  Step 2: Basic Info (title, description)
  Step 3: Location (LocationPicker + map pin)
  Step 4: Media (image upload via useImageUpload — server/Sharp pipeline)
  Step 5: Details (category, culture tags, pricing)
  Step 6: Review & Publish

State persistence: useListingDraftPersistence saves each step to AsyncStorage.
On resume: picks up from last completed step.
Image upload: presigned URL → Sharp resize → storage bucket.
Publish: POST /api/events or /api/profiles with full payload.
```

---

## 5.7 Search & Global Filtering

```
1. Search icon in TabHeaderChrome
   → SearchBar opens (animated from icon, Reanimated)
   → Keyboard auto-shown

2. Type query → debounced 300ms → GET /api/search?q=...
   Params: city, country, category, cultureTag, entryType, pageSize

3. Results TabView:
   Events | Profiles | Movies | Users
   (users currently returns empty)

4. Filter chips below tabs:
   → Category, Culture Tag, Entry Type
   → Each chip tap → re-query with filter
   → FilterModal for advanced multi-filter

5. Tap result:
   Event → /(domain)/event/[id]
   Profile → entity-type route
   Movie → movie detail screen
```

---

## 5.8 Perks & Membership

```
1. My Space tab → MembershipCard "Upgrade" CTA
   OR Perks tab → PerkCard locked with tier badge

2. Membership upgrade (/membership/)
   → SignatureGradient hero screen (approved SignatureGradient use)
   → Tier comparison cards (Free / Plus / Pro)
   → "Upgrade" CTA → /checkout/ (Stripe subscription)

3. Perks (/perks/)
   → FilterChips (category filter)
   → PerkCard list (locked: PerkMembershipCard overlay on restricted perks)

4. Perk redemption:
   → PerkCard tap → perk detail
   → "Redeem" button
   → If eligible: PerkCouponModal opens
     → Barcode/QR code + expiry
     → "Show to staff" instruction
   → If locked: MembershipGate overlay → upgrade prompt
```

---

## 5.9 Host Event Creation

```
1. /(tabs)/host → M3FAB "+" OR "Create Event" M3Button
2. /hostspace/create → category selection grid
3. /hostspace/create/[category] → multi-step form:

  Step 1: Basic details (title, description)
  Step 2: Date & Time (DatePickerInput, duration)
  Step 3: Venue (LocationPicker + map)
  Step 4: Ticket Tiers
    → Free / Paid toggle
    → If paid: add tier CTA (name, price, capacity)
    → Stripe Connect check (stripe account required for paid events)
  Step 5: Media (hero image upload)
  Step 6: Artists & Sponsors (optional)
  Step 7: Review (all details summary)
  Step 8: Publish

4. On publish: POST /api/events → status: 'published'
5. Redirect → /dashboard/backstage/[id] or event detail
```

---

## 5.10 Profile Management

```
1. My Space tab → ProfileHeader "Edit" button
2. /profile/edit

Sections:
  - Avatar: tap circle → image picker (useImageUpload)
  - Display Name: text input
  - Bio: multiline input
  - Culture Tags: tag selector (same as onboarding)
  - Interests: chip multi-select
  - Social Links: row of platform inputs (Instagram, Facebook, Twitter, Website)

Save: PATCH /api/profiles → optimistic update → toast "Profile updated"
Image upload: presigned URL → Sharp → bucket → profile imageUrl updated
```

---

## 5.11 Wallet & Payments

```
Wallet (/payment/wallet):
  - Balance display (dark glass card)
  - Transaction history list
  - Top-up CTA → /payment/topup

Top-up (/payment/topup):
  - Amount selector (preset buttons: $10 / $20 / $50 + custom)
  - Apple Pay / Google Pay (primary method if available)
  - Card fallback (Stripe)

Organiser payouts:
  - Stripe Connect onboarding from /dashboard/organizer
  - Bank account verification
  - Payout schedule in dashboard
```

---

## 5.12 Council Area (AU)

```
1. Location onboarding step 2:
   → User sets city/suburb
   → GPS detect → nearest LGA via /api/councils/nearest
   → lgaCode written to users/{uid} server-side

2. Discover tab:
   → "Events in Your Area" EventRail
   → Firestore query: events where lgaCode == users.lgaCode

3. My Council (/my-council):
   → CouncilInfoCard with boundary map
   → Events filtered by lgaCode
   → Council name (from councils/ collection)
```

---

## 5.13 Settings & Notifications

```
Settings (/settings/):
  - Theme: System / Dark / Light (useAppAppearance)
  - Language: (future)
  - Biometric: toggle (useBiometricAuth)
  - Notification preferences → /settings/notifications

Notifications settings:
  Per-category toggles:
    Events near me
    Community updates
    Promotions & perks
    New followers
    Ticket updates
  All backed by per-user Firestore preferences
  Deep-link enabled: notification tap → specific route
```

---

## 5.14 Contacts CRM

```
1. /contacts → contact list
   - Search bar (instant local filter)
   - Segment chips: All | Pinned | Tagged | Recent
   - ContactRow: avatar + name + last interaction + pin toggle

2. /contacts/[cpid] → contact detail
   - ContactHeader: avatar + name + CulturePass ID
   - NoteInput (free text, auto-save)
   - TagsRow: add/remove tags
   - InterestsList: shared interests display
   - ActivityTimeline: past interactions

State: ContactsRepository (AsyncStorage keyed by cpid)
Context: ContactsContext for optimistic UI
```

---

## 5.15 Network Screen

```
/network/ → tabs:
  Added | Followers | Following | Suggestions

Each tab:
  - UserRow: avatar + name + follow/unfollow button
  - Follow: useMutation → POST /api/social/follow
  - Unfollow: useMutation → DELETE /api/social/follow
  - Optimistic update via TanStack Query cache

Suggestions: ranked by shared cultures + mutual follows
```

---

## 5.16 iCal Export

```
Event detail → "Add to Calendar"

Web (all browsers):
  → downloadICS() builds .ics payload (src/lib/ical.ts)
  → browser downloads file
  → Optional: webcal:// URL for city calendar subscription

iOS native:
  → useCalendarSync.native.ts
  → expo-calendar: requestPermissions → createEventAsync
  → Success toast

Android:
  → useCalendarSync.native.ts
  → expo-calendar intent
  → Success toast
```

---

## 5.17 Scanner (QR Ticket Validation)

```
/scanner → (requires camera permission)
  → expo-camera or expo-barcode-scanner
  → QR scan → parse ticket ID
  → POST /api/tickets/validate
  → Success: emerald flash + haptic success + attendee name
  → Already scanned: coral flash + "Already checked in"
  → Invalid: coral flash + "Invalid ticket"

Access: Host/organiser role only (checked via useRole())
```

---

# 6. Design System Token Handoff

## 6.1 TypeScript Token Imports

```typescript
// All from a single import:
import {
  // Brand colors
  CultureTokens,
  SignatureGradient,
  gradients,
  glass,
  neon,

  // Semantic (runtime)
  // Use: const colors = useColors();

  // Spacing
  Spacing,
  Radius,
  Breakpoints,
  Layout,

  // Typography
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  TextStyles,
  DesktopTextStyles,
  Typography,
  M3Typography,

  // Elevation
  Elevation,
  ElevationAlias,

  // Animation
  Duration,
  SpringConfig,
  prefersReducedMotion,

  // Component tokens
  ButtonTokens,
  CardTokens,
  CardGrammarTokens,
  InputTokens,
  ChipTokens,
  HeaderTokens,
  SheetTokens,
  AvatarTokens,
  TabBarTokens,
  SectionTokens,
  MotionTokens,
  AccessibilityTokens,
  LayoutRules,

  // Icon & Z-Index
  IconSize,
  ZIndex,

  // Glass & Material
  LiquidGlassTokens,
  LiquidGlassAccents,
  MaterialExpressive,
  BorderTokens,

  // M3 color schemes
  darkM3,
  lightM3,
} from '@/design-system/tokens/theme';
```

---

## 6.2 CSS Custom Properties (Web)

```css
:root {
  /* Brand */
  --cp-color-indigo:   #4F46E5;
  --cp-color-violet:   #9333EA;
  --cp-color-coral:    #FF5E5B;
  --cp-color-gold:     #FFC857;
  --cp-color-teal:     #0D9488;
  --cp-color-emerald:  #10B981;
  --cp-color-purple:   #A855F7;

  /* Semantic (light mode) */
  --cp-color-background:       #FFFBF7;
  --cp-color-surface:          #FFFDFA;
  --cp-color-surface-elevated: #FFFBF7;
  --cp-color-text:             #1C1917;
  --cp-color-text-secondary:   #44403C;
  --cp-color-text-tertiary:    #78716C;
  --cp-color-border:           #E7E5E4;
  --cp-color-event-date:       #DC2626;

  /* Spacing */
  --cp-spacing-xs:  4px;
  --cp-spacing-sm:  8px;
  --cp-spacing-md:  16px;
  --cp-spacing-lg:  24px;
  --cp-spacing-xl:  32px;

  /* Radius */
  --cp-radius-xs:   6px;
  --cp-radius-sm:   10px;
  --cp-radius-md:   16px;
  --cp-radius-lg:   20px;
  --cp-radius-xl:   24px;
  --cp-radius-full: 9999px;

  /* Typography */
  --cp-font-family:     'Poppins', 'SF Pro', 'Roboto', system-ui, sans-serif;
  --cp-font-size-tab:   10px;
  --cp-font-size-caption: 12px;
  --cp-font-size-chip:  13px;
  --cp-font-size-body2: 14px;
  --cp-font-size-body:  16px;
  --cp-font-size-title: 24px;
  --cp-font-size-hero:  28px;
  --cp-font-size-display: 32px;

  /* Z-Index */
  --cp-z-base:     0;
  --cp-z-raised:   10;
  --cp-z-dropdown: 100;
  --cp-z-sticky:   200;
  --cp-z-overlay:  300;
  --cp-z-modal:    400;
  --cp-z-toast:    500;

  /* Sidebar */
  --cp-sidebar-width: 240px;

  /* Transitions */
  --cp-duration-fast:   150ms;
  --cp-duration-normal: 250ms;
  --cp-duration-slow:   400ms;
}

[data-theme="dark"] {
  --cp-color-background:       #0C0A09;
  --cp-color-surface:          #1C1917;
  --cp-color-surface-elevated: #292524;
  --cp-color-text:             #FAF9F6;
  --cp-color-text-secondary:   #A8A29E;
  --cp-color-text-tertiary:    #78716C;
  --cp-color-border:           #44403C;
  --cp-color-event-date:       #F87171;
}
```

---

## 6.3 Figma / Design Tool Variable Naming Convention

| Category | Figma Group/Collection | Variable Format |
|----------|----------------------|-----------------|
| Brand | `CultureTokens` | `brand/indigo`, `brand/violet`, `brand/coral`, `brand/gold`, `brand/teal`, `brand/emerald`, `brand/purple` |
| Semantic Light | `Color/Light` | `color/background`, `color/surface`, `color/text`, `color/text-secondary`, etc. |
| Semantic Dark | `Color/Dark` | Same names as Light — switch via mode toggle |
| Spacing | `Spacing` | `spacing/xs`, `spacing/sm`, `spacing/md`, `spacing/lg`, `spacing/xl` |
| Radius | `Radius` | `radius/xs`, `radius/sm`, `radius/md`, `radius/lg`, `radius/xl`, `radius/full` |
| Typography | `Typography` | `type/display`, `type/hero`, `type/title`, `type/title2`, `type/body`, `type/callout`, `type/body2`, `type/chip`, `type/caption`, `type/tab` |
| Z-Index | `ZIndex` | `zindex/base` through `zindex/toast` |
| Component | `Component/Button` | `button/height-md`, `button/radius`, `button/font-size-md` |
| Component | `Component/Card` | `card/radius`, `card/padding`, `card/image-height-mobile` |
| Component | `Component/Chip` | `chip/height`, `chip/padding-h`, `chip/radius` |
| Gradient | `Gradient` | `gradient/signature` = `#9333EA → #FF5E5B` |

**Mode setup in Figma**: Create two modes in the `Color` collection — `Light` and `Default (Dark)`. All semantic color variables switch automatically on mode toggle. `CultureTokens` brand colors have no modes — they are fixed.

---

## 6.4 Platform Implementation Checklist

Every new screen or component must pass this gate before shipping:

- [ ] **No hardcoded hex** — every color uses `CultureTokens.*` or `useColors()`
- [ ] **`StyleSheet.create()` at module level** — no inline style objects in render
- [ ] **One primary CTA per screen** — if two solid buttons exist, one must be downgraded
- [ ] **Event date uses `colors.eventDate`** — never gold, yellow, or brand accent
- [ ] **`SignatureGradient` max once per screen** — hero/onboarding/CulturePass+ only
- [ ] **Web `topInset = 0`** — `Platform.OS === 'web' ? 0 : insets.top` always
- [ ] **`useLayout()` for responsive values** — never hardcoded padding/column widths
- [ ] **`CultureImage` (expo-image)** — never `react-native` Image
- [ ] **44×44px min touch target** — all interactive icons and buttons
- [ ] **`accessibilityRole` + `accessibilityLabel`** on all `Pressable` elements
- [ ] **Loading state** — skeleton or ActivityIndicator visible before data arrives
- [ ] **Empty state** — invitation copy, not an error message
- [ ] **`npm run typecheck`** passes with zero errors
- [ ] **Dark + light mode** tested — especially glass surfaces, text contrast

---

## 6.5 Anti-Pattern Reference

| Anti-Pattern | Correct Pattern |
|-------------|----------------|
| `color: '#4F46E5'` in component | `color: CultureTokens.indigo` |
| `color: '#DC2626'` for event date | `color: colors.eventDate` |
| `color: CultureTokens.gold` for event datetime | `color: colors.eventDate` with `TextStyles.eventCardDate` |
| Two `variant="primary"` buttons | One primary + one `variant="secondary"` or `"outline"` |
| `topInset: 67` on web | `Platform.OS === 'web' ? 0 : insets.top` |
| `import Image from 'react-native'` | `import { Image } from 'expo-image'` |
| Inline `style={{ padding: 16 }}` | `StyleSheet.create({ ... })` at module level |
| `Platform.OS === 'ios' ? blur : rgba` directly | `<GlassView>` component |
| Three `SignatureGradient` on one screen | One per screen maximum, hero/onboarding only |
| `backgroundColor: '#0066CC'` | Use `CultureTokens.indigo` (`#4F46E5`) |
| `backgroundColor: '#2EC4B6'` | Use `CultureTokens.teal` (`#0D9488`) |

---

## Document Hierarchy

| Document | Purpose | Source of Truth For |
|----------|---------|---------------------|
| **`docs/STYLE_GUIDE.md`** (this file) | Complete design system — brand, components, screens, flows | Human + engineering reference |
| **`docs/DESIGN_TOKENS.md`** | Exact token values, code patterns, Z-index, glass | Token values + code snippets |
| **`docs/DESIGN_PRINCIPLES.md`** | Five inviolable design laws | Decisions + trade-offs |
| **`culturepass-rules.md`** | NEVER/ALWAYS, API patterns | Engineer quick reference |
| **`docs/STORE_SUBMISSION.md`** | App Store / Play checklist | Deployment |
| **`src/design-system/tokens/theme.ts`** | Live TypeScript tokens | **Authoritative code values** |

When conflict arises between any document and `src/design-system/tokens/theme.ts`, the code is correct and the document needs updating.

---

*CulturePass Design System v2.0 — May 2026. Maintained by the CulturePass design and engineering team.*
*Primary tagline: "Belong anywhere." — Secondary: "Discover. Connect. Belong."*
