import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as geofire from 'geofire-common';
import { db } from './admin';
import type { FirestoreEvent } from './services/firestore';

/**
 * Trigger: onEventWritten
 * Maintains the 'feed' collection by automatically creating, updating, or
 * soft-deleting FeedItem documents whenever an event is modified.
 */
export const onEventWritten = onDocumentWritten('events/{eventId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const after = change.after.data();
  const eventId = event.params.eventId;

  try {
    // ── 0. Geohashing (Self-Healing for Proximity Search) ────────────────
    if (after && after.status === 'published' && after.latitude != null && after.longitude != null) {
      const computedHash = geofire.geohashForLocation([after.latitude, after.longitude]);
      if (after.geoHash !== computedHash) {
        console.log(`[onEventWritten] Updating geoHash for ${eventId}: ${computedHash}`);
        await db.collection('events').doc(eventId).update({ geoHash: computedHash });
        (after as any).geoHash = computedHash; // update in-memory for immediate sync
      }
    }

    // ── Deletion or Soft-Delete ─────────────────────────────────────────────
    if (!after || after.status === 'deleted') {
      const existingFeed = await db.collection('feed').where('referenceId', '==', eventId).get();
      const batch = db.batch();
      existingFeed.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return;
    }

    // Only sync published events
    if (after.status !== 'published') {
      return;
    }

    // ── 1. Sync to Global Feed ────────────────────────────────────────────
    const feedItemRef = db.collection('feed').doc(`evt_${eventId}`);

    const itemData: Record<string, unknown> = {
      type: 'event_created',
      communityId: after.communityId || 'General',
      city: after.city || 'General',
      referenceId: eventId,
      updatedAt: new Date().toISOString(),
      payload: {
        title: after.title,
        description: after.description,
        imageUrl: after.imageUrl,
        date: after.date,
        venue: after.venue || after.city,
      },
    };

    if (!change.before.exists) {
      itemData.createdAt = new Date().toISOString();
    } else {
      const existingDoc = await feedItemRef.get();
      itemData.createdAt = existingDoc.exists
        ? existingDoc.data()?.createdAt
        : new Date().toISOString();
    }

    await feedItemRef.set(itemData, { merge: true });

  } catch (err) {
    console.error('[onEventWritten] trigger error:', err);
  }
});
