import type { HostApplication } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export function createHostApplicationNamespace(request: ApiRequestFn) {
  return {
    submit: (data: {
      hostType: string;
      fullName: string;
      businessName?: string;
      description: string;
      city?: string;
      country?: string;
      websiteUrl?: string;
      instagramHandle?: string;
      motivation?: string;
    }) =>
      request<HostApplication>('POST', 'api/host-applications', data as Record<string, unknown>),

    myApplication: () =>
      request<{ application: HostApplication | null }>('GET', 'api/host-applications/me'),

    list: (status?: string) =>
      request<{ applications: HostApplication[] }>(
        'GET',
        `api/host-applications${status ? `?status=${status}` : ''}`,
      ),

    approve: (id: string, reviewNote?: string) =>
      request<HostApplication>('PUT', `api/host-applications/${id}/approve`, { reviewNote }),

    reject: (id: string, reviewNote?: string) =>
      request<{ success: boolean }>('PUT', `api/host-applications/${id}/reject`, { reviewNote }),
  };
}
