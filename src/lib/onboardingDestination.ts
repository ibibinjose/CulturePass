/**
 * Resolves where onboarding should send the user after the final step.
 * Default remains Creation Lab; explicit redirectTo (e.g. /community) wins.
 */

const CREATION_LAB_PREFIXES = [
  '/hostspace',
  '/hostspace/create',
  '/hostspace/event/create',
  '/pages/create',
  '/listing/create',
  '/create',
] as const;

/** Friendly tab shortcuts used in marketing links (e.g. ?redirectTo=/community). */
export const TAB_ROUTE_SHORTCUTS: Record<string, string> = {
  '/community': '/(tabs)/community',
  '/discover': '/(tabs)',
  '/calendar': '/(tabs)/calendar',
  '/city': '/(tabs)/city',
  '/perks': '/(tabs)/perks',
  '/profile': '/(tabs)/myspace',
  '/my-space': '/myspace',
  '/myspace': '/(tabs)/myspace',
  '/MySpace': '/myspace',
};

export function normalizeTabShortcut(path: string): string {
  const [pathPart, query] = path.split('?');
  const shortcut = TAB_ROUTE_SHORTCUTS[pathPart];
  if (!shortcut) return path;
  return query ? `${shortcut}?${query}` : shortcut;
}

export function isCreationLabDestination(redirectTo: string | null | undefined): boolean {
  if (!redirectTo) return true;
  const clean = redirectTo.split('?')[0] || '/';
  return CREATION_LAB_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

export function resolvePostOnboardingDestination(redirectTo: string | null | undefined): string {
  if (!redirectTo || isCreationLabDestination(redirectTo)) {
    return '/hostspace/create';
  }
  return normalizeTabShortcut(redirectTo);
}

const DESTINATION_LABELS: Record<string, string> = {
  '/(tabs)/community': 'Community',
  '/(tabs)': 'Discover',
  '/(tabs)/calendar': 'Calendar',
  '/(tabs)/city': 'My City',
  '/(tabs)/perks': 'Perks',
  '/(tabs)/myspace': 'Profile',
  '/hostspace': 'HostSpace',
  '/hostspace/create': 'Create a Page',
  '/pages/create': 'Create a Page',
};

export function labelForOnboardingDestination(redirectTo: string | null | undefined): string | null {
  if (!redirectTo) return null;
  const clean = redirectTo.split('?')[0] || '/';
  if (DESTINATION_LABELS[clean]) return DESTINATION_LABELS[clean];
  if (
    clean === '/hostspace' ||
    clean.startsWith('/hostspace/create') ||
    clean.startsWith('/hostspace/event/create') ||
    clean.match(/^\/hostspace\/[^/]+\/create/) ||
    clean.startsWith('/pages/create')
  ) {
    return 'Create a Page';
  }
  if (clean.startsWith('/community/') || clean.startsWith('/c/')) return 'Community';
  if (clean.startsWith('/event/') || clean.startsWith('/e/')) return 'Event';
  return 'your destination';
}