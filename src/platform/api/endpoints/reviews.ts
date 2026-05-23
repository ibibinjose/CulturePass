import type { ApiRequestFn } from '../client';
import type { Review } from '@/shared/schema/review';

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
}

export function createReviewsNamespace(request: ApiRequestFn) {
  return {
    createForEvent: (
      eventId: string,
      data: { rating: number; comment?: string; ticketId: string },
    ) => request<{ id: string; status: Review['status'] }>('POST', `api/events/${eventId}/reviews`, data),

    forEvent: (eventId: string, page = 1) =>
      request<ReviewsResponse>('GET', `api/events/${eventId}/reviews?page=${page}`),

    forProfile: (profileId: string, page = 1) =>
      request<ReviewsResponse>('GET', `api/profiles/${profileId}/reviews?page=${page}`),

    markHelpful: (reviewId: string) =>
      request<{ helpfulCount: number }>('POST', `api/reviews/${reviewId}/helpful`),

    moderate: (reviewId: string, action: 'approved' | 'rejected') =>
      request<{ ok: boolean; status: Review['status'] }>('POST', `api/admin/reviews/${reviewId}/moderate`, { action }),
  };
}
