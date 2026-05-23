/**
 * Shared types for all Firestore services.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
