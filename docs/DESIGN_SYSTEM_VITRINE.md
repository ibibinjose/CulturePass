# Digital Vitrine — Design System (Experimental)

> Last reviewed: May 8, 2026.

This document mirrors the creative direction for the **Digital Vitrine** exploration. The live token implementation is in `constants/vitrineTheme.ts`; preview UI is at **`/design-vitrine`** (`app/design-vitrine.tsx`).

## North Star: “The Curated Ethereal”

The UI is a nearly invisible vessel for culture—substantial yet ethereal. Prefer asymmetry, tonal depth, and breathable voids over rigid boxes. **Heritage Plum** moments balance **Gallery White** expanses; glass and overlap suggest discovery.

## Palette (implemented in `Vitrine`)

| Token | Hex | Role |
|--------|-----|------|
| `primary` | `#2E0052` | Anchor — theater curtain / velvet |
| `primaryContainer` | `#4B0082` | Gradient high, emphasis |
| `secondaryContainer` | `#FCD400` | Electric Ochre — golden moments only |
| `tertiary` / `tertiaryContainer` | `#002121` / `#003838` | Patina Teal — intellectual cool |
| `background` / `surface` | `#FEF7FD` | Gallery White |
| Layering | `surfaceContainerLow` → `surfaceContainerLowest` | Section → card (no 1px dividers) |

## Rules

- **No-line sectioning:** Use `surface` vs `surfaceContainerLow` shifts, not borders.
- **Ghost border (accessibility):** `outline_variant` at ~15% opacity — see `vitrineGhostBorder()`.
- **Glass:** `glassSurface` + 16–24px blur for floating chrome (web: `backdrop-filter`).
- **CTAs:** Linear gradient `primaryContainer` → `primary` at ~135°; text `onPrimary`.
- **Typography:** **Newsreader** (display/headline), **Manrope** (title/body/label) — loaded on the preview screen via `@expo-google-fonts/*`.

## Don’ts

- No pure `#000000` for body (use `onSurface`).
- No heavy grey drop shadows (use plum-tinted soft shadows sparingly).
- Don’t overuse Electric Ochre — it is gold leaf, not base paint.

## Next steps (product)

1. Run the app and open **`/design-vitrine`**.
2. If the direction ships: add an appearance flag or segment toggle, then gradually map `useColors()` / `CultureTokens` consumers to `Vitrine` roles behind QA.
