/** Fixed palettes for Digital ID pass cards. */
export type PassSurfaceColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  border: string;
  avatarFallbackBg: string;
  tierLabel: string;
  bodyBg: string;
  stripBg: string;
};

const CYAN_PASS_SURFACE: PassSurfaceColors = {
  primary: '#FFFFFF',
  secondary: 'rgba(255, 255, 255, 0.9)',
  tertiary: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.28)',
  avatarFallbackBg: 'rgba(255, 255, 255, 0.18)',
  tierLabel: 'rgba(255, 255, 255, 0.88)',
  bodyBg: '#00ADEF',
  stripBg: '#0096D6',
};

export function getPassSurfaceColors(): PassSurfaceColors {
  return CYAN_PASS_SURFACE;
}