import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Migration Route for CulturePass Data Architecture v2.
 * Note: Since scanning entire collections takes extremely long and can hit timeout,
 * paginated batch updates are strongly recommended. This exposes a callable HTTPS endpoint.
 */
export const runV2DataMigration = functions.https.onCall(async (data, context) => {
  // Optional: add authorization (e.g. context.auth?.token.admin)
  // if (!context.auth || !context.auth.token.admin) {
  //   throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  // }

  const db = admin.firestore();
  let eventsUpdated = 0;
  let usersUpdated = 0;

  try {
    // 1. MIGRATING USERS
    const usersList = await db.collection('users').get();
    
    // Create multiple batches since Firestore limits to 500 writes/batch
    let batch = db.batch();
    let writeCount = 0;

    for (const doc of usersList.docs) {
      const userData = doc.data();

      // Skip already migrated docs (if they have preferences or behavioral fields)
      if (userData.preferences && userData.behavioral) continue;

      batch.update(doc.ref, {
        preferences: {
          priceSensitivity: userData.preferences?.priceSensitivity || 'medium',
          experienceTypes: userData.preferences?.experienceTypes || [],
          accessibilityNeeds: userData.preferences?.accessibilityNeeds || [],
        },
        behavioral: {
          likesCount: userData.likesCount ?? 0,
          saveCount: userData.saveCount ?? 0,
          attendanceRate: userData.behavioral?.attendanceRate ?? 0,
          lastActiveAt: userData.updatedAt ?? admin.firestore.FieldValue.serverTimestamp(),
          claimedPerks: userData.behavioral?.claimedPerks ?? 0,
        },
        // We ensure a base structure for cultural identity
        culturalIdentity: {
          nationality: userData.culturalIdentity?.nationality || [],
          heritage: userData.culturalIdentity?.heritage || [],
          cultureIds: userData.cultureIds || userData.culturalIdentity?.cultureIds || [],
          spokenLanguages: userData.languages || userData.culturalIdentity?.spokenLanguages || [],
        }
      });

      usersUpdated++;
      writeCount++;

      if (writeCount === 450) {
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
      }
    }
    
    if (writeCount > 0) {
      await batch.commit();
    }

    // 2. MIGRATING EVENTS
    const eventsList = await db.collection('events').get();
    batch = db.batch();
    writeCount = 0;

    for (const doc of eventsList.docs) {
      const eventData = doc.data();

      // Example of an idempotent skip
      if (eventData.culturalRelevanceScore !== undefined && eventData.thumbhash !== undefined) continue;

      batch.update(doc.ref, {
        thumbhash: eventData.thumbhash || '', // Can be retroactively computed via storage triggers later
        culturalRelevanceScore: eventData.culturalRelevanceScore ?? 0,
        popularityScore: eventData.popularityScore ?? 0,
        ticketsSold: eventData.ticketsSold ?? 0,
        accessibility: eventData.accessibility ?? [],
        cultureTags: eventData.cultureTag || eventData.cultureTags || [],
        categories: eventData.category ? [eventData.category] : [],
      });

      eventsUpdated++;
      writeCount++;

      if (writeCount === 450) {
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
      }
    }

    if (writeCount > 0) {
      await batch.commit();
    }

    return { 
      success: true, 
      message: `Migration complete. Updated ${usersUpdated} users and ${eventsUpdated} events to v2 schema.` 
    };

  } catch (error: any) {
    throw new functions.https.HttpsError('internal', `Migration failed: ${error.message}`);
  }
});
