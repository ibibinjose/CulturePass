/** Web top bar chrome — dark header gradient, CTA, menu overlays (FIXES-001 P20). */

import { BorderTokens, CultureTokens } from './theme';

export const WEB_TOP_BAR_DARK_GRADIENT = ['#0A0A1A', '#0D1033'] as const;

export const WEB_TOP_BAR_SIGN_IN_GRADIENT = [
  CultureTokens.indigo,
  '#3D4FCC',
] as const;

export const WEB_TOP_BAR = {
  onAccent: BorderTokens.white,
  shadow: BorderTokens.black,
  tabTextMuted: 'rgba(255,255,255,0.55)',
  avatarBtnBg: 'rgba(255,255,255,0.1)',
  avatarBtnBgHover: 'rgba(255,255,255,0.15)',
  tabHoverBg: 'rgba(255,255,255,0.07)',
  iconBtnHoverBg: 'rgba(255,255,255,0.1)',
  menuBackdrop: 'rgba(0,0,0,0.6)',
  menuUserEmail: 'rgba(255,255,255,0.6)',
  menuCloseBg: 'rgba(255,255,255,0.08)',
  chevronMuted: 'rgba(255,255,255,0.5)',
} as const;