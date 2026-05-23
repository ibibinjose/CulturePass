# CulturePass Brand Guidelines

> **Audience**: Developers and AI agents building the CulturePass app.
>
> **2026 canonical handoff** (use these first when in doubt):
> - Narrative + platform standard: [`docs/STYLE_GUIDE.md`](STYLE_GUIDE.md)
> - Exact tokens and recipes: [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md)
> - Code: `import { … } from '@/design-system/tokens/theme'` and `useColors()` — **not** `@/constants/theme` for new work.
>
> This long-form document is retained for depth; tables below **must** match `DESIGN_TOKENS.md` / `CultureTokens` in code. Where they disagree, **code + DESIGN_TOKENS win**.

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Visual Identity](#2-visual-identity)
3. [Typography](#3-typography)
4. [Iconography](#4-iconography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Motion & Animation](#6-motion--animation)
7. [Elevation & Depth](#7-elevation--depth)
8. [Platform Guidelines](#8-platform-guidelines)
9. [Component Anatomy](#9-component-anatomy)
10. [Brand Voice](#10-brand-voice)
11. [Accessibility Standards](#11-accessibility-standards)
12. [Anti-Patterns](#12-anti-patterns)

---

## 1. Brand Identity

### Essence

CulturePass is a **B2B2C cultural lifestyle marketplace** for diaspora communities worldwide. It connects members to events, businesses, venues, and communities that celebrate their cultural identity.

**Brand character**: Warm, celebratory, and quietly confident. A trusted friend embedded in the community — not a government portal, not an NGO tool, not a generic city guide.

### Mission

Help diaspora communities find each other and celebrate their culture. Culture travels with you. So do we.

### Positioning

| Dimension | CulturePass |
|-----------|-------------|
| Category | Cultural lifestyle marketplace |
| Primary audience | Diaspora community members |
| Secondary audience | Event organisers, cultural businesses, venues |
| Tone | Warm, celebratory, contemporary, grounded |
| Aesthetic | Night festival — bold, high contrast, culturally rich |
| Product identity | Premium app — not community noticeboard, not government portal |

### Five Design Principles

These govern every UI decision. They are not suggestions.

| Principle | Definition | Agent Rule |
|-----------|------------|------------|
| **Cultural Minimalism** | Cultural content takes centre stage. Strip decorative clutter. | Before adding any visual element, ask: does this serve the content, or merely decorate around it? |
| **Token Integrity** | `CultureTokens` are immutable brand signatures. Never hardcode hex values. | `grep -r "#[0-9A-Fa-f]\{6\}"` any component you write. Any raw hex outside a comment is a bug. |
| **Platform Parity** | Experience must feel native to the physical device. | Test every layout against iPhone notch, Android, and desktop web. |
| **Approachable Complexity** | Make complex flows — ticketing, membership, governance — intuitive. | No screen may have more than one primary (solid indigo) button visible at once. |
| **Technical Craftsmanship** | Code quality IS design quality. A decision not enforced in code is a suggestion. | Run `npm run typecheck` before marking any task complete. Type error = design defect. |

---

## 2. Visual Identity

### Logo Usage

- Product name: **CulturePass** — one word, capital C, capital P, no space, no hyphen.
- Always render using `HeaderLogo.tsx` — never reconstruct the logo mark ad-hoc.
- Minimum clear space: `Spacing.md` (16px) on all sides.
- The logo appears on `colors.background`; do not place it on patterned or low-contrast surfaces.

### Core Brand Palette

These five tokens define the CulturePass identity. Use them intentionally — they are not interchangeable.

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';
```

| Token | Hex | Name | Semantic Meaning | Primary Use Cases |
|-------|-----|------|------------------|-------------------|
| `CultureTokens.indigo` | `#4F46E5` | Indigo-Violet | Primary brand, trust, platform identity | CTAs, links, trust surfaces, transaction flows |
| `CultureTokens.violet` | `#9333EA` | Rich Violet | Active navigation, community energy | Tab pill gradient start, community emphasis |
| `CultureTokens.coral` | `#FF5E5B` | Movement Coral | Action energy, urgency, emotion | Artist features, urgency, secondary actions, errors |
| `CultureTokens.gold` | `#FFC857` | Temple Gold | Cultural premium, warm chrome | Membership tier, premium badges — **not** body or datetime text |
| `CultureTokens.teal` | `#0D9488` | Warm Teal | Global belonging, venues | Venue icons, free/live badges, belonging signals |
| `CultureTokens.purple` | `#A855F7` | Community Purple | Creative / secondary accents | Movies, creative category tints |

### Functional Color Tokens

These extend the core palette for specific content types.

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';
```

| Token | Hex | Use Case |
|-------|-----|----------|
| `CultureTokens.event` | `#7C3AED` | Event listing accent |
| `CultureTokens.eventSoft` | `#F3E8FF` | Event card background tint |
| `CultureTokens.artist` | `#FF5E5B` | Artist profile accent (Coral) |
| `CultureTokens.artistSoft` | `#FFF1F0` | Artist card background tint |
| `CultureTokens.venue` | `#0D9488` | Venue profile accent (Teal) |
| `CultureTokens.venueSoft` | `#F0FDFB` | Venue card background tint |
| `CultureTokens.movie` | `#AF52DE` | Movie listing accent (Purple) |
| `CultureTokens.movieSoft` | `#F5F3FF` | Movie card background tint |
| `CultureTokens.community` | `#7C3AED` | Community accent |
| `CultureTokens.communitySoft` | `#F3E8FF` | Community card background tint |

### Status Tokens

| Token | Hex | Maps To | Use |
|-------|-----|---------|-----|
| `CultureTokens.success` | `#22C55E` | Emerald-green | Confirmation, validated ticket, payment success |
| `CultureTokens.warning` | `#FFC857` | Gold | Caution, low availability, pending |
| `CultureTokens.error` | `#FF5E5B` | Coral | Errors, cancellations, destructive |
| `CultureTokens.info` | `#0D9488` | Teal | Informational accents in the belonging family |

### Category Colors

Used for category chips, icons, and filter tints. Import from `CategoryColors`.

```typescript
import { CategoryColors } from '@/constants/theme';
```

| Category | Hex | Usage |
|----------|-----|-------|
| `CategoryColors.music` | `#FF6B6B` | Warm Red |
| `CategoryColors.dance` | `#4ECDC4` | Teal-Cyan |
| `CategoryColors.food` | `#FF9500` | Apple Orange |
| `CategoryColors.art` | `#A855F7` | Vivid Purple |
| `CategoryColors.wellness` | `#FF3B30` | Apple Red |
| `CategoryColors.movies` | `#5AC8FA` | Apple Teal-Blue |
| `CategoryColors.workshop` | `#FF9500` | Apple Orange |
| `CategoryColors.heritage` | `#8B6914` | Heritage Bronze |
| `CategoryColors.activities` | `#EC4899` | Hot Pink |
| `CategoryColors.nightlife` | `#6366F1` | Indigo-Violet |
| `CategoryColors.comedy` | `#F59E0B` | Amber |
| `CategoryColors.sports` | `#EF4444` | Bright Red |
| `CategoryColors.shopping` | `#AF52DE` | Apple Purple |

### Entity Type Colors

Used in directory and profile listings. Import from `EntityTypeColors`.

```typescript
import { EntityTypeColors } from '@/constants/theme';
```

| Entity | Hex |
|--------|-----|
| `EntityTypeColors.community` | `#0081C8` |
| `EntityTypeColors.organisation` | `#5856D6` |
| `EntityTypeColors.venue` | `#34C759` |
| `EntityTypeColors.council` | `#FF9500` |
| `EntityTypeColors.government` | `#AF52DE` |
| `EntityTypeColors.artist` | `#FF2D55` |
| `EntityTypeColors.business` | `#5AC8FA` |
| `EntityTypeColors.charity` | `#FF6B6B` |

### Light Theme (Web Default)

```typescript
import { useColors } from '@/hooks/useColors';
const colors = useColors(); // Returns light theme on web, dark on native
```

| Role | Hex | Token Key |
|------|-----|-----------|
| Background | `#FFFFFF` | `colors.background` |
| Surface | `#FFFFFF` | `colors.surface` |
| Surface Elevated | `#FFFFFF` | `colors.surfaceElevated` |
| Text | `#1B0F2E` | `colors.text` |
| Text Secondary | `#4A4A4A` | `colors.textSecondary` |
| Text Tertiary | `#8D8D8D` | `colors.textTertiary` |
| Border | `#E6D3B3` | `colors.border` |
| Border Light | `#F0E8DC` | `colors.borderLight` |
| Divider | `#E6D3B3` | `colors.divider` |
| Primary | `#4F46E5` | `colors.primary` |
| Primary Glow | `rgba(0,102,204,0.12)` | `colors.primaryGlow` |

### Dark Theme (Native Default)

| Role | Hex | Token Key |
|------|-----|-----------|
| Background | `#060C16` | `colors.background` |
| Background Secondary | `#0A1628` | `colors.backgroundSecondary` |
| Surface | `#0E2040` | `colors.surface` |
| Surface Elevated | `#4F46E5` | `colors.surfaceElevated` |
| Text | `#FFFFFF` | `colors.text` |
| Text Secondary | `#C9C9D6` | `colors.textSecondary` |
| Text Tertiary | `#8D8D8D` | `colors.textTertiary` |
| Border | `#0D2847` | `colors.border` |
| Primary Glow | `rgba(0,102,204,0.25)` | `colors.primaryGlow` |

### Gradients

```typescript
import { gradients } from '@/constants/theme';
```

| Name | Colors | Use Case |
|------|--------|----------|
| `gradients.culturepassBrand` | `#4F46E5` → `#FF5E5B` | Hero banners, onboarding, flagship CTAs |
| `gradients.culturepassBrandReversed` | `#FF5E5B` → `#4F46E5` | Reversed hero variant |
| `gradients.primary` | `#4F46E5` → `#4338CA` | Tab bar active pill, primary surfaces |
| `gradients.aurora` | `#007AFF` → `#5856D6` → `#AF52DE` | Background washes, decorative overlays |
| `gradients.sunset` | `#FF3B30` → `#FF9500` → `#FFCC00` | Warm feature cards, warm context |
| `gradients.midnight` | `#000000` → `#1C1C1E` → `#2C2C2E` | Deep dark backgrounds |
| `gradients.heroOverlay` | `transparent` → `rgba(0,0,0,0.6)` | Image card scrim for legible text |
| `gradients.gold` | `#FFCC00` → `#F4A100` | Premium/membership badges |
| `gradients.success` | `#34C759` → `#30D158` | Confirmation moments |

### Glass Surfaces

```typescript
import { glass } from '@/constants/theme';
```

| Variant | Use Case |
|---------|----------|
| `glass.light` | `rgba(255,255,255,0.72)` — Light mode cards, overlays |
| `glass.dark` | `rgba(28,28,30,0.72)` — Dark mode cards, overlays |
| `glass.ultraLight` | `rgba(255,255,255,0.85)` — Hero sections, featured cards |
| `glass.ultraDark` | `rgba(0,0,0,0.82)` — Dark mode hero sections |
| `glass.overlay` | `rgba(0,0,0,0.4)` — Modal/popover backdrop |

### Neon Accents (Use Sparingly)

```typescript
import { neon } from '@/constants/theme';
```

Neon tokens are for interactive focused/active states only — never general UI decoration.

| Token | Color | Glow |
|-------|-------|------|
| `neon.blue` | `#007AFF` | `rgba(0,122,255,0.45)` |
| `neon.purple` | `#AF52DE` | `rgba(175,82,222,0.45)` |
| `neon.teal` | `#5AC8FA` | `rgba(90,200,250,0.45)` |
| `neon.gold` | `#FFCC00` | `rgba(255,204,0,0.50)` |
| `neon.coral` | `#FF3B30` | `rgba(255,59,48,0.45)` |

### Color Usage Rules

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Primary CTAs | `colors.primary` (`#4F46E5`) | Any other color for primary action |
| Gold usage | Status, premium membership, indigenous markers only | Decorative accents, general highlights |
| Indigo for trust | Transactions, profile, loyalty, navigation active state | Random decorative highlights |
| Coral for action/error | Artist features, destructive states, high-urgency content | Positive confirmation, calm states |
| Theme-aware colors | `useColors()` hook | Hardcoded hex in JSX |
| Brand tokens | `CultureTokens.*` | Hardcoded hex for brand values |

---

## 3. Typography

### Font Family

**Poppins** is the exclusive typeface. No other fonts are permitted.

```typescript
import { FontFamily } from '@/constants/theme';
```

| Token | Weight | Usage |
|-------|--------|-------|
| `FontFamily.regular` | `Poppins_400Regular` | Body text, callouts, captions |
| `FontFamily.medium` | `Poppins_500Medium` | Labels, chips, supporting UI text |
| `FontFamily.semibold` | `Poppins_600SemiBold` | Card titles, section headers, badges |
| `FontFamily.bold` | `Poppins_700Bold` | Screen titles, hero headings, display text |

### Font Size Scale

All sizes follow a 4-point grid. Import individual values from `FontSize`.

```typescript
import { FontSize, LineHeight } from '@/constants/theme';
```

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `FontSize.tab` | 10px | 12px | SemiBold | Tab bar labels only |
| `FontSize.micro` | 11px | 16px | SemiBold | Badges, pills, micro-labels |
| `FontSize.caption` | 12px | 16px | Regular / SemiBold | Timestamps, secondary metadata |
| `FontSize.chip` | 13px | 20px | Medium | Filter chips, tag labels |
| `FontSize.body2` | 14px | 20px | Regular / Medium / SemiBold | Card body, secondary labels |
| `FontSize.callout` | 15px | 22px | Regular | Supporting text, callouts |
| `FontSize.body` | 16px | 24px | Regular / Medium / SemiBold | Primary reading text (base) |
| `FontSize.title3` | 18px | 28px | SemiBold | Card headers, section subheadings |
| `FontSize.title2` | 20px | 28px | Bold | Screen sub-headers |
| `FontSize.title` | 24px | 32px | Bold | Screen-level headings |
| `FontSize.hero` | 28px | 36px | Bold | Hero section headings |
| `FontSize.display` | 32px | 40px | Bold | Landing/marketing display |

### Desktop Overrides

On screens ≥ 1024px, apply `DesktopTextStyles` on top of `TextStyles`:

```typescript
import { TextStyles, DesktopTextStyles } from '@/constants/theme';

// Pattern:
<Text style={[TextStyles.title, isDesktop && DesktopTextStyles.title]}>
```

| Style | Mobile | Desktop |
|-------|--------|---------|
| `display` | 32px / 40lh | 40px / 52lh |
| `hero` | 28px / 36lh | 36px / 44lh |
| `title` | 24px / 32lh | 28px / 36lh |
| `title2` | 20px / 28lh | 24px / 32lh |

### Composed Text Style Presets

Use `TextStyles` presets in `StyleSheet.create()` rather than assembling raw font properties.

```typescript
import { TextStyles } from '@/constants/theme';
```

| Preset | Size | Weight | Use |
|--------|------|--------|-----|
| `TextStyles.display` | 32px | Bold | Marketing/landing hero |
| `TextStyles.hero` | 28px | Bold | Discover hero, onboarding headings |
| `TextStyles.title` | 24px | Bold | Screen headers |
| `TextStyles.title2` | 20px | Bold | Section titles, sub-headers |
| `TextStyles.title3` | 18px | SemiBold | Card headers, section labels |
| `TextStyles.headline` | 16px | SemiBold | Emphasised body text |
| `TextStyles.body` | 16px | Regular | Primary reading text |
| `TextStyles.bodyMedium` | 16px | Medium | Slightly emphasised body |
| `TextStyles.callout` | 15px | Regular | Supporting text |
| `TextStyles.cardTitle` | 14px | SemiBold | Card primary label |
| `TextStyles.cardBody` | 14px | Regular | Card description |
| `TextStyles.label` | 14px | Medium | UI labels |
| `TextStyles.labelSemibold` | 14px | SemiBold | Emphasised UI labels |
| `TextStyles.chip` | 13px | Medium | Filter chips, tags |
| `TextStyles.caption` | 12px | Regular | Timestamps, metadata |
| `TextStyles.captionSemibold` | 12px | SemiBold | Labels, metadata requiring emphasis |
| `TextStyles.badge` | 11px | SemiBold | Badge text, pill labels |
| `TextStyles.badgeCaps` | 11px | SemiBold / UPPERCASE | All-caps badge labels (RSVP, VIP) |
| `TextStyles.tabLabel` | 10px | SemiBold | Tab bar labels |

### Letter Spacing

```typescript
import { LetterSpacing } from '@/constants/theme';
```

| Token | Value | Usage |
|-------|-------|-------|
| `LetterSpacing.tight` | `-0.5` | Display, hero, title sizes |
| `LetterSpacing.normal` | `0` | Body text (default) |
| `LetterSpacing.wide` | `0.3` | Badge labels |
| `LetterSpacing.wider` | `0.8` | Small supporting text |
| `LetterSpacing.cap` | `1.2` | All-caps labels (RSVP, SYD) |

### Typography Rules

- **Never** use a font family not in `FontFamily` — no system fonts in UI components.
- **Never** assemble raw `fontFamily` + `fontSize` + `lineHeight` inline in JSX — use `TextStyles` presets.
- **Never** use `fontWeight` string values directly on Android — the `weight()` helper in the preset handles this cross-platform.
- **Always** apply `DesktopTextStyles` overrides for heading sizes on `isDesktop` screens.
- **Always** use `TextStyles.badgeCaps` (not manual `textTransform: 'uppercase'`) for badge text that must be all-caps.

---

## 4. Iconography

### Icon Libraries by Platform

| Platform | Library | Import |
|----------|---------|--------|
| iOS 16+ | SF Symbols via `expo-symbols` (`SymbolView`) | `import { SymbolView } from 'expo-symbols'` |
| iOS fallback / Android / Web | Ionicons | `import { Ionicons } from '@expo/vector-icons'` |
| Cross-platform decorative | expo-vector-icons family | Check availability per icon before using SF Symbols |

### Icon Size Scale

```typescript
import { IconSize } from '@/constants/theme';
```

| Token | Size | Use Case |
|-------|------|----------|
| `IconSize.xs` | 12px | Micro indicators, inline metadata icons |
| `IconSize.sm` | 16px | Caption-level icons, inline text icons |
| `IconSize.md` | 20px | Input field icons, card inline icons |
| `IconSize.lg` | 24px | Tab bar icons, primary navigation icons |
| `IconSize.xl` | 32px | Feature icons, empty state icons |
| `IconSize.xxl` | 40px | Hero icons, large decorative icons |

### Icon Usage Rules

- **Always** use vector icons — no rasterised PNG icons in UI.
- **Stroke consistency**: do not mix filled and outline variants of the same icon in a single context. Filled = active/selected state; outline = inactive/default state.
- **Tab bar**: icons must always appear alongside a label — never icon-only on tab bars.
- **Touch target**: wrap icons in a minimum 44×44pt pressable area (see Section 11).
- **Colour**: icon colour must use `useColors()` or `CultureTokens` — never hardcoded.
- **Accessibility**: every icon-only interactive element must have `accessibilityLabel`.
- **SF Symbols** are iOS 16+ only. Always provide an Ionicons fallback for Android and web using `Platform.select()` or `.native.tsx`/`.web.tsx` file pairs.
- **Gap between icon and label**: `IconSize.sm` (8px via `ButtonTokens.iconGap`).

---

## 5. Spacing & Layout

### 4-Point Spacing Grid

All spacing values are multiples of 4. Never use raw numbers outside this grid.

```typescript
import { Spacing } from '@/constants/theme';
```

| Token | Value | Use Case |
|-------|-------|----------|
| `Spacing.xs` | 4px | Micro gaps, icon-to-badge offsets |
| `Spacing.sm` | 8px | Icon-to-text gap, tight inline padding |
| `Spacing.md` | 16px | Default component padding, card padding, screen horizontal padding (mobile) |
| `Spacing.lg` | 24px | Section spacing, screen horizontal padding (tablet) |
| `Spacing.xl` | 32px | Large section spacing, desktop horizontal padding |
| `Spacing.xxl` | 40px | Hero section padding, spacious layout gaps |
| `Spacing.xxxl` | 48px | Extra-large spacing, onboarding sections |

### Border Radius

All component corners are standardised at 16px. The system does not use graduated radii for size hierarchy.

```typescript
import { Radius } from '@/constants/theme';
```

| Token | Value | Use Case |
|-------|-------|----------|
| `Radius.xs` | 16px | Small components |
| `Radius.sm` | 16px | Standard components |
| `Radius.md` | 16px | Default — cards, inputs, buttons |
| `Radius.lg` | 16px | Large components |
| `Radius.xl` | 16px | Extra-large components |
| `Radius.full` | 9999px | Pills, chips, avatars, fully-round elements |

### Component Token Tables

#### ButtonTokens

```typescript
import { ButtonTokens } from '@/constants/theme';
```

| Token | Value | Notes |
|-------|-------|-------|
| `ButtonTokens.height.sm` | 52px | All sizes unified at 52px — Apple minimum touch target |
| `ButtonTokens.height.md` | 52px | Default |
| `ButtonTokens.height.lg` | 52px | Large variant |
| `ButtonTokens.paddingH.sm` | 16px | Small button horizontal padding |
| `ButtonTokens.paddingH.md` | 20px | Default horizontal padding |
| `ButtonTokens.paddingH.lg` | 28px | Large horizontal padding |
| `ButtonTokens.radius` | 16px | Rectangular button radius |
| `ButtonTokens.radiusPill` | 9999px | Pill button radius |
| `ButtonTokens.fontSize.sm` | 14px | Small button label |
| `ButtonTokens.fontSize.md` | 15px | Default button label |
| `ButtonTokens.fontSize.lg` | 16px | Large button label |
| `ButtonTokens.iconGap` | 8px | Space between icon and label |

#### CardTokens

```typescript
import { CardTokens } from '@/constants/theme';
```

| Token | Value | Notes |
|-------|-------|-------|
| `CardTokens.radius` | 16px | Standard card corner radius |
| `CardTokens.radiusLarge` | 20px | Featured / hero cards |
| `CardTokens.padding` | 16px | Standard card internal padding |
| `CardTokens.paddingLarge` | 20px | Spacious card padding |
| `CardTokens.imageHeight.mobile` | 120px | Card image area height |
| `CardTokens.imageHeight.tablet` | 140px | Tablet card image height |
| `CardTokens.imageHeight.desktop` | 160px | Desktop card image height |
| `CardTokens.gap.mobile` | 16px | Gap between cards in a grid |
| `CardTokens.minWidth` | 160px | Minimum card width |

#### InputTokens

```typescript
import { InputTokens } from '@/constants/theme';
```

| Token | Value |
|-------|-------|
| `InputTokens.height` | 48px |
| `InputTokens.heightSearch` | 44px |
| `InputTokens.radius` | 16px |
| `InputTokens.fontSize` | 16px |
| `InputTokens.paddingH` | 16px |
| `InputTokens.paddingV` | 12px |
| `InputTokens.iconSize` | 20px |
| `InputTokens.iconGap` | 8px |

#### ChipTokens

```typescript
import { ChipTokens } from '@/constants/theme';
```

| Token | Value |
|-------|-------|
| `ChipTokens.height` | 36px |
| `ChipTokens.paddingH` | 16px |
| `ChipTokens.paddingV` | 8px |
| `ChipTokens.radius` | 50px (pill) |
| `ChipTokens.fontSize` | 13px |
| `ChipTokens.gap` | 8px |

#### AvatarTokens

```typescript
import { AvatarTokens } from '@/constants/theme';
```

| Token | Value |
|-------|-------|
| `AvatarTokens.size.xs` | 24px |
| `AvatarTokens.size.sm` | 32px |
| `AvatarTokens.size.md` | 40px |
| `AvatarTokens.size.lg` | 56px |
| `AvatarTokens.size.xl` | 72px |
| `AvatarTokens.size.xxl` | 96px |
| `AvatarTokens.radius` | 9999px (always circular) |
| `AvatarTokens.badgeSize` | 12px |
| `AvatarTokens.badgeOffset` | 2px |

#### TabBarTokens

```typescript
import { TabBarTokens } from '@/constants/theme';
```

| Token | Value |
|-------|-------|
| `TabBarTokens.heightMobile` | 84px (includes safe area) |
| `TabBarTokens.heightDesktop` | 64px |
| `TabBarTokens.iconSize` | 24px |
| `TabBarTokens.labelSize` | 10px |
| `TabBarTokens.labelSizeDesktop` | 11px |

#### Other Component Tokens

```typescript
import { HeaderTokens, SheetTokens, SectionTokens, ZIndex } from '@/constants/theme';
```

| Token | Value |
|-------|-------|
| `HeaderTokens.height` | 48px |
| `HeaderTokens.paddingVertical` | 12px |
| `HeaderTokens.paddingHorizontal` | 20px |
| `HeaderTokens.iconSize` | 24px |
| `SheetTokens.borderRadius` | 24px |
| `SheetTokens.handleHeight` | 4px |
| `SheetTokens.handleWidth` | 40px |
| `SheetTokens.headerHeight` | 56px |
| `SectionTokens.titleFontSize` | 20px |
| `SectionTokens.sectionSpacing` | 32px |
| `SectionTokens.iconSize` | 22px |

### Z-Index Scale

```typescript
import { ZIndex } from '@/constants/theme';
```

| Token | Value | Use Case |
|-------|-------|----------|
| `ZIndex.base` | 0 | Default layer |
| `ZIndex.raised` | 10 | Floating labels, slightly raised elements |
| `ZIndex.dropdown` | 100 | Dropdowns, autocomplete menus |
| `ZIndex.sticky` | 200 | Sticky headers, pinned bars |
| `ZIndex.overlay` | 300 | Semi-transparent screen overlays |
| `ZIndex.modal` | 400 | Modals, bottom sheets, drawers |
| `ZIndex.toast` | 500 | Toast notifications |
| `ZIndex.tooltip` | 600 | Tooltips, help popovers |

### Responsive Grid

```typescript
import { Breakpoints, Layout } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';

const { numColumns, hPad, columnWidth, isDesktop, sidebarWidth, contentWidth } = useLayout();
```

#### Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| `Breakpoints.tablet` | 768px | Mobile → tablet |
| `Breakpoints.desktop` | 1024px | Tablet → desktop (sidebar appears) |
| `Breakpoints.wide` | 1280px | Desktop → wide-screen |

#### Layout Grid by Viewport

| Viewport | Columns | H-Padding | Sidebar | Max Content Width |
|----------|---------|-----------|---------|-------------------|
| Mobile (`< 768px`) | 2 | 16–20px | None | 480px |
| Tablet (`768–1023px`) | 2–3 | 24px | None | 768px |
| Desktop (`≥ 1024px`) | 3–4 | 32px | 240px fixed | 1280px |

#### Layout Constants

| Token | Value |
|-------|-------|
| `Layout.tabBarHeight` | 84px |
| `Layout.maxContentWidth` | 480px |
| `Layout.mobileWebShell` | 480px |
| `Layout.tabletMaxWidth` | 768px |
| `Layout.desktopMaxWidth` | 1280px |

#### Grid Pattern

```typescript
// Correct grid implementation
const { numColumns, hPad, columnWidth } = useLayout();

<View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: hPad, gap: 14 }}>
  {items.map(item => (
    <View key={item.id} style={{ width: columnWidth() }}>
      <Card item={item} />
    </View>
  ))}
</View>
```

---

## 6. Motion & Animation

### Principles

1. **Ease-out on enter** — elements decelerate into view, feeling natural.
2. **Ease-in on exit** — elements accelerate away, not lingering.
3. **Scale 0.95 → 1.0** on press-in; **1.0 → 0.95** on press-out. Maximum scale: 1.05.
4. **Interruptible** — every animation must be cancellable mid-flight.
5. **Purposeful** — animation must communicate state change, not just decorate.
6. **Respect `prefers-reduced-motion`** — all animations must check `prefersReducedMotion`.
7. **Spring physics over linear** — spring configs feel natural; duration-only easing feels mechanical.

### Duration Constants

```typescript
import { Duration } from '@/constants/theme';
```

| Token | Value | Use Case |
|-------|-------|----------|
| `Duration.instant` | 100ms | Micro-interactions: toggles, checkboxes, small state changes |
| `Duration.fast` | 200ms | Quick transitions: chips, buttons, small reveals |
| `Duration.normal` | 300ms | Standard transitions: cards, modals, page elements |
| `Duration.slow` | 500ms | Emphasized transitions: full-screen overlays, major state changes |
| `Duration.stagger` | 60ms | Staggered list item entrance delay increment |

### Spring Config Presets

```typescript
import { SpringConfig } from '@/constants/theme';
```

| Preset | Damping | Stiffness | Mass | Use Case |
|--------|---------|-----------|------|----------|
| `SpringConfig.snappy` | 15 | 200 | 0.8 | Buttons, toggle switches, small interactive elements |
| `SpringConfig.smooth` | 20 | 120 | 1.0 | Cards entering view, tab transitions |
| `SpringConfig.bouncy` | 12 | 150 | 0.6 | Card entrance animations, celebratory moments |
| `SpringConfig.gentle` | 25 | 80 | 1.2 | Large elements, full-screen transitions, overlays |

### Usage with Reanimated 4

```typescript
import Animated, { withSpring, withTiming } from 'react-native-reanimated';
import { SpringConfig, Duration, prefersReducedMotion } from '@/constants/theme';

// Spring animation
const scale = useSharedValue(1);
scale.value = withSpring(0.95, SpringConfig.snappy);

// Timing animation
const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: prefersReducedMotion ? 0 : Duration.normal });
```

### Reduced Motion

```typescript
import { prefersReducedMotion } from '@/constants/theme';

// prefersReducedMotion is true on web when OS prefers-reduced-motion is set.
// On native, check AccessibilityInfo at runtime if precise value is needed.
const duration = prefersReducedMotion ? 0 : Duration.normal;
```

### Animation Rules

| Rule | Detail |
|------|--------|
| Micro-interactions | 100–200ms, `SpringConfig.snappy` |
| Page transitions | 250–350ms, `SpringConfig.smooth` |
| Modal/sheet entrance | 300–400ms, `SpringConfig.gentle`, slide from bottom |
| List stagger | `Duration.stagger` (60ms) per item, max 6 items animated |
| No looping animations | Avoid continuous looping animations; use on specific loading/empty states only |
| Haptics with animation | On interactive press animations, pair with `Haptics.selectionAsync()` (iOS/Android only) |

---

## 7. Elevation & Depth

### Elevation Scale

```typescript
import { Elevation, ElevationAlias } from '@/constants/theme';

// Numeric:
<View style={[styles.card, Elevation[2]]} />

// Semantic alias:
<View style={[styles.card, ElevationAlias.card]} />
```

| Level | Alias | Native `boxShadow` | Web `boxShadow` | Use Case |
|-------|-------|--------------------|-----------------|----------|
| `Elevation[0]` | `ElevationAlias.flat` | None | None | Flat surface, background-level elements |
| `Elevation[1]` | `ElevationAlias.card` | `0 1px 3px rgba(0,0,0,0.04)` | `0 1px 4px rgba(0,0,0,0.06)` | Cards at rest, list items |
| `Elevation[2]` | `ElevationAlias.cardRaised` | `0 2px 8px rgba(0,0,0,0.07)` | `0 2px 10px rgba(0,0,0,0.09)` | Focused cards, active chips, hovered cards on web |
| `Elevation[3]` | `ElevationAlias.sticky` | `0 4px 14px rgba(0,0,0,0.10)` | `0 4px 18px rgba(0,0,0,0.12)` | Sticky headers, floating action areas |
| `Elevation[4]` | `ElevationAlias.sheet` | `0 8px 24px rgba(0,0,0,0.14)` | `0 8px 32px rgba(0,0,0,0.15)` | Modals, bottom sheets, drawers |
| `Elevation[5]` | `ElevationAlias.popover` | `0 16px 40px rgba(0,0,0,0.18)` | `0 16px 48px rgba(0,0,0,0.18)` | Toasts, tooltips, popovers |

### Glass Surfaces

Glass surfaces apply translucency and a border. They are used on top of rich content (hero images, maps).

| Context | Glass Token | Border |
|---------|-------------|--------|
| Light mode card over image | `glass.light` | `rgba(255,255,255,0.35)` |
| Dark mode card over image | `glass.dark` | `rgba(255,255,255,0.08)` |
| Hero spotlight card | `glass.ultraLight` | `rgba(255,255,255,0.5)` |
| Dark mode hero card | `glass.ultraDark` | `rgba(255,255,255,0.06)` |
| Modal scrim | `glass.overlay` | None |

**iOS only**: Use `BlurView` (from `expo-blur`) with intensity 60–90 for glass effects. Wrap in `try/catch` — BlurView may fail in simulator. On Android, substitute with `glass.dark` / `glass.light` backgroundColor without the blur.

### Elevation Rules

- Shadows are always applied using `Elevation` tokens — never with raw `shadowColor`/`elevation` props.
- Do not apply `Elevation[3]` or higher to cards in a flat list context — reserve high elevation for genuinely floating UI.
- On web, `Elevation` automatically switches to CSS `boxShadow`. Never manually write `boxShadow` strings in component styles.

---

## 8. Platform Guidelines

### iOS

| Concern | Rule |
|---------|------|
| Icons | SF Symbols via `SymbolView` from `expo-symbols` (iOS 16+); Ionicons fallback on older iOS |
| Glass effects | `expo-blur` `BlurView`, intensity 60–90; wrap in `try/catch` for simulator |
| Haptics | `expo-haptics`: `selectionAsync()` for selection, `notificationAsync(Success/Error/Warning)` for feedback |
| Keyboard | `KeyboardAvoidingView` with `behavior="padding"` |
| Safe area | `useSafeAreaInsets()` for top/bottom insets |
| Top inset | `const topInset = Platform.OS === 'web' ? 0 : insets.top;` — never hardcode |
| Minimum OS | iOS 16.0 (set in `app.json` `ios.minimumOsVersion`) |
| Apple Sign-In | Required by App Store guidelines when other social sign-in is offered |
| Push notifications | Register FCM token via `expo-notifications` after login |
| Live Activities | `lib/live-activity.ts` — ticket countdown, event updates |
| Apple Wallet | `functions/src/services/walletPasses.ts` |
| Transport security | All HTTP calls must use HTTPS in production |

### Android

| Concern | Rule |
|---------|------|
| Icons | Ionicons — no SF Symbols |
| Glass effects | `glass.dark` / `glass.light` background color — BlurView not supported |
| Haptics | Same `expo-haptics` API works on Android |
| Keyboard | `KeyboardAvoidingView` with `behavior="height"` (not `"padding"`) |
| Safe area | `useSafeAreaInsets().bottom` for bottom navigation bar |
| Google Sign-In | Requires SHA-1 fingerprint in Firebase console for debug + release keystore |
| Maps | `react-native-maps` requires `EXPO_PUBLIC_GOOGLE_MAPS_KEY` |
| Status bar | `expo-status-bar` with `style="light"` for dark backgrounds |
| Edge-to-edge | Handle bottom navigation bar with `useSafeAreaInsets().bottom` |
| Minimum SDK | 26 (Android 8.0); target SDK 35 |
| Font padding | `includeFontPadding: false` on Text elements (already in `TextStyles` presets) |

### Web

| Concern | Rule |
|---------|------|
| Navigation at ≥ 1024px | `WebSidebar.tsx` (240px fixed, replaces tab bar) |
| Navigation below 1024px | Bottom tab bar — same as native mobile |
| Top inset | Always `0` — `const topInset = Platform.OS === 'web' ? 0 : insets.top;` |
| Shadows | `boxShadow` via `Elevation` tokens — never Android `elevation` |
| Touch patterns | No swipe-to-dismiss, no long-press-only interactions |
| Hover states | Use `neon.*` tokens for active/hovered elements in web-only code |
| Light mode | `useColors()` always returns light theme on web |
| Image rendering | `expo-image` (not React Native `Image`) — consistent cross-platform |
| Large content | `React.lazy()` + `<Suspense>` for heavy web screens |
| Scrollbars | Do not suppress scrollbars on web — browser default is correct |

#### Web Sidebar Pattern

```typescript
import { useLayout } from '@/hooks/useLayout';

const { isDesktop, sidebarWidth } = useLayout();
// sidebarWidth = 240 on desktop web, 0 elsewhere
// Use sidebarWidth when computing absolute widths that must account for the sidebar
```

### Platform-Divergent Code

For large platform divergences, use file suffixes rather than inline `Platform.OS` chains:

| File | Loaded on |
|------|-----------|
| `Component.tsx` | All platforms (fallback) |
| `Component.native.tsx` | iOS + Android |
| `Component.web.tsx` | Web only |

Reserve `Platform.OS` inline guards for small differences (2–3 branches). More than 3 branches = extract to file pair.

---

## 9. Component Anatomy

All components must use token imports from `@/constants/theme`. Hardcoded values are build errors.

### Button

| Variant | Background | Text | Border | When |
|---------|------------|------|--------|------|
| Primary | `colors.primary` (`#4F46E5`) | `colors.textInverse` (`#FFFFFF`) | None | One per screen, primary CTA |
| Secondary | `colors.backgroundSecondary` | `colors.text` | `colors.border` | Supporting action |
| Destructive | `CultureTokens.coral` tint | `CultureTokens.coral` | None | Delete, cancel, irreversible actions |
| Ghost | Transparent | `CultureTokens.teal` | `CultureTokens.teal` | Tertiary / linking actions |
| Disabled | `colors.textTertiary` | `#FFFFFF` | None | At 0.5 opacity |

```typescript
// Always use the <Button> component from components/ui — never raw Pressable + Text
import { Button } from '@/components/ui';

<Button variant="primary" onPress={handlePress} accessibilityLabel="Buy tickets">
  Buy tickets
</Button>
```

Size tokens: `ButtonTokens.height.md` (52px height), `ButtonTokens.radius` (16px), `ButtonTokens.paddingH.md` (20px).

**Rule**: No screen may have more than one `variant="primary"` button visible at once.

### Card

| Property | Token | Value |
|----------|-------|-------|
| Border radius | `CardTokens.radius` | 16px |
| Featured card radius | `CardTokens.radiusLarge` | 20px |
| Padding | `CardTokens.padding` | 16px |
| Image height (mobile) | `CardTokens.imageHeight.mobile` | 120px |
| Elevation (at rest) | `ElevationAlias.card` = `Elevation[1]` | Level 1 shadow |
| Elevation (focused) | `ElevationAlias.cardRaised` = `Elevation[2]` | Level 2 shadow |
| Image | `expo-image` `Image` component always | |

Card body text: `TextStyles.cardTitle` for title, `TextStyles.cardBody` for description, `TextStyles.caption` for metadata.

### Input

| Property | Token | Value |
|----------|-------|-------|
| Height | `InputTokens.height` | 48px |
| Border radius | `InputTokens.radius` | 16px |
| Font size | `InputTokens.fontSize` | 16px |
| Horizontal padding | `InputTokens.paddingH` | 16px |
| Icon size | `InputTokens.iconSize` | 20px |
| Icon gap | `InputTokens.iconGap` | 8px |
| Border color (default) | `colors.border` | — |
| Border color (focused) | `colors.primary` | — |
| Background | `colors.surface` | — |

Always use `<Input>` from `components/ui` — never a raw `TextInput`.

### Chip (Filter Pill)

| Property | Token | Value |
|----------|-------|-------|
| Height | `ChipTokens.height` | 36px |
| Horizontal padding | `ChipTokens.paddingH` | 16px |
| Border radius | `ChipTokens.radius` | 50px (pill) |
| Font size | `ChipTokens.fontSize` | 13px |
| Active background | `colors.primary` | — |
| Active text | `colors.textInverse` | — |
| Inactive background | `colors.surface` | — |
| Inactive text | `colors.textSecondary` | — |
| Inactive border | `colors.border` | — |

### Avatar

Avatars are **always circular** (`AvatarTokens.radius = 9999`). Never render square avatars.

| Size | Token | Dimension |
|------|-------|-----------|
| XS | `AvatarTokens.size.xs` | 24px |
| SM | `AvatarTokens.size.sm` | 32px |
| MD | `AvatarTokens.size.md` | 40px |
| LG | `AvatarTokens.size.lg` | 56px |
| XL | `AvatarTokens.size.xl` | 72px |
| XXL | `AvatarTokens.size.xxl` | 96px |

Status badge: `AvatarTokens.badgeSize` (12px), offset `AvatarTokens.badgeOffset` (2px) from edge.

### Badge

| Property | Value |
|----------|-------|
| Font style | `TextStyles.badge` or `TextStyles.badgeCaps` |
| Font size | 11px |
| Background | Category token or status token |
| Border radius | `Radius.full` (9999px) — always pill |
| Padding | `Spacing.xs` (4px) vertical, `Spacing.sm` (8px) horizontal |

**Gold badges are reserved for status/premium only** — do not use `CultureTokens.gold` for category or general decoration.

---

## 10. Brand Voice

### Voice Pillars

| Pillar | In Practice | Never |
|--------|-------------|-------|
| **Celebratory** | "Your city is buzzing this weekend." | "Event available in your area." |
| **Inclusive** | "Wherever you're from, your culture has a home here." | "Authentic events for true community members." |
| **Grounded** | "Culture travels with you. So do we." | "CulturePass makes diaspora life perfect!" |
| **Contemporary** | "Find your next experience." | "Utilise our platform to access cultural programming." |
| **Respectful** | Name communities specifically; amplify, don't appropriate. | Flatten First Nations culture as aesthetic. |

### Tone by Context

| Screen / Moment | Energy | Example |
|-----------------|--------|---------|
| Onboarding | Warm, welcoming, curious | "What's your story? Let's find your community." |
| Event discovery | Energetic, evocative, enticing | "This is the one you've been waiting for." |
| Ticketing / purchase | Confident, reassuring, concise | "You're in. See you there." |
| Membership upgrade | Aspirational, rewarding, clear | "Go deeper. Unlock more." |
| Empty state | Encouraging, never apologetic | "Nothing here yet — your city is full of life. Explore." |
| Error | Direct, calm, never blaming | "Something went wrong on our end. Try again." |
| Push notification | Punchy, immediate, relevant | "Doors open in 2 hours. Your ticket is ready." |
| First Nations content | Reverent, accurate, community-led | Platform, don't narrate. |

### Vocabulary — Use

| Word | Why |
|------|-----|
| Discover | Exploration, finding something new |
| Community | The people, the belonging |
| Experience | Richer than "event"; implies something memorable |
| Your culture | Personal, owned, not abstract |
| Earn | Rewards feel deserved |
| Celebrate | Used intentionally, not casually |
| Connect | Human, not technical |
| Spotlight | Especially for First Nations and featured content |
| Home | Powerful metaphor for the diaspora experience |

### Vocabulary — Avoid

| Avoid | Why |
|-------|-----|
| "Diverse" / "multicultural" | Vague; often avoids naming specific communities |
| "Authentic" | Loaded and often appropriative |
| "Exotic" | Othering language — never appropriate |
| "Users" | They're members and community — not users |
| "Content" | We have events, experiences, communities — not content |
| "Seamless" | Overused tech-marketing word |
| "World-class" | Meaningless filler |
| "Leverage" / "Utilise" | Corporate jargon |
| "Diverse" / "multicultural" | Lazy; name the community specifically |

### Naming Conventions

| Item | Correct Reference |
|------|-------------------|
| The app | **CulturePass** — one word, capital C and P |
| Our audience | Members, community, people — never "users" |
| Paid tiers | Plus, Elite, Pro, Premium, VIP — title case |
| Events | Events, experiences — never "content" |
| First Nations section | First Nations Spotlight |
| The CulturePass ID | CulturePass ID (e.g., CP-12345) |

### Editorial Standards

- **Language**: Australian English — colour, honour, organise, programme (events context), favour.
- **Pronouns**: Gender-neutral by default ("they/them" when gender unknown).
- **Dates**: Day Month Year — "27 February 2026" not "February 27, 2026".
- **Currency**: AUD$ prefix in formal contexts ("AUD$12.50"); "$12.50" in UI.
- **Numbers**: Spell out one to nine; numerals from 10 upward. Always numerals for prices, counts, dates.
- **Punctuation**: Oxford comma always. Em dash (—) for parenthetical clauses — not double hyphens (--).
- **Contractions**: Use them. "You're in" not "You are confirmed."
- **Active voice**: "Your ticket is ready" not "Your ticket has been generated."
- **Sentence length**: If a sentence needs a semicolon, split it.

---

## 11. Accessibility Standards

### Contrast Ratios (WCAG AA Minimum)

| Text Type | Required Ratio | Recommended Ratio |
|-----------|---------------|-------------------|
| Normal text (< 18px) | 4.5:1 | 7:1 |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | 4.5:1 |
| UI components / graphical objects | 3:1 | — |

CulturePass theme contrast (light mode):

| Text | Background | Ratio | Status |
|------|------------|-------|--------|
| `#1B0F2E` on `#FFFFFF` | 18:1 | Pass |
| `#4A4A4A` on `#FFFFFF` | 8.2:1 | Pass |
| `#8D8D8D` on `#FFFFFF` | 3.5:1 | Pass |
| `#FFFFFF` on `#4F46E5` | 4.6:1 | Pass |

### Touch Targets

| Rule | Value |
|------|-------|
| Minimum touch target | 44 × 44pt (Apple HIG) |
| Minimum gap between adjacent targets | 8pt |
| Button height | `ButtonTokens.height.md` = 52px (exceeds minimum) |
| Input height | `InputTokens.height` = 48px (exceeds minimum) |
| Tab bar icon + label | `TabBarTokens.heightMobile` = 84px total |

### Required Attributes

Every interactive element must include:

```typescript
<Pressable
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Buy tickets for Diwali Festival"
  accessibilityHint="Opens the ticket purchase flow"
>
```

| Element | Required Attributes |
|---------|---------------------|
| Pressable/Touchable | `accessibilityRole`, `accessibilityLabel` |
| Image | `accessibilityLabel` if informational; `accessibilityRole="image"` |
| Icon-only button | `accessibilityLabel` describing the action |
| Input | `accessibilityLabel`, `accessibilityHint` |
| Toggle/Checkbox | `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` |
| Loading indicator | `accessibilityLabel="Loading"` |

### Screen Reader Support

- Ensure logical reading order — native layout order is read order; avoid `z-index` reordering tricks.
- Group related elements with `accessibilityViewIsModal` on modals.
- Announce dynamic content changes with `AccessibilityInfo.announceForAccessibility()`.
- Do not rely on colour alone to convey meaning — pair colour with text or icon.

### Reduced Motion

```typescript
import { prefersReducedMotion } from '@/constants/theme';

const duration = prefersReducedMotion ? 0 : Duration.normal;
```

All animations must respect `prefersReducedMotion`. Structural transitions (modals appearing) may retain a minimal opacity fade even with reduced motion, but spring/scale animations must be suppressed.

---

## 12. Anti-Patterns

This section defines what is explicitly forbidden. Treat each item as a linting rule.

### Color Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `backgroundColor: '#4F46E5'` in a component | `backgroundColor: CultureTokens.indigo` or `backgroundColor: colors.primary` |
| `color: '#1B0F2E'` in a component | `color: colors.text` via `useColors()` |
| Two different indigo shades in the same screen | Use only `CultureTokens.indigo` — no variants |
| Gold badge on non-premium, non-indigenous content | Use category color or teal/coral per context |
| Raw hex from any non-token source | All hex values must be traceable to a named token |
| Hardcoding dark/light hex and switching manually | Use `useColors()` — it returns the correct theme automatically |
| `CultureTokens.gold` as a general "highlight" | Gold is reserved for status and premium membership only |

#### Brand Colour Text Safety (WCAG Contrast)

Brand accent colours pass contrast on **dark** backgrounds (native) but most fail on **light** (white) backgrounds (web). The table below is law — not a suggestion.

| Colour | Token | On `#FFFFFF` (light/web) | On `#060C16` (dark/native) | Rule |
|--------|-------|--------------------------|---------------------------|------|
| Indigo | `CultureTokens.indigo` | ✅ 5.57:1 — safe as text | ❌ 3.51:1 — **icon/UI only**, not text | |
| Coral | `CultureTokens.coral` | ❌ 3.00:1 — **decoration only** | ✅ 6.51:1 — safe as text | |
| Gold | `CultureTokens.gold` | ❌ 1.54:1 — **background fill only; use white text on top** | ✅ 12.71:1 — safe as text | |
| Teal | `CultureTokens.teal` | ❌ 2.17:1 — **decoration only** | ✅ 9.02:1 — safe as text | |
| Success | `#34C759` | ❌ 2.22:1 — **icon only** | ✅ 8.82:1 — safe as text | |
| Warning | `#FF9500` | ❌ 2.21:1 — **icon/badge only** | ✅ safe | |
| Error | `#FF3B30` | ❌ 3.55:1 — large text only (≥18pt) | ✅ safe | |
| `colors.textTertiary` | `#767676` (light) / `#8D8D8D` (dark) | ✅ 4.54:1 — AA for text | ✅ 5.95:1 — AA for text | Fixed 2026-03-29 |

**Rule**: On web (light theme), use only `colors.text`, `colors.textSecondary`, `colors.textTertiary`, `CultureTokens.indigo`, or `sharedBase.secondary` (`#5856D6`) as text colours. All other brand colours must be used as backgrounds, borders, or icon fills — never as `color:` on body/caption/label text.

### Typography Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `fontSize: 16, fontFamily: 'Poppins_400Regular'` inline | Use `TextStyles.body` preset |
| `fontWeight: 'bold'` directly in a style | Use `FontFamily.bold` in `fontFamily`, weight is baked into `TextStyles` |
| Any font other than Poppins | Only Poppins variants are loaded; other fonts will fall back to system font |
| Missing desktop override on heading text | Apply `DesktopTextStyles.title` (etc.) when `isDesktop` is true |

### Spacing Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `padding: 12` (not on 4-point grid) | Use `Spacing.sm` (8) or `Spacing.md` (16) |
| `gap: 6` (not on 4-point grid) | Use `Spacing.xs` (4) or `Spacing.sm` (8) |
| `borderRadius: 8` on a button | Use `ButtonTokens.radius` (16) |
| `borderRadius: 8` on a card | Use `CardTokens.radius` (16) |
| Hardcoded `width: 375` | Use `columnWidth()` from `useLayout()` |
| `paddingHorizontal: 20` without using `hPad` | Use `hPad` from `useLayout()` |

### Layout Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `topInset = Platform.OS === 'web' ? 67 : insets.top` | `topInset = Platform.OS === 'web' ? 0 : insets.top` |
| Hardcoded sidebar width `240` | `sidebarWidth` from `useLayout()` |
| `width: Dimensions.get('window').width` | `columnWidth()` or `contentWidth` from `useLayout()` |
| No `SafeAreaView` or safe-area-inset handling on native | `useSafeAreaInsets()` + apply to padding |
| Fixed pixel widths not accounting for sidebar | Subtract `sidebarWidth` when computing content widths on desktop |

### Component Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `<Pressable><Text>Buy tickets</Text></Pressable>` | `<Button variant="primary">Buy tickets</Button>` |
| `<Image source={uri} />` from `react-native` | `<Image source={uri} />` from `expo-image` |
| Two `variant="primary"` buttons on one screen | One primary, the rest secondary or ghost |
| `StyleSheet.create()` inside the component function | `StyleSheet.create()` at module level, outside the component |
| Inline style object `style={{ backgroundColor: ... }}` with dynamic theme values | `StyleSheet.create()` + `useColors()` in component, not inline |
| `console.log(...)` in production code | `if (__DEV__) console.log(...)` |

### API & Data Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `fetch('/api/events')` directly | `api.events.list(...)` from `lib/api.ts` |
| Importing Firebase SDK in a screen | Use `lib/api.ts` and `lib/auth.tsx` typed helpers |
| `AsyncStorage` for auth tokens | `setAccessToken()` from `lib/query-client.ts` |
| `import '@sentry/react-native'` | Sentry is removed — use `console.error` + `captureRouteError()` in Cloud Functions |
| `lib/reporting.ts` for error monitoring | `lib/reporting.ts` is for user content reports (spam, harassment) — not error logging |
| `useAuth()` called outside a React component | It is a hook — only call inside a component |
| `useColors()` called outside a React component | It is a hook — only call inside a component |

### Platform Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| `BlurView` on Android without fallback | Use `glass.dark` / `glass.light` background on Android |
| SF Symbols on Android or web | `Platform.select()` with Ionicons fallback |
| `KeyboardAvoidingView behavior="padding"` on Android | `behavior="height"` on Android, `behavior="padding"` on iOS |
| `useColors()` called with hardcoded theme | The hook returns the correct theme per platform automatically |
| Touch-only interactions (long press, swipe) without web alternative | Provide tap-based equivalents on web |
| `topInset = 67` on web | `topInset = 0` on web — the old top bar is gone |

### Accessibility Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| Interactive element without `accessibilityLabel` | Add descriptive `accessibilityLabel` |
| Icon-only button with no label | Add `accessibilityLabel` describing the action |
| Colour alone conveying meaning (e.g., red = error with no text) | Pair colour with text or icon |
| Touch target smaller than 44×44pt | Increase padding or use `ButtonTokens.height.md` |
| Animation without `prefersReducedMotion` check | Guard all animations with `prefersReducedMotion` |
| `accessibilityRole` missing from `Pressable` | Always declare the role |

### Voice/Copy Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|-----------------|
| "Users" | "Members" or "community" |
| "Content" for events/experiences | "Events", "experiences", "communities" |
| "Diverse" / "multicultural" as a descriptor | Name the community specifically |
| "Authentic" to describe cultural events | Let communities define their own authenticity |
| American English spellings (color, honor, organize) | Australian English (colour, honour, organise) |
| Double hyphen (--) for em dash | Em dash (—) |
| Missing Oxford comma | Always use the Oxford comma |
| Passive voice for errors ("An error was encountered") | Active voice ("We couldn't load that") |

---

## Quick Reference — Import Cheatsheet

```typescript
// Everything from one import:
import {
  // Colors
  CultureTokens,     // Brand palette: .indigo, .coral, .gold, .teal, .purple
  CategoryColors,    // Category-specific colors
  EntityTypeColors,  // Entity type colors
  gradients,         // Gradient arrays for LinearGradient
  glass,             // Glass surface styles
  neon,              // Neon glow tokens (use sparingly)
  shadows,           // Pre-built shadow styles

  // Typography
  FontFamily,        // .regular, .medium, .semibold, .bold
  FontSize,          // .body, .title, .hero, .display, etc.
  LineHeight,        // Matching line heights
  LetterSpacing,     // .tight, .normal, .wide, .cap
  TextStyles,        // Composed presets: .body, .title, .caption, .badge, etc.
  DesktopTextStyles, // Desktop overrides: spread on isDesktop

  // Spacing & Layout
  Spacing,           // .xs(4), .sm(8), .md(16), .lg(24), .xl(32), .xxl(40), .xxxl(48)
  Radius,            // All 16px; .full = 9999
  Breakpoints,       // .tablet(768), .desktop(1024), .wide(1280)
  Layout,            // .tabBarHeight, .maxContentWidth, etc.

  // Elevation
  Elevation,         // [0]–[5] shadow levels
  ElevationAlias,    // .flat, .card, .cardRaised, .sticky, .sheet, .popover

  // Animation
  Duration,          // .instant(100), .fast(200), .normal(300), .slow(500), .stagger(60)
  SpringConfig,      // .snappy, .smooth, .bouncy, .gentle
  prefersReducedMotion,

  // Component tokens
  ButtonTokens,      // .height, .paddingH, .radius, .radiusPill, .fontSize, .iconGap
  CardTokens,        // .radius, .radiusLarge, .padding, .imageHeight
  InputTokens,       // .height, .radius, .fontSize, .paddingH, .iconSize
  ChipTokens,        // .height, .paddingH, .radius, .fontSize
  AvatarTokens,      // .size, .radius, .badgeSize
  TabBarTokens,      // .heightMobile, .heightDesktop, .iconSize, .labelSize
  HeaderTokens,      // .height, .paddingVertical, .paddingHorizontal
  SheetTokens,       // .borderRadius, .handleHeight, .headerHeight
  SectionTokens,     // .titleFontSize, .sectionSpacing, .iconSize
  IconSize,          // .xs(12), .sm(16), .md(20), .lg(24), .xl(32), .xxl(40)
  ZIndex,            // .base, .raised, .dropdown, .sticky, .overlay, .modal, .toast, .tooltip
} from '@/constants/theme';

// Theme-aware colors (hook — call inside a component only):
import { useColors } from '@/hooks/useColors';
const colors = useColors();

// Responsive layout values (hook — call inside a component only):
import { useLayout } from '@/hooks/useLayout';
const { isDesktop, numColumns, hPad, sidebarWidth, columnWidth, contentWidth } = useLayout();
```

---

*Last updated: 2026-05-08. Source files: `src/design-system/tokens/colors.ts`, `src/design-system/tokens/typography.ts`, `src/design-system/tokens/spacing.ts`, `src/design-system/tokens/elevation.ts`, `src/design-system/tokens/animations.ts`, `src/design-system/tokens/theme.ts`, `docs/brand-voice.md`, `docs/DESIGN_PRINCIPLES.md`.*
