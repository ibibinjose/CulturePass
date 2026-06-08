import { db } from '../admin';
import * as geofire from 'geofire-common';
import type { PaginationParams, PaginatedResult } from './base';
import {
  eventMatchesCategoryFilter,
  firestoreCategoryValuesForFilter,
} from './eventCategoryFilter';

export interface FirestoreEvent {
  id: string;
  title: string;
  description: string;
  communityId: string;
  venue: string;
  address?: string;
  date: string;
  time: string;
  city: string;
  state?: string;
  council?: string;
  suburb?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  imageUrl?: string;
  imageColor?: string;
  cultureTag?: string[];
  tags?: string[];
  indigenousTags?: string[];
  nationalityId?: string;
  isIndigenousOwned?: boolean;
  languageTags?: string[];
  geoHash?: string;
  eventType?: string;
  visibility?: 'public' | 'private' | 'approval_required';
  vibe?: string;
  audience?: string;
  ageSuitability?: string;
  priceTier?: string;
  priceCents?: number;
  priceLabel?: string;
  category?: string;
  createdBy?: string;
  organizerId?: string;
  organizer?: string;
  /** Canonical publisher directory profile — Phase 1 */
  publisherProfileId?: string;
  /** Linked venue profile (venue | business | restaurant) — Phase 1 */
  venueProfileId?: string;
  organizerReputationScore?: number;
  capacity?: number;
  attending?: number;
  isFeatured?: boolean;
  isFree?: boolean;
  /** Submitter / organiser contact for review (listing form) */
  contactEmail?: string;
  externalTicketUrl?: string | null;
  // Entry type & end datetime (event creation wizard)
  entryType?: 'ticketed' | 'free_open';
  locationType?: 'physical' | 'virtual' | 'hybrid';
  meetingLink?: string | null;
  timezone?: string;
  waitlistEnabled?: boolean;
  requireApproval?: boolean;
  guestListVisibility?: 'public' | 'attendees_only' | 'host_only';
  sendReminders?: boolean;
  reminderAutomationEnabled?: boolean;
  reminderOffsetsMinutes?: number[];
  registrationFields?: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
  };
  maxTicketsPerOrder?: number;
  customQuestions?: string[];
  endDate?: string | null;
  endTime?: string | null;
  heroImageUrl?: string | null;

  // Core team (artists, sponsors, host)
  hostInfo?: {
    profileId?: string;
    name?: string;
    email?: string;
    phone?: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
  } | null;
  hostName?: string | null;
  hostEmail?: string | null;
  hostPhone?: string | null;
  sponsors?: string | null;
  artists?: { name: string; role?: string; bio?: string; imageUrl?: string }[];
  eventSponsors?: { name: string; tier: 'title' | 'gold' | 'silver' | 'bronze' | 'partner'; logoUrl?: string; websiteUrl?: string; website?: string; profileId?: string }[];
  tiers?: { name: string; priceCents: number; available: number }[];

  // Location service (council LGA)
  lgaCode?: string | null;
  councilId?: string | null;
  cpid?: string;
  status: 'draft' | 'published' | 'deleted';
  
  viewCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  ticketSalesCount?: number;
  ticketsSold?: number;
  ticketClickCount?: number;
  popularityScore?: number;
  culturalRelevanceScore?: number;
  cultureTags?: string[];
  sourceSystem?: string;
  searchTokens?: string[];
  metadata?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  city?: string;
  country?: string;
  category?: string;
  eventType?: string;
  isFeatured?: boolean;
  dateFrom?: string;
  dateTo?: string;
  organizerId?: string;
  communityId?: string;
  status?: FirestoreEvent['status'];
  centerLat?: number;
  centerLng?: number;
  radiusInKm?: number;
  isFree?: boolean;
  venue?: string;
  time?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  /** Exact match on `tags` array (case-insensitive), applied in memory */
  tag?: string;
  /** ABS LGA code — applied in memory (matches `lgaCode` or linked `councilId`) */
  lgaCode?: string;
  councilId?: string;
  /** Search query — case-insensitive match on title/description */
  q?: string;
}

const eventsCol = () => db.collection('events');

export const eventsService = {
  async getById(id: string): Promise<FirestoreEvent | null> {
    const snap = await eventsCol().doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as FirestoreEvent;
    if (data.status === 'deleted') return null;
    return { ...data, id: snap.id };
  },

  async list(
    filters: EventFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<FirestoreEvent>> {
    let baseQuery = eventsCol() as FirebaseFirestore.Query;

    if (filters.status) {
      baseQuery = baseQuery.where('status', '==', filters.status);
    } else if (!filters.organizerId) {
      baseQuery = baseQuery.where('status', '==', 'published');
    }

    if (filters.organizerId) baseQuery = baseQuery.where('organizerId', '==', filters.organizerId);
    if (filters.communityId) baseQuery = baseQuery.where('communityId', '==', filters.communityId);
    if (filters.city) baseQuery = baseQuery.where('city', '==', filters.city);
    if (filters.country) baseQuery = baseQuery.where('country', '==', filters.country);
    if (filters.category) {
      const catVals = firestoreCategoryValuesForFilter(filters.category);
      if (catVals.length === 1) {
        baseQuery = baseQuery.where('category', '==', catVals[0]);
      } else {
        baseQuery = baseQuery.where('category', 'in', catVals);
      }
    }
    if (filters.isFeatured !== undefined) baseQuery = baseQuery.where('isFeatured', '==', filters.isFeatured);

    const isGeoQuery = filters.centerLat != null && filters.centerLng != null && filters.radiusInKm != null;
    let items: FirestoreEvent[] = [];
    let total = 0;
    const { page, pageSize } = pagination;

    if (isGeoQuery) {
      const center: [number, number] = [filters.centerLat!, filters.centerLng!];
      const radiusInM = filters.radiusInKm! * 1000;
      const bounds = geofire.geohashQueryBounds(center, radiusInM);
      const promises: Promise<any>[] = [];
      const matchingDocs: FirestoreEvent[] = [];

      try {
        for (const b of bounds) {
          const q = baseQuery.orderBy('geoHash').startAt(b[0]).endAt(b[1]);
          promises.push(q.get());
        }
        const snapshots = await Promise.all(promises);
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            matchingDocs.push({ ...doc.data(), id: doc.id } as FirestoreEvent);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('index') || err?.code === 9) {
          console.warn('[eventsService] Index missing for status+geoHash. Falling back to multi-bound search without order.');
          const fallbackPromises: Promise<any>[] = [];
          try {
            for (const b of bounds) {
              const q = baseQuery.where('geoHash', '>=', b[0]).where('geoHash', '<=', b[1]);
              fallbackPromises.push(q.get());
            }
            const snapshots = await Promise.all(fallbackPromises);
            for (const snap of snapshots) {
              for (const doc of snap.docs) {
                matchingDocs.push({ ...doc.data(), id: doc.id } as FirestoreEvent);
              }
            }
          } catch (fbErr: any) {
            console.error('[eventsService] Fallback geo query also failed', fbErr?.message || fbErr);
            // fall through with whatever we have (likely empty)
          }
        } else {
          console.error('[eventsService] Geo query failed (non-index error)', err?.message || err);
          // do not re-throw — return empty gracefully so callers don't 500
        }
      }

      const uniqueDocs = Array.from(new Map(matchingDocs.map(d => [d.id, d])).values());
      let filteredDocs: FirestoreEvent[] = [];

      for (const data of uniqueDocs) {
        let matchesAdvanced = true;
        if (filters.dateFrom && data.date < filters.dateFrom) matchesAdvanced = false;
        if (filters.dateTo && data.date > filters.dateTo) matchesAdvanced = false;
        if (filters.isFree !== undefined && data.isFree !== filters.isFree) matchesAdvanced = false;
        if (filters.venue && data.venue !== filters.venue) matchesAdvanced = false;
        if (filters.time && data.time !== filters.time) matchesAdvanced = false;
        if (filters.publisherProfileId && data.publisherProfileId !== filters.publisherProfileId) {
          matchesAdvanced = false;
        }
        if (filters.venueProfileId && data.venueProfileId !== filters.venueProfileId) {
          matchesAdvanced = false;
        }
        if (filters.tag) {
          const t = filters.tag.toLowerCase();
          const tags = Array.isArray(data.tags) ? data.tags : [];
          if (!tags.some((x) => String(x).toLowerCase() === t)) matchesAdvanced = false;
        }
        if (filters.lgaCode || filters.councilId) {
          const lga = filters.lgaCode ? String(filters.lgaCode) : '';
          const cid = filters.councilId ? String(filters.councilId) : '';
          const inLga = lga && data.lgaCode === lga;
          const inCouncil = cid && data.councilId === cid;
          if (!inLga && !inCouncil) matchesAdvanced = false;
        }
        if (filters.q) {
          const searchTerm = filters.q.toLowerCase();
          const title = (data.title || '').toLowerCase();
          const desc = (data.description || '').toLowerCase();
          if (!title.includes(searchTerm) && !desc.includes(searchTerm)) matchesAdvanced = false;
        }

        if (matchesAdvanced && data.latitude != null && data.longitude != null) {
          const distanceInKm = geofire.distanceBetween([data.latitude, data.longitude], center);
          if (distanceInKm <= filters.radiusInKm!) {
            filteredDocs.push(data);
          }
        }
      }

      filteredDocs.sort((a, b) => a.date.localeCompare(b.date));
      total = filteredDocs.length;
      const offset = (page - 1) * pageSize;
      items = filteredDocs.slice(offset, offset + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: offset + items.length < total,
      };
    } else {
      // Non-geo query: equality filters + optional date range + orderBy('date').
      // Composite indexes must match; see firebase/firestore.indexes.json.
      if (filters.isFree !== undefined) {
        baseQuery = baseQuery.where('isFree', '==', filters.isFree);
      }
      if (filters.dateFrom) baseQuery = baseQuery.where('date', '>=', filters.dateFrom);
      if (filters.dateTo) baseQuery = baseQuery.where('date', '<=', filters.dateTo);
      baseQuery = baseQuery.orderBy('date');

      const offset = (page - 1) * pageSize;
      const FETCH_CAP = 1000;

      const applyMemoryFilters = (raw: FirestoreEvent[]): FirestoreEvent[] => {
        let memItems = raw;
        if (filters.organizerId) memItems = memItems.filter(e => e.organizerId === filters.organizerId);
        if (filters.communityId) memItems = memItems.filter(e => e.communityId === filters.communityId);
        if (filters.city) memItems = memItems.filter(e => e.city === filters.city);
        if (filters.country) memItems = memItems.filter(e => e.country === filters.country);
        if (filters.category) {
          memItems = memItems.filter((e) => eventMatchesCategoryFilter(e.category, filters.category));
        }
        if (filters.eventType) memItems = memItems.filter(e => e.eventType === filters.eventType);
        if (filters.isFeatured !== undefined) memItems = memItems.filter(e => e.isFeatured === filters.isFeatured);
        if (filters.isFree !== undefined) memItems = memItems.filter(e => e.isFree === filters.isFree);
        if (!filters.organizerId && !filters.status) {
          memItems = memItems.filter(e => e.status === 'published');
        } else if (filters.status) {
          memItems = memItems.filter(e => e.status === filters.status);
        }
        if (filters.dateFrom) memItems = memItems.filter(e => e.date >= filters.dateFrom!);
        if (filters.dateTo) memItems = memItems.filter(e => e.date <= filters.dateTo!);
        if (filters.venue) memItems = memItems.filter(e => e.venue === filters.venue);
        if (filters.time) memItems = memItems.filter(e => e.time === filters.time);
        if (filters.publisherProfileId) {
          memItems = memItems.filter((e) => e.publisherProfileId === filters.publisherProfileId);
        }
        if (filters.venueProfileId) {
          memItems = memItems.filter((e) => e.venueProfileId === filters.venueProfileId);
        }
        if (filters.tag) {
          const t = filters.tag.toLowerCase();
          memItems = memItems.filter((e) =>
            (Array.isArray(e.tags) ? e.tags : []).some((x) => String(x).toLowerCase() === t),
          );
        }
        if (filters.lgaCode || filters.councilId) {
          const lga = filters.lgaCode ? String(filters.lgaCode) : '';
          const cid = filters.councilId ? String(filters.councilId) : '';
          memItems = memItems.filter(
            (e) => (lga && e.lgaCode === lga) || (cid && e.councilId === cid),
          );
        }
        if (filters.q) {
          const searchTerm = filters.q.toLowerCase();
          memItems = memItems.filter((e) =>
            (e.title || '').toLowerCase().includes(searchTerm) ||
            (e.description || '').toLowerCase().includes(searchTerm)
          );
        }
        memItems.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        return memItems;
      };

      const fallbackListInMemory = async (): Promise<PaginatedResult<FirestoreEvent>> => {
        let fq = eventsCol() as FirebaseFirestore.Query;
        if (filters.organizerId) {
          fq = fq.where('organizerId', '==', filters.organizerId);
        } else if (filters.status) {
          fq = fq.where('status', '==', filters.status);
        } else {
          fq = fq.where('status', '==', 'published');
        }
        const fbSnap = await fq.limit(FETCH_CAP).get();
        let memItems = fbSnap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));
        memItems = applyMemoryFilters(memItems);
        total = memItems.length;
        items = memItems.slice(offset, offset + pageSize);
        return {
          items,
          total,
          page,
          pageSize,
          hasNextPage: offset + items.length < total,
        };
      };

      let memItems: FirestoreEvent[];
      try {
        const snap = await baseQuery.limit(FETCH_CAP).get();
        memItems = snap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));
      } catch (err: unknown) {
        const code = (err as { code?: number | string })?.code;
        const msg = String((err as Error)?.message ?? '');
        const isIndexError =
          code === 9 ||
          code === 'failed-precondition' ||
          msg.toLowerCase().includes('index');
        if (!isIndexError) throw err;
        console.warn('[eventsService] Composite index missing; using in-memory list fallback.', msg);
        return fallbackListInMemory();
      }

      if (filters.venue) memItems = memItems.filter(e => e.venue === filters.venue);
      if (filters.time) memItems = memItems.filter(e => e.time === filters.time);
      if (filters.publisherProfileId) {
        memItems = memItems.filter((e) => e.publisherProfileId === filters.publisherProfileId);
      }
      if (filters.venueProfileId) {
        memItems = memItems.filter((e) => e.venueProfileId === filters.venueProfileId);
      }
      if (filters.tag) {
        const t = filters.tag.toLowerCase();
        memItems = memItems.filter((e) =>
          (Array.isArray(e.tags) ? e.tags : []).some((x) => String(x).toLowerCase() === t),
        );
      }
      if (filters.lgaCode || filters.councilId) {
        const lga = filters.lgaCode ? String(filters.lgaCode) : '';
        const cid = filters.councilId ? String(filters.councilId) : '';
        memItems = memItems.filter(
          (e) => (lga && e.lgaCode === lga) || (cid && e.councilId === cid),
        );
      }
      if (filters.q) {
        const searchTerm = filters.q.toLowerCase();
        memItems = memItems.filter((e) =>
          (e.title || '').toLowerCase().includes(searchTerm) ||
          (e.description || '').toLowerCase().includes(searchTerm)
        );
      }

      total = memItems.length;
      items = memItems.slice(offset, offset + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: offset + items.length < total,
      };
    }
  },

  async create(data: Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreEvent> {
    const now = new Date().toISOString();
    const ref = eventsCol().doc();
    
    let geoHash = data.geoHash;
    if (!geoHash && data.latitude != null && data.longitude != null) {
      geoHash = geofire.geohashForLocation([data.latitude, data.longitude]);
    }
    
    const event: FirestoreEvent = {
      ...data,
      id: ref.id,
      geoHash,
      status: data.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(event);
    return event;
  },

  async update(id: string, data: Record<string, unknown>): Promise<FirestoreEvent | null> {
    const ref = eventsCol().doc(id);
    const existingSnap = await ref.get();
    if (!existingSnap.exists) return null;

    const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };

    const lat = updates.latitude;
    const lng = updates.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      updates.geoHash = geofire.geohashForLocation([lat, lng]);
    }

    await ref.update(updates as FirebaseFirestore.UpdateData<FirestoreEvent>);
    const updated = await ref.get();
    return { ...(updated.data() as FirestoreEvent), id: updated.id };
  },

  async softDelete(id: string): Promise<void> {
    await eventsCol().doc(id).update({
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    });
  },

  async publish(id: string): Promise<FirestoreEvent | null> {
    return this.update(id, { status: 'published' });
  },

  /**
   * Get events by council ID
   */
  async getByCouncil(
    councilId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<PaginatedResult<FirestoreEvent>> {
    const { limit = 20, offset = 0 } = options;
    
    let query = db.collection('events')
      .where('councilId', '==', councilId)
      .where('status', '==', 'published')
      .orderBy('date')
      .offset(offset);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      ...doc.data() as FirestoreEvent,
      id: doc.id
    }));
    
    // Note: This is a simplified count - for production you'd want a more efficient count query
    return {
      items,
      total: items.length, // This is approximate
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasNextPage: items.length === limit // Simplified check
    };
  },

  /**
   * Get events by host (organizer) ID
   */
  async getByHost(
    hostId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<PaginatedResult<FirestoreEvent>> {
    const { limit = 20, offset = 0 } = options;
    
    let query = db.collection('events')
      .where('organizerId', '==', hostId)
      .orderBy('date')
      .offset(offset);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      ...doc.data() as FirestoreEvent,
      id: doc.id
    }));
    
    // Note: This is a simplified count - for production you'd want a more efficient count query
    return {
      items,
      total: items.length, // This is approximate
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasNextPage: items.length === limit // Simplified check
    };
  },
};
