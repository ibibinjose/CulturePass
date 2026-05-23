/**
 * Culture Explorer service — Cultural Passport + Quests (Phase 1).
 *
 * Responsibilities:
 *   1. On a paid ticket, decide whether the event qualifies for the explorer
 *      bonus (event culture is in user's `exploringCultureIds` AND not in
 *      their root `cultureIds`).
 *   2. Award bonus wallet points (multiplier portion only — base points are
 *      already credited by `awardRewardsPoints`).
 *   3. Maintain per-culture progress (`cultureExplorerProgress/{cultureId}`)
 *      and per-quest progress (`questProgress/{questId}`), idempotent on
 *      `eventId`.
 *   4. Surface a Passport summary and active quests for the UI.
 *
 * Pure decision logic is exported as standalone functions so unit tests can
 * cover the rules without spinning up Firestore.
 */

import { db, isFirestoreConfigured } from '../admin';
import { walletsService } from './wallets';
import { notificationsService } from './notifications';
import { usersService } from './users';
import type { FirestoreEvent } from './events';
import type {
  CultureBadgeTier,
  CultureExplorerProgress,
  CultureExplorerSummary,
  CultureExplorerQuestsResponse,
  CulturePassportBadge,
  CultureQuest,
  CultureQuestWithProgress,
  QuestProgress,
  User,
} from '../../../shared/schema';
import {
  computeBonusPoints,
  evaluateBadgeTier,
  eventMatchesQuest,
  nextBadgeMilestone,
  pickEventCultureTag,
  qualifiesForExplorerBonus,
  tagify,
} from './cultureExplorerRules';

// Re-export pure helpers so call sites can keep importing from this module.
export {
  computeBonusPoints,
  evaluateBadgeTier,
  eventMatchesQuest,
  nextBadgeMilestone,
  pickEventCultureTag,
  qualifiesForExplorerBonus,
} from './cultureExplorerRules';

// ---------------------------------------------------------------------------
// Firestore-bound API
// ---------------------------------------------------------------------------

const userProgressCol = (uid: string) =>
  db.collection('users').doc(uid).collection('cultureExplorerProgress');
const userQuestProgressCol = (uid: string) =>
  db.collection('users').doc(uid).collection('questProgress');
const cultureQuestsCol = () => db.collection('cultureQuests');

interface AwardOnTicketPaidInput {
  uid: string;
  ticketId: string;
  eventId: string;
  paidAmountCents: number;
}

interface AwardOnTicketPaidResult {
  qualified: boolean;
  bonusPointsAwarded: number;
  cultureId: string | null;
  newBadgeTier: CultureBadgeTier | null;
  questsAdvanced: { questId: string; count: number; completed: boolean; rewardPoints: number }[];
}

/**
 * Idempotent award path. Safe to call once per paid-ticket webhook delivery.
 *
 * Returns a structured summary so callers can attach reward telemetry to the
 * ticket and (optionally) push notifications.
 */
export async function awardOnTicketPaid(
  input: AwardOnTicketPaidInput,
): Promise<AwardOnTicketPaidResult> {
  const empty: AwardOnTicketPaidResult = {
    qualified: false,
    bonusPointsAwarded: 0,
    cultureId: null,
    newBadgeTier: null,
    questsAdvanced: [],
  };

  if (!isFirestoreConfigured) return empty;

  const eventSnap = await db.collection('events').doc(input.eventId).get();
  if (!eventSnap.exists) return empty;
  const event = { id: eventSnap.id, ...eventSnap.data() } as FirestoreEvent;

  const eventCultureTag = pickEventCultureTag(event);
  if (!eventCultureTag) return empty;

  const user = await usersService.getById(input.uid);
  if (!user) return empty;
  const userTyped = user as unknown as User;
  const exploring = userTyped.culturalIdentity?.exploringCultureIds ?? [];
  const roots = userTyped.culturalIdentity?.cultureIds ?? [];

  const qualified = qualifiesForExplorerBonus(eventCultureTag, exploring, roots);

  // Even if the bonus does not qualify, the event may still satisfy an active
  // quest the user opted into. Quests are independent of the bonus rule —
  // they reward intentional exploration regardless of root-culture overlap.
  const matchingQuests = await listMatchingActiveQuests(event);

  const result: AwardOnTicketPaidResult = { ...empty, cultureId: eventCultureTag };
  const now = new Date().toISOString();

  if (qualified) {
    const bonusPoints = computeBonusPoints(input.paidAmountCents);

    // Idempotency on (cultureId, eventId) — if this event has already been
    // counted for this culture, skip the wallet credit and progress bump.
    const progressRef = userProgressCol(input.uid).doc(eventCultureTag);
    const progressSnap = await progressRef.get();
    const current: CultureExplorerProgress | null = progressSnap.exists
      ? (progressSnap.data() as CultureExplorerProgress)
      : null;
    const alreadyCounted = current?.eventsAttended?.includes(input.eventId) ?? false;

    if (!alreadyCounted) {
      const eventsAttended = [...(current?.eventsAttended ?? []), input.eventId];
      const tier = evaluateBadgeTier(eventsAttended.length);
      const next: CultureExplorerProgress = {
        cultureId: eventCultureTag,
        eventsAttended,
        pointsEarned: (current?.pointsEarned ?? 0) + bonusPoints,
        badgeTier: tier,
        lastSeenAt: now,
      };
      await progressRef.set(next);

      if (bonusPoints > 0) {
        await walletsService.addPoints(input.uid, bonusPoints);
      }

      const tierChanged = current?.badgeTier !== tier && tier !== 'none';
      if (tierChanged) {
        try {
          await notificationsService.create({
            userId: input.uid,
            title: 'New culture badge unlocked',
            message: `You reached ${tier} tier exploring ${eventCultureTag}.`,
            type: 'culture_explorer_badge',
            metadata: { cultureId: eventCultureTag, tier, ticketId: input.ticketId },
          });
        } catch (err) {
          console.error('[cultureExplorer] badge notification failed:', err);
        }
      }

      result.qualified = true;
      result.bonusPointsAwarded = bonusPoints;
      result.newBadgeTier = tier;
    }
  }

  // Quest advancement is independent of the qualify/idempotent bonus path —
  // each quest has its own per-quest event-id ledger.
  for (const quest of matchingQuests) {
    const advanced = await advanceQuestProgress(input.uid, quest, input.eventId, now);
    if (advanced) result.questsAdvanced.push(advanced);
  }

  return result;
}

/** Bump per-quest event ledger; award one-shot bonus points on completion. */
async function advanceQuestProgress(
  uid: string,
  quest: CultureQuest,
  eventId: string,
  nowIso: string,
): Promise<{ questId: string; count: number; completed: boolean; rewardPoints: number } | null> {
  const ref = userQuestProgressCol(uid).doc(quest.id);
  const snap = await ref.get();
  const current: QuestProgress | null = snap.exists ? (snap.data() as QuestProgress) : null;

  if (current?.eventsAttended?.includes(eventId)) {
    return null;
  }

  const eventsAttended = [...(current?.eventsAttended ?? []), eventId];
  const count = Math.min(eventsAttended.length, quest.targetCount);
  const wasCompleted = Boolean(current?.completedAt);
  const justCompleted = !wasCompleted && count >= quest.targetCount;

  const next: QuestProgress = {
    questId: quest.id,
    eventsAttended,
    count,
    completedAt: wasCompleted ? current?.completedAt : justCompleted ? nowIso : undefined,
    rewardClaimedAt: current?.rewardClaimedAt,
    updatedAt: nowIso,
  };

  let rewardPointsAwarded = 0;
  if (justCompleted && !current?.rewardClaimedAt && quest.rewardPoints > 0) {
    await walletsService.addPoints(uid, quest.rewardPoints);
    next.rewardClaimedAt = nowIso;
    rewardPointsAwarded = quest.rewardPoints;

    try {
      await notificationsService.create({
        userId: uid,
        title: 'Quest complete',
        message: `${quest.title} — +${quest.rewardPoints} points credited.`,
        type: 'culture_explorer_quest',
        metadata: { questId: quest.id, rewardPoints: quest.rewardPoints },
      });
    } catch (err) {
      console.error('[cultureExplorer] quest notification failed:', err);
    }
  }

  await ref.set(next);

  return {
    questId: quest.id,
    count,
    completed: justCompleted || wasCompleted,
    rewardPoints: rewardPointsAwarded,
  };
}

/**
 * List active quests whose city/country scope (when set) matches the event.
 * Tag matching is applied in memory after a status='active' query.
 */
async function listMatchingActiveQuests(
  event: Pick<FirestoreEvent, 'city' | 'country' | 'cultureTag'> & { cultureTags?: string[] },
): Promise<CultureQuest[]> {
  if (!isFirestoreConfigured) return [];

  const tag = pickEventCultureTag(event);
  if (!tag) return [];

  // Single-equality query stays index-free; tag and city/country filtered in memory.
  const snap = await cultureQuestsCol().where('status', '==', 'active').limit(200).get();
  const now = new Date().toISOString();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CultureQuest))
    .filter((q) => q.startsAt <= now && q.endsAt >= now)
    .filter((q) => eventMatchesQuest(q, event));
}

// ---------------------------------------------------------------------------
// Read paths (panel + rail)
// ---------------------------------------------------------------------------

/**
 * Server returns the raw cultureId for label/emoji — the client enriches via
 * its own CULTURES constant. Keeping the lookup client-side keeps the
 * Cloud Functions bundle slim and avoids duplicating the cultural taxonomy.
 */

export async function getSummary(uid: string): Promise<CultureExplorerSummary> {
  if (!isFirestoreConfigured) {
    return {
      userId: uid,
      totalPoints: 0,
      bonusPointsEarned: 0,
      exploringCultureIds: [],
      badges: [],
    };
  }

  const [user, wallet, progressSnap] = await Promise.all([
    usersService.getById(uid),
    walletsService.getOrCreate(uid),
    userProgressCol(uid).get(),
  ]);

  const userTyped = (user ?? {}) as unknown as User;
  const exploringCultureIds = userTyped.culturalIdentity?.exploringCultureIds ?? [];

  const badges: CulturePassportBadge[] = progressSnap.docs.map((doc) => {
    const data = doc.data() as CultureExplorerProgress;
    const eventsCount = data.eventsAttended?.length ?? 0;
    const next = nextBadgeMilestone(eventsCount);
    return {
      cultureId: data.cultureId,
      // Server returns the raw id; client maps to a friendly label/emoji.
      cultureLabel: data.cultureId,
      eventsAttended: eventsCount,
      pointsEarned: data.pointsEarned ?? 0,
      badgeTier: data.badgeTier ?? evaluateBadgeTier(eventsCount),
      nextTierAt: next?.at ?? null,
      nextTierLabel: next?.label ?? null,
    };
  });

  const bonusPointsEarned = badges.reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0);

  return {
    userId: uid,
    totalPoints: wallet.points ?? 0,
    bonusPointsEarned,
    exploringCultureIds,
    badges: badges.sort((a, b) => b.eventsAttended - a.eventsAttended),
  };
}

interface QuestsQueryParams {
  uid?: string;
  city?: string;
  country?: string;
}

export async function listActiveQuests(params: QuestsQueryParams): Promise<CultureExplorerQuestsResponse> {
  const city = String(params.city ?? '').trim();
  const country = String(params.country ?? '').trim();

  if (!isFirestoreConfigured) {
    return { city, country, quests: [] };
  }

  const snap = await cultureQuestsCol().where('status', '==', 'active').limit(100).get();
  const nowIso = new Date().toISOString();
  const tagCity = tagify(city);
  const tagCountry = tagify(country);

  const eligibleQuests = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CultureQuest))
    .filter((q) => q.startsAt <= nowIso && q.endsAt >= nowIso)
    .filter((q) => {
      // Quests without a city scope are global; with a city scope, must match.
      if (q.city && tagify(q.city) !== tagCity) return false;
      if (q.country && tagify(q.country) !== tagCountry) return false;
      return true;
    })
    .sort((a, b) => a.endsAt.localeCompare(b.endsAt));

  // Join with per-user progress when uid is provided.
  let progressMap: Record<string, QuestProgress> = {};
  if (params.uid && eligibleQuests.length > 0) {
    const progressSnap = await userQuestProgressCol(params.uid).get();
    for (const doc of progressSnap.docs) {
      progressMap[doc.id] = doc.data() as QuestProgress;
    }
  }

  const quests: CultureQuestWithProgress[] = eligibleQuests.map((quest) => {
    const p = progressMap[quest.id];
    return {
      quest,
      progress: {
        count: p?.count ?? 0,
        completedAt: p?.completedAt ?? null,
        rewardClaimedAt: p?.rewardClaimedAt ?? null,
      },
    };
  });

  return { city, country, quests };
}
