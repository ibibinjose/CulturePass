import type { TicketStatus } from './common';

export interface TicketHistoryEntry {
  at: string;
  status: TicketStatus | string;
  note?: string;
}

export interface TicketAuditEntry {
  at: string;
  by: string;
  action: string;
}

export interface Ticket {
  id: string;
  cpTicketId?: string;
  ticketCode?: string;
  eventId: string;
  bookingId?: string;
  userId: string; // Purchaser / main account holder
  /** For family tickets: the specific family member this ticket is for */
  familyMemberId?: string;
  /** If the family member has their own CulturePass account */
  attendeeUserId?: string;
  tierName?: string;
  quantity?: number;
  seatNumber?: string;
  section?: string;
  row?: string;
  totalPriceCents?: number;
  currency?: string;
  status: 'reserved' | 'confirmed' | 'cancelled' | 'used' | 'expired';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  qrCode?: string;
  qrSecret?: string;
  qrExpiresAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  cashbackCents?: number;
  rewardPointsEarned?: number;
  rewardPointsAwardedAt?: string;
  promoCode?: string | null;

  // Points redemption (CulturePass wallet)
  pointsRedeemed?: number;
  pointsDiscountCents?: number;
  pointsRedeemedDeductedAt?: string;

  refundStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmountCents?: number;
  refundedAt?: string;
  eventTitle?: string;
  eventName?: string;
  date?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  eventImageUrl?: string;
  imageColor?: string;
  culturePassId?: string;
  scannedAt?: string;
  eventSnapshot?: {
    title: string;
    venue: string;
    startAt: string;
  };
  source?: string;
  campaign?: string;
  history: {
    action: string;
    at: string;
    by?: string;
    note?: string;
  }[];
  staffAuditTrail?: TicketAuditEntry[];
  createdAt: string;
  updatedAt?: string;
}
