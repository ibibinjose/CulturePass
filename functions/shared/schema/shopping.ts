import { ContentStatus } from './common';

export interface ShopDeal {
  id: string;
  title: string;
  discount: string;
  description?: string;
  validTill: string;
  code?: string;
  isActive: boolean;
}

export interface ShopOpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface ShopData {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  address: string;
  location?: string;
  city: string;
  country: string;
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  isPromoted: boolean;
  deliveryAvailable: boolean;
  phone?: string;
  website?: string;
  openingHours?: ShopOpeningHours;
  deals: ShopDeal[];
  ownerId?: string;
  culturePassId?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export type ShopInput = Omit<ShopData, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: ContentStatus;
  deals?: ShopDeal[];
};
