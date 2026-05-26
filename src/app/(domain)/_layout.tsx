import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { M3TopAppBar } from '@/design-system/ui';

// Type bypass for missing module
type NativeStackHeaderProps = any;


const TITLE_OVERRIDES: Record<string, string> = {
  events: 'Events',
  movies: 'Movies',
  restaurants: 'Dining',
  shopping: 'Shopping',
  cities: 'Cities',
  culture: 'Culture',
  business: 'Business',
  artist: 'Artist',
  community: 'Community',
  venue: 'Venue',
  listing: 'Create Listing',
};

/**
 * Header ownership map for domain routes.
 *
 * - Shared layout header (this file): default for most domain screens.
 * - Self-managed header screens: render their own top bars inside screen modules.
 *   Keep these route keys here to avoid double-header regressions.
 *
 * Self-managed (currently):
 * - events        -> src/modules/events/screens/AllEventsScreen.tsx (M3TopAppBar)
 * - movies        -> custom in-screen header
 * - restaurants   -> custom in-screen header
 * - shopping      -> custom in-screen header
 * - cities        -> route-level stack title/header handling
 */
const SELF_MANAGED_HEADER_ROUTES = new Set([
  'events', 'movies', 'restaurants', 'shopping', 'cities',
  // These screens render their own M3TopAppBar with contextual actions:
  'community', 'artist', 'venue',
]);

function normalizeSegment(segment?: string | null): string {
  if (typeof segment !== 'string') return '';
  return segment.replace(/[\[\]]/g, '');
}

function titleFromRouteName(routeName?: string | null): string {
  const safeRouteName = typeof routeName === 'string' ? routeName : '';
  const parts = safeRouteName
    .split('/')
    .map((segment) => normalizeSegment(segment))
    .filter((segment) => segment.length > 0);
  const first = parts[0] ?? 'discover';
  const override = TITLE_OVERRIDES[first];
  if (override) return override;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function shouldShowDomainHeader(routeName?: string | null): boolean {
  const safeRouteName = typeof routeName === 'string' ? routeName : '';
  const first = normalizeSegment(safeRouteName.split('/')[0]);
  return first.length > 0 && !SELF_MANAGED_HEADER_ROUTES.has(first);
}

function DomainHeader({ navigation, route }: NativeStackHeaderProps) {
  const title = useMemo(() => titleFromRouteName(route?.name), [route?.name]);
  const canGoBack = navigation?.canGoBack?.() ?? false;

  return (
    <M3TopAppBar
      title={title}
      onBack={canGoBack ? () => navigation.goBack() : undefined}
      denseWeb
      webChromeless
    />
  );
}

export default function DomainLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: shouldShowDomainHeader(route?.name),
        header: (props) => <DomainHeader {...props} />,
      })}
    >
      {/* Fade for canonical detail pages — avoids jarring slide when navigating from a shortlink redirect */}
      <Stack.Screen name="community/[id]" options={{ animation: 'fade' }} />
      <Stack.Screen name="community/[id]/members" options={{ animation: 'fade' }} />
      <Stack.Screen name="event/[id]" options={{ animation: 'fade' }} />
    </Stack>
  );
}
