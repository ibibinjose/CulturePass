import { CultureTokens } from './theme';

/** Print / PNG export palette for QR pass HTML (FIXES-001 P3). */
export const QR_CARD_EXPORT_HTML = {
  surface: '#00ADEF',
  strip: '#0096D6',
  border: '#0096D6',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.9)',
  textMuted: 'rgba(255, 255, 255, 0.72)',
  textCaption: 'rgba(255, 255, 255, 0.72)',
  avatarFallbackBg: 'rgba(255, 255, 255, 0.18)',
  avatarFallbackText: '#FFFFFF',
  affiliationBg: 'rgba(255, 255, 255, 0.22)',
  brandCulture: '#FFFFFF',
  brandPass: '#FFFFFF',
  brandId: '#FFFFFF',
  idLabel: 'rgba(255, 255, 255, 0.88)',
  qrPad: '#FFFFFF',
  cpidText: '#0B0F19',
  btnPrimary: CultureTokens.indigo,
  btnPrimaryText: '#FFFFFF',
  btnSecondaryBg: '#F3F4F6',
  btnSecondaryText: '#374151',
} as const;