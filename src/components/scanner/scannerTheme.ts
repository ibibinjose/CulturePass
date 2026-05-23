import { CultureTokens } from '@/design-system/tokens/theme';

/** Scan well is always dark for camera contrast and premium gate-control feel */
export const SCAN_WELL = {
  bg: '#0C0A09',
  bgElevated: '#1C1917',
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(147,51,234,0.55)',
  text: '#FAFAF9',
  textMuted: 'rgba(250,250,249,0.55)',
  corner: CultureTokens.violet,
  cornerDim: 'rgba(255,255,255,0.35)',
} as const;

export const SCAN_FRAME_SIZE = 248;
