import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { formatStorageUploadError } from './storageUtils';

/**
 * Uploads a file (blob or uri) to Firebase Storage.
 * @param uri The local URI of the file to upload.
 * @param path The destination path in Storage (e.g., 'posts/image.jpg').
 * @returns The download URL of the uploaded file.
 */
export async function uploadFile(
  uri: string,
  path: string,
  contentType = 'image/jpeg',
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured for this build.');
  }
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Could not read image (${response.status}). Try picking the photo again.`);
    }
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: blob.type || contentType });
    return getDownloadURL(storageRef);
  } catch (error) {
    throw new Error(formatStorageUploadError(error));
  }
}

export async function uploadPostImage(uri: string, userId: string): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `posts/${userId}/${filename}`;
  return uploadFile(uri, path);
}

export async function uploadEventHeroImage(uri: string, eventId: string): Promise<string> {
  const filename = `hero-${Date.now()}.jpg`;
  const path = `events/${eventId}/${filename}`;
  return uploadFile(uri, path);
}

export async function uploadEventImageTemp(uri: string, userId: string): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `events/temp/${userId}/${filename}`;
  return uploadFile(uri, path);
}

// ---------------------------------------------------------------------------
// Navigation State Storage
// ---------------------------------------------------------------------------

/** The five main tab identifiers used by the navigation state manager. */
export type TabKey = 'discover' | 'calendar' | 'community' | 'city' | 'my-space';

/** AsyncStorage keys for navigation state persistence. */
export const STORAGE_KEYS = {
  /** Persisted Record<TabKey, TabState> for cross-tab navigation state. */
  NAV_STATE: '@cp_nav_state',
  /** Persisted deep link destination route for auth gate flow. */
  DEEP_LINK_DESTINATION: '@cp_dl_dest',
  /** Recent entity visits for Continue Browsing rail. */
  RECENT_VISITS: '@cp_recent_visits',
} as const;

// ---------------------------------------------------------------------------
// Continue Browsing — Recent Visits
// ---------------------------------------------------------------------------

/** A recently visited entity tracked for the Continue Browsing rail. */
export interface RecentVisit {
  entityId: string;
  entityType: 'event' | 'community' | 'city';
  visitedAt: number; // timestamp (ms)
  title: string;
  imageUrl?: string;
}

/**
 * Pure function: returns the most recently visited entities in reverse
 * chronological order, capped at `maxItems`.
 *
 * - Sorts by `visitedAt` descending (most recent first)
 * - Returns at most `maxItems` entries (default 3)
 * - Returns an empty array when `visits` is empty
 */
export function getContinueBrowsingItems(
  visits: RecentVisit[],
  maxItems: number = 3,
): RecentVisit[] {
  if (visits.length === 0) return [];
  return [...visits]
    .sort((a, b) => b.visitedAt - a.visitedAt)
    .slice(0, maxItems);
}
