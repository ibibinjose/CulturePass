/** Account settings screen — auth provider chips, flash banners (FIXES-001 P22). */

import { BRAND_CYAN_DEEP, JET_BLACK } from './brandCyanPalette';
import { CultureTokens } from './theme';

export const SETTINGS_ACCOUNT = {
  modalBackdrop: 'rgba(0,0,0,0.7)',
  modalBackdropDelete: 'rgba(0,0,0,0.8)',
  pulseGlow: BRAND_CYAN_DEEP,
  dividerHairline: 'rgba(0,0,0,0.06)',
  glassBgDark: 'rgba(255, 255, 255, 0.06)',
  glassBgLight: 'rgba(0, 0, 0, 0.03)',
} as const;

export const AUTH_PROVIDER_GOOGLE = {
  icon: '#EA4335',
  textDark: '#FF8F87',
  textLight: '#C5221F',
  bgDark: 'rgba(234, 67, 53, 0.08)',
  bgLight: 'rgba(234, 67, 53, 0.05)',
  border: 'rgba(234, 67, 53, 0.25)',
} as const;

export const AUTH_PROVIDER_APPLE = {
  iconDark: '#FFFFFF',
  iconLight: JET_BLACK,
  textDark: '#FFFFFF',
  textLight: JET_BLACK,
  bgDark: 'rgba(255, 255, 255, 0.08)',
  bgLight: 'rgba(0, 0, 0, 0.05)',
  borderDark: 'rgba(255, 255, 255, 0.25)',
  borderLight: 'rgba(0, 0, 0, 0.2)',
} as const;

export const AUTH_PROVIDER_DEFAULT = {
  icon: CultureTokens.richIndigo,
  textDark: '#AEC0FF',
  textLight: '#3F51B5',
  bgDark: 'rgba(74, 94, 191, 0.08)',
  bgLight: 'rgba(74, 94, 191, 0.05)',
  border: 'rgba(74, 94, 191, 0.25)',
} as const;

export const ACCOUNT_FLASH = {
  successBorder: '#10B98155',
  successIcon: '#10B981',
  errorBorder: '#FF5E5B55',
  errorIcon: CultureTokens.coral,
} as const;