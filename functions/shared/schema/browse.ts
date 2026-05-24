export interface CategoryFilter {
  label: string;
  icon: string;
  color: string;
  count?: number;
}

export interface BrowseItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  priceLabel?: string;
  badge?: string;
  isPromoted?: boolean;
  meta?: string;
  [key: string]: unknown;
}

export interface PreviewItem {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  route?: string;
}
