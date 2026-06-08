import type { HostPage, HostPageDraft, HostPageFormData } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import type { ApiRequestFn } from '../client';

export interface HostPagePublishResponse {
  success: boolean;
  pageId: string;
  status: string;
  verificationRequired: boolean;
  estimatedReviewTime?: string;
}

export interface HostPageDraftSaveResponse {
  success: boolean;
  draftId: string;
  savedAt: string;
  draft: HostPageDraft;
}

export function createHostPagesNamespace(request: ApiRequestFn) {
  return {
    my: async (params?: { entityType?: HostEntityType }) => {
      const qs = new URLSearchParams();
      if (params?.entityType) qs.set('entityType', params.entityType);
      const q = qs.toString();
      const res = await request<{ pages: HostPage[] }>(
        'GET',
        `api/host-pages/my${q ? `?${q}` : ''}`,
      );
      return res.pages ?? [];
    },

    get: (id: string) => request<HostPage>('GET', `api/host-pages/${id}`),

    create: (payload: {
      entityType: HostEntityType;
      formData: HostPageFormData;
      templateId?: string;
    }) => request<HostPage>('POST', 'api/host-pages', payload),

    update: (
      id: string,
      payload: { formData?: Partial<HostPageFormData>; templateId?: string },
    ) => request<HostPage>('PUT', `api/host-pages/${id}`, payload),

    publish: (id: string) =>
      request<HostPagePublishResponse>('POST', `api/host-pages/${id}/publish`),

    saveDraft: (payload: {
      pageId?: string;
      entityType: HostEntityType;
      formData: HostPageFormData;
      currentStep: number;
      completedSteps: number[];
      templateId?: string;
      draftId?: string;
    }) => request<HostPageDraftSaveResponse>('POST', 'api/host-pages/drafts', payload),

    getDrafts: async (params?: { entityType?: HostEntityType }) => {
      const qs = new URLSearchParams();
      if (params?.entityType) qs.set('entityType', params.entityType);
      const q = qs.toString();
      const res = await request<{ drafts: HostPageDraft[] }>(
        'GET',
        `api/host-pages/drafts${q ? `?${q}` : ''}`,
      );
      return res.drafts ?? [];
    },

    getDraft: (draftId: string) =>
      request<HostPageDraft>('GET', `api/host-pages/drafts/${draftId}`),

    deleteDraft: (draftId: string) =>
      request<{ success: boolean }>('DELETE', `api/host-pages/drafts/${draftId}`),
  };
}