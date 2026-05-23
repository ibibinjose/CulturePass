import { ApiError, parseJson } from '../client';

export interface ImageUploadResponse {
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

type MultipartRequest = (
  method: 'POST' | 'PUT',
  path: string,
  formData: FormData,
  options?: Omit<RequestInit, 'body' | 'method'>,
  isRetry?: boolean,
) => Promise<Response>;

export function createUploadsNamespace(apiRequestMultipart: MultipartRequest) {
  return {
    image: async (formData: FormData): Promise<ImageUploadResponse> => {
      try {
        const res = await apiRequestMultipart('POST', 'api/uploads/image', formData);
        return parseJson<ImageUploadResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (err instanceof Error) {
          const match = err.message.match(/^(\d{3}):\s*(.*)/s);
          if (match) throw new ApiError(parseInt(match[1], 10), match[2]);
        }
        throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
      }
    },
  };
}
