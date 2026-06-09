/** Saved screen stamps + overlay palette (FIXES-001 P11). */

export type RetroStampPalette = {
  text: string;
  border: string;
  bg: string;
  fill: string;
};

/** Deterministic vintage stamp color sets keyed by host name hash. */
export const RETRO_STAMP_PALETTES: readonly RetroStampPalette[] = [
  { text: '#065F46', border: '#059669', bg: '#ECFDF5', fill: '#D1FAE5' },
  { text: '#991B1B', border: '#DC2626', bg: '#FEF2F2', fill: '#FEE2E2' },
  { text: '#1E40AF', border: '#3B82F6', bg: '#EFF6FF', fill: '#DBEAFE' },
  { text: '#9D174D', border: '#EC4899', bg: '#FDF2F8', fill: '#FCE7F3' },
  { text: '#115E59', border: '#0D9488', bg: '#F0FDFA', fill: '#CCFBF1' },
  { text: '#9A3412', border: '#F97316', bg: '#FFF7ED', fill: '#FFEDD5' },
] as const;

export const SAVED_HEART_BADGE_BG = 'rgba(255, 255, 255, 0.9)' as const;