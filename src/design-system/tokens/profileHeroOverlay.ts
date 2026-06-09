import { BorderTokens } from './theme';

/** Text-on-media overlay palette for public entity/profile heroes (FIXES-001 P5). */
export const PROFILE_HERO_OVERLAY = {
  textPrimary: BorderTokens.white,
  textSecondary: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.8)',
  roleBadgeBg: 'rgba(255,255,255,0.18)',
  roleBadgeBgStrong: 'rgba(255,255,255,0.2)',
  avatarRing: 'rgba(255,255,255,0.1)',
  verifyPillBg: 'rgba(0,0,0,0.45)',
  heroScrim: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)'] as const,
  mediaPlaceholder: '#ECECF3',
} as const;