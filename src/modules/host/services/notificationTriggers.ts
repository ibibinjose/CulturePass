/**
 * Notification Triggers Service
 *
 * Handles notification triggers for host profile lifecycle events:
 * - Profile publish confirmation
 * - Verification status changes (approved, rejected, more info needed)
 * - Licence/certificate expiry reminders (30 days before)
 * - Engagement milestones (100 views, 50 clicks)
 * - Performance decline suggestions
 * - Daily digest batching for non-urgent notifications
 *
 * Uses the existing notification API (`api.notifications`) for delivery
 * and supports email, push, and in-app channels.
 */

import { modulesApi } from '@/modules/api';
import type { NotificationType } from '@/shared/schema/notification';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Channels through which a notification can be delivered */
export type NotificationChannel = 'email' | 'push' | 'in_app';

/** Profile lifecycle event types that trigger notifications */
export type ProfileNotificationEvent =
  | 'profile_published'
  | 'verification_required'
  | 'verification_approved'
  | 'verification_rejected'
  | 'verification_more_info'
  | 'licence_expiry_reminder'
  | 'engagement_milestone'
  | 'performance_decline'
  | 'draft_reminder';

/** Engagement milestone thresholds */
export interface EngagementMilestone {
  metric: 'views' | 'clicks' | 'search_appearances' | 'contact_clicks';
  threshold: number;
  label: string;
}

/** Notification trigger payload */
export interface NotificationTriggerPayload {
  event: ProfileNotificationEvent;
  profileId: string;
  profileName: string;
  entityType: string;
  userId: string;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

/** Notification preference for a specific event type */
export interface NotificationPreference {
  event: ProfileNotificationEvent;
  email: boolean;
  push: boolean;
  inApp: boolean;
  digestOnly: boolean;
}

/** User's complete notification preferences for host profiles */
export interface HostNotificationPreferences {
  userId: string;
  preferences: NotificationPreference[];
  digestEnabled: boolean;
  digestTime: string; // HH:MM in user's timezone
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default engagement milestones that trigger notifications */
export const ENGAGEMENT_MILESTONES: EngagementMilestone[] = [
  { metric: 'views', threshold: 100, label: '100 profile views' },
  { metric: 'views', threshold: 500, label: '500 profile views' },
  { metric: 'views', threshold: 1000, label: '1,000 profile views' },
  { metric: 'clicks', threshold: 50, label: '50 contact clicks' },
  { metric: 'clicks', threshold: 200, label: '200 contact clicks' },
  { metric: 'search_appearances', threshold: 500, label: '500 search appearances' },
  { metric: 'search_appearances', threshold: 2000, label: '2,000 search appearances' },
];

/** Licence expiry reminder days before expiry */
export const LICENCE_EXPIRY_REMINDER_DAYS = 30;

/** Default notification preferences for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  { event: 'profile_published', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'verification_required', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'verification_approved', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'verification_rejected', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'verification_more_info', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'licence_expiry_reminder', email: true, push: true, inApp: true, digestOnly: false },
  { event: 'engagement_milestone', email: true, push: false, inApp: true, digestOnly: true },
  { event: 'performance_decline', email: true, push: false, inApp: true, digestOnly: true },
  { event: 'draft_reminder', email: true, push: false, inApp: true, digestOnly: true },
];

// ---------------------------------------------------------------------------
// Notification Content Builders
// ---------------------------------------------------------------------------

interface NotificationContent {
  title: string;
  message: string;
  type: NotificationType | string;
  actionUrl?: string;
}

/**
 * Build notification content based on the event type.
 */
function buildNotificationContent(payload: NotificationTriggerPayload): NotificationContent {
  const { event, profileName, profileId, metadata } = payload;

  switch (event) {
    case 'profile_published':
      return {
        title: 'Profile Published',
        message: `Your profile "${profileName}" is now live. Share it with your audience to start getting discovered.`,
        type: 'system',
        actionUrl: `/profiles/${profileId}`,
      };

    case 'verification_required':
      return {
        title: 'Verification Required',
        message: `Your profile "${profileName}" requires verification. We'll review your documents within 48 hours.`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/verification`,
      };

    case 'verification_approved':
      return {
        title: 'Profile Verified ✓',
        message: `Congratulations! Your profile "${profileName}" has been verified. Your verified badge is now visible.`,
        type: 'system',
        actionUrl: `/profiles/${profileId}`,
      };

    case 'verification_rejected': {
      const reason = (metadata?.rejectionReason as string) || 'Please review the requirements and resubmit.';
      return {
        title: 'Verification Update',
        message: `Your profile "${profileName}" verification was not approved. Reason: ${reason}`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/verification`,
      };
    }

    case 'verification_more_info': {
      const requirements = (metadata?.requirements as string) || 'Additional documents are needed.';
      return {
        title: 'More Information Needed',
        message: `We need additional information for "${profileName}": ${requirements}`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/verification`,
      };
    }

    case 'licence_expiry_reminder': {
      const licenceType = (metadata?.licenceType as string) || 'licence';
      const daysUntilExpiry = (metadata?.daysUntilExpiry as number) || LICENCE_EXPIRY_REMINDER_DAYS;
      return {
        title: 'Licence Expiring Soon',
        message: `Your ${licenceType} for "${profileName}" expires in ${daysUntilExpiry} days. Please renew to maintain your verified status.`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/edit?step=3`,
      };
    }

    case 'engagement_milestone': {
      const milestone = (metadata?.milestone as string) || 'a new milestone';
      return {
        title: 'Milestone Reached 🎉',
        message: `"${profileName}" has reached ${milestone}! Keep up the great work.`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/analytics`,
      };
    }

    case 'performance_decline': {
      const suggestion = (metadata?.suggestion as string) || 'Consider updating your profile description and tags.';
      return {
        title: 'Performance Insight',
        message: `"${profileName}" engagement has declined this week. ${suggestion}`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}/analytics`,
      };
    }

    case 'draft_reminder':
      return {
        title: 'Complete Your Profile',
        message: `You have an unfinished draft for "${profileName}". Complete it to start getting discovered.`,
        type: 'system',
        actionUrl: `/hostspace/create?draft=${profileId}`,
      };

    default:
      return {
        title: 'Profile Update',
        message: `There's an update regarding your profile "${profileName}".`,
        type: 'system',
        actionUrl: `/hostspace/profiles/${profileId}`,
      };
  }
}

// ---------------------------------------------------------------------------
// Trigger Functions
// ---------------------------------------------------------------------------

/**
 * Trigger a notification for a profile lifecycle event.
 * Respects user preferences and channel configuration.
 *
 * Uses the existing targeted notifications API to deliver notifications
 * to the profile owner. The backend notification service handles routing
 * to the appropriate channels (email, push, in-app).
 */
export async function triggerProfileNotification(
  payload: NotificationTriggerPayload
): Promise<void> {
  const content = buildNotificationContent(payload);

  // Use the targeted notifications API to send to the specific user.
  // The backend notification service routes to the appropriate channels
  // (email, push, in-app) based on the user's preferences.
  await modulesApi.notifications.targeted({
    title: content.title,
    message: content.message,
    type: content.type as import('@/shared/schema/notification').NotificationType,
    metadata: {
      ...payload.metadata,
      event: payload.event,
      profileId: payload.profileId,
      entityType: payload.entityType,
      actionUrl: content.actionUrl,
      channels: payload.channels,
    },
  });
}

/**
 * Trigger profile published notification.
 */
export async function triggerProfilePublished(
  profileId: string,
  profileName: string,
  entityType: string,
  userId: string
): Promise<void> {
  await triggerProfileNotification({
    event: 'profile_published',
    profileId,
    profileName,
    entityType,
    userId,
    channels: ['email', 'push', 'in_app'],
  });
}

/**
 * Trigger verification status change notification.
 */
export async function triggerVerificationStatusChange(
  profileId: string,
  profileName: string,
  entityType: string,
  userId: string,
  status: 'required' | 'approved' | 'rejected' | 'more_info',
  metadata?: Record<string, unknown>
): Promise<void> {
  const eventMap: Record<string, ProfileNotificationEvent> = {
    required: 'verification_required',
    approved: 'verification_approved',
    rejected: 'verification_rejected',
    more_info: 'verification_more_info',
  };

  await triggerProfileNotification({
    event: eventMap[status],
    profileId,
    profileName,
    entityType,
    userId,
    channels: ['email', 'push', 'in_app'],
    metadata,
  });
}

/**
 * Trigger licence expiry reminder notification.
 */
export async function triggerLicenceExpiryReminder(
  profileId: string,
  profileName: string,
  entityType: string,
  userId: string,
  licenceType: string,
  daysUntilExpiry: number
): Promise<void> {
  await triggerProfileNotification({
    event: 'licence_expiry_reminder',
    profileId,
    profileName,
    entityType,
    userId,
    channels: ['email', 'push', 'in_app'],
    metadata: { licenceType, daysUntilExpiry },
  });
}

/**
 * Trigger engagement milestone notification.
 */
export async function triggerEngagementMilestone(
  profileId: string,
  profileName: string,
  entityType: string,
  userId: string,
  milestone: EngagementMilestone
): Promise<void> {
  await triggerProfileNotification({
    event: 'engagement_milestone',
    profileId,
    profileName,
    entityType,
    userId,
    channels: ['in_app'],
    metadata: { milestone: milestone.label, metric: milestone.metric, threshold: milestone.threshold },
  });
}

/**
 * Trigger performance decline notification with optimization suggestion.
 */
export async function triggerPerformanceDecline(
  profileId: string,
  profileName: string,
  entityType: string,
  userId: string,
  suggestion: string
): Promise<void> {
  await triggerProfileNotification({
    event: 'performance_decline',
    profileId,
    profileName,
    entityType,
    userId,
    channels: ['email', 'in_app'],
    metadata: { suggestion },
  });
}

/**
 * Check if a metric has crossed a milestone threshold.
 * Returns the milestone if crossed, null otherwise.
 */
export function checkMilestoneReached(
  metric: EngagementMilestone['metric'],
  previousValue: number,
  currentValue: number
): EngagementMilestone | null {
  for (const milestone of ENGAGEMENT_MILESTONES) {
    if (
      milestone.metric === metric &&
      previousValue < milestone.threshold &&
      currentValue >= milestone.threshold
    ) {
      return milestone;
    }
  }
  return null;
}

/**
 * Check if any licences are expiring soon and return those that need reminders.
 */
export function checkLicenceExpiry(
  licences: { type: string; expiryDate?: string; reminderSent?: boolean }[]
): { type: string; daysUntilExpiry: number }[] {
  const now = new Date();
  const expiringLicences: { type: string; daysUntilExpiry: number }[] = [];

  for (const licence of licences) {
    if (!licence.expiryDate || licence.reminderSent) continue;

    const expiryDate = new Date(licence.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry > 0 && daysUntilExpiry <= LICENCE_EXPIRY_REMINDER_DAYS) {
      expiringLicences.push({ type: licence.type, daysUntilExpiry });
    }
  }

  return expiringLicences;
}

// ---------------------------------------------------------------------------
// Preference Management
// ---------------------------------------------------------------------------

/**
 * Get default notification preferences for a new user.
 */
export function getDefaultPreferences(userId: string): HostNotificationPreferences {
  return {
    userId,
    preferences: [...DEFAULT_NOTIFICATION_PREFERENCES],
    digestEnabled: true,
    digestTime: '09:00',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Determine which channels to use for a given event based on user preferences.
 */
export function getActiveChannels(
  event: ProfileNotificationEvent,
  preferences: HostNotificationPreferences
): NotificationChannel[] {
  const pref = preferences.preferences.find((p) => p.event === event);
  if (!pref) return ['in_app']; // Default to in-app only

  const channels: NotificationChannel[] = [];
  if (pref.inApp) channels.push('in_app');
  if (pref.email) channels.push('email');
  if (pref.push) channels.push('push');

  return channels;
}

/**
 * Check if a notification should be batched into the daily digest.
 */
export function shouldBatchToDigest(
  event: ProfileNotificationEvent,
  preferences: HostNotificationPreferences
): boolean {
  if (!preferences.digestEnabled) return false;

  const pref = preferences.preferences.find((p) => p.event === event);
  return pref?.digestOnly ?? false;
}

/**
 * Check if current time is within quiet hours.
 */
export function isWithinQuietHours(preferences: HostNotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = preferences.quietHoursStart.split(':').map(Number);
  const [endH, endM] = preferences.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Human-readable label for a notification event type.
 */
export function getEventLabel(event: ProfileNotificationEvent): string {
  const labels: Record<ProfileNotificationEvent, string> = {
    profile_published: 'Profile Published',
    verification_required: 'Verification Required',
    verification_approved: 'Verification Approved',
    verification_rejected: 'Verification Rejected',
    verification_more_info: 'More Information Needed',
    licence_expiry_reminder: 'Licence Expiry Reminders',
    engagement_milestone: 'Engagement Milestones',
    performance_decline: 'Performance Insights',
    draft_reminder: 'Draft Reminders',
  };
  return labels[event] || event;
}

/**
 * Human-readable description for a notification event type.
 */
export function getEventDescription(event: ProfileNotificationEvent): string {
  const descriptions: Record<ProfileNotificationEvent, string> = {
    profile_published: 'Confirmation when your profile goes live',
    verification_required: 'When your profile needs verification',
    verification_approved: 'When your profile is verified',
    verification_rejected: 'When verification is not approved',
    verification_more_info: 'When additional documents are needed',
    licence_expiry_reminder: 'Reminders before licences expire',
    engagement_milestone: 'Celebrations when you hit view/click milestones',
    performance_decline: 'Suggestions when engagement drops',
    draft_reminder: 'Reminders to complete unfinished profiles',
  };
  return descriptions[event] || '';
}
