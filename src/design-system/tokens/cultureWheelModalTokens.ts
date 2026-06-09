import { BorderTokens } from './theme';

/** CultureWheel slice fills keyed by category id (FIXES-001 P12). */
export const CULTURE_WHEEL_SLICE_COLORS = {
  hubs: '#3F51B5',
  events: '#00A7EF',
  art: '#E0A96D',
  movies: '#9575CD',
  dining: '#E25B45',
  activities: '#4CAF50',
  classes: '#FF7043',
  travel: '#00BCD4',
  shopping: '#2EC4B6',
  offers: '#00ADEF',
  directory: '#8BC34A',
  indigenous: '#795548',
} as const;

/** Modal chrome, wheel rim, and surface overlays. */
export const CULTURE_WHEEL_MODAL = {
  inkOnSlice: BorderTokens.white,
  pointerStroke: BorderTokens.white,
  rimFillLight: BorderTokens.white,
  rimFillDark: '#2D2D35',
  rimStrokeDark: 'rgba(255,255,255,0.06)',
  rimStrokeLight: 'rgba(0,0,0,0.04)',
  centerPinFill: '#1E1E24',
  centerPinStroke: BorderTokens.white,
  spinGradient: ['#E0A96D', '#FF7043', '#7E57C2'] as const,
  spinButtonShadow: 'rgba(226, 91, 69, 0.35)',
  backdrop: 'rgba(10, 10, 12, 0.65)',
  sheetFillDark: 'rgba(20, 20, 25, 0.88)',
  sheetFillLight: 'rgba(255, 255, 255, 0.94)',
  sheetHeaderDivider: 'rgba(255,255,255,0.08)',
  resultCardDark: 'rgba(30, 30, 40, 0.45)',
  resultCardLight: 'rgba(245, 245, 250, 0.7)',
  recCardDark: 'rgba(255,255,255,0.03)',
  recCardLight: BorderTokens.white,
  shadow: BorderTokens.black,
} as const;