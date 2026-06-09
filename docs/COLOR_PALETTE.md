# CulturePass Color Palette (2026)

## Canonical brand colors

| Token | Value | Usage |
|-------|-------|--------|
| `BRAND_CYAN` | `#00ADEF` — rgb(0, 173, 239) | Primary accent, premium badges, `CultureTokens.gold` (legacy name) |
| `BRAND_CYAN_DEEP` | `#00A7EF` — rgb(0, 167, 239) | Secondary accent, `CultureTokens.deepSaffron` (legacy name) |
| `BRAND_CYAN_LIGHT` | `#4DD4FF` | Gradient highlights, badges |
| `JET_BLACK` | `#000000` | OLED backgrounds, premium ink |
| `JET_BLACK_SOFT` | `#0A0A0A` | Ink on bright cyan surfaces |

Source of truth: `src/design-system/tokens/brandCyanPalette.ts`

## Deprecated colors (do not use)

The following yellow, saffron, and gold hues are **removed** from the product:

- `#F5A623`, `#D4A017`, `#FFC857`, `#E5A93B`
- `#FFD54F`, `#FFB300`, `#FF9A00`, `#FCD400`, `#F59E0B`
- `#D97706`, `#EA580C`, `#EAB308`, `#D4AF37`

`npm run colors:ban:check` fails the build if any of these reappear in `src/`.

## Legacy API names

These property names remain for backward compatibility but now resolve to cyan:

- `CultureTokens.gold` → `BRAND_CYAN`
- `CultureTokens.deepSaffron` → `BRAND_CYAN_DEEP`
- `CultureTokens.heritageGold` → `BRAND_CYAN`
- `colors.gold` in `useColors()` → cyan at runtime

Prefer `BRAND_CYAN` / `BRAND_CYAN_DEEP` in new code.

## Migration notes (Jun 2026)

- Core tokens updated in `colors.ts`, `luxeHeritage.ts`, `theme.ts`
- Satellite tokens: membership card, discover badges, culture wheel, QR themes
- Plus member card gradient: cyan + jet black ink (replaces gold foil)
- Guardrail: `scripts/check-banned-colors.mjs` wired into `npm run qa:solid`