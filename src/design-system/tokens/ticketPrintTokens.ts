/** Ticket print view palette — fixed light/paper theme (FIXES-001 P19). */

import { CultureTokens } from './theme';

export const TICKET_PRINT = {
  text: '#1C1917',
  textSecondary: '#44403C',
  primary: CultureTokens.indigo,
  textInverse: '#FFFFFF',
  pageBg: '#F5F7FB',
  toolbarBorder: '#E1E6EF',
  surface: '#FFFFFF',
  switchTrack: '#EFF3FA',
  cardBorder: '#E6ECF5',
  rowDivider: '#EEF2F8',
  badgeHole: '#CFD6E3',
  badgeBorder: '#E0E7F2',
  badgeBrandMuted: 'rgba(255,255,255,0.8)',
} as const;