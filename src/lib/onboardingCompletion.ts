/** Minimum interests required to finish onboarding (matches useInterestsSelection). */
export const MIN_ONBOARDING_INTERESTS = 5;

/**
 * Whether a persisted user profile satisfies onboarding completion on the server.
 */
export function isServerOnboardingProfileComplete(user: {
  city?: string | null;
  country?: string | null;
  interests?: string[] | null;
}): boolean {
  return (
    !!user.city?.trim() &&
    !!user.country?.trim() &&
    (user.interests?.length ?? 0) >= MIN_ONBOARDING_INTERESTS
  );
}

/**
 * Avoid DataSync auto-completing while the user is actively stepping through onboarding
 * (e.g. location set locally but interests not finished yet).
 */
export function isLocalOnboardingMidFlow(
  local: { city?: string; country?: string; interests?: string[] },
  serverInterestCount: number,
): boolean {
  const localHasProgress =
    !!local.city?.trim() || !!local.country?.trim() || (local.interests?.length ?? 0) > 0;
  return (
    localHasProgress &&
    (local.interests?.length ?? 0) < MIN_ONBOARDING_INTERESTS &&
    serverInterestCount < MIN_ONBOARDING_INTERESTS
  );
}