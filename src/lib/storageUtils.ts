import { ref, type FirebaseStorage } from 'firebase/storage';

/**
 * Convert a local URI to a Blob for Firebase uploadBytesResumable.
 * fetch(file://) works on both iOS and Android via the React Native bridge.
 */
export function uriToBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((r) => r.blob());
}

/** Extract Firebase Storage object path from a download URL. */
export function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const objectMatch = parsed.pathname.match(/\/o\/(.+)$/);
    if (objectMatch?.[1]) return decodeURIComponent(objectMatch[1]);
    if (!parsed.hostname.includes('firebasestorage.googleapis.com') && parsed.pathname.startsWith('/')) {
      return parsed.pathname.replace(/^\//, '');
    }
    return null;
  } catch {
    return null;
  }
}

export function storageRefFromDownloadUrl(storage: FirebaseStorage, url: string) {
  const path = storagePathFromDownloadUrl(url);
  if (!path) throw new Error('Invalid storage URL — cannot resolve file path.');
  return ref(storage, path);
}

export function formatStorageUploadError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return 'Upload denied — sign in and check you have permission for this item.';
  }
  if (code === 'storage/canceled') return 'Upload cancelled.';
  if (code === 'storage/quota-exceeded') return 'Storage quota exceeded. Try a smaller image.';
  if (code === 'storage/invalid-checksum') return 'Upload corrupted — please try again.';
  if (code === 'storage/retry-limit-exceeded') return 'Upload timed out — check your connection and retry.';
  if (message.includes('Firebase is not configured')) return message;
  if (message.includes('Photo access')) return message;
  return message || 'Image upload failed. Please try again.';
}