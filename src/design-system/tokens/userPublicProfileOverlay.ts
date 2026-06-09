import { BRAND_CYAN, cyanAlpha } from './brandCyanPalette';
import { BorderTokens } from './theme';

/** Public /user and /cpu profile screen palette (FIXES-001 P8). */
export const USER_PUBLIC_PROFILE = {
  heroBanner: '#00ADEF',
  pageBgLight: '#F8F5F0',
  surfaceWarm: '#F4F1E9',
  surfaceSubtle: '#F3F4F6',
  surfaceBorder: '#E5E7EB',
  surfaceBorderWarm: '#E8E3D9',
  ink: '#0B0F19',
  inkSecondary: '#4B5563',
  inkTertiary: '#78716C',
  inkMuted: '#9CA3AF',
  verified: '#10B981',
  copySuccess: '#30D158',
  whatsapp: '#25D366',
  facetime: '#007AFF',
  brandCulture: '#FF3B30',
  brandPass: '#34C759',
  brandId: '#009CDE',
  cpidGold: BRAND_CYAN,
  cpidGoldMuted: cyanAlpha(0.12),
  cpidLabelBlue: '#A8C5FF',
  cpidMetaBlue: '#B8C9E8',
  onHero: BorderTokens.white,
  onFill: BorderTokens.white,
  qrForeground: BorderTokens.black,
  qrBackground: BorderTokens.white,
  shadow: BorderTokens.black,
} as const;