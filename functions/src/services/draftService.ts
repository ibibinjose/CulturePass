/**
 * Draft Service
 *
 * Business logic for profile draft management, auto-save, and recovery.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 3)
 */

import { db } from '../admin';
import type { ProfileDraft } from '../../../shared/schema/hostProfileDraft';
import type { HostEntityType } from '../../../shared/schema/hostProfile';

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const draftsCol = () => db.collection('hostProfileDrafts');

// ---------------------------------------------------------------------------
// Draft Service
// ---------------------------------------------------------------------------

export const draftService = {
  /**
   * Get a draft by ID
   */
  async getDraft(draftId: string): Promise<ProfileDraft | null> {
    const snap = await draftsCol().doc(draftId).get();
    if (!snap.exists) return null;
    const data = snap.data() as ProfileDraft;
    return { ...data, id: snap.id };
  },

  /**
   * Get all drafts for a user
   */
  async getUserDrafts(userId: string, entityType?: HostEntityType): Promise<ProfileDraft[]> {
    let query = draftsCol().where('userId', '==', userId) as FirebaseFirestore.Query;

    if (entityType) {
      query = query.where('entityType', '==', entityType);
    }

    query = query.orderBy('updatedAt', 'desc');

    const snap = await query.get();
    return snap.docs.map(doc => ({ ...doc.data() as ProfileDraft, id: doc.id }));
  },

  /**
   * Save or update a draft
   */
  async saveDraft(data: {
    userId: string;
    profileId?: string;
    entityType: HostEntityType;
    formData: any;
    currentStep: number;
    completedSteps?: number[];
    deviceInfo?: { platform: string; userAgent: string };
  }): Promise<ProfileDraft> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    // Check if draft already exists for this user and entity type
    const existingDrafts = await draftsCol()
      .where('userId', '==', data.userId)
      .where('entityType', '==', data.entityType)
      .limit(1)
      .get();

    if (!existingDrafts.empty) {
      // Update existing draft
      const draftRef = existingDrafts.docs[0].ref;
      const updates = {
        formData: data.formData,
        currentStep: data.currentStep,
        completedSteps: data.completedSteps || [],
        updatedAt: now,
        expiresAt,
        ...(data.deviceInfo && { deviceInfo: data.deviceInfo }),
      };

      await draftRef.update(updates);

      const updated = await draftRef.get();
      return { ...(updated.data() as ProfileDraft), id: updated.id };
    } else {
      // Create new draft
      const draftRef = draftsCol().doc();
      const draft: ProfileDraft = {
        id: draftRef.id,
        userId: data.userId,
        entityType: data.entityType,
        formData: data.formData,
        currentStep: data.currentStep,
        completedSteps: data.completedSteps || [],
        createdAt: now,
        updatedAt: now,
        expiresAt,
        ...(data.deviceInfo && { deviceInfo: data.deviceInfo }),
      };

      await draftRef.set(draft);
      return draft;
    }
  },

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    await draftsCol().doc(draftId).delete();
  },

  /**
   * Clean up expired drafts (should be run as a scheduled function)
   */
  async cleanupExpiredDrafts(): Promise<number> {
    const now = new Date().toISOString();
    const expiredSnap = await draftsCol()
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    expiredSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return expiredSnap.size;
  },
};
