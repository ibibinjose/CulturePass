# CulturePass Design Tokens (2026)

**Single source of truth:** `src/design-system/tokens/` — import via `@/design-system/tokens/theme`.

## Wordmark palette (canonical)

Derived from the official **CulturePass.App** wordmark in the WebSidebar header (`CulturePassWordmark`).

| Token | Hex | Wordmark | Role |
|-------|-----|----------|------|
| `CultureTokens.cultureRed` | `#f80020` | Culture | Heritage emphasis, "Culture" highlights |
| `CultureTokens.passGreen` | `#00A651` | Pass | Belonging, growth, community accents |
| `CultureTokens.appBlue` | `#009EDB` | .App | **Primary chrome** — active nav, links, focus rings, CTAs |

Low-level constants live in `brandWordmarkPalette.ts` (`BRAND_CULTURE_RED`, `BRAND_PASS_GREEN`, `BRAND_APP_BLUE`).

## Platform palette (UI)

| Token | Hex | Role |
|-------|-----|------|
| `CultureTokens.indigo` | `#4F46E5` | M3 primary, trust, platform identity |
| `CultureTokens.violet` | `#9333EA` | Active states, community rails |
| `CultureTokens.coral` | `#FF5E5B` | Movement, secondary CTA |
| `CultureTokens.teal` | `#0D9488` | Venues, global belonging |
| `BRAND_CYAN` | `#00ADEF` | Digital ID, wallet passes, premium markers |

## Signature gradient

`gradients.culturepassBrand` / `SignatureGradient`:

**Culture red → App blue** (`#f80020` → `#009EDB`)

- Max **one per screen** (hero, onboarding, flagship CTA).
- Tricolor blend: `gradients.culturalBlend` — culture red → pass green → app blue.

## Deprecated (do not use)

| Removed | Replacement |
|---------|-------------|
| Terracotta `#E36A4E` | `CultureTokens.appBlue` or `cultureRed` for warmth |
| `terracottaGlow`, `TERRACOTTA_GLOW` | `BRAND_APP_BLUE` / `CultureTokens.appBlue` |
| `terracottaBronze` gradient | `Luxe.gradients.heritageBronze` |
| `terracottaSunset` gradient | `gradients.brandSunset` |
| Gold/saffron accents `#F5A623`, `#FFC857` | `BRAND_CYAN` family |

## Import pattern

```ts
import {
  CultureTokens,
  SignatureGradient,
  gradients,
  BRAND_APP_BLUE,
  WORDMARK_COLORS,
} from '@/design-system/tokens/theme';
```

## Quality gates

- No raw hex outside `design-system/tokens/` (`npm run hex:check`).
- No `terracotta` identifiers in source (`rg terracotta src/` should be empty).