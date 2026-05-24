// @tag:restaurant
import { ContentStatus } from './common';

export interface RestaurantDeal {
  id: string;
  title: string;
  discount: string;
  description?: string;
  validTill: string;
  isActive: boolean;
}

export interface RestaurantOpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  description: string;
  imageUrl: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  isPromoted: boolean;
  phone?: string;
  website?: string;
  hours?: string;
  openingHours?: RestaurantOpeningHours;
  deals: RestaurantDeal[];
  features?: string[];
  menuHighlights?: string[];
  reservationAvailable?: boolean;
  deliveryAvailable?: boolean;
  ownerId?: string;
  culturePassId?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RestaurantInput = Omit<RestaurantData, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: ContentStatus;
  deals?: RestaurantDeal[];
};
