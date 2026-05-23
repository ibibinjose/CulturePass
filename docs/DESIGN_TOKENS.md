# CulturePass Design Tokens — 2026

> Last reviewed: May 8, 2026.

> **Single source of truth** for UI tokens. Always import from
> `@/design-system/tokens/theme` — never hardcode hex values in components.
>
> Runtime theme access: `import { useColors } from '@/hooks/useColors'`
>
> **Human-readable standard** (brand story, voice, navigation chrome, layout overview):
> [`docs/STYLE_GUIDE.md`](STYLE_GUIDE.md).

### Legacy vs 2026

Older documents sometimes listed **CulturePass Blue `#0066CC`** or **Ocean Teal `#2EC4B6`**. The **2026 canonical** brand anchors in code are **`CultureTokens.indigo`** (`#4F46E5`) and **`CultureTokens.teal`** (`#0D9488`). App source, Functions, shared schema, splash/social generators, and primary docs have been scrubbed to these values; Olympic “blue” in `OlympicsColors` now matches indigo for consistency.

**Flagship gradient**: **`SignatureGradient`** — violet `#9333EA` → coral `#FF5E5B` — max one per screen unless a component explicitly requires another gradient token.

---

## 1. Core Brand Tokens (`CultureTokens`)

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';
```

| Token | Hex | Role |
|---|---|---|
| `CultureTokens.indigo` | `#4F46E5` | Primary brand — trust, platform identity |
| `CultureTokens.violet` | `#9333EA` | Active states, navigation pills, community |
| `CultureTokens.coral` | `#FF5E5B` | Action energy, movement, urgency |
| `CultureTokens.gold` | `#FFC857` | Premium accent only — **not for body text** |
| `CultureTokens.teal` | `#0D9488` | Global belonging, venues, free badges |
| `CultureTokens.emerald` | `#10B981` | Growth, join, success |
| `CultureTokens.purple` | `#A855F7` | Community, creativity, secondary |

### Signature Gradient

```typescript
import { SignatureGradient } from '@/design-system/tokens/theme';
// → [CultureTokens.violet, CultureTokens.coral]
// Violet (#9333EA) → Coral (#FF5E5B) — sunset/festival feel
// Rule: max ONE per screen. Hero / onboarding / CulturePass+ only.
```

---

## 2. Semantic Color Roles (`useColors()`)

Always access at runtime — never hardcode these values.

```typescript
const colors = useColors();
```

| Role | Light | Dark | When to use |
|---|---|---|---|
| `colors.primary` | `#1C1917` (near-black) | `#FAF9F6` (warm white) | Primary text, primary CTA bg |
| `colors.text` | `#1C1917` | `#FAF9F6` | Body copy |
| `colors.textSecondary` | `#44403C` | `#A8A29E` | Supporting text, captions |
| `colors.textTertiary` | `#78716C` | `#78716C` | Placeholders, inactive nav |
| `colors.background` | `#FFFBF7` | `#0C0A09` | Page background (OLED-black on dark) |
| `colors.surface` | `#FFFDFA` | `#1C1917` | Card / modal background |
| `colors.surfaceElevated` | `#FFFBF7` | `#292524` | Lifted surface (inputs, nested cards) |
| `colors.border` | `#E7E5E4` | `#44403C` | Standard border |
| `colors.borderLight` | `#D6D3D1` | `#57534E` | Hairline dividers |
| `colors.tabBar` | `rgba(255,255,255,0.96)` | `rgba(0,0,0,0.94)` | Tab bar background base |
| `colors.tabIconSelected` | `#18181B` | `CultureTokens.violet` | Active tab icon |
| `colors.eventDate` | `#DC2626` | `#F87171` | Event date text on light cards |
| `colors.eventDateOnMedia` | `#FECACA` | `#FECACA` | Event date on dark imagery |

---

## 3. Navigation Tokens

### Bottom Tab Bar (`TabBarTokens`)

```typescript
import { TabBarTokens } from '@/design-system/tokens/theme';

TabBarTokens.heightMobile   // 84px  — native bottom bar height
TabBarTokens.heightDesktop  // 64px  — desktop sidebar item height
TabBarTokens.iconSize       // 24px  — icon base size
TabBarTokens.labelSize      // 10px  — tab label font size
```

### Active Tab Pill Pattern (v2, 2026)

The active tab in `CustomTabBar` uses a **gradient pill indicator**:

```
iconWell:       48×32px pill, overflow hidden
iconWellActive: 56×32px  (wider pill for visual balance)
gradient fill:  [CultureTokens.violet → CultureTokens.coral], horizontal
icon color:     #FFFFFF on active, colors.textTertiary on inactive
label color:    CultureTokens.violet on active, colors.textTertiary on inactive
animation:      withSpring(0.90) on pressIn → withSpring(1) on pressOut
```

### Web Sidebar (`useLayout().sidebarWidth`)

```
Desktop ≥1024px → 240px sidebar, tab bar hidden
Tablet 768–1023px → bottom tab bar, no sidebar
Mobile < 768px  → bottom tab bar, full-width
```

---

## 4. Button Tokens (`ButtonTokens`)

```typescript
import { ButtonTokens } from '@/design-system/tokens/theme';

ButtonTokens.height.md    // 52px — all sizes are equal per design spec
ButtonTokens.paddingH.md  // 20px horizontal padding
ButtonTokens.radius       // 16px — rounded rect (not pill)
ButtonTokens.radiusPill   // 9999 — fully round
ButtonTokens.fontSize.md  // 15px label
ButtonTokens.iconGap      // 8px between icon + label
```

### Button Hierarchy (one primary per screen)

```
primary    → solid colors.primary bg, textInverse label
secondary  → colors.surfaceElevated bg, colors.text label
outline    → transparent bg, colors.border stroke, colors.text label
ghost      → transparent, no border
gradient   → SignatureGradient fill (violet→coral, diagonal), white label
danger     → colors.error bg, white label
gold       → CultureTokens.gold bg, dark label (premium only)
glass      → rgba fill + rgba border, adapts to dark/light
```

### Label Style

```
fontFamily:    Poppins_600SemiBold
fontWeight:    '600'
letterSpacing: 0.15
```

---

## 5. Card Tokens (`CardTokens`, `CardGrammarTokens`)

```typescript
CardTokens.radius       // Radius.lg = 20px
CardTokens.radiusLarge  // 20px — hero cards, modals
CardTokens.padding      // 16px
CardTokens.imageHeight.mobile  // 120px
CardTokens.imageHeight.desktop // 160px

CardGrammarTokens.width          // 248px — standard card width
CardGrammarTokens.imageHeight    // 140px
CardGrammarTokens.contentPadding // 12px
```

### Event Card Text Pairing

```typescript
// ALWAYS use these — never use gold/yellow for datetime text
TextStyles.eventCardTitle  // bold, 14px, tight tracking
TextStyles.eventCardDate   // semibold, 13px, 0.15 spacing
colors.eventDate           // reddish datetime on light surfaces
colors.eventDateOnMedia    // soft rose on dark imagery
```

---

## 6. Spacing & Radius Scale

```typescript
import { Spacing, Radius } from '@/design-system/tokens/theme';

Spacing.xs   // 4px
Spacing.sm   // 8px
Spacing.md   // 16px
Spacing.lg   // 24px
Spacing.xl   // 32px

Radius.xs    // 6px  — badges, micro-pills
Radius.sm    // 10px — chips, small controls
Radius.md    // 16px — buttons, inputs (default)
Radius.lg    // 20px — event cards, rows
Radius.xl    // 24px — modals, bottom sheets
Radius.full  // 9999 — pills, avatars, circular
```

---

## 7. Header Action Buttons (Glass Pattern)

All header icon buttons (search / notifications / menu) use a glass style:

```typescript
// Applied inline in GlobalNavActions (TabHeaderChrome.tsx)
const glassStyle = {
  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  borderWidth: 1,
  borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
};
// Size: 44×44px, borderRadius: 12
```

---

## 8. Liquid Glass Tokens (`LiquidGlassTokens`)

```typescript
import { LiquidGlassTokens } from '@/design-system/tokens/theme';

// iOS: expo-glass-effect or BlurView at blurFallback.ios (56)
// Android: solid surface + elevation: 1, no blur
// Web: backdrop-filter: blur(18px) saturate(140%)

LiquidGlassTokens.corner.mainCard   // 28px — primary card corner
LiquidGlassTokens.corner.innerRow   // 18px — inner rows within glass cards
LiquidGlassTokens.parallaxFactor    // 0.14
```

---

## 9. Typography Scale

```typescript
import { TextStyles, FontSize, FontFamily } from '@/design-system/tokens/theme';

FontFamily.regular  // Poppins_400Regular
FontFamily.medium   // Poppins_500Medium
FontFamily.semibold // Poppins_600SemiBold
FontFamily.bold     // Poppins_700Bold

FontSize.tab     // 10  — tab bar labels only
FontSize.caption // 12  — timestamps, metadata
FontSize.chip    // 13  — filter chips, tags
FontSize.body2   // 14  — card body, secondary
FontSize.body    // 16  — primary reading text
FontSize.title   // 24  — screen-level headings
FontSize.hero    // 28  — hero sections
FontSize.display // 32  — landing/marketing
```

---

## 10. Z-Index Scale

```typescript
import { ZIndex } from '@/design-system/tokens/theme';

ZIndex.base      // 0
ZIndex.raised    // 10
ZIndex.dropdown  // 100
ZIndex.sticky    // 200
ZIndex.overlay   // 300
ZIndex.modal     // 400
ZIndex.toast     // 500
```

---

## Rules Summary

| Rule | Detail |
|---|---|
| No hardcoded hex | Use `CultureTokens.*` or `useColors()` |
| One primary CTA per screen | If two solids exist, one becomes secondary |
| Gold = accent only | Never for body copy, card datetime, or primary labels |
| Indigo = trust | Loyalty messaging, transactions, profile surfaces |
| Violet = active | Navigation active states, gradient pill, community |
| Coral = action | Secondary CTAs, live badges, artist features |
| Event date text | Use `colors.eventDate` + `TextStyles.eventCardDate` |
| Max 1 SignatureGradient | Hero / onboarding / CulturePass+ surfaces only |
| Web top inset = 0 | `Platform.OS === 'web' ? 0 : insets.top` — always |
