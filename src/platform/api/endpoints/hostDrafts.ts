import type { ApiRequestFn } from '../client';

export interface EventDraft {
  id: string;
  title: string;
  category?: string;
  city?: string;
  startDate?: string;
  status: 'draft';
  updatedAt: string;
  createdAt: string;
}

export interface EventDraftInput {
  title: string;
  category?: string;
  city?: string;
  startDate?: string;
  description?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export function createHostDraftsNamespace(request: ApiRequestFn) {
  return {
    /** List user's event drafts */
    list: () =>
      request<{ drafts: EventDraft[] }>('GET', 'api/events/drafts'),

    /** Save an event draft */
    save: (data: EventDraftInput) =>
      request<{ draft: EventDraft }>('POST', 'api/events/drafts', data),
  };
}
