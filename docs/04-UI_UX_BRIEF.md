# 04 — UI/UX Design Brief

> **Version**: 2.0 — May 2026
> **Status**: Live — v1.1.0
> **Audience**: Design, Engineering, Brand Partners
> **Related**: [DESIGN_TOKENS](DESIGN_TOKENS.md) · [DESIGN_PRINCIPLES](DESIGN_PRINCIPLES.md) · [STYLE_GUIDE](STYLE_GUIDE.md) · [03-APP_FLOW](03-APP_FLOW.md)

---

## 1. Design Identity

### Aesthetic: "Night Festival"

CulturePass is designed to feel like attending a world-class cultural festival in a vibrant diaspora city at night — bold contrast, warm luminous surfaces, cultural imagery centre-stage.

| Dimension | Expression |
|---|---|
| **Mood** | Celebration, belonging, warmth, vibrancy |
| **Aesthetic** | Dark-first premium native; light clean on web |
| **Palette** | Violet-to-coral gradient anchor; warm near-blacks and off-whites |
| **Surfaces** | Glassmorphism on native; clean elevated cards on web |
| **Motion** | Spring-based physics; purposeful — not decorative |
| **Typography** | System fonts; SF Pro on iOS, Roboto on Android, Inter on web |

### Brand Voice

- **Welcoming** — every new user should feel invited, not recruited
- **Curious** — celebrate the richness of cultures, ask good questions
- **Premium yet approachable** — never cold or sterile; never cheap
- **Culturally respectful** — specificity over generality; no tokenism

---

## 2. Design Principles (Five Laws)

1. **Cultural Minimalism** — strip away interface clutter so cultural content takes centre stage. Every element earns its place.
2. **Integrity of Identity** — `CultureTokens` are immutable brand signatures. Never hardcode hex values.
3. **Platform Parity** — feel native on each platform. iOS uses SF Symbols + BlurView; Android uses Ionicons + semi-transparent surfaces; Web uses sidebar + CSS effects.
4. **Approachable Complexity** — powerful features feel simple. Progressive disclosure. Show less, do more.
5. **Technical Craftsmanship** — performance is design. 60fps animations. Sub-300ms API responses. Zero jank.

---

## 3. Colour System

### Core Brand Tokens

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';
```

| Token | Hex | Meaning | When To Use |
|---|---|---|---|
| `CultureTokens.indigo` | `#4F46E5` | Trust, platform identity | Primary CTAs, loyalty messaging, auth surfaces |
| `CultureTokens.violet` | `#9333EA` | Active states, community | Active nav, gradient start, community surfaces |
| `CultureTokens.coral` | `#FF5E5B` | Energy, movement, urgency | Gradient end, save toggles, alerts, actions |
| `CultureTokens.gold` | `#FFC857` | Premium accent | Tier badges, small accents — **never body text** |
| `CultureTokens.teal` | `#0D9488` | Global belonging, venues | Free badges, venue labels, success |
| `CultureTokens.emerald` | `#10B981` | Growth, join, success | Join buttons, success states, growth metrics |
| `CultureTokens.purple` | `#A855F7` | Community, creativity | Community-specific UI, secondary gradient |

### Signature Gradient

```
SignatureGradient: violet (#9333EA) → coral (#FF5E5B)
```

**Rule**: Maximum ONE `SignatureGradient` per screen. Reserved for hero sections, onboarding surfaces, and CulturePass+ upgrade prompts. Do not use for cards, buttons, or decorative purposes.

### Semantic Colours (runtime via `useColors()`)

```typescript
const colors = useColors(); // adapts to dark/light mode automatically
```

| Role | Purpose |
|---|---|
| `colors.background` | Page background (`#FFFBF7` light / `#0C0A09` dark — OLED black) |
| `colors.surface` | Card and modal background |
| `colors.surfaceElevated` | Inputs, nested cards, lifted surfaces |
| `colors.text` | Primary body text |
| `colors.textSecondary` | Supporting text, captions |
| `colors.textTertiary` | Placeholders, inactive nav labels |
| `colors.border` | Standard borders |
| `colors.eventDate` | Event date text (reddish on light surfaces) |
| `colors.eventDateOnMedia` | Event date text on dark imagery (soft rose) |
| `colors.primary` | Primary text + CTA background |

**Never hardcode hex values in components.** Verify with: `grep -r "#[0-9A-Fa-f]\{6\}"` — any match outside comments is a bug.

---

## 4. Typography

### Font Stack

| Platform | Font Family | Fallback |
|---|---|---|
| iOS | SF Pro (system) | `-apple-system` |
| Android | Roboto (system) | `sans-serif` |
| Web | Inter (Google Fonts) | `system-ui, sans-serif` |

### Type Scale

| Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 32–40pt | Bold (700) | 1.1 | Hero titles, onboarding headers |
| Heading 1 | 28pt | SemiBold (600) | 1.2 | Section headers |
| Heading 2 | 22pt | SemiBold (600) | 1.3 | Card titles, screen titles |
| Heading 3 | 18pt | Medium (500) | 1.3 | Subheadings, list headers |
| Body | 15–16pt | Regular (400) | 1.5 | Body copy, descriptions |
| Body Small | 13–14pt | Regular (400) | 1.4 | Supporting text, metadata |
| Label | 12pt | Medium (500) | 1.3 | Chips, tags, badges |
| Caption | 11pt | Regular (400) | 1.3 | Timestamps, footnotes |
| Tab Label | 10pt | Regular (400) | — | Bottom bar tab labels |

Import from `@/design-system/tokens/theme` as `TextStyles.*`.

**Event card text**: Use `TextStyles.eventCardTitle` / `TextStyles.eventCardDate` with `useColors().eventDate`. Never use gold or yellow for event datetime or primary card labels.

---

## 5. Spacing & Radius System

### Spacing (from `Spacing` tokens)

| Token | Value | Usage |
|---|---|---|
| `Spacing.xs` | 4px | Icon-to-label gaps, tight padding |
| `Spacing.sm` | 8px | Inner card padding, chip padding |
| `Spacing.md` | 16px | Standard content padding |
| `Spacing.lg` | 24px | Section spacing |
| `Spacing.xl` | 32px | Screen-level padding, hero gaps |
| `Spacing.xxl` | 48px | Large section separations |

**Horizontal padding** (`hPad`): 16px mobile, 24px tablet, 32px desktop (from `useLayout().hPad`).

### Border Radius (from `Radius` in `spacing.ts`)

| Token | Value | Usage |
|---|---|---|
| `Radius.xs` | 6px | Chips, small badges |
| `Radius.sm` | 10px | Input fields, small cards |
| `Radius.md` | 16px | Standard cards |
| `Radius.lg` | 20px | Large cards, modals |
| `Radius.xl` | 24px | Hero images, featured cards |
| `Radius.full` | 9999px | Pills, avatar containers, tags |

---

## 6. Layout System

### Responsive Grid

```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth } = useLayout();
```

| Breakpoint | Layout | Columns | Side Padding |
|---|---|---|---|
| Mobile (`< 768px`) | Bottom tab bar, single column | 1–2 | 16px |
| Tablet (`768–1023px`) | Bottom tab bar, multi-column | 2–3 | 24px |
| Desktop (`≥ 1024px`) | 240px left sidebar, no tab bar | 3–4 | 32px |

### Top Inset Rule

```typescript
// ALWAYS:
const topInset = Platform.OS === 'web' ? 0 : insets.top;

// NEVER:
// const topInset = Platform.OS === 'web' ? 67 : insets.top;  ← broken
```

### Safe Area

Native: `useSafeAreaInsets()` from `react-native-safe-area-context`. Always apply to headers and bottom-tab-adjacent content.

---

## 7. Component Library

All atomic UI primitives live in `src/design-system/ui/`. **Prefer these over raw `<Pressable>` / `<View>`**.

### Core Components

| Component | File | Usage |
|---|---|---|
| `Button` | `Button.tsx` | Diagonal gradient (`start {x:0,y:0.2}`), `letterSpacing: 0.15`; variants: primary, secondary, ghost, text |
| `Card` | `Card.tsx` | Standard surface card |
| `Badge` | `Badge.tsx` | Status and tier labels |
| `Input` | `Input.tsx` | Text input with validation states |
| `BackButton` | `BackButton.tsx` | Consistent back navigation |
| `BrandLockup` | `BrandLockup.tsx` | Icon mark + wordmark |
| `BrandWordmark` | `BrandWordmark.tsx` | Text-only wordmark |
| `GlassView` | `GlassView.tsx` + `.native.tsx` | Platform glass: BlurView (iOS) / solid elevated (Android) / CSS backdrop-filter (web) |

### Card Variants

| Component | Usage |
|---|---|
| `CardGrammar` | Content-type-aware card shell |
| `CardSurface` | Elevated surface container |
| `M3Card` | Material 3 card (elevated / filled / outlined) |
| `SpotlightCard` | Hero spotlight for featured events/communities |
| `FeedCard` | Activity feed item |
| `BrowseCard` | Category browse grid item |
| `EventCard` | Flag-dispatched: V1 (default) / V2 (Mode-C, feature-flagged via `eventcard-v2`) |
| `PerkCard` | Perk catalogue item |
| `PerkIndigenousCard` | Indigenous perk variant |

### Interactive Components

| Component | Usage |
|---|---|
| `LikeToggle` | Heart like toggle with haptic feedback |
| `SaveToggle` | Bookmark save toggle |
| `Checkbox` | Standard checkbox |
| `AnimatedFilterChip` | Spring-animated filter pill |
| `FilterChips` | Horizontal scrollable filter chip row |
| `M3FilterChip` | Material 3 filter chip variant |

### M3 Design System

| Component | Purpose |
|---|---|
| `M3TopAppBar` | Screen-level app bars with back/actions |
| `M3Button` | Filled / tonal / outlined / elevated / text |
| `M3SectionHeader` | Section title + "See all" action link |
| `M3FAB` | Floating action button |
| `M3NavigationRail` | Tablet vertical navigation rail |

**Rule**: Do NOT mix `useColors()` and `useM3Colors()` in the same component.

### Utility Components

| Component | Usage |
|---|---|
| `ScreenState` | Full-screen loading / error / empty states |
| `Skeleton` | Animated shimmer loading placeholder |
| `FeedCardSkeleton` | Feed-specific skeleton |
| `CultureImage` | Culture-aware image with fallback |
| `CultureTag` | Culture label chip |
| `SocialButton` | OAuth sign-in buttons (Google, Apple) |
| `SocialLinksBar` | Row of social platform icons |
| `PasswordStrengthIndicator` | Live password strength visual |

---

## 8. Navigation Chrome

### Bottom Tab Bar (`CustomTabBar.tsx`)

```
Active tab visual:
  ┌─────────────────────────┐
  │  56×32px pill (wider)   │
  │  LinearGradient fill:   │
  │  violet #9333EA → coral │
  │  icon: #FFFFFF (white)  │
  └─────────────────────────┘
  Active label: CultureTokens.violet + FontFamily.semibold
  Inactive: colors.textTertiary + FontFamily.regular
  Press: Reanimated withSpring scale 0.90 → 1.0
```

### Header Chrome (`TabHeaderChrome.tsx`)

Pattern: **logo mark · page title · glass action buttons**

```
Glass icon button (44×44px, borderRadius: 12):
  Dark:  bg rgba(255,255,255,0.08) · border rgba(255,255,255,0.10)
  Light: bg rgba(0,0,0,0.04)       · border rgba(0,0,0,0.07)

Notification badge:
  coral background · 1.5px white border · 16×16px minimum
```

Components: `HomeLogoMark`, `BrandMark`, `GlobalNavActions`, `TabPageChromeRow`

---

## 9. Glass Surfaces

```typescript
import { GlassView } from '@/design-system/ui/GlassView';
// iOS: expo-blur BlurView (tint: 'dark' | 'light' | 'prominent')
// Android: solid elevated surface (rgba overlay)
// Web: backdrop-filter: blur(18px) saturate(140%)
```

Use `GlassView` for:
- Modal sheets and bottom sheets
- Floating header elements
- Overlay cards on hero imagery
- Tab bar background (native iOS)

Avoid overuse — glass surfaces have a performance cost on web and mid-range Android.

---

## 10. Motion & Animation

All animations use **Reanimated 4** with spring physics. No CSS transitions on native.

### Spring Presets

```typescript
import { mainTabTokens } from '@/modules/core/layout/tabs/mainTabTokens';
// Spring presets: gentle, snappy, bouncy
```

| Interaction | Animation |
|---|---|
| Tab press | `withSpring(scale: 0.90)` → `withSpring(scale: 1.0)` |
| Card press | `withSpring(scale: 0.97)` → release |
| Modal entry | Slide up + fade; spring damping 20, stiffness 300 |
| Hero carousel | Scroll-linked parallax via `useAnimatedScrollHandler` |
| Filter chip select | Spring scale + colour transition |
| Like toggle | Spring bounce + haptic feedback |

**Principle**: Motion must serve function. No decorative animations. Every animation should either confirm an action, guide attention, or communicate state change.

---

## 11. Dark Mode / Light Mode

| Platform | Default | Override |
|---|---|---|
| iOS (native) | Dark | System setting / in-app toggle |
| Android (native) | Dark | System setting / in-app toggle |
| Web | Light | System setting / in-app toggle |

All colours via `useColors()` — never hardcode. Theme context provided by `AppearanceProvider` in `_layout.tsx`.

OLED dark background: `#0C0A09` — true near-black optimised for OLED screens.
Warm white light background: `#FFFBF7` — slightly warm to feel inviting, not clinical.

---

## 12. Iconography

| Platform | Icon Library | Notes |
|---|---|---|
| iOS | SF Symbols via `expo-symbols` (iOS 16+) | Native, weight-matched to SF Pro |
| Android | Ionicons via `@expo/vector-icons` | Closest visual match to SF Symbols |
| Web | Ionicons (same as Android for consistency) | |

Icon sizes: `IconSize.sm` (20px), `IconSize.md` (24px), `IconSize.lg` (28px), `IconSize.xl` (32px).

All icon-only buttons must have `accessibilityLabel`.

---

## 13. Event Card Design

### EventCard V1 (Default)

Standard event card with hero image, title, date, venue, price, culture tag, and action buttons.

### EventCard V2 (Mode-C — Feature Flagged)

Refreshed visual layer — same props, updated presentation. Gated via `useFlagOverride('eventcard-v2')`.

### Event Card Rules

- **Event datetime text**: `TextStyles.eventCardDate` + `useColors().eventDate` (red on light) or `useColors().eventDateOnMedia` (soft rose on dark imagery)
- **Never** use gold/yellow for event dates or primary card labels
- Culture tag shown as `CultureTag` chip (teal background)
- Price: "Free" in teal, paid price in primary text
- Like toggle: `LikeToggle` component (coral heart, haptic on tap)
- Save toggle: `SaveToggle` component

---

## 14. Key Screen Patterns

### Discover (Home)
- Dark hero carousel with content-masking gradient overlay
- Horizontal scroll rails with momentum scrolling
- `SectionHeader` with right-aligned "See all" link
- Skeleton loading on initial load

### Event Detail
- Full-bleed hero image with scroll-parallax
- Gradient overlay on hero for text legibility
- Action bar (buy / save / share) pinned above safe area bottom
- Venue map using `NativeMapView` (native) or embedded Google Map (web)

### Community Hub
- Cover image header with glassmorphic overlay
- Member avatar stack (first 5 members + count)
- Join/Leave CTA with spring animation

### Checkout
- Stripe card input with real-time validation
- Order summary with tier breakdown
- Loading state: shimmer + haptic confirmation on success
- Error state: Stripe error message inline (no modal)

### Onboarding
- Full-screen gradient backgrounds (SignatureGradient — one per screen)
- Large tap targets for culture tag / city selection
- Progress indicator (step dots)
- Skip option on optional steps

---

## 15. Accessibility

- Minimum touch targets: 44×44pt (all interactive elements)
- Contrast: ≥ 4.5:1 body text, ≥ 3:1 large text
- `accessibilityLabel` on all icon-only controls
- `accessibilityRole` on interactive elements (`button`, `link`, `checkbox`)
- Screen reader announcements on state changes (`AccessibilityInfo.announceForAccessibility`)
- Font scaling: support Dynamic Type (iOS) and font scale (Android) — no fixed `fontSize` without fallback
- Reduced motion: respect `AccessibilityInfo.isReduceMotionEnabled` — swap spring animations for simple fades

---

## 16. Platform Parity Rules

| Feature | iOS | Android | Web |
|---|---|---|---|
| Blur | `expo-blur BlurView` | `rgba()` semi-transparent fallback | `backdrop-filter: blur(18px)` |
| Navigation | Bottom tab bar (glass) | Bottom tab bar (solid) | Left sidebar (240px) |
| Icons | SF Symbols | Ionicons | Ionicons |
| Top inset | `insets.top` | `insets.top` | `0` (always) |
| Haptics | `expo-haptics` | `expo-haptics` | No haptics |
| Calendar sync | `expo-calendar` | `expo-calendar` | `.ics` download / `webcal://` |
| Push | FCM via `expo-notifications` | FCM | Web Push (roadmap) |
| Maps | `react-native-maps` + Google Maps | Same | Embedded Google Maps iframe |

---

*Last updated: May 2026 | Maintained by: CulturePass Design + Engineering*
