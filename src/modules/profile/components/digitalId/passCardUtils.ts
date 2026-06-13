import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

/** Fixed palettes for Digital ID pass cards. */
export type PassSurfaceColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  border: string;
  avatarFallbackBg: string;
  tierLabel: string;
};

export type PassColorVariant = 'cyan' | 'white' | 'black';

export type PassIdRowVariant = 'onCyan' | 'onWhite' | 'onBlack';

export type PassColorTheme = PassSurfaceColors & {
  variant: PassColorVariant;
  bodyBg: string;
  bodyBorder: string;
  stripStart: string;
  stripEnd: string;
  stripText: string;
  stripTierBadgeBg: string;
  stripTierBadgeBorder: string;
  stripSeparator: string;
  idRowVariant: PassIdRowVariant;
  qrBorder: string;
  shellShadowWeb: string;
  shellShadowNative: { color: string; opacity: number; radius: number; offsetY: number };
};

export const PASS_COLOR_OPTIONS: { key: PassColorVariant; label: string; swatch: string; border: string }[] = [
  { key: 'cyan', label: 'Cyan', swatch: WALLET_PASS_THEME.cyanHex, border: WALLET_PASS_THEME.cyanDarkHex },
  { key: 'white', label: 'White', swatch: WALLET_PASS_THEME.whiteHex, border: WALLET_PASS_THEME.borderOnWhite },
  { key: 'black', label: 'Black', swatch: '#0B0F19', border: '#374151' },
];

export const PASS_TYPE_LABELS = {
  business: {
    title: 'Business Pass',
    subtitle: 'Landscape layout · Quick check-in & sharing',
    icon: 'id-card-outline' as const,
  },
  lanyard: {
    title: 'Lanyard Pass',
    subtitle: 'Vertical layout · Wallet & venue entry',
    icon: 'ribbon-outline' as const,
  },
  event: {
    title: 'Event Ticket Pass',
    subtitle: 'Admission for your next cultural event',
    icon: 'ticket-outline' as const,
  },
};

const CYAN_THEME: PassColorTheme = {
  variant: 'cyan',
  primary: WALLET_PASS_THEME.nameOnCyan,
  secondary: WALLET_PASS_THEME.subtextOnCyan,
  tertiary: WALLET_PASS_THEME.mutedOnCyan,
  border: WALLET_PASS_THEME.borderOnCyan,
  avatarFallbackBg: 'rgba(255, 255, 255, 0.18)',
  tierLabel: 'rgba(255, 255, 255, 0.88)',
  bodyBg: WALLET_PASS_THEME.cyanHex,
  bodyBorder: WALLET_PASS_THEME.cyanDarkHex,
  stripStart: WALLET_PASS_THEME.cyanDarkHex,
  stripEnd: WALLET_PASS_THEME.cyanDeepHex,
  stripText: WALLET_PASS_THEME.nameOnCyan,
  stripTierBadgeBg: 'rgba(255, 255, 255, 0.14)',
  stripTierBadgeBorder: 'rgba(255, 255, 255, 0.22)',
  stripSeparator: 'rgba(255, 255, 255, 0.12)',
  idRowVariant: 'onCyan',
  qrBorder: WALLET_PASS_THEME.borderOnCyan,
  shellShadowWeb: '0 10px 28px rgba(0, 173, 239, 0.38)',
  shellShadowNative: { color: WALLET_PASS_THEME.cyanHex, opacity: 0.35, radius: 12, offsetY: 6 },
};

const WHITE_THEME: PassColorTheme = {
  variant: 'white',
  primary: WALLET_PASS_THEME.darkText,
  secondary: WALLET_PASS_THEME.mutedText,
  tertiary: WALLET_PASS_THEME.subtleText,
  border: WALLET_PASS_THEME.borderOnWhite,
  avatarFallbackBg: '#F3F4F6',
  tierLabel: WALLET_PASS_THEME.cyanHex,
  bodyBg: WALLET_PASS_THEME.whiteHex,
  bodyBorder: WALLET_PASS_THEME.borderOnWhite,
  stripStart: WALLET_PASS_THEME.cyanDarkHex,
  stripEnd: WALLET_PASS_THEME.cyanDeepHex,
  stripText: WALLET_PASS_THEME.nameOnCyan,
  stripTierBadgeBg: 'rgba(255, 255, 255, 0.14)',
  stripTierBadgeBorder: 'rgba(255, 255, 255, 0.22)',
  stripSeparator: 'rgba(255, 255, 255, 0.12)',
  idRowVariant: 'onWhite',
  qrBorder: WALLET_PASS_THEME.borderOnWhite,
  shellShadowWeb: '0 4px 16px rgba(15, 23, 42, 0.08)',
  shellShadowNative: { color: '#0F172A', opacity: 0.08, radius: 10, offsetY: 4 },
};

const BLACK_THEME: PassColorTheme = {
  variant: 'black',
  primary: WALLET_PASS_THEME.nameOnCyan,
  secondary: 'rgba(255, 255, 255, 0.9)',
  tertiary: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.18)',
  avatarFallbackBg: 'rgba(255, 255, 255, 0.12)',
  tierLabel: 'rgba(255, 255, 255, 0.88)',
  bodyBg: '#0B0F19',
  bodyBorder: '#374151',
  stripStart: '#374151',
  stripEnd: '#111827',
  stripText: WALLET_PASS_THEME.nameOnCyan,
  stripTierBadgeBg: 'rgba(255, 255, 255, 0.1)',
  stripTierBadgeBorder: 'rgba(255, 255, 255, 0.2)',
  stripSeparator: 'rgba(255, 255, 255, 0.1)',
  idRowVariant: 'onBlack',
  qrBorder: 'rgba(255, 255, 255, 0.22)',
  shellShadowWeb: '0 10px 28px rgba(0, 0, 0, 0.45)',
  shellShadowNative: { color: '#000000', opacity: 0.4, radius: 12, offsetY: 6 },
};

const THEMES: Record<PassColorVariant, PassColorTheme> = {
  cyan: CYAN_THEME,
  white: WHITE_THEME,
  black: BLACK_THEME,
};

export function getPassColorTheme(variant: PassColorVariant = 'cyan', tier?: string): PassColorTheme {
  if (variant === 'cyan' && tier) {
    const key = tier.toLowerCase();
    if (key === 'elite' || key === 'vip') {
      return {
        ...CYAN_THEME,
        variant: 'cyan',
        bodyBg: '#0F0A02',
        bodyBorder: '#00ADEF',
        stripStart: '#1F1608',
        stripEnd: '#0F0A02',
        primary: '#E0F7FF',
        secondary: 'rgba(255,255,255,0.88)',
        tertiary: 'rgba(255,255,255,0.72)',
        tierLabel: '#00ADEF',
        qrBorder: '#00ADEF',
        shellShadowWeb: '0 10px 28px rgba(0, 173, 239, 0.35)',
      };
    }
    if (key === 'pro') {
      return {
        ...CYAN_THEME,
        variant: 'cyan',
        bodyBg: '#061F2E',
        bodyBorder: '#00F0FF',
        stripStart: '#0B3C5D',
        stripEnd: '#061F2E',
        primary: '#E0FAFF',
        secondary: 'rgba(255,255,255,0.88)',
        tertiary: 'rgba(255,255,255,0.72)',
        tierLabel: '#00F0FF',
        qrBorder: '#00F0FF',
        shellShadowWeb: '0 10px 28px rgba(0, 240, 255, 0.35)',
      };
    }
    if (key === 'premium' || key === 'plus') {
      return {
        ...CYAN_THEME,
        variant: 'cyan',
        bodyBg: '#1B1545',
        bodyBorder: '#FF5E5B',
        stripStart: '#312E81',
        stripEnd: '#1B1545',
        primary: '#F5F3FF',
        secondary: 'rgba(255,255,255,0.88)',
        tertiary: 'rgba(255,255,255,0.72)',
        tierLabel: '#FF5E5B',
        qrBorder: '#FF5E5B',
        shellShadowWeb: '0 10px 28px rgba(79, 70, 229, 0.35)',
      };
    }
  }
  return THEMES[variant] ?? CYAN_THEME;
}

/** @deprecated Use getPassColorTheme(variant) for full theme; defaults to cyan. */
export function getPassSurfaceColors(variant: PassColorVariant = 'cyan'): PassSurfaceColors {
  const theme = getPassColorTheme(variant);
  return {
    primary: theme.primary,
    secondary: theme.secondary,
    tertiary: theme.tertiary,
    border: theme.border,
    avatarFallbackBg: theme.avatarFallbackBg,
    tierLabel: theme.tierLabel,
  };
}