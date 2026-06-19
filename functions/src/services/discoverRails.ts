/**
 * Discover rail data — community events, continue browsing, etc.
 */

import { db } from '../admin';
import { eventsService, type FirestoreEvent } from './events';
import { communityMembershipService } from './communityMembership';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_COMMUNITY_EVENTS = 50;

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export interface CommunityEventsPayload {
  events: FirestoreEvent[];
  windowStart: string;
  windowEnd: string;
}

export async function getCommunityEventsForUser(userId: string): Promise<CommunityEventsPayload> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + THIRTY_DAYS_MS);
  const dateFrom = toDateOnly(now);
  const dateTo = toDateOnly(windowEnd);

  const communityIds = await communityMembershipService.listJoinedCommunityIds(userId);
  if (communityIds.length === 0) {
    return {
      events: [],
      windowStart: now.toISOString(),
      windowEnd: windowEnd.toISOString(),
    };
  }

  const seen = new Set<string>();
  const merged: FirestoreEvent[] = [];

  // Firestore `in` queries support up to 10 values — batch community IDs.
  for (let i = 0; i < communityIds.length; i += 10) {
    const batch = communityIds.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((communityId) =>
        eventsService.list({ communityId, dateFrom, dateTo }, { page: 1, pageSize: 30 }),
      ),
    );
    for (const result of results) {
      for (const event of result.items) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);
        merged.push(event);
      }
    }
  }

  merged.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

  return {
    events: merged.slice(0, MAX_COMMUNITY_EVENTS),
    windowStart: now.toISOString(),
    windowEnd: windowEnd.toISOString(),
  };
}

export interface ContinueBrowsingItem {
  eventId: string;
  event: FirestoreEvent;
  visitedAt: string;
}

/** Server-side continue browsing — optional enrichment from saved/recent event visits. */
export async function getContinueBrowsingForUser(userId: string): Promise<{ items: ContinueBrowsingItem[] }> {
  const userSnap = await db.collection('users').doc(userId).get();
  const data = userSnap.data() as { recentEventVisits?: { eventId: string; visitedAt: string }[] } | undefined;
  const visits = Array.isArray(data?.recentEventVisits) ? data!.recentEventVisits! : [];
  if (visits.length === 0) {
    return { items: [] };
  }

  const sorted = [...visits]
    .filter((v) => typeof v.eventId === 'string' && typeof v.visitedAt === 'string')
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
    .slice(0, 3);

  const items: ContinueBrowsingItem[] = [];
  for (const visit of sorted) {
    const event = await eventsService.getById(visit.eventId);
    if (!event || event.status !== 'published') continue;
    items.push({ eventId: visit.eventId, event, visitedAt: visit.visitedAt });
  }

  return { items };
}