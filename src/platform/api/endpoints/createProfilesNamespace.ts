import type { Profile } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

/**
 * Profile API Namespace
 * 
 * Provides typed API client methods for all profile operations including:
 * - CRUD operations for host profiles
 * - Draft management (auto-save, recovery)
 * - Validation services (handle, ABN)
 * - Version history and rollback
 * - Analytics and verification
 * 
 * Used by HostSpace Enterprise-Grade Form System.
 */

// ---------------------------------------------------------------------------
// Request/Response Types
// ---------------------------------------------------------------------------

export interface ProfileListParams {
  entityType?: string;
  city?: string;
  country?: string;
  search?: string;
  pageSize?: number;
}

export interface ProfileDraft {
  id: string;
  userId: string;
  entityType: string;
  formData: Partial<Profile>;
  currentStep: number;
  completedSteps: number[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface ProfileVersion {
  id: string;
  profileId: string;
  versionNumber: number;
  data: Profile;
  changedFields: string[];
  changedBy: string;
  changeReason?: string;
  createdAt: string;
}

export interface ProfileAnalytics {
  profileId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  startDate: string;
  endDate: string;
  metrics: {
    views: number;
    uniqueVisitors: number;
    contactClicks: number;
    socialLinkClicks: Record<string, number>;
    searchAppearances: number;
    searchClickThroughRate: number;
  };
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  topKeywords: { keyword: string; count: number }[];
  engagementScore: number;
  categoryRank?: number;
  updatedAt: string;
}

export interface HandleAvailabilityResponse {
  available: boolean;
  reason?: string;
}

export interface ABNLookupResponse {
  ok: boolean;
  validated?: boolean;
  message?: string;
  abn?: string;
  entityName?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export interface DraftSaveResponse {
  success: boolean;
  draftId: string;
  savedAt: string;
}

export interface PublishResponse {
  success: boolean;
  profileId: string;
  status: 'published' | 'pending_verification';
  verificationRequired: boolean;
  estimatedReviewTime?: string;
}

export interface RollbackResponse {
  success: boolean;
  profileId: string;
  restoredVersion: number;
  newVersionNumber: number;
}

// ---------------------------------------------------------------------------
// Namespace Factory
// ---------------------------------------------------------------------------

export function createProfilesNamespace(request: ApiRequestFn) {
  return {
    /**
     * List profiles with optional filters
     * GET /api/profiles
     */
    list: async (params?: ProfileListParams) => {
      const qs = new URLSearchParams();
      if (params?.entityType) qs.set('entityType', params.entityType);
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.search) qs.set('search', params.search);
      if (params?.pageSize != null) qs.set('pageSize', String(params.pageSize));
      const q = qs.toString();
      const res = await request<{ profiles: Profile[] }>('GET', `api/profiles${q ? `?${q}` : ''}`);
      return res.profiles ?? [];
    },

    /**
     * Get a single profile by ID
     * GET /api/profiles/:id
     */
    get: (id: string) => request<Profile>('GET', `api/profiles/${id}`),

    /**
     * Get current user's profiles, optionally filtered by entity type
     * GET /api/profiles/my
     */
    my: async (params?: { entityType?: string }) => {
      const res = await request<{ profiles: Profile[] }>('GET', 'api/profiles/my');
      let list = res.profiles ?? [];
      if (params?.entityType) {
        list = list.filter((p) => p.entityType === params.entityType);
      }
      return list;
    },

    /**
     * Create a new profile
     * POST /api/profiles
     */
    create: (payload: Partial<Profile>) =>
      request<Profile>('POST', 'api/profiles', payload),

    /**
     * Update an existing profile
     * PUT /api/profiles/:id
     */
    update: (id: string, payload: Partial<Profile>) =>
      request<Profile>('PUT', `api/profiles/${id}`, payload),

    /**
     * Delete a profile
     * DELETE /api/profiles/:id
     */
    remove: (id: string) =>
      request<{ success: boolean }>('DELETE', `api/profiles/${id}`),

    /**
     * Publish a profile (move from draft to published/pending_verification)
     * POST /api/profiles/:id/publish
     */
    publish: (id: string) =>
      request<PublishResponse>('POST', `api/profiles/${id}/publish`),

    // ---------------------------------------------------------------------------
    // Draft Management
    // ---------------------------------------------------------------------------

    /**
     * Save form data as a draft (auto-save)
     * POST /api/profiles/:id/draft
     */
    saveDraft: (id: string, payload: {
      formData: Partial<Profile>;
      currentStep: number;
      completedSteps: number[];
      entityType: string;
    }) =>
      request<DraftSaveResponse>('POST', `api/profiles/${id}/draft`, payload),

    /**
     * Get all drafts for the current user
     * GET /api/profiles/drafts
     */
    getDrafts: async (params?: { entityType?: string }) => {
      const qs = new URLSearchParams();
      if (params?.entityType) qs.set('entityType', params.entityType);
      const q = qs.toString();
      const res = await request<{ drafts: ProfileDraft[] }>('GET', `api/profiles/drafts${q ? `?${q}` : ''}`);
      return res.drafts ?? [];
    },

    /**
     * Get a specific draft by ID
     * GET /api/profiles/drafts/:draftId
     */
    getDraft: (draftId: string) =>
      request<ProfileDraft>('GET', `api/profiles/drafts/${draftId}`),

    /**
     * Delete a draft
     * DELETE /api/profiles/drafts/:draftId
     */
    deleteDraft: (draftId: string) =>
      request<{ success: boolean }>('DELETE', `api/profiles/drafts/${draftId}`),

    // ---------------------------------------------------------------------------
    // Validation Services
    // ---------------------------------------------------------------------------

    /**
     * Check if a handle is available (normalized across profiles + users.username)
     * GET /api/profiles/handles/available?handle=:handle
     */
    handleAvailable: (handle: string) =>
      request<HandleAvailabilityResponse>(
        'GET',
        `api/profiles/handles/available?handle=${encodeURIComponent(handle.replace(/^@/, ''))}`,
      ),

    /**
     * Validate ABN and optionally lookup business details
     * POST /api/profiles/abn-lookup
     */
    abnLookup: (abn: string) =>
      request<ABNLookupResponse>('POST', 'api/profiles/abn-lookup', { abn }),

    // ---------------------------------------------------------------------------
    // Version History
    // ---------------------------------------------------------------------------

    /**
     * Get version history for a profile
     * GET /api/profiles/:id/versions
     */
    getVersions: async (profileId: string, params?: { limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set('limit', String(params.limit));
      const q = qs.toString();
      const res = await request<{ versions: ProfileVersion[] }>(
        'GET',
        `api/profiles/${profileId}/versions${q ? `?${q}` : ''}`,
      );
      return res.versions ?? [];
    },

    /**
     * Get a specific version
     * GET /api/profiles/:id/versions/:versionNumber
     */
    getVersion: (profileId: string, versionNumber: number) =>
      request<ProfileVersion>('GET', `api/profiles/${profileId}/versions/${versionNumber}`),

    /**
     * Rollback to a previous version
     * POST /api/profiles/:id/rollback
     */
    rollback: (profileId: string, versionNumber: number) =>
      request<RollbackResponse>('POST', `api/profiles/${profileId}/rollback`, { versionNumber }),

    // ---------------------------------------------------------------------------
    // Analytics
    // ---------------------------------------------------------------------------

    /**
     * Get analytics for a profile
     * GET /api/profiles/:id/analytics
     */
    getAnalytics: (profileId: string, params?: {
      period?: 'daily' | 'weekly' | 'monthly' | 'all-time';
      startDate?: string;
      endDate?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params?.period) qs.set('period', params.period);
      if (params?.startDate) qs.set('startDate', params.startDate);
      if (params?.endDate) qs.set('endDate', params.endDate);
      const q = qs.toString();
      return request<ProfileAnalytics>('GET', `api/profiles/${profileId}/analytics${q ? `?${q}` : ''}`);
    },
  };
}
