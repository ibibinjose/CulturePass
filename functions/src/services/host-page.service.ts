/**
 * Host Page Service
 *
 * Business logic for the unified "Create a Page" system.
 * Collections: hostPages, hostPageDrafts
 */

import { db } from '../admin';
import type {
  HostPage,
  HostPageDraft,
  HostPageFormData,
} from '../../../shared/schema/hostPage';
import {
  HostPagePublishFormDataSchema,
  hostPageRequiresVerification,
  validateHostPagePublishFormData,
} from '../../../shared/schema/hostPage';
import type { HostEntityType } from '../../../shared/schema/hostTypes';
import { verificationService } from './verificationService';
import {
  restoreCommunityProfileForHostPage,
  suspendCommunityProfileForHostPage,
  syncCommunityProfileFromHostPage,
} from './communityDirectory';

const pagesCol = () => db.collection('hostPages');
const pageDraftsCol = () => db.collection('hostPageDrafts');

const DRAFT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Sort by updatedAt desc in memory — avoids composite Firestore indexes on hostPages/hostPageDrafts. */
function sortByUpdatedAtDesc<T extends { updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

export const hostPageService = {
  async getById(pageId: string): Promise<HostPage | null> {
    const snap = await pagesCol().doc(pageId).get();
    if (!snap.exists) return null;
    return { ...(snap.data() as HostPage), id: snap.id };
  },

  async listForOwner(ownerId: string, entityType?: HostEntityType): Promise<HostPage[]> {
    const snap = await pagesCol().where('ownerId', '==', ownerId).get();
    let pages = snap.docs.map((doc) => ({ ...(doc.data() as HostPage), id: doc.id }));
    if (entityType) {
      pages = pages.filter((page) => page.entityType === entityType);
    }
    return sortByUpdatedAtDesc(pages);
  },

  async create(data: {
    ownerId: string;
    entityType: HostEntityType;
    formData: HostPageFormData;
    templateId?: string;
    lastModifiedBy: string;
  }): Promise<HostPage> {
    const now = new Date().toISOString();
    const ref = pagesCol().doc();
    const page: HostPage = {
      id: ref.id,
      entityType: data.entityType,
      ownerId: data.ownerId,
      formData: data.formData,
      status: 'draft',
      verificationStatus: 'not_started',
      templateId: data.templateId as HostPage['templateId'],
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: data.lastModifiedBy,
    };
    await ref.set(page);
    return page;
  },

  async update(
    pageId: string,
    data: Partial<Omit<HostPage, 'id' | 'ownerId' | 'createdAt'>>,
  ): Promise<HostPage | null> {
    const ref = pagesCol().doc(pageId);
    const existing = await ref.get();
    if (!existing.exists) return null;

    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await ref.update(updates as FirebaseFirestore.UpdateData<HostPage>);
    const updated = await ref.get();
    const page = { ...(updated.data() as HostPage), id: updated.id };

    if (
      page.entityType === 'community' &&
      (page.status === 'published' || page.status === 'pending_verification')
    ) {
      await syncCommunityProfileFromHostPage(page);
    }

    return page;
  },

  async delete(pageId: string): Promise<void> {
    await pagesCol().doc(pageId).delete();
  },

  // ---------------------------------------------------------------------------
  // Drafts
  // ---------------------------------------------------------------------------

  async getDraft(draftId: string): Promise<HostPageDraft | null> {
    const snap = await pageDraftsCol().doc(draftId).get();
    if (!snap.exists) return null;
    return { ...(snap.data() as HostPageDraft), id: snap.id };
  },

  async getUserDrafts(userId: string, entityType?: HostEntityType): Promise<HostPageDraft[]> {
    const snap = await pageDraftsCol().where('userId', '==', userId).get();
    let drafts = snap.docs.map((doc) => ({ ...(doc.data() as HostPageDraft), id: doc.id }));
    if (entityType) {
      drafts = drafts.filter((draft) => draft.entityType === entityType);
    }
    return sortByUpdatedAtDesc(drafts);
  },

  async saveDraft(data: {
    userId: string;
    pageId?: string;
    entityType: HostEntityType;
    formData: HostPageFormData;
    currentStep: number;
    completedSteps?: number[];
    templateId?: string;
    deviceInfo?: { platform: string; userAgent: string };
    draftId?: string;
  }): Promise<HostPageDraft> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS).toISOString();

    if (data.draftId) {
      const ref = pageDraftsCol().doc(data.draftId);
      const existing = await ref.get();
      if (existing.exists) {
        const updates = {
          formData: data.formData,
          currentStep: data.currentStep,
          completedSteps: data.completedSteps ?? [],
          pageId: data.pageId,
          templateId: data.templateId,
          updatedAt: now,
          expiresAt,
          ...(data.deviceInfo && { deviceInfo: data.deviceInfo }),
        };
        await ref.update(updates);
        const updated = await ref.get();
        return { ...(updated.data() as HostPageDraft), id: updated.id };
      }
    }

    const existingSnap = await pageDraftsCol().where('userId', '==', data.userId).get();
    const existingDoc = existingSnap.docs.find(
      (doc) => (doc.data() as HostPageDraft).entityType === data.entityType,
    );

    if (existingDoc) {
      const ref = existingDoc.ref;
      const updates = {
        formData: data.formData,
        currentStep: data.currentStep,
        completedSteps: data.completedSteps ?? [],
        pageId: data.pageId,
        templateId: data.templateId,
        updatedAt: now,
        expiresAt,
        ...(data.deviceInfo && { deviceInfo: data.deviceInfo }),
      };
      await ref.update(updates);
      const updated = await ref.get();
      return { ...(updated.data() as HostPageDraft), id: updated.id };
    }

    const ref = pageDraftsCol().doc();
    const draft: HostPageDraft = {
      id: ref.id,
      userId: data.userId,
      pageId: data.pageId,
      entityType: data.entityType,
      formData: data.formData,
      currentStep: data.currentStep,
      completedSteps: data.completedSteps ?? [],
      templateId: data.templateId as HostPageDraft['templateId'],
      createdAt: now,
      updatedAt: now,
      expiresAt,
      ...(data.deviceInfo && { deviceInfo: data.deviceInfo }),
    };
    await ref.set(draft);
    return draft;
  },

  async deleteDraft(draftId: string): Promise<void> {
    await pageDraftsCol().doc(draftId).delete();
  },

  // ---------------------------------------------------------------------------
  // Publish & moderation
  // ---------------------------------------------------------------------------

  async publish(pageId: string, userId: string): Promise<{
    page: HostPage;
    verificationRequired: boolean;
    estimatedReviewTime?: string;
  }> {
    const page = await this.getById(pageId);
    if (!page) {
      throw Object.assign(new Error('Page not found'), { status: 404 });
    }
    if (page.ownerId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    HostPagePublishFormDataSchema.parse(page.formData);
    const publishCheck = validateHostPagePublishFormData(page.formData, page.entityType);
    if (!publishCheck.success) {
      const message = publishCheck.issues.map((i) => i.message).join('; ');
      throw Object.assign(new Error(message), { status: 400 });
    }
    const formData = page.formData;
    const requiresVerification = hostPageRequiresVerification(page.entityType);
    const now = new Date().toISOString();
    const newStatus = requiresVerification ? 'pending_verification' : 'published';

    const updated = await this.update(pageId, {
      formData,
      status: newStatus,
      verificationStatus: requiresVerification ? 'pending' : 'not_started',
      publishedAt: now,
      lastModifiedBy: userId,
    });

    if (!updated) {
      throw Object.assign(new Error('Failed to publish page'), { status: 500 });
    }

    if (requiresVerification) {
      const checklist = verificationService.getPageChecklistForEntityType(page.entityType);
      const documents = [formData.logoUrl, formData.coverUrl].filter(Boolean) as string[];
      await verificationService.createVerificationTask({
        pageId,
        entityType: page.entityType,
        submittedBy: userId,
        documents,
        checklist,
        adminNotes: '',
      });
    }

    if (updated.entityType === 'community' && updated.status === 'published') {
      await syncCommunityProfileFromHostPage(updated);
    }

    return {
      page: updated,
      verificationRequired: requiresVerification,
      estimatedReviewTime: requiresVerification ? '24–48 hours' : undefined,
    };
  },

  async blockPage(pageId: string, adminId: string, reason: string): Promise<HostPage | null> {
    const now = new Date().toISOString();
    const blocked = await this.update(pageId, {
      status: 'blocked',
      blockedAt: now,
      blockedBy: adminId,
      blockReason: reason,
      lastModifiedBy: adminId,
    });
    if (blocked?.entityType === 'community') {
      await suspendCommunityProfileForHostPage(blocked);
    }
    return blocked;
  },

  async unblockPage(pageId: string, adminId: string): Promise<HostPage | null> {
    const page = await this.getById(pageId);
    if (!page) return null;

    const restoredStatus =
      page.verificationStatus === 'pending' ? 'pending_verification' : 'published';

    const restored = await this.update(pageId, {
      status: restoredStatus,
      blockedAt: undefined,
      blockedBy: undefined,
      blockReason: undefined,
      lastModifiedBy: adminId,
    });
    if (restored?.entityType === 'community') {
      await restoreCommunityProfileForHostPage(restored);
    }
    return restored;
  },
};