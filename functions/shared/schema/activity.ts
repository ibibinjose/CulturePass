export interface ActivityData {
  id: string;
  name: string;
  description: string;
  category: string;
  duration?: string;
  ageGroup?: string;
  city: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  location?: string;
  imageUrl?: string;
  priceLabel?: string;
  rating?: number;
  reviewsCount?: number;
  highlights?: string[];
  ownerId: string;
  ownerType?: 'business' | 'venue' | 'organizer';
  businessProfileId?: string;
  status?: 'draft' | 'published' | 'archived';
  isPromoted?: boolean;
  isPopular?: boolean;
  culturePassId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityInput = Omit<ActivityData, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
