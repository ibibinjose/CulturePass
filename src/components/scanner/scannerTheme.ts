import { Luxe } from '@/design-system/tokens/luxeHeritage';
import type { ScanMode } from './types';

/** Scan well is always dark for camera contrast and premium gate-control feel */
export const SCAN_WELL = {
  bg: '#0C0A09',
  bgElevated: '#1A1816',
  border: 'rgba(255,255,255,0.1)',
  borderActive: 'rgba(227,106,78,0.5)',
  text: '#FAFAF9',
  textMuted: 'rgba(250,250,249,0.58)',
  corner: Luxe.colors.appBlue,
  cornerAlt: Luxe.colors.gold,
  cornerDim: 'rgba(255,255,255,0.28)',
} as const;

export const SCAN_FRAME_SIZE = 248;

/** Per-mode accent — identity (indigo) vs gate tickets (app blue) */
export const SCAN_MODE_ACCENT: Record<ScanMode, string> = {
  culturepass: Luxe.colors.indigo,
  tickets: Luxe.colors.appBlue,
};

export function scanShellGradient(mode: ScanMode): [string, string, string] {
  if (mode === 'tickets') {
    return ['#221610', SCAN_WELL.bg, '#080706'];
  }
  return ['#141228', SCAN_WELL.bg, '#080706'];
}

export function scanAccentGradient(mode: ScanMode): [string, string] {
  return mode === 'tickets' ? Luxe.gradients.heritageBronze : Luxe.gradients.emeraldIndigo;
}

export function scanSubmitColor(mode: ScanMode): string {
  return mode === 'tickets' ? Luxe.colors.appBlue : Luxe.colors.indigo;
}