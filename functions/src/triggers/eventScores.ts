import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { EventData, User } from '../../../shared/schema';

const db = admin.firestore();

/**
 * Scheduled function to compute personalized feeds for all users daily.
 * It calculates the `culturalRelevanceScore` based on the user's cultural identity and behavior.
 * This runs every day at 2:00 AM.
 */
export const computePersonalizedFeeds = functions.pubsub.schedule('0 2 * * *')
  .timeZone('Australia/Sydney') 
  .onRun(async (context: any) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      // Only fetch active upcoming events for scoring
      const now = admin.firestore.Timestamp.now();
      const eventsSnapshot = await db.collection('events')
        // Assuming events have a date field we can filter by, but for now we get all
        .where('date', '>=', new Date().toISOString().split('T')[0])
        .get();
        
      const activeEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventData));

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data() as User;
        
        // Skip users with no cultural identity
        if (!user.culturalIdentity) continue;

        const rootCultures = new Set([
          ...(user.culturalIdentity.cultureIds || []),
          ...(user.culturalIdentity.nationalityId ? [user.culturalIdentity.nationalityId] : []),
        ].map((c: string) => c.toLowerCase()));
        const exploringCultures = new Set(
          (user.culturalIdentity.exploringCultureIds || []).map((c: string) => c.toLowerCase()),
        );

        const userPreferences = user.preferences?.experienceTypes || [];

        // Score each event — weights match rankEventsForDiscover() in ranking.ts
        const scoredEvents = activeEvents.map(event => {
          let score = 0;

          // 1. Cultural Match — root cultures (60) or exploring cultures (40)
          const eventCultures = [...(event.cultureTag || []), ...(event.cultureTags || [])]
            .map((c: string) => c.toLowerCase());
          if (eventCultures.some((c) => rootCultures.has(c))) {
            score += 60;
          } else if (eventCultures.some((c) => exploringCultures.has(c))) {
            score += 40;
          }

          // 2. Behavioral/Preference Match (20% weight)
          const isPreferredCategory = userPreferences.includes(event.category || '');
          if (isPreferredCategory) score += 20;

          // 3. Popularity Bonus (max 20)
          const popularityBonus = Math.min(20, (event.popularityScore || 0) * 2);
          score += popularityBonus;
          
          return {
            eventId: event.id,
            score,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          };
        });

        // Sort by highest score first
        scoredEvents.sort((a, b) => b.score - a.score);
        
        // Save top 50 strictly personalized events for this user
        const topEvents = scoredEvents.slice(0, 50);

        // Update the user's specific personalized feed document inside their subcollection
        const feedRef = userDoc.ref.collection('personalizedFeed').doc('daily');
        await feedRef.set({
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          items: topEvents
        });
      }

      console.log(`Successfully generated personalized feeds for ${usersSnapshot.size} users.`);
      return null;
    } catch (error) {
      console.error('Error generating personalized feeds:', error);
      return null;
    }
  });

/**
 * Real-time trigger to update an event's `popularityScore` when someone interacts with it
 * (e.g. saves it or likes it).
 */
export const onUserInteraction = functions.firestore
  .document('users/{userId}/user_interactions/{interactionId}')
  .onCreate(async (snap: any, context: any) => {
    const interaction = snap.data();
    if (!interaction.eventId) return;

    const eventRef = db.collection('events').doc(interaction.eventId);
    
    // Atomically increment the popularity score
    await eventRef.update({
      popularityScore: admin.firestore.FieldValue.increment(1)
    });
  });
