import { api } from '@/lib/api';

/** Persist country + city to the signed-in user profile (best-effort). */
export async function syncUserMarketplaceLocation(
  userId: string | null | undefined,
  country: string,
  city: string,
): Promise<void> {
  if (!userId || !country.trim() || !city.trim()) return;
  try {
    const updates: Record<string, unknown> = {
      country: country.trim(),
      city: city.trim(),
    };

    // Resolve council for Australian cities
    if (country.trim().toLowerCase() === 'australia') {
      try {
        const res = await api.council.resolve({ city, country: 'Australia' });
        if (res?.council) {
          updates.councilId = res.council.id;
          updates.lgaCode = res.council.lgaCode ?? null;
        }
      } catch {
        // Non-critical: resolve failure doesn't block city/country sync
      }
    }

    await api.users.update(userId, updates);
  } catch (e) {
    if (__DEV__) {
      console.warn('[syncUserMarketplaceLocation] failed', e);
    }
  }
}
