import { apiRequest } from '@/lib/query-client';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound() {
    return this.status === 404;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isRateLimited() {
    return this.status === 429;
  }
  get isServerError() {
    return this.status >= 500;
  }
  get isNetworkError() {
    return this.status === 0;
  }
}

export async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, `Non-JSON response: ${text.slice(0, 200)}`);
  }
}

export type ApiRequestFn = <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  route: string,
  data?: unknown,
) => Promise<T>;

export const request: ApiRequestFn = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  route: string,
  data?: unknown,
) => {
  try {
    const res = await apiRequest(method, route, data);
    return parseJson<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error) {
      const match = err.message.match(/^(\d{3}):\s*(.*)/s);
      if (match) throw new ApiError(parseInt(match[1], 10), match[2]);
    }
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }
};
