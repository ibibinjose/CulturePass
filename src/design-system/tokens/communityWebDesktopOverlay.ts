import { BorderTokens } from './theme';

/** Desktop community hub page palette (FIXES-001 P10). */
export const COMMUNITY_WEB_DESKTOP = {
  inkOnLight: '#0B1530',
  pageGradientDarkStart: '#030711',
  pageGradientDarkMid: '#0c1a32',
  pageGradientLightStart: '#FFFBF7',
  pageGradientLightEnd: '#F5F5F4',
  ctaHover: '#ff7a77',
  memberAvatarPlaceholder: '#e8e8e8',
  onHero: BorderTokens.white,
  shadow: BorderTokens.black,
  heroScrim: ['rgba(0,51,102,0.88)', 'rgba(46,196,182,0.28)', 'rgba(124,58,237,0.2)'] as const,
} as const;