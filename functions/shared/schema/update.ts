export type UpdateCategory =
  | 'feature'
  | 'announcement'
  | 'maintenance'
  | 'community'
  | 'release'
  | 'fix';

export interface AppUpdate {
  id: string;
  title: string;
  body: string;
  category: UpdateCategory;
  /** Optional app version label (e.g. OTA or store build). */
  version?: string;
  /** Optional byline author when not inferred from system. */
  authorName?: string;
  imageUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
