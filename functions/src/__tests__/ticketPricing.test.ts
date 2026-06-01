import {
  resolveTicketOrderPricing,
  resolveTicketOrderPricingWithPromo,
  TicketPricingError,
  PromoCodeError,
} from '../services/ticketPricing';
import { db } from '../admin';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

jest.mock('firebase-admin', () => {
  return {
    apps: [{ options: { projectId: 'test-project' } }],
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
      collection: jest.fn(),
    })),
  };
});

jest.mock('../admin', () => ({
  db: {
    collection: jest.fn(),
  },
  isFirestoreConfigured: true,
}));

describe('Ticket Pricing & Promo Code Service', () => {
  const mockFreeEvent = {
    id: 'free-event-id',
    title: 'Free Gathering',
    isFree: true,
    priceCents: 0,
    maxTicketsPerOrder: 5,
  } as any;

  const mockPaidEvent = {
    id: 'paid-event-id',
    title: 'Paid Concert',
    priceCents: 2000,
    maxTicketsPerOrder: 10,
    tiers: [
      { name: 'VIP', priceCents: 5000 },
      { name: 'General', priceCents: 2000 },
    ],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveTicketOrderPricing', () => {
    it('returns correct pricing for free events', () => {
      const result = resolveTicketOrderPricing(mockFreeEvent, { quantity: 3, tierName: 'General' });
      expect(result).toEqual({
        quantity: 3,
        tierName: 'General',
        unitPriceCents: 0,
        totalPriceCents: 0,
      });
    });

    it('returns correct pricing for basic paid events without tiers matching', () => {
      const basicPaid = { ...mockPaidEvent, tiers: [] };
      const result = resolveTicketOrderPricing(basicPaid, { quantity: 2 });
      expect(result).toEqual({
        quantity: 2,
        tierName: 'General',
        unitPriceCents: 2000,
        totalPriceCents: 4000,
      });
    });

    it('returns correct pricing for tiered paid events', () => {
      const result = resolveTicketOrderPricing(mockPaidEvent, { quantity: 2, tierName: 'VIP' });
      expect(result).toEqual({
        quantity: 2,
        tierName: 'VIP',
        unitPriceCents: 5000,
        totalPriceCents: 10000,
      });
    });

    it('throws error for invalid quantities', () => {
      expect(() => {
        resolveTicketOrderPricing(mockPaidEvent, { quantity: -1 });
      }).toThrow(TicketPricingError);

      expect(() => {
        resolveTicketOrderPricing(mockPaidEvent, { quantity: 1.5 });
      }).toThrow(TicketPricingError);
    });

    it('throws error when order limit is exceeded', () => {
      expect(() => {
        resolveTicketOrderPricing(mockPaidEvent, { quantity: 15 });
      }).toThrow(TicketPricingError);
    });
  });

  describe('resolveTicketOrderPricingWithPromo', () => {
    it('returns base pricing when promo code is empty', async () => {
      const result = await resolveTicketOrderPricingWithPromo(mockPaidEvent, { quantity: 2, tierName: 'General' });
      expect(result.totalPriceCents).toBe(4000);
      expect(result.promoCode).toBeUndefined();
    });

    it('applies a percent discount promo code successfully', async () => {
      const mockPromoData = {
        active: true,
        discountType: 'percent',
        discountValue: 20, // 20%
        eventId: 'paid-event-id',
        maxRedemptions: 100,
        redeemedCount: 5,
      };

      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: true,
        data: () => mockPromoData,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      const result = await resolveTicketOrderPricingWithPromo(mockPaidEvent, {
        quantity: 2,
        tierName: 'General',
        promoCode: 'SAVE20',
      });

      expect(result.totalPriceCents).toBe(3200); // 4000 - 20%
      expect(result.discountCents).toBe(800);
      expect(result.promoCode).toBe('SAVE20');
    });

    it('applies a fixed discount promo code successfully', async () => {
      const mockPromoData = {
        active: true,
        discountType: 'fixed',
        discountValue: 1000, // $10 off
        eventId: 'paid-event-id',
      };

      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: true,
        data: () => mockPromoData,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      const result = await resolveTicketOrderPricingWithPromo(mockPaidEvent, {
        quantity: 2,
        tierName: 'General',
        promoCode: 'SAVE10',
      });

      expect(result.totalPriceCents).toBe(3000); // 4000 - 1000
      expect(result.discountCents).toBe(1000);
      expect(result.promoCode).toBe('SAVE10');
    });

    it('throws error for non-existent promo codes', async () => {
      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: false,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      await expect(
        resolveTicketOrderPricingWithPromo(mockPaidEvent, {
          quantity: 1,
          promoCode: 'FAKEPROMO',
        })
      ).rejects.toThrow(PromoCodeError);
    });

    it('throws error for inactive promo codes', async () => {
      const mockPromoData = {
        active: false,
        discountType: 'percent',
        discountValue: 50,
      };

      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: true,
        data: () => mockPromoData,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      await expect(
        resolveTicketOrderPricingWithPromo(mockPaidEvent, {
          quantity: 1,
          promoCode: 'OFF50',
        })
      ).rejects.toThrow(PromoCodeError);
    });

    it('throws error when promo code is restricted to another event', async () => {
      const mockPromoData = {
        active: true,
        discountType: 'percent',
        discountValue: 50,
        eventId: 'different-event-id',
      };

      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: true,
        data: () => mockPromoData,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      await expect(
        resolveTicketOrderPricingWithPromo(mockPaidEvent, {
          quantity: 1,
          promoCode: 'OFF50',
        })
      ).rejects.toThrow(PromoCodeError);
    });

    it('throws error when max redemptions limit is reached', async () => {
      const mockPromoData = {
        active: true,
        discountType: 'percent',
        discountValue: 50,
        maxRedemptions: 10,
        redeemedCount: 10,
      };

      const mockGet = (jest.fn() as any).mockResolvedValue({
        exists: true,
        data: () => mockPromoData,
      });

      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });

      (db.collection as jest.Mock).mockReturnValue({
        doc: mockDoc,
      });

      await expect(
        resolveTicketOrderPricingWithPromo(mockPaidEvent, {
          quantity: 1,
          promoCode: 'OFF50',
        })
      ).rejects.toThrow(PromoCodeError);
    });
  });
});
