import { db, isFirestoreConfigured } from '../admin';
import { nowIso } from '../handlers/utils';
import { ROLE_RANK, type RequestUser } from '../middleware/auth';
import type { UserRole } from '../../../shared/schema';
import { usersService } from './firestore';

export type BusinessCardEventType = 'view' | 'download' | 'scan';

export type BusinessCardAnalytics = {
  userId: string;
  views: number;
  downloads: number;
  scans: number;
  updatedAt: string;
};

export type BusinessCardRecentActor = {
  userId: string;
  displayName: string;
  username?: string | null;
  role?: string;
  type: BusinessCardEventType;
  createdAt: string;
};

export type BusinessCardAnalyticsResponse = BusinessCardAnalytics & {
  recentDownloads: BusinessCardRecentActor[];
  recentScans: BusinessCardRecentActor[];
};

const STATS_COL = 'businessCardAnalytics';
const EVENTS_COL = 'businessCardEvents';

function statsRef(userId: string) {
  return db.collection(STATS_COL).doc(userId);
}

function eventsCol(userId: string) {
  return db.collection(STATS_COL).doc(userId).collection(EVENTS_COL);
}

export function canDownloadBusinessCard(actor: RequestUser | undefined, targetUserId: string): boolean {
  if (!actor) return false;
  if (actor.id === targetUserId) return true;
  return ROLE_RANK[actor.role] >= ROLE_RANK.organizer;
}

export function canViewBusinessCardStats(actor: RequestUser | undefined, targetUserId: string): boolean {
  if (!actor) return false;
  return actor.id === targetUserId || ROLE_RANK[actor.role] >= ROLE_RANK.admin;
}

async function defaultStats(userId: string): Promise<BusinessCardAnalytics> {
  return {
    userId,
    views: 0,
    downloads: 0,
    scans: 0,
    updatedAt: nowIso(),
  };
}

async function ensureStats(userId: string): Promise<BusinessCardAnalytics> {
  const ref = statsRef(userId);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as BusinessCardAnalytics;
  const seed = await defaultStats(userId);
  await ref.set(seed);
  return seed;
}

async function actorLabel(userId: string): Promise<{ displayName: string; username?: string | null }> {
  const user = await usersService.getById(userId);
  const displayName = user?.displayName ?? user?.username ?? 'CulturePass member';
  return { displayName, username: user?.username ?? user?.handle ?? null };
}

export async function recordBusinessCardEvent(
  targetUserId: string,
  type: BusinessCardEventType,
  actor?: RequestUser,
): Promise<void> {
  if (!isFirestoreConfigured) return;

  const at = nowIso();
  const counterKey = type === 'view' ? 'views' : type === 'download' ? 'downloads' : 'scans';

  await db.runTransaction(async (tx) => {
    const ref = statsRef(targetUserId);
    const snap = await tx.get(ref);
    const base = snap.exists ? (snap.data() as BusinessCardAnalytics) : await defaultStats(targetUserId);
    tx.set(
      ref,
      {
        ...base,
        userId: targetUserId,
        [counterKey]: (base[counterKey] ?? 0) + 1,
        updatedAt: at,
      },
      { merge: true },
    );
  });

  if (type === 'view' && !actor) {
    await eventsCol(targetUserId).add({
      type,
      actorId: null,
      createdAt: at,
    });
    return;
  }

  if (!actor) return;

  const { displayName, username } = await actorLabel(actor.id);
  await eventsCol(targetUserId).add({
    type,
    actorId: actor.id,
    actorName: displayName,
    actorUsername: username ?? null,
    actorRole: actor.role,
    createdAt: at,
  });
}

export async function getBusinessCardAnalytics(
  targetUserId: string,
  limit = 12,
): Promise<BusinessCardAnalyticsResponse> {
  if (!isFirestoreConfigured) {
    const empty = await defaultStats(targetUserId);
    return { ...empty, recentDownloads: [], recentScans: [] };
  }

  const stats = await ensureStats(targetUserId);
  const eventsSnap = await eventsCol(targetUserId).orderBy('createdAt', 'desc').limit(80).get();

  const recentDownloads: BusinessCardRecentActor[] = [];
  const recentScans: BusinessCardRecentActor[] = [];
  const seenDownloaders = new Set<string>();

  for (const doc of eventsSnap.docs) {
    const row = doc.data() as {
      type?: BusinessCardEventType;
      actorId?: string | null;
      actorName?: string;
      actorUsername?: string | null;
      actorRole?: UserRole;
      createdAt?: string;
    };
    if (!row.actorId || !row.type || row.type === 'view') continue;

    const item: BusinessCardRecentActor = {
      userId: row.actorId,
      displayName: row.actorName ?? 'CulturePass member',
      username: row.actorUsername ?? null,
      role: row.actorRole,
      type: row.type,
      createdAt: row.createdAt ?? nowIso(),
    };

    if (row.type === 'download' && recentDownloads.length < limit) {
      if (seenDownloaders.has(row.actorId)) continue;
      seenDownloaders.add(row.actorId);
      recentDownloads.push(item);
    } else if (row.type === 'scan' && recentScans.length < limit) {
      recentScans.push(item);
    }
  }

  return { ...stats, recentDownloads, recentScans };
}