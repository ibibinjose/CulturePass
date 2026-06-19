/**
 * Eventik → CulturePass event sync
 *
 * Imports published events from eventik.com.au (WordPress + WP Event Manager)
 * into Firestore for a linked community hub. Tickets always stay on Eventik —
 * we set `externalTicketUrl` to the event permalink and never create CP tiers.
 */

import { db } from '../admin';
import { nowIso } from '../handlers/utils';
import type { HostPage } from '../../../shared/schema/hostPage';
import { syncCommunityProfileFromHostPage } from './communityDirectory';
import type { FirestoreEvent } from './events';

const EVENT_DOC_PREFIX = 'cpass_eventik_';
const DEFAULT_BASE_URL = 'https://eventik.com.au';
const USER_AGENT = 'CulturePass-EventikSync/1.0 (+https://culturepass.app)';

/** Australian Indian Events — https://culturepass.app/community/kgG856V5ZYSwhVZfYBZR */
export const DEFAULT_EVENTIK_SYNC_CONFIG: EventikSyncConfig = {
  enabled: true,
  hostPageId: 'kgG856V5ZYSwhVZfYBZR',
  communityId: 'kgG856V5ZYSwhVZfYBZR',
  organizerId: '5tcuSl8W3pZ4ZyYrRi6TiscP30H2',
  baseUrl: DEFAULT_BASE_URL,
  /** Empty = import all published Eventik listings */
  categoryIds: [],
};

export interface EventikSyncConfig {
  enabled: boolean;
  hostPageId: string;
  communityId: string;
  organizerId: string;
  baseUrl: string;
  /** WordPress `event_listing_category` term ids; empty imports all */
  categoryIds?: number[];
}

export interface EventikSyncResult {
  fetched: number;
  upserted: number;
  pruned: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
}

interface WpEventListing {
  id: number;
  slug: string;
  link: string;
  status: string;
  title: { rendered: string };
  event_listing_category?: number[];
  modified: string;
}

interface WpemTicket {
  ticket_name?: string;
  ticket_price?: string;
  sale_price?: string;
}

interface WpemEventDetail {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  description: string;
  /** WPEM returns a URL string or an array of banner URLs depending on the event */
  images?: string | string[] | unknown;
  date_modified?: string;
  event_categories?: { name: string; slug: string }[];
  event_types?: { name: string; slug: string }[];
  meta_data?: Record<string, unknown>;
}

function integrationsCol() {
  return db.collection('integrations');
}

function eventsCol() {
  return db.collection('events');
}

export function eventikFirestoreId(eventikId: number | string): string {
  return `${EVENT_DOC_PREFIX}${eventikId}`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseEventikDateTime(raw: string | undefined): { date: string; time: string } {
  if (!raw?.trim()) {
    const today = new Date().toISOString().split('T')[0];
    return { date: today, time: '00:00' };
  }
  const normalized = raw.trim().replace('T', ' ');
  const [datePart, timePart] = normalized.split(/\s+/);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : new Date().toISOString().split('T')[0];
  let time = '00:00';
  if (timePart) {
    const m = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      time = `${m[1].padStart(2, '0')}:${m[2]}`;
    }
  }
  return { date, time };
}

/** Eventik/WPEM banner — string URL, array of URLs, or `_event_banner` in meta. */
export function resolveEventikImageUrl(
  images: unknown,
  meta?: Record<string, unknown>,
): string | undefined {
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (trimmed.startsWith('http')) return trimmed;
  }

  if (Array.isArray(images)) {
    for (const item of images) {
      const resolved = resolveEventikImageUrl(item, meta);
      if (resolved) return resolved;
    }
  }

  const banner = meta?._event_banner;
  if (Array.isArray(banner)) {
    for (const item of banner) {
      if (typeof item === 'string' && item.trim().startsWith('http')) {
        return item.trim();
      }
    }
  }
  if (typeof banner === 'string' && banner.trim().startsWith('http')) {
    return banner.trim();
  }

  return undefined;
}

function parsePriceCents(tickets: WpemTicket[] | undefined): { priceCents: number; priceLabel: string; isFree: boolean } {
  const prices: number[] = [];
  for (const t of tickets ?? []) {
    const raw = (t.sale_price?.trim() || t.ticket_price?.trim() || '').replace(/[^0-9.]/g, '');
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) prices.push(Math.round(n * 100));
  }
  if (prices.length === 0) {
    return { priceCents: 0, priceLabel: 'See Eventik', isFree: true };
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const label = min === max ? `$${(min / 100).toFixed(min % 100 === 0 ? 0 : 2)}` : `From $${(min / 100).toFixed(min % 100 === 0 ? 0 : 2)}`;
  return { priceCents: min, priceLabel: label, isFree: min === 0 };
}

export function mapEventikDetailToFirestore(
  detail: WpemEventDetail,
  config: EventikSyncConfig,
  now: string,
): FirestoreEvent | null {
  if (detail.status !== 'publish') return null;

  const meta = detail.meta_data ?? {};
  const start = parseEventikDateTime(String(meta._event_start_date ?? ''));
  const end = parseEventikDateTime(String(meta._event_end_date ?? ''));
  const paidTickets = (meta._paid_tickets as WpemTicket[] | undefined) ?? [];
  const freeTickets = (meta._free_tickets as WpemTicket[] | undefined) ?? [];
  const pricing = parsePriceCents(paidTickets);
  const hasPaid = paidTickets.length > 0;
  const ticketOptions = String(meta._event_ticket_options ?? '');
  const isFreeOnly = !hasPaid && (freeTickets.length > 0 || ticketOptions === 'free');

  const categories = (detail.event_categories ?? []).map((c) => c.name).filter(Boolean);
  const types = (detail.event_types ?? []).map((t) => t.name).filter(Boolean);
  const city = String(meta.geolocation_city ?? '').trim() || 'Australia';
  const state = String(meta.geolocation_state_short ?? meta.geolocation_state_long ?? '').trim() || undefined;
  const latRaw = meta.geolocation_lat;
  const lngRaw = meta.geolocation_long;
  const latitude = latRaw != null && latRaw !== '' ? Number(latRaw) : undefined;
  const longitude = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : undefined;

  const docId = eventikFirestoreId(detail.id);
  const description = stripHtml(detail.description || String(meta._event_description ?? ''));
  const title = detail.name?.trim() || 'Untitled event';
  const venue = String(meta._event_location ?? city).trim() || city;
  const externalTicketUrl = detail.permalink?.trim() || `${config.baseUrl}/event/${detail.slug}/`;
  const coverImageUrl = resolveEventikImageUrl(detail.images, meta);

  return {
    id: docId,
    title,
    description: description || `${title} — tickets on Eventik.`,
    communityId: config.communityId,
    publisherProfileId: config.communityId,
    organizerId: config.organizerId,
    venue,
    address: String(meta.geolocation_formatted_address ?? '').trim() || undefined,
    date: start.date,
    time: start.time,
    endDate: end.date !== start.date ? end.date : null,
    endTime: end.time !== '00:00' ? end.time : null,
    city,
    state,
    postcode: meta.geolocation_postcode ? Number(meta.geolocation_postcode) : undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    country: String(meta.geolocation_country_long ?? 'Australia').trim() || 'Australia',
    imageUrl: coverImageUrl,
    heroImageUrl: coverImageUrl ?? null,
    cultureTag: ['Indian', 'South Asian'],
    cultureTags: ['Indian', 'South Asian'],
    tags: ['eventik', ...categories, ...types],
    category: categories[0] ?? types[0] ?? 'Community & Culture',
    eventType: types[0],
    isFree: isFreeOnly || pricing.isFree,
    priceCents: pricing.priceCents,
    priceLabel: pricing.priceLabel,
    entryType: isFreeOnly ? 'free_open' : 'ticketed',
    externalTicketUrl,
    locationType: String(meta._event_online) === 'yes' ? 'virtual' : 'physical',
    sourceSystem: 'eventik',
    status: 'published',
    metadata: {
      eventikId: detail.id,
      eventikSlug: detail.slug,
      sourceUrl: externalTicketUrl,
      hostPageId: config.hostPageId,
      externalTicketingOnly: true,
      ticketProvider: 'eventik',
      eventikCategories: categories,
      eventikTypes: types,
      eventikModified: detail.date_modified,
      syncedAt: now,
    },
    tiers: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchEventikListings(baseUrl: string, categoryIds: number[] = []): Promise<WpEventListing[]> {
  const params = new URLSearchParams({ per_page: '100', status: 'publish', _fields: 'id,slug,link,status,title,event_listing_category,modified' });
  const listings = await fetchJson<WpEventListing[]>(`${baseUrl}/wp-json/wp/v2/event_listing?${params}`);

  if (!categoryIds.length) return listings;

  const allowed = new Set(categoryIds);
  return listings.filter((item) => (item.event_listing_category ?? []).some((id) => allowed.has(id)));
}

export async function fetchEventikEventDetail(baseUrl: string, eventId: number): Promise<WpemEventDetail | null> {
  const payload = await fetchJson<{
    data?: { events?: { data?: WpemEventDetail } };
  }>(`${baseUrl}/wp-json/wpem/events/${eventId}`);

  const detail = payload?.data?.events?.data;
  return detail ?? null;
}

export async function loadEventikSyncConfig(): Promise<EventikSyncConfig> {
  try {
    const snap = await integrationsCol().doc('eventik').get();
    if (!snap.exists) return DEFAULT_EVENTIK_SYNC_CONFIG;
    const data = snap.data() as Partial<EventikSyncConfig>;
    return {
      ...DEFAULT_EVENTIK_SYNC_CONFIG,
      ...data,
      categoryIds: data.categoryIds ?? DEFAULT_EVENTIK_SYNC_CONFIG.categoryIds,
    };
  } catch {
    return DEFAULT_EVENTIK_SYNC_CONFIG;
  }
}

async function resolveCommunityId(config: EventikSyncConfig): Promise<string> {
  const pageSnap = await db.collection('hostPages').doc(config.hostPageId).get();
  if (pageSnap.exists) {
    const page = { ...(pageSnap.data() as HostPage), id: pageSnap.id };
    if (page.entityType === 'community') {
      const profile = await syncCommunityProfileFromHostPage(page);
      return profile.id;
    }
  }
  return config.communityId;
}

export async function syncEventikEvents(
  inputConfig?: Partial<EventikSyncConfig>,
): Promise<EventikSyncResult> {
  const config: EventikSyncConfig = {
    ...(await loadEventikSyncConfig()),
    ...inputConfig,
  };

  const result: EventikSyncResult = {
    fetched: 0,
    upserted: 0,
    pruned: 0,
    skipped: 0,
    errors: [],
    syncedAt: nowIso(),
  };

  if (!config.enabled) {
    result.errors.push('Eventik sync disabled in config');
    return result;
  }

  const communityId = await resolveCommunityId(config);
  config.communityId = communityId;

  const listings = await fetchEventikListings(config.baseUrl, config.categoryIds ?? []);
  result.fetched = listings.length;

  const activeDocIds = new Set<string>();
  const now = result.syncedAt;

  const CONCURRENCY = 5;
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const chunk = listings.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (listing) => {
        try {
          const detail = await fetchEventikEventDetail(config.baseUrl, listing.id);
          if (!detail) {
            result.skipped += 1;
            return;
          }
          const mapped = mapEventikDetailToFirestore(detail, config, now);
          if (!mapped) {
            result.skipped += 1;
            return;
          }

          const existing = await eventsCol().doc(mapped.id).get();
          if (existing.exists) {
            mapped.createdAt = (existing.data()?.createdAt as string) ?? now;
          }

          await eventsCol().doc(mapped.id).set(
            { ...mapped, tiers: [], externalTicketUrl: mapped.externalTicketUrl },
            { merge: true },
          );
          activeDocIds.add(mapped.id);
          result.upserted += 1;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`event ${listing.id}: ${msg}`);
        }
      }),
    );
  }

  // Soft-delete Eventik events for this community that are no longer on Eventik
  const staleSnap = await eventsCol()
    .where('communityId', '==', communityId)
    .where('sourceSystem', '==', 'eventik')
    .get();

  const batch = db.batch();
  let pruneCount = 0;
  for (const doc of staleSnap.docs) {
    if (!activeDocIds.has(doc.id) && doc.data().status !== 'deleted') {
      batch.update(doc.ref, { status: 'deleted', updatedAt: now, 'metadata.prunedAt': now });
      pruneCount += 1;
    }
  }
  if (pruneCount > 0) {
    await batch.commit();
  }
  result.pruned = pruneCount;

  await integrationsCol().doc('eventik').set(
    {
      ...config,
      lastSyncAt: now,
      lastSyncResult: {
        fetched: result.fetched,
        upserted: result.upserted,
        pruned: result.pruned,
        skipped: result.skipped,
        errorCount: result.errors.length,
      },
    },
    { merge: true },
  );

  return result;
}