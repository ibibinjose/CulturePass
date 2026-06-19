import { api } from '@/lib/api';
import type { User } from '@/shared/schema';

/** Best-effort Firestore profile sync during onboarding (non-blocking for navigation). */
export async function syncOnboardingProfilePatch(
  userId: string | null | undefined,
  patch: Partial<User>,
): Promise<void> {
  if (!userId || Object.keys(patch).length === 0) return;
  try {
    await api.users.update(userId, patch);
  } catch (e) {
    if (__DEV__) {
      console.warn('[onboarding] profile sync failed', e);
    }
  }
}