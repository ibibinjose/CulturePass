/**
 * Firebase Admin SDK initialization — Cloud Functions side only.
 * Never imported by the Expo client bundle.
 */

import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const explicitBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!admin.apps.length) {
  admin.initializeApp(explicitBucket ? { storageBucket: explicitBucket } : undefined);
}

/** Firestore database instance */
export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

/** Firebase Auth Admin instance (for verifyIdToken, setCustomUserClaims, etc.) */
export const authAdmin = admin.auth();

/** Firebase Storage bucket (for image uploads) */
export const storageBucket = (() => {
  try {
    return admin.storage().bucket();
  } catch {
    return null;
  }
})();

const projectEnv =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.PROJECT_ID ??
  null;

export const projectId = admin.apps[0]?.options?.projectId ?? projectEnv ?? 'culturepass-4f264';

/**
 * True only when actual Firestore credentials are available.
 * projectId alone is not enough — the SDK needs credentials to make API calls.
 * Used by route handlers to decide whether to fall back to seed data.
 */
export const isFirestoreConfigured = Boolean(
  process.env.FUNCTIONS_EMULATOR ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.K_SERVICE // Cloud Functions production env
);

/** Stripe instance */
export const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    })
  : null;
