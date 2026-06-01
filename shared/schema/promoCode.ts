export interface PromoCode {
  code: string; // Document ID, e.g., 'DISCOUNT50'
  active: boolean;
  eventId?: string; // Optional: restrict to specific event
  discountType: 'fixed' | 'percent';
  discountValue: number; // Value in cents for fixed, or percentage points (e.g., 20 for 20%)
  maxRedemptions?: number; // Optional limit
  redeemedCount: number; // Current number of redemptions
  createdAt: string;
  updatedAt?: string;
}
