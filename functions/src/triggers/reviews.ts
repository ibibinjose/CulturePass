import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * When a review status changes to/from 'approved', recalculate the organiser's
 * aggregate rating and review count on their profile doc.
 */
export const onReviewStatusChange = functions.firestore
  .document('reviews/{reviewId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    const becameApproved = before.status !== 'approved' && after.status === 'approved';
    const wasRevoked = before.status === 'approved' && after.status !== 'approved';

    if (!becameApproved && !wasRevoked) return;

    const organizerId = after.organizerId as string | undefined;
    if (!organizerId) return;

    await updateOrganizerRating(organizerId);
  });

async function updateOrganizerRating(organizerId: string): Promise<void> {
  const snap = await db
    .collection('reviews')
    .where('organizerId', '==', organizerId)
    .where('status', '==', 'approved')
    .get();

  const count = snap.size;
  const sum = snap.docs.reduce((acc, d) => acc + ((d.data().rating as number) ?? 0), 0);
  const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  await db.collection('profiles').doc(organizerId).update({
    rating: avg,
    reviewsCount: count,
    updatedAt: new Date().toISOString(),
  });
}
