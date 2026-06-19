/**
 * Community membership — join / leave / list for signed-in users.
 * Stored in `communityMembers` with doc id `${userId}_${communityId}`.
 */

import { db } from '../admin';
import { nowIso } from '../handlers/utils';

export interface CommunityMemberRecord {
  userId: string;
  communityId: string;
  status: 'active' | 'left';
  role: 'member';
  joinedAt: string;
  leftAt?: string | null;
  updatedAt: string;
}

function membersCol() {
  return db.collection('communityMembers');
}

function memberDocId(userId: string, communityId: string): string {
  return `${userId}_${communityId}`;
}

export const communityMembershipService = {
  async listJoinedCommunityIds(userId: string): Promise<string[]> {
    const snap = await membersCol()
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(200)
      .get();

    return snap.docs
      .map((doc) => (doc.data() as CommunityMemberRecord).communityId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  },

  async join(userId: string, communityId: string): Promise<{ communityId: string }> {
    const now = nowIso();
    const docId = memberDocId(userId, communityId);
    await membersCol().doc(docId).set(
      {
        userId,
        communityId,
        status: 'active',
        role: 'member',
        joinedAt: now,
        leftAt: null,
        updatedAt: now,
      } satisfies CommunityMemberRecord,
      { merge: true },
    );
    return { communityId };
  },

  async leave(userId: string, communityId: string): Promise<{ communityId: string }> {
    const now = nowIso();
    const docId = memberDocId(userId, communityId);
    const ref = membersCol().doc(docId);
    const existing = await ref.get();
    if (!existing.exists) {
      return { communityId };
    }
    await ref.set(
      {
        status: 'left',
        leftAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    return { communityId };
  },
};