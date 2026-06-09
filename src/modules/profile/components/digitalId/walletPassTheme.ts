/** Shared CulturePass wallet pass design — keep in sync with functions walletPasses.ts */
export const WALLET_PASS_THEME = {
  cyanRgb: 'rgb(0, 173, 239)',
  cyanHex: '#00ADEF',
  cyanDarkHex: '#0096D6',
  cyanDeepHex: '#007BB5',
  whiteRgb: 'rgb(255, 255, 255)',
  whiteHex: '#FFFFFF',
  nameOnCyan: '#FFFFFF',
  labelOnCyan: 'rgba(255, 255, 255, 0.88)',
  subtextOnCyan: 'rgba(255, 255, 255, 0.92)',
  mutedOnCyan: 'rgba(255, 255, 255, 0.72)',
  darkText: '#0B0F19',
  mutedText: '#4B5563',
  subtleText: '#9CA3AF',
  borderOnWhite: '#E5E7EB',
  borderOnCyan: 'rgba(255, 255, 255, 0.22)',
  qrPad: '#FFFFFF',
  passRevision: '2026-06-09-v9',
  lanyardHeight: 448,
} as const;

export function formatWalletDisplayName(name: string, fallback = 'CulturePass Member'): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function formatWalletMemberSince(createdAt?: string | Date | null): string {
  if (!createdAt) return '—';
  const parsed = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

export function walletPassInitials(name: string, fallback = 'U'): string {
  const source = name.trim() || fallback;
  return source.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}