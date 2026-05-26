/**
 * Profile Service
 *
 * Business logic for host profile CRUD operations, version history,
 * and analytics tracking.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md
 */

import { db } from '../admin';
import type { PaginationParams, PaginatedResult } from './base';
import type {
  HostProfile,
} from '../../../shared/schema/hostProfile';
import type { HostEntityType } from '../../../shared/schema/hostTypes';
import type { ProfileVersion } from '../../../shared/schema/hostProfileVersion';
import type { ProfileAnalytics } from '../../../shared/schema/hostProfileAnalytics';

// Re-export services for convenience
export { draftService } from './draftService';
export { validationService } from './validationService';
export { verificationService } from './verificationService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileFilters {
  entityType?: HostEntityType;
  status?: 'draft' | 'published' | 'pending_verification' | 'suspended';
  ownerId?: string;
  handle?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const profilesCol = () => db.collection('hostProfiles');
const versionsCol = () => db.collection('hostProfileVersions');
const analyticsCol = () => db.collection('hostProfileAnalytics');

// ---------------------------------------------------------------------------
// Profile Service
// ---------------------------------------------------------------------------

export const profileService = {
  /**
   * Get a profile by ID
   */
  async getById(id: string): Promise<HostProfile | null> {
    const snap = await profilesCol().doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as HostProfile;
    return { ...data, id: snap.id };
  },

  /**
   * Get a profile by handle
   */
  async getByHandle(handle: string): Promise<HostProfile | null> {
    const snap = await profilesCol().where('handle', '==', handle).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data() as HostProfile;
    return { ...data, id: doc.id };
  },

  /**
   * List profiles with filters and pagination
   */
  async list(
    filters: ProfileFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<HostProfile>> {
    let query = profilesCol() as FirebaseFirestore.Query;

    // Apply filters
    if (filters.entityType) {
      query = query.where('entityType', '==', filters.entityType);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.ownerId) {
      query = query.where('ownerId', '==', filters.ownerId);
    }
    if (filters.handle) {
      query = query.where('handle', '==', filters.handle);
    }
    if (filters.verificationStatus) {
      query = query.where('verificationStatus', '==', filters.verificationStatus);
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Get total count (expensive, but necessary for pagination)
    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    // Get paginated results
    const snap = await query.offset(offset).limit(pageSize).get();
    const items = snap.docs.map(doc => ({ ...doc.data() as HostProfile, id: doc.id }));

    return {
      items,
      total,
      page,
      pageSize,
      hasNextPage: offset + items.length < total,
    };
  },

  /**
   * Create a new profile
   */
  async create(data: Omit<HostProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<HostProfile> {
    const now = new Date().toISOString();
    const ref = profilesCol().doc();

    const profile: HostProfile = {
      ...data,
      id: ref.id,
      status: data.status || 'draft',
      verificationStatus: data.verificationStatus || 'pending',
      emailVerified: data.emailVerified || false,
      phoneVerified: data.phoneVerified || false,
      gstRegistered: data.gstRegistered || false,
      isOnlineOnly: data.isOnlineOnly || false,
      viewCount: 0,
      uniqueVisitorCount: 0,
      contactClickCount: 0,
      searchAppearances: 0,
      engagementScore: 0,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(profile);

    // Create initial version
    await this.createVersion(profile.id, profile, [], data.lastModifiedBy, 'Initial creation');

    return profile;
  },

  /**
   * Update a profile
   */
  async update(
    id: string,
    data: Partial<Omit<HostProfile, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<HostProfile | null> {
    const ref = profilesCol().doc(id);
    const existingSnap = await ref.get();
    if (!existingSnap.exists) return null;

    const existing = existingSnap.data() as HostProfile;
    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(updates as FirebaseFirestore.UpdateData<HostProfile>);

    const updated = await ref.get();
    const updatedProfile = { ...(updated.data() as HostProfile), id: updated.id };

    // Create version snapshot
    const changedFields = Object.keys(data).filter(
      key => JSON.stringify((data as any)[key]) !== JSON.stringify((existing as any)[key])
    );
    await this.createVersion(
      id,
      updatedProfile,
      changedFields,
      data.lastModifiedBy || existing.lastModifiedBy,
      'Profile update'
    );

    return updatedProfile;
  },

  /**
   * Create a version snapshot
   */
  async createVersion(
    profileId: string,
    profileData: HostProfile,
    changedFields: string[],
    changedBy: string,
    changeReason?: string
  ): Promise<ProfileVersion> {
    const versionsQuery = await versionsCol()
      .where('profileId', '==', profileId)
      .orderBy('versionNumber', 'desc')
      .limit(1)
      .get();

    const lastVersionNumber = versionsQuery.empty
      ? 0
      : (versionsQuery.docs[0].data() as ProfileVersion).versionNumber;

    const versionRef = versionsCol().doc();
    const version: ProfileVersion = {
      id: versionRef.id,
      profileId,
      versionNumber: lastVersionNumber + 1,
      data: profileData,
      changedFields,
      changedBy,
      changeReason,
      createdAt: new Date().toISOString(),
    };

    await versionRef.set(version);
    return version;
  },

  /**
   * Get version history for a profile
   */
  async getVersionHistory(profileId: string): Promise<ProfileVersion[]> {
    const snap = await versionsCol()
      .where('profileId', '==', profileId)
      .orderBy('versionNumber', 'desc')
      .get();

    return snap.docs.map(doc => ({ ...doc.data() as ProfileVersion, id: doc.id }));
  },

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    profileId: string,
    versionNumber: number,
    userId: string
  ): Promise<HostProfile | null> {
    // Get the target version
    const versionSnap = await versionsCol()
      .where('profileId', '==', profileId)
      .where('versionNumber', '==', versionNumber)
      .limit(1)
      .get();

    if (versionSnap.empty) {
      throw new Error('Version not found');
    }

    const version = versionSnap.docs[0].data() as ProfileVersion;
    const versionData = version.data;

    // Update the profile with the version data
    return this.update(profileId, {
      ...versionData,
      lastModifiedBy: userId,
    });
  },

  /**
   * Get analytics for a profile
   */
  async getAnalytics(
    profileId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'monthly'
  ): Promise<ProfileAnalytics | null> {
    const snap = await analyticsCol()
      .where('profileId', '==', profileId)
      .where('period', '==', period)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      // Return default analytics if none exist
      return {
        profileId,
        period,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        metrics: {
          views: 0,
          uniqueVisitors: 0,
          contactClicks: 0,
          socialLinkClicks: {},
          searchAppearances: 0,
          searchClickThroughRate: 0,
        },
        trafficSources: {
          direct: 0,
          search: 0,
          social: 0,
          referral: 0,
        },
        topKeywords: [],
        engagementScore: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const doc = snap.docs[0];
    return doc.data() as ProfileAnalytics;
  },

  /**
   * Track a profile view
   */
  async trackView(profileId: string, visitorId?: string, source?: string): Promise<void> {
    const profileRef = profilesCol().doc(profileId);
    const profile = await profileRef.get();
    if (!profile.exists) return;

    // Increment view count
    await profileRef.update({
      viewCount: (profile.data() as HostProfile).viewCount + 1,
    });

    // Track unique visitor if visitorId provided
    if (visitorId) {
      const viewsCol = db.collection('hostProfileViews');
      const existingView = await viewsCol
        .where('profileId', '==', profileId)
        .where('visitorId', '==', visitorId)
        .limit(1)
        .get();

      if (existingView.empty) {
        // New unique visitor
        await profileRef.update({
          uniqueVisitorCount: (profile.data() as HostProfile).uniqueVisitorCount + 1,
        });

        await viewsCol.add({
          profileId,
          visitorId,
          source: source || 'direct',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update analytics
    await this.updateAnalytics(profileId, 'view', { source });
  },

  /**
   * Track a contact button click
   */
  async trackContactClick(profileId: string, contactMethod: string): Promise<void> {
    const profileRef = profilesCol().doc(profileId);
    const profile = await profileRef.get();
    if (!profile.exists) return;

    // Increment contact click count
    await profileRef.update({
      contactClickCount: (profile.data() as HostProfile).contactClickCount + 1,
    });

    // Update analytics
    await this.updateAnalytics(profileId, 'contact-click', { contactMethod });
  },

  /**
   * Update analytics (internal helper)
   */
  async updateAnalytics(
    profileId: string,
    eventType: 'view' | 'contact-click' | 'social-click',
    metadata?: Record<string, any>
  ): Promise<void> {
    // This is a simplified implementation
    // In production, you'd want to use a more sophisticated analytics system
    // with time-series data, aggregations, etc.

    const periods: ('daily' | 'weekly' | 'monthly' | 'all-time')[] = ['daily', 'weekly', 'monthly', 'all-time'];

    for (const period of periods) {
      const analyticsRef = analyticsCol().doc(`${profileId}_${period}`);
      const analyticsSnap = await analyticsRef.get();

      if (!analyticsSnap.exists) {
        // Create new analytics document
        const now = new Date().toISOString();
        const analytics: ProfileAnalytics = {
          profileId,
          period,
          startDate: now,
          endDate: now,
          metrics: {
            views: eventType === 'view' ? 1 : 0,
            uniqueVisitors: 0,
            contactClicks: eventType === 'contact-click' ? 1 : 0,
            socialLinkClicks: eventType === 'social-click' && metadata?.platform
              ? { [metadata.platform]: 1 }
              : {},
            searchAppearances: 0,
            searchClickThroughRate: 0,
          },
          trafficSources: {
            direct: metadata?.source === 'direct' ? 1 : 0,
            search: metadata?.source === 'search' ? 1 : 0,
            social: metadata?.source === 'social' ? 1 : 0,
            referral: metadata?.source === 'referral' ? 1 : 0,
          },
          topKeywords: [],
          engagementScore: 0,
          updatedAt: now,
        };
        await analyticsRef.set(analytics);
      } else {
        // Update existing analytics
        const updates: any = {
          updatedAt: new Date().toISOString(),
        };

        if (eventType === 'view') {
          updates['metrics.views'] = (analyticsSnap.data() as ProfileAnalytics).metrics.views + 1;
        } else if (eventType === 'contact-click') {
          updates['metrics.contactClicks'] = (analyticsSnap.data() as ProfileAnalytics).metrics.contactClicks + 1;
        } else if (eventType === 'social-click' && metadata?.platform) {
          const platform = metadata.platform;
          const currentClicks = (analyticsSnap.data() as ProfileAnalytics).metrics.socialLinkClicks[platform] || 0;
          updates[`metrics.socialLinkClicks.${platform}`] = currentClicks + 1;
        }

        if (metadata?.source) {
          const source = metadata.source as 'direct' | 'search' | 'social' | 'referral';
          const currentCount = (analyticsSnap.data() as ProfileAnalytics).trafficSources[source] || 0;
          updates[`trafficSources.${source}`] = currentCount + 1;
        }

        await analyticsRef.update(updates);
      }
    }
  },

  /**
   * Delete a profile
   */
  async delete(id: string): Promise<void> {
    await profilesCol().doc(id).delete();
  },
};
