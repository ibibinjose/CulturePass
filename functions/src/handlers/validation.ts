import { z } from 'zod';

const ContentStatusSchema = z.enum(['active', 'draft', 'archived', 'suspended']);

export const ShopDealSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  discount: z.string(),
  description: z.string().optional(),
  validTill: z.string(),
  code: z.string().optional(),
  isActive: z.boolean(),
});

export const ShopOpeningHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

export const ShopInputSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  address: z.string(),
  location: z.string().optional(),
  city: z.string(),
  country: z.string(),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  isOpen: z.boolean(),
  isPromoted: z.boolean(),
  deliveryAvailable: z.boolean(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: ShopOpeningHoursSchema.optional(),
  deals: z.array(ShopDealSchema).optional(),
  ownerId: z.string().optional(),
  culturePassId: z.string().optional(),
  status: ContentStatusSchema.optional(),
});
