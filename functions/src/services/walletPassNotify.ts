import { db, isFirestoreConfigured } from '../admin';
import { touchAppleWalletRegistrationsForSerial } from './appleWalletWebService';
import {
  buildApplePassSerialNumber,
  getWalletPassReadiness,
  isMockWalletConfiguration,
  loadWalletPassUserFromFirestore,
  patchGoogleBusinessCardIfExists,
} from './walletPasses';

/**
 * Marks wallet passes stale and nudges Apple/Google runtimes to pull fresh assets
 * after profile fields that appear on passes change (avatar, name, etc.).
 */
export async function notifyWalletPassesUpdated(userId: string): Promise<void> {
  if (!isFirestoreConfigured || !userId) return;

  const now = new Date().toISOString();
  await db.collection('users').doc(userId).set({ walletPassUpdatedAt: now }, { merge: true });

  const serialNumber = buildApplePassSerialNumber(userId);
  await touchAppleWalletRegistrationsForSerial(serialNumber, now);

  const readiness = getWalletPassReadiness();
  if (readiness.googleBusinessCard.ready && !isMockWalletConfiguration()) {
    try {
      const user = await loadWalletPassUserFromFirestore(userId);
      await patchGoogleBusinessCardIfExists(user);
    } catch (err) {
      console.warn('[wallet] Google business card patch skipped:', err);
    }
  }
}