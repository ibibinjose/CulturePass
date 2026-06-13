/**
 * Resolves the place the app should treat as "where you are" without hardcoding Sydney.
 */

export type EffectivePlaceInput = {
  gpsCity?: string;
  gpsCountry?: string;
  gpsState?: string;
  onboardingCity?: string;
  onboardingCountry?: string;
  userCity?: string;
  userCountry?: string;
  hasGps?: boolean;
};

export type EffectivePlace = {
  city: string;
  country: string;
  state?: string;
};

function norm(value?: string | null): string {
  return (value ?? '').trim();
}

function isAustralia(country: string): boolean {
  const c = country.toLowerCase();
  return c === 'australia' || c === 'au' || c === '';
}

/** Last-resort marketplace city when nothing else is known (AU only). */
export function defaultCityForCountry(country: string): string {
  if (isAustralia(country)) return 'Sydney';
  return '';
}

/**
 * Priority: GPS place → signed-in profile → onboarding → country default (AU only).
 */
export function resolveEffectivePlace(input: EffectivePlaceInput): EffectivePlace {
  const onboardingCountry = norm(input.onboardingCountry) || 'Australia';
  const country =
    (input.hasGps && norm(input.gpsCountry)) ||
    norm(input.userCountry) ||
    onboardingCountry;

  const city =
    (input.hasGps && norm(input.gpsCity)) ||
    norm(input.userCity) ||
    norm(input.onboardingCity) ||
    defaultCityForCountry(country);

  const state = input.hasGps ? norm(input.gpsState) || undefined : undefined;

  return { city, country, state };
}