import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/colors';

export const CP = {
  teal:       CultureTokens.teal,
  tealDark:   '#00A882', // No direct match, keep as is or add to tokens if needed
  purple:     CultureTokens.violet,
  purpleDark: '#5B21B6', // No direct match, keep as is or add to tokens if needed
  ember:      CultureTokens.coral,
  gold:       CultureTokens.gold,
  dark:       '#18181B', // Use Colors.surface or add to tokens
  darkMid:    '#F2F2F7', // No direct match, keep as is
  darkRaised: '#FFFFFF', // Use Colors.surface or add to tokens
  muted:      '#94A3B8', // Use colors.textTertiary if available
  border:     '#E5E5EA', // Use colors.border if available
  bg:         '#F2F2F7', // Use colors.background if available
  surface:    '#FFFFFF', // Use colors.surface
  text:       '#18181B', // Use colors.textInverse
  success:    CultureTokens.success,
  info:       CultureTokens.info,
} as const;

export const ACCENT_COLORS = [CP.teal, CP.purple, CP.ember, CP.gold, CP.info] as const;

export const SOCIAL_ICONS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram', color: CultureTokens.coral },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'Twitter',   color: CultureTokens.info  },
  { key: 'linkedin',  icon: 'logo-linkedin'  as const, label: 'LinkedIn',  color: CultureTokens.violet },
  { key: 'facebook',  icon: 'logo-facebook'  as const, label: 'Facebook',  color: CultureTokens.info  },
] as const;

export const TIER_CONFIG: Record<string, {
  color: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  free:    { color: CP.muted,      label: 'Standard', icon: 'shield-outline' },
  plus:    { color: CultureTokens.teal,    label: 'Plus',     icon: 'star'           },
  pro:     { color: CultureTokens.violet,  label: 'Pro',      icon: 'star'           },
  premium: { color: CultureTokens.coral,   label: 'Premium',  icon: 'diamond'        },
  vip:     { color: CultureTokens.gold,    label: 'VIP',      icon: 'diamond'        },
};

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

export function formatMemberDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}
