/**
 * Digital Vitrine — experimental design tokens ("Curated Ethereal").
 *
 * Not wired into the main `useColors()` path yet. Import from here or open
 * `/design-vitrine` to preview. See `docs/DESIGN_SYSTEM_VITRINE.md` for narrative.
 *
 * Rules encoded:
 *  - No 1px solid borders for sectioning (use tonal surfaces).
 *  - Ghost outlines only when needed: outline_variant @ 15% opacity.
 *  - CTAs: plum gradient; gold (Electric Ochre) reserved for high-priority moments.
 */

export const Vitrine = {
  /** Heritage Plum anchor */
  primary: '#2E0052',
  primaryContainer: '#4B0082',
  onPrimary: '#FEF7FD',

  /** Electric Ochre — use sparingly */
  secondaryContainer: '#FCD400',
  onSecondaryContainer: '#6E5C00',

  /** Patina Teal — cool counterpoint */
  tertiary: '#002121',
  tertiaryContainer: '#003838',
  onTertiaryContainer: '#E8F4F3',

  /** Gallery White field */
  background: '#FEF7FD',
  onSurface: '#1D1B1F',
  onSurfaceVariant: '#4C4451',

  /** Tonal layering (no “pop” shadows for structure) */
  surface: '#FEF7FD',
  surfaceContainerLow: '#F9F2F7',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerHigh: '#EFE8F2',

  outlineVariant: '#CEC3D3',

  /** Glass recipe (overlay / nav) */
  glassSurface: 'rgba(254, 247, 253, 0.72)',
  glassBlurWebPx: 20,

  /** Ambient float shadow — tinted plum, low opacity */
  floatShadow: '0 12px 40px rgba(46, 0, 82, 0.07)',

  radii: {
    card: 24,
    pill: 9999,
    md: 16,
  },

  space: {
    sectionGap: 40,
    blockGap: 32,
    padLg: 24,
    padMd: 16,
  },

  /** Primary CTA gradient (135°) */
  gradientPrimary: ['#4B0082', '#2E0052'] as const,

  /** Discover ambient — mist over Gallery White (2-stop linear) */
  ambientMesh: ['#2E005210', '#FEF7FD'] as const,
} as const;

export function vitrineGhostBorder(): string {
  return `${Vitrine.outlineVariant}26`;
}

export function vitrinePlumShadowSoft(): string {
  return 'rgba(46, 0, 82, 0.05)';
}
