/**
 * Notification routing utility — pure functions.
 *
 * resolveNotificationRoute: maps a notification payload to a target screen route,
 * or a fallback tab root when the referenced entity has been deleted.
 *
 * Supports: event, community, profile, tickets, perks notification types.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationEntityType = 'event' | 'community' | 'profile' | 'tickets' | 'perks';

export interface NotificationPayload {
  type: NotificationEntityType;
  entityId: string;
  /** Optional scroll target within the destination screen (e.g. 'updates', 'activity'). */
  section?: string;
}

export interface ResolvedRoute {
  route: string;
  scrollToSection?: string;
}

export interface FallbackRoute {
  fallbackTab: string;
  message: string;
}

export type NotificationRouteResult = ResolvedRoute | FallbackRoute;

// ---------------------------------------------------------------------------
// Route builders
// ---------------------------------------------------------------------------

const ENTITY_ROUTES: Record<NotificationEntityType, (id: string) => string> = {
  event: (id) => `/(domain)/event/${encodeURIComponent(id)}`,
  community: (id) => `/(domain)/community/${encodeURIComponent(id)}`,
  profile: (id) => `/user/${encodeURIComponent(id)}`,
  tickets: (id) => `/tickets/${encodeURIComponent(id)}`,
  perks: (id) => `/(tabs)/perks`,
};

/** Tab root to navigate to when the referenced entity no longer exists. */
const FALLBACK_TAB: Record<NotificationEntityType, string> = {
  event: '/(tabs)',          // Discover
  community: '/(tabs)/community',
  profile: '/(tabs)/my-space',
  tickets: '/(tabs)/my-space',
  perks: '/(tabs)/my-space',
};

const DELETED_MESSAGE = 'This content is no longer available.';

// ---------------------------------------------------------------------------
// resolveNotificationRoute
// ---------------------------------------------------------------------------

/**
 * Maps a notification payload to a navigation target.
 *
 * When `entityExists` is true:
 *   Returns { route, scrollToSection? } pointing at the entity's detail screen.
 *
 * When `entityExists` is false:
 *   Returns { fallbackTab, message } pointing at the appropriate tab root.
 *   Callers should display the message for 3 seconds before navigating.
 *
 * @param payload - Notification payload from the push service
 * @param entityExists - Whether the referenced entity is still available
 */
export function resolveNotificationRoute(
  payload: NotificationPayload,
  entityExists: boolean,
): NotificationRouteResult {
  if (!entityExists) {
    return {
      fallbackTab: FALLBACK_TAB[payload.type],
      message: DELETED_MESSAGE,
    };
  }

  const route = ENTITY_ROUTES[payload.type](payload.entityId);
  const result: ResolvedRoute = { route };
  if (payload.section) result.scrollToSection = payload.section;
  return result;
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isResolvedRoute(result: NotificationRouteResult): result is ResolvedRoute {
  return 'route' in result;
}
