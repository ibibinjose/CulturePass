/**
 * Host Module API
 *
 * Re-exports all host module API hooks and services for clean imports.
 * Provides a unified `hostApi` object that wraps the global `api` namespace
 * with host-specific convenience methods.
 *
 * Usage:
 *   import { hostApi } from '@/modules/host/api';
 *   const profiles = await hostApi.profiles.my();
 *   const drafts = await hostApi.profiles.getDrafts();
 */

import { api } from '@/lib/api';
import type { Profile } from '@/shared/schema';
import type {
  ProfileDraft,
  ProfileVersion,
  ProfileAnalytics,
  ProfileListParams,
  HandleAvailabilityResponse,
  ABNLookupResponse,
  DraftSaveResponse,
  PublishResponse,
  RollbackResponse,
} from '@/platform/api/endpoints/createProfilesNamespace';

// Re-export types for consumers
export type {
  ProfileDraft,
  ProfileVersion,
  ProfileAnalytics,
  ProfileListParams,
  HandleAvailabilityResponse,
  ABNLookupResponse,
  DraftSaveResponse,
  PublishResponse,
  RollbackResponse,
};

/**
 * Host module API surface.
 *
 * Wraps `api.*` namespaces relevant to the host/creator domain into a single
 * import for HostSpace screens and components.
 */
export const hostApi = {
  // ---------------------------------------------------------------------------
  // Profiles — full CRUD, drafts, validation, versions, analytics
  // ---------------------------------------------------------------------------
  profiles: {
    /** List profiles with optional filters */
    list: (params?: ProfileListParams) => api.profiles.list(params),

    /** Get a single profile by ID */
    get: (id: string) => api.profiles.get(id),

    /** Get current user's profiles, optionally filtered by entity type */
    my: (params?: { entityType?: string }) => api.profiles.my(params),

    /** Create a new profile */
    create: (payload: Partial<Profile>) => api.profiles.create(payload),

    /** Update an existing profile */
    update: (id: string, payload: Partial<Profile>) => api.profiles.update(id, payload),

    /** Delete a profile */
    remove: (id: string) => api.profiles.remove(id),

    /** Publish a profile (draft → published/pending_verification) */
    publish: (id: string) => api.profiles.publish(id),

    // Draft Management
    /** Save form data as a draft (auto-save) */
    saveDraft: (
      id: string,
      payload: {
        formData: Partial<Profile>;
        currentStep: number;
        completedSteps: number[];
        entityType: string;
      },
    ) => api.profiles.saveDraft(id, payload),

    /** Get all drafts for the current user */
    getDrafts: (params?: { entityType?: string }) => api.profiles.getDrafts(params),

    /** Get a specific draft by ID */
    getDraft: (draftId: string) => api.profiles.getDraft(draftId),

    /** Delete a draft */
    deleteDraft: (draftId: string) => api.profiles.deleteDraft(draftId),

    // Validation
    /** Check if a handle is available */
    handleAvailable: (handle: string) => api.profiles.handleAvailable(handle),

    /** Validate ABN and lookup business details */
    abnLookup: (abn: string) => api.profiles.abnLookup(abn),

    // Version History
    /** Get version history for a profile */
    getVersions: (profileId: string, params?: { limit?: number }) =>
      api.profiles.getVersions(profileId, params),

    /** Get a specific version */
    getVersion: (profileId: string, versionNumber: number) =>
      api.profiles.getVersion(profileId, versionNumber),

    /** Rollback to a previous version */
    rollback: (profileId: string, versionNumber: number) =>
      api.profiles.rollback(profileId, versionNumber),

    // Analytics
    /** Get analytics for a profile */
    getAnalytics: (
      profileId: string,
      params?: { period?: 'daily' | 'weekly' | 'monthly' | 'all-time'; startDate?: string; endDate?: string },
    ) => api.profiles.getAnalytics(profileId, params),
  },

  // ---------------------------------------------------------------------------
  // Events — host-scoped event queries
  // ---------------------------------------------------------------------------
  events: {
    /** List events by organizer ID */
    list: (organizerId: string) => api.events.list({ organizerId }),

    /** List events by publisher profile ID */
    listForPublisher: (publisherProfileId: string) =>
      api.events.list({ publisherProfileId }),
  },

  // ---------------------------------------------------------------------------
  // Stripe Connect — host payment onboarding
  // ---------------------------------------------------------------------------
  stripe: {
    /** Get Stripe Connect status for a profile */
    status: (profileId: string) => api.stripe.connectStatus(profileId),

    /** Get Stripe Connect onboarding link */
    setupLink: (profileId: string) => api.stripe.connectAccountLink(profileId),

    /** Create Stripe Connect account for a profile */
    createAccount: (profileId: string) => api.stripe.connectCreateAccount(profileId),
  },

  // ---------------------------------------------------------------------------
  // Media — upload and attach
  // ---------------------------------------------------------------------------
  media: {
    /** Attach media to a profile or entity */
    attach: (data: {
      targetType: string;
      targetId: string;
      imageUrl: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
    }) => api.media.attach(data),
  },
};
