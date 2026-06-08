import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { TicketScanResult, SessionStats, CulturePassContact } from './types';

export const INITIAL_STATS: SessionStats = {
  accepted: 0,
  duplicates: 0,
  rejected: 0,
  startedAt: new Date(),
};

export const OUTCOME_CONFIG = {
  accepted: {
    color: Luxe.colors.emerald,
    bg: Luxe.colors.emerald + '18',
    icon: 'checkmark-circle' as const,
    title: 'Ticket Valid',
  },
  duplicate: {
    color: Luxe.colors.gold,
    bg: Luxe.colors.gold + '18',
    icon: 'warning' as const,
    title: 'Already Scanned',
  },
  rejected: {
    color: Luxe.colors.terracotta,
    bg: Luxe.colors.terracotta + '18',
    icon: 'close-circle' as const,
    title: 'Invalid Ticket',
  },
};

export function getOutcomeConfig(result: TicketScanResult) {
  if (result.valid) return OUTCOME_CONFIG.accepted;
  const msg = result.message.toLowerCase();
  if (msg.includes('used') || msg.includes('duplicate') || msg.includes('already')) return OUTCOME_CONFIG.duplicate;
  return OUTCOME_CONFIG.rejected;
}

export function parseVCard(data: string): CulturePassContact | null {
  const lines = data.split(/\r?\n/);
  let name = '', org = '', cpid = '';
  for (const line of lines) {
    if (line.startsWith('FN:')) name = line.substring(3).trim();
    else if (line.startsWith('ORG:')) org = line.substring(4).trim();
    else if (line.startsWith('NOTE:')) {
      const m = line.substring(5).trim().match(/CP-\w+/);
      if (m) cpid = m[0];
    }
  }
  if (!name && !cpid) return null;
  return { cpid: cpid || 'Unknown', name: name || 'Unknown', org };
}

export function parseCulturePassInput(input: string): CulturePassContact | null {
  const t = input.trim();

  // Check if input is a URL containing a CPID (e.g. http://localhost:8081/cpu/CP-U58B35B)
  const urlMatch = t.match(/(?:cpu|user|profile)\/(CP-[A-Z0-9]+)/i);
  if (urlMatch) {
    return { cpid: urlMatch[1].toUpperCase(), name: '' };
  }

  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      if (j.type === 'culturepass_id') {
        return { cpid: j.cpid || j.id || '', name: j.name || j.displayName || '', username: j.username || '', tier: j.tier || 'free' };
      }
    } catch {}
  }
  if (t.startsWith('BEGIN:VCARD')) return parseVCard(t);
  if (/^CP-\w+$/i.test(t)) return { cpid: t.toUpperCase(), name: '' };
  return null;
}
