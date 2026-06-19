import { BRAND_CYAN, BRAND_CYAN_DEEP, cyanAlpha } from './brandCyanPalette';
import { appBlueAlpha } from './brandWordmarkPalette';
import { CultureTokens } from './theme';

export type QrCardTheme = {
  cardGradients: [string, string, ...string[]];
  accent: string;
  border: string;
  text: string;
  glow: string;
  chipColor: string;
  chipBorder: string;
  isDarkCard: boolean;
  bgGradient: [string, string, string];
};

/** Membership-tier visual themes for the Digital ID / QR pass screen. */
export const QR_CARD_THEMES: Record<string, QrCardTheme> = {
  free: {
    cardGradients: ['#1C1917', '#292524', '#1C1917'],
    accent: CultureTokens.appBlue,
    border: appBlueAlpha(0.25),
    text: '#F5F5F4',
    glow: appBlueAlpha(0.15),
    chipColor: '#A8A29E',
    chipBorder: '#78716C',
    isDarkCard: true,
    bgGradient: ['#0E0C0A', '#1A1714', '#0B0A09'],
  },
  plus: {
    cardGradients: ['#1E1B4B', '#311042', '#1E1B4B'],
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.4)',
    text: '#FFF0F0',
    glow: 'rgba(79, 70, 229, 0.35)',
    chipColor: '#E29578',
    chipBorder: '#B06D53',
    isDarkCard: true,
    bgGradient: ['#0D0B1E', '#1A1035', '#08060F'],
  },
  elite: {
    cardGradients: ['#09090B', '#18181B', '#09090B'],
    accent: CultureTokens.gold,
    border: cyanAlpha(0.45),
    text: '#E0F7FF',
    glow: cyanAlpha(0.25),
    chipColor: BRAND_CYAN,
    chipBorder: BRAND_CYAN_DEEP,
    isDarkCard: true,
    bgGradient: ['#070705', '#120F08', '#050504'],
  },
  pro: {
    cardGradients: ['#061F2E', '#0B3C5D', '#061F2E'],
    accent: '#00F0FF',
    border: 'rgba(0, 240, 255, 0.45)',
    text: '#E0FAFF',
    glow: 'rgba(0, 240, 255, 0.25)',
    chipColor: '#00F0FF',
    chipBorder: '#00B4D8',
    isDarkCard: true,
    bgGradient: ['#020C12', '#051C2B', '#010608'],
  },
  premium: {
    cardGradients: ['#1B1545', '#312E81', '#1B1545'],
    accent: CultureTokens.coral,
    border: 'rgba(255, 94, 91, 0.5)',
    text: '#FFF1EB',
    glow: 'rgba(255, 94, 91, 0.22)',
    chipColor: '#F2C078',
    chipBorder: '#C17E3F',
    isDarkCard: true,
    bgGradient: ['#0F0806', '#1E1109', '#080503'],
  },
  vip: {
    cardGradients: ['#0F0A02', '#1F1608', '#0F0A02'],
    accent: CultureTokens.gold,
    border: cyanAlpha(0.55),
    text: '#E0F7FF',
    glow: cyanAlpha(0.3),
    chipColor: BRAND_CYAN,
    chipBorder: BRAND_CYAN_DEEP,
    isDarkCard: true,
    bgGradient: ['#0A0700', '#1A1200', '#060400'],
  },
};

export function resolveQrCardTheme(tier: string): QrCardTheme {
  const key = (tier || 'free').toLowerCase();
  if (key in QR_CARD_THEMES) return QR_CARD_THEMES[key];
  if (key === 'premium' || key === 'plus') return QR_CARD_THEMES.plus;
  if (key === 'vip' || key === 'elite') return QR_CARD_THEMES.elite;
  return QR_CARD_THEMES.free;
}