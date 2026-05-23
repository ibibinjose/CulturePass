import { getMessaging } from 'firebase-admin/messaging';
import { db } from '../admin';

/**
 * Sends an FCM push notification to one or more users.
 * Looks up push tokens from the `pushTokens` collection, deduplicates, and
 * sends via sendEachForMulticast. Stale/invalid tokens are removed automatically.
 */
export async function sendToUsers(
  userIds: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  if (!userIds.length) return;

  // Fetch all push tokens for the given user IDs in chunks of 30
  const unique = [...new Set(userIds)].filter(Boolean);
  const tokens: string[] = [];
  const tokenDocIds: string[] = [];

  const chunkSize = 30;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const snaps = await db
      .collection('pushTokens')
      .where('userId', 'in', chunk)
      .get();
    for (const doc of snaps.docs) {
      const token = doc.data().token as string | undefined;
      if (token) {
        tokens.push(token);
        tokenDocIds.push(doc.id);
      }
    }
  }

  if (!tokens.length) return;

  // Deduplicate — same physical device may have multiple entries
  const seen = new Set<string>();
  const dedupTokens: string[] = [];
  const dedupDocIds: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!seen.has(tokens[i])) {
      seen.add(tokens[i]);
      dedupTokens.push(tokens[i]);
      dedupDocIds.push(tokenDocIds[i]);
    }
  }

  const messaging = getMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens: dedupTokens,
    notification,
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  // Remove stale tokens that are no longer registered
  const staleDocIds: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (
      !resp.success &&
      (resp.error?.code === 'messaging/registration-token-not-registered' ||
        resp.error?.code === 'messaging/invalid-registration-token')
    ) {
      staleDocIds.push(dedupDocIds[idx]);
    }
  });

  if (staleDocIds.length) {
    const batch = db.batch();
    for (const docId of staleDocIds) {
      batch.delete(db.collection('pushTokens').doc(docId));
    }
    await batch.commit();
  }
}
