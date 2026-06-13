/**
 * Eventbrite Australia → CulturePass event sync
 *
 * Imports live public listings from eventbrite.com.au into the Australian Event Finder
 * community hub. Tickets always stay on Eventbrite — we set `externalTicketUrl` to the
 * Eventbrite event URL and never create CulturePass tiers or checkout.
 */

import { db } from '../admin';
import { nowIso } from '../handlers/utils';
import type { HostPage } from '../../../shared/schema/hostPage';
import { syncCommunityProfileFromHostPage } from './communityDirectory';
import type { FirestoreEvent } from './events';

const EVENT_DOC_PREFIX = 'cpass_eventbrite_';
const API_BASE = 'https://www.eventbriteapi.com/v3';
const USER_AGENT = 'CulturePass-EventbriteSync/1.0 (+https://culturepass.app)';

/** Public community — /community/australian-event-finder */
export const AUSTRALIAN_EVENT_FINDER_COMMUNITY_ID = 'cpass_australian_event_finder';

/** City slugs for eventbrite.com.au browse pages (`/d/australia--{slug}/events/`). */
export interface EventbriteBrowseLocation {
  slug: string;
  label?: string;
}

export const DEFAULT_EVENTBRITE_BROWSE_LOCATIONS: EventbriteBrowseLocation[] = [
  { slug: 'australia', label: 'Australia' },
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'brisbane-city', label: 'Brisbane' },
  { slug: 'perth', label: 'Perth' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'canberra', label: 'Canberra' },
  { slug: 'gold-coast', label: 'Gold Coast' },
  { slug: 'newcastle', label: 'Newcastle' },
  { slug: 'hobart', label: 'Hobart' },
  { slug: 'darwin', label: 'Darwin' },
];

/** @deprecated Event Search API removed by Eventbrite — kept for Firestore config migration only */
export interface EventbriteSearchLocation {
  address: string;
  within: string;
}

export const DEFAULT_EVENTBRITE_SYNC_CONFIG: EventbriteSyncConfig = {
  enabled: true,
  communityId: AUSTRALIAN_EVENT_FINDER_COMMUNITY_ID,
  hostPageId: '',
  organizerId: '5tcuSl8W3pZ4ZyYrRi6TiscP30H2',
  apiBaseUrl: API_BASE,
  browseLocations: DEFAULT_EVENTBRITE_BROWSE_LOCATIONS,
  maxEventsPerBrowse: 60,
  maxTotalEvents: 400,
  privateToken: '',
};

export interface EventbriteSyncConfig {
  enabled: boolean;
  communityId: string;
  hostPageId?: string;
  organizerId: string;
  apiBaseUrl: string;
  browseLocations: EventbriteBrowseLocation[];
  maxEventsPerBrowse: number;
  maxTotalEvents: number;
  /** Optional override; prefer EVENTBRITE_PRIVATE_TOKEN env in production */
  privateToken?: string;
  /** Legacy field — ignored */
  searchLocations?: EventbriteSearchLocation[];
  maxEventsPerLocation?: number;
}

export interface EventbriteSyncResult {
  fetched: number;
  upserted: number;
  pruned: number;
  skipped: number;
  errors: string[];
  syncedAt: string;
  communityId: string;
}

interface EventbriteTextField {
  text?: string;
  html?: string;
}

interface EventbriteDateTime {
  timezone?: string;
  local?: string;
  utc?: string;
}

interface EventbriteMoney {
  currency?: string;
  value?: number;
  major_value?: string;
  display?: string;
}

interface EventbriteTicketAvailability {
  has_available_tickets?: boolean;
  is_sold_out?: boolean;
  minimum_ticket_price?: EventbriteMoney;
  maximum_ticket_price?: EventbriteMoney;
}

interface EventbriteVenue {
  id?: string;
  name?: string;
  address?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
    localized_address_display?: string;
  };
}

interface EventbriteOrganizer {
  id?: string;
  name?: string;
}

export interface EventbriteEvent {
  id: string;
  name?: EventbriteTextField;
  description?: EventbriteTextField;
  summary?: string;
  url?: string;
  status?: string;
  online_event?: boolean;
  is_free?: boolean;
  currency?: string;
  start?: EventbriteDateTime;
  end?: EventbriteDateTime;
  logo?: { original?: { url?: string }; url?: string };
  venue?: EventbriteVenue;
  organizer?: EventbriteOrganizer;
  category_id?: string;
  subcategory_id?: string;
  ticket_availability?: EventbriteTicketAvailability;
}

interface EventbriteTicketClass {
  free?: boolean;
  cost?: EventbriteMoney;
  on_sale_status?: string;
}

const EVENTBRITE_TICKET_ID_RE = /tickets-(\d{10,})/g;
const BROWSE_BASE = 'https://www.eventbrite.com.au';

function integrationsCol() {
  return db.collection('integrations');
}

function eventsCol() {
  return db.collection('events');
}

function profilesCol() {
  return db.collection('profiles');
}

export function eventbriteFirestoreId(eventbriteId: string | number): string {
  return `${EVENT_DOC_PREFIX}${eventbriteId}`;
}

export function stripEventbriteHtml(html: string): string {
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

export function parseEventbriteLocalDateTime(local: string | undefined): { date: string; time: string } {
  if (!local?.trim()) {
    const today = new Date().toISOString().split('T')[0];
    return { date: today, time: '00:00' };
  }
  const normalized = local.trim().replace('T', ' ');
  const [datePart, timePart] = normalized.split(/\s+/);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : new Date().toISOString().split('T')[0];
  let time = '00:00';
  if (timePart) {
    const m = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (m) time = `${m[1].padStart(2, '0')}:${m[2]}`;
  }
  return { date, time };
}

export function resolveEventbriteImageUrl(event: EventbriteEvent): string | undefined {
  const logo = event.logo;
  if (!logo) return undefined;
  const url = logo.original?.url ?? logo.url;
  return typeof url === 'string' && url.startsWith('http') ? url : undefined;
}

export function resolveEventbriteTicketUrl(event: EventbriteEvent): string {
  const raw = event.url?.trim();
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.includes('eventbrite.com.au') ? raw : raw.replace('eventbrite.com', 'eventbrite.com.au');
  }
  const id = String(event.id ?? '').trim();
  return `https://www.eventbrite.com.au/e/${id}`;
}

function parsePriceFromEvent(event: EventbriteEvent): { priceCents: number; priceLabel: string; isFree: boolean } {
  if (event.is_free) {
    return { priceCents: 0, priceLabel: 'Free', isFree: true };
  }
  const min = event.ticket_availability?.minimum_ticket_price;
  if (min?.value != null && Number.isFinite(min.value)) {
    const cents = Math.round(min.value);
    const display = min.display?.trim() || `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
    return { priceCents: cents, priceLabel: display, isFree: cents === 0 };
  }
  if (min?.major_value) {
    const n = Number.parseFloat(min.major_value);
    if (Number.isFinite(n)) {
      const cents = Math.round(n * 100);
      return { priceCents: cents, priceLabel: min.display?.trim() || `$${min.major_value}`, isFree: cents === 0 };
    }
  }
  return { priceCents: 0, priceLabel: 'See Eventbrite', isFree: false };
}

function mapCountryName(code: string | undefined): string {
  const c = (code ?? '').trim().toUpperCase();
  if (c === 'AU' || c === 'AUS') return 'Australia';
  return code?.trim() || 'Australia';
}

function eventStillActive(event: EventbriteEvent, nowMs: number): boolean {
  if (event.status && event.status !== 'live' && event.status !== 'started') return false;
  const endUtc = event.end?.utc;
  if (endUtc) {
    const endMs = Date.parse(endUtc);
    if (Number.isFinite(endMs) && endMs < nowMs) return false;
  }
  return true;
}

export function mapEventbriteToFirestore(
  event: EventbriteEvent,
  config: EventbriteSyncConfig,
  now: string,
): FirestoreEvent | null {
  if (!event.id) return null;
  if (!eventStillActive(event, Date.parse(now))) return null;

  const start = parseEventbriteLocalDateTime(event.start?.local);
  const end = parseEventbriteLocalDateTime(event.end?.local);
  const pricing = parsePriceFromEvent(event);
  const venue = event.venue;
  const addr = venue?.address;
  const isOnline = !!event.online_event;
  const city = (addr?.city ?? '').trim() || (isOnline ? 'Online' : 'Australia');
  const state = (addr?.region ?? '').trim() || undefined;
  const lat = addr?.latitude != null ? Number(addr.latitude) : undefined;
  const lng = addr?.longitude != null ? Number(addr.longitude) : undefined;
  const country = mapCountryName(addr?.country);
  const venueName = (venue?.name ?? '').trim() || (isOnline ? 'Online event' : city);
  const address =
    (addr?.localized_address_display ?? '').trim()
    || [addr?.address_1, addr?.address_2, city, state, addr?.postal_code].filter(Boolean).join(', ')
    || undefined;

  const title = event.name?.text?.trim() || 'Untitled event';
  const descriptionRaw = event.description?.text ?? event.summary ?? '';
  const description = stripEventbriteHtml(descriptionRaw) || `${title} — tickets on Eventbrite.`;
  const externalTicketUrl = resolveEventbriteTicketUrl(event);
  const coverImageUrl = resolveEventbriteImageUrl(event);
  const organizerName = event.organizer?.name?.trim();
  const categoryLabel = event.subcategory_id ? `Eventbrite ${event.subcategory_id}` : 'Community & Culture';

  const docId = eventbriteFirestoreId(event.id);

  return {
    id: docId,
    title,
    description,
    communityId: config.communityId,
    publisherProfileId: config.communityId,
    organizerId: config.organizerId,
    organizer: organizerName,
    hostName: organizerName ?? 'Eventbrite organiser',
    venue: venueName,
    address,
    date: start.date,
    time: start.time,
    endDate: end.date !== start.date ? end.date : null,
    endTime: end.time !== '00:00' ? end.time : null,
    city,
    state,
    postcode: addr?.postal_code ? Number.parseInt(addr.postal_code, 10) || undefined : undefined,
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
    country,
    timezone: event.start?.timezone,
    imageUrl: coverImageUrl,
    heroImageUrl: coverImageUrl ?? null,
    cultureTag: ['Australia'],
    cultureTags: ['Australia'],
    tags: ['eventbrite', 'australia', categoryLabel],
    category: 'Community & Culture',
    eventType: isOnline ? 'online' : 'in_person',
    isFree: pricing.isFree,
    priceCents: pricing.priceCents,
    priceLabel: pricing.priceLabel,
    entryType: pricing.isFree ? 'free_open' : 'ticketed',
    externalTicketUrl,
    locationType: isOnline ? 'virtual' : 'physical',
    sourceSystem: 'eventbrite',
    status: 'published',
    metadata: {
      eventbriteId: event.id,
      sourceUrl: externalTicketUrl,
      externalTicketingOnly: true,
      ticketProvider: 'eventbrite',
      eventbriteOrganizerId: event.organizer?.id,
      eventbriteVenueId: venue?.id,
      eventbriteCategoryId: event.category_id,
      eventbriteSubcategoryId: event.subcategory_id,
      syncedAt: now,
    },
    tiers: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function fetchEventbriteJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Eventbrite HTTP ${res.status} for ${url}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

/** Extract numeric Eventbrite event ids from public browse HTML. */
export function extractEventbriteIdsFromHtml(html: string): string[] {
  const ids = new Set<string>();
  for (const match of html.matchAll(EVENTBRITE_TICKET_ID_RE)) {
    if (match[1]) ids.add(match[1]);
  }
  return [...ids];
}

function browsePageUrl(slug: string): string {
  if (slug === 'australia') return `${BROWSE_BASE}/d/australia/events/`;
  return `${BROWSE_BASE}/d/australia--${slug}/events/`;
}

/** Discover event ids from eventbrite.com.au city browse pages (Search API is deprecated). */
export async function discoverEventbriteIdsFromBrowse(
  slug: string,
  limit = 60,
): Promise<string[]> {
  const url = browsePageUrl(slug);
  const res = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': USER_AGENT },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Browse HTTP ${res.status} for ${url}`);
  }
  const html = await res.text();
  return extractEventbriteIdsFromHtml(html).slice(0, limit);
}

function ticketAvailabilityFromClasses(
  classes: EventbriteTicketClass[] | undefined,
): EventbriteTicketAvailability | undefined {
  const available = (classes ?? []).filter((c) => c.on_sale_status !== 'UNAVAILABLE');
  if (available.length === 0) return undefined;

  const freeClass = available.find((c) => c.free);
  const paid = available.filter((c) => !c.free && c.cost?.value != null);
  if (paid.length === 0) {
    if (freeClass) {
      return { minimum_ticket_price: { currency: 'AUD', value: 0, display: 'Free' }, is_sold_out: false };
    }
    return undefined;
  }

  const min = paid.reduce((a, b) => ((a.cost?.value ?? Infinity) < (b.cost?.value ?? Infinity) ? a : b));
  return {
    minimum_ticket_price: min.cost,
    has_available_tickets: true,
    is_sold_out: false,
  };
}

export async function fetchEventbriteEventDetail(
  token: string,
  eventId: string,
  apiBaseUrl: string,
): Promise<EventbriteEvent | null> {
  const event = await fetchEventbriteJson<EventbriteEvent>(
    `${apiBaseUrl}/events/${eventId}/?expand=venue,organizer,logo`,
    token,
  );
  if (!event?.id) return null;

  try {
    const ticketPayload = await fetchEventbriteJson<{ ticket_classes?: EventbriteTicketClass[] }>(
      `${apiBaseUrl}/events/${eventId}/ticket_classes/`,
      token,
    );
    const availability = ticketAvailabilityFromClasses(ticketPayload.ticket_classes);
    if (availability) event.ticket_availability = availability;
    if (ticketPayload.ticket_classes?.every((c) => c.free)) event.is_free = true;
  } catch {
    // Ticket classes may be hidden for some events — keep event without price hint.
  }

  return event;
}

/** Events published under token-linked organizations (creator account). */
export async function listOrganizationEventIds(token: string, apiBaseUrl: string): Promise<string[]> {
  const orgPayload = await fetchEventbriteJson<{
    organizations?: { id: string }[];
  }>(`${apiBaseUrl}/users/me/organizations/`, token);

  const ids = new Set<string>();
  for (const org of orgPayload.organizations ?? []) {
    if (!org.id) continue;
    try {
      const eventsPayload = await fetchEventbriteJson<{ events?: { id: string; status?: string }[] }>(
        `${apiBaseUrl}/organizations/${org.id}/events/?status=live&page_size=50`,
        token,
      );
      for (const ev of eventsPayload.events ?? []) {
        if (ev.id && ev.status === 'live') ids.add(String(ev.id));
      }
    } catch {
      // Skip orgs we cannot read.
    }
  }
  return [...ids];
}

export async function loadEventbriteSyncConfig(): Promise<EventbriteSyncConfig> {
  try {
    const snap = await integrationsCol().doc('eventbrite').get();
    if (!snap.exists) return DEFAULT_EVENTBRITE_SYNC_CONFIG;
    const data = snap.data() as Partial<EventbriteSyncConfig>;
    return {
      ...DEFAULT_EVENTBRITE_SYNC_CONFIG,
      ...data,
      browseLocations: data.browseLocations?.length
        ? data.browseLocations
        : DEFAULT_EVENTBRITE_BROWSE_LOCATIONS,
      maxEventsPerBrowse: data.maxEventsPerBrowse ?? data.maxEventsPerLocation ?? DEFAULT_EVENTBRITE_SYNC_CONFIG.maxEventsPerBrowse,
    };
  } catch {
    return DEFAULT_EVENTBRITE_SYNC_CONFIG;
  }
}

async function resolveEventbriteToken(config: EventbriteSyncConfig): Promise<string | null> {
  const fromConfig = config.privateToken?.trim();
  if (fromConfig) return fromConfig;
  const fromEnv = process.env.EVENTBRITE_PRIVATE_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

async function resolveCommunityId(config: EventbriteSyncConfig): Promise<string> {
  if (config.hostPageId?.trim()) {
    const pageSnap = await db.collection('hostPages').doc(config.hostPageId.trim()).get();
    if (pageSnap.exists) {
      const page = { ...(pageSnap.data() as HostPage), id: pageSnap.id };
      if (page.entityType === 'community') {
        const profile = await syncCommunityProfileFromHostPage(page);
        return profile.id;
      }
    }
  }
  return config.communityId;
}

/** Ensures the Australian Event Finder directory profile exists for discovery. */
export async function ensureAustralianEventFinderCommunity(
  config: EventbriteSyncConfig,
  now: string,
): Promise<string> {
  const communityId = await resolveCommunityId(config);
  const ref = profilesCol().doc(communityId);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      id: communityId,
      name: 'Australian Event Finder',
      entityType: 'community',
      title: 'Events across Australia',
      description:
        'Live events sourced from Eventbrite Australia. Browse on CulturePass; tickets and registration stay on Eventbrite.',
      bio: 'Curated Eventbrite listings for festivals, workshops, markets, and community gatherings nationwide.',
      imageUrl: 'https://cdn.evbuc.com/eventlogos/147913819/147913851/1/Tech-Logo.png',
      coverImageUrl: 'https://cdn.evbuc.com/eventlogos/147913819/147913851/1/Tech-Logo.png',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      category: 'cultural',
      tags: ['eventbrite', 'australia', 'events', 'finder'],
      cultureTags: ['Australia'],
      ownerId: config.organizerId,
      status: 'published',
      handle: 'australian-event-finder',
      handleStatus: 'approved',
      joinMode: 'open',
      memberCount: 0,
      activityLevel: 'active',
      website: 'https://www.eventbrite.com.au/',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      metadata: { sourceSystem: 'eventbrite', autoProvisioned: true },
    });
  } else {
    await ref.set(
      {
        updatedAt: now,
        website: snap.data()?.website ?? 'https://www.eventbrite.com.au/',
      },
      { merge: true },
    );
  }

  return communityId;
}

export async function syncEventbriteEvents(
  inputConfig?: Partial<EventbriteSyncConfig>,
): Promise<EventbriteSyncResult> {
  const config: EventbriteSyncConfig = {
    ...(await loadEventbriteSyncConfig()),
    ...inputConfig,
  };

  const result: EventbriteSyncResult = {
    fetched: 0,
    upserted: 0,
    pruned: 0,
    skipped: 0,
    errors: [],
    syncedAt: nowIso(),
    communityId: config.communityId,
  };

  if (!config.enabled) {
    result.errors.push('Eventbrite sync disabled in config');
    return result;
  }

  const token = await resolveEventbriteToken(config);
  if (!token) {
    result.errors.push('Missing Eventbrite private token (EVENTBRITE_PRIVATE_TOKEN or integrations/eventbrite.privateToken)');
    return result;
  }

  const communityId = await ensureAustralianEventFinderCommunity(config, result.syncedAt);
  config.communityId = communityId;
  result.communityId = communityId;

  const seenEventbriteIds = new Set<string>();

  for (const id of await listOrganizationEventIds(token, config.apiBaseUrl)) {
    seenEventbriteIds.add(id);
  }

  for (const location of config.browseLocations) {
    if (seenEventbriteIds.size >= config.maxTotalEvents) break;
    try {
      const discovered = await discoverEventbriteIdsFromBrowse(
        location.slug,
        config.maxEventsPerBrowse,
      );
      for (const id of discovered) {
        seenEventbriteIds.add(id);
        if (seenEventbriteIds.size >= config.maxTotalEvents) break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${location.slug}: ${msg}`);
    }
  }

  result.fetched = seenEventbriteIds.size;
  const activeDocIds = new Set<string>();
  const now = result.syncedAt;
  const idList = [...seenEventbriteIds];

  const CONCURRENCY = 5;
  for (let i = 0; i < idList.length; i += CONCURRENCY) {
    const chunk = idList.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (eventId) => {
        try {
          const event = await fetchEventbriteEventDetail(token, eventId, config.apiBaseUrl);
          if (!event) {
            result.skipped += 1;
            return;
          }
          const mapped = mapEventbriteToFirestore(event, config, now);
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
          result.errors.push(`event ${eventId}: ${msg}`);
        }
      }),
    );
  }

  const staleSnap = await eventsCol()
    .where('communityId', '==', communityId)
    .where('sourceSystem', '==', 'eventbrite')
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

  await integrationsCol().doc('eventbrite').set(
    {
      ...config,
      privateToken: undefined,
      lastSyncAt: now,
      lastSyncResult: {
        fetched: result.fetched,
        upserted: result.upserted,
        pruned: result.pruned,
        skipped: result.skipped,
        errorCount: result.errors.length,
        communityId,
      },
    },
    { merge: true },
  );

  return result;
}