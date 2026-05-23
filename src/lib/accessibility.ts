/**
 * Accessibility utility pure functions.
 *
 * - getAnnouncementPoliteness: selects ARIA live region politeness level
 * - buildScreenAnnouncement: formats the screen-change announcement for VoiceOver / TalkBack
 *
 * These are used across navigation components to meet WCAG 2.1 AA requirements
 * and platform-specific accessibility guidelines (Requirements 16.1, 16.4, 16.6).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LiveRegionPoliteness = 'polite' | 'assertive';

/**
 * The category of dynamic content change triggering a live region announcement.
 *
 * - 'error': validation failures, network errors, redemption failures
 * - 'toast': confirmations, transient informational messages
 * - 'loading': loading state transitions (content loading, refreshing)
 * - 'info': non-critical informational updates
 */
export type ContentChangeType = 'toast' | 'error' | 'loading' | 'info';

// ---------------------------------------------------------------------------
// getAnnouncementPoliteness
// ---------------------------------------------------------------------------

/**
 * Returns the ARIA live region politeness level for a given content change type.
 *
 * - 'assertive' for errors — interrupts the screen reader immediately
 * - 'polite' for all other types — waits for the current utterance to finish
 *
 * @param contentType - The type of dynamic content change
 */
export function getAnnouncementPoliteness(
  contentType: ContentChangeType,
): LiveRegionPoliteness {
  return contentType === 'error' ? 'assertive' : 'polite';
}

// ---------------------------------------------------------------------------
// buildScreenAnnouncement
// ---------------------------------------------------------------------------

/**
 * Formats the accessibility announcement for a screen transition.
 * Announced by VoiceOver (iOS) and TalkBack (Android) within 500ms of the
 * transition completing (Requirement 16.1).
 *
 * Format: "{tabName}, {screenTitle}"
 * Example: "Discover, Diwali Gala 2026"
 *
 * @param tabName - Name of the active tab (e.g. "Discover", "Calendar")
 * @param screenTitle - Title of the new screen (e.g. "Melbourne Cup Events")
 */
export function buildScreenAnnouncement(tabName: string, screenTitle: string): string {
  return `${tabName}, ${screenTitle}`;
}
