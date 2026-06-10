import type { DigitalIdSummary } from '../../../shared/schema/digitalId';
import { db, isFirestoreConfigured } from '../admin';
import { buildWalletQrPayload, getWalletPassReadiness } from './walletPasses';

const BRAND = {
  name: 'CulturePass.App',
  domain: 'culturepass.app',
  domainDisplay: 'CulturePass.App',
  tagline: 'Belong anywhere.',
} as const;

function formatTierLabel(tier: string): string {
  const key = (tier || 'free').toLowerCase();
  if (key === 'elite') return 'Elite';
  if (key === 'vip') return 'VIP';
  if (key === 'premium') return 'Premium';
  if (key === 'plus') return 'Plus';
  if (key === 'pro') return 'Pro';
  return 'Standard';
}

function formatMemberSince(createdAt?: string): string {
  if (!createdAt) return '—';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

function buildProfileUrl(cpid: string, username: string, userId: string): string {
  const origin = getWalletPassReadiness().publicOrigin.replace(/\/$/, '');
  const cpidNorm = String(cpid ?? '').trim().toUpperCase();
  if (/^CP-[A-Z0-9]{6,}$/.test(cpidNorm)) {
    return `${origin}/cpu/${encodeURIComponent(cpidNorm)}`;
  }
  const handle = String(username ?? userId).trim();
  return `${origin}/cpu/${encodeURIComponent(handle)}`;
}

function parseFirestoreDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybe.toDate === 'function') {
      try {
        return maybe.toDate().toISOString();
      } catch {
        return undefined;
      }
    }
    if (typeof maybe._seconds === 'number') {
      return new Date(maybe._seconds * 1000).toISOString();
    }
  }
  return undefined;
}

export async function buildDigitalIdSummary(userId: string): Promise<DigitalIdSummary> {
  const readiness = getWalletPassReadiness();

  if (!isFirestoreConfigured) {
    const cpid = 'CP-000000';
    const name = 'CulturePass User';
    const username = 'user';
    const qrPayload = buildWalletQrPayload({ id: userId, culturePassId: cpid, displayName: name, username });
    return {
      userId,
      cpid,
      name,
      username,
      memberSince: '—',
      tier: 'free',
      tierLabel: 'Standard',
      profileUrl: buildProfileUrl(cpid, username, userId),
      qrPayload,
      eventQrPayload: qrPayload,
      interests: [],
      wallet: {
        apple: readiness.apple.ready,
        google: readiness.googleBusinessCard.ready,
        mockCredentials: readiness.mockCredentials,
        publicOrigin: readiness.publicOrigin,
      },
      brand: { ...BRAND },
    };
  }

  const userSnap = await db.collection('users').doc(userId).get();
  const data = userSnap.data() ?? {};

  let tier = (data.membership as { tier?: string } | undefined)?.tier
    ?? (data.tier as string | undefined)
    ?? 'free';

  try {
    const membershipSnap = await db.collection('users').doc(userId).collection('membership').doc('current').get();
    if (membershipSnap.exists) {
      const membershipData = membershipSnap.data() as { tier?: string } | undefined;
      if (membershipData?.tier) tier = membershipData.tier;
    }
  } catch {
    // optional membership subcollection
  }

  const username = String(data.username ?? userId);
  const name = String(data.displayName ?? data.name ?? username);
  const cpid = String(data.culturePassId ?? `CP-${userId}`);
  const createdAt = parseFirestoreDate(data.createdAt) ?? parseFirestoreDate(data.created_at);
  const memberSince = formatMemberSince(createdAt);
  const affiliationRaw = data.affiliation as {
    id?: string;
    name?: string;
    avatarUrl?: string | null;
    entityType?: string | null;
  } | undefined;

  const affiliation = affiliationRaw?.id && affiliationRaw?.name
    ? {
        id: affiliationRaw.id,
        name: affiliationRaw.name,
        avatarUrl: affiliationRaw.avatarUrl ?? null,
        entityType: affiliationRaw.entityType ?? null,
      }
    : null;

  const interests = Array.isArray(data.interests)
    ? (data.interests as string[]).slice(0, 8)
    : [];

  const location = [data.city, data.country].filter(Boolean).join(', ') || undefined;

  const qrPayload = buildWalletQrPayload({
    id: userId,
    culturePassId: cpid,
    displayName: name,
    username,
  });

  let upcomingTicket: DigitalIdSummary['upcomingTicket'] = null;
  try {
    const ticketsSnap = await db.collection('tickets')
      .where('userId', '==', userId)
      .limit(12)
      .get();

    const now = Date.now();
    const tickets = ticketsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));
    const sorted = tickets.sort((a, b) => {
      const da = new Date(String(a.eventDate ?? a.date ?? 0)).getTime();
      const db_ = new Date(String(b.eventDate ?? b.date ?? 0)).getTime();
      return (Number.isNaN(db_) ? 0 : db_) - (Number.isNaN(da) ? 0 : da);
    });

    const next = sorted.find((t) => {
      const raw = t.eventDate ?? t.date;
      if (!raw) return true;
      const parsed = new Date(String(raw)).getTime();
      return Number.isNaN(parsed) || parsed >= now;
    }) ?? sorted[0];

    if (next) {
      upcomingTicket = {
        id: String(next.id),
        eventTitle: next.eventTitle as string | undefined,
        eventName: next.eventName as string | undefined,
        eventDate: next.eventDate as string | undefined,
        date: next.date as string | undefined,
        eventVenue: next.eventVenue as string | undefined,
        ticketCode: (next.ticketCode ?? next.qrCode) as string | undefined,
        qrCode: next.qrCode as string | undefined,
      };
    }
  } catch {
    // tickets optional for digital ID
  }

  const eventQrPayload = upcomingTicket
    ? JSON.stringify({
        type: 'culturepass_ticket',
        ticketId: upcomingTicket.id,
        cpid,
        name,
        username,
      })
    : qrPayload;

  return {
    userId,
    cpid,
    name,
    username,
    avatarUrl: (data.avatarUrl as string | undefined) ?? null,
    memberSince,
    tier,
    tierLabel: formatTierLabel(tier),
    profileUrl: buildProfileUrl(cpid, username, userId),
    qrPayload,
    eventQrPayload,
    isVerified: Boolean(data.isVerified),
    affiliation,
    location,
    interests,
    upcomingTicket,
    wallet: {
      apple: readiness.apple.ready,
      google: readiness.googleBusinessCard.ready,
      mockCredentials: readiness.mockCredentials,
      publicOrigin: readiness.publicOrigin,
    },
    brand: { ...BRAND },
  };
}