import type { ApiRequestFn } from '../client';

export interface DeepLinkResolution {
  status: 'resolved' | 'not_found' | 'auth_required';
  route?: string;
  fallbackRoute?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
}

export interface OGMetaResponse {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

export function createDeepLinksNamespace(request: ApiRequestFn) {
  return {
    /** Resolve a deep link with fallback */
    resolve: (prefix: string, id: string) =>
      request<DeepLinkResolution>(
        'GET',
        `api/deep-links/resolve/${encodeURIComponent(prefix)}/${encodeURIComponent(id)}`,
      ),

    /** OG meta for short links (used for link previews) */
    og: (prefix: string, id: string) =>
      request<OGMetaResponse>(
        'GET',
        `api/deep-links/og/${encodeURIComponent(prefix)}/${encodeURIComponent(id)}`,
      ),
  };
}
