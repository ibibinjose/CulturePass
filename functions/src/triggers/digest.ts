import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { sendToUsers } from '../services/fcmService';
import { sendWeeklyDigestEmail, type DigestEvent } from '../services/emailService';
import type { User } from '../../../shared/schema/user';

const db = admin.firestore();

/**
 * Sends a personalised weekly cultural digest to all opted-in users.
 * Runs every Monday at 9:00 AM Sydney time.
 * Uses the existing daily personalised feed cache (users/{uid}/personalizedFeed/daily).
 */
export const scheduleWeeklyDigest = functions.pubsub
  .schedule('0 9 * * 1')
  .timeZone('Australia/Sydney')
  .onRun(async () => {
    console.log('[digest] Starting weekly digest run');

    const usersSnap = await db.collection('users').get();
    let sent = 0;
    let skipped = 0;

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as User;

      // Respect notification opt-outs
      if (user.notificationPreferences?.categories?.events === false) {
        skipped++;
        continue;
      }

      // Fetch their personalised feed (written daily by computePersonalizedFeeds)
      const feedSnap = await userDoc.ref.collection('personalizedFeed').doc('daily').get();
      if (!feedSnap.exists) {
        skipped++;
        continue;
      }

      const feedItems = (feedSnap.data()?.items ?? []) as { eventId: string; score: number }[];
      const topIds = feedItems.slice(0, 5).map((i) => i.eventId).filter(Boolean);
      if (!topIds.length) {
        skipped++;
        continue;
      }

      // Batch-fetch event documents
      const eventDocs = await db.getAll(...topIds.map((id) => db.collection('events').doc(id)));
      const events: DigestEvent[] = eventDocs
        .filter((d) => d.exists)
        .map((d) => {
          const data = d.data()!;
          return {
            id: d.id,
            title: (data.title as string) ?? 'Untitled Event',
            date: (data.date as string) ?? '',
            imageUrl: (data.imageUrl as string | undefined) ?? undefined,
            venue: (data.venue as string | undefined) ?? undefined,
            city: (data.city as string | undefined) ?? undefined,
          };
        });

      if (!events.length) {
        skipped++;
        continue;
      }

      const city = (user.city as string | undefined) ?? 'your city';
      const displayName = (user.displayName as string | undefined) ?? (user.username as string | undefined) ?? '';

      // FCM push notification
      await sendToUsers(
        [userDoc.id],
        {
          title: `Your cultural week: ${city}`,
          body: `${events.length} event${events.length !== 1 ? 's' : ''} picked for you`,
        },
        { type: 'weekly_digest', deepLink: '/discover' },
      ).catch((err) => console.error(`[digest] FCM error for user ${userDoc.id}:`, err));

      // Email digest (if email present and not opted out)
      const email = user.email as string | undefined;
      if (email && user.privacySettings?.weeklyDigestEmail !== false) {
        await sendWeeklyDigestEmail({ to: email, displayName, city, events }).catch((err) =>
          console.error(`[digest] Email error for user ${userDoc.id}:`, err),
        );
      }

      sent++;
    }

    console.log(`[digest] Done — sent: ${sent}, skipped: ${skipped}`);
    return null;
  });
